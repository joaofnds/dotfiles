import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import process from "node:process";
import { Transform, type TransformCallback } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import type {
  Options,
  PermissionMode,
  SettingSource,
  SpawnedProcess,
  SpawnOptions,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { claudeRuntimeContract } from "./claude-runtime.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import { resolveModule } from "./executable.ts";
import {
  type Harness,
  type HarnessRun,
  InvalidProviderMessage,
  type ProviderEvent,
  type SessionInput,
} from "./provider-types.ts";
import {
  addTokens,
  type ModelUsage,
  type SessionCost,
  type TokenUsage,
  type UsageReport,
} from "./usage.ts";

const efforts = ["low", "medium", "high", "xhigh", "max"] as const;
const permissionMode: PermissionMode = "auto";

export const claudeHarness: Harness = {
  provider: "claude",
  displayName: "Claude",
  bundledExecutable: bundledClaude,
  summary: "Claude runs through the Claude Agent SDK in auto permission mode.",
  capabilities: {
    resume: true,
    model: true,
    efforts,
    dollarCap: true,
    dollarCapBasis: "invocation",
    defaultDollarCap: 50,
  },
  providerCompletion: false,
  permissionMode,
  runtimeContract: claudeRuntimeContract,
  resume: {
    requiresEstablishedLocalInputs: false,
    resolvedModelMustMatchPin: true,
    configurationMatches: ({ previous, agent }) => previous.resolvedModel === agent.model,
  },
  run: runClaude,
};

// The SDK ships one native package per platform, with a musl build beside the glibc one.
function bundledClaude(): string | undefined {
  const name = `@anthropic-ai/claude-agent-sdk-${process.platform}-${process.arch}`;
  const binary = process.platform === "win32" ? "claude.exe" : "claude";
  const require = createRequire(import.meta.url);

  for (const variant of [name, `${name}-musl`]) {
    const executable = resolveModule(require, `${variant}/${binary}`);
    if (executable !== undefined) return executable;
  }
  return undefined;
}

async function* runClaude(input: SessionInput, { executable }: HarnessRun) {
  const { query } = await import("@anthropic-ai/claude-agent-sdk");
  const unreadable = new UnreadableLines();
  const { prompt, options } = claudeQuery(input, executable);
  const spawnClaudeCodeProcess = (spawnOptions: SpawnOptions) =>
    spawnRead(spawnOptions, unreadable);

  try {
    for await (const message of query({
      prompt,
      options: Object.assign(options, { spawnClaudeCodeProcess }),
    })) {
      unreadable.reject();
      yield { message, events: claudeEvents(message) };
    }
  } catch (error) {
    unreadable.reject();
    throw error;
  }
  unreadable.reject();
}

// The CLI's stderr goes straight to the host's, so the session log keeps it whole.
function spawnRead(
  { command, args, cwd, env, signal }: SpawnOptions,
  unreadable: UnreadableLines,
): SpawnedProcess {
  const child = spawn(command, args, { cwd, env, signal, stdio: ["pipe", "pipe", "inherit"] });
  child.stdout.pipe(unreadable);

  return Object.assign(child, { stdout: unreadable });
}

/**
 * Passes the CLI's stdout to the SDK unchanged and keeps each line that is not JSON,
 * since the SDK skips such a line without a word and the session would look complete.
 */
class UnreadableLines extends Transform {
  private readonly decoder = new StringDecoder("utf8");
  private pending = "";
  private first: string | undefined;

  override _transform(chunk: Buffer, _encoding: BufferEncoding, done: TransformCallback): void {
    this.inspect(this.decoder.write(chunk));
    done(null, chunk);
  }

  override _flush(done: TransformCallback): void {
    this.inspect(this.decoder.end());
    this.check(this.pending);
    done();
  }

  /** Throws once the CLI has written a line the SDK could not read. */
  reject(): void {
    if (this.first === undefined) return;

    throw new InvalidProviderMessage(`unreadable Claude output: ${this.first.slice(0, 200)}`);
  }

  private inspect(text: string): void {
    const lines = `${this.pending}${text}`.split("\n");
    this.pending = lines.pop() ?? "";
    for (const line of lines) this.check(line);
  }

  // The raw line goes to stderr byte for byte, because the session log keeps the
  // host's lines and the SDK never hands this one over.
  private check(line: string): void {
    if (line.trim() === "" || isJson(line)) return;

    process.stderr.write(`\n${line}\n`);
    this.first ??= line;
  }
}

function isJson(line: string): boolean {
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}

export function claudeQuery(input: SessionInput, executable: string) {
  const { agent, stage, card, systemPrompt, budget } = input;
  const effort = efforts.find((level) => level === agent.effort);
  if (agent.effort && !effort) throw new Error(`Claude does not offer effort ${agent.effort}`);

  const options: Options = Object.assign(
    {
      pathToClaudeCodeExecutable: executable,
      cwd: process.cwd(),
      permissionMode,
      settingSources: ["user", "project", "local"] satisfies SettingSource[],
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: systemPrompt,
      },
    },
    definedFields({
      model: nonEmpty(agent.model),
      effort,
      maxBudgetUsd: budget === undefined ? undefined : Number(budget),
      resume: nonEmpty(input.resumeSessionId),
    }),
  );

  return { prompt: card ? `/${stage} ${card}` : `/${stage}`, options };
}

