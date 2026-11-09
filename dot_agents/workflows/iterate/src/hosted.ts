import { join } from "node:path";
import process from "node:process";
import { which } from "bun";
import { z } from "zod";
import { definedFields } from "./defined-fields.ts";
import {
  configuredSessionSchema,
  type Harness,
  type HarnessAdapter,
  type ProviderEvent,
} from "./provider-types.ts";
import { costSchema, usageSchema } from "./usage.ts";

const host = join(import.meta.dir, "harness-host.ts");
const text = z.string();
const count = z.number().int().nonnegative();
const eventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("model_reroute"),
    receipt: z.object({ fromModel: text, toModel: text, reason: text }),
  }),
  z.object({
    type: z.literal("configured_session"),
    configuration: configuredSessionSchema,
  }),
  z.object({
    type: z.literal("tool_outcome"),
    outcome: z.object({ itemId: text, kind: text, status: text, raw: z.unknown() }),
  }),
  z.object({ type: z.literal("required_tool_coverage"), coverage: z.literal("unknown") }),
  z.object({ type: z.literal("text"), text }),
  z.object({ type: z.literal("tool_call"), name: text, args: text }),
  z.object({ type: z.literal("result"), result: text }),
  z.object({ type: z.literal("session_id"), sessionId: text }),
  z.object({ type: z.literal("resolved_model"), model: text }),
  z.object({ type: z.literal("effective_effort"), effort: text }),
  z.object({ type: z.literal("permission_mode"), mode: text }),
  z.object({ type: z.literal("permission_denials"), count }),
  z.object({ type: z.literal("task_started"), taskId: text, description: text }),
  z.object({ type: z.literal("task_killed"), taskId: text }),
  z.object({ type: z.literal("error"), message: text }),
  z.object({
    type: z.literal("usage"),
    receiptId: text.exactOptional(),
    turns: count.exactOptional(),
    cost: costSchema.exactOptional(),
    usage: usageSchema,
  }),
  z.object({ type: z.literal("complete") }),
]);

/** Runs a harness in its own host process, one event per output line. */
// The host reports a harness failure as a line, so the session treats it as unobserved
// output, the same as a provider line it could not read.
const lineSchema = z.union([
  z.object({ message: z.unknown().optional(), events: z.array(eventSchema) }),
  z.object({ failure: text }),
]);

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
