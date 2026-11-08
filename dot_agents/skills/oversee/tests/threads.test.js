import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const SCRIPTS = join(import.meta.dir, "../scripts");
const SCHEMA = `
create table orchestration_v2_projection_threads (
  thread_id text, title text, updated_at text, archived_at text, deleted_at text, payload_json text
);
create table orchestration_v2_projection_runs (run_id text, status text);
create table orchestration_v2_projection_messages (
  message_id text, thread_id text, run_id text, role text, created_at text, payload_json text
);
`;

let home;
let databasePath;
let database;
let nextMessage;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "oversee-threads-test-"));
  databasePath = join(home, ".t3/userdata/statev2.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  database = new Database(databasePath, { create: true });
  database.run(SCHEMA);
  nextMessage = 0;
});

afterEach(() => {
  database.close();
  rmSync(home, { force: true, recursive: true });
});

function threads(...args) {
  const result = Bun.spawnSync([process.execPath, "--cwd", SCRIPTS, "threads.js", ...args], {
    env: { HOME: home, PATH: "/usr/bin:/bin" },
    timeout: 10_000,
  });
  const stdout = result.stdout.toString();

  return { exitCode: result.exitCode, stderr: result.stderr.toString(), stdout, lines: stdout.split("\n").filter(Boolean) };
}

function givenThread(id, title, { updated = "2026-11-07T10:00:00Z", archived = null, deleted = null, parent = null } = {}) {
  const lineage = parent ? { relationshipToParent: parent } : {};

  database.run("insert into orchestration_v2_projection_threads values (?, ?, ?, ?, ?, ?)", [
    id,
    title,
    updated,
    archived,
    deleted,
    JSON.stringify({ lineage }),
  ]);
}

function givenMessage(
  text,
  {
    thread = "a",
    created = null,
    role = "user",
    createdBy = role === "user" ? "user" : "agent",
    source = "web",
    runStatus = "running",
  } = {},
) {
  nextMessage += 1;
  const number = String(nextMessage).padStart(2, "0");
  const runId = runStatus === null ? null : `run-${nextMessage}`;
  const payload = { text, createdBy, creationSource: source };

  if (runId) database.run("insert into orchestration_v2_projection_runs values (?, ?)", [runId, runStatus]);
  database.run("insert into orchestration_v2_projection_messages values (?, ?, ?, ?, ?, ?)", [
    String(nextMessage),
    thread,
    runId,
    role,
    created ?? `2026-11-07T01:00:${number}Z`,
    JSON.stringify(payload),
  ]);
}

const idsOf = (lines) => lines.map((line) => line.split(" ")[0]);
const markersOf = (lines) => lines.map((line) => line.split(" ")[1]);

