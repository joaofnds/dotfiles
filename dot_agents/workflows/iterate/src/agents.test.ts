import { describe, expect, test } from "bun:test";
import {
  type AgentSelection,
  agentForRole,
  agentForStage,
  agentFromArgs,
  agentPlanFromArgs,
  defaultAgent,
  resolveInvocation,
  roles,
  type Stage,
  selectionForRole,
  selectionForStage,
  stages,
  supervisedPlanSchema,
} from "./agents.ts";
import { Exit } from "./exit.ts";
import { validateAgentSelection } from "./provider.ts";

describe(agentFromArgs.name, () => {
  test("uses Claude CLI defaults when agent options are omitted", () => {
    expect(agentFromArgs([])).toEqual(defaultAgent);
  });

  test("parses the explicit Claude interface", () => {
    expect(
      agentFromArgs(["--provider", "claude", "--model", "sonnet", "--effort", "high"]),
    ).toEqual({ provider: "claude", model: "sonnet", effort: "high" });
  });

  test.each([
    ["unsupported provider", ["--provider", "unavailable"]],
    ["unknown option", ["--agent", "claude"]],
    ["missing value", ["--model"]],
    ["duplicate option", ["--model", "opus", "--model", "sonnet"]],
    ["invalid effort", ["--effort", "extreme"]],
  ])("refuses an %s", (_name, args) => {
    expect(() => agentFromArgs(args)).toThrow();
  });
});

describe(agentPlanFromArgs.name, () => {
  test("selects an agent only for its named stage", () => {
    const plan = agentPlanFromArgs(["--build-agent", "claude:sonnet:high"]);

    expect(agentForStage(plan, "shape")).toEqual(defaultAgent);
    expect(agentForStage(plan, "build")).toEqual({
      provider: "claude",
      model: "sonnet",
      effort: "high",
    });
    expect(agentForStage(plan, "review")).toEqual(defaultAgent);
  });

  test("accepts one selection for every executable stage", () => {
    const expected = [
      [
        "shape",
        "claude:shape-model:low",
        { provider: "claude", model: "shape-model", effort: "low" },
      ],
      [
        "debug",
        "claude:debug-model:medium",
        { provider: "claude", model: "debug-model", effort: "medium" },
      ],
      [
        "verify",
        "claude:verify-model:high",
        { provider: "claude", model: "verify-model", effort: "high" },
      ],
      [
        "build",
        "claude:build-model:xhigh",
        { provider: "claude", model: "build-model", effort: "xhigh" },
      ],
      [
        "review",
        "claude:review-model:max",
        { provider: "claude", model: "review-model", effort: "max" },
      ],
    ] as const;
    const options = expected.flatMap(([stage, selection]) => [`--${stage}-agent`, selection]);
    const plan = agentPlanFromArgs(options);

    for (const [stage, _selection, agent] of expected) {
      expect(agentForStage(plan, stage)).toEqual(agent);
    }
  });

  test("defers an invalid provider effort until its stage is selected", () => {
    const plan = agentPlanFromArgs(["--build-agent", "claude:sonnet:ultra"]);

    expect(agentForStage(plan, "shape")).toEqual(defaultAgent);
    expect(() => agentForStage(plan, "build")).toThrow("claude effort is one of");
  });

  test("names the requested options when a deferred stage selection is refused", () => {
    const plan = agentPlanFromArgs(["--build-agent", "claude:sonnet:ultra"]);

    expect(() => agentForStage(plan, "build")).toThrow(
      "requested options: --build-agent claude:sonnet:ultra",
    );
  });

  test("keeps direct per-invocation options", () => {
    const plan = agentPlanFromArgs(["--provider", "claude", "--model", "sonnet"]);

    expect(agentForStage(plan, "review")).toEqual({ provider: "claude", model: "sonnet" });
  });

  test.each([
    ["malformed selection", ["--build-agent", "claude"]],
    ["extra selection field", ["--build-agent", "claude:sonnet:high:extra"]],
    ["duplicate stage", ["--build-agent", "claude:opus", "--build-agent", "claude:sonnet"]],
    ["mixed direct and stage options", ["--model", "opus", "--build-agent", "claude:sonnet"]],
  ])("refuses %s", (_name, args) => {
    expect(() => agentPlanFromArgs(args)).toThrow();
  });
});

