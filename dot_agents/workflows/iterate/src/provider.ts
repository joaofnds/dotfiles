import { z } from "zod";
import type { Stage, StageAgent } from "./agents.ts";

export type SessionInput = {
  readonly agent: StageAgent;
  readonly stage: Stage;
  readonly card: string;
  readonly systemPrompt: string;
  readonly budget: string;
};

export type ProviderEvent =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "tool_call"; readonly name: string; readonly args: string }
  | { readonly type: "result"; readonly result: string }
  | { readonly type: "session_id"; readonly sessionId: string }
  | { readonly type: "error"; readonly message: string }
  | {
      readonly type: "usage";
      readonly turns: number | undefined;
      readonly cost: number | undefined;
    }
  | { readonly type: "complete" };

export function commandFor(input: SessionInput): {
  readonly argv: readonly string[];
  readonly stdin?: string;
} {
  const { agent, stage, card, systemPrompt, budget } = input;
  if (agent.provider === "claude") {
    const argv = [
      "claude",
      "--print",
      "--verbose",
      "--output-format",
      "stream-json",
      "--model",
      agent.model,
      "--max-budget-usd",
      budget,
      "--append-system-prompt",
      systemPrompt,
    ];
    if (agent.effort) argv.push("--effort", agent.effort);
    argv.push("--dangerously-skip-permissions", card ? `/${stage} ${card}` : `/${stage}`);

    return { argv };
  }

  const ask = card ? `Use the $${stage} skill on ${card}.` : `Use the $${stage} skill.`;
  const prompt = `${ask}\n\n${systemPrompt}`;
  if (agent.provider === "codex") {
    const argv = [
      "codex",
      "exec",
      "--json",
      "--dangerously-bypass-approvals-and-sandbox",
      "-m",
      agent.model,
    ];
    if (agent.effort) argv.push("-c", `model_reasoning_effort="${agent.effort}"`);

    return { argv, stdin: prompt };
  }

  const argv = ["opencode", "run", "--format", "json", "--model", agent.model];
  if (agent.effort) argv.push("--variant", agent.effort);
  argv.push("--dangerously-skip-permissions", prompt);

  return { argv };
}

export function eventsFrom(provider: StageAgent["provider"], line: string): ProviderEvent[] {
  if (!line.trimStart().startsWith("{")) return [];

  try {
    const raw: unknown = JSON.parse(line);
    const { type } = z.object({ type: z.string() }).parse(raw);
    if (type === "error") return [errorFrom(raw)];

    if (provider === "claude") return claudeEvents(type, raw);

    if (provider === "codex") return codexEvents(type, raw);

    return opencodeEvents(type, raw);
  } catch (cause) {
    throw new Error(`invalid ${provider} stream event`, { cause });
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
  result: z.string().optional(),
  is_error: z.boolean().default(false),
  errors: z.array(z.string()).default([]),
  num_turns: z.number().int().nonnegative().optional(),
  total_cost_usd: z.number().nonnegative().optional(),
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

    const { session_id } = z.object({ session_id: z.string() }).parse(raw);
    return [{ type: "session_id", sessionId: session_id }];
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
  if (event.result !== undefined) events.push({ type: "result", result: event.result });
  for (const message of event.errors) events.push({ type: "error", message });
  if (event.is_error && event.errors.length === 0) {
    events.push({ type: "error", message: event.result || "the provider reported an error" });
  }
  if (event.num_turns !== undefined || event.total_cost_usd !== undefined) {
    events.push({ type: "usage", turns: event.num_turns, cost: event.total_cost_usd });
  }
  events.push({ type: "complete" });

  return events;
}

function codexEvents(type: string, raw: unknown): ProviderEvent[] {
  if (type === "thread.started") {
    const { thread_id } = z.object({ thread_id: z.string() }).parse(raw);
    return [{ type: "session_id", sessionId: thread_id }];
  }

  if (type === "turn.failed") return [errorFrom(raw)];

  if (type === "turn.completed") return [{ type: "complete" }];

  if (type !== "item.completed" && type !== "item.started") return [];

  const { item } = z.object({ item: envelope }).parse(raw);
  if (type === "item.completed" && item.type === "agent_message") {
    const value = text.parse(item).text;
    return [
      { type: "text", text: value },
      { type: "result", result: value },
    ];
  }

  if (type === "item.started" && item.type === "command_execution") {
    const { command } = z.object({ command: z.string() }).parse(item);
    return [{ type: "tool_call", name: "Bash", args: command }];
  }

  return [];
}

function opencodeEvents(type: string, raw: unknown): ProviderEvent[] {
  if (type === "step_start") {
    const { sessionID } = z.object({ sessionID: z.string() }).parse(raw);
    return [{ type: "session_id", sessionId: sessionID }];
  }

  if (type === "text") {
    const { part } = z.object({ part: text.extend({ type: z.literal("text") }) }).parse(raw);
    return [
      { type: "text", text: part.text },
      { type: "result", result: part.text },
    ];
  }

  if (type === "step_finish") {
    const { part } = z
      .object({ part: z.object({ type: z.literal("step-finish"), reason: z.string() }) })
      .parse(raw);
    return part.reason === "stop" ? [{ type: "complete" }] : [];
  }

  if (type !== "tool_use") return [];

  const { part } = z
    .object({
      part: z.object({
        type: z.literal("tool"),
        tool: z.string(),
        state: z.object({ status: z.string() }).passthrough(),
      }),
    })
    .parse(raw);
  if (part.state.status !== "completed") return [];

  const { input } = z.object({ input: toolInput }).parse(part.state);
  return [{ type: "tool_call", name: part.tool, args: toolArgs(part.tool, input) }];
}

function toolArgs(name: string, input: Record<string, unknown>): string {
  const fields: Record<string, string> = {
    Bash: "command",
    WebSearch: "query",
    WebFetch: "url",
    Agent: "description",
    bash: "command",
    webfetch: "url",
    task: "description",
  };
  const field = fields[name];
  const value = field === undefined ? undefined : input[field];

  return typeof value === "string" ? value : JSON.stringify(input);
}
