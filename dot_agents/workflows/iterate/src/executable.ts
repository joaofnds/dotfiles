import { existsSync } from "node:fs";
import process from "node:process";
import type { HarnessProfile } from "./provider-types.ts";

/** The CLI a harness runs: the one `ITERATE_<PROVIDER>_CLI` names, else the one its SDK bundles. */
export function executableFor(
  harness: HarnessProfile,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  const executable =
    env[`ITERATE_${harness.provider.toUpperCase()}_CLI`] || harness.bundledExecutable();

  return executable !== undefined && existsSync(executable) ? executable : undefined;
}