describe("stage scalar selection", () => {
  test("overrides build effort without changing its model", () => {
    const plan = agentPlanFromArgs(["--build-effort", "high"]);

    expect(agentForStage(plan, "build")).toEqual({ provider: "claude", effort: "high" });
  });
});

describe(selectionForStage.name, () => {
  const scenarios: { name: string; options: [string, string][]; expected: AgentSelection }[] = [
    {
      name: "inherits defaults",
      options: [],
      expected: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
    },
    {
      name: "overrides only model",
      options: [["model", "stage-model"]],
      expected: { provider: "codex", model: "stage-model", effort: "high" },
    },
    {
      name: "overrides only effort",
      options: [["effort", "ultra"]],
      expected: { provider: "codex", model: "gpt-6.1-sol", effort: "ultra" },
    },
    {
      name: "overrides both fields",
      options: [
        ["model", "stage-model"],
        ["effort", "medium"],
      ],
      expected: { provider: "codex", model: "stage-model", effort: "medium" },
    },
    {
      name: "replaces the complete tuple",
      options: [["agent", "claude:sonnet:low"]],
      expected: { provider: "claude", model: "sonnet", effort: "low" },
    },
    {
      name: "resets omitted tuple effort",
      options: [["agent", "codex:gpt-6-luna"]],
      expected: { provider: "codex", model: "gpt-6-luna" },
    },
    {
      name: "applies scalars after tuples",
      options: [
        ["effort", "medium"],
        ["model", "overridden"],
        ["agent", "claude:sonnet:low"],
      ],
      expected: { provider: "claude", model: "overridden", effort: "medium" },
    },
  ];
  const cases: {
    stage: Stage;
    name: string;
    pairs: string[][];
    expected: AgentSelection;
    unaffectedStage: Stage;
  }[] = stages.flatMap((stage) =>
    scenarios.map(({ name, options, expected }) => ({
      stage,
      name,
      pairs: options.map(([field, value]) => [`--${stage}-${field}`, value]),
      expected,
      unaffectedStage: stage === "build" ? "shape" : "build",
    })),
  );
  test.each(cases)(
    "$stage $name independently of argument order",
    ({ stage, pairs, expected, unaffectedStage }) => {
      const defaults = [
        "--default-provider",
        "codex",
        "--default-model",
        "gpt-6.1-sol",
        "--default-effort",
        "high",
      ];
      const first = agentPlanFromArgs([...defaults, ...pairs.flat()]);
      const reordered = agentPlanFromArgs([...pairs.toReversed().flat(), ...defaults]);

      expect(selectionForStage(first, stage)).toEqual(expected);
      expect(selectionForStage(reordered, stage)).toEqual(expected);
      expect(selectionForStage(first, unaffectedStage)).toEqual({
        provider: "codex",
        model: "gpt-6.1-sol",
        effort: "high",
      });
    },
  );
});

