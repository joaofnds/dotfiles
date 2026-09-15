import { describe, expect, test } from "bun:test";
import { agentForStage, agentFromArgs, agentPlanFromArgs, defaultAgent } from "./agents.ts";

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
    ["unsupported provider", ["--provider", "codex"]],
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

  test("defers an unsupported provider until its stage is selected", () => {
    const plan = agentPlanFromArgs(["--build-agent", "agy:3.8-flash:high"]);

    expect(agentForStage(plan, "shape")).toEqual(defaultAgent);
    expect(() => agentForStage(plan, "build")).toThrow("agy is not implemented");
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
