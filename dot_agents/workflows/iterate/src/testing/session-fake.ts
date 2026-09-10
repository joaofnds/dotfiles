#!/usr/bin/env bun
import { connect } from "node:net";
import process from "node:process";
import { spawn } from "bun";

const descendant = process.argv.includes("--descendant");
const interrupted = process.env.SESSION_SCENARIO === "interrupt";
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
      emit(
        process.env.SESSION_PROVIDER === "claude"
          ? {
              type: "assistant",
              message: { content: [{ type: "text", text: "progress before final" }] },
            }
          : {
              type: "item.completed",
              item: { type: "agent_message", text: "progress before final" },
            },
      );
    }
    control.write("ready\n");
  }
  if (command === "finish") {
    if (process.env.SESSION_PROVIDER === "claude") {
      emit({ type: "result", result: "final reply", is_error: false });
    } else {
      emit({ type: "item.completed", item: { type: "agent_message", text: "final reply" } });
      if (process.env.SESSION_SCENARIO === "malformed") console.log('{"type":');
      if (process.env.SESSION_SCENARIO === "error")
        emit({ type: "error", message: "provider failed" });
      if (process.env.SESSION_SCENARIO !== "truncated") emit({ type: "turn.completed", usage: {} });
    }
    stop();
  }
});
