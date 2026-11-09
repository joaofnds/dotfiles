import { join } from "node:path";
import process from "node:process";
import { which } from "bun";
import { z } from "zod";
import { definedFields } from "./defined-fields.ts";
import {
  type Harness,
  type HarnessAdapter,
  type ProviderEvent,
  providerEventSchema,
} from "./provider-types.ts";

const host = join(import.meta.dir, "harness-host.ts");

// The host reports a harness failure as a line, so the session treats it as unobserved
// output, the same as a provider line it could not read.
const lineSchema = z.union([
  z.object({ message: z.unknown().optional(), events: z.array(providerEventSchema) }),
  z.object({ failure: z.string() }),
]);

/** Runs a harness in its own host process, which writes one line per SDK message. */
export function hosted(harness: Harness): HarnessAdapter {
  return {
    provider: harness.provider,
    displayName: harness.displayName,
    executableName: harness.executableName,
    summary: harness.summary,
    capabilities: harness.capabilities,
    providerCompletion: harness.providerCompletion,
    resume: harness.resume,
    runtimeContract: harness.runtimeContract,
    command: (input) => {
      harness.admit?.(input);
      const executable = which(harness.executableName);

      return Object.assign(
        { argv: [process.execPath, host], stdin: JSON.stringify({ input, executable }) },
        definedFields({
          permissionMode: harness.permissionMode,
          unavailable: executable ? undefined : `${harness.provider} executable is unavailable`,
        }),
      );
    },
    decode: (line) => {
      const parsed = lineSchema.parse(JSON.parse(line));
      if ("failure" in parsed) throw new Error(parsed.failure);

      const events: ProviderEvent[] = parsed.events;
      return events;
    },
  };
}
