import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";
import process from "node:process";
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
