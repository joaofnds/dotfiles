import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { codexCompletionError, codexCompletionOutputSchema } from "./codex-completion.ts";
import { codexRuntimeContract } from "./codex-runtime.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import type {
  ConfiguredSession,
  HarnessAdapter,
  ProtocolUpdate,
  ProviderEvent,
  ProviderProtocol,
  SessionInput,
} from "./provider-types.ts";

// Public model/list capture, Codex 0.166.0, 2026-11-04. Advertised capabilities,
// not entitlement, execution telemetry, or required-tool visibility guarantees.
const standardEfforts = ["low", "medium", "high", "xhigh", "max"];
const extendedEfforts = [...standardEfforts, "ultra"];
const executableName = "codex";

export const codexAdapter: HarnessAdapter = {
  provider: "codex",
  displayName: "Codex",
  executableName,
  summary: "Codex uses app-server stdio with inherited native policy.",
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
        (previous.resolvedModel === undefined || previous.resolvedModel === agent.model) &&
        !previous.modelReroutes?.some((route) => route.toModel !== agent.model)
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
    promptTransport: "stdin",
    dollarCap: false,
  },
  command: (input) => {
    if (input.budget !== undefined) throw new Error("codex cannot enforce an explicit dollar cap");
    if (input.resumeSessionId) {
      const previous = codexConfigurationSchema.parse(input.resumeConfiguration);
      if (
        input.stage === "review" ||
        !(input.agent.model && input.agent.effort) ||
        previous.model !== input.agent.model ||
        previous.effort !== input.agent.effort ||
        previous.cwd !== process.cwd()
      ) {
        throw new Error(
          "Codex author resume requires matching pinned configuration; review starts fresh",
        );
      }
    }

    return {
      argv: [executableName, "--no-daemon", "app-server", "--stdio"],
      protocol: new CodexProtocol(input),
    };
  },
  decode: () => {
    throw new Error("Codex app-server decoding requires an invocation-owned protocol");
  },
};

const id = z.string().min(1);
const errorSchema = z.object({ message: z.string() });
const approvalSchema = z.union([
  z.enum(["untrusted", "on-request", "never"]),
  z
    .object({
      granular: z
        .object({
          mcp_elicitations: z.boolean(),
          rules: z.boolean(),
          sandbox_approval: z.boolean(),
          request_permissions: z.boolean().optional(),
          skill_approval: z.boolean().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
]);
const sandboxSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("dangerFullAccess") }).passthrough(),
  z.object({ type: z.literal("readOnly"), networkAccess: z.boolean().optional() }).passthrough(),
  z
    .object({
      type: z.literal("externalSandbox"),
      networkAccess: z.enum(["restricted", "enabled"]).optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("workspaceWrite"),
      writableRoots: z.array(z.string()).optional(),
      networkAccess: z.boolean().optional(),
      excludeSlashTmp: z.boolean().optional(),
      excludeTmpdirEnvVar: z.boolean().optional(),
    })
    .passthrough(),
]);
export const codexConfigurationSchema = z.object({
  provenance: z.enum(["codex.app-server.thread/start", "codex.app-server.thread/resume"]),
  model: id.nullable(),
  effort: id.nullable(),
  cwd: id,
  approvalPolicy: approvalSchema,
  sandbox: sandboxSchema,
});
const threadResponse = z.object({
  thread: z.object({ id }),
  model: id.nullable(),
  reasoningEffort: id.nullable().optional(),
  cwd: id,
  approvalPolicy: approvalSchema,
  sandbox: sandboxSchema,
});
const itemHeader = z.object({ id, type: id }).passthrough();
const turnSchema = z.object({
  id,
  status: z.enum(["inProgress", "completed", "interrupted", "failed"]),
  error: errorSchema.nullable().optional(),
  items: z.array(itemHeader),
});
const correlated = z.object({ threadId: id, turnId: id });
const tokens = z.object({
  inputTokens: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative(),
  cacheWriteInputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative(),
  reasoningOutputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});
