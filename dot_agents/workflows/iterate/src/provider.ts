import { z } from "zod";
import type { Stage, StageAgent } from "./agents.ts";
import {
  addTokens,
  type ModelUsage,
  type SessionCost,
  type TokenUsage,
  type UsageReport,
} from "./usage.ts";

export type SessionInput = {
  readonly agent: StageAgent;
  readonly stage: Stage;
  readonly card: string;
  readonly systemPrompt: string;
  readonly budget: string;
  readonly logDirectory?: string;
  readonly resumeSessionId?: string;
  readonly timeoutMs?: number;
};

export type ProviderEvent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "tool_call"; readonly name: string; readonly args: string }
  | { readonly type: "result"; readonly result: string }
  | { readonly type: "session_id"; readonly sessionId: string }
  | { readonly type: "resolved_model"; readonly model: string }
  | { readonly type: "error"; readonly message: string }
  | {
      readonly type: "usage";
      readonly turns?: number;
      readonly cost?: SessionCost;
      readonly usage: UsageReport;
    }
  | { readonly type: "complete" };

export function commandFor(input: SessionInput): { readonly argv: readonly string[] } {
  const { agent, stage, card, systemPrompt, budget, resumeSessionId } = input;
  const argv = ["claude", "--print", "--verbose", "--output-format", "stream-json"];
  if (agent.model) argv.push("--model", agent.model);
  if (agent.effort) argv.push("--effort", agent.effort);
  argv.push("--max-budget-usd", budget, "--append-system-prompt", systemPrompt);
  if (resumeSessionId) argv.push("--resume", resumeSessionId);
  argv.push("--dangerously-skip-permissions", card ? `/${stage} ${card}` : `/${stage}`);

  return { argv };
}

export function eventsFrom(line: string): ProviderEvent[] {
  if (!line.trimStart().startsWith("{")) return [];

  try {
    const raw: unknown = JSON.parse(line);
    const { type } = z.object({ type: z.string() }).parse(raw);
    if (type === "error") return [errorFrom(raw)];

    return claudeEvents(type, raw);
  } catch (cause) {
    throw new Error("invalid Claude stream event", { cause });
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
  session_id: z.string().optional(),
  result: z.string().optional(),
  is_error: z.boolean().default(false),
  errors: z.array(z.string()).default([]),
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

function claudeEvents(type: string, raw: unknown): ProviderEvent[] {
  if (type === "system") {
    const event = z.object({ subtype: z.string() }).parse(raw);
    if (event.subtype !== "init") return [];

    const { session_id, model } = z
      .object({ session_id: z.string(), model: z.string().optional() })
      .parse(raw);
    return [
      { type: "session_id", sessionId: session_id },
      ...(model === undefined ? [] : ([{ type: "resolved_model", model }] as const)),
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
  for (const message of event.errors) events.push({ type: "error", message });
  if (event.is_error && event.errors.length === 0) {
    events.push({ type: "error", message: event.result || "the provider reported an error" });
  }
  const usage = claudeUsage(event.usage, event.modelUsage);
  if (
    event.num_turns !== undefined ||
    event.total_cost_usd !== undefined ||
    Object.keys(usage).length > 0
  ) {
    events.push({
      type: "usage",
      ...(event.num_turns === undefined ? {} : { turns: event.num_turns }),
      ...(event.total_cost_usd === undefined
        ? {}
        : { cost: { usd: event.total_cost_usd, scope: "aggregateIncludingChildren" as const } }),
      usage,
    });
  }
  events.push({ type: "complete" });

  return events;
}

function claudeUsage(
  parent:
    | {
        input_tokens?: number | undefined;
        cache_creation_input_tokens?: number | undefined;
        cache_read_input_tokens?: number | undefined;
        output_tokens?: number | undefined;
        output_tokens_details?: { thinking_tokens?: number | undefined } | undefined;
      }
    | undefined,
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
    ([model, item]): ModelUsage => ({
      model,
      ...(item.canonicalModel === undefined ? {} : { resolvedModel: item.canonicalModel }),
      ...(item.provider === undefined ? {} : { provider: item.provider }),
      ...(item.costBasis === undefined ? {} : { costBasis: item.costBasis }),
      ...(item.costUSD === undefined ? {} : { costUsd: item.costUSD }),
      tokens: compactTokens({
        input: item.inputTokens,
        cacheWrite: item.cacheCreationInputTokens,
        cacheRead: item.cacheReadInputTokens,
        output: item.outputTokens,
        reasoning: item.thinkingTokens,
      }),
    }),
  );
  const aggregate = models.reduce<TokenUsage | undefined>(
    (total, model) => addTokens(total, model.tokens),
    undefined,
  );

  return {
    ...(parent === undefined
      ? {}
      : {
          parent: compactTokens({
            input: parent.input_tokens,
            cacheWrite: parent.cache_creation_input_tokens,
            cacheRead: parent.cache_read_input_tokens,
            output: parent.output_tokens,
            reasoning: parent.output_tokens_details?.thinking_tokens,
          }),
        }),
    ...(aggregate === undefined ? {} : { aggregateIncludingChildren: aggregate }),
    ...(models.length === 0 ? {} : { models }),
  };
}

function compactTokens(tokens: Record<keyof TokenUsage, number | undefined>): TokenUsage {
  return {
    ...(tokens.input === undefined ? {} : { input: tokens.input }),
    ...(tokens.cacheRead === undefined ? {} : { cacheRead: tokens.cacheRead }),
    ...(tokens.cacheWrite === undefined ? {} : { cacheWrite: tokens.cacheWrite }),
    ...(tokens.output === undefined ? {} : { output: tokens.output }),
    ...(tokens.reasoning === undefined ? {} : { reasoning: tokens.reasoning }),
  };
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
