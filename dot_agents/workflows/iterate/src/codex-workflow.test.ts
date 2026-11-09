import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { syntheticCodexReply } from "./testing/codex-harness.ts";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

const pins = ["--provider", "codex", "--model", "gpt-6.1-sol", "--effort", "high"];
describe("Codex workflow persistence", () => {
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

  test.each(["blocked", "failed", "required-blocker"])(
    "persists reported %s as durable failure with normal native completion",
    async (scenario) => {
      const driver = await harness.seedReal();
      await driver.useCodex(scenario);

      const outcome = await driver.run("step", "TASK-1", ...pins);
      const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const report = JSON.parse(await readFile(record.attempts[0].reportPath, "utf8"));

      expect(outcome.code).toBe(1);
      expect(record.attempts).toHaveLength(1);
      expect(record.attempts[0]).toMatchObject({
        status: "failed",
        providerCompleted: true,
        requiredToolOutcomeCoverage: "unknown",
      });
      expect(report).toMatchObject({
        status: "failed",
        providerCompleted: true,
        requiredToolOutcomeCoverage: "unknown",
        processExit: { code: 0, signal: null },
        settlement: { state: "settled" },
      });
      expect(report.errors).toEqual([
        `Codex agent-reported completion: ${scenario === "required-blocker" ? "completed" : scenario}; required tool blockers: ${scenario === "failed" ? 0 : 1}`,
      ]);
      expect(report.permissionDenials).toBeUndefined();
      expect(report.toolOutcomes).toBeUndefined();
      expect(record.completed).toBe(false);
      expect(JSON.parse(await driver.boardSnapshot()).task).toMatchObject({
        status: "Build",
        assignees: [record.runClaim.assignee],
      });
      expect(await driver.codexLaunches()).toHaveLength(1);
    },
    20_000,
  );

  test("refuses a legacy completion fingerprint before dispatch while keeping history inspectable", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    await driver.replaceRecordedRuntimeFingerprint(
      "legacy-unversioned-completion-contract",
      "TASK-1",
    );
    const before = await driver.journalBytes("TASK-1");

    const outcome = await driver.run("resume", "TASK-1", ...pins);
    const history = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toContain("author contract is unknown or changed");
    expect(await driver.journalBytes("TASK-1")).toBe(before);
    expect(history.attempts).toHaveLength(1);
    expect(history.attempts[0].runtime.fingerprint).toBe("legacy-unversioned-completion-contract");
    expect(await driver.codexLaunches()).toHaveLength(1);
  }, 20_000);

  test("accepts a permitted edit and check only with the actual card transition", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex("edit-check-transition");

    const outcome = await driver.run("step", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(0);
    expect(record.attempts[0]).toMatchObject({
      status: "completed",
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown",
    });
    expect(await readFile(`${driver.repo}/requested.txt`, "utf8")).toBe("verified\n");
    expect(
      JSON.parse(await readFile(`${driver.directory}/editing-check.json`, "utf8")),
    ).toMatchObject({ red: 1, green: 0, transition: 0 });
    expect(JSON.parse(await driver.boardSnapshot()).task.status).toBe("Review");
    const report = JSON.parse(await readFile(record.attempts[0].reportPath, "utf8"));
    expect(report).toMatchObject({
      status: "completed",
      requiredToolOutcomeCoverage: "unknown",
      accountingComplete: false,
      errors: [],
      settlement: { state: "settled" },
    });
    expect(report.cost).toBeUndefined();
  }, 20_000);

  test("persists completed sessions and reuses the run claim while a card without transition stalls", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    const first = await driver.run("step", "TASK-1", ...pins);
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const resumed = await driver.run("resume", "TASK-1", ...pins);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(first.code).toBe(2);
    expect(resumed.code).toBe(2);
    expect(before.attempts).toHaveLength(1);
    expect(before.attempts[0].runtime.localInputs).toEqual({ established: true, reasons: [] });
    expect(after.attempts).toHaveLength(2);
    expect(after.id).toBe(before.id);
    expect(after.runClaim).toEqual(before.runClaim);
    expect(after.attempts[1]).toMatchObject({
      status: "completed",
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown",
      requestedAgent: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
      configuredSession: {
        provenance: "codex.sdk.requested",
        model: "gpt-6.1-sol",
        effort: "high",
      },
    });
    expect(after.attempts[1].resolvedModel).toBeUndefined();
    expect(after.attempts[1].costUsd).toBeUndefined();
    expect(after.completed).toBe(false);
    expect(after.totals.unknownCostAttempts).toBe(2);
    const launches = await driver.codexLaunches();
    expect(launches).toHaveLength(2);
    expect(launches.every((launch) => launch.outputSchema !== null)).toBe(true);
    expect(after.attempts[1].runtime.coverage).toContain(
      "structured completion protocol/schema v1",
    );
    expect(launches[0]?.argv).not.toContain("resume");
    expect(launches[1]?.argv).toEqual(
      expect.arrayContaining(["resume", before.attempts[0].sessionId]),
    );
    const report = JSON.parse(await readFile(after.attempts[1].reportPath, "utf8"));
    expect(report).toMatchObject({
      status: "completed",
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown",
      settlement: { state: "settled" },
      result: syntheticCodexReply,
    });
    expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual([
      after.runClaim.assignee,
    ]);
  }, 20_000);

  test.each([
    { kind: "ancestor skill" as const, changed: "synthetic instruction after" },
    { kind: "configured fallback" as const, changed: "synthetic instruction after" },
    {
      kind: "standalone agent" as const,
      changed: 'name="reviewer"\ndescription="fixture"\ndeveloper_instructions="after"\n',
    },
  ])(
    "refuses nested author resume after a known $kind body changes",
    async ({ kind, changed }) => {
      const driver = await harness.seedReal();
      await driver.useCodex();
      const input = await driver.seedCodexInstruction(kind);
      await driver.runFrom("apps/service", "step", "TASK-1", ...pins);
      await driver.runFrom("apps/service", "resume", "TASK-1", ...pins);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const journal = await driver.journalBytes("TASK-1");
      await writeFile(input, changed);

      const resumed = await driver.runFrom("apps/service", "resume", "TASK-1", ...pins);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(before.attempts).toHaveLength(2);
      expect(before.attempts[1].providerCompleted).toBe(true);
      expect(resumed.code).toBe(1);
      expect(resumed.stderr).toContain("author contract is unknown or changed");
      expect(await driver.codexLaunches()).toHaveLength(2);
      expect(await driver.journalBytes("TASK-1")).toBe(journal);
      expect(after).toEqual(before);
    },
    20_000,
  );

  test.each(["instruction reference", "instruction root"] as const)(
    "refuses resume after an already-covered %s alias selects another body",
    async (kind) => {
      const driver = await harness.seedReal();
      await driver.useCodex();
      const input = await driver.seedCodexAlias(kind);
      const bodies = await Promise.all(input.targets.map((path) => readFile(path, "utf8")));
      const selected = await readFile(input.selectedFile, "utf8");
      const first = await driver.run("step", "TASK-1", ...pins);
      const control = await driver.run("resume", "TASK-1", ...pins);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const journal = await driver.journalBytes("TASK-1");
      await unlink(input.alias);
      await symlink(input.nextTarget, input.alias);

      const outcome = await driver.run("resume", "TASK-1", ...pins);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(first.code).toBe(2);
      expect(control.code).toBe(2);
      expect(before.attempts).toHaveLength(2);
      expect(before.attempts[1]).toMatchObject({
        providerCompleted: true,
        requiredToolOutcomeCoverage: "unknown",
        runtime: { localInputs: { established: true, reasons: [] } },
      });
      expect(before.attempts[1].runtime).toEqual(before.attempts[0].runtime);
      expect(await Promise.all(input.targets.map((path) => readFile(path, "utf8")))).toEqual(
        bodies,
      );
      expect(await readFile(input.selectedFile, "utf8")).not.toBe(selected);
      expect(outcome.code).toBe(1);
      expect(outcome.stderr).toContain("author contract is unknown or changed");
      expect(await driver.codexLaunches()).toHaveLength(2);
      expect(await driver.journalBytes("TASK-1")).toBe(journal);
      expect(after).toEqual(before);
    },
    20_000,
  );

  test.each(["absolute instruction", "role configuration", "shared role configuration"] as const)(
    "fingerprints a supported %s reference body",
    async (kind) => {
      const driver = await harness.seedReal();
      await driver.useCodex();
      const referenced = await driver.seedCodexReference(kind);
      await driver.run("step", "TASK-1", ...pins);
      await driver.run("resume", "TASK-1", ...pins);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      await writeFile(referenced, "synthetic referenced instruction after");

      const outcome = await driver.run("resume", "TASK-1", ...pins);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(before.attempts).toHaveLength(2);
      expect(before.attempts[1].runtime.localInputs).toEqual({ established: true, reasons: [] });
      expect(outcome.stderr).toContain("author contract is unknown or changed");
      expect(after).toEqual(before);
      expect(await driver.codexLaunches()).toHaveLength(2);
    },
    20_000,
  );

  test.each([
    "relative instruction",
    "missing instruction",
    "MCP configuration",
    "credential target",
    "custom root markers",
    "symlinked declaring config",
  ] as const)(
    "refuses compatibility when %s inputs are unestablished",
    async (kind) => {
      const driver = await harness.seedReal();
      await driver.useCodex();
      await driver.seedCodexReference(kind);
      await driver.run("step", "TASK-1", ...pins);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      const outcome = await driver.run("resume", "TASK-1", ...pins);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(before.attempts[0].runtime.localInputs.established).toBe(false);
      expect(before.attempts[0].runtime.localInputs.reasons.length).toBeGreaterThan(0);
      expect(outcome.stderr).toContain("local runtime inputs are unestablished");
      expect(after).toEqual(before);
      expect(await driver.codexLaunches()).toHaveLength(1);
    },
    20_000,
  );

  test("keeps guidance above the project boundary outside author compatibility", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.seedCodexInstruction("ancestor skill");
    const outside = join(driver.directory, "AGENTS.md");
    await writeFile(outside, "outside native project boundary before");
    await driver.runFrom("apps/service", "step", "TASK-1", ...pins);
    await writeFile(outside, "outside native project boundary after");

    const outcome = await driver.runFrom("apps/service", "resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(2);
    expect(record.attempts).toHaveLength(2);
    expect(record.attempts[1].providerCompleted).toBe(true);
    expect(record.attempts[1].runtime).toEqual(record.attempts[0].runtime);
    expect(await driver.codexLaunches()).toHaveLength(2);
  }, 20_000);

  test("distinguishes a missing instruction from the literal absence marker", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    await writeFile(join(driver.repo, "AGENTS.md"), "absent");

    const outcome = await driver.run("resume", "TASK-1", ...pins);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.stderr).toContain("author contract is unknown or changed");
    expect(after).toEqual(before);
    expect(await driver.codexLaunches()).toHaveLength(1);
  }, 20_000);

  test("preserves compatibility when project profile settings are ignored natively", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.seedCodexReference("ignored project profile");
    await driver.run("step", "TASK-1", ...pins);

    await driver.run("resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(record.attempts).toHaveLength(2);
    expect(record.attempts[1].runtime.localInputs).toEqual({ established: true, reasons: [] });
    expect(record.attempts[1].providerCompleted).toBe(true);
    expect(await driver.codexLaunches()).toHaveLength(2);
  }, 20_000);

  test.each([
    "personal reference",
    "personal alias",
    "canonical personal reference",
    "lexical instruction",
    "lexical role",
  ] as const)(
    "excludes the already-modeled filtered input for %s",
    async (kind) => {
      const driver = await harness.seedReal();
      await driver.useCodex();
      const target = await driver.seedCodexFilteredInput(kind);
      await driver.run("step", "TASK-1", ...pins);
      const first = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      await writeFile(target, 'developer_instructions="synthetic excluded after"\n');
      await driver.run("step", "TASK-1", ...pins);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const journal = await driver.journalBytes("TASK-1");

      const outcome = await driver.run("resume", "TASK-1", ...pins);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(first.attempts[0].runtime.localInputs.established).toBe(false);
      expect(before.attempts[1].runtime).toEqual(first.attempts[0].runtime);
      expect(before.attempts[1].providerCompleted).toBe(true);
      expect(outcome.stderr).toContain("local runtime inputs are unestablished");
      expect(await driver.codexLaunches()).toHaveLength(2);
      expect(await driver.journalBytes("TASK-1")).toBe(journal);
      expect(after).toEqual(before);
    },
    20_000,
  );

  test("returns a contextual application failure for a looping instruction root", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.loopCodexInstructionRoot();

    const outcome = await driver.run("step", "TASK-1", ...pins);
    const state = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toContain("reading Codex runtime inputs at ");
    expect(outcome.stderr).toContain("ELOOP");
    expect(state.attempts).toEqual([]);
    expect(await driver.codexLaunches()).toEqual([]);
  }, 20_000);

  test("records missing remote history as a failed attempt without a fresh fallback", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    driver.env.FAKE_CODEX_SCENARIO = "missing-history";
    const outcome = await driver.run("resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(1);
    expect(record.attempts).toHaveLength(2);
    expect(record.attempts[1]).toMatchObject({ status: "failed", providerCompleted: false });
    const launches = await driver.codexLaunches();
    expect(launches).toHaveLength(2);
    expect(launches[1]?.argv).toContain("resume");
    expect(
      JSON.parse(await readFile(record.attempts[1].reportPath, "utf8")).errors.join(),
    ).toContain("history missing");
  }, 20_000);

  test("requires fresh review sessions and refuses their resume locally", async () => {
    const driver = await harness.seedReal({ status: "Review" });
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    await driver.run("step", "TASK-1", ...pins);
    const resumed = await driver.run("resume", "TASK-1", ...pins);
    const launches = await driver.codexLaunches();

    expect(resumed.code).toBe(1);
    expect(resumed.stderr).toContain("fresh independent judgment");
    expect(launches).toHaveLength(2);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    expect(record.attempts[0].sessionId).not.toBe(record.attempts[1].sessionId);
    expect(launches.some((launch) => launch.argv.includes("resume"))).toBe(false);
  }, 20_000);

  test("refuses local configuration drift before launching an author resume", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    await writeFile(
      join(String(driver.env.CODEX_HOME), "config.toml"),
      'model_reasoning_effort="medium"\n',
    );
    const outcome = await driver.run("resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toContain("author contract is unknown or changed");
    expect(await driver.codexLaunches()).toHaveLength(1);
    expect(record.attempts).toHaveLength(1);
  }, 20_000);

  test("ignores credentials and mutable history in the bounded runtime fingerprint", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    const home = String(driver.env.CODEX_HOME);
    await mkdir(join(home, "sessions"));
    await writeFile(join(home, "auth.json"), '{"fixtureCredential":"never a contract input"}');
    await writeFile(join(home, "sessions", "history.jsonl"), "mutable fixture history");
    await writeFile(join(home, "state_5.sqlite"), "mutable fixture bookkeeping");

    const resumed = await driver.run("resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(resumed.code).toBe(2);
    expect(record.attempts).toHaveLength(2);
    expect(record.attempts[1].providerCompleted).toBe(true);
    expect(record.attempts[1].runtime).toEqual(record.attempts[0].runtime);
    expect(record.attempts[1].runtime.coverage).toContain("CODEX_HOME/config.toml");
    expect(record.attempts[1].runtime.unknowns).toContain("per-turn execution telemetry");
  }, 20_000);

  test("detects changed project instruction bodies before author resume", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    await writeFile(join(driver.repo, "AGENTS.md"), "changed synthetic project instruction");

    const resumed = await driver.run("resume", "TASK-1", ...pins);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(resumed.code).toBe(1);
    expect(resumed.stderr).toContain("author contract is unknown or changed");
    expect(record.attempts).toHaveLength(1);
    expect(await driver.codexLaunches()).toHaveLength(1);
  }, 20_000);

  test("refuses explicit dollars before any native provider launch", async () => {
    const driver = await harness.seedReal({ budget: "1" });
    await driver.useCodex();
    const outcome = await driver.run("step", "TASK-1", ...pins);
    expect(outcome.code).toBe(1);
    expect(outcome.stderr).toContain("cannot enforce an explicit dollar cap");
    expect(await driver.codexLaunches()).toEqual([]);
  }, 20_000);

  test("keeps the unknown-dollar guard and durable attempt limits across calls", async () => {
    const driver = await harness.seedReal();
    await driver.useCodex();
    await driver.run("step", "TASK-1", ...pins);
    driver.env.ITERATE_RUN_BUDGET = "10";
    const capped = await driver.run(
      "step",
      "TASK-1",
      "--provider",
      "claude",
      "--model",
      "sonnet",
      "--effort",
      "high",
    );
    driver.env.ITERATE_RUN_BUDGET = "";
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    for (let index = 0; index < 5; index += 1) await driver.run("step", "TASK-1", ...pins);
    const exhausted = await driver.run("step", "TASK-1", ...pins);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(capped.code).toBe(1);
    expect(capped.stderr).toContain("unknown, incomplete or parent-only");
    expect(exhausted.code).toBe(1);
    expect(after.attempts).toHaveLength(6);
    expect(after.id).toBe(before.id);
    expect(after.runClaim).toEqual(before.runClaim);
    expect(await driver.codexLaunches()).toHaveLength(6);
  }, 60_000);
});