const toolStatus = z.enum(["inProgress", "completed", "failed", "declined"]);
const commandItem = itemHeader.extend({
  type: z.literal("commandExecution"),
  command: z.string(),
  cwd: z.string(),
  status: toolStatus,
  commandActions: z.array(z.unknown()),
  exitCode: z.number().int().nullable().optional(),
  aggregatedOutput: z.string().nullable().optional(),
});
const fileItem = itemHeader.extend({
  type: z.literal("fileChange"),
  status: toolStatus,
});
const mcpItem = itemHeader.extend({
  type: z.literal("mcpToolCall"),
  status: z.enum(["inProgress", "completed", "failed"]),
  server: id,
  tool: id,
  arguments: z.unknown(),
  error: errorSchema.nullable().optional(),
});
const dynamicItem = itemHeader.extend({
  type: z.literal("dynamicToolCall"),
  status: z.enum(["inProgress", "completed", "failed"]),
  success: z.boolean().nullable().optional(),
});

function rpc(requestId: number, method: string, params: unknown): string {
  return `${JSON.stringify({ id: requestId, method, params })}\n`;
}

class CodexProtocol implements ProviderProtocol {
  readonly initialInput = rpc(1, "initialize", {
    clientInfo: { name: "iterate", version: "1" },
    capabilities: { experimentalApi: false },
  });
  private phase: "initialize" | "thread" | "turn" | "running" | "terminal" = "initialize";
  private threadId = "";
  private turnId = "";
  private readonly startedItems = new Map<string, string>();
  private readonly completedItems = new Map<string, unknown>();
  private finalItemId = "";
  private finalReply = "";
  private readonly cwd = process.cwd();

  constructor(private readonly input: SessionInput) {}