describe(selectionForRole.name, () => {
  const overriddenStage = [
    "--default-provider",
    "codex",
    "--default-model",
    "gpt-6.1-sol",
    "--default-effort",
    "low",
    "--build-agent",
    "claude:sonnet:high",
  ];
  test.each([...roles])("inherits an overridden enclosing stage for %s", (role) => {
    const plan = agentPlanFromArgs(overriddenStage);

    expect(selectionForRole({ plan, stage: "build", role })).toEqual({
      provider: "claude",
      model: "sonnet",
      effort: "high",
    });
  });

  test.each([...roles])("keeps the overridden stage when effort is assigned for %s", (role) => {
    const plan = agentPlanFromArgs(overriddenStage);

    expect(selectionForRole({ plan, stage: "build", role, assignedEffort: "medium" })).toEqual({
      provider: "claude",
      model: "sonnet",
      effort: "medium",
    });
  });

  test.each([...roles])("inherits provider, model and effort for %s", (role) => {
    const plan = agentPlanFromArgs([
      "--default-provider",
      "codex",
      "--default-model",
      "gpt-6.1-sol",
      "--default-effort",
      "high",
    ]);

    expect(selectionForRole({ plan, stage: "review", role })).toEqual({
      provider: "codex",
      model: "gpt-6.1-sol",
      effort: "high",
    });
  });

  test.each([...roles])("retains assigned effort for %s", (role) => {
    const plan = agentPlanFromArgs(["--default-effort", "high"]);

    expect(selectionForRole({ plan, stage: "review", role, assignedEffort: "medium" })).toEqual({
      provider: "claude",
      effort: "medium",
    });
  });

  test.each([...roles])("replaces assigned effort with the explicit tuple for %s", (role) => {
    const plan = agentPlanFromArgs([
      "--default-model",
      "sonnet",
      "--default-effort",
      "high",
      "--role-agent",
      `${role}=codex:gpt-6.1-sol`,
    ]);

    expect(selectionForRole({ plan, stage: "review", role, assignedEffort: "medium" })).toEqual({
      provider: "codex",
      model: "gpt-6.1-sol",
    });
  });

  test.each([...roles])("applies scalar overrides after tuples for %s in either order", (role) => {
    const pairs = [
      ["--role-effort", `${role}=high`],
      ["--role-model", `${role}=gpt-6.1-sol`],
      ["--role-agent", `${role}=codex:old:low`],
    ];
    const plan = agentPlanFromArgs(pairs.flat());
    const reordered = agentPlanFromArgs(pairs.toReversed().flat());

    expect(selectionForRole({ plan, stage: "build", role, assignedEffort: "medium" })).toEqual({
      provider: "codex",
      model: "gpt-6.1-sol",
      effort: "high",
    });
    expect(
      selectionForRole({ plan: reordered, stage: "build", role, assignedEffort: "medium" }),
    ).toEqual({ provider: "codex", model: "gpt-6.1-sol", effort: "high" });
  });

  test("isolates verify investigation effort from nested reviewers and stage inventory", () => {
    const plan = agentPlanFromArgs(["--default-effort", "low", "--verify-effort", "high"]);

    expect(stages).toEqual(["shape", "debug", "verify", "build", "review"]);
    expect(selectionForStage(plan, "verify")).toEqual({ provider: "claude", effort: "high" });
    expect(
      selectionForRole({ plan, stage: "review", role: "reviewer", assignedEffort: "medium" }),
    ).toEqual({ provider: "claude", effort: "medium" });
  });
});

describe("role scalar fields", () => {
  test.each([...roles])("preserves assigned effort under a model-only override for %s", (role) => {
    const plan = agentPlanFromArgs([
      "--default-model",
      "sonnet",
      "--default-effort",
      "high",
      "--role-model",
      `${role}=opus`,
    ]);

    expect(selectionForRole({ plan, stage: "review", role, assignedEffort: "medium" })).toEqual({
      provider: "claude",
      model: "opus",
      effort: "medium",
    });
  });

  test.each([...roles])("overrides assigned effort without changing the model for %s", (role) => {
    const plan = agentPlanFromArgs([
      "--default-model",
      "sonnet",
      "--default-effort",
      "high",
      "--role-effort",
      `${role}=low`,
    ]);

    expect(selectionForRole({ plan, stage: "review", role, assignedEffort: "medium" })).toEqual({
      provider: "claude",
      model: "sonnet",
      effort: "low",
    });
  });

  test.each([...roles])(
    "uses an explicit tuple effort instead of assigned effort for %s",
    (role) => {
      const plan = agentPlanFromArgs([
        "--default-model",
        "sonnet",
        "--role-agent",
        `${role}=codex:gpt-6.1-sol:high`,
      ]);

      expect(selectionForRole({ plan, stage: "build", role, assignedEffort: "medium" })).toEqual({
        provider: "codex",
        model: "gpt-6.1-sol",
        effort: "high",
      });
    },
  );
});

