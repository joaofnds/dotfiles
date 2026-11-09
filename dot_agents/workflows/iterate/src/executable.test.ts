import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "bun";
import { claudeHarness } from "./claude.ts";
import { codexHarness, codexPathDirectories } from "./codex.ts";
import { executableFor } from "./executable.ts";

const manifest = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dir, "..", "node_modules", name, "package.json"), "utf8"),
  );
const versionOf = (executable: string) =>
  spawnSync([executable, "--version"]).stdout.toString().trim();

describe(executableFor.name, () => {
  test.each([
    {
      harness: claudeHarness,
      version: `${manifest("@anthropic-ai/claude-agent-sdk").claudeCodeVersion} (Claude Code)`,
    },
    {
      harness: codexHarness,
      version: `codex-cli ${manifest("@openai/codex-sdk").dependencies["@openai/codex"]}`,
    },
  ])("returns the CLI release the $harness.provider SDK was built for", ({ harness, version }) => {
    const executable = executableFor(harness, {});

    expect(executable).toStartWith(join(import.meta.dir, "..", "node_modules"));
    expect(versionOf(executable ?? "")).toBe(version);
  });

  describe("when ITERATE_<PROVIDER>_CLI is set", () => {
    test("returns the CLI it names", () => {
      const executable = executableFor(codexHarness, { ITERATE_CODEX_CLI: "/bin/sh" });

      expect(executable).toBe("/bin/sh");
    });

    test("reports a relative path as unavailable", () => {
      const executable = executableFor(codexHarness, { ITERATE_CODEX_CLI: "sh" });

      expect(executable).toBeUndefined();
    });

    test("reports a path that does not exist as unavailable", () => {
      const executable = executableFor(claudeHarness, { ITERATE_CLAUDE_CLI: "/missing/claude" });

      expect(executable).toBeUndefined();
    });
  });
});

describe(codexPathDirectories.name, () => {
  test("puts the tools the bundled Codex ships on its PATH", () => {
    const directories = codexPathDirectories(executableFor(codexHarness, {}) ?? "");

    expect(directories).toHaveLength(1);
    expect(spawnSync([join(directories[0] ?? "", "rg"), "--version"]).exitCode).toBe(0);
  });

  test("adds nothing for a CLI outside the bundle", () => {
    expect(codexPathDirectories("/bin/sh")).toEqual([]);
  });
});
