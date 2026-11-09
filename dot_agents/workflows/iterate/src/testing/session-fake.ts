#!/usr/bin/env bun
import { closeSync, existsSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { join } from "node:path";
import process from "node:process";
import { spawn, stdin } from "bun";

if (process.argv[2] === "--lifecycle") await lifecycleFixture();

async function lifecycleFixture(): Promise<never> {
  const scenario = process.argv[3];
  const directory = process.argv[4] ?? "";
  const emit = (event: unknown) => console.log(JSON.stringify(event));

  if (scenario === "success") {
    emit({ phase: "done", body: "prepared final" });
    process.exit(0);
  }
  if (scenario === "malformed-stalled") console.log('{"phase":');
  else emit({ phase: "progress", body: "lifecycle ready" });

  if (scenario === "descendant") {
    process.on("SIGTERM", () => {});
    process.on("SIGINT", () => {});
    writeFileSync(join(directory, "descendant"), String(process.pid));
    if (existsSync(join(directory, "close-pipes"))) {
      closeSync(1);
      closeSync(2);
    }
  }
  if (
    scenario === "inherited-pipes" ||
    scenario === "closed-descendant" ||
    scenario === "escaped-pipes"
  ) {
    if (scenario === "closed-descendant") writeFileSync(join(directory, "close-pipes"), "yes");
    spawn([process.execPath, import.meta.path, "--lifecycle", "descendant", directory], {
      detached: scenario === "escaped-pipes",
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    });
    while (!existsSync(join(directory, "descendant")))
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
    writeFileSync(join(directory, "ready"), "ready");
    while (!existsSync(join(directory, "release")))
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
    emit({ phase: "done", body: "leader final" });
    process.exit(0);
  }
  if (scenario === "closed-output") {
    closeSync(1);
    closeSync(2);
  }
  return new Promise<never>(() => {
    setInterval(() => {}, 1000);
  });
}

const descendant = process.argv.includes("--descendant");
const scenario = process.env.SESSION_SCENARIO;
const fixtureProtocol = scenario?.startsWith("fixture-");
if (fixtureProtocol && process.env.SESSION_INPUT_PATH) {
  const input = process.argv.includes("--fixture-stdin")
    ? await stdin.text()
    : process.argv[process.argv.indexOf("--fixture-argv") + 1];
  writeFileSync(process.env.SESSION_INPUT_PATH, JSON.stringify(input));
}
const interrupted = ["interrupt", "timeout", "idle"].includes(process.env.SESSION_SCENARIO ?? "");
const control = connect(process.env.SESSION_CONTROL ?? "");
let child: ReturnType<typeof spawn> | undefined;
const deadline = setTimeout(() => process.exit(2), 10_000);
const emit = (event: unknown) => console.log(JSON.stringify(event));
const killed = (taskId: string) =>
  emit({ type: "system", subtype: "task_updated", task_id: taskId, patch: { status: "killed" } });

function stop() {
  clearTimeout(deadline);
  child?.kill("SIGKILL");
  process.exit(scenario === "nonzero" ? 7 : 0);
}

control.on("error", stop);
control.on("close", stop);
control.on("connect", () => {
  control.write(
    `${JSON.stringify({ role: descendant ? "descendant" : "agent", pid: process.pid })}\n`,
  );
});
control.on("data", (bytes) => {
  const command = bytes.toString().trim();
  if (command === "start") {
    if (interrupted) {
      process.on("SIGINT", () => {
        /* exercise forced process-group shutdown */
      });
      process.on("SIGTERM", () => {
        /* exercise forced process-group shutdown */
      });
      if (!descendant) {
        child = spawn([process.execPath, import.meta.path, "--descendant"], {
          stdin: "ignore",
          stdout: "ignore",
          stderr: "inherit",
        });
      }
    }
    if (!descendant && fixtureProtocol) {
      emit({ phase: "progress", body: "fixture progress" });
    } else if (!descendant) {
      emit({
        type: "system",
        subtype: "init",
        session_id: "claude-session",
        model: "resolved-fake",
        permissionMode: process.env.SESSION_SCENARIO === "default-mode" ? "default" : "auto",
      });
      emit({
        type: "assistant",
        message: { content: [{ type: "text", text: "progress before final" }] },
      });
    }
    control.write("ready\n");
  }
  if (command === "finish") {
    if (fixtureProtocol) {
      emit({ phase: "done", body: "fixture final reply" });
      stop();
    }
    if (scenario === "no-result") stop();
    const final = process.env.SESSION_SCENARIO === "long" ? "x".repeat(100_000) : "final reply";
    if (process.env.SESSION_SCENARIO === "truncated") {
      emit({
        type: "assistant",
        message: { content: [{ type: "text", text: final }] },
      });
      stop();
    }
    console.error(scenario === "raw-stderr" ? "\n fixture diagnostic \n" : "fixture diagnostic");
    const killedAtExit = process.env.SESSION_SCENARIO === "killed-at-exit";
    if (killedAtExit) {
      for (const [taskId, description] of [
        ["b-gate", "Full gate rerun"],
        ["b-stopped", "Stopped by the stage"],
      ]) {
        emit({ type: "system", subtype: "task_started", task_id: taskId, description });
      }
      killed("b-stopped");
    }
    if (scenario === "unknown-tools") {
      emit({ type: "future.event", payload: { unrecognized: true } });
      emit({
        type: "assistant",
        message: {
          content: [{ type: "tool_use", name: "Bash", input: { command: "literal tool" } }],
        },
      });
    }
    const terminal = {
      type: "result",
      uuid: ["conflicting-terminal", "reordered-terminal"].includes(scenario ?? "")
        ? "same-terminal"
        : undefined,
      session_id: "claude-terminal-session",
      result: scenario === "no-final" ? undefined : final,
      is_error: process.env.SESSION_SCENARIO === "error",
      errors: process.env.SESSION_SCENARIO === "error" ? ["provider failed"] : [],
      permission_denials: [
        "denials",
        "duplicate-terminal",
        "reordered-terminal",
        "anonymous-reordered-terminal",
      ].includes(scenario ?? "")
        ? [
            { tool_name: "Bash", tool_use_id: "denied-1", tool_input: {} },
            { tool_name: "Edit", tool_use_id: "denied-2", tool_input: {} },
          ]
        : [],
      num_turns: 2,
      total_cost_usd: 0.25,
      usage: { input_tokens: 10, cache_read_input_tokens: 7, output_tokens: 3 },
      modelUsage: {
        "resolved-fake": {
          inputTokens: 14,
          cacheReadInputTokens: 9,
          outputTokens: 5,
          costUSD: 0.25,
          canonicalModel: "resolved-fake",
          costBasis: "list",
        },
      },
    };
    emit(terminal);
    if (scenario === "duplicate-terminal") emit(terminal);
    if (scenario === "reordered-terminal" || scenario === "anonymous-reordered-terminal")
      emit(Object.fromEntries(Object.entries(terminal).reverse()));
    if (scenario === "conflicting-terminal") emit({ ...terminal, total_cost_usd: 0.4 });
    if (scenario === "anonymous-replayed-terminal") {
      emit({ type: "assistant", message: { content: [{ type: "text", text: "new work" }] } });
      emit(Object.fromEntries(Object.entries(terminal).reverse()));
    }
    if (scenario === "changed-accounting-session") {
      emit({
        ...terminal,
        uuid: "other-session",
        session_id: "other-session",
        total_cost_usd: 0.4,
      });
    }
    if (scenario === "regressed-cost" || scenario === "regressed-tokens") {
      emit({
        ...terminal,
        uuid: "regressed-terminal",
        total_cost_usd: scenario === "regressed-cost" ? 0.1 : 0.4,
        modelUsage: {
          "resolved-fake": {
            inputTokens: scenario === "regressed-tokens" ? 5 : 14,
            cacheReadInputTokens: 9,
            outputTokens: 5,
          },
        },
      });
    }
    if (scenario === "replayed-terminal" || scenario === "new-terminal-after-progress") {
      emit({ type: "assistant", message: { content: [{ type: "text", text: "new work" }] } });
      emit(
        scenario === "replayed-terminal"
          ? terminal
          : { ...terminal, uuid: "new-terminal", result: "new final reply", total_cost_usd: 0.4 },
      );
    }
    if (scenario === "later-no-final") emit({ type: "result", is_error: false });
    if (killedAtExit) killed("b-gate");
    if (process.env.SESSION_SCENARIO === "killed-unseen") killed("b-unseen");
    if (["killed-mid-turn", "unfinished-text", "unfinished-tool"].includes(scenario ?? "")) {
      killed("b-monitor");
      const content =
        scenario === "unfinished-tool"
          ? { type: "tool_use", name: "Bash", input: { command: "later work" } }
          : { type: "text", text: "next turn" };
      emit({ type: "assistant", message: { content: [content] } });
      killed("b-late");
      if (scenario === "killed-mid-turn") {
        emit({ type: "result", result: final, is_error: false });
      }
    }
    if (process.env.SESSION_SCENARIO === "killed-between-results") {
      killed("b-gate");
      emit({ type: "result", result: final, is_error: false });
    }
    if (process.env.SESSION_SCENARIO === "reinvoked") {
      emit({
        type: "result",
        session_id: "claude-terminal-session",
        result: final,
        is_error: false,
        num_turns: 3,
        total_cost_usd: 0.25,
        usage: { input_tokens: 1, cache_read_input_tokens: 2, output_tokens: 1 },
        modelUsage: {
          "resolved-fake": {
            inputTokens: 14,
            cacheReadInputTokens: 9,
            outputTokens: 5,
            costUSD: 0.25,
            canonicalModel: "resolved-fake",
            costBasis: "list",
          },
        },
      });
    }
    if (process.env.SESSION_SCENARIO === "reinvoked-grown") {
      emit({
        type: "result",
        session_id: "claude-terminal-session",
        result: final,
        is_error: false,
        num_turns: 3,
        total_cost_usd: 0.4,
        usage: { input_tokens: 1, cache_read_input_tokens: 2, output_tokens: 1 },
        modelUsage: {
          "resolved-fake": {
            inputTokens: 20,
            cacheReadInputTokens: 30,
            outputTokens: 8,
            costUSD: 0.4,
            canonicalModel: "resolved-fake",
            costBasis: "list",
          },
        },
      });
    }
    if (process.env.SESSION_SCENARIO === "reinvoked-uncosted") {
      emit({
        type: "result",
        session_id: "claude-terminal-session",
        result: final,
        is_error: false,
        num_turns: 3,
        usage: { input_tokens: 1, cache_read_input_tokens: 2, output_tokens: 1 },
      });
    }
    if (scenario === "malformed-recognized")
      emit({ type: "assistant", message: { content: [{ type: "text", text: 42 }] } });
    if (scenario === "truncated-tail") process.stdout.write('{"type":"result","result":');
    if (process.env.SESSION_SCENARIO === "malformed") console.log('{"type":');
    stop();
  }
});