describe("selection rejection", () => {
  test.each(
    [
      ["--default-model", "a", "--default-model", "b"],
      ["--build-effort", "high", "--build-effort", "low"],
      ["--role-model", "advisor=a", "--role-model", "advisor=b"],
      ["--role-agent", "screener=claude:a", "--role-agent", "screener=claude:b"],
      ["--build-agent", "claude:a:"],
      ["--build-agent", "claude::high"],
      ["--build-agent", ":a"],
      ["--build-agent", "claude:a:high:extra"],
      ["--build-agent", "unknown:a"],
      ["--default-provider", "unknown"],
      ["--role-model", "verifier=a"],
      ["--verifier-effort", "high"],
      ["--role-effort", "advisor=high=extra"],
      ["--role-effort", "advisor="],
      ["--role-agent", "advisor=claude"],
      ["--role-efforts", "advisor=high"],
      ["--model", "sonnet", "--default-effort", "high"],
      ["--provider", "claude", "--role-model", "advisor=sonnet"],
      ["--build-model", "two words"],
      ["--build-agent", "claude:a", "--unknown", "a"],
    ].map((args) => ({ args })),
  )("refuses invalid syntax %j", ({ args }) => {
    expect(() => agentPlanFromArgs(args)).toThrow();
  });

  test("defers invalid future-stage effort until that stage is reached", () => {
    const plan = agentPlanFromArgs(["--build-agent", "claude:sonnet:ultra"]);

    expect(agentForStage(plan, "shape")).toEqual(defaultAgent);
    expect(() => agentForStage(plan, "build")).toThrow("claude effort is one of");
  });
});

describe(resolveInvocation.name, () => {
  const savedArgs = [
    "--default-provider",
    "codex",
    "--default-model",
    "gpt-6.1-sol",
    "--default-effort",
    "high",
    "--role-effort",
    "reviewer=medium",
  ];
  const saved = supervisedPlanSchema.parse(agentPlanFromArgs(savedArgs).supervised);
  const different = ["--default-provider", "codex", "--default-model", "other"];

  test.each(["step", "resume"] as const)("keeps a flagless legacy %s direct", (invocation) => {
    const resolved = resolveInvocation({ args: [], invocation });

    expect(resolved).toEqual({ plan: { direct: defaultAgent }, action: "direct" });
  });

  test.each(["step", "resume"] as const)("reuses a flagless saved %s plan", (invocation) => {
    const restored = JSON.parse(JSON.stringify(saved));
    const resolved = resolveInvocation({ args: [], invocation, savedPlan: restored });

    expect(resolved).toEqual({ plan: { supervised: saved }, action: "reuse" });
    expect(selectionForStage(resolved.plan, "build")).toEqual({
      provider: "codex",
      model: "gpt-6.1-sol",
      effort: "high",
    });
  });

  test.each(["step", "resume"] as const)(
    "reuses equivalent reordered %s selections",
    (invocation) => {
      const args = [
        "--role-effort",
        "reviewer=medium",
        "--default-effort",
        "high",
        "--default-model",
        "gpt-6.1-sol",
        "--default-provider",
        "codex",
      ];

      expect(resolveInvocation({ args, invocation, savedPlan: saved })).toEqual({
        plan: { supervised: saved },
        action: "reuse",
      });
    },
  );

  test("creates a supervised plan from a fresh direct step", () => {
    const resolved = resolveInvocation({ args: ["--build-effort", "high"], invocation: "step" });

    expect(resolved.action).toBe("create");
    expect(selectionForStage(resolved.plan, "shape")).toEqual(defaultAgent);
    expect(selectionForStage(resolved.plan, "build")).toEqual({
      provider: "claude",
      effort: "high",
    });
  });

  test("replaces the complete saved request on a fresh step", () => {
    const before = structuredClone(saved);

    const resolved = resolveInvocation({ args: different, invocation: "step", savedPlan: saved });

    expect(resolved.action).toBe("replace");
    expect(resolved.previous).toEqual(before);
    expect(selectionForStage(resolved.plan, "build")).toEqual({
      provider: "codex",
      model: "other",
    });
    expect(selectionForRole({ plan: resolved.plan, stage: "review", role: "reviewer" })).toEqual({
      provider: "codex",
      model: "other",
    });
    expect(saved).toEqual(before);
  });

  test("allows successive direct calls to select different models", () => {
    const first = resolveInvocation({ args: ["--model", "sonnet"], invocation: "step" });
    const second = resolveInvocation({ args: ["--model", "opus"], invocation: "step" });

    expect(first).toEqual({
      action: "direct",
      plan: { direct: { provider: "claude", model: "sonnet" } },
    });
    expect(second).toEqual({
      action: "direct",
      plan: { direct: { provider: "claude", model: "opus" } },
    });
  });

  test.each([
    { invocation: "step" as const, args: ["--model", "sonnet"], savedPlan: saved },
    { invocation: "resume" as const, args: ["--provider", "claude"], savedPlan: saved },
    { invocation: "resume" as const, args: different, savedPlan: saved },
    { invocation: "step" as const, args: ["--default-model", "other"], savedPlan: saved },
    { invocation: "resume" as const, args: ["--build-effort", "high"] },
  ])("refuses incompatible invocation %j", (input) => {
    expect(() => resolveInvocation(input)).toThrow();
  });
});

