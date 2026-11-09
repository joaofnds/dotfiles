import { join } from "node:path";
import process from "node:process";
import { z } from "zod";
import { definedFields } from "./defined-fields.ts";
import { executableFor } from "./executable.ts";
import {
  type Harness,
  type HarnessAdapter,
  type ProviderEvent,
  providerEventSchema,
  type SessionInput,
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
  const { run: _run, admit: _admit, permissionMode: _permissionMode, ...profile } = harness;

  return Object.assign(profile, {
    command: (input: SessionInput) => {
      harness.admit?.(input);
      const executable = executableFor(harness);

      return Object.assign(
        { argv: [process.execPath, host], stdin: JSON.stringify({ input, executable }) },
        definedFields({
          permissionMode: harness.permissionMode,
          unavailable: executable ? undefined : `${harness.provider} executable is unavailable`,
        }),
      );
    },
    decode: (line: string) => {
      const parsed = lineSchema.parse(JSON.parse(line));
      if ("failure" in parsed) throw new Error(parsed.failure);

      const events: ProviderEvent[] = parsed.events;
      return events;
    },
  });
}
