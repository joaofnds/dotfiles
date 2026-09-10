import { describe, expect, test } from "bun:test";
import { agentsFromSpec } from "./agents.ts";

describe(agentsFromSpec.name, () => {
  test.each(["low", "medium", "high", "xhigh"] as const)(
    "accepts the existing codex effort %s",
    (effort) => {
      const agents = agentsFromSpec(`build=codex:gpt-5.6-luna:${effort}`);

      expect(agents.get("build")).toEqual({
        provider: "codex",
        model: "gpt-5.6-luna",
        effort,
      });
    },
  );

  test.each(["debug", "verify"] as const)(
    "selects a provider for the %s investigation",
    (stage) => {
      const agents = agentsFromSpec(`${stage}=codex:gpt-6-astra:xhigh`);

      expect(agents.get(stage)).toEqual({
        provider: "codex",
        model: "gpt-6-astra",
        effort: "xhigh",
      });
    },
  );

  test("accepts max for codex models", () => {
    const agents = agentsFromSpec("build=codex:gpt-5.6-luna:max");

    expect(agents.get("build")).toEqual({
      provider: "codex",
      model: "gpt-5.6-luna",
      effort: "max",
    });
  });
});
