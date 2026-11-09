import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import type { ThreadEvent, ThreadItem } from "@openai/codex-sdk";
import { z } from "zod";
import { agentFromArgs } from "./agents.ts";
import { CodexTurn, codexHarness, codexPrompt, codexThreadOptions } from "./codex.ts";
import { codexCompletionOutputSchema } from "./codex-completion.ts";
import { definedFields } from "./defined-fields.ts";
import { sessionReportSchema } from "./journal.ts";
import { adapterFor, budgetFor } from "./provider.ts";
import type { ProviderEvent, SessionInput } from "./provider-types.ts";
import {
  CodexHarness,
  syntheticCodexCompletion,
  syntheticCodexReply,
} from "./testing/codex-harness.ts";

const input: SessionInput = {
  agent: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
  stage: "build",
  card: "DOT-1",
  systemPrompt: "guards",
};
const requested = {
  provenance: "codex.sdk.requested",
  model: "gpt-6.1-sol",
  effort: "high",
  cwd: process.cwd(),
};
const started: ThreadEvent = { type: "thread.started", thread_id: "thread-owned" };
const usage = {
  input_tokens: 11,
  cached_input_tokens: 3,
  cache_write_input_tokens: 0,
  output_tokens: 2,
  reasoning_output_tokens: 1,
};
const completed: ThreadEvent = { type: "turn.completed", usage };

function reply(text: string, id = "reply"): ThreadEvent {
  return { type: "item.completed", item: { type: "agent_message", id, text } };
}

function turnOf(events: readonly ThreadEvent[], session: SessionInput = input): ProviderEvent[] {
  const turn = new CodexTurn(session);

  return [...events.flatMap((event) => turn.receive(event)), ...turn.end()];
}

function errorsOf(events: readonly ProviderEvent[]): string[] {
  return events.flatMap((event) => (event.type === "error" ? [event.message] : []));
}

