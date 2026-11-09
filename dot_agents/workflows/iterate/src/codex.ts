import { statSync } from "node:fs";
import { createRequire } from "node:module";
import { delimiter, dirname, join } from "node:path";
import process from "node:process";
import type { ThreadEvent, ThreadItem, ThreadOptions, Usage } from "@openai/codex-sdk";
import { z } from "zod";
import { codexCompletionError, codexCompletionOutputSchema } from "./codex-completion.ts";
import { codexRuntimeContract } from "./codex-runtime.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import { resolveModule } from "./executable.ts";
import { diagnostic } from "./exit.ts";
import {
  type ConfiguredSession,
  type Harness,
  type HarnessRun,
  InvalidProviderMessage,
  type ProviderEvent,
  type SessionInput,
} from "./provider-types.ts";

// Public model/list capture, Codex 0.166.0, 2026-11-04. Advertised capabilities,
// not entitlement, execution telemetry, or required-tool visibility guarantees.
const standardEfforts = ["low", "medium", "high", "xhigh", "max"] as const;
const extendedEfforts = [...standardEfforts, "ultra"] as const;
const toolKinds = ["command_execution", "file_change", "mcp_tool_call", "web_search"];

/** What the runner asked Codex for. The SDK reports no effective configuration. */
const codexConfigurationSchema = z.object({
  provenance: z.literal("codex.sdk.requested"),
  model: z.string().min(1).nullable(),
  effort: z.string().min(1).nullable(),
  cwd: z.string().min(1),
});

export const codexHarness: Harness = {
  provider: "codex",
  displayName: "Codex",
  bundledExecutable: bundledCodex,
  summary: "Codex runs through the Codex SDK with inherited native policy.",
  providerCompletion: true,
  runtimeContract: codexRuntimeContract,
  resume: {
    requiresEstablishedLocalInputs: true,
    resolvedModelMustMatchPin: false,
    configurationMatches: ({ previous, agent }) => {
      const configuration = codexConfigurationSchema.safeParse(previous.configuredSession).data;

      return (
        configuration !== undefined &&
        configuration.model === agent.model &&
        configuration.effort === agent.effort &&
        (previous.resolvedModel === undefined || previous.resolvedModel === agent.model)
      );
    },
  },
  capabilities: {
    resume: true,
    model: true,
    efforts: extendedEfforts,
    modelEfforts: {
      "gpt-6.1-sol": extendedEfforts,
      "gpt-6-astra": extendedEfforts,
      "gpt-6.1-terra": extendedEfforts,
      "gpt-6-sol": extendedEfforts,
      "gpt-5.6-sol": extendedEfforts,
      "gpt-5.6-terra": extendedEfforts,
      "gpt-reserve": standardEfforts,
      "gpt-6-luna": standardEfforts,
      "gpt-5.6-luna": standardEfforts,
      "codex-auto-review": standardEfforts,
    },
    dollarCap: false,
  },
  admit: (input) => {
    if (input.budget !== undefined) throw new Error("codex cannot enforce an explicit dollar cap");
    if (!input.resumeSessionId) return;
    // The SDK passes the ID as its own argument, so one that starts with a dash is a flag.
    if (input.resumeSessionId.startsWith("-"))
      throw new Error(`Codex resume ID ${input.resumeSessionId} is not a thread ID`);

    const previous = codexConfigurationSchema.safeParse(input.resumeConfiguration).data;
    if (
      input.stage === "review" ||
      !(input.agent.model && input.agent.effort) ||
      previous?.model !== input.agent.model ||
      previous.effort !== input.agent.effort ||
      previous.cwd !== process.cwd()
    ) {
      throw new Error(
        "Codex author resume requires matching pinned configuration; review starts fresh",
      );
    }
  },
  run: runCodex,
};

const codexTargets: Readonly<Record<string, string>> = {
  "darwin-arm64": "aarch64-apple-darwin",
  "darwin-x64": "x86_64-apple-darwin",
  "linux-arm64": "aarch64-unknown-linux-musl",
  "linux-x64": "x86_64-unknown-linux-musl",
};
// The two layouts the Codex SDK accepts inside a target directory, newest first.
const codexLayouts = [
  { executable: "bin/codex", marker: "codex-package.json", pathDirectory: "codex-path" },
  { executable: "codex/codex", marker: "codex/codex", pathDirectory: "path" },
] as const;

