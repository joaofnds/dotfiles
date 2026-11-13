import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawnSync } from "bun";
import { claudeHarness } from "./claude.ts";
import { codexHarness, codexPathDirectories } from "./codex.ts";
import { backlogExecutable, executableFor } from "./executable.ts";

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

describe(backlogExecutable.name, () => {
  let directory: string;
  beforeEach(async () => {
    directory = realpathSync(await mkdtemp(join(tmpdir(), "iterate-backlog-executable-")));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  const program = async (path: string) => {
    await mkdir(join(directory, path, ".."), { recursive: true });
    await writeFile(join(directory, path), "#!/bin/sh\n", { mode: 0o755 });
    return join(directory, path);
  };
  const link = async (path: string, target: string) => {
    await mkdir(join(directory, path, ".."), { recursive: true });
    await symlink(target, join(directory, path));
  };
  const searchPath = (...directories: string[]) =>
    directories.map((name) => join(directory, name)).join(delimiter);

  test("returns the file the first backlog on PATH resolves to", async () => {
    const native = await program("cellar/backlog");
    await link("bin/backlog", native);

    const executable = await backlogExecutable(searchPath("bin"));

    expect(executable).toBe(native);
  });

  describe("when a mise shim comes first", () => {
    test("returns the backlog the shim would run", async () => {
      const mise = await program("mise/mise");
      await link("shims/backlog", mise);
      const native = await program("brew/backlog");

      const executable = await backlogExecutable(searchPath("shims", "mise", "brew"));

      expect(executable).toBe(native);
    });
  });

  describe("when PATH holds no backlog", () => {
    test("reports it unavailable", async () => {
      await program("brew/other");

      expect(await backlogExecutable(searchPath("brew"))).toBeUndefined();
    });
  });
});
