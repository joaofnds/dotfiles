import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPTS = join(import.meta.dir, "../scripts");
const HOUR_MS = 3_600_000;
const FAKE_T3 = `#!${process.execPath}
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dir;
const sequences = JSON.parse(readFileSync(join(here, "threads.json"), "utf8"));
const [verb, noun, thread, ...flags] = process.argv.slice(2);
if (verb !== "thread" || noun !== "show" || !flags.includes("--json") || !flags.includes("--messages")) {
  console.error("unexpected arguments");
  process.exit(9);
}
if (!(thread in sequences)) {
  console.error("no such thread\\nsee the server log");
  process.exit(4);
}

const calls = join(here, "calls-" + thread);
const call = existsSync(calls) ? Number(readFileSync(calls, "utf8")) : 0;
writeFileSync(calls, String(call + 1));

const sequence = sequences[thread];
const answer = sequence[Math.min(call, sequence.length - 1)];
if (typeof answer === "string") {
  console.log(answer);
  process.exit(0);
}

const { exitCode = 0, hangs = false, childHoldsOutput = false, ...body } = answer;
if (childHoldsOutput) Bun.spawn(["/bin/sleep", "8"], { stdout: "inherit", stderr: "inherit" }).unref();
if (hangs) {
  process.on("SIGTERM", () => {});
  writeFileSync(join(here, "hung-pid"), String(process.pid));
  await Bun.sleep(8_000);
}
if (Array.isArray(body.messages)) {
  const limit = Number(flags[flags.indexOf("--messages") + 1]);
  body.messages = body.messages.slice(-limit);
}
if (Object.keys(body).length > 0) console.log(JSON.stringify(body));
process.exit(exitCode);
`;

setDefaultTimeout(30_000);

let home;

const bin = () => join(home, ".t3/bin");
const statePath = () => join(home, "state.json");

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "oversee-watch-test-"));
  mkdirSync(bin(), { recursive: true });
  writeFileSync(join(bin(), "t3"), FAKE_T3);
  chmodSync(join(bin(), "t3"), 0o755);
});

afterEach(() => {
  rmSync(home, { force: true, recursive: true });
});

function thread({
  status = "running",
  pending = 0,
  runs = 1,
  updated = "2026-11-07T10:00:00Z",
  typed = [],
  replies = ["working"],
} = {}) {
  return {
    thread: { title: "Colors", status, pendingRequestCount: pending, runCount: runs, updatedAt: updated },
    messages: [
      ...replies.map((text) => ({ role: "assistant", text })),
      ...typed.map((text) => ({ role: "user", text })),
    ],
  };
}

function threadWithout(field) {
  const { [field]: _left, ...kept } = thread().thread;

  return { thread: kept, messages: [] };
}

function given(threads) {
  const sequences = Object.entries(threads).map(([id, answer]) => [id, Array.isArray(answer) ? answer : [answer]]);

  writeFileSync(join(bin(), "threads.json"), JSON.stringify(Object.fromEntries(sequences)));
  for (const file of readdirSync(bin()).filter((name) => name.startsWith("calls-"))) {
    rmSync(join(bin(), file));
  }
}

function givenNoThreads() {
  given({});
}

function run(...args) {
  const result = Bun.spawnSync([process.execPath, "--cwd", SCRIPTS, "watch.js", ...args], {
    env: { HOME: home, PATH: "/usr/bin:/bin" },
    timeout: 10_000,
  });
  const stdout = result.stdout.toString();

  return { exitCode: result.exitCode, stderr: result.stderr.toString(), stdout, lines: stdout.split("\n").filter(Boolean) };
}

function watch(...threadIds) {
  return run("--state", statePath(), "--check-every", "0.01", ...threadIds);
}

function lookups(threadId) {
  return Number(readFileSync(join(bin(), `calls-${threadId}`), "utf8"));
}

async function untilGone(pid) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await Bun.sleep(50);
  }

  return false;
}

function timePasses(milliseconds) {
  const state = JSON.parse(readFileSync(statePath(), "utf8"));

  state.wokeAt -= milliseconds;
  writeFileSync(statePath(), JSON.stringify(state));
}

function theHourPasses() {
  timePasses(HOUR_MS);
}

