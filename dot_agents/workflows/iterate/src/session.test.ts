import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { SessionHarness } from "./testing/session-harness.ts";

describe("session", () => {
  let harness: SessionHarness;
  beforeAll(() => {
    harness = SessionHarness.setup();
  });
  afterAll(async () => {
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

      expect(result.result?.killedAtExit).toBeUndefined();
      expect(result.stderr).not.toContain("killed at exit");
    }, 6000);
  });

  describe("when results arrive back to back", () => {
    test("names a task killed between them", async () => {
      const result = await (await harness.start("killed-between-results")).finish();

      expect(result.result).toMatchObject({ status: "completed", killedAtExit: ["b-gate"] });
    }, 6000);
  });
});
