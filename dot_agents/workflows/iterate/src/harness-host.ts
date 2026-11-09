import process from "node:process";
import { stdin } from "bun";
import { z } from "zod";
import { agentSchema, stages } from "./agents.ts";
import { diagnostic } from "./exit.ts";
import { InvalidProviderMessage } from "./hosted.ts";
import { harnessFor } from "./provider.ts";
import { configuredSessionSchema, type SessionInput } from "./provider-types.ts";

// The session's process-group leader. The vendor SDK and the CLI it starts run as its
// descendants, so cancelling the group stops all of them.
const text = z.string();
const inputSchema = z.object({
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

const { input, executable }: { input: SessionInput; executable: string } = z
  .object({ input: inputSchema, executable: text })
  .parse(JSON.parse(await stdin.text()));
const write = (line: unknown) => process.stdout.write(`${JSON.stringify(line)}\n`);
try {
  for await (const message of harnessFor(input.agent.provider).run(input, { executable }))
    write(message);
} catch (error) {
  // An unreadable message leaves the session unobserved. Any other failure, such as
  // the provider exiting nonzero, is the provider's own error after what it reported.
  write(
    error instanceof InvalidProviderMessage
      ? { failure: diagnostic(error) }
      : { events: [{ type: "error", message: diagnostic(error) }] },
  );
  process.exitCode = 1;
}