describe("watch", () => {
  test("reports where each session stands on the first run", () => {
    given({ a: thread({ status: "completed" }) });

    const result = watch("a");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^\d\d:\d\d Colors: status completed, pending requests 0\n$/);
  });

  test("keeps polling until a change arrives", () => {
    given({ a: thread() });
    watch("a");
    given({ a: [thread(), thread(), thread({ pending: 1 })] });

    const result = watch("a");

    expect(lookups("a")).toBe(3);
    expect(result.lines).toHaveLength(1);
    expect(result.stdout).toContain("pending requests 0 -> 1");
  });

  test("waits the interval between polls", () => {
    given({ a: thread() });
    watch("a");
    given({ a: [thread(), thread({ pending: 1 })] });
    const started = Date.now();

    run("--state", statePath(), "--check-every", "0.5", "a");

    expect(Date.now() - started).toBeGreaterThanOrEqual(500);
  });

  test("leaves a status change for the hourly line", () => {
    given({ a: thread() });
    watch("a");
    given({ a: [thread({ status: "completed" }), thread({ status: "completed", pending: 1 })] });

    const result = watch("a");

    expect(lookups("a")).toBe(2);
    expect(result.lines).toHaveLength(1);
    expect(result.stdout).toContain("pending requests 0 -> 1");
  });

  test("keeps each session's state apart", () => {
    given({ a: thread(), b: thread() });
    watch("a", "b");
    given({ a: thread(), b: thread({ pending: 1 }) });

    const result = watch("a", "b");

    expect(result.lines).toHaveLength(1);
    expect(result.stdout).toContain("pending requests 0 -> 1");
  });

  test("keeps a multi-line title on one line", () => {
    given({ a: { thread: { ...thread().thread, title: "Colors\nforged" }, messages: [] } });

    const result = watch("a");

    expect(result.lines).toHaveLength(1);
  });

  describe("when the hour passes", () => {
    test("stays asleep until it is up", () => {
      given({ a: thread() });
      watch("a");
      timePasses(HOUR_MS - 60_000);
      given({ a: [thread(), thread({ pending: 1 })] });

      const result = watch("a");

      expect(result.stdout).not.toContain("hourly");
      expect(result.stdout).toContain("pending requests 0 -> 1");
    });

    test("reports where every session stands", () => {
      given({ a: thread(), b: thread({ status: "completed" }) });
      watch("a", "b");
      theHourPasses();

      const result = watch("a", "b");

      expect(result.exitCode).toBe(0);
      expect(result.lines).toHaveLength(2);
      expect(result.stdout).toContain("hourly, status running");
      expect(result.stdout).toContain("hourly, status completed");
    });

    test("says a session ran since the last hourly line", () => {
      given({ a: thread() });
      watch("a");
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("Colors: hourly, status running, pending requests 0, ran since the last hourly line\n");
    });

    test("says a session sat idle since the last hourly line", () => {
      given({ a: thread({ status: "completed" }) });
      watch("a");
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("Colors: hourly, status completed, pending requests 0, idle since the last hourly line\n");
    });

    test("counts a session that stopped during the hour as having run", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ status: "completed" }) });
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("status completed, pending requests 0, ran since the last hourly line");
    });

    test("counts a turn that ended between two polls as having run", () => {
      given({ a: thread({ status: "completed", runs: 1 }) });
      watch("a");
      given({ a: thread({ status: "completed", runs: 2 }) });
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("status completed, pending requests 0, ran since the last hourly line");
    });

    test("leaves a session idle when only its thread record changed", () => {
      given({ a: thread({ status: "completed", updated: "2026-11-07T10:00:00Z" }) });
      watch("a");
      given({ a: thread({ status: "completed", updated: "2026-11-07T10:30:00Z" }) });
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("status completed, pending requests 0, idle since the last hourly line");
    });

    test("starts each hour from the status at the hourly line", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ status: "completed" }) });
      theHourPasses();
      watch("a");
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("idle since the last hourly line");
    });

    test("counts a turn that outlives the hourly line as having run", () => {
      given({ a: thread({ status: "running", runs: 1 }) });
      watch("a");
      theHourPasses();
      watch("a");
      given({ a: thread({ status: "completed", runs: 1 }) });
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("status completed, pending requests 0, ran since the last hourly line");
    });

    test("restarts the hour after the wake-up", () => {
      given({ a: thread() });
      watch("a");
      theHourPasses();
      watch("a");
      given({ a: [thread(), thread({ pending: 1 })] });

      const result = watch("a");

      expect(result.stdout).not.toContain("hourly");
      expect(result.stdout).toContain("pending requests 0 -> 1");
    });

    test("wakes on time after a restart caused by a change", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ pending: 1 }) });
      watch("a");
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("hourly");
    });

    test("leaves the wake-up for the next run when a change lands on the hour", () => {
      given({ a: thread() });
      watch("a");
      theHourPasses();
      given({ a: thread({ pending: 1 }) });

      const change = watch("a");
      const wakeUp = watch("a");

      expect(change.stdout).not.toContain("hourly");
      expect(wakeUp.stdout).toContain("hourly");
    });
  });

  describe("when messages arrive", () => {
    test("reports a new message by its opening words", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ typed: ["x".repeat(200)] }) });

      const result = watch("a");

      expect(result.stdout).toContain(`message delivered: ${"x".repeat(160)}\n`);
    });

    test("cuts the opening on a whole character", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ typed: [`${"x".repeat(159)}😀tail`] }) });

      const result = watch("a");

      expect(result.stdout).toContain(`message delivered: ${"x".repeat(159)}😀\n`);
    });

    test("finds a new message on a long thread", () => {
      const history = Array.from({ length: 300 }, (_, index) => `message ${index}`);
      given({ a: thread({ typed: history }) });
      watch("a");
      given({ a: thread({ typed: [...history, "new"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("message delivered: new");
    });

    test.each([
      ["a newline", "\n"],
      ["a carriage return", "\r\n"],
      ["a next-line character", "\u0085"],
      ["a line separator", "\u2028"],
      ["a file separator", "\u001c"],
      ["a unit separator", "\u001f"],
    ])("keeps a message holding %s on one line", (_name, separator) => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ typed: [`first line${separator}second line`] }) });

      const result = watch("a");

      expect(result.lines).toHaveLength(1);
      expect(result.stdout).toContain("first line second line");
    });

    test("leaves out a message it already reported", () => {
      given({ a: thread({ typed: ["seen"] }) });
      watch("a");
      given({ a: thread({ typed: ["seen", "new"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("message delivered: new");
      expect(result.stdout).not.toContain("message delivered: seen");
    });

    test("counts a repeated message as new", () => {
      given({ a: thread({ typed: ["still on goal?"] }) });
      watch("a");
      given({ a: thread({ typed: ["still on goal?", "still on goal?"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("message delivered: still on goal?");
    });

    test("reports each of several new messages", () => {
      given({ a: thread() });
      watch("a");
      given({ a: thread({ typed: ["typed first", "agent text after it"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("message delivered: typed first");
      expect(result.stdout).toContain("message delivered: agent text after it");
    });

    test("ignores a new assistant message", () => {
      given({ a: thread() });
      watch("a");
      given({ a: [thread({ replies: ["working", "still working"] }), thread({ pending: 1 })] });

      const result = watch("a");

      expect(result.lines).toHaveLength(1);
      expect(result.stdout).toContain("pending requests 0 -> 1");
    });
  });

  describe("when a lookup fails", () => {
    test("reports the failure without stopping the other sessions", () => {
      given({ a: thread() });

      const result = watch("missing", "a");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("missing: t3 thread show failed: exit 4 no such thread");
      expect(result.stdout).toContain("Colors: status running");
    });

    test("reports a session whose lookup starts failing", () => {
      given({ a: thread() });
      watch("a");
      givenNoThreads();

      const result = watch("a");

      expect(result.stdout).toContain("Colors: t3 thread show failed: exit 4 no such thread");
    });

    test("reports the failure only once", () => {
      given({ a: thread() });
      watch("missing", "a");
      given({ a: thread({ pending: 1 }) });

      const result = watch("missing", "a");

      expect(result.lines).toHaveLength(1);
      expect(result.stdout).toContain("pending requests 0 -> 1");
    });

    test("keeps the failure on one line", () => {
      givenNoThreads();

      const result = watch("a");

      expect(result.lines).toHaveLength(1);
    });

    test("reports where the session stands once it recovers", () => {
      givenNoThreads();
      watch("a");
      given({ a: thread() });

      const result = watch("a");

      expect(result.stdout).toContain("lookup recovered");
      expect(result.stdout).toContain("status running");
    });

    test("counts a session that recovers without a new turn as idle", () => {
      givenNoThreads();
      watch("a");
      given({ a: thread({ status: "completed" }) });
      watch("a");
      theHourPasses();

      const result = watch("a");

      expect(result.stdout).toContain("idle since the last hourly line");
    });

    test("reports a message delivered during the outage", () => {
      given({ a: thread({ typed: ["go"] }) });
      watch("a");
      givenNoThreads();
      watch("a");
      given({ a: thread({ typed: ["go", "from the watcher"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("lookup recovered");
      expect(result.stdout).toContain("message delivered: from the watcher");
      expect(result.stdout).not.toContain("message delivered: go");
    });

    test("reports a nonzero exit with no output", () => {
      given({ a: { exitCode: 143 } });

      const result = watch("a");

      expect(result.stdout).toContain("t3 thread show failed: exit 143\n");
    });

    test("keeps the message count through a nonzero exit with no output", () => {
      given({ a: thread({ typed: ["go"] }) });
      watch("a");
      given({ a: { exitCode: 143 } });
      watch("a");
      given({ a: thread({ typed: ["go", "new"] }) });

      const result = watch("a");

      expect(result.stdout).toContain("message delivered: new");
      expect(result.stdout).not.toContain("message delivered: go");
    });

    test("counts a missing t3 as a failure", () => {
      given({ a: thread() });
      rmSync(join(bin(), "t3"));

      const result = watch("a");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("a: t3 thread show failed");
    });

    test.each([
      ["hangs", { hangs: true }],
      ["hangs while a child holds its output", { hangs: true, childHoldsOutput: true }],
      ["exits while a child holds its output", { childHoldsOutput: true, ...thread() }],
    ])("gives up on a t3 that %s", (_name, answer) => {
      given({ a: answer });
      const started = Date.now();

      const result = run("--state", statePath(), "--lookup-timeout", "0.3", "a");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("a: t3 thread show failed: Error: no answer in 300 ms");
      expect(Date.now() - started).toBeLessThan(6_000);
    });

    test("kills the t3 it gave up on", async () => {
      given({ a: { hangs: true } });

      run("--state", statePath(), "--lookup-timeout", "1", "a");

      expect(await untilGone(Number(readFileSync(join(bin(), "hung-pid"), "utf8")))).toBe(true);
    });

    test.each([
      ["an answer of the wrong shape", { unexpected: "shape" }],
      ["an answer that is not json", "not json"],
      ["a nonzero exit with a valid answer", { exitCode: 1, ...thread() }],
      ["a message without text", { thread: thread().thread, messages: [{ role: "user", text: null }] }],
      ["a message without a role", { thread: thread().thread, messages: [{ text: "no role" }] }],
      ["a message that is not an object", { thread: thread().thread, messages: ["not an object"] }],
      ["a thread without a title", threadWithout("title")],
      ["a thread without a status", threadWithout("status")],
      ["a thread without a pending count", threadWithout("pendingRequestCount")],
      ["a thread without a run count", threadWithout("runCount")],
      ["a thread without a message list", { thread: thread().thread }],
    ])("counts %s as a failure", (_name, answer) => {
      given({ a: answer });

      const result = watch("a");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("a: t3 thread show failed");
    });
  });

  describe("when its arguments are invalid", () => {
    test.each([
      ["a check interval that is not a number", ["--check-every", "abc"]],
      ["an empty check interval", ["--check-every", ""]],
      ["a zero check interval", ["--check-every", "0"]],
      ["an infinite check interval", ["--check-every", "Infinity"]],
      ["a lookup timeout that is not a number", ["--lookup-timeout", "abc"]],
      ["a zero lookup timeout", ["--lookup-timeout", "0"]],
      ["a negative lookup timeout", ["--lookup-timeout=-1"]],
      ["an unknown flag", ["--wake-after", "60"]],
    ])("refuses %s", (_name, flags) => {
      given({ a: thread() });

      const result = run("--state", statePath(), ...flags, "a");

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: watch.js");
      expect(readdirSync(bin())).not.toContain("calls-a");
    });

    test("refuses a state flag without a value", () => {
      const result = run("--state");

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: watch.js");
    });

    test("refuses to start without a state file", () => {
      given({ a: thread() });

      const result = run("a");

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: watch.js");
    });

    test("refuses to start without a thread", () => {
      const result = run("--state", statePath());

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: watch.js");
    });

    test("refuses a relative state path", () => {
      given({ a: thread() });

      const result = run("--state", "state.json", "a");

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("usage: watch.js");
    });
  });

  describe("when it runs from another directory", () => {
    test("refuses before any lookup", () => {
      given({ a: thread() });

      const result = Bun.spawnSync([process.execPath, join(SCRIPTS, "watch.js"), "--state", statePath(), "a"], {
        cwd: home,
        env: { HOME: home, PATH: "/usr/bin:/bin" },
        timeout: 10_000,
      });

      expect(result.exitCode).toBe(2);
      expect(result.stderr.toString()).toContain("bun --cwd");
      expect(readdirSync(bin())).not.toContain("calls-a");
    });
  });
});