export function claudeEvents(message: unknown): ProviderEvent[] {
  try {
    const { type } = z.object({ type: z.string() }).parse(message);
    if (type === "error") return [errorFrom(message)];

    return messageEvents(type, message);
  } catch (cause) {
    throw new InvalidProviderMessage("invalid Claude SDK message", { cause });
  }
}

const envelope = z.object({ type: z.string() }).passthrough();
const text = z.object({ text: z.string() });
const toolInput = z.record(z.string(), z.unknown());
const tool = z.object({ name: z.string(), input: toolInput });
const error = z.object({
  message: z.string().optional(),
  error: z
    .union([
      z.string(),
      z.object({
        message: z.string().optional(),
        name: z.string().optional(),
        data: z.object({ message: z.string().optional() }).optional(),
      }),
    ])
    .optional(),
});
const claudeResult = z.object({
  uuid: z.string().optional(),
  session_id: z.string().optional(),
  result: z.string().optional(),
  is_error: z.boolean().default(false),
  errors: z.array(z.string()).default([]),
  permission_denials: z.array(z.unknown()).default([]),
  num_turns: z.number().int().nonnegative().optional(),
  total_cost_usd: z.number().nonnegative().optional(),
  usage: z
    .object({
      input_tokens: z.number().int().nonnegative().optional(),
      cache_creation_input_tokens: z.number().int().nonnegative().optional(),
      cache_read_input_tokens: z.number().int().nonnegative().optional(),
      output_tokens: z.number().int().nonnegative().optional(),
      output_tokens_details: z
        .object({ thinking_tokens: z.number().int().nonnegative().optional() })
        .optional(),
    })
    .optional(),
  modelUsage: z
    .record(
      z.string(),
      z.object({
        inputTokens: z.number().int().nonnegative().optional(),
        cacheCreationInputTokens: z.number().int().nonnegative().optional(),
        cacheReadInputTokens: z.number().int().nonnegative().optional(),
        outputTokens: z.number().int().nonnegative().optional(),
        thinkingTokens: z.number().int().nonnegative().optional(),
        costUSD: z.number().nonnegative().optional(),
        canonicalModel: z.string().optional(),
        provider: z.string().optional(),
        costBasis: z.string().optional(),
      }),
    )
    .optional(),
});

function errorFrom(raw: unknown): ProviderEvent {
  const event = error.parse(raw);
  const diagnostic =
    typeof event.error === "string"
      ? event.error
      : event.error?.message || event.error?.data?.message || event.error?.name;

  return {
    type: "error",
    message: event.message || diagnostic || "the provider reported an error",
  };
}

