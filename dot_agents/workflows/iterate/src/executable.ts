import { existsSync } from "node:fs";
import { realpath } from "node:fs/promises";
import { basename, delimiter, isAbsolute } from "node:path";
import process from "node:process";
import { spawnSync, which } from "bun";
import { z } from "zod";
import type { HarnessProfile } from "./provider-types.ts";

/** The CLI a harness runs: the absolute path `ITERATE_<PROVIDER>_CLI` names, else its SDK's own. */
export function executableFor(
  harness: HarnessProfile,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  const executable =
    env[`ITERATE_${harness.provider.toUpperCase()}_CLI`] || harness.bundledExecutable();

  return executable !== undefined && isAbsolute(executable) && existsSync(executable)
    ? executable
    : undefined;
}

const moduleNotFound = z.object({ code: z.literal("MODULE_NOT_FOUND") });

/** Resolves an installed package file, or undefined where the package is not installed. */
export function resolveModule(require: NodeJS.Require, specifier: string): string | undefined {
  try {
    return require.resolve(specifier);
  } catch (error) {
    if (moduleNotFound.safeParse(error).success) return undefined;

    throw error;
  }
}

/**
 * The file `backlog` runs from on this PATH. A mise shim is a link to mise, which reports its own
 * version and runs as mise when called by that path, so a shim is resolved the way it dispatches:
 * the backlog mise activates for the working directory, else the next `backlog` on PATH.
 */
export async function backlogExecutable(
  searchPath: string = process.env.PATH ?? "",
): Promise<string | undefined> {
  for (const directory of searchPath.split(delimiter)) {
    const candidate = which("backlog", { PATH: directory });
    if (!candidate) continue;

    const resolved = await realpath(candidate);
    if (basename(resolved) !== "mise") return resolved;

    const activated = miseActivated(resolved, searchPath);
    if (activated) return realpath(activated);
  }

  return undefined;
}

function miseActivated(mise: string, searchPath: string): string | undefined {
  const answer = spawnSync([mise, "which", "backlog"], {
    env: { ...process.env, PATH: searchPath },
    stdout: "pipe",
    stderr: "ignore",
  });
  const path = answer.stdout.toString().trim();

  return answer.exitCode === 0 && isAbsolute(path) ? path : undefined;
}