function bundledCodex(): string | undefined {
  const target = codexTargets[`${process.platform}-${process.arch}`];
  const platform = resolvePackage(`@openai/codex-${process.platform}-${process.arch}`);
  if (target === undefined || platform === undefined) return undefined;

  const root = join(platform, "vendor", target);
  const layout = codexLayouts.find((candidate) => isFile(join(root, candidate.marker)));
  return layout && join(root, layout.executable);
}

/** The bundled tool directories the Codex SDK puts first on PATH for its own CLI. */
export function codexPathDirectories(executable: string): string[] {
  const layout = codexLayouts.find((candidate) => executable.endsWith(`/${candidate.executable}`));
  if (layout === undefined) return [];

  const root = executable.slice(0, -layout.executable.length);
  const directory = join(root, layout.pathDirectory);
  return isFile(join(root, layout.marker)) && isDirectory(directory) ? [directory] : [];
}

// Each package resolves from the one that depends on it, as the SDK resolves them:
// the SDK depends on the CLI package, which depends on the platform package.
function resolvePackage(name: string): string | undefined {
  const sdk = createRequire(import.meta.resolve("@openai/codex-sdk"));
  const cli = resolveModule(sdk, "@openai/codex/package.json");
  const manifest = cli && resolveModule(createRequire(cli), `${name}/package.json`);

  return manifest && dirname(manifest);
}

function isFile(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
}

function isDirectory(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function definedEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

async function* runCodex(input: SessionInput, { executable }: HarnessRun) {
  const { Codex } = await import("@openai/codex-sdk");
  const directories = codexPathDirectories(executable);
  const codex = new Codex(
    Object.assign(
      { codexPathOverride: executable },
      definedFields({
        env:
          directories.length === 0
            ? undefined
            : definedEnv({
                ...process.env,
                PATH: [...directories, process.env.PATH].join(delimiter),
              }),
      }),
    ),
  );
  const options = codexThreadOptions(input);
  const thread = input.resumeSessionId
    ? codex.resumeThread(input.resumeSessionId, options)
    : codex.startThread(options);
  const turn = new CodexTurn(input);

  try {
    const { events } = await thread.runStreamed(codexPrompt(input), {
      outputSchema: codexCompletionOutputSchema,
    });
    for await (const message of events)
      yield { message, events: turn.receive(checkedEvent(message)) };
  } catch (error) {
    throw unreadable(error)
      ? new InvalidProviderMessage(diagnostic(error), { cause: error })
      : error;
  }
  yield { events: turn.end() };
}

// The SDK yields each line it parses without checking its shape, and reads a turn's
// usage before yielding it, so a line it could not read surfaces as one of these.
function unreadable(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.message.startsWith("Failed to parse item"))
  );
}

const text = z.string();
const eventType = z.looseObject({ type: text });
const itemSchema = z
  .looseObject({ id: text, type: text, text: text.optional(), message: text.optional() })
  .refine((item) => item.type !== "agent_message" || item.text !== undefined)
  .refine((item) => item.type !== "error" || item.message !== undefined);
const itemEvent = z.looseObject({ item: itemSchema });
// The fields CodexTurn reads, by event type. Other event types pass unread.
const eventShapes: Readonly<Record<string, z.ZodType>> = {
  "thread.started": z.looseObject({ thread_id: text }),
  "item.started": itemEvent,
  "item.updated": itemEvent,
  "item.completed": itemEvent,
  "turn.completed": z.looseObject({ usage: z.looseObject({}) }),
  "turn.failed": z.looseObject({ error: z.looseObject({ message: text }) }),
  error: z.looseObject({ message: text }),
};

function checkedEvent(message: ThreadEvent): ThreadEvent {
  const type = eventType.safeParse(message).data?.type;
  const shape = type === undefined ? undefined : eventShapes[type];
  if (type === undefined || (shape !== undefined && !shape.safeParse(message).success))
    throw new InvalidProviderMessage(`invalid Codex SDK message: ${JSON.stringify(message)}`);

  return message;
}

