#!/usr/bin/env bun
import { connect } from "node:net";
import process from "node:process";
import { spawn } from "bun";

const descendant = process.argv.includes("--descendant");
const interrupted = ["interrupt", "timeout"].includes(process.env.SESSION_SCENARIO ?? "");
const control = connect(process.env.SESSION_CONTROL ?? "");
let child: ReturnType<typeof spawn> | undefined;
const deadline = setTimeout(() => process.exit(2), 10_000);
const emit = (event: unknown) => console.log(JSON.stringify(event));

function stop() {
  clearTimeout(deadline);
  child?.kill("SIGKILL");
  process.exit(0);
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
    if (!descendant) {
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
    const final = process.env.SESSION_SCENARIO === "long" ? "x".repeat(100_000) : "final reply";
    if (process.env.SESSION_SCENARIO === "truncated") {
      emit({
        type: "assistant",
        message: { content: [{ type: "text", text: final }] },
      });
      stop();
    }
    console.error("fixture diagnostic");
    emit({
      type: "result",
      session_id: "claude-terminal-session",
      result: final,
      is_error: process.env.SESSION_SCENARIO === "error",
      errors: process.env.SESSION_SCENARIO === "error" ? ["provider failed"] : [],
      permission_denials:
        process.env.SESSION_SCENARIO === "denials"
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
    });
    if (process.env.SESSION_SCENARIO === "malformed") console.log('{"type":');
    stop();
  }
});
