import process from "node:process";
import { stdin } from "bun";
import { z } from "zod";
import { diagnostic } from "./exit.ts";
import { harnessFor } from "./provider.ts";
import { InvalidProviderMessage } from "./provider-types.ts";
import { sessionInputSchema } from "./session-input.ts";

// The session's process-group leader. The vendor SDK and the CLI it starts run as its
// descendants, so cancelling the group stops all of them.

const { input, executable } = z
  .object({ input: sessionInputSchema, executable: z.string() })
  .parse(JSON.parse(await stdin.text()));
const write = (line: unknown) => process.stdout.write(`${JSON.stringify(line)}\n`);
// The session stops a run by signalling the whole group, which ends the CLI. Outliving
// that signal lets the SDK see the CLI exit and remove the files it wrote, such as the
// schema file Codex reads. A second signal ends the host at once.
let stopped = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    stopped = true;
  });
try {
  for await (const message of harnessFor(input.agent.provider).run(input, { executable }))
    write(message);
} catch (error) {
  // An unreadable message leaves the session unobserved. Any other failure, such as
  // the provider exiting nonzero, is the provider's own error after what it reported.
  // The diagnostic also goes to stderr, since an SDK can hold the CLI's stderr until
  // it fails and the session log keeps only what reaches this process.
  // A run the session stopped already carries the session's reason for stopping it.
  process.stderr.write(`${diagnostic(error)}\n`);
  if (!stopped)
    write(
      error instanceof InvalidProviderMessage
        ? { failure: diagnostic(error) }
        : { events: [{ type: "error", message: diagnostic(error) }] },
    );
  process.exitCode = 1;
}
