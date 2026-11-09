import { describe, expect, test } from "bun:test";
import { spawnSync } from "bun";
import { claudeHarness } from "./claude.ts";
import { codexHarness } from "./codex.ts";
import { executableFor } from "./executable.ts";

describe(executableFor.name, () => {
  test.each([
    { harness: claudeHarness, version: "2.1.319 (Claude Code)" },
    { harness: codexHarness, version: "codex-cli 0.167.0" },
  ])("runs the CLI the $harness.provider SDK bundles", ({ harness, version }) => {
    const executable = executableFor(harness, {});

    const output = spawnSync([executable ?? "", "--version"])
      .stdout.toString()
      .trim();

    expect(executable).toContain("/node_modules/");
    expect(output).toBe(version);
  });

  test("runs the CLI the harness variable names instead", () => {
    const executable = executableFor(codexHarness, { ITERATE_CODEX_CLI: "/bin/sh" });

    expect(executable).toBe("/bin/sh");
  });

  test("reports a named CLI that does not exist as unavailable", () => {
    const executable = executableFor(claudeHarness, { ITERATE_CLAUDE_CLI: "/missing/claude" });

    expect(executable).toBeUndefined();
  });
});
