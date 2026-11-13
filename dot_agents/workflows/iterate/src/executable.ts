import { existsSync } from "node:fs";
import { realpath } from "node:fs/promises";
import { delimiter, isAbsolute } from "node:path";
import process from "node:process";
import { which } from "bun";
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
 * The file the first `backlog` on PATH resolves to, passing over mise shims: a shim resolves to
 * mise itself, which reports its own version and runs as mise when called by that path.
 */
export async function backlogExecutable(
  path: string = process.env.PATH ?? "",
): Promise<string | undefined> {
  const mise = which("mise", { PATH: path });
  const shimTarget = mise ? await realpath(mise) : undefined;

  for (const directory of path.split(delimiter)) {
    const candidate = which("backlog", { PATH: directory });
    if (!candidate) continue;

    const resolved = await realpath(candidate);
    if (resolved !== shimTarget) return resolved;
  }

  return undefined;
}