  receive(line: string): ProtocolUpdate {
    if (!line.trim()) return { events: [] };

    try {
      const raw: unknown = JSON.parse(line);
      const record = z
        .object({ id: z.union([z.number(), z.string()]).optional(), method: z.string().optional() })
        .parse(raw);
      if (record.method !== undefined) {
        if (record.id !== undefined) {
          throw new Error(`Codex is waiting for unsupported client action ${record.method}`);
        }
        return this.notification(
          record.method,
          z.object({ params: z.unknown() }).parse(raw).params,
        );
      }
      if (record.id === undefined) throw new Error("Codex response has no request identity");

      return this.response(record.id, raw);
    } catch (cause) {
      throw new Error(
        `invalid Codex app-server stream: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  }

  end(): void {
    if (this.phase !== "terminal")
      throw new Error("Codex app-server stream ended before its matched terminal turn");
  }

  private response(requestId: string | number, raw: unknown): ProtocolUpdate {
    if (this.phase === "running" || this.phase === "terminal") {
      throw new Error(
        "Codex returned an unexpected or duplicate response identity without a pending request",
      );
    }

    const expected = { initialize: 1, thread: 2, turn: 3 }[this.phase];
    if (requestId !== expected)
      throw new Error("Codex returned an unexpected or duplicate response identity");

    const response = z
      .object({
        result: z.unknown().optional(),
        error: z.object({ code: z.number(), message: z.string() }).optional(),
      })
      .parse(raw);
    if (response.error)
      throw new Error(`Codex request ${requestId} failed: ${response.error.message}`);

    if (!Object.hasOwn(response, "result")) throw new Error("Codex response has no result");

    if (this.phase === "initialize") {
      z.object({ userAgent: id }).parse(response.result);
      this.phase = "thread";
      const effort = nonEmpty(this.input.agent.effort);
      const params = Object.assign(
        { cwd: this.cwd },
        definedFields({
          threadId: nonEmpty(this.input.resumeSessionId),
          model: nonEmpty(this.input.agent.model),
          config: effort === undefined ? undefined : { model_reasoning_effort: effort },
        }),
      );
      return {
        events: [],
        input: `${JSON.stringify({ method: "initialized", params: {} })}\n${rpc(2, this.input.resumeSessionId ? "thread/resume" : "thread/start", params)}`,
      };
    }
    if (this.phase === "thread") {
      const receipt = threadResponse.parse(response.result);
      if (this.input.resumeSessionId && receipt.thread.id !== this.input.resumeSessionId) {
        throw new Error(
          "Codex returned a different resumed thread; no fresh-session fallback is allowed",
        );
      }
      const configuration: ConfiguredSession = {
        provenance: this.input.resumeSessionId
          ? "codex.app-server.thread/resume"
          : "codex.app-server.thread/start",
        model: receipt.model,
        effort: receipt.reasoningEffort ?? null,
        cwd: receipt.cwd,
        approvalPolicy: receipt.approvalPolicy,
        sandbox: receipt.sandbox,
      };
      this.threadId = receipt.thread.id;
      const events: ProviderEvent[] = [
        { type: "session_id", sessionId: this.threadId },
        { type: "required_tool_coverage", coverage: "unknown" },
      ];
      const previous = this.input.resumeConfiguration;
      if (
        receipt.cwd !== this.cwd ||
        (this.input.agent.model && receipt.model !== this.input.agent.model) ||
        (this.input.agent.effort && receipt.reasoningEffort !== this.input.agent.effort) ||
        (previous &&
          !isDeepStrictEqual(
            { ...previous, provenance: undefined },
            { ...configuration, provenance: undefined },
          ))
      ) {
        this.phase = "terminal";
        return {
          events: [
            ...events,
            {
              type: "error",
              message:
                "Codex configured author contract is missing or changed; no turn was started",
            },
          ],
          close: true,
        };
      }

      events.splice(1, 0, { type: "configured_session", configuration });
      this.phase = "turn";
      return {
        events,
        input: rpc(
          3,
          "turn/start",
          Object.assign(
            {
              threadId: this.threadId,
              outputSchema: codexCompletionOutputSchema,
              input: [
                {
                  type: "text",
                  text: [
                    `$${this.input.stage}${this.input.card ? ` ${this.input.card}` : ""}`,
                    this.input.systemPrompt,
                  ].join("\n\n"),
                },
              ],
            },
            definedFields({
              model: nonEmpty(this.input.agent.model),
              effort: nonEmpty(this.input.agent.effort),
            }),
          ),
        ),
      };
    }
    const { turn } = z.object({ turn: turnSchema }).parse(response.result);
    if (turn.status !== "inProgress" || turn.error)
      throw new Error("Codex turn did not start in progress");

    this.turnId = turn.id;
    this.phase = "running";
    return { events: [] };
  }

  private notification(method: string, raw: unknown): ProtocolUpdate {
    if (method === "thread/started") {
      const { thread } = z.object({ thread: z.object({ id }) }).parse(raw);
      if (!this.threadId || thread.id !== this.threadId)
        throw new Error("Codex thread start identity conflicts with its response");

      return { events: [] };
    }
    const recognized = [
      "turn/started",
      "turn/completed",
      "item/started",
      "item/completed",
      "item/agentMessage/delta",
      "thread/tokenUsage/updated",
      "error",
      "model/rerouted",
    ];
    if (!recognized.includes(method)) return { events: [] };

    const thread = z.object({ threadId: id }).parse(raw);
    // A connection may publish unrelated threads. Their terminal events confer no authority.
    if (this.threadId && thread.threadId !== this.threadId) return { events: [] };

    if (method === "thread/tokenUsage/updated") {
      if (!this.threadId || (this.phase !== "turn" && this.phase !== "running"))
        throw new Error(`Codex ${method} arrived outside the current turn`);

      correlated.parse(raw);
      z.object({ tokenUsage: z.object({ total: tokens, last: tokens }) }).parse(raw);
      // Resume hydration can name a completed prior turn before the new turn starts.
      // total and last have overlapping categories; cross-resume scope/basis and
      // child coverage are unestablished. Preserve raw receipts without adding.
      return { events: [{ type: "usage", usage: { raw: [{ method, params: raw }] } }] };
    }

    if (this.phase !== "running")
      throw new Error(`Codex ${method} arrived outside the current turn`);

    const events: ProviderEvent[] = [];
    if (method === "turn/started" || method === "turn/completed") {
      const { turn } = z.object({ threadId: id, turn: turnSchema }).parse(raw);
      if (turn.id !== this.turnId)
        throw new Error("Codex terminal/start turn identity conflicts with the current turn");

      if (method === "turn/started") {
        if (turn.status !== "inProgress" || turn.error)
          throw new Error("Codex turn started with invalid state");

        return { events };
      }
      for (const item of turn.items) events.push(...this.item(item, true));
      const unfinishedTools = [...this.startedItems].filter(
        ([itemId, type]) =>
          ["commandExecution", "fileChange", "mcpToolCall", "dynamicToolCall"].includes(type) &&
          !this.completedItems.has(itemId),
      );
      this.phase = "terminal";
      if (turn.status !== "completed" || turn.error) {
        events.push({ type: "error", message: turn.error?.message || `Codex turn ${turn.status}` });
      } else if (unfinishedTools.length) {
        events.push({
          type: "error",
          message: `Codex completed with unfinished tool items: ${unfinishedTools.map(([itemId, type]) => `${type}:${itemId}`).join(", ")}`,
        });
      } else if (this.finalReply) {
        events.push({ type: "result", result: this.finalReply });
        const completionError = codexCompletionError(this.finalReply);
        if (completionError) events.push({ type: "error", message: completionError });
        events.push({ type: "complete" });
      } else {
        events.push({ type: "error", message: "Codex completed without a final reply" });
      }
      return { events, close: true };
    }
    const correlation = correlated.parse(raw);
    if (correlation.turnId !== this.turnId)
      throw new Error("Codex notification conflicts with the current turn identity");

    if (method === "item/started" || method === "item/completed") {
      const { item } = z.object({ item: itemHeader }).parse(raw);
      return { events: this.item(item, method === "item/completed") };
    }
    if (method === "item/agentMessage/delta") {
      const { itemId, delta } = z.object({ itemId: id, delta: z.string() }).parse(raw);
      if (this.startedItems.get(itemId) !== "agentMessage" || this.completedItems.has(itemId))
        throw new Error("Codex text delta has no active matching item");

      return { events: [{ type: "text", text: delta }] };
    }
    if (method === "error") {
      const failure = z.object({ error: errorSchema, willRetry: z.boolean() }).parse(raw);
      return {
        events: [
          {
            type: "error",
            message: `Codex error${failure.willRetry ? " (retry announced)" : ""}: ${failure.error.message}`,
          },
        ],
      };
    }
    const reroute = z.object({ fromModel: id, toModel: id, reason: id }).parse(raw);
    return {
      events: [
        { type: "model_reroute", receipt: reroute },
        {
          type: "error",
          message: `Codex reported model reroute ${reroute.fromModel} -> ${reroute.toModel} (${reroute.reason}); requested configuration cannot establish execution compatibility`,
        },
      ],
    };
  }

  private item(raw: unknown, completed: boolean): ProviderEvent[] {
    const item = itemHeader.parse(raw);
    const priorType = this.startedItems.get(item.id);
    if (priorType && priorType !== item.type)
      throw new Error("Codex changed an item identity's type");

    this.startedItems.set(item.id, item.type);
    if (completed && this.completedItems.has(item.id)) {
      if (!isDeepStrictEqual(this.completedItems.get(item.id), raw))
        throw new Error("Codex reused an item identity with conflicting completed data");

      return [];
    }
    if (!completed && this.completedItems.has(item.id))
      throw new Error("Codex restarted an already completed item");

    const events: ProviderEvent[] = [];
    if (item.type === "agentMessage") {
      const message = itemHeader
        .extend({
          text: z.string(),
          phase: z.enum(["commentary", "partial_answer", "final_answer"]).nullable().optional(),
        })
        .parse(raw);
      if (completed && message.phase === "final_answer") {
        if (this.finalItemId && this.finalItemId !== item.id)
          throw new Error("Codex returned conflicting final reply identities");

        this.finalItemId = item.id;
        this.finalReply = message.text;
      }
    } else if (
      ["commandExecution", "fileChange", "mcpToolCall", "dynamicToolCall"].includes(item.type)
    ) {
      let tool:
        | z.infer<typeof commandItem>
        | z.infer<typeof fileItem>
        | z.infer<typeof mcpItem>
        | z.infer<typeof dynamicItem>;
      if (item.type === "commandExecution") tool = commandItem.parse(raw);
      else if (item.type === "fileChange") tool = fileItem.parse(raw);
      else if (item.type === "mcpToolCall") tool = mcpItem.parse(raw);
      else tool = dynamicItem.parse(raw);

      if (!priorType)
        events.push({ type: "tool_call", name: tool.type, args: JSON.stringify(raw) });
      if (completed) {
        if (tool.status === "inProgress")
          throw new Error("Codex completed a tool item still in progress");

        events.push({
          type: "tool_outcome",
          outcome: { itemId: tool.id, kind: tool.type, status: tool.status, raw },
        });
        if (tool.status === "declined")
          events.push(
            { type: "permission_denials", count: 1 },
            { type: "error", message: `Codex ${tool.type} was declined` },
          );
        // Nonzero commands can be expected probes. Retain them as outcomes. A
        // file/MCP/dynamic failure is explicit tool failure evidence, not prose.
        else if (
          tool.type !== "commandExecution" &&
          (tool.status === "failed" ||
            ("error" in tool && tool.error) ||
            ("success" in tool && tool.success === false))
        )
          events.push({ type: "error", message: `Codex ${tool.type} failed` });
      }
    }
    if (completed) this.completedItems.set(item.id, raw);
    return events;
  }
}