describe(validateAgentSelection.name, () => {
  const capabilities = {
    resume: true,
    model: true,
    efforts: ["low", "medium", "high", "xhigh", "max", "ultra"],
    dollarCap: false,
    modelEfforts: {
      "gpt-6.1-sol": ["low", "medium", "high", "xhigh", "max", "ultra"],
      "gpt-6-luna": ["low", "medium", "high", "xhigh", "max"],
    },
  };

  test.each(
    ["constructor", "__proto__", "toString"].flatMap((model) => [
      { provider: "codex" as const, model },
      { provider: "codex" as const, model, effort: "high" },
    ]),
  )("refuses an inherited catalog name %j", (selection) => {
    expect(() => validateAgentSelection(selection, capabilities)).toThrow(Exit);
  });

  test("accepts a prototype-named model explicitly declared in the catalog", () => {
    const selectedCapabilities = { ...capabilities, modelEfforts: { constructor: ["high"] } };

    expect(() =>
      validateAgentSelection(
        { provider: "codex", model: "constructor", effort: "high" },
        selectedCapabilities,
      ),
    ).not.toThrow();
  });

  test.each([
    { model: "gpt-6.1-sol", effort: "ultra" },
    { model: "gpt-6-luna", effort: "max" },
  ])("accepts advertised effort for $model", ({ model, effort }) => {
    expect(() =>
      validateAgentSelection({ provider: "codex", model, effort }, capabilities),
    ).not.toThrow();
  });

  test("refuses a provider effort unavailable for the selected model", () => {
    expect(() =>
      validateAgentSelection(
        { provider: "codex", model: "gpt-6-luna", effort: "ultra" },
        capabilities,
      ),
    ).toThrow();
  });

  test("refuses unknown models when the adapter declares a model catalog", () => {
    expect(() =>
      validateAgentSelection({ provider: "codex", model: "unknown", effort: "high" }, capabilities),
    ).toThrow();
  });

  test("refuses unsupported model selection", () => {
    expect(() =>
      validateAgentSelection(
        { provider: "codex", model: "gpt-6.1-sol" },
        { ...capabilities, model: false },
      ),
    ).toThrow();
  });

  test("validates explicit role effort before native role dispatch", () => {
    const plan = agentPlanFromArgs(["--role-effort", "reviewer=ultra"]);

    expect(() =>
      agentForRole({ plan, stage: "review", role: "reviewer", assignedEffort: "medium" }),
    ).toThrow();
  });

  test("refuses invalid role efforts without fallback", () => {
    const plan = agentPlanFromArgs(["--role-agent", "advisor=claude:sonnet:ultra"]);

    expect(() => agentForRole({ plan, stage: "build", role: "advisor" })).toThrow();
  });
});