export function codexThreadOptions({ agent }: SessionInput): ThreadOptions {
  const effort = extendedEfforts.find((level) => level === agent.effort);
  if (agent.effort && !effort) throw new Error(`Codex does not offer effort ${agent.effort}`);

  return Object.assign(
    { workingDirectory: process.cwd() },
    definedFields({ model: nonEmpty(agent.model), modelReasoningEffort: effort }),
  );
}

export function codexPrompt(input: SessionInput): string {
  return [`$${input.stage}${input.card ? ` ${input.card}` : ""}`, input.systemPrompt].join("\n\n");
}

/** Turns one Codex turn's SDK events into the runner's events and judges its completion. */
export class CodexTurn {
  private readonly startedTools = new Map<string, string>();
  private readonly completedItems = new Set<string>();
  private finalReply = "";
  private terminal = false;

  constructor(private readonly input: SessionInput) {}

  receive(event: ThreadEvent): ProviderEvent[] {
    switch (event.type) {
      case "thread.started":
        return [
          { type: "session_id", sessionId: event.thread_id },
          { type: "configured_session", configuration: this.requested() },
          { type: "required_tool_coverage", coverage: "unknown" },
        ];
      case "item.started":
      case "item.updated":
        return this.started(event.item);
      case "item.completed":
        return this.completed(event.item);
      case "turn.completed":
        return this.completedTurn(event.usage);
      case "turn.failed":
        this.terminal = true;
        return [{ type: "error", message: `Codex turn failed: ${event.error.message}` }];
      case "error":
        return [{ type: "error", message: `Codex error: ${event.message}` }];
      default:
        return [];
    }
  }

  end(): ProviderEvent[] {
    if (this.terminal) return [];

    return [{ type: "error", message: "Codex stream ended before its turn completed" }];
  }

  private requested(): ConfiguredSession {
    return {
      provenance: "codex.sdk.requested",
      model: nonEmpty(this.input.agent.model) ?? null,
      effort: nonEmpty(this.input.agent.effort) ?? null,
      cwd: process.cwd(),
    };
  }

  private started(item: ThreadItem): ProviderEvent[] {
    if (!toolKinds.includes(item.type) || this.startedTools.has(item.id)) return [];

    this.startedTools.set(item.id, item.type);
    return [{ type: "tool_call", name: item.type, args: JSON.stringify(item) }];
  }

  private completed(item: ThreadItem): ProviderEvent[] {
    if (this.completedItems.has(item.id)) return [];

    this.completedItems.add(item.id);
    if (item.type === "agent_message") {
      this.finalReply = item.text;
      return [{ type: "text", text: item.text }];
    }

    if (item.type === "error") return [{ type: "text", text: `Codex reported: ${item.message}` }];

    if (!toolKinds.includes(item.type)) return [];

    const events = this.started(item);
    const status = "status" in item ? item.status : "completed";
    events.push({
      type: "tool_outcome",
      outcome: { itemId: item.id, kind: item.type, status, raw: item },
    });
    // A nonzero command can be an expected probe, so only its outcome is kept.
    if (status === "in_progress")
      events.push({ type: "error", message: `Codex completed ${item.type} still in progress` });
    else if (
      item.type !== "command_execution" &&
      (status === "failed" || ("error" in item && item.error))
    )
      events.push({ type: "error", message: `Codex ${item.type} failed` });

    return events;
  }

  private completedTurn(usage: Usage): ProviderEvent[] {
    this.terminal = true;

    const events: ProviderEvent[] = [
      { type: "usage", usage: { raw: [{ type: "turn.completed", usage }] } },
    ];
    const unfinished = [...this.startedTools].filter(([id]) => !this.completedItems.has(id));
    if (unfinished.length > 0) {
      events.push({
        type: "error",
        message: `Codex completed with unfinished tool items: ${unfinished.map(([id, kind]) => `${kind}:${id}`).join(", ")}`,
      });
      return events;
    }
    if (!this.finalReply) {
      events.push({ type: "error", message: "Codex completed without a final reply" });
      return events;
    }

    events.push({ type: "result", result: this.finalReply });
    const completionError = codexCompletionError(this.finalReply);
    if (completionError) events.push({ type: "error", message: completionError });
    events.push({ type: "complete" });

    return events;
  }
}
