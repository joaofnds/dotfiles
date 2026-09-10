import { describe, expect, test } from "bun:test";
import { commandFor, eventsFrom } from "./provider.ts";

describe(commandFor.name, () => {
  test("passes the codex prompt through stdin and max as a literal configuration argument", () => {
    const command = commandFor({
      agent: { provider: "codex", model: "model 'quoted'; $(touch nope)", effort: "max" },
      stage: "build",
      card: "cards/a 'quoted'; `touch nope`.md",
      systemPrompt: "Follow $rules.\nDo not expand $(anything).",
      budget: "50",
    });

    expect(command).toEqual({
      argv: [
        "codex",
        "exec",
        "--json",
        "--dangerously-bypass-approvals-and-sandbox",
        "-m",
        "model 'quoted'; $(touch nope)",
        "-c",
        'model_reasoning_effort="max"',
      ],
      stdin:
        "Use the $build skill on cards/a 'quoted'; `touch nope`.md.\n\nFollow $rules.\nDo not expand $(anything).",
    });
  });

  test("keeps the claude budget and system prompt as separate arguments", () => {
    const command = commandFor({
      agent: { provider: "claude", model: "opus", effort: "high" },
      stage: "shape",
      card: "cards/a 'quoted'.md",
      systemPrompt: "Use $rules; `literal`",
      budget: "12.50",
    });

    expect(command).toEqual({
      argv: [
        "claude",
        "--print",
        "--verbose",
        "--output-format",
        "stream-json",
        "--model",
        "opus",
        "--max-budget-usd",
        "12.50",
        "--append-system-prompt",
        "Use $rules; `literal`",
        "--effort",
        "high",
        "--dangerously-skip-permissions",
        "/shape cards/a 'quoted'.md",
      ],
    });
  });

  test("passes the opencode variant and prompt literally without a claude budget", () => {
    const command = commandFor({
      agent: { provider: "opencode", model: "openai/gpt-6", effort: "high; $(literal)" },
      stage: "triage",
      card: "",
      systemPrompt: "Follow $rules.",
      budget: "50",
    });

    expect(command).toEqual({
      argv: [
        "opencode",
        "run",
        "--format",
        "json",
        "--model",
        "openai/gpt-6",
        "--variant",
        "high; $(literal)",
        "--dangerously-skip-permissions",
        "Use the $triage skill.\n\nFollow $rules.",
      ],
    });
  });
});

