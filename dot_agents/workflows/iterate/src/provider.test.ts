import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import process from "node:process";
import { claudeEvents, claudeQuery } from "./claude.ts";
import { adapterFor, adapters, budgetFor } from "./provider.ts";
import { InvalidProviderMessage } from "./provider-types.ts";

const eventsFrom = (line: string) => claudeEvents(JSON.parse(line));

describe(claudeQuery.name, () => {
  test("starts the stage skill under the Claude Code prompt with the runner's rules appended", () => {
    const { prompt, options } = claudeQuery(
      {
        agent: { provider: "claude" },
        stage: "shape",
        card: "cards/a 'quoted'.md",
        systemPrompt: "Use $rules; `literal`",
        budget: "12.50",
      },
      "/bin/claude",
    );

    expect(prompt).toBe("/shape cards/a 'quoted'.md");
    expect(options).toMatchObject({
      pathToClaudeCodeExecutable: "/bin/claude",
      cwd: process.cwd(),
      permissionMode: "auto",
      settingSources: ["user", "project", "local"],
      systemPrompt: { type: "preset", preset: "claude_code", append: "Use $rules; `literal`" },
      maxBudgetUsd: 12.5,
    });
    expect(options).not.toHaveProperty("model");
    expect(options).not.toHaveProperty("effort");
    expect(options).not.toHaveProperty("resume");
  });

  test("passes an explicit model, effort, and recorded session to Claude", () => {
    const { prompt, options } = claudeQuery(
      {
        agent: { provider: "claude", model: "sonnet", effort: "high" },
        stage: "build",
        card: "",
        systemPrompt: "rules",
        resumeSessionId: "session-1",
      },
      "/bin/claude",
    );

    expect(prompt).toBe("/build");
    expect(options).toMatchObject({ model: "sonnet", effort: "high", resume: "session-1" });
    expect(options).not.toHaveProperty("maxBudgetUsd");
  });

  test("refuses an effort Claude does not offer", () => {
    expect(() =>
      claudeQuery(
        {
          agent: { provider: "claude", effort: "ultra" },
          stage: "build",
          card: "",
          systemPrompt: "rules",
        },
        "/bin/claude",
      ),
    ).toThrow("Claude does not offer effort ultra");
  });
});

describe(claudeEvents.name, () => {
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
        receiptId: createHash("sha256").update(JSON.stringify(records[2])).digest("hex"),
        turns: 3,
        cost: { usd: 0.42, scope: "aggregateIncludingChildren", basis: "sessionCumulative" },
        usage: {
          parentBasis: "invocation",
          aggregateBasis: "sessionCumulative",
          modelsBasis: "sessionCumulative",
          raw: [records[2]],
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

  test("reports the permission mode a Claude session started in", () => {
    const events = eventsFrom(
      JSON.stringify({
        type: "system",
        subtype: "init",
        session_id: "claude-session",
        permissionMode: "default",
      }),
    );

    expect(events).toContainEqual({ type: "permission_mode", mode: "default" });
  });

  test("counts the permission denials a Claude result reports", () => {
    const denials = eventsFrom(
      JSON.stringify({
        type: "result",
        is_error: false,
        permission_denials: [
          { tool_name: "Bash", tool_use_id: "denied-1", tool_input: {} },
          { tool_name: "Edit", tool_use_id: "denied-2", tool_input: {} },
        ],
      }),
    ).filter((event) => event.type === "permission_denials");

    expect(denials).toEqual([{ type: "permission_denials", count: 2 }]);
  });

  test("reports a task Claude started with its description", () => {
    const events = eventsFrom(
      JSON.stringify({
        type: "system",
        subtype: "task_started",
        task_id: "bobk3blhs",
        description: "Full gate rerun",
        task_type: "local_bash",
        is_backgrounded: true,
      }),
    );

    expect(events).toEqual([
      { type: "task_started", taskId: "bobk3blhs", description: "Full gate rerun" },
    ]);
  });

  test.each([
    ["killed", { status: "killed", end_time: 1 }, [{ type: "task_killed", taskId: "bobk3blhs" }]],
    ["completed", { status: "completed", end_time: 1 }, []],
    ["moved to the background", { is_backgrounded: true }, []],
  ] as const)(
    "reports a task update as a kill only when it says killed: %s",
    (_, patch, expected) => {
      const events = eventsFrom(
        JSON.stringify({ type: "system", subtype: "task_updated", task_id: "bobk3blhs", patch }),
      );

      expect(events).toEqual([...expected]);
    },
  );

  test("ignores unknown message types", () => {
    expect(eventsFrom('{"type":"future.event","payload":{"anything":42}}')).toEqual([]);
  });

  test.each([
    '{"type":"result","is_error":"false"}',
    '{"type":"assistant","message":{"content":[{"type":"text","text":42}]}}',
    '{"subtype":"init"}',
  ])("rejects malformed Claude records: %s", (line) => {
    expect(() => eventsFrom(line)).toThrow(InvalidProviderMessage);
  });
});

describe(adapterFor.name, () => {
  test("declares the implemented protocols and Claude transport capabilities", () => {
    expect(adapters.map((adapter) => adapter.provider)).toEqual(["claude", "codex"]);
    expect(adapterFor("claude").capabilities).toEqual({
      resume: true,
      model: true,
      efforts: ["low", "medium", "high", "xhigh", "max"],
      dollarCap: true,
      dollarCapBasis: "invocation",
      defaultDollarCap: 50,
    });
  });

  test("refuses an unavailable protocol without choosing another provider", () => {
    expect(() => adapterFor("unavailable")).toThrow("unavailable is not implemented");
  });
});

describe("budgetFor", () => {
  const unsupported = { ...adapterFor("claude").capabilities, dollarCap: false };

  test("a provider that cannot cap dollars receives no default cap", () => {
    expect(budgetFor({ provider: "codex", capabilities: unsupported })).toBeUndefined();
  });

  test.each([{ explicitSession: "1" }, { runRemaining: 2 }])(
    "unsupported dollar caps refuse before launch for %j",
    (limits) => {
      expect(() =>
        budgetFor({ provider: "codex", capabilities: unsupported, ...limits }),
      ).toThrow();
    },
  );

  test("the demonstrated Claude cap is invocation spend bounded by remaining run headroom", () => {
    expect(
      budgetFor({
        provider: "claude",
        capabilities: adapterFor("claude").capabilities,
        explicitSession: "0.12",
        runRemaining: 0.09,
      }),
    ).toBe("0.09");
  });

  test("an unestablished provider cap basis refuses rather than assuming cumulative semantics", () => {
    expect(() =>
      budgetFor({
        provider: "codex",
        capabilities: { ...unsupported, dollarCap: true, dollarCapBasis: "sessionCumulative" },
        explicitSession: "1",
      }),
    ).toThrow();
  });
});
