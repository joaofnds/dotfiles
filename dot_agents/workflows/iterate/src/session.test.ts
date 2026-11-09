import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { SessionHarness, SessionLifecycleHarness } from "./testing/session-harness.ts";

describe("session", () => {
  let harness: SessionHarness;
  beforeAll(() => {
    harness = SessionHarness.setup();
  });
  afterAll(async () => {
    await harness.teardown();
  });
  afterEach(async () => {
    await harness.teardown();
  });

  test("returns the complete Claude result with live progress by default", async () => {
    const result = await (await harness.start()).finish();

    expect(result.code).toBe(0);
    expect(result.stdout).toBe("final reply\n");
    expect(result.stderr).toContain("progress before final");
    expect(result.result).toMatchObject({
      status: "completed",
      result: "final reply",
      sessionId: "claude-terminal-session",
      requestedAgent: { provider: "claude" },
      resolvedModel: "resolved-fake",
      turns: 2,
      cost: { usd: 0.25, scope: "aggregateIncludingChildren" },
      usage: {
        parent: { input: 10, cacheRead: 7, output: 3 },
        aggregateIncludingChildren: { input: 14, cacheRead: 9, output: 5 },
        models: [
          {
            model: "resolved-fake",
            resolvedModel: "resolved-fake",
            costUsd: 0.25,
            costBasis: "list",
            tokens: { input: 14, cacheRead: 9, output: 5 },
          },
        ],
      },
      errors: [],
    });
    expect(result.result?.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.result?.logPath).toMatch(/build-[0-9a-f-]{36}\.log$/);
    expect(await readFile(String(result.result?.logPath), "utf8")).toContain(
      '"progress before final"',
    );
    expect(JSON.parse(JSON.stringify(result.result))).toEqual(result.result);
  }, 6000);

  test.each(["clock-backward", "clock-forward"] as const)(
    "keeps elapsed duration independent of %s movement",
    async (scenario) => {
      const driver = await harness.start(scenario);

      const result = await driver.finish();

      expect(result.code).toBe(0);
      expect(result.result?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.result?.durationMs).toBeLessThan(10_000);
      expect(driver.recordedAttempt()).toMatchObject({
        durationMs: result.result?.durationMs,
        report: { durationMs: result.result?.durationMs },
      });
    },
  );

  test("a provider returning another session cannot satisfy explicit resume", async () => {
    const result = await (
      await harness.start("success", { resumeSessionId: "requested-session" })
    ).finish();

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.result).toMatchObject({ status: "failed", sessionId: "claude-terminal-session" });
  });

  test.each(["duplicate-terminal", "reordered-terminal", "anonymous-reordered-terminal"] as const)(
    "%s envelopes count token usage and turns once",
    async (scenario) => {
      const result = await (await harness.start(scenario)).finish();

      expect(result.code).toBe(0);
      expect(result.result).toMatchObject({
        turns: 2,
        permissionDenials: 2,
        usage: {
          parent: { input: 10, output: 3 },
          aggregateIncludingChildren: { input: 14, output: 5 },
        },
        cost: { usd: 0.25, basis: "sessionCumulative" },
        accountingComplete: true,
      });
    },
  );

  test.each(["replayed-terminal", "anonymous-replayed-terminal"] as const)(
    "%s cannot complete newer unfinished work",
    async (scenario) => {
      const result = await (await harness.start(scenario)).finish();

      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.result).toMatchObject({ status: "failed", accountingComplete: false });
    },
  );

  test("a reused terminal identity with conflicting data cannot prove complete accounting", async () => {
    const result = await (await harness.start("conflicting-terminal")).finish();

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.result).toMatchObject({ status: "failed", accountingComplete: false });
  });

  test("a distinct terminal completes the newer work", async () => {
    const result = await (await harness.start("new-terminal-after-progress")).finish();

    expect(result.code).toBe(0);
    expect(result.stdout).toBe("new final reply\n");
    expect(result.result).toMatchObject({ status: "completed", accountingComplete: true });
  });

  test.each(["regressed-cost", "regressed-tokens"] as const)(
    "%s cannot establish fully known accounting",
    async (scenario) => {
      const result = await (await harness.start(scenario)).finish();

      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.result).toMatchObject({ status: "failed", accountingComplete: false });
    },
  );

  test("a new session identity cannot replace an existing accounting ledger", async () => {
    const result = await (await harness.start("changed-accounting-session")).finish();

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.result).toMatchObject({
      status: "failed",
      sessionId: "claude-terminal-session",
      accountingComplete: false,
    });
  });

  test.each([
    "unfinished-text",
    "unfinished-tool",
    "reinvoked-uncosted",
    "malformed-recognized",
  ] as const)(
    "%s retains earlier evidence without claiming fully known accounting",
    async (scenario) => {
      const result = await (await harness.start(scenario)).finish();

      expect(result.result).toMatchObject({ cost: { usd: 0.25 }, accountingComplete: false });
    },
  );

  test("suppresses progress only when compact transport is selected", async () => {
    const result = await (await harness.start("success", { live: false })).finish();

    expect(result.code).toBe(0);
    expect(result.stderr).not.toContain("progress before final");
    expect(result.stdout).toBe("final reply\n");
    expect(await readFile(String(result.result?.logPath), "utf8")).toContain(
      '"progress before final"',
    );
  }, 6000);

  test("preserves a large final reply whole", async () => {
    const result = await (await harness.start("long")).finish();

    expect(result.stdout).toBe(`${"x".repeat(100_000)}\n`);
    expect(result.result?.result).toBe("x".repeat(100_000));
  }, 6000);

  test("retains Claude stderr in the raw log", async () => {
    const result = await (await harness.start()).finish();

    expect(await readFile(String(result.result?.logPath), "utf8")).toContain(
      "[stderr]\nfixture diagnostic",
    );
  });

  test.each(["malformed", "error", "truncated"] as const)(
    "rejects %s output",
    async (scenario) => {
      const result = await (await harness.start(scenario)).finish();

      expect(result.code).toBe(1);
      expect(result.result).toMatchObject({ status: "failed" });
      expect((result.result?.errors as string[] | undefined)?.length ?? 0).toBeGreaterThan(0);
    },
    6000,
  );

  test.each([
    ["interrupt-on-spawn", "SIGINT"],
    ["terminate-on-spawn", "SIGTERM"],
  ] as const)("records %s before any startup handshake", async (scenario, signal) => {
    const driver = await harness.start(scenario);

    const result = await driver.stopped();

    expect(result.code).toBe(1);
    expect(result.result).toMatchObject({
      status: "failed",
      result: "",
      errors: [`received ${signal}`],
      settlement: { state: "settled" },
    });
    expect(driver.stdout).toBe("");
    expect(driver.processes()).toEqual([
      { role: "agent", pid: expect.any(Number), running: false },
    ]);
    expect(driver.recordedAttempt()).toMatchObject({
      status: "failed",
      report: { status: "failed", result: "", errors: [`received ${signal}`] },
    });
  });

  test("stops the agent and its signal-resistant descendant on SIGINT", async () => {
    const result = await (await harness.start("interrupt")).interrupt();

    expect(result).toEqual({ code: 1, stopped: ["agent", "descendant"] });
  }, 6000);

  test("rejects a session when its wall-time budget expires", async () => {
    const result = await (await harness.start("timeout", { timeoutMs: 50 })).stopped();

    expect(result).toMatchObject({ code: 1, result: { status: "failed" } });
    expect(result.result?.errors).toContain(
      "exceeded the 50ms wall-time budget, so it was stopped",
    );
    expect(result.result?.usage).toEqual({});
    expect(result.result?.turns).toBeUndefined();
    expect(result.result?.cost).toBeUndefined();
  }, 6000);

  test("stops a session that starts in another permission mode", async () => {
    const result = await (await harness.start("default-mode")).stopped();

    expect(result).toMatchObject({ code: 1, result: { status: "failed" } });
    expect(result.result?.errors).toContain(
      "the session started in default permission mode instead of auto, so it was stopped",
    );
  }, 6000);

  test("reports the permission denials the session met", async () => {
    const result = await (await harness.start("denials")).finish();

    expect(result.result).toMatchObject({ status: "completed", permissionDenials: 2 });
    expect(result.stderr).toContain("denials 2");
  }, 6000);

  test("names each task Claude killed after the session's final result", async () => {
    const result = await (await harness.start("killed-at-exit")).finish();

    expect(result.result).toMatchObject({ status: "completed", killedAtExit: ["Full gate rerun"] });
    expect(result.stderr).toContain("killed at exit: Full gate rerun");
    expect(result.stderr).not.toContain("killed at exit: Stopped by the stage");
  }, 6000);

  describe("when Claude kills a task whose start it never reported", () => {
    test("names the task by its id", async () => {
      const result = await (await harness.start("killed-unseen")).finish();

      expect(result.result).toMatchObject({ status: "completed", killedAtExit: ["b-unseen"] });
    }, 6000);
  });

  describe("when a turn starts after a result", () => {
    test("names no task killed before or during that turn", async () => {
      const result = await (await harness.start("killed-mid-turn")).finish();

      expect(result.code).toBe(0);
      expect(result.stdout).toBe("final reply\n");
      expect(result.result?.status).toBe("completed");
      expect(result.result?.killedAtExit).toBeUndefined();
      expect(result.stderr).not.toContain("killed at exit");
    }, 6000);
  });

  describe("when background tasks re-invoke the session", () => {
    test("counts the session total once and sums each invocation's turns", async () => {
      const result = await (await harness.start("reinvoked")).finish();

      expect(result.result).toMatchObject({
        turns: 5,
        cost: { usd: 0.25, scope: "aggregateIncludingChildren" },
        usage: {
          parent: { input: 11, cacheRead: 9, output: 4 },
          aggregateIncludingChildren: { input: 14, cacheRead: 9, output: 5 },
          models: [
            {
              model: "resolved-fake",
              costUsd: 0.25,
              tokens: { input: 14, cacheRead: 9, output: 5 },
            },
          ],
        },
      });
    }, 6000);
  });

  describe("when a re-invocation reports a larger session total", () => {
    test("reports the last result's cost, aggregate tokens and models", async () => {
      const result = await (await harness.start("reinvoked-grown")).finish();

      expect(result.result).toMatchObject({
        cost: { usd: 0.4, scope: "aggregateIncludingChildren" },
        usage: {
          aggregateIncludingChildren: { input: 20, cacheRead: 30, output: 8 },
          models: [
            {
              model: "resolved-fake",
              costUsd: 0.4,
              tokens: { input: 20, cacheRead: 30, output: 8 },
            },
          ],
        },
      });
    }, 6000);
  });

  describe("when a re-invocation reports no cost or model usage", () => {
    test("keeps the earlier result's cost, aggregate tokens and models", async () => {
      const result = await (await harness.start("reinvoked-uncosted")).finish();

      expect(result.result).toMatchObject({
        turns: 5,
        cost: { usd: 0.25, scope: "aggregateIncludingChildren" },
        usage: {
          parent: { input: 11, cacheRead: 9, output: 4 },
          aggregateIncludingChildren: { input: 14, cacheRead: 9, output: 5 },
          models: [{ model: "resolved-fake", costUsd: 0.25 }],
        },
      });
    }, 6000);
  });

  describe("when results arrive back to back", () => {
    test("names a task killed between them", async () => {
      const result = await (await harness.start("killed-between-results")).finish();

      expect(result.result).toMatchObject({ status: "completed", killedAtExit: ["b-gate"] });
    }, 6000);
  });
  test("keeps tools and unknown events out of the final reply", async () => {
    const result = await (await harness.start("unknown-tools")).finish();

    expect(result.code).toBe(0);
    expect(result.stdout).toBe("final reply\n");
    expect(result.stderr).toContain("> Bash: literal tool");
    expect(await readFile(String(result.result?.logPath), "utf8")).toContain('"future.event"');
  });

  test.each([
    "malformed-recognized",
    "error",
    "nonzero",
    "no-result",
    "no-final",
    "later-no-final",
    "unfinished-text",
    "unfinished-tool",
    "truncated-tail",
  ] as const)(
    "retains failed %s evidence without emitting a successful reply",
    async (scenario) => {
      const driver = await harness.start(scenario);

      const result = await driver.finish();

      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.result).toMatchObject({ status: "failed" });
      expect(driver.recordedAttempt()).toMatchObject({ status: "failed", report: result.result });
      expect(await readFile(String(result.result?.logPath), "utf8")).toContain('"type":"system"');
    },
    6000,
  );

  test("preserves stderr whitespace in the raw log", async () => {
    const result = await (await harness.start("raw-stderr")).finish();

    expect(await readFile(String(result.result?.logPath), "utf8")).toEndWith(
      "[stderr]\n\n fixture diagnostic \n\n",
    );
  });

  test("preserves an unreadable provider tail byte for byte", async () => {
    const result = await (await harness.start("truncated-tail")).finish();

    expect(await readFile(String(result.result?.logPath), "utf8")).toContain(
      '\n{"type":"result","result":\n',
    );
  });

  test.each(["stdin", "argv"] as const)(
    "transports literal %s content to the provider",
    async (transport) => {
      const prompt = "$HOME \"double\" 'single' `touch unexpected` with spaces\nand a new line";
      const driver = await harness.start(`fixture-${transport}`, { prompt });

      const result = await driver.finish();

      expect(result.code).toBe(0);
      expect(result.stdout).toBe("fixture final reply\n");
      expect(result.stderr).toContain("fixture progress");
      expect(driver.capturedInput()).toBe(prompt);
    },
  );

  test.each([
    ["idle", { idleTimeoutMs: 300 }, "silent for 300ms, so it was stopped"],
    ["timeout", { timeoutMs: 300 }, "exceeded the 300ms wall-time budget, so it was stopped"],
  ] as const)(
    "persists %s failure and terminates both process IDs",
    async (scenario, options, reason) => {
      const driver = await harness.start(scenario, options);

      const result = await driver.stopped();

      expect(result.code).toBe(1);
      expect(result.stopped).toEqual(["agent", "descendant"]);
      expect(driver.processes().map(({ role, running }) => ({ role, running }))).toEqual([
        { role: "agent", running: false },
        { role: "descendant", running: false },
      ]);
      expect(driver.stdout).toBe("");
      expect(driver.recordedAttempt()).toMatchObject({
        status: "failed",
        report: { status: "failed", result: "", errors: [reason] },
      });
    },
    6000,
  );

  test("persists interrupted failure with no invented successful result", async () => {
    const driver = await harness.start("interrupt");

    await driver.interrupt();

    expect(driver.stdout).toBe("");
    expect(driver.processes().every(({ running }) => !running)).toBe(true);
    expect(driver.recordedAttempt()).toMatchObject({
      status: "failed",
      report: { status: "failed", result: "", errors: ["received SIGINT"] },
    });
  }, 6000);
});

