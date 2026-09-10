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

  test("accepts max for codex models", () => {
    const agents = agentsFromSpec("build=codex:gpt-5.6-luna:max");

    expect(agents.get("build")).toEqual({
      provider: "codex",
      model: "gpt-5.6-luna",
      effort: "max",
    });
  });
});
