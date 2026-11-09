import { join } from "node:path";
import process from "node:process";
import { z } from "zod";
import { definedFields } from "../defined-fields.ts";
import type { SessionAdapter } from "../provider-types.ts";

const fixtureEvent = z.object({ phase: z.enum(["progress", "done"]), body: z.string() });

export function fixtureAdapter(transport: "argv" | "stdin"): SessionAdapter {
  return {
    provider: "fixture",
    providerCompletion: false,
    resume: { resolvedModelMustMatchPin: false },
    capabilities: {
      resume: false,
      model: false,
      efforts: [],
      dollarCap: false,
    },
    command: (input) =>
      Object.assign(
        {
          argv: [
            String(process.env.ITERATE_CLAUDE_CLI),
            `--fixture-${transport}`,
            ...(transport === "argv" ? [input.systemPrompt] : []),
          ],
        },
        definedFields({ stdin: transport === "stdin" ? input.systemPrompt : undefined }),
      ),
    decode: (line) => {
      const event = fixtureEvent.parse(JSON.parse(line));
      return event.phase === "progress"
        ? [{ type: "text", text: event.body }]
        : [{ type: "result", result: event.body }, { type: "complete" }];
    },
  };
}

export function startupInterruptionAdapter(
  signal: "INT" | "TERM",
  directory: string,
): SessionAdapter {
  return {
    ...fixtureAdapter("argv"),
    command: () => ({
      argv: [
        "/bin/sh",
        "-c",
        'printf "%s\\n" "$$" > "$1/spawned.pid"; kill -"$2" "$PPID"; exec /bin/sleep 30',
        "fixture",
        directory,
        signal,
      ],
    }),
  };
}

export type LifecycleScenario =
  | "missing-executable"
  | "stalled"
  | "closed-output"
  | "malformed-stalled"
  | "output-error"
  | "inherited-pipes"
  | "closed-descendant"
  | "escaped-pipes"
  | "success";

/** The rules a session judges its result by, overridable per lifecycle case. */
export type SessionRules = Partial<Pick<SessionAdapter, "providerCompletion" | "resume">>;

export function lifecycleAdapter(
  scenario: LifecycleScenario,
  directory: string,
  rules: SessionRules = {},
): SessionAdapter {
  return {
    ...fixtureAdapter("argv"),
    ...rules,
    command: () => ({
      argv:
        scenario === "missing-executable"
          ? [join(import.meta.dir, "missing-executable")]
          : [
              process.execPath,
              join(import.meta.dir, "session-fake.ts"),
              "--lifecycle",
              scenario,
              directory,
            ],
    }),
  };
}