describe("prepareSession", () => {
  let harness: SessionLifecycleHarness;
  beforeAll(() => {
    harness = new SessionLifecycleHarness();
  });
  afterAll(async () => {
    await harness.teardown();
  });

  test("prepares without creating a process", () => {
    const prepared = harness.prepare("missing-executable");
    const interruptions = process.listenerCount("SIGINT");
    const terminations = process.listenerCount("SIGTERM");
    let failure: unknown;

    try {
      prepared.start();
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({
      result: {
        status: "failed",
        durationMs: 0,
        accountingComplete: false,
        logPath: prepared.logPath,
        usage: {},
      },
    });
    expect(process.listenerCount("SIGINT")).toBe(interruptions);
    expect(process.listenerCount("SIGTERM")).toBe(terminations);
  });

  test("creates the real process synchronously with cancellation already armed", async () => {
    const prepared = harness.prepare("stalled");

    const running = prepared.start();
    const exists = process.kill(running.pid, 0);
    const first = running.cancel("caller could not persist the PID");
    const repeated = running.cancel("caller could not release its mutex");
    const settlement = await first;
    const result = await harness.finish(running);

    expect(exists).toBe(true);
    expect(running.processGroupId).toBe(running.pid);
    expect(running.processGroupIdentity).toMatchObject({
      pid: running.pid,
      processGroupId: running.pid,
    });
    expect(JSON.parse(JSON.stringify(running.processGroupIdentity))).toEqual(
      running.processGroupIdentity,
    );
    expect(running.logPath).toBe(prepared.logPath);
    expect(first).toBe(repeated);
    expect(settlement.state).toBe("settled");
    expect(result).toMatchObject({ status: "failed", accountingComplete: false, settlement });
    expect(result.errors).toContain("caller could not persist the PID");
    expect(() => prepared.start()).toThrow();
  });

  test("returns normalized completion through the explicit start seam", async () => {
    const running = harness.prepare("success").start();

    const result = await running.result;

    expect(result).toMatchObject({ status: "completed", result: "prepared final" });
    expect(result.settlement).toEqual(await running.settlement);
  });

  describe("judges the result by the rules of the adapter it runs", () => {
    test.each([
      [true, true],
      [false, undefined],
    ])("provider completion declared %p reports %p", async (providerCompletion, reported) => {
      const result = await harness.finish(
        harness.prepare("success", { rules: { providerCompletion } }).start(),
      );

      expect(result.providerCompleted).toBe(reported);
    });

    test.each([
      [true, true],
      [false, false],
    ])(
      "a resumed session missing its pinned model fails when the pin rule is %p",
      async (resolvedModelMustMatchPin, fails) => {
        const result = await harness.finish(
          harness
            .prepare("success", {
              resumeSessionId: "pinned-session",
              model: "pinned-model",
              rules: { resume: { resolvedModelMustMatchPin } },
            })
            .start(),
        );

        expect(
          result.errors.includes("the resumed session did not establish the pinned model"),
        ).toBe(fails);
      },
    );
  });

  test.each(["closed-output", "malformed-stalled", "output-error"] as const)(
    "bounds a live provider after %s",
    async (scenario) => {
      const running = harness.prepare(scenario).start();

      const result = await harness.finish(running);

      expect(result).toMatchObject({
        status: "failed",
        accountingComplete: false,
        settlement: { state: "settled" },
      });
      expect(result.durationMs).toBeLessThan(4000);
    },
    5000,
  );

  test.each(["inherited-pipes", "closed-descendant"] as const)(
    "retains bounded uncertainty for %s after losing every owned identity anchor",
    async (scenario) => {
      const running = harness.prepare(scenario).start();
      await harness.releaseLeader(running);

      const result = await harness.finish(running);

      expect(result).toMatchObject({ status: "failed", accountingComplete: false });
      expect(result.settlement?.state).toBe("uncertain");
      expect(result.durationMs).toBeLessThan(4500);
      expect(result.settlement).toEqual(await running.settlement);
    },
    6000,
  );

  test("retains output-drain uncertainty after the owned group disappears", async () => {
    const running = harness.prepare("escaped-pipes").start();
    await harness.releaseLeader(running);

    const result = await harness.finish(running);

    expect(result).toMatchObject({ status: "failed", settlement: { state: "uncertain" } });
    expect(result.settlement).toEqual(await running.cancel());
    expect(result.durationMs).toBeLessThan(2500);
  });
});
