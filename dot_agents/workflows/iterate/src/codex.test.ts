import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { agentFromArgs } from "./agents.ts";
import { codexAdapter } from "./codex.ts";
import { codexCompletionOutputSchema } from "./codex-completion.ts";
import { definedFields } from "./defined-fields.ts";
import { sessionReportSchema } from "./journal.ts";
import { budgetFor } from "./provider.ts";
import type {
  ConfiguredSession,
  ProviderCommand,
  ProviderEvent,
  ProviderProtocol,
  SessionInput,
} from "./provider-types.ts";
import {
  CodexHarness,
  syntheticCodexCompletion,
  syntheticCodexReply,
} from "./testing/codex-harness.ts";

const configuration: ConfiguredSession = {
  provenance: "codex.app-server.thread/start",
  model: "gpt-6.1-sol",
  effort: "high",
  cwd: process.cwd(),
  approvalPolicy: "never",
  sandbox: { type: "readOnly", networkAccess: false },
};
const threadReceipt = {
  thread: { id: "thread-owned", sessionId: "session-tree-not-thread" },
  model: "gpt-6.1-sol",
  reasoningEffort: "high",
  cwd: process.cwd(),
  approvalPolicy: "never",
  sandbox: { type: "readOnly", networkAccess: false },
};
function requiredProtocol(command: ProviderCommand): ProviderProtocol {
  if (!command.protocol) throw new Error("Codex protocol missing");

  return command.protocol;
}
function makeProtocol(options: Partial<SessionInput> = {}): ProviderProtocol {
  return requiredProtocol(
    codexAdapter.command({
      agent: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
      stage: "build",
      card: "DOT-1",
      systemPrompt: "guards",
      ...options,
    }),
  );
}
function receive(protocol: ProviderProtocol, record: unknown) {
  return protocol.receive(JSON.stringify(record));
}
function configuredProtocol(options: Partial<SessionInput> = {}): ProviderProtocol {
  const protocol = makeProtocol(options);
  receive(protocol, { id: 1, result: { userAgent: "synthetic 0.166.0" } });
  receive(protocol, { id: 2, result: threadReceipt });
  return protocol;
}
function begin(options: Partial<SessionInput> = {}): ProviderProtocol {
  const protocol = configuredProtocol(options);
  receive(protocol, {
    id: 3,
    result: { turn: { id: "turn-owned", status: "inProgress", error: null, items: [] } },
  });
  return protocol;
}
function notify(method: string, params: object) {
  return { method, params: { threadId: "thread-owned", turnId: "turn-owned", ...params } };
}
const finalItem = {
  type: "agentMessage",
  id: "final",
  text: syntheticCodexReply,
  phase: "final_answer",
};
function terminal(overrides: object = {}) {
  return notify("turn/completed", {
    turn: { id: "turn-owned", status: "completed", error: null, items: [finalItem], ...overrides },
  });
}

function completedProtocol(): ProviderProtocol {
  const protocol = begin();
  receive(protocol, terminal());
  return protocol;
}