describe(CodexTurn.name, () => {
  test("reports the thread, the requested configuration and unknown tool coverage", () => {
    const events = new CodexTurn(input).receive(started);

    expect(events).toEqual([
      { type: "session_id", sessionId: "thread-owned" },
      { type: "configured_session", configuration: requested },
      { type: "required_tool_coverage", coverage: "unknown" },
    ]);
  });

  test("completes a turn whose final reply is a completed record", () => {
    const events = turnOf([started, reply(syntheticCodexReply), completed]);

    expect(events.slice(3)).toEqual([
      { type: "text", text: syntheticCodexReply },
      { type: "usage", usage: { raw: [{ type: "turn.completed", usage }] } },
      { type: "result", result: syntheticCodexReply },
      { type: "complete" },
    ]);
  });

  test("takes the last agent message as the final reply", () => {
    const events = turnOf([
      started,
      reply("commentary", "commentary"),
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(events).toContainEqual({ type: "result", result: syntheticCodexReply });
    expect(errorsOf(events)).toEqual([]);
  });

  test("accepts a negative inconclusive investigation without classifying its prose", () => {
    const record = JSON.stringify({
      ...syntheticCodexCompletion,
      claims: [{ claim: "the hypothesis is refuted; the cause stays unknown", evidencePath: "x" }],
    });

    const events = turnOf([started, reply(record), completed]);

    expect(errorsOf(events)).toEqual([]);
    expect(events.at(-1)).toEqual({ type: "complete" });
  });

  test.each([
    { outcome: "blocked", blockers: 1 },
    { outcome: "failed", blockers: 0 },
  ])("fails agent-reported $outcome work after native completion", ({ outcome, blockers }) => {
    const record = JSON.stringify({
      ...syntheticCodexCompletion,
      outcome,
      requiredToolBlockers: Array.from({ length: blockers }, () => ({
        tool: "apply_patch",
        reason: "denied",
        evidencePath: "tool.log",
      })),
    });

    const events = turnOf([started, reply(record), completed]);

    expect(errorsOf(events)).toEqual([
      `Codex agent-reported completion: ${outcome}; required tool blockers: ${blockers}`,
    ]);
    expect(events).toContainEqual({ type: "complete" });
  });

  test("refuses a prose final reply as a completion record", () => {
    const events = turnOf([started, reply("all done"), completed]);

    expect(errorsOf(events)).toEqual(["Codex completion protocol: final reply is not valid JSON"]);
  });

  test("keeps an expected nonzero probe as an outcome without failing", () => {
    const probe = {
      type: "command_execution" as const,
      id: "probe",
      command: "test -f absent",
      aggregated_output: "",
      exit_code: 1,
      status: "failed" as const,
    };

    const events = turnOf([
      started,
      { type: "item.completed", item: probe },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(events).toContainEqual({
      type: "tool_outcome",
      outcome: { itemId: "probe", kind: "command_execution", status: "failed", raw: probe },
    });
    expect(errorsOf(events)).toEqual([]);
  });

  test("fails a failed MCP tool call", () => {
    const events = turnOf([
      started,
      {
        type: "item.completed",
        item: {
          type: "mcp_tool_call",
          id: "read",
          server: "synthetic",
          tool: "required_read",
          arguments: {},
          status: "failed",
          error: { message: "synthetic native tool error" },
        },
      },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual(["Codex mcp_tool_call failed"]);
  });

  test("fails a tool reported completed while still in progress", () => {
    const events = turnOf([
      started,
      {
        type: "item.completed",
        item: {
          type: "command_execution",
          id: "check",
          command: "check",
          aggregated_output: "",
          status: "in_progress",
        },
      },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual(["Codex completed command_execution still in progress"]);
  });

  test("fails a tool that completed with an error", () => {
    const events = turnOf([
      started,
      {
        type: "item.completed",
        item: {
          type: "mcp_tool_call",
          id: "read",
          server: "synthetic",
          tool: "required_read",
          arguments: {},
          status: "completed",
          error: { message: "synthetic native tool error" },
        },
      },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual(["Codex mcp_tool_call failed"]);
  });

  test.each<ThreadItem>([
    {
      type: "command_execution",
      id: "tool",
      command: "x",
      aggregated_output: "",
      status: "in_progress",
    },
    { type: "file_change", id: "tool", changes: [], status: "completed" },
    {
      type: "mcp_tool_call",
      id: "tool",
      server: "s",
      tool: "t",
      arguments: {},
      status: "in_progress",
    },
    { type: "web_search", id: "tool", query: "q" },
  ])("fails a turn whose $type never finished", (item) => {
    const events = turnOf([
      started,
      { type: "item.started", item },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual([
      `Codex completed with unfinished tool items: ${item.type}:tool`,
    ]);
  });

  test("keeps a reported Codex error item as text", () => {
    const events = turnOf([
      started,
      { type: "item.completed", item: { type: "error", id: "note", message: "synthetic note" } },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(events).toContainEqual({ type: "text", text: "Codex reported: synthetic note" });
    expect(errorsOf(events)).toEqual([]);
  });

  test("names each tool once however many times it is updated", () => {
    const item = {
      type: "command_execution" as const,
      id: "check",
      command: "check",
      aggregated_output: "",
      status: "in_progress" as const,
    };

    const events = turnOf([
      started,
      { type: "item.started", item },
      { type: "item.updated", item },
      { type: "item.completed", item: { ...item, status: "completed" as const, exit_code: 0 } },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(events.filter((event) => event.type === "tool_call")).toHaveLength(1);
    expect(errorsOf(events)).toEqual([]);
  });

  test("fails a completed turn with a tool that never finished", () => {
    const events = turnOf([
      started,
      {
        type: "item.started",
        item: {
          type: "command_execution",
          id: "unfinished",
          command: "check",
          aggregated_output: "",
          status: "in_progress",
        },
      },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual([
      "Codex completed with unfinished tool items: command_execution:unfinished",
    ]);
    expect(events).not.toContainEqual({ type: "complete" });
  });

  test("fails a completed turn without a final reply", () => {
    const events = turnOf([started, completed]);

    expect(errorsOf(events)).toEqual(["Codex completed without a final reply"]);
  });

  test("fails a failed turn", () => {
    const events = turnOf([started, { type: "turn.failed", error: { message: "quota" } }]);

    expect(errorsOf(events)).toEqual(["Codex turn failed: quota"]);
  });

  test("fails a stream that ends before its turn completes", () => {
    const events = turnOf([started, reply(syntheticCodexReply)]);

    expect(errorsOf(events)).toEqual(["Codex stream ended before its turn completed"]);
  });

  test("keeps a native error authoritative over a completed record", () => {
    const events = turnOf([
      started,
      { type: "error", message: "synthetic native error" },
      reply(syntheticCodexReply),
      completed,
    ]);

    expect(errorsOf(events)).toEqual(["Codex error: synthetic native error"]);
  });
});

describe(codexThreadOptions.name, () => {
  test("pins the requested model and effort in the working directory", () => {
    expect(codexThreadOptions(input)).toEqual({
      workingDirectory: process.cwd(),
      model: "gpt-6.1-sol",
      modelReasoningEffort: "high",
    });
  });

  test("leaves an unpinned model and effort to the native defaults", () => {
    expect(codexThreadOptions({ ...input, agent: { provider: "codex" } })).toEqual({
      workingDirectory: process.cwd(),
    });
  });

  test("refuses an effort Codex does not offer", () => {
    expect(() =>
      codexThreadOptions({ ...input, agent: { provider: "codex", effort: "turbo" } }),
    ).toThrow("Codex does not offer effort turbo");
  });
});

describe(codexPrompt.name, () => {
  test("invokes the stage skill on the card ahead of the guards", () => {
    expect(codexPrompt(input)).toBe("$build DOT-1\n\nguards");
  });
});

describe("codexHarness", () => {
  test("selects the exact executable Codex pins", () => {
    expect(
      agentFromArgs(["--provider", "codex", "--model", "gpt-6.1-sol", "--effort", "high"]),
    ).toEqual({ provider: "codex", model: "gpt-6.1-sol", effort: "high" });
  });

  test("advertises exactly the minimized captured versioned capability catalog", async () => {
    const catalog: unknown = JSON.parse(
      await readFile(`${import.meta.dir}/testing/fixtures/codex-0.166.0/catalog.json`, "utf8"),
    );

    expect(catalog).toEqual(codexHarness.capabilities.modelEfforts);
  });

  test.each([
    ["gpt-6-luna", "ultra"],
    ["unknown", "high"],
  ])("refuses unsupported pins without substitution: %s:%s", (model, effort) => {
    expect(() =>
      agentFromArgs(["--provider", "codex", "--model", model, "--effort", effort]),
    ).toThrow();
  });

  test("refuses explicit dollars before dispatch", () => {
    expect(() =>
      budgetFor({
        provider: "codex",
        capabilities: codexHarness.capabilities,
        explicitSession: "1",
      }),
    ).toThrow();
    expect(() => codexHarness.admit?.({ ...input, budget: "1" })).toThrow();
    expect(budgetFor({ provider: "codex", capabilities: codexHarness.capabilities })).toBe(
      undefined,
    );
  });

  test("admits an author resume with the same pinned configuration", () => {
    expect(() =>
      codexHarness.admit?.({
        ...input,
        resumeSessionId: "thread-owned",
        resumeConfiguration: requested,
      }),
    ).not.toThrow();
  });

  test.each([
    { name: "a review", change: { stage: "review" as const } },
    { name: "an unpinned effort", change: { agent: { provider: "codex", model: "gpt-6.1-sol" } } },
    { name: "a changed model", change: { resumeConfiguration: { ...requested, model: "other" } } },
    { name: "a changed directory", change: { resumeConfiguration: { ...requested, cwd: "/x" } } },
    {
      name: "another harness's configuration",
      change: {
        resumeConfiguration: { ...requested, provenance: "codex.app-server.thread/start" },
      },
    },
  ])("refuses to resume $name", ({ change }) => {
    expect(() =>
      codexHarness.admit?.({
        ...input,
        resumeSessionId: "thread-owned",
        resumeConfiguration: requested,
        ...change,
      }),
    ).toThrow("Codex author resume requires matching pinned configuration; review starts fresh");
  });

  test.each([
    { name: "the same requested configuration", previous: requested, matches: true },
    { name: "another effort", previous: { ...requested, effort: "low" }, matches: false },
    { name: "another model", previous: { ...requested, model: "gpt-6-luna" }, matches: false },
    {
      name: "another harness's configuration",
      previous: { ...requested, provenance: "codex.app-server.thread/start" },
      matches: false,
    },
  ])("matches a prior author with $name: $matches", ({ previous, matches }) => {
    expect(
      codexHarness.resume.configurationMatches({
        previous: { configuredSession: previous },
        agent: input.agent,
      }),
    ).toBe(matches);
  });

  test("refuses a resume ID that would read as a Codex flag", () => {
    expect(() =>
      codexHarness.admit?.({
        ...input,
        resumeSessionId: "--dangerously-bypass-approvals-and-sandbox",
        resumeConfiguration: requested,
      }),
    ).toThrow("Codex resume ID --dangerously-bypass-approvals-and-sandbox is not a thread ID");
  });

  test("refuses explicit dollars where the session starts it", () => {
    expect(() => adapterFor("codex").command({ ...input, budget: "1" })).toThrow(
      "codex cannot enforce an explicit dollar cap",
    );
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

  test("completes one owned Codex exec with truthful unknown coverage", async () => {
    const observed = await harness.run("complete");

    expect(observed.code).toBe(0);
    expect(observed.stdout).toBe(`${syntheticCodexReply}\n`);
    expect(observed.result.sessionId).toStartWith("thread-owned-");
    expect(observed.result).toMatchObject({
      status: "completed",
      providerCompleted: true,
      result: syntheticCodexReply,
      configuredSession: requested,
      requiredToolOutcomeCoverage: "unknown",
      accountingComplete: false,
      errors: [],
      settlement: { state: "settled" },
    });
    expect(observed.result.resolvedModel).toBeUndefined();
    expect(observed.result.cost).toBeUndefined();
    expect(observed.result.usage.raw).toHaveLength(1);
    const roundTrip: unknown = sessionReportSchema.parse(observed.result);
    expect(roundTrip).toEqual(observed.result);
  });

  test("launches Codex exec with the pins, the working directory and the completion schema", async () => {
    const observed = await harness.run("complete");

    const [launch] = await observed.launches();

    expect(launch).toMatchObject({
      argv: [
        "exec",
        "--experimental-json",
        "--model",
        "gpt-6.1-sol",
        "--cd",
        process.cwd(),
        "--output-schema",
        expect.any(String),
        "--config",
        'model_reasoning_effort="high"',
      ],
      prompt: "$build DOT-1\n\nguard text",
      outputSchema: codexCompletionOutputSchema,
    });
  });

  test("resumes the explicit thread", async () => {
    const observed = await harness.run("complete", {
      resumeSessionId: "thread-earlier",
      resumeConfiguration: requested,
    });

    const [launch] = await observed.launches();

    expect(launch).toMatchObject({ argv: expect.arrayContaining(["resume", "thread-earlier"]) });
    expect(observed.result).toMatchObject({ status: "completed", sessionId: "thread-earlier" });
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
  });

  test("keeps a nonzero native exit distinct from completion", async () => {
    const observed = await harness.run("nonzero");

    expect(observed.result.providerCompleted).toBe(true);
    expect(observed.result.status).toBe("failed");
    expect(await readFile(String(observed.result.logPath), "utf8")).toMatch(
      /\[stderr\]\n.*synthetic exec diagnostic/,
    );
  });

  test("bounds a peer that never writes a line by the idle limit", async () => {
    const observed = await harness.run("silent", { timeoutMs: 4000, idleTimeoutMs: 300 });

    expect(observed.result).toMatchObject({
      status: "failed",
      errors: ["silent for 300ms, so it was stopped"],
      settlement: { state: "settled" },
    });
  }, 6000);

  test("bounds a peer that stays alive after its completed turn", async () => {
    const observed = await harness.run("terminal-hang", { timeoutMs: 4000, idleTimeoutMs: 1500 });

    expect(observed.result).toMatchObject({
      status: "failed",
      providerCompleted: true,
      result: syntheticCodexReply,
      errors: ["silent for 1500ms, so it was stopped"],
      settlement: { state: "settled" },
    });
    expect(observed.result.durationMs).toBeLessThan(2500);
  }, 6000);

  test.each(["truncated", "no-terminal", "no-final", "missing-history", "unavailable"])(
    "fails boundedly for %s",
    async (scenario) => {
      const observed = await harness.run(scenario, { timeoutMs: 1000 });

      expect(observed.result.status).toBe("failed");
      expect(observed.result.providerCompleted).toBe(false);
      expect(observed.result.settlement?.state).toBe("settled");
    },
    6000,
  );

  // An unreadable line stops the session at once, before the host's own exit is reported.
  test.each([
    ["truncated", 'Failed to parse item: {"type":"turn.compl'],
    ["malformed-event", 'invalid Codex SDK message: {"type":"turn.failed"}'],
    ["no-usage", "undefined is not an object"],
  ])(
    "stops on unreadable %s Codex output",
    async (scenario, reason) => {
      const observed = await harness.run(scenario);

      expect(observed.result.status).toBe("failed");
      expect(observed.result.errors).toEqual([expect.stringContaining(reason)]);
    },
    6000,
  );

  test.each(["silent", "descendant", "cancel"])(
    "bounds the group lifetime for %s",
    async (scenario) => {
      const observed = await harness.run(
        scenario,
        Object.assign(
          { timeoutMs: 1000 },
          definedFields({ cancelMs: scenario === "cancel" ? 600 : undefined }),
        ),
      );

      expect(observed.result.status).toBe("failed");
      expect(observed.result.errors.join()).toContain(
        scenario === "cancel" ? "caller cancellation" : "wall-time",
      );
      expect(observed.result.settlement?.state).toBe("settled");
    },
    6000,
  );

  test.each(["silent", "cancel"])(
    "removes the completion schema the SDK wrote when %s stops the session",
    async (scenario) => {
      const observed = await harness.run(
        scenario,
        Object.assign(
          { timeoutMs: 1000 },
          definedFields({ cancelMs: scenario === "cancel" ? 600 : undefined }),
        ),
      );
      const [launch] = await observed.launches();
      const { argv } = z.object({ argv: z.array(z.string()) }).parse(launch);
      const schema = argv[argv.indexOf("--output-schema") + 1] ?? "";

      expect(schema).toContain("codex-output-schema-");
      expect(existsSync(dirname(schema))).toBe(false);
    },
    6000,
  );
});
