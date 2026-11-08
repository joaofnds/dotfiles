#!/usr/bin/env bun
// Waits for a change in watched T3 threads, prints it, and exits. Writes only its state file.

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";

import { flat, refuse, refuseForeignDirectory } from "./shared.js";

const ALL_MESSAGES = "1000000";
const OPENING_CHARACTERS = 160;
const USAGE = "usage: watch.js --state <absolute path> [--check-every <seconds>] [--lookup-timeout <seconds>] <thread-id>...";
const WAKE_AFTER_MS = 3_600_000;

function parseSnapshot(stdout) {
  const { thread, messages } = JSON.parse(stdout);
  const wellFormed =
    typeof thread.status === "string" &&
    typeof thread.pendingRequestCount === "number" &&
    typeof thread.runCount === "number" &&
    messages.every((message) => typeof message.role === "string");
  if (!wellFormed) throw new TypeError("unexpected answer shape");

  return {
    failure: null,
    title: flat(thread.title),
    status: thread.status,
    pending: thread.pendingRequestCount,
    runs: thread.runCount,
    messages: messages.filter((message) => message.role === "user").map((message) => flat(message.text)),
  };
}

async function noAnswerAfter(milliseconds, lookup) {
  await Bun.sleep(milliseconds);
  if (lookup.exitCode === null) lookup.kill("SIGKILL");
  throw new Error(`no answer in ${milliseconds} ms`);
}

async function observe(threadId, lookupTimeout) {
  const t3 = join(homedir(), ".t3/bin/t3");

  try {
    const lookup = Bun.spawn([t3, "thread", "show", threadId, "--json", "--messages", ALL_MESSAGES], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const answer = Promise.all([lookup.stdout.text(), lookup.stderr.text(), lookup.exited]);
    const [stdout, stderr, exitCode] = await Promise.race([answer, noAnswerAfter(lookupTimeout, lookup)]);
    if (exitCode !== 0) return { failure: flat(`exit ${exitCode} ${stderr}`) };

    return parseSnapshot(stdout);
  } catch (error) {
    return { failure: `${error.name}: ${error.message}` };
  }
}

function standing(session) {
  if (session.failure) return `t3 thread show failed: ${session.failure}`;

  return `status ${session.status}, pending requests ${session.pending}`;
}

function changes(before, after) {
  if (!before) return [standing(after)];

  if (after.failure) return before.failure ? [] : [standing(after)];

  const found = before.failure ? ["lookup recovered"] : [];
  if (before.seen === null) return [...found, standing(after)];

  if (after.pending !== before.pending) found.push(`pending requests ${before.pending} -> ${after.pending}`);
  for (const text of after.messages.slice(before.seen)) {
    found.push(`message delivered: ${[...text].slice(0, OPENING_CHARACTERS).join("")}`);
  }

  return found;
}

function remembered(session) {
  const { messages, ...kept } = session;
  if (!session.failure) kept.seen = messages.length;

  return kept;
}

function report(title, change) {
  console.log(`${new Date().toTimeString().slice(0, 5)} ${title}: ${change}`);
}

async function poll(threadIds, sessions, lookupTimeout) {
  let changed = false;
  for (const threadId of threadIds) {
    const before = sessions[threadId];
    const blank = { title: threadId, status: null, pending: null, runs: null, ran: false, seen: null, messages: [] };
    const after = { ...blank, ...before, ...(await observe(threadId, lookupTimeout)) };
    if (after.status === "running" || (typeof before?.runs === "number" && after.runs !== before.runs)) after.ran = true;

    for (const change of changes(before, after)) {
      report(after.title, change);
      changed = true;
    }

    sessions[threadId] = remembered(after);
  }

  return changed;
}

function save(path, state) {
  const temporary = `${path}.tmp`;

  writeFileSync(temporary, JSON.stringify(state));
  renameSync(temporary, path);
}

function parseOptions() {
  try {
    return parseArgs({
      options: {
        state: { type: "string" },
        "check-every": { type: "string", default: "180" },
        "lookup-timeout": { type: "string", default: "120" },
      },
      allowPositionals: true,
    });
  } catch {
    refuse(USAGE);
  }
}

function millisecondsFrom(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) refuse(USAGE);

  return seconds * 1000;
}

refuseForeignDirectory();

const { values, positionals: threadIds } = parseOptions();
if (!values.state || !isAbsolute(values.state) || threadIds.length === 0) refuse(USAGE);

const checkEvery = millisecondsFrom(values["check-every"]);
const lookupTimeout = millisecondsFrom(values["lookup-timeout"]);

const state = existsSync(values.state)
  ? JSON.parse(readFileSync(values.state, "utf8"))
  : { wokeAt: Date.now(), sessions: {} };

while (true) {
  const changed = await poll(threadIds, state.sessions, lookupTimeout);
  const due = Date.now() - state.wokeAt >= WAKE_AFTER_MS;

  if (due && !changed) {
    for (const threadId of threadIds) {
      const session = state.sessions[threadId];
      report(session.title, `hourly, ${standing(session)}, ${session.ran ? "ran" : "idle"} since the last hourly line`);
      session.ran = session.status === "running";
    }
    state.wokeAt = Date.now();
  }
  save(values.state, state);

  if (changed || due) process.exit(0);

  await Bun.sleep(checkEvery);
}