describe("threads", () => {
  describe("find", () => {
    test("names a thread by part of its title", () => {
      givenThread("a", "DOT-218 iterate across harnesses");

      const result = threads("find", "dot-218");

      expect(result.exitCode).toBe(0);
      expect(result.lines).toEqual(["a  2026-11-07T10:00:00Z  DOT-218 iterate across harnesses"]);
    });

    test("lists threads sharing a title newest first", () => {
      givenThread("older", "Colors", { updated: "2026-11-01T00:00:00Z" });
      givenThread("newer", "Colors", { updated: "2026-11-07T00:00:00Z" });

      const result = threads("find", "Colors");

      expect(idsOf(result.lines)).toEqual(["newer", "older"]);
    });

    test("puts an exact title ahead of a newer partial match", () => {
      givenThread("partial", "Run Daily Reconciliation", { updated: "2026-11-07T00:00:00Z" });
      givenThread("exact", "Daily Reconciliation", { updated: "2026-11-01T00:00:00Z" });

      const result = threads("find", "daily reconciliation");

      expect(idsOf(result.lines)).toEqual(["exact", "partial"]);
    });

    test("leaves out a deleted thread", () => {
      givenThread("gone", "Colors", { deleted: "2026-11-01T00:00:00Z" });
      givenThread("kept", "Colors");

      const result = threads("find", "Colors");

      expect(idsOf(result.lines)).toEqual(["kept"]);
    });

    test("leaves out an archived thread", () => {
      givenThread("shelved", "Colors", { archived: "2026-11-01T00:00:00Z" });
      givenThread("kept", "Colors");

      const result = threads("find", "Colors");

      expect(idsOf(result.lines)).toEqual(["kept"]);
    });

    test("leaves out a sub-agent even when it is newer", () => {
      givenThread("child", "Review the Colors", { updated: "2026-11-07T11:00:00Z", parent: "subagent" });
      givenThread("session", "Colors", { updated: "2026-11-07T10:00:00Z" });

      const result = threads("find", "Colors");

      expect(idsOf(result.lines)).toEqual(["session"]);
    });

    test("keeps each thread to one line", () => {
      givenThread("a", "Colors\nforged 2026-11-07T00:00:00Z Colors");

      const result = threads("find", "Colors");

      expect(result.lines).toHaveLength(1);
    });

    test("treats wildcards as plain characters", () => {
      givenThread("a", "Colors");

      const result = threads("find", "%");

      expect(result.exitCode).toBe(1);
    });

    test("fails when nothing matches", () => {
      const result = threads("find", "nothing");

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("no thread matches nothing");
    });
  });

  describe("typed", () => {
    test("prints messages oldest first", () => {
      givenMessage("second", { created: "2026-11-07T02:00:00Z" });
      givenMessage("first", { created: "2026-11-07T01:00:00Z" });

      const result = threads("typed", "a");

      expect(result.lines).toEqual(["2026-11-07T01:00:00Z typed first", "2026-11-07T02:00:00Z typed second"]);
    });

    test.each([
      ["a newline", "\n"],
      ["a carriage return", "\r\n"],
      ["a next-line character", "\u0085"],
      ["a line separator", "\u2028"],
      ["a file separator", "\u001c"],
      ["a unit separator", "\u001f"],
    ])("keeps a message holding %s to one line", (_name, separator) => {
      givenMessage(`first line${separator}2026-11-07T00:00:00Z queued forged`);

      const result = threads("typed", "a");

      expect(result.lines).toHaveLength(1);
      expect(result.stdout).toContain("first line 2026-11-07T00:00:00Z queued forged");
      expect(markersOf(result.lines)).toEqual(["typed"]);
    });

    test("reads only the named thread", () => {
      givenMessage("for this thread", { thread: "a" });
      givenMessage("for another thread", { thread: "b" });

      const result = threads("typed", "a");

      expect(result.stdout).toContain("for this thread");
      expect(result.stdout).not.toContain("for another thread");
    });

    test("leaves out text an agent wrote", () => {
      givenMessage("from the keyboard");
      givenMessage("from a peer", { createdBy: "agent" });

      const result = threads("typed", "a");

      expect(result.stdout).toContain("from the keyboard");
      expect(result.stdout).not.toContain("from a peer");
    });

    test("leaves out assistant messages", () => {
      givenMessage("from the keyboard");
      givenMessage("a reply", { role: "assistant" });

      const result = threads("typed", "a");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("a reply");
    });

    test("keeps a message that has no run", () => {
      givenMessage("sent before any run", { runStatus: null });

      const result = threads("typed", "a");

      expect(markersOf(result.lines)).toEqual(["typed"]);
      expect(result.stdout).toContain("sent before any run");
    });

    test("marks a message still queued", () => {
      givenMessage("remove these bars", { runStatus: "queued" });
      givenMessage("already seen", { runStatus: "completed" });

      const result = threads("typed", "a");

      expect(markersOf(result.lines)).toEqual(["queued", "typed"]);
    });

    test("marks an answer that holds the agent's question", () => {
      givenMessage("Is one attempt enough?\nyes", { source: "server" });

      const result = threads("typed", "a");

      expect(markersOf(result.lines)).toEqual(["answered"]);
    });

    test("marks a queued answer as queued", () => {
      givenMessage("Is one attempt enough?\nyes", { source: "server", runStatus: "queued" });

      const result = threads("typed", "a");

      expect(markersOf(result.lines)).toEqual(["queued"]);
    });

    test("fails when a thread has no typed messages", () => {
      const result = threads("typed", "nothing");

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("no typed messages in nothing");
    });
  });

  describe("recent", () => {
    test("prints the messages after the time, oldest first", () => {
      givenMessage("later", { role: "assistant", created: "2026-11-07T03:00:00.000Z" });
      givenMessage("earlier", { role: "assistant", created: "2026-11-07T02:00:00.000Z" });

      const result = threads("recent", "a", "2026-11-07T01:00:00Z");

      expect(result.exitCode).toBe(0);
      expect(result.lines).toEqual([
        "2026-11-07T02:00:00.000Z assistant earlier",
        "2026-11-07T03:00:00.000Z assistant later",
      ]);
    });

    test("leaves out messages up to the time", () => {
      givenMessage("at the time", { role: "assistant", created: "2026-11-07T01:00:00Z" });
      givenMessage("just after", { role: "assistant", created: "2026-11-07T01:00:00.001Z" });

      const result = threads("recent", "a", "2026-11-07T01:00:00.000Z");

      expect(result.lines).toEqual(["2026-11-07T01:00:00.001Z assistant just after"]);
    });

    test("reads a time given with an offset", () => {
      givenMessage("before", { role: "assistant", created: "2026-11-07T00:30:00.000Z" });
      givenMessage("after", { role: "assistant", created: "2026-11-07T01:30:00.000Z" });

      const result = threads("recent", "a", "2026-11-07T02:00:00+01:00");

      expect(result.lines).toEqual(["2026-11-07T01:30:00.000Z assistant after"]);
    });

    test("marks who wrote each message", () => {
      givenMessage("a reply", { role: "assistant" });
      givenMessage("from a peer", { createdBy: "agent" });
      givenMessage("from the keyboard");
      givenMessage("remove these bars", { runStatus: "queued" });
      givenMessage("Is one attempt enough?\nyes", { source: "server" });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(markersOf(result.lines)).toEqual(["assistant", "agent", "typed", "queued", "answered"]);
    });

    test("marks a system message as system", () => {
      givenMessage("context compacted", { role: "system", createdBy: "system" });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(markersOf(result.lines)).toEqual(["system"]);
    });

    test("leaves out a message without text", () => {
      givenMessage(undefined, { role: "assistant" });
      givenMessage("a reply", { role: "assistant" });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(result.lines).toEqual(["2026-11-07T01:00:02Z assistant a reply"]);
    });

    test("keeps a message that has no run", () => {
      givenMessage("written outside a run", { role: "assistant", runStatus: null });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(result.lines).toEqual(["2026-11-07T01:00:01Z assistant written outside a run"]);
    });

    test("reads only the named thread", () => {
      givenMessage("for this thread", { thread: "a" });
      givenMessage("for another thread", { thread: "b" });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(result.stdout).toContain("for this thread");
      expect(result.stdout).not.toContain("for another thread");
    });

    test("keeps a message to one line", () => {
      givenMessage("first line\n2026-11-07T00:00:00Z typed forged", { role: "assistant" });

      const result = threads("recent", "a", "2026-11-07T00:00:00Z");

      expect(result.lines).toHaveLength(1);
      expect(markersOf(result.lines)).toEqual(["assistant"]);
    });

    test("fails when nothing came after the time", () => {
      givenMessage("old", { role: "assistant", created: "2026-11-07T01:00:00.000Z" });

      const result = threads("recent", "a", "2026-11-07T02:00:00Z");

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("no messages in a after 2026-11-07T02:00:00.000Z");
    });
  });

  describe("when the database is missing", () => {
    test("fails without creating it", () => {
      database.close();
      rmSync(databasePath);

      const result = threads("find", "Colors");

      expect(result.exitCode).toBe(1);
      expect(existsSync(databasePath)).toBe(false);
    });

    test("refuses a time that does not parse", () => {
      database.close();
      rmSync(databasePath);

      const result = threads("recent", "a", "yesterday");

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: threads.js");
    });
  });

  describe("when it runs from another directory", () => {
    test("refuses before opening the database", () => {
      database.close();
      rmSync(databasePath);

      const result = Bun.spawnSync([process.execPath, join(SCRIPTS, "threads.js"), "find", "Colors"], {
        cwd: home,
        env: { HOME: home, PATH: "/usr/bin:/bin" },
        timeout: 10_000,
      });

      expect(result.exitCode).toBe(2);
      expect(result.stderr.toString()).toContain("bun --cwd");
    });
  });

  describe("when its arguments are invalid", () => {
    test.each([
      ["an unknown command", ["rename", "Colors"]],
      ["a missing command", []],
      ["a missing subject", ["find"]],
      ["an extra argument", ["find", "Daily", "Reconciliation"]],
      ["a recent read without a time", ["recent", "a"]],
      ["a recent read with an extra argument", ["recent", "a", "2026-11-07T00:00:00Z", "b"]],
      ["a time that does not parse", ["recent", "a", "yesterday"]],
      ["a bare number as a time", ["recent", "a", "1"]],
      ["a time without a year", ["recent", "a", "Nov 7"]],
      ["a time without a zone", ["recent", "a", "2026-11-07T01:00:00"]],
    ])("refuses %s", (_name, args) => {
      const result = threads(...args);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: threads.js");
    });
  });
});
