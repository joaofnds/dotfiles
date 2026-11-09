import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { createHash } from "node:crypto";
import { appendFile, realpath, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { selectionForRole, supervisedPlanSchema } from "./agents.ts";
import { readOptionalFile } from "./files.ts";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

setDefaultTimeout(20_000);

const supervised = [
  "--default-provider",
  "claude",
  "--default-model",
  "sonnet",
  "--default-effort",
  "high",
];
const pinned = ["--model", "sonnet", "--effort", "high"];

type FixtureDriver = Awaited<ReturnType<WorkflowHarness["seed"]>>;

async function expectUnchangedResumeRefusal({
  driver,
  result,
  journal,
  claims,
}: {
  driver: FixtureDriver;
  result: Awaited<ReturnType<FixtureDriver["run"]>>;
  journal: string | undefined;
  claims: Awaited<ReturnType<FixtureDriver["claimBytes"]>>;
}) {
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("use a fresh step");
  expect(await driver.journalBytes()).toBe(journal);
  expect(await driver.claimBytes()).toEqual(claims);
  expect(result.calls).toHaveLength(1);
}

async function legacyClaudeFingerprint(driver: FixtureDriver): Promise<string> {
  const config = driver.env.CLAUDE_CONFIG_DIR;
  const paths = [
    join(driver.directory, "bin", "claude"),
    join(config, "settings.json"),
    join(config, "settings.local.json"),
    join(config, "CLAUDE.md"),
    "/Library/Application Support/ClaudeCode/managed-settings.json",
  ];
  let directory = await realpath(driver.repo);
  while (true) {
    paths.push(
      join(directory, ".claude", "settings.json"),
      join(directory, ".claude", "settings.local.json"),
      join(directory, "CLAUDE.md"),
      join(directory, ".claude", "CLAUDE.md"),
      join(directory, "CLAUDE.local.md"),
      join(directory, "AGENTS.md"),
    );
    const parent = dirname(directory);
    if (parent === directory) break;

    directory = parent;
  }
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(path);
    hash.update(
      (await readOptionalFile({ path, description: "legacy fixture input" })) ?? "absent",
    );
  }
  hash.update(join(config, ".claude.json"));
  hash.update(JSON.stringify({ projects: [], referencedEnvironment: [] }));
  hash.update(join(await realpath(driver.repo), ".mcp.json"));
  hash.update("absent");
  hash.update(
    JSON.stringify(
      Object.entries(driver.env)
        .filter(([key, value]) => /^(CLAUDE|ANTHROPIC)_/.test(key) && value !== undefined)
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  );
  hash.update("2.1.fixture");
  hash.update("permission-mode:auto");

  return hash.digest("hex");
}

describe("persisted iterate selection", () => {
  let harness: WorkflowHarness;
  beforeAll(async () => {
    harness = await WorkflowHarness.setup();
  }, 5000);
  beforeEach(async () => {
    await harness.reset();
  }, 5000);
  afterAll(async () => {
    await harness.teardown();
  }, 5000);

  test.each([
    {
      name: "model-only override with an arbitrary assigned effort",
      options: ["--role-model", "reviewer=opus"],
      override: { model: "opus" },
      expectedAssignment: { provider: "claude", model: "opus", effort: "xhigh" },
    },
    {
      name: "assigned effort without a role override",
      options: [],
      override: undefined,
      expectedAssignment: { provider: "claude", model: "sonnet", effort: "xhigh" },
    },
    {
      name: "explicit role effort replacing the assignment",
      options: ["--role-model", "reviewer=haiku", "--role-effort", "reviewer=low"],
      override: { model: "haiku", effort: "low" },
      expectedAssignment: { provider: "claude", model: "haiku", effort: "low" },
    },
    {
      name: "a tuple resetting inherited and assigned effort",
      options: ["--role-agent", "reviewer=claude:opus"],
      override: { agent: { provider: "claude", model: "opus" } },
      expectedAssignment: { provider: "claude", model: "opus" },
    },
    {
      name: "field precedence over a tuple independent of argument order",
      options: [
        "--role-effort",
        "reviewer=medium",
        "--role-model",
        "reviewer=haiku",
        "--role-agent",
        "reviewer=claude:opus:low",
      ],
      override: {
        agent: { provider: "claude", model: "opus", effort: "low" },
        model: "haiku",
        effort: "medium",
      },
      expectedAssignment: { provider: "claude", model: "haiku", effort: "medium" },
    },
  ])(
    "p7 carries $name through the stage request",
    async ({ options, override, expectedAssignment }) => {
      const driver = await harness.seed({ stall: "build", status: "Build" });

      const result = await driver.run("step", "DOT-1", ...supervised, ...options);
      const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

      expect(result.code).toBe(2);
      expect(result.calls).toHaveLength(1);
      expect(result.systems[0]).toContain("ITERATE_ROLE_SELECTION=");
      const receipt = JSON.parse(
        result.systems[0]?.split("ITERATE_ROLE_SELECTION=")[1]?.split("\n")[0] ?? "",
      );
      expect(receipt).toEqual({
        stage: "build",
        requestedAgent: { provider: "claude", model: "sonnet", effort: "high" },
        overrides: override === undefined ? {} : { reviewer: override },
      });
      const deliveredPlan = supervisedPlanSchema.parse({
        ...state.supervisedPlan,
        stages: { ...state.supervisedPlan.stages, build: receipt.requestedAgent },
        roles: receipt.overrides,
      });
      expect(
        selectionForRole({
          plan: { supervised: deliveredPlan },
          stage: "build",
          role: "reviewer",
          assignedEffort: "xhigh",
        }),
      ).toEqual(expectedAssignment);
      expect(state.supervisedPlan.roles).toEqual(receipt.overrides);
      expect(state.attempts[0].requestedAgent).toEqual(receipt.requestedAgent);
      expect(JSON.parse(state.attempts[0].runtime.rolePolicy).contract).toBe(
        "iterate-native-roles-v2",
      );
    },
  );

  test("p7 compatible resume retains role inputs and unrelated stage selection", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run(
      "step",
      "DOT-1",
      ...supervised,
      "--review-model",
      "opus",
      "--review-effort",
      "low",
      "--role-agent",
      "reviewer=claude:haiku",
      "--role-effort",
      "reviewer=medium",
      "--role-model",
      "advisor=sonnet",
    );
    const before = JSON.parse((await driver.journalBytes()) ?? "null");

    const result = await driver.run("resume", "DOT-1");
    const after = JSON.parse((await driver.journalBytes()) ?? "null");

    expect(result.code).toBe(2);
    expect(result.calls).toHaveLength(2);
    expect(result.systems[1]).toContain("ITERATE_ROLE_SELECTION=");
    const receipt = JSON.parse(
      result.systems[1]?.split("ITERATE_ROLE_SELECTION=")[1]?.split("\n")[0] ?? "",
    );
    expect(receipt).toEqual({
      stage: "build",
      requestedAgent: { provider: "claude", model: "sonnet", effort: "high" },
      overrides: {
        reviewer: { agent: { provider: "claude", model: "haiku" }, effort: "medium" },
        advisor: { model: "sonnet" },
      },
    });
    expect(after.supervisedPlan.stages.review).toEqual({
      provider: "claude",
      model: "opus",
      effort: "low",
    });
    expect(after.supervisedPlan.roles).toEqual(receipt.overrides);
    expect(after.attempts[1].requestedAgent).toEqual(receipt.requestedAgent);
    expect(after.id).toBe(before.id);
    expect(after.runClaim).toEqual(before.runClaim);
    expect(after.limits).toEqual(before.limits);
    expect(after.attempts[1].runtime).toEqual(before.attempts[0].runtime);
    expect(after.attempts[1].sessionId).toBe(before.attempts[0].sessionId);
  });

  test("a bare call reuses the complete saved supervised plan", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...supervised);

    const result = await driver.run("step", "DOT-1");
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.calls).toHaveLength(2);
    expect(state.selectionHistory).toHaveLength(1);
    expect(state.attempts[1].requestedAgent).toEqual({
      provider: "claude",
      model: "sonnet",
      effort: "high",
    });
    expect(state.attempts[1].selection).toEqual(state.supervisedPlan);
  });

  test("equivalent reordered flags retain the original saved request", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...supervised);

    const result = await driver.run(
      "resume",
      "DOT-1",
      "--default-effort",
      "high",
      "--default-model",
      "sonnet",
      "--default-provider",
      "claude",
    );
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.code).toBe(2);
    expect(result.argsSeen).toContain("--resume=s-build");
    expect(state.supervisedPlan.originalRequest).toEqual(supervised);
    expect(state.selectionHistory).toHaveLength(1);
  });

  test("fresh complete reselection retains the run limits cost and previous attempts", async () => {
    const driver = await harness.seed({
      stall: "build",
      status: "Build",
      runBudget: "10",
    });
    await driver.run("step", "DOT-1", ...supervised);
    const before = JSON.parse((await driver.run("status", "DOT-1")).stdout);
    driver.setRunBudget("100");

    const result = await driver.run(
      "step",
      "DOT-1",
      "--default-provider",
      "claude",
      "--default-model",
      "opus",
    );
    const after = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.calls).toHaveLength(2);
    expect(after.id).toBe(before.id);
    expect(after.limits).toEqual(before.limits);
    expect(after.attempts[0]).toEqual(before.attempts[0]);
    expect(after.attempts[1].requestedAgent).toEqual({ provider: "claude", model: "opus" });
    expect(after.selectionHistory[1]).toMatchObject({
      previous: before.supervisedPlan,
      next: after.supervisedPlan,
    });
    expect(after.totals.knownCostUsd).toBe(0.2);
  });

  test.each([
    { invocation: "resume", options: ["--default-provider", "claude", "--default-model", "opus"] },
    { invocation: "step", options: ["--default-model", "opus"] },
    { invocation: "step", options: ["--model", "sonnet"] },
    { invocation: "resume", options: ["--provider", "claude"] },
    {
      invocation: "step",
      options: ["--default-provider", "claude", "--default-effort", "invalid"],
    },
  ])(
    "invalid saved-plan request $invocation $options leaves journal bytes unchanged",
    async ({ invocation, options }) => {
      const driver = await harness.seed({ stall: "build", status: "Build" });
      await driver.run("step", "DOT-1", ...supervised);
      const before = await driver.journalBytes();

      const result = await driver.run(invocation, "DOT-1", ...options);

      expect(result.code).toBe(1);
      expect(result.calls).toHaveLength(1);
      expect(await driver.journalBytes()).toBe(before);
    },
  );

  test("direct calls retain their mode until a fresh supervised step", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    const before = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    await driver.run("step", "DOT-1", ...supervised);
    const after = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(before.supervisedPlan).toBeUndefined();
    expect(before.attempts[0].selection).toBeUndefined();
    expect(after.id).toBe(before.id);
    expect(after.attempts[0]).toEqual(before.attempts[0]);
    expect(after.attempts[1].selection).toEqual(after.supervisedPlan);
  });

  test("supervised flags on direct resume refuse before journal mutation", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    const before = await driver.journalBytes();

    const result = await driver.run("resume", "DOT-1", ...supervised);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes()).toBe(before);
  });

  test("reselection cannot settle an interrupted attempt", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...supervised);
    await driver.interruptRecordedAttempt("DOT-1");
    const before = await driver.journalBytes();

    const result = await driver.run(
      "step",
      "DOT-1",
      "--default-provider",
      "claude",
      "--default-model",
      "opus",
    );

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes()).toBe(before);
  });

  test("a compatible bare supervised resume uses the recorded explicit session", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...supervised);

    const result = await driver.run("resume", "DOT-1");

    expect(result.code).toBe(2);
    expect(result.calls).toHaveLength(2);
    expect(result.argsSeen).toContain("--resume=s-build");
  });

  test("ambiguous native defaults refuse resume before another attempt", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1");
    const before = await driver.journalBytes();

    const result = await driver.run("resume", "DOT-1");

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes()).toBe(before);
  });

  test("changed runtime defaults refuse resume before dispatch", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    const before = await driver.journalBytes();
    await driver.changeRuntimeConfig();

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes()).toBe(before);
  });

  test("unchanged binary instructions preserve the pinned author session", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await appendFile(join(driver.repo, ".gitignore"), "AGENTS.md\n");
    await writeFile(join(driver.repo, "AGENTS.md"), Buffer.from([0, 0xff, 0xfe, 0x80]));
    await driver.run("step", "DOT-1", ...pinned);
    const before = JSON.parse((await driver.journalBytes()) ?? "null");

    const result = await driver.run("resume", "DOT-1", ...pinned);
    const after = JSON.parse((await driver.journalBytes()) ?? "null");

    expect(result.code).toBe(2);
    expect(result.calls).toHaveLength(2);
    expect(result.argsSeen).toContain("--resume=s-build");
    expect(after.attempts[1].runtime).toEqual(before.attempts[0].runtime);
    expect(after.attempts[1].sessionId).toBe(before.attempts[0].sessionId);
  });

  test.each([
    { name: "literal absent", before: undefined, after: Buffer.from("absent") },
    { name: "empty file", before: undefined, after: Buffer.alloc(0) },
    { name: "binary file", before: undefined, after: Buffer.from([0, 0xff]) },
    { name: "binary bytes", before: Buffer.from([0xff]), after: Buffer.from([0xfe]) },
  ])("changed instruction $name refuses before another attempt", async ({ before, after }) => {
    const driver = await harness.seed({ stall: "build", status: "Build", runBudget: "10" });
    await driver.setRuntimeInstruction(before);
    await driver.run("step", "DOT-1", ...pinned);
    const journal = await driver.journalBytes();
    const claims = await driver.claimBytes();
    await driver.setRuntimeInstruction(after);

    const result = await driver.run("resume", "DOT-1", ...pinned);

    await expectUnchangedResumeRefusal({ driver, result, journal, claims });
  });

  test("instruction boundaries cannot hide changed file contents", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    const first = join(driver.repo, "CLAUDE.local.md");
    const second = join(driver.repo, "AGENTS.md");
    const secondIdentity = join(await realpath(driver.repo), "AGENTS.md");
    await appendFile(join(driver.repo, ".gitignore"), "CLAUDE.local.md\nAGENTS.md\n");
    await writeFile(first, "");
    await writeFile(second, `${secondIdentity}instruction`);
    await driver.run("step", "DOT-1", ...pinned);
    const journal = await driver.journalBytes();
    const claims = await driver.claimBytes();
    await writeFile(first, secondIdentity);
    await writeFile(second, "instruction");

    const result = await driver.run("resume", "DOT-1", ...pinned);

    await expectUnchangedResumeRefusal({ driver, result, journal, claims });
  });

  test("a recorded unframed Claude fingerprint requires a fresh step", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    await driver.replaceRecordedRuntimeFingerprint(await legacyClaudeFingerprint(driver));
    const journal = await driver.journalBytes();
    const claims = await driver.claimBytes();

    const result = await driver.run("resume", "DOT-1", ...pinned);

    await expectUnchangedResumeRefusal({ driver, result, journal, claims });
  });

  test("native bookkeeping updates preserve compatible pinned resume", async () => {
    const driver = await harness.seed({
      stall: "build",
      status: "Build",
      runtimeBookkeeping: true,
    });
    await driver.run("step", "DOT-1", ...pinned);

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(2);
    expect(result.calls).toHaveLength(2);
    expect(result.argsSeen).toContain("--resume=s-build");
  });

  test("changed native tool configuration refuses resume before dispatch", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    const before = await driver.journalBytes();
    await driver.changeRuntimeMcp();

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes()).toBe(before);
  });

  test.each(["enabledMcpServers", "disabledMcpServers"] as const)(
    "changed native %s toggle refuses resume before dispatch",
    async (field) => {
      const driver = await harness.seed({ stall: "build", status: "Build" });
      await driver.setRuntimeMcpToggle(field, ["example"]);
      await driver.run("step", "DOT-1", ...pinned);
      const before = await driver.journalBytes();
      await driver.setRuntimeMcpToggle(field, []);

      const result = await driver.run("resume", "DOT-1", ...pinned);

      expect(result.code).toBe(1);
      expect(result.calls).toHaveLength(1);
      expect(await driver.journalBytes()).toBe(before);
    },
  );

  test("changed MCP environment expansion refuses resume before dispatch", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.run("step", "DOT-1", ...pinned);
    await driver.setRuntimeMcpEnvironment("https://first.example.invalid");
    await driver.run("step", "DOT-1", ...pinned);
    const before = await driver.journalBytes();
    await driver.setRuntimeMcpEnvironment("https://second.example.invalid");

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(2);
    expect(await driver.journalBytes()).toBe(before);
  });

  test("a runtime FIFO is refused without waiting for a writer", async () => {
    const driver = await harness.seed();
    await driver.blockRuntimeConfig();

    const result = await driver.run("step", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
    expect(JSON.parse((await driver.run("status", "DOT-1")).stdout).attempts).toEqual([]);
  }, 6000);

  test("a runtime symlink to a regular file preserves compatible resume", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build" });
    await driver.linkRuntimeConfig();
    await driver.run("step", "DOT-1", ...pinned);

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(2);
    expect(result.calls).toHaveLength(2);
  });

  test("unreadable runtime configuration gives a local refusal before any attempt", async () => {
    const driver = await harness.seed();
    await driver.breakRuntimeConfig();

    const result = await driver.run("step", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
    expect(result.stderr).toContain("runtime configuration");
    expect(result.stderr).not.toContain("at runtimeContract");
  });

  test("version preflight terminates its signal-resistant process group", async () => {
    const driver = await harness.seed({ versionDescendant: true });

    const result = await driver.run("step", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
    expect((await driver.versionProcesses()).every((child) => !child.running)).toBe(true);
    expect(JSON.parse((await driver.run("status", "DOT-1")).stdout).attempts).toEqual([]);
  }, 6000);

  test("provider-held missing history records one failed resume without fresh fallback", async () => {
    const driver = await harness.seed({
      stall: "build",
      status: "Build",
      missingHistory: true,
    });
    await driver.run("step", "DOT-1", ...pinned);

    const result = await driver.run("resume", "DOT-1", ...pinned);
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(2);
    expect(result.argsSeen).toContain("--resume=s-build");
    expect(state.attempts).toHaveLength(2);
    expect(state.attempts[1]).toMatchObject({ status: "failed", sessionId: "s-build" });
  });

  test("a resumed Claude session that reports another model than its pin fails", async () => {
    const driver = await harness.seed({ stall: "build", status: "Build", resumedModel: "opus" });
    await driver.run("step", "DOT-1", "--provider", "claude", ...pinned);

    const result = await driver.run("resume", "DOT-1", "--provider", "claude", ...pinned);
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.code).toBe(1);
    expect(result.argsSeen).toContain("--resume=s-build");
    expect(state.attempts[1]).toMatchObject({ status: "failed", sessionId: "s-build" });
    expect(result.stderr).toContain("the resumed session did not establish the pinned model");
  });

  test("a nonexistent resume never creates a journal", async () => {
    const driver = await harness.seed();

    const result = await driver.run("resume", "DOT-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toEqual([]);
    expect(await driver.journalBytes()).toBeUndefined();
  });

  test("a resumed invocation cap does not add cumulative prior spend", async () => {
    const driver = await harness.seed({
      stall: "build",
      status: "Build",
      budget: "0.12",
      reportedCosts: ["0.1299368", "0.1330568"],
    });
    await driver.run("step", "DOT-1", ...pinned);

    const result = await driver.run("resume", "DOT-1", ...pinned);
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.code).toBe(2);
    expect(result.argsSeen.split("--max-budget-usd=0.12")).toHaveLength(3);
    expect(state.attempts[1].costUsd).toBe(0.003_12);
    expect(state.totals.knownCostUsd).toBe(0.133_056_8);
  });

  test("an incomplete earlier cost receipt cannot prove a capped attempt fully known", async () => {
    const driver = await harness.seed({
      stall: "build",
      status: "Build",
      afterResult: true,
    });
    await driver.run("step", "DOT-1");

    const result = await driver.run("step", "DOT-1");
    const state = JSON.parse((await driver.run("status", "DOT-1")).stdout);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(state.attempts[0]).toMatchObject({
      status: "failed",
      costUsd: 0.1,
      accountingComplete: false,
    });
    expect(state.totals.unknownCostAttempts).toBe(1);
  });

  test("Done validation starts no agent after six failed attempts", async () => {
    const driver = await harness.seed({ failedResult: true });
    await driver.steps("DOT-1", 6);
    await driver.setStatus("Done");

    const result = await driver.run("step", "DOT-1");

    expect(result.code).toBe(0);
    expect(result.calls).toHaveLength(6);
  }, 20_000);
});