describe("codexAdapter", () => {
  test("preserves native completion while failing agent-reported blocked work", () => {
    const protocol = begin();
    const result = JSON.stringify({
      schemaVersion: 1,
      outcome: "blocked",
      requiredToolBlockers: [{ tool: "apply_patch", reason: "denied", evidencePath: "tool.log" }],
      cardState: "Build",
      claims: [],
      errors: ["required edit was denied"],
      scopeChanges: [],
      unresolvedDecisions: [],
      recordPath: "record.md",
    });

    const update = receive(protocol, terminal({ items: [{ ...finalItem, text: result }] }));

    expect(update).toEqual({
      events: [
        { type: "result", result },
        {
          type: "error",
          message: "Codex agent-reported completion: blocked; required tool blockers: 1",
        },
        { type: "complete" },
      ],
      close: true,
    });
  });
  test.each([
    { outcome: "completed", requiredToolBlockers: [], error: undefined },
    {
      outcome: "blocked",
      requiredToolBlockers: [],
      error: "Codex agent-reported completion: blocked; required tool blockers: 0",
    },
    {
      outcome: "failed",
      requiredToolBlockers: [],
      error: "Codex agent-reported completion: failed; required tool blockers: 0",
    },
    {
      outcome: "completed",
      requiredToolBlockers: [
        { tool: "command", reason: "required command failed", evidencePath: "tool.log" },
      ],
      error: "Codex agent-reported completion: completed; required tool blockers: 1",
    },
  ])(
    "classifies typed $outcome with $requiredToolBlockers while preserving exact JSON",
    ({ outcome, requiredToolBlockers, error }) => {
      const protocol = begin();
      const result = JSON.stringify(
        { ...syntheticCodexCompletion, outcome, requiredToolBlockers },
        null,
        2,
      );

      const update = receive(protocol, terminal({ items: [{ ...finalItem, text: result }] }));
      const errors: ProviderEvent[] =
        error === undefined ? [] : [{ type: "error", message: error }];

      expect(update).toEqual({
        events: [{ type: "result", result }, ...errors, { type: "complete" }],
        close: true,
      });
    },
  );

  test("accepts a negative inconclusive investigation without classifying its prose", () => {
    const protocol = begin();
    const result = JSON.stringify({
      ...syntheticCodexCompletion,
      claims: [
        {
          claim: "failed to prove the hypothesis; result is negative and inconclusive",
          evidencePath: "experiment.log",
        },
      ],
      errors: ["permission denied appeared in the investigated historical log"],
      unresolvedDecisions: ["whether to investigate further"],
    });

    const update = receive(protocol, terminal({ items: [{ ...finalItem, text: result }] }));

    expect(update.events).toEqual([{ type: "result", result }, { type: "complete" }]);
  });

  test.each([
    { name: "plaintext", text: "work completed" },
    { name: "malformed JSON", text: "{" },
    { name: "null", text: "null" },
    { name: "array", text: "[]" },
    { name: "missing fields", text: '{"schemaVersion":1,"outcome":"completed"}' },
    {
      name: "wrong version",
      text: JSON.stringify({ ...syntheticCodexCompletion, schemaVersion: 2 }),
    },
    {
      name: "unknown outcome",
      text: JSON.stringify({ ...syntheticCodexCompletion, outcome: "inconclusive" }),
    },
    { name: "extra fields", text: JSON.stringify({ ...syntheticCodexCompletion, extra: true }) },
    {
      name: "malformed blocker",
      text: JSON.stringify({
        ...syntheticCodexCompletion,
        requiredToolBlockers: [{ tool: "command" }],
      }),
    },
    {
      name: "missing evidence",
      text: JSON.stringify({ ...syntheticCodexCompletion, claims: [{ claim: "complete" }] }),
    },
    {
      name: "invalid errors",
      text: JSON.stringify({ ...syntheticCodexCompletion, errors: "none" }),
    },
  ])("fails $name while retaining the final bytes and native completion", ({ text }) => {
    const update = receive(begin(), terminal({ items: [{ ...finalItem, text }] }));

    expect(update.events[0]).toEqual({ type: "result", result: text });
    expect(update.events[1]).toMatchObject({ type: "error" });
    expect(update.events[2]).toEqual({ type: "complete" });
    expect(update.events).toHaveLength(3);
  });

  test.each([
    {
      kind: "claim",
      completion: {
        ...syntheticCodexCompletion,
        claims: [{ claim: "complete", evidencePath: "tool.log", extra: true }],
      },
    },
    {
      kind: "tool blocker",
      completion: {
        ...syntheticCodexCompletion,
        requiredToolBlockers: [
          { tool: "command", reason: "failed", evidencePath: "tool.log", extra: true },
        ],
      },
    },
  ])("fails extra nested $kind fields as a completion protocol error", ({ completion }) => {
    const text = JSON.stringify(completion);

    const update = receive(begin(), terminal({ items: [{ ...finalItem, text }] }));

    expect(update.events).toEqual([
      { type: "result", result: text },
      { type: "error", message: "Codex completion protocol: invalid completion record" },
      { type: "complete" },
    ]);
  });

  test("sends a strict schema carrying every required completion field", () => {
    const protocol = makeProtocol();
    receive(protocol, { id: 1, result: { userAgent: "synthetic" } });

    const request = JSON.parse(receive(protocol, { id: 2, result: threadReceipt }).input ?? "");

    expect(request.params.outputSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "outcome",
        "requiredToolBlockers",
        "cardState",
        "claims",
        "errors",
        "scopeChanges",
        "unresolvedDecisions",
        "recordPath",
      ],
      properties: {
        schemaVersion: { const: 1 },
        outcome: { enum: ["completed", "blocked", "failed"] },
        requiredToolBlockers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tool", "reason", "evidencePath"],
          },
        },
        claims: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claim", "evidencePath"],
          },
        },
      },
    });
  });

  test("selects the exact executable Codex pins", () => {
    expect(
      agentFromArgs(["--provider", "codex", "--model", "gpt-6.1-sol", "--effort", "high"]),
    ).toEqual({ provider: "codex", model: "gpt-6.1-sol", effort: "high" });
  });
  test("advertises exactly the minimized captured versioned capability catalog", async () => {
    const catalog: unknown = JSON.parse(
      await readFile(`${import.meta.dir}/testing/fixtures/codex-0.166.0/catalog.json`, "utf8"),
    );

    expect(catalog).toEqual(codexAdapter.capabilities.modelEfforts);
  });

  test.each([
    ["gpt-6-luna", "ultra"],
    ["unknown", "high"],
  ])("refuses unsupported pins without substitution: %s:%s", (model, effort) => {
    expect(() =>
      agentFromArgs(["--provider", "codex", "--model", model, "--effort", effort]),
    ).toThrow();
  });

  test("serializes literal skill input and exact pins after the configured response", () => {
    const command = codexAdapter.command({
      agent: { provider: "codex", model: "gpt-6.1-sol", effort: "ultra" },
      stage: "build",
      card: "CARD 'quotes' $x `literal`",
      systemPrompt: "guards\n$(literal)",
    });
    const protocol = requiredProtocol(command);

    expect(command.argv).toEqual(["codex", "--no-daemon", "app-server", "--stdio"]);
    expect(JSON.parse(protocol.initialInput)).toEqual({
      id: 1,
      method: "initialize",
      params: {
        clientInfo: { name: "iterate", version: "1" },
        capabilities: { experimentalApi: false },
      },
    });
    expect(
      receive(protocol, { id: 1, result: { userAgent: "synthetic" } })
        .input?.trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
    ).toEqual([
      { method: "initialized", params: {} },
      {
        id: 2,
        method: "thread/start",
        params: {
          model: "gpt-6.1-sol",
          cwd: process.cwd(),
          config: { model_reasoning_effort: "ultra" },
        },
      },
    ]);
    const started = receive(protocol, {
      id: 2,
      result: { ...threadReceipt, reasoningEffort: "ultra" },
    });
    expect(JSON.parse(started.input ?? "")).toEqual({
      id: 3,
      method: "turn/start",
      params: {
        threadId: "thread-owned",
        outputSchema: codexCompletionOutputSchema,
        model: "gpt-6.1-sol",
        effort: "ultra",
        input: [{ type: "text", text: "$build CARD 'quotes' $x `literal`\n\nguards\n$(literal)" }],
      },
    });
    expect(started.events).toEqual([
      { type: "session_id", sessionId: "thread-owned" },
      { type: "configured_session", configuration: { ...configuration, effort: "ultra" } },
      { type: "required_tool_coverage", coverage: "unknown" },
    ]);
  });
  test("preserves omitted native defaults permissions and base instructions", () => {
    const protocol = makeProtocol({ agent: { provider: "codex" } });
    const initialized = receive(protocol, { id: 1, result: { userAgent: "synthetic" } });
    const configured = receive(protocol, { id: 2, result: threadReceipt });
    expect(JSON.parse(initialized.input?.trim().split("\n")[1] ?? "")).toEqual({
      id: 2,
      method: "thread/start",
      params: { cwd: process.cwd() },
    });
    expect(JSON.parse(configured.input ?? "")).toEqual({
      id: 3,
      method: "turn/start",
      params: {
        threadId: "thread-owned",
        outputSchema: codexCompletionOutputSchema,
        input: [{ type: "text", text: "$build DOT-1\n\nguards" }],
      },
    });
  });
  test("retains captured public messages but refuses their legacy prose completion", async () => {
    const protocol = makeProtocol();
    const captured = await readFile(
      `${import.meta.dir}/testing/fixtures/codex-0.166.0/captured.jsonl`,
      "utf8",
    );
    const events: ProviderEvent[] = [];
    for (const line of captured.replaceAll("/fixture/workspace", process.cwd()).trim().split("\n"))
      events.push(...protocol.receive(line).events);
    protocol.end();
    expect(events.filter((event) => event.type === "complete")).toEqual([{ type: "complete" }]);
    expect(events.filter((event) => event.type === "result")).toHaveLength(1);
    expect(events.filter((event) => event.type === "tool_outcome")).toHaveLength(1);
    expect(
      events.filter((event) =>
        ["permission_denials", "resolved_model", "effective_effort"].includes(event.type),
      ),
    ).toEqual([]);
    expect(events.filter((event) => event.type === "error")).toEqual([
      { type: "error", message: "Codex completion protocol: final reply is not valid JSON" },
    ]);
    expect(events.filter((event) => event.type === "usage")).toHaveLength(3);
    expect(
      events
        .filter((event) => event.type === "usage")
        .every((event) => event.type === "usage" && Object.keys(event.usage).join() === "raw"),
    ).toBe(true);
  });
  test("resumes only the explicit matching thread", () => {
    const protocol = makeProtocol({
      resumeSessionId: "thread-owned",
      resumeConfiguration: configuration,
    });
    const initialized = receive(protocol, { id: 1, result: { userAgent: "synthetic" } });
    const configured = receive(protocol, { id: 2, result: threadReceipt });
    expect(JSON.parse(initialized.input?.trim().split("\n")[1] ?? "").method).toBe("thread/resume");
    expect(JSON.parse(initialized.input?.trim().split("\n")[1] ?? "").params.threadId).toBe(
      "thread-owned",
    );
    expect(JSON.parse(configured.input ?? "").method).toBe("turn/start");
    expect(JSON.parse(configured.input ?? "").params.outputSchema).toEqual(
      codexCompletionOutputSchema,
    );
    expect(configured.events).toContainEqual({
      type: "configured_session",
      configuration: { ...configuration, provenance: "codex.app-server.thread/resume" },
    });
  });
  describe("thread usage observations", () => {
    const tokenUsage = {
      total: {
        inputTokens: 116_806,
        cachedInputTokens: 83_968,
        cacheWriteInputTokens: 0,
        outputTokens: 884,
        reasoningOutputTokens: 118,
        totalTokens: 117_690,
      },
      last: {
        inputTokens: 33_045,
        cachedInputTokens: 31_488,
        cacheWriteInputTokens: 0,
        outputTokens: 161,
        reasoningOutputTokens: 49,
        totalTokens: 33_206,
      },
      modelContextWindow: 475_000,
    };
    const historicalUsage = notify("thread/tokenUsage/updated", {
      turnId: "turn-prior",
      tokenUsage,
    });

    test("retains resumed usage while awaiting the current turn", () => {
      const protocol = makeProtocol({
        resumeSessionId: "thread-owned",
        resumeConfiguration: configuration,
      });
      receive(protocol, { id: 1, result: { userAgent: "synthetic 0.166.0" } });
      receive(protocol, {
        id: 2,
        result: {
          ...threadReceipt,
          thread: {
            ...threadReceipt.thread,
            turns: [
              {
                id: "turn-prior",
                status: "completed",
                error: null,
                items: [{ ...finalItem, id: "prior-final", text: "prior reply" }],
              },
            ],
          },
        },
      });

      const observed = receive(protocol, historicalUsage);

      expect(observed).toEqual({ events: [{ type: "usage", usage: { raw: [historicalUsage] } }] });
      expect(() => protocol.end()).toThrow();
      expect(
        receive(protocol, {
          id: 3,
          result: { turn: { id: "turn-owned", status: "inProgress", error: null, items: [] } },
        }),
      ).toEqual({ events: [] });
      expect(receive(protocol, terminal())).toEqual({
        events: [{ type: "result", result: syntheticCodexReply }, { type: "complete" }],
        close: true,
      });
      protocol.end();
    });

    test.each(["turn-prior", "turn-owned"])(
      "retains repeated usage for %s as raw observations while running",
      (turnId) => {
        const protocol = begin();
        const snapshot = notify("thread/tokenUsage/updated", { turnId, tokenUsage });

        const first = receive(protocol, snapshot);
        const repeated = receive(protocol, snapshot);

        expect(first).toEqual({ events: [{ type: "usage", usage: { raw: [snapshot] } }] });
        expect(repeated).toEqual(first);
        expect(() => protocol.end()).toThrow();
        expect(receive(protocol, terminal())).toEqual({
          events: [{ type: "result", result: syntheticCodexReply }, { type: "complete" }],
          close: true,
        });
        protocol.end();
      },
    );

    test.each([
      { invalid: "missing turn ID", params: { ...historicalUsage.params, turnId: undefined } },
      { invalid: "empty turn ID", params: { ...historicalUsage.params, turnId: "" } },
      { invalid: "missing usage", params: { ...historicalUsage.params, tokenUsage: undefined } },
      {
        invalid: "missing total",
        params: { ...historicalUsage.params, tokenUsage: { last: tokenUsage.last } },
      },
      {
        invalid: "missing last",
        params: { ...historicalUsage.params, tokenUsage: { total: tokenUsage.total } },
      },
      {
        invalid: "malformed total",
        params: { ...historicalUsage.params, tokenUsage: { ...tokenUsage, total: {} } },
      },
      {
        invalid: "malformed last",
        params: { ...historicalUsage.params, tokenUsage: { ...tokenUsage, last: {} } },
      },
      {
        invalid: "negative total",
        params: {
          ...historicalUsage.params,
          tokenUsage: { ...tokenUsage, total: { ...tokenUsage.total, inputTokens: -1 } },
        },
      },
      {
        invalid: "negative last",
        params: {
          ...historicalUsage.params,
          tokenUsage: { ...tokenUsage, last: { ...tokenUsage.last, inputTokens: -1 } },
        },
      },
      {
        invalid: "fractional total",
        params: {
          ...historicalUsage.params,
          tokenUsage: { ...tokenUsage, total: { ...tokenUsage.total, outputTokens: 0.5 } },
        },
      },
      {
        invalid: "fractional last",
        params: {
          ...historicalUsage.params,
          tokenUsage: { ...tokenUsage, last: { ...tokenUsage.last, outputTokens: 0.5 } },
        },
      },
    ])("rejects $invalid while awaiting the current turn", ({ params }) => {
      const protocol = configuredProtocol();

      expect(() => receive(protocol, { method: "thread/tokenUsage/updated", params })).toThrow();
    });

    test.each([
      { phase: "pending", setup: configuredProtocol },
      { phase: "running", setup: begin },
    ])("ignores malformed foreign usage while $phase", ({ setup }) => {
      const protocol = setup();

      const observed = receive(protocol, {
        method: "thread/tokenUsage/updated",
        params: { threadId: "foreign", tokenUsage: null },
      });

      expect(observed).toEqual({ events: [] });
      expect(() => protocol.end()).toThrow();
    });

    test.each([
      { phase: "before initialization", setup: makeProtocol },
      {
        phase: "before configured thread",
        setup: () => {
          const protocol = makeProtocol();
          receive(protocol, { id: 1, result: { userAgent: "synthetic" } });
          return protocol;
        },
      },
      { phase: "after terminal", setup: completedProtocol },
    ])("rejects owned usage $phase", ({ setup }) => {
      expect(() => receive(setup(), historicalUsage)).toThrow();
    });

    test.each([
      notify("item/completed", {
        turnId: "turn-prior",
        item: { ...finalItem, id: "prior-final", text: "prior reply" },
      }),
      terminal({ id: "turn-prior" }),
      notify("error", {
        turnId: "turn-prior",
        error: { message: "prior failure" },
        willRetry: false,
      }),
      notify("model/rerouted", {
        turnId: "turn-prior",
        fromModel: "gpt-6.1-sol",
        toModel: "gpt-6-luna",
        reason: "synthetic",
      }),
    ])("rejects non-usage authority before the current turn: %j", (record) => {
      const protocol = configuredProtocol();
      receive(protocol, historicalUsage);

      expect(() => receive(protocol, record)).toThrow();
      expect(() => protocol.end()).toThrow();
    });

    test("retains current-turn authority after observing historical usage", () => {
      const protocol = begin();
      receive(protocol, historicalUsage);

      expect(() =>
        receive(
          protocol,
          notify("item/completed", {
            turnId: "turn-prior",
            item: { ...finalItem, id: "prior-final", text: "prior reply" },
          }),
        ),
      ).toThrow();
      expect(() => receive(protocol, terminal({ id: "turn-prior" }))).toThrow();
      expect(receive(protocol, terminal())).toEqual({
        events: [{ type: "result", result: syntheticCodexReply }, { type: "complete" }],
        close: true,
      });
      protocol.end();
    });
  });
  test.each([
    { model: "gpt-6-luna" },
    { reasoningEffort: null },
    { reasoningEffort: "medium" },
    { cwd: "/different" },
    { approvalPolicy: "on-request" },
    { sandbox: { type: "workspaceWrite" } },
  ])("refuses resumed configuration mismatch before turn start: %j", (mismatch) => {
    const protocol = makeProtocol({
      resumeSessionId: "thread-owned",
      resumeConfiguration: configuration,
    });
    receive(protocol, { id: 1, result: { userAgent: "synthetic" } });
    const update = receive(protocol, { id: 2, result: { ...threadReceipt, ...mismatch } });
    expect(update.input).toBeUndefined();
    expect(update.close).toBe(true);
    expect(update.events.some((event) => event.type === "error")).toBe(true);
  });
  test.each([
    {},
    { stage: "review" as const, resumeConfiguration: configuration },
    { agent: { provider: "codex" as const }, resumeConfiguration: configuration },
    { resumeConfiguration: { ...configuration, model: "gpt-6-luna" } },
  ])("refuses incompatible local author resume: %j", (options) => {
    expect(() => makeProtocol({ resumeSessionId: "thread-owned", ...options })).toThrow();
  });
  test.each([
    { id: 22, result: {} },
    { id: 1, error: { code: -32_000, message: "invalid model" } },
    { id: 1, result: {} },
    { id: 1 },
  ])("rejects malformed responses request errors and unknown identities: %j", (record) => {
    expect(() => receive(makeProtocol(), record)).toThrow();
  });
  test.each([
    notify("turn/completed", {
      turn: { id: "foreign-turn", status: "completed", error: null, items: [finalItem] },
    }),
    notify("turn/completed", {
      turn: { id: "turn-owned", status: "completed", error: "malformed", items: [finalItem] },
    }),
    notify("item/agentMessage/delta", { itemId: "unknown", delta: "x" }),
    notify("item/completed", { item: { type: "agentMessage", id: "broken", text: 3 } }),
    notify("item/completed", {
      item: { type: "commandExecution", id: "broken", status: "completed" },
    }),
    notify("thread/tokenUsage/updated", { tokenUsage: { total: {} } }),
  ])("rejects malformed or conflicting recognized records: %j", (record) => {
    expect(() => receive(begin(), record)).toThrow();
  });
  test.each([
    {
      boundary: "response",
      setup: configuredProtocol,
      record: {
        id: 3,
        result: { turn: { id: "turn-owned", status: "inProgress", error: "malformed", items: [] } },
      },
    },
    {
      boundary: "started",
      setup: begin,
      record: notify("turn/started", {
        turn: { id: "turn-owned", status: "inProgress", error: "malformed", items: [] },
      }),
    },
    { boundary: "completed", setup: begin, record: terminal({ error: "malformed" }) },
  ])("rejects a malformed present turn error at $boundary", ({ setup, record }) => {
    const protocol = setup();

    expect(() => receive(protocol, record)).toThrow();
  });

  test.each([
    {
      boundary: "response/absent",
      start: {},
      started: { error: null },
      completed: { error: null },
    },
    {
      boundary: "response/null",
      start: { error: null },
      started: { error: null },
      completed: { error: null },
    },
    { boundary: "started/absent", start: { error: null }, started: {}, completed: { error: null } },
    {
      boundary: "started/null",
      start: { error: null },
      started: { error: null },
      completed: { error: null },
    },
    {
      boundary: "completed/absent",
      start: { error: null },
      started: { error: null },
      completed: {},
    },
    {
      boundary: "completed/null",
      start: { error: null },
      started: { error: null },
      completed: { error: null },
    },
  ])("accepts the schema-optional turn error at $boundary", ({ start, started, completed }) => {
    const protocol = configuredProtocol();
    receive(protocol, {
      id: 3,
      result: { turn: { id: "turn-owned", status: "inProgress", items: [], ...start } },
    });
    receive(
      protocol,
      notify("turn/started", {
        turn: { id: "turn-owned", status: "inProgress", items: [], ...started },
      }),
    );

    const update = receive(
      protocol,
      notify("turn/completed", {
        turn: { id: "turn-owned", status: "completed", items: [finalItem], ...completed },
      }),
    );

    expect(update).toEqual({
      events: [{ type: "result", result: syntheticCodexReply }, { type: "complete" }],
      close: true,
    });
    protocol.end();
  });

  test.each([
    { phase: "running", setup: begin },
    { phase: "terminal", setup: completedProtocol },
  ])("rejects unsent response zero immediately while $phase", ({ setup }) => {
    const protocol = setup();
    const unsolicited = {
      id: 0,
      result: { turn: { id: "foreign-turn", status: "inProgress", error: null, items: [] } },
    };

    expect(() => receive(protocol, unsolicited)).toThrow(
      "unexpected or duplicate response identity",
    );
    expect(() =>
      receive(
        protocol,
        notify("turn/completed", {
          turn: {
            id: "foreign-turn",
            status: "completed",
            error: null,
            items: [{ ...finalItem, text: "FOREIGN" }],
          },
        }),
      ),
    ).toThrow();
  });

  test("preserves the owned turn and final after rejecting an unsent response", () => {
    const protocol = begin();
    expect(() =>
      receive(protocol, {
        id: 0,
        result: { turn: { id: "foreign", status: "inProgress", error: null, items: [] } },
      }),
    ).toThrow();

    const update = receive(protocol, terminal());

    expect(update.events).toEqual([
      { type: "result", result: syntheticCodexReply },
      { type: "complete" },
    ]);
    protocol.end();
  });

  test("ignores foreign and unknown notifications without completing the owned turn", () => {
    const protocol = begin();
    expect(
      receive(protocol, { method: "turn/completed", params: { threadId: "foreign", turn: {} } }),
    ).toEqual({ events: [] });
    expect(receive(protocol, { method: "future/variant", params: { arbitrary: 1 } })).toEqual({
      events: [],
    });
    expect(() => protocol.end()).toThrow();
    expect(receive(protocol, terminal()).events).toContainEqual({ type: "complete" });
  });
  test.each(["failed", "interrupted", "inProgress"])(
    "rejects terminal %s even with final prose",
    (status) => {
      const update = receive(begin(), terminal({ status, error: { message: "terminal failure" } }));
      expect(update.close).toBe(true);
      expect(update.events).toContainEqual({ type: "error", message: "terminal failure" });
      expect(update.events.some((event) => event.type === "complete")).toBe(false);
    },
  );
  test("fails completed turns without a final reply", () => {
    expect(receive(begin(), terminal({ items: [] })).events).toEqual([
      { type: "error", message: "Codex completed without a final reply" },
    ]);
  });
  test("rejects truncated JSON EOF and duplicate terminals", () => {
    const protocol = begin();
    expect(() => protocol.receive('{"method":"turn/comp')).toThrow();
    expect(() => protocol.end()).toThrow();
    receive(protocol, terminal());
    expect(() => receive(protocol, terminal())).toThrow();
  });
  test("uses independent invocation state", () => {
    const left = begin();
    const right = makeProtocol();
    receive(left, terminal());
    expect(() => right.end()).toThrow();
    expect(receive(right, { id: 1, result: { userAgent: "synthetic" } }).input).toContain(
      "thread/start",
    );
  });
  test.each([
    {
      type: "commandExecution",
      id: "command",
      command: "check",
      cwd: "/fixture",
      commandActions: [],
      status: "inProgress",
    },
    { type: "fileChange", id: "file", changes: [], status: "inProgress" },
    {
      type: "mcpToolCall",
      id: "mcp",
      arguments: {},
      server: "synthetic",
      tool: "read",
      status: "inProgress",
    },
    {
      type: "dynamicToolCall",
      id: "dynamic",
      arguments: {},
      tool: "synthetic",
      status: "inProgress",
    },
  ])("fails terminal success with an unfinished synthetic $type", (item) => {
    const protocol = begin();
    receive(protocol, notify("item/started", { item }));

    const update = receive(protocol, terminal());

    expect(update.events.some((event) => event.type === "error")).toBe(true);
    expect(update.events.some((event) => event.type === "complete")).toBe(false);
  });
  test("reconciles an observed command from the terminal snapshot while retaining an expected red result", () => {
    const protocol = begin();
    const item = {
      type: "commandExecution",
      id: "red",
      command: "test -e absent",
      cwd: "/fixture",
      commandActions: [],
      status: "inProgress",
    };
    receive(protocol, notify("item/started", { item }));

    const update = receive(
      protocol,
      terminal({
        items: [{ ...item, status: "failed", exitCode: 1 }, finalItem],
      }),
    );

    expect(update.events.some((event) => event.type === "error")).toBe(false);
    expect(update.events).toContainEqual({ type: "complete" });
    expect(update.events).toContainEqual({
      type: "tool_outcome",
      outcome: {
        itemId: "red",
        kind: "commandExecution",
        status: "failed",
        raw: { ...item, status: "failed", exitCode: 1 },
      },
    });
  });
  describe("synthetic opaque tool payloads", () => {
    const items = [
      { id: "file", type: "fileChange", status: "completed", changes: { opaque: true } },
      {
        id: "dynamic",
        type: "dynamicToolCall",
        status: "completed",
        tool: { opaque: true },
        arguments: ["uninterpreted"],
      },
      {
        id: "mcp",
        type: "mcpToolCall",
        status: "completed",
        server: "synthetic",
        tool: "read",
        arguments: {},
        result: { content: { opaque: true }, future: [1, null] },
      },
    ];

    test.each(items)("retains $type payload exactly without interpreting its details", (item) => {
      const protocol = begin();

      const observed = receive(protocol, notify("item/completed", { item }));

      expect(observed).toEqual({
        events: [
          { type: "tool_call", name: item.type, args: JSON.stringify(item) },
          {
            type: "tool_outcome",
            outcome: { itemId: item.id, kind: item.type, status: item.status, raw: item },
          },
        ],
      });
      expect(receive(protocol, terminal())).toEqual({
        events: [{ type: "result", result: syntheticCodexReply }, { type: "complete" }],
        close: true,
      });
      protocol.end();
    });

    test.each(items)("rejects a malformed $type status despite opaque details", (item) => {
      const protocol = begin();
      const malformed = { ...item, status: "future-status" };

      expect(() => receive(protocol, notify("item/completed", { item: malformed }))).toThrow();
    });

    test.each(items)("rejects an in-progress $type completion despite opaque details", (item) => {
      const protocol = begin();
      const unfinished = { ...item, status: "inProgress" };

      expect(() => receive(protocol, notify("item/completed", { item: unfinished }))).toThrow();
    });

    test.each(items)("preserves completed $type identity over opaque details", (item) => {
      const protocol = begin();
      receive(protocol, notify("item/completed", { item }));

      expect(receive(protocol, notify("item/completed", { item }))).toEqual({ events: [] });
      expect(() =>
        receive(protocol, notify("item/completed", { item: { ...item, future: "conflict" } })),
      ).toThrow();
      expect(() => receive(protocol, notify("item/started", { item }))).toThrow();
    });

    test.each([
      { id: "file", type: "fileChange", status: "declined", changes: { opaque: true } },
      { id: "file", type: "fileChange", status: "failed", changes: { opaque: true } },
      {
        id: "dynamic",
        type: "dynamicToolCall",
        status: "completed",
        success: false,
        tool: { opaque: true },
      },
      {
        id: "mcp",
        type: "mcpToolCall",
        status: "completed",
        server: "synthetic",
        tool: "read",
        arguments: {},
        error: { message: "required tool unavailable" },
        result: { content: { opaque: true } },
      },
    ])("retains explicit $type failure despite opaque details: $status", (item) => {
      const protocol = begin();

      const observed = receive(protocol, notify("item/completed", { item }));

      expect(observed.events).toContainEqual({
        type: "tool_outcome",
        outcome: { itemId: item.id, kind: item.type, status: item.status, raw: item },
      });
      expect(observed.events.some((event) => event.type === "error")).toBe(true);
    });

    test("ignores unknown item payloads without fabricating tool outcomes", () => {
      const protocol = begin();
      const item = { id: "future", type: "future-tool", payload: { success: true } };

      const observed = receive(protocol, notify("item/completed", { item }));

      expect(observed).toEqual({ events: [] });
      expect(() => protocol.end()).toThrow();
    });
  });
  test.each([
    {
      type: "commandExecution",
      id: "command",
      command: "test -e absent",
      cwd: "/fixture",
      commandActions: [],
      status: "failed",
      exitCode: 1,
    },
    {
      type: "fileChange",
      id: "file",
      changes: [{ path: "a", diff: "contents", kind: { type: "add" } }],
      status: "completed",
    },
    {
      type: "mcpToolCall",
      id: "mcp",
      arguments: {},
      server: "synthetic",
      tool: "read",
      status: "completed",
      result: { content: [] },
    },
  ])("retains synthetic outcomes without inventing required failure: %j", (item) => {
    const protocol = begin();
    const outcome = receive(protocol, notify("item/completed", { item }));
    expect(outcome.events).toContainEqual({
      type: "tool_outcome",
      outcome: { itemId: item.id, kind: item.type, status: item.status, raw: item },
    });
    expect(outcome.events.some((event) => event.type === "error")).toBe(false);
    expect(receive(protocol, terminal()).events).toContainEqual({ type: "complete" });
  });
  test.each([
    {
      type: "commandExecution",
      id: "command",
      command: "write",
      cwd: "/fixture",
      commandActions: [],
      status: "declined",
    },
    { type: "fileChange", id: "file", changes: [], status: "failed" },
    {
      type: "mcpToolCall",
      id: "mcp",
      arguments: {},
      server: "synthetic",
      tool: "write",
      status: "failed",
      error: { message: "failure" },
    },
    {
      type: "dynamicToolCall",
      id: "dynamic",
      arguments: {},
      tool: "synthetic",
      status: "completed",
      success: false,
    },
  ])("preserves explicit synthetic tool failure evidence: %j", (item) => {
    expect(
      receive(begin(), notify("item/completed", { item })).events.some(
        (event) => event.type === "error",
      ),
    ).toBe(true);
  });
  test.each([
    notify("model/rerouted", {
      fromModel: "gpt-6.1-sol",
      toModel: "gpt-6-luna",
      reason: "syntheticModelChange",
    }),
    notify("error", { error: { message: "auth error" }, willRetry: false }),
  ])("surfaces synthetic errors and reroutes without telemetry substitution: %j", (record) => {
    expect(receive(begin(), record).events.some((event) => event.type === "error")).toBe(true);
  });
  test("retains structured routing evidence for subsequent resume refusal", () => {
    const receipt = {
      fromModel: "gpt-6.1-sol",
      toModel: "gpt-6-luna",
      reason: "syntheticModelChange",
    };
    const update = receive(begin(), notify("model/rerouted", receipt));

    expect(update.events).toContainEqual({ type: "model_reroute", receipt });
  });

  test("fails waiting native client actions without granting permission", () => {
    expect(() =>
      receive(begin(), {
        id: "server-request",
        method: "item/commandExecution/requestApproval",
        params: {},
      }),
    ).toThrow();
  });
  test("refuses explicit dollars before dispatch", () => {
    expect(() =>
      budgetFor({
        provider: "codex",
        capabilities: codexAdapter.capabilities,
        explicitSession: "1",
      }),
    ).toThrow();
    expect(() => makeProtocol({ budget: "1" })).toThrow();
    expect(
      budgetFor({ provider: "codex", capabilities: codexAdapter.capabilities }),
    ).toBeUndefined();
  });
});

