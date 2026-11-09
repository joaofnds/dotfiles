import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

const pins = ["--provider", "claude", "--model", "sonnet", "--effort", "high"];
const resumeArguments = (argv: readonly string[] | undefined) =>
  (argv ?? []).filter((argument) => argument.startsWith("--resume"));
const runState = z.object({
  id: z.uuid(),
  attempts: z.array(
    z.object({
      stage: z.string(),
      sessionId: z.string(),
      status: z.string(),
      requiredToolOutcomeCoverage: z.literal("unknown").optional(),
    }),
  ),
  totals: z.object({ knownCostUsd: z.number() }),
});

describe("iterate author continuity", () => {
  let harness: WorkflowHarness;
  beforeAll(async () => {
    harness = await WorkflowHarness.setup();
  });
  beforeEach(async () => {
    await harness.reset();
  });
  afterAll(async () => {
    await harness.teardown();
  }, 20_000);

  test("continues the completed shaping author into Build only on explicit request", async () => {
    const driver = await harness.seedReal({ status: "Shape", reportedCosts: ["0.1", "0.2"] });
    await driver.boardCommand("task", "edit", "TASK-1", "--ac", "A shaped requirement");
    const shaped = await driver.run("step", "TASK-1", ...pins);
    expect(shaped).toMatchObject({ code: 0 });

    const built = await driver.run("step", "TASK-1", "--continue-author", ...pins);
    const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

    expect(built.code).toBe(2);
    expect(state.attempts).toEqual([
      { stage: "shape", sessionId: "s-shape", status: "completed" },
      { stage: "build", sessionId: "s-shape", status: "completed" },
    ]);
    expect(built.calls).toEqual(["/shape TASK-1", "/build TASK-1"]);
    expect(built.argsSeen).toContain("--resume=s-shape");
    expect(state.totals.knownCostUsd).toBe(0.2);
  }, 20_000);

  test("keeps ordinary Build fresh", async () => {
    const driver = await shapedCard(harness);

    const built = await driver.run("step", "TASK-1", ...pins);
    const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

    expect(built.code).toBe(2);
    expect(state.attempts.map((attempt) => attempt.sessionId)).toEqual(["s-shape", "s-build"]);
    expect(resumeArguments((await driver.providerArguments())[1])).toEqual([]);
  }, 20_000);

  test("starts Review fresh after a continued Build", async () => {
    const driver = await shapedCard(harness);
    await driver.run("step", "TASK-1", "--continue-author", ...pins);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Review");

    const reviewed = await driver.run("step", "TASK-1", ...pins);
    const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

    expect(reviewed.code).toBe(2);
    expect(state.attempts.map((attempt) => [attempt.stage, attempt.sessionId])).toEqual([
      ["shape", "s-shape"],
      ["build", "s-shape"],
      ["review", "s-review"],
    ]);
    expect(resumeArguments((await driver.providerArguments())[2])).toEqual([]);
  }, 20_000);

  test("resumes the continued Build through the existing same-stage command", async () => {
    const driver = await shapedCard(harness);
    await driver.run("step", "TASK-1", "--continue-author", ...pins);

    const resumed = await driver.run("resume", "TASK-1", ...pins);
    const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

    expect(resumed.code).toBe(2);
    expect(state.attempts.map((attempt) => [attempt.stage, attempt.sessionId])).toEqual([
      ["shape", "s-shape"],
      ["build", "s-shape"],
      ["build", "s-shape"],
    ]);
    expect(state.totals.knownCostUsd).toBeCloseTo(0.3, 9);
  }, 20_000);

  test("refuses continuity after a completed Codex shape with unknown tool coverage", async () => {
    const driver = await harness.seedReal({ status: "Shape" });
    await driver.useCodex();
    const codexPins = ["--provider", "codex", "--model", "gpt-6.1-sol", "--effort", "xhigh"];
    const shaped = await driver.run("step", "TASK-1", ...codexPins);
    expect(shaped.code).toBe(2);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Build");
    const before = await driver.codexLaunches();

    const refused = await driver.run("step", "TASK-1", "--continue-author", ...codexPins);
    const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("unknown required-tool outcome coverage");
    expect(refused.stderr).toContain("use a fresh step");
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]).toMatchObject({
      stage: "shape",
      status: "completed",
      requiredToolOutcomeCoverage: "unknown",
    });
    expect(await driver.codexLaunches()).toEqual(before);
  }, 20_000);

  describe("when author continuity is inadmissible", () => {
    test("refuses Review without adding an attempt or reusing the author", async () => {
      const driver = await shapedCard(harness);
      await driver.boardCommand("task", "edit", "TASK-1", "--status", "Review");

      const refused = await driver.run("step", "TASK-1", "--continue-author", ...pins);
      const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

      expect(refused.code).toBe(1);
      expect(state.attempts).toHaveLength(1);
      expect(refused.calls).toEqual(["/shape TASK-1"]);
      expect(await driver.providerArguments()).toHaveLength(1);
    }, 20_000);

    test("refuses Build without an earlier run", async () => {
      const driver = await harness.seedReal({ status: "Build" });

      const refused = await driver.run("step", "TASK-1", "--continue-author", ...pins);

      expect(refused.code).toBe(1);
      expect(refused.calls).toEqual([]);
      expect(await driver.journalBytes("TASK-1")).toBeUndefined();
    }, 20_000);

    test("refuses a failed shape predecessor even after the card moves to Build", async () => {
      const driver = await harness.seedReal({ status: "Shape", failedResult: true });
      const shaped = await driver.run("step", "TASK-1", ...pins);
      expect(shaped.code).toBe(1);
      await driver.boardCommand("task", "edit", "TASK-1", "--status", "Build");

      const refused = await driver.run("step", "TASK-1", "--continue-author", ...pins);
      const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

      expect(refused.code).toBe(1);
      expect(state.attempts).toEqual([{ stage: "shape", sessionId: "s-shape", status: "failed" }]);
      expect(refused.calls).toEqual(["/shape TASK-1"]);
    }, 20_000);

    test.each([
      {
        name: "model",
        changedPins: ["--provider", "claude", "--model", "opus", "--effort", "high"],
      },
      {
        name: "effort",
        changedPins: ["--provider", "claude", "--model", "sonnet", "--effort", "low"],
      },
      { name: "native defaults", changedPins: [] },
    ])(
      "refuses a changed $name contract without fresh fallback",
      async ({ changedPins }) => {
        const driver = await shapedCard(harness);
        const before = await driver.journalBytes("TASK-1");

        const refused = await driver.run("step", "TASK-1", "--continue-author", ...changedPins);

        expect(refused.code).toBe(1);
        expect(refused.calls).toEqual(["/shape TASK-1"]);
        expect(await driver.journalBytes("TASK-1")).toBe(before);
      },
      20_000,
    );

    test("refuses replacement of a saved supervised plan for continuity", async () => {
      const driver = await harness.seedReal({ status: "Shape" });
      await driver.boardCommand("task", "edit", "TASK-1", "--ac", "A shaped requirement");
      const defaults = [
        "--default-provider",
        "claude",
        "--default-model",
        "sonnet",
        "--default-effort",
        "high",
      ];
      const shaped = await driver.run("step", "TASK-1", ...defaults, "--review-model", "opus");
      expect(shaped.code).toBe(0);
      const before = await driver.journalBytes("TASK-1");

      const refused = await driver.run(
        "step",
        "TASK-1",
        "--continue-author",
        ...defaults,
        "--review-model",
        "sonnet",
      );

      expect(refused.code).toBe(1);
      expect(refused.calls).toEqual(["/shape TASK-1"]);
      expect(await driver.journalBytes("TASK-1")).toBe(before);
    }, 20_000);

    test("refuses runtime drift without fresh fallback", async () => {
      const driver = await shapedCard(harness);
      const before = await driver.journalBytes("TASK-1");
      await driver.changeRuntimeMcp();

      const refused = await driver.run("step", "TASK-1", "--continue-author", ...pins);

      expect(refused.code).toBe(1);
      expect(refused.calls).toEqual(["/shape TASK-1"]);
      expect(await driver.journalBytes("TASK-1")).toBe(before);
    }, 20_000);

    test("preserves the exhausted run budget", async () => {
      const driver = await harness.seedReal({ status: "Shape", runBudget: "0.1" });
      await driver.boardCommand("task", "edit", "TASK-1", "--ac", "A shaped requirement");
      const shaped = await driver.run("step", "TASK-1", ...pins);
      expect(shaped.code).toBe(0);

      const refused = await driver.run("step", "TASK-1", "--continue-author", ...pins);
      const state = runState.parse(JSON.parse((await driver.run("status", "TASK-1")).stdout));

      expect(refused.code).toBe(1);
      expect(refused.calls).toEqual(["/shape TASK-1"]);
      expect(state.totals.knownCostUsd).toBe(0.1);
    }, 20_000);

    test.each([
      ["resume", "TASK-1", "--continue-author", ...pins],
      ["step", "TASK-1", "--continue-author", "--continue-author", ...pins],
    ])(
      "refuses an invalid continuity invocation %j",
      async (...args) => {
        const driver = await harness.seedReal({ status: "Build" });

        const refused = await driver.run(...args);

        expect(refused.code).toBe(1);
        expect(refused.calls).toEqual([]);
        expect(await driver.journalBytes("TASK-1")).toBeUndefined();
      },
      20_000,
    );
  });
});

async function shapedCard(harness: WorkflowHarness) {
  const driver = await harness.seedReal({ status: "Shape", reportedCosts: ["0.1", "0.2", "0.3"] });
  await driver.boardCommand("task", "edit", "TASK-1", "--ac", "A shaped requirement");
  const shaped = await driver.run("step", "TASK-1", ...pins);
  expect(shaped).toMatchObject({ code: 0 });

  return driver;
}
