import { join } from "node:path";
import process from "node:process";
import { z } from "zod";
import { definedFields } from "../defined-fields.ts";
import type { ProviderProtocol, SessionAdapter } from "../provider-types.ts";

const fixtureEvent = z.object({ phase: z.enum(["progress", "done"]), body: z.string() });
const protocolFixtureEvent = z.object({
  phase: z.enum(["done", "missing-final", "incomplete", "error", "config-error", "close", "noise"]),
  body: z.string(),
});

export function fixtureAdapter(transport: "argv" | "stdin"): SessionAdapter {
  return {
    provider: "fixture",
    providerCompletion: false,
    resume: { resolvedModelMustMatchPin: false },
    capabilities: {
      resume: false,
      model: false,
      efforts: [],
      promptTransport: transport,
      dollarCap: false,
    },
    command: (input) =>
      Object.assign(
        {
          argv: [
            "claude",
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
  | "protocol-cleanup-open"
  | "protocol-cleanup-eof"
  | "protocol-stalled"
  | "protocol-stalled-eof"
  | "protocol-delayed-receipt"
  | "protocol-noisy"
  | "protocol-repeated-close"
  | "protocol-missing-final"
  | "protocol-incomplete"
  | "protocol-error"
  | "protocol-config-error"
  | "protocol-malformed"
  | "protocol-nonzero"
  | "protocol-inherited-pipes"
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
    command: () =>
      Object.assign(
        {
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
        },
        definedFields({
          protocol: scenario.startsWith("protocol-") ? lifecycleProtocol() : undefined,
        }),
      ),
  };
}

function lifecycleProtocol(): ProviderProtocol {
  return {
    initialInput: "start\n",
    receive: (line) => {
      const event = protocolFixtureEvent.parse(JSON.parse(line));
      switch (event.phase) {
        case "done":
          return {
            events: [{ type: "result", result: event.body }, { type: "complete" }],
            close: true,
          };
        case "missing-final":
          return { events: [{ type: "complete" }], close: true };
        case "incomplete":
          return { events: [{ type: "result", result: event.body }], close: true };
        case "error":
          return {
            events: [
              { type: "result", result: event.body },
              { type: "complete" },
              { type: "error", message: "fixture terminal error" },
            ],
            close: true,
          };
        case "config-error":
          return { events: [{ type: "error", message: "fixture config error" }], close: true };
        case "close":
          return { events: [], close: true };
        case "noise":
          return { events: [] };
      }
    },
    end: () => {},
  };
}
