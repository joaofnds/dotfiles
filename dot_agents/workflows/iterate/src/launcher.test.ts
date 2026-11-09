import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "bun";

// The launcher lives in the chezmoi source beside this workflow, not in its installed copy.
const launcher = join(import.meta.dir, "..", "..", "..", "..", "dot_scripts", "executable_iterate");

describe.skipIf(!existsSync(launcher))("the iterate launcher", () => {
  let home: string;
  let bin: string;
  let folder: string;

  beforeEach(async () => {
    home = await realpath(await mkdtemp(join(tmpdir(), "iterate-launcher-")));
    bin = join(home, "bin");
    folder = join(home, "project");
    await mkdir(bin);
    await mkdir(folder);
    await executable(
      "bun",
      `[ "$1" = install ] && exit 0\nprintf '%s|%s|%s' "\${CLAUDE_CONFIG_DIR-unset}" "$PWD" "$*"`,
    );
  });

  afterEach(async () => {
    await rm(home, { recursive: true, force: true });
  });

  async function executable(name: string, body: string) {
    await writeFile(join(bin, name), `#!/bin/sh\n${body}\n`);
    await chmod(join(bin, name), 0o755);
  }

  async function fakeMise({ envStatus }: { envStatus: number }) {
    await executable(
      "mise",
      [
        'case " $* " in',
        `  *" env "*) exit ${envStatus} ;;`,
        `  *" hook-env "*) echo "export CLAUDE_CONFIG_DIR=/from/mise" ;;`,
        "esac",
      ].join("\n"),
    );
  }

  function launch() {
    return spawnSync(["/bin/bash", launcher, "step", "CARD-1"], {
      cwd: folder,
      env: { HOME: home, PATH: `${bin}:/usr/bin:/bin`, CLAUDE_CONFIG_DIR: "/from/caller" },
    });
  }

  test("runs the workflow with the account the folder's mise config names", async () => {
    await fakeMise({ envStatus: 0 });

    const result = launch();

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe(
      `/from/mise|${folder}|${home}/.agents/workflows/iterate/src/main.ts step CARD-1`,
    );
  });

  test("refuses to run where mise rejects the folder's config", async () => {
    await fakeMise({ envStatus: 1 });

    const result = launch();

    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
  });

  test("keeps the caller's environment where mise is not installed", () => {
    const result = launch();

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toStartWith("/from/caller|");
  });
});
