import { describe, expect, test } from "bun:test";
import { commandFor, eventsFrom } from "./provider.ts";

describe(commandFor.name, () => {
  test("uses the Claude CLI default while keeping values as separate arguments", () => {
    const command = commandFor({
      agent: { provider: "claude" },
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
        "--max-budget-usd",
        "12.50",
        "--append-system-prompt",
        "Use $rules; `literal`",
        "--dangerously-skip-permissions",
        "/shape cards/a 'quoted'.md",
      ],
    });
    expect(command.argv).not.toContain("--model");
    expect(command.argv).not.toContain("--effort");
  });

  test("passes an explicit model and effort to Claude", () => {
    const argv = commandFor({
      agent: { provider: "claude", model: "sonnet", effort: "high" },
      stage: "shape",
      card: "card",
      systemPrompt: "rules",
      budget: "50",
    }).argv;

    expect(argv[argv.indexOf("--model") + 1]).toBe("sonnet");
    expect(argv[argv.indexOf("--effort") + 1]).toBe("high");
  });

  test("resumes the recorded Claude session", () => {
    expect(
      commandFor({
        agent: { provider: "claude" },
        stage: "build",
        card: "card",
        systemPrompt: "rules",
        budget: "50",
        resumeSessionId: "session-1",
      }).argv,
    ).toEqual([
      "claude",
      "--print",
      "--verbose",
      "--output-format",
      "stream-json",
      "--max-budget-usd",
      "50",
      "--append-system-prompt",
      "rules",
      "--resume",
      "session-1",
      "--dangerously-skip-permissions",
      "/build card",
    ]);
  });
});

describe(eventsFrom.name, () => {
  test("normalizes a Claude session with text, tool activity, and a completed result", () => {
    const records = [
      {
        type: "system",
        subtype: "init",
        session_id: "claude-session",
        model: "claude-opus-5",
      },
      {
        type: "assistant",
        message: {
          content: [
            { type: "thinking", thinking: "private" },
            { type: "text", text: "Running checks." },
            { type: "tool_use", name: "Bash", input: { command: "bun test" } },
          ],
        },
      },
      {
        type: "result",
        session_id: "claude-session-terminal",
        is_error: false,
        result: "Checks passed.",
        num_turns: 3,
        total_cost_usd: 0.42,
        usage: {
          input_tokens: 7,
          cache_creation_input_tokens: 11,
          cache_read_input_tokens: 13,
          output_tokens: 17,
          output_tokens_details: { thinking_tokens: 5 },
        },
        modelUsage: {
          "claude-opus-5": {
            inputTokens: 19,
            cacheCreationInputTokens: 23,
            cacheReadInputTokens: 29,
            outputTokens: 31,
            thinkingTokens: 7,
            costUSD: 0.42,
            canonicalModel: "claude-opus-5-20260901",
            provider: "firstParty",
            costBasis: "list",
          },
        },
      },
    ];

    const events = records.flatMap((record) => eventsFrom(JSON.stringify(record)));

    expect(events).toEqual([
      { type: "session_id", sessionId: "claude-session" },
      { type: "resolved_model", model: "claude-opus-5" },
      { type: "text", text: "Running checks." },
      { type: "tool_call", name: "Bash", args: "bun test" },
      { type: "session_id", sessionId: "claude-session-terminal" },
      { type: "result", result: "Checks passed." },
      {
        type: "usage",
        turns: 3,
        cost: { usd: 0.42, scope: "aggregateIncludingChildren" },
        usage: {
          parent: { input: 7, cacheWrite: 11, cacheRead: 13, output: 17, reasoning: 5 },
          aggregateIncludingChildren: {
            input: 19,
            cacheWrite: 23,
            cacheRead: 29,
            output: 31,
            reasoning: 7,
          },
          models: [
            {
              model: "claude-opus-5",
              resolvedModel: "claude-opus-5-20260901",
              provider: "firstParty",
              costBasis: "list",
              costUsd: 0.42,
              tokens: {
                input: 19,
                cacheWrite: 23,
                cacheRead: 29,
                output: 31,
                reasoning: 7,
              },
            },
          ],
        },
      },
      { type: "complete" },
    ]);
  });

  test("keeps an aggregate token category unknown when one model omits it", () => {
    const [usage] = eventsFrom(
      JSON.stringify({
        type: "result",
        is_error: false,
        modelUsage: {
          first: { inputTokens: 2 },
          second: { inputTokens: 3, thinkingTokens: 4 },
        },
      }),
    ).filter((event) => event.type === "usage");

    expect(usage).toMatchObject({ usage: { aggregateIncludingChildren: { input: 5 } } });
    expect(usage?.usage.aggregateIncludingChildren?.reasoning).toBeUndefined();
  });

  test.each([
    [{ type: "error", error: { message: "authentication failed" } }, "authentication failed"],
    [{ type: "result", is_error: true, errors: ["budget exceeded"] }, "budget exceeded"],
    [{ type: "result", is_error: true, result: "request failed" }, "request failed"],
    [{ type: "result", is_error: true }, "the provider reported an error"],
  ] as const)("retains a Claude failure diagnostic", (record, diagnostic) => {
    expect(eventsFrom(JSON.stringify(record)).filter((event) => event.type === "error")).toEqual([
      { type: "error", message: diagnostic },
    ]);
  });

  test("ignores diagnostics and unknown event types", () => {
    expect(eventsFrom("loading configuration...")).toEqual([]);
    expect(eventsFrom('{"type":"future.event","payload":{"anything":42}}')).toEqual([]);
  });

  test.each([
    '{"type":"result","is_error":"false"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":42}]}}',
    '{"type":',
  ])("rejects malformed Claude records: %s", (line) => {
    expect(() => eventsFrom(line)).toThrow(new Error("invalid Claude stream event"));
  });
});
