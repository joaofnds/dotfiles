import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

describe("iterate run accounting", () => {
  let harness: WorkflowHarness;
  beforeAll(async () => {
    harness = await WorkflowHarness.setup();
  });
  beforeEach(async () => {
    await harness.reset();
  });
  afterAll(async () => {
    await harness.teardown();
  });

  test("successive card stages consume one persisted dollar limit", async () => {
    const driver = await harness.seed({ runBudget: "0.2" });
    await driver.run("step", "DOT-1");
    await driver.run("step", "DOT-1");
    driver.setRunBudget("100");

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1", "/build DOT-1"]);
    expect(result.stderr).toContain("run dollar budget is exhausted");
    expect(result.argsSeen).toContain("--max-budget-usd 0.1");
  });

  test("a failed stage records its reported spend and consumes the run budget", async () => {
    const driver = await harness.seed({ failedResult: true, runBudget: "0.1" });
    await driver.run("step", "DOT-1");

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
    expect(JSON.parse(status.stdout)).toMatchObject({
      attempts: [{ status: "failed", costUsd: 0.1 }],
      totals: { knownCostUsd: 0.1, unknownCostAttempts: 0 },
    });
  });

  test("refuses dispatch while another writer holds the run lock", async () => {
    const driver = await harness.seed();
    await driver.holdRunLock();

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
  });

  test("an interrupted attempt remains counted and blocks further dispatch", async () => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1");
    await driver.interruptRecordedAttempt("DOT-1");

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
    expect(JSON.parse(status.stdout).totals.interruptedAttempts).toBe(1);
  });

  test("failed attempts consume the persisted stage ceiling", async () => {
    const driver = await harness.seed({ failedResult: true });
    await driver.steps("DOT-1", 6);

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(6);
  });

  test("the run journal links to the complete report and raw provider evidence", async () => {
    const driver = await harness.seed();
    await driver.run("step", "DOT-1");

    const status = await driver.run("status", "DOT-1");
    const attempt = JSON.parse(status.stdout).attempts[0];
    const report = JSON.parse(await readFile(attempt.reportPath, "utf8"));

    expect(report).toMatchObject({
      status: "completed",
      result: "ok",
      logPath: attempt.logPath,
      requestedAgent: { provider: "claude" },
      cost: { usd: 0.1, scope: "aggregateIncludingChildren" },
    });
    expect(await readFile(report.logPath, "utf8")).toContain('"session_id":"s-shape"');
  });

  test("a card stage receives completion requirements without intake or supervisor claims", async () => {
    const driver = await harness.seed();

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(0);
    expect(result.systems[0]).toContain("outcome and card state");
    expect(result.systems[0]).toContain("every new consequential claim and its evidence path");
    expect(result.systems[0]).toContain("errors, scope changes, unresolved decisions");
    expect(result.systems[0]).not.toContain("Use iterate inspect");
    expect(result.systems[0]).not.toContain("The supervisor reads");
  });

  test("a card recovers its existing run when a crash loses its pointer", async () => {
    const driver = await harness.seed({ runBudget: "0.1" });
    await driver.run("step", "DOT-1");
    await driver.loseCardIndex("DOT-1");

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
    const status = await driver.run("status", "DOT-1");
    expect(JSON.parse(status.stdout).totals.knownCostUsd).toBe(0.1);
  });

  test("unknown costs stay unknown and stop a capped run", async () => {
    const driver = await harness.seed({ unknownCost: true, runBudget: "1" });
    await driver.run("step", "DOT-1");

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
    expect(JSON.parse(status.stdout).totals).toMatchObject({
      knownCostUsd: 0,
      unknownCostAttempts: 1,
    });
  });

  test("elapsed stage time exhausts the same limit in a later process", async () => {
    const driver = await harness.seed({ runMinutes: "0.00000001" });
    await driver.run("step", "DOT-1");

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(JSON.parse(status.stdout).attempts).toHaveLength(1);
    expect(JSON.parse(status.stdout).totals.durationMs).toBeGreaterThan(0.0006);
    expect(result.stderr).toContain("run time budget is exhausted");
  });

  test("a clean-tree retry completes without repeating the successful review", async () => {
    const driver = await harness.seed({ status: "Review", assignee: "@claude", leaves: "review" });
    await driver.run("step", "DOT-1");
    const refused = await driver.run("step", "DOT-1");
    await driver.clearWork();

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(refused.code).toBe(1);
    expect(result.code).toBe(0);
    expect(JSON.parse(status.stdout).completed).toBe(true);
    expect(result.calls).toEqual(["/review DOT-1"]);
  });

  test("reopening a completed card starts a distinct run", async () => {
    const driver = await harness.seed();
    await driver.steps("DOT-1", 4);
    const previous = await driver.run("status", "DOT-1");
    await driver.setStatus("Build");

    const result = await driver.run("step", "DOT-1");
    const current = await driver.run("status", "DOT-1");

    expect(result.code).toBe(0);
    expect(JSON.parse(current.stdout).id).not.toBe(JSON.parse(previous.stdout).id);
    expect(JSON.parse(current.stdout)).toMatchObject({
      completed: false,
      attempts: [{ stage: "build" }],
    });
  });

  test("explicit resume continues the same author role with its recorded Claude session", async () => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1");

    const result = await driver.run("resume", "DOT-1");

    expect(result.code).toBe(2);
    expect(result.calls).toEqual(["/shape DOT-1", "/shape DOT-1"]);
    expect(result.argsSeen).toContain("--resume s-shape");
  });

  test.each([
    ["a changed model", ["--model", "opus", "--effort", "high"]],
    ["a changed effort", ["--model", "sonnet", "--effort", "medium"]],
    ["omitted options", []],
  ] as const)("resume rejects %s", async (_difference, options) => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1", "--model", "sonnet", "--effort", "high");

    const result = await driver.run("resume", "DOT-1", ...options);

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
  });

  test("resume accepts the same explicit model and effort options", async () => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1", "--model", "sonnet", "--effort", "high");

    const result = await driver.run("resume", "DOT-1", "--model", "sonnet", "--effort", "high");

    expect(result.code).toBe(2);
    expect(result.calls).toEqual(["/shape DOT-1", "/shape DOT-1"]);
    expect(result.argsSeen).toContain("--resume s-shape");
  });

  test("a repeated step starts a fresh author session", async () => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1");

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(2);
    expect(result.calls).toEqual(["/shape DOT-1", "/shape DOT-1"]);
    expect(result.argsSeen).not.toContain("--resume");
  });

  test("a legacy provider session remains readable but cannot be resumed", async () => {
    const driver = await harness.seed({ stall: "shape", mute: true });
    await driver.run("step", "DOT-1");
    await driver.replaceRecordedAgent("DOT-1", {
      provider: "codex",
      model: "gpt-6-astra",
      effort: "max",
    });

    const status = await driver.run("status", "DOT-1");
    const result = await driver.run("resume", "DOT-1");

    expect(status.code).toBe(0);
    expect(JSON.parse(status.stdout).attempts.at(-1).requestedAgent).toEqual({
      provider: "codex",
      model: "gpt-6-astra",
      effort: "max",
    });
    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/shape DOT-1"]);
    expect(result.stderr).toContain("same card stage and agent options");
  });

  test("review cannot resume its previous judgment", async () => {
    const driver = await harness.seed({ status: "Review", stall: "review", mute: true });
    await driver.run("step", "DOT-1");

    const result = await driver.run("resume", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual(["/review DOT-1"]);
  });

  test("a Done card cannot resume an author session", async () => {
    const driver = await harness.seed({ status: "Done" });

    const result = await driver.run("resume", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
  });

  test("resuming a legacy card retains planning history and does not repeat it", async () => {
    const driver = await harness.seed();
    await driver.seedLegacyRun("DOT-1", 1);

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(0);
    expect(JSON.parse(status.stdout)).toMatchObject({
      acceptedIds: ["DOT-1"],
      bet: "Historical bet",
      betRecorded: true,
      reflectionCheck: "passed",
      reflectedFrom: "before reflection",
      reflectedTo: "after reflection",
      attempts: [
        { stage: "triage", costUsd: 0.1 },
        { stage: "reflect", costUsd: 0.2 },
        { stage: "shape", costUsd: 0.1 },
      ],
      totals: { knownCostUsd: 0.4 },
    });
    expect(result.calls).toEqual(["/shape DOT-1"]);
  });

  test("an interrupted attempt prevents completion even when the card is Done", async () => {
    const driver = await harness.seed();
    await driver.run("step", "DOT-1");
    await driver.interruptRecordedAttempt("DOT-1");
    await driver.setStatus("Done");

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(JSON.parse(status.stdout)).toMatchObject({ completed: false });
    expect(result.calls).toEqual(["/shape DOT-1"]);
  });

  test("completion needs no remaining agent budget", async () => {
    const driver = await harness.seed({ runBudget: "0.3" });
    await driver.steps("DOT-1", 3);

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(0);
    expect(JSON.parse(status.stdout).completed).toBe(true);
    expect(result.calls).toEqual(["/shape DOT-1", "/build DOT-1", "/review DOT-1"]);
  });

  test("historical planning spend still exhausts the persisted dollar limit", async () => {
    const driver = await harness.seed();
    await driver.seedLegacyRun("DOT-1", 0.3);

    const result = await driver.run("step", "DOT-1");
    const status = await driver.run("status", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("run dollar budget is exhausted");
    expect(JSON.parse(status.stdout).attempts).toHaveLength(2);
    expect(result.calls).toEqual([]);
  });
});
