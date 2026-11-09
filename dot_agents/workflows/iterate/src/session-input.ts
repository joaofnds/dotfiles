import { z } from "zod";
import { agentSchema, stages } from "./agents.ts";
import { configuredSessionSchema } from "./provider-types.ts";

const text = z.string();

/** What the runner asks of one harness session, as it crosses into the session host. */
export const sessionInputSchema = z.object({
  agent: agentSchema,
  stage: z.enum(stages),
  card: text,
  systemPrompt: text,
  budget: text.exactOptional(),
  logDirectory: text.exactOptional(),
  resumeSessionId: text.exactOptional(),
  resumeConfiguration: configuredSessionSchema.exactOptional(),
  timeoutMs: z.number().exactOptional(),
  idleTimeoutMs: z.number().exactOptional(),
});
export type SessionInput = Readonly<z.infer<typeof sessionInputSchema>>;