describe("Codex session host", () => {
  let harness: CodexHarness;
  beforeAll(() => {
    harness = CodexHarness.setup();
  });
  afterAll(async () => {
    await harness.teardown();
  });
  test("persists blocked work as a failed session after normal native completion", async () => {
    const observed = await harness.run("blocked");

    expect(observed.code).toBe(1);
    expect(observed.result).toMatchObject({
      status: "failed",
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown",
      errors: ["Codex agent-reported completion: blocked; required tool blockers: 1"],
      settlement: { state: "settled" },
    });
    expect(observed.result.permissionDenials).toBeUndefined();
    expect(observed.result.toolOutcomes).toBeUndefined();
    expect(JSON.parse(observed.result.result)).toMatchObject({ outcome: "blocked" });
    const report: unknown = sessionReportSchema.parse(observed.result);
    expect(report).toEqual(observed.result);
  });
  test.each(["complete", "optional-error"])(
    "owns one peer and completes %s protocol with truthful unknown coverage",
    async (scenario) => {
      const observed = await harness.run(scenario);
      expect(observed.code).toBe(0);
      expect(observed.stdout).toBe(`${syntheticCodexReply}\n`);
      expect(observed.result).toMatchObject({
        status: "completed",
        providerCompleted: true,
        result: syntheticCodexReply,
        configuredSession: configuration,
        requiredToolOutcomeCoverage: "unknown",
        accountingComplete: false,
        settlement: { state: "settled" },
      });
      expect(observed.result.resolvedModel).toBeUndefined();
      expect(observed.result.effectiveEffort).toBeUndefined();
      expect(observed.result.cost).toBeUndefined();
      expect(observed.result.usage.parent).toBeUndefined();
      expect(observed.result.usage.raw).toHaveLength(1);
      expect(observed.result.errors).toEqual([]);
      expect(await observed.launches()).toHaveLength(1);
      expect(await observed.requests()).toHaveLength(4);
      expect(await readFile(`${observed.root}/eof`, "utf8")).toBe("closed\n");
      expect(await readFile(observed.result.logPath, "utf8")).toContain(
        "[stderr]\nsynthetic app-server diagnostic",
      );
      const roundTrip: unknown = sessionReportSchema.parse(observed.result);
      expect(roundTrip).toEqual(observed.result);
    },
  );
  test.each([
    { scenario: "failed", outcome: "failed", blockers: 0 },
    { scenario: "required-blocker", outcome: "completed", blockers: 1 },
  ])(
    "fails typed $scenario without fabricating native failures",
    async ({ scenario, outcome, blockers }) => {
      const observed = await harness.run(scenario);

      expect(observed.code).toBe(1);
      expect(observed.result).toMatchObject({
        status: "failed",
        providerCompleted: true,
        requiredToolOutcomeCoverage: "unknown",
        processExit: { code: 0, signal: null },
        errors: [
          `Codex agent-reported completion: ${outcome}; required tool blockers: ${blockers}`,
        ],
      });
      expect(observed.result.permissionDenials).toBeUndefined();
      expect(observed.result.toolOutcomes).toBeUndefined();
    },
  );

  test.each([
    { scenario: "native-error", error: "Codex error: synthetic native error" },
    { scenario: "native-tool-failure", error: "Codex mcpToolCall failed" },
  ])("keeps $scenario authoritative over reported completed work", async ({ scenario, error }) => {
    const observed = await harness.run(scenario);

    expect(observed.code).toBe(1);
    expect(observed.result).toMatchObject({
      status: "failed",
      providerCompleted: true,
      result: syntheticCodexReply,
      requiredToolOutcomeCoverage: "unknown",
      errors: [error],
    });
  });

  test("keeps an expected nonzero probe usable with reported completed work", async () => {
    const observed = await harness.run("expected-probe");

    expect(observed.code).toBe(0);
    expect(observed.result).toMatchObject({
      status: "completed",
      providerCompleted: true,
      errors: [],
      requiredToolOutcomeCoverage: "unknown",
      toolOutcomes: [
        { itemId: "probe", kind: "commandExecution", status: "failed", raw: { exitCode: 1 } },
      ],
    });
  });

  test.each(["legacy-completion", "malformed-completion"])(
    "fails %s after retaining normal native completion",
    async (scenario) => {
      const observed = await harness.run(scenario);

      expect(observed.code).toBe(1);
      expect(observed.result).toMatchObject({
        status: "failed",
        providerCompleted: true,
        requiredToolOutcomeCoverage: "unknown",
        errors: ["Codex completion protocol: final reply is not valid JSON"],
      });
    },
  );

  test("fails a final reply when the observed command never completed", async () => {
    const observed = await harness.run("unfinished-tool");

    expect(observed.code).toBe(1);
    expect(observed.result.status).toBe("failed");
    expect(observed.result.errors.join()).toContain("unfinished tool items");
    expect(observed.result.requiredToolOutcomeCoverage).toBe("unknown");
    expect(observed.result.settlement?.state).toBe("settled");
  });

  test("bounds a peer that stays alive after terminal stdin EOF", async () => {
    const observed = await harness.run("terminal-hang", { timeoutMs: 4000, idleTimeoutMs: 1500 });

    expect(observed.code).toBe(1);
    expect(observed.result.status).toBe("failed");
    expect(observed.result.providerCompleted).toBe(true);
    expect(observed.result.result).toBe(syntheticCodexReply);
    expect(observed.result.errors).toEqual(["silent for 1500ms, so it was stopped"]);
    expect(observed.result.durationMs).toBeGreaterThanOrEqual(1500);
    expect(observed.result.durationMs).toBeLessThan(2500);
    expect(observed.result.settlement?.state).toBe("settled");
  }, 6000);

  test("keeps nonzero native exit distinct from protocol completion", async () => {
    const observed = await harness.run("nonzero");
    expect(observed.result.providerCompleted).toBe(true);
    expect(observed.result.errors.join()).toContain("exit 7:");
  });
  test.each([
    "truncated",
    "no-terminal",
    "no-final",
    "mismatch",
    "missing-history",
    "stdin-closed",
  ])(
    "fails boundedly for %s",
    async (scenario) => {
      const observed = await harness.run(scenario, { timeoutMs: 300 });
      expect(observed.result.status).toBe("failed");
      expect(observed.result.providerCompleted).toBe(false);
      expect(observed.result.settlement?.state).toBe("settled");
    },
    6000,
  );
  test.each(["mismatch", "missing-history"])("starts no turn after %s", async (scenario) => {
    const observed = await harness.run(scenario, { timeoutMs: 300 });

    expect(await observed.requests()).toHaveLength(3);
    expect(observed.result.providerCompleted).toBe(false);
  });

  test("retains stdin EPIPE as its explicit failure cause", async () => {
    const observed = await harness.run("stdin-closed", { timeoutMs: 300 });

    expect(observed.result.errors.join()).toContain("provider stdin failed: EPIPE");
    expect(observed.result.providerCompleted).toBe(false);
  });

  test.each(["silent", "backpressure", "descendant", "cancel"])(
    "bounds writes and group lifetime for %s",
    async (scenario) => {
      const observed = await harness.run(
        scenario,
        Object.assign(
          {
            systemPrompt: scenario === "backpressure" ? "x".repeat(2_000_000) : "guards",
            timeoutMs: 450,
          },
          definedFields({ cancelMs: scenario === "cancel" ? 250 : undefined }),
        ),
      );
      expect(observed.result.status).toBe("failed");
      expect(observed.result.durationMs).toBeLessThan(2500);
      expect(observed.result.errors.join()).toContain(
        scenario === "cancel" ? "caller cancellation" : "wall-time",
      );
      expect(observed.result.settlement?.state).toBe("settled");
    },
    6000,
  );
  test("retains the idle bound while awaiting protocol responses", async () => {
    const observed = await harness.run("silent", { idleTimeoutMs: 100 });
    expect(observed.result.errors.join()).toContain("silent for 100ms");
    expect(observed.result.settlement?.state).toBe("settled");
  });
});