describe(eventsFrom.name, () => {
  test("normalizes a claude session with text, tool activity, and a completed result", () => {
    const records = [
      { type: "system", subtype: "init", session_id: "claude-session", tools: ["Bash"] },
      {
        type: "assistant",
        message: {
          content: [
            { type: "thinking", thinking: "private" },
            { type: "text", text: "Running checks." },
            { type: "tool_use", id: "tool-1", name: "Bash", input: { command: "bun test" } },
          ],
        },
      },
      {
        type: "result",
        subtype: "success",
        is_error: false,
        result: "Checks passed.",
        num_turns: 3,
        total_cost_usd: 0.42,
        duration_ms: 1000,
      },
    ];

    const events = records.flatMap((record) => eventsFrom("claude", JSON.stringify(record)));

    expect(events).toEqual([
      { type: "session_id", sessionId: "claude-session" },
      { type: "text", text: "Running checks." },
      { type: "tool_call", name: "Bash", args: "bun test" },
      { type: "result", result: "Checks passed." },
      { type: "usage", turns: 3, cost: 0.42 },
      { type: "complete" },
    ]);
  });

  test("keeps codex messages as candidate replies until its turn completes", () => {
    const records = [
      { type: "thread.started", thread_id: "codex-session" },
      {
        type: "item.completed",
        item: { id: "item_0", type: "agent_message", text: "I will check." },
      },
      {
        type: "item.started",
        item: {
          id: "item_1",
          type: "command_execution",
          command: "bun test",
          status: "in_progress",
        },
      },
      {
        type: "item.completed",
        item: { id: "item_2", type: "agent_message", text: "Checks passed." },
      },
    ];

    const events = records.flatMap((record) => eventsFrom("codex", JSON.stringify(record)));

    expect(events).toEqual([
      { type: "session_id", sessionId: "codex-session" },
      { type: "text", text: "I will check." },
      { type: "result", result: "I will check." },
      { type: "tool_call", name: "Bash", args: "bun test" },
      { type: "text", text: "Checks passed." },
      { type: "result", result: "Checks passed." },
    ]);
    expect(
      eventsFrom(
        "codex",
        '{"type":"turn.completed","usage":{"input_tokens":123,"cached_input_tokens":0,"output_tokens":45}}',
      ),
    ).toEqual([{ type: "complete" }]);
  });

  test("normalizes opencode text and tools and completes only its terminal step", () => {
    const records = [
      { type: "step_start", sessionID: "ses_1", part: { type: "step-start" } },
      {
        type: "tool_use",
        part: {
          type: "tool",
          tool: "read",
          state: { status: "completed", input: { filePath: "README.md" }, output: "readme" },
        },
      },
      { type: "step_finish", part: { type: "step-finish", reason: "tool-calls", cost: 0.1 } },
      { type: "text", part: { type: "text", text: "Finished.", time: { start: 1, end: 2 } } },
      { type: "step_finish", part: { type: "step-finish", reason: "stop", cost: 0.2 } },
    ];

    const events = records.flatMap((record) => eventsFrom("opencode", JSON.stringify(record)));

    expect(events).toEqual([
      { type: "session_id", sessionId: "ses_1" },
      { type: "tool_call", name: "read", args: '{"filePath":"README.md"}' },
      { type: "text", text: "Finished." },
      { type: "result", result: "Finished." },
      { type: "complete" },
    ]);
  });

  describe("when the provider reports a failure", () => {
    test.each([
      [
        "claude",
        { type: "error", error: { message: "authentication failed" } },
        "authentication failed",
      ],
      [
        "claude",
        {
          type: "result",
          is_error: true,
          errors: ["budget exceeded"],
          num_turns: 2,
          total_cost_usd: 50,
        },
        "budget exceeded",
      ],
      ["claude", { type: "result", is_error: true, result: "request failed" }, "request failed"],
      ["claude", { type: "result", is_error: true }, "the provider reported an error"],
      [
        "codex",
        { type: "turn.failed", error: { message: "rate limit exceeded" } },
        "rate limit exceeded",
      ],
      ["codex", { type: "error", message: "stream disconnected" }, "stream disconnected"],
      [
        "opencode",
        { type: "error", error: { name: "APIError", data: { message: "invalid API key" } } },
        "invalid API key",
      ],
    ] as const)("retains the %s diagnostic from %j", (provider, record, diagnostic) => {
      const events = eventsFrom(provider, JSON.stringify(record));

      expect(events.filter((event) => event.type === "error")).toEqual([
        { type: "error", message: diagnostic },
      ]);
    });
  });

  describe("when the stream contains unconsumed information", () => {
    test.each(["claude", "codex", "opencode"] as const)(
      "ignores %s diagnostics and unknown event types",
      (provider) => {
        expect(eventsFrom(provider, "loading configuration...")).toEqual([]);
        expect(eventsFrom(provider, '{"type":"future.event","payload":{"anything":42}}')).toEqual(
          [],
        );
      },
    );
  });

  describe("when consumed fields violate the stream contract", () => {
    test.each([
      ["claude", '{"type":"result","is_error":"false"}'],
      ["claude", '{"type":"assistant","message":{"content":[{"type":"text","text":42}]}}'],
      ["codex", '{"type":"item.completed","item":{"type":"agent_message","text":42}}'],
      ["codex", '{"type":"turn.failed","error":{"message":42}}'],
      ["opencode", '{"type":"text","part":{"type":"text","text":42}}'],
      ["opencode", '{"type":"step_finish","part":{"type":"step-finish","reason":42}}'],
      ["claude", '{"type":'],
    ] as const)("rejects malformed %s records: %s", (provider, line) => {
      expect(() => eventsFrom(provider, line)).toThrow(
        new Error(`invalid ${provider} stream event`),
      );
    });
  });
});