function messageEvents(type: string, raw: unknown): ProviderEvent[] {
  if (type === "system") {
    const event = z.object({ subtype: z.string() }).parse(raw);

    if (event.subtype === "task_started") {
      const { task_id, description } = z
        .object({ task_id: z.string(), description: z.string() })
        .parse(raw);
      return [{ type: "task_started", taskId: task_id, description }];
    }

    if (event.subtype === "task_updated") {
      const { task_id, patch } = z
        .object({ task_id: z.string(), patch: z.object({ status: z.string().optional() }) })
        .parse(raw);
      return patch.status === "killed" ? [{ type: "task_killed", taskId: task_id }] : [];
    }

    if (event.subtype !== "init") return [];

    const { session_id, model, permissionMode } = z
      .object({
        session_id: z.string(),
        model: z.string().optional(),
        permissionMode: z.string().optional(),
      })
      .parse(raw);
    return [
      { type: "session_id", sessionId: session_id },
      ...(model === undefined ? [] : ([{ type: "resolved_model", model }] as const)),
      ...(permissionMode === undefined
        ? []
        : ([{ type: "permission_mode", mode: permissionMode }] as const)),
    ];
  }

  if (type === "assistant") {
    const event = z.object({ message: z.object({ content: z.array(envelope) }) }).parse(raw);
    return event.message.content.flatMap((block): ProviderEvent[] => {
      if (block.type === "text") return [{ type: "text", text: text.parse(block).text }];

      if (block.type !== "tool_use") return [];

      const { name, input } = tool.parse(block);
      return [{ type: "tool_call", name, args: toolArgs(name, input) }];
    });
  }

  if (type !== "result") return [];

  const event = claudeResult.parse(raw);
  const events: ProviderEvent[] = [];
  if (event.session_id !== undefined)
    events.push({ type: "session_id", sessionId: event.session_id });
  if (event.result !== undefined) events.push({ type: "result", result: event.result });
  if (!event.is_error && event.errors.length === 0 && !event.result) {
    events.push({ type: "error", message: "the provider completed without a final reply" });
  }
  for (const message of event.errors) events.push({ type: "error", message });
  if (event.permission_denials.length > 0) {
    events.push({ type: "permission_denials", count: event.permission_denials.length });
  }
  if (event.is_error && event.errors.length === 0) {
    events.push({ type: "error", message: event.result || "the provider reported an error" });
  }
  const usage = {
    ...claudeUsage(event.usage, event.modelUsage),
    parentBasis: "invocation" as const,
    aggregateBasis: "sessionCumulative" as const,
    modelsBasis: "sessionCumulative" as const,
    raw: [raw],
  };
  if (
    event.num_turns !== undefined ||
    event.total_cost_usd !== undefined ||
    Object.keys(usage).length > 0
  ) {
    events.push(
      Object.assign(
        {
          type: "usage" as const,
          receiptId: event.uuid ?? createHash("sha256").update(JSON.stringify(raw)).digest("hex"),
          usage,
        },
        definedFields({ turns: event.num_turns, cost: claudeCost(event.total_cost_usd) }),
      ),
    );
  }
  events.push({ type: "complete" });

  return events;
}

type ClaudeParentTokens = {
  readonly input_tokens?: number | undefined;
  readonly cache_creation_input_tokens?: number | undefined;
  readonly cache_read_input_tokens?: number | undefined;
  readonly output_tokens?: number | undefined;
  readonly output_tokens_details?: { readonly thinking_tokens?: number | undefined } | undefined;
};

function claudeUsage(
  parent: ClaudeParentTokens | undefined,
  rawModels:
    | Record<
        string,
        {
          inputTokens?: number | undefined;
          cacheCreationInputTokens?: number | undefined;
          cacheReadInputTokens?: number | undefined;
          outputTokens?: number | undefined;
          thinkingTokens?: number | undefined;
          costUSD?: number | undefined;
          canonicalModel?: string | undefined;
          provider?: string | undefined;
          costBasis?: string | undefined;
        }
      >
    | undefined,
): UsageReport {
  const models = Object.entries(rawModels ?? {}).map(
    ([model, item]): ModelUsage =>
      Object.assign(
        {
          model,
          tokens: definedFields({
            input: item.inputTokens,
            cacheWrite: item.cacheCreationInputTokens,
            cacheRead: item.cacheReadInputTokens,
            output: item.outputTokens,
            reasoning: item.thinkingTokens,
          }),
        },
        definedFields({
          resolvedModel: item.canonicalModel,
          provider: item.provider,
          costBasis: item.costBasis,
          costUsd: item.costUSD,
        }),
      ),
  );
  const aggregate = models.reduce<TokenUsage | undefined>(
    (total, model) => addTokens(total, model.tokens),
    undefined,
  );

  return definedFields({
    parent: parentTokens(parent),
    aggregateIncludingChildren: aggregate,
    models: models.length === 0 ? undefined : models,
  });
}

function parentTokens(parent: ClaudeParentTokens | undefined): TokenUsage | undefined {
  if (parent === undefined) return undefined;

  return definedFields({
    input: parent.input_tokens,
    cacheWrite: parent.cache_creation_input_tokens,
    cacheRead: parent.cache_read_input_tokens,
    output: parent.output_tokens,
    reasoning: parent.output_tokens_details?.thinking_tokens,
  });
}

function claudeCost(usd: number | undefined): SessionCost | undefined {
  if (usd === undefined) return undefined;

  return { usd, scope: "aggregateIncludingChildren", basis: "sessionCumulative" };
}

function toolArgs(name: string, input: Record<string, unknown>): string {
  const fields: Record<string, string> = {
    Bash: "command",
    WebSearch: "query",
    WebFetch: "url",
    Agent: "description",
  };
  const field = fields[name];
  const value = field === undefined ? undefined : input[field];

  return typeof value === "string" ? value : JSON.stringify(input);
}
