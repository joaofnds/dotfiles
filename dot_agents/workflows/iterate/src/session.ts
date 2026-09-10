import { appendFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import { z } from "zod";
import type { Stage, StageAgent } from "./agents.ts";
import { Exit, say } from "./exit.ts";
import { commandFor, eventsFrom, type SessionInput } from "./provider.ts";

export const idleMinutes = 10;
const shutdownGraceMs = 1000;
const missingProcess = z.object({ code: z.literal("ESRCH") });

type Stream = {
  result: string;
  errors: string[];
  sessionId: string;
  turns: number | undefined;
  cost: number | undefined;
  complete: boolean;
};

export async function session(input: SessionInput): Promise<void> {
  const { agent, stage, card } = input;
  say(`== ${stage}${card ? ` ${card}` : ""} on ${agentName(agent)}`);

  const command = commandFor(input);
  const logPath = logFile(stage);
  say(`   log ${logPath}`);
  const stream = await runCommand(command, agent.provider, logPath).catch((error: unknown) => {
    throw new Exit(1, `the ${stage} session failed: ${message(error)}`);
  });

  console.log(stream.result);
  say(`   turns ${stream.turns ?? "n/a"} cost ${stream.cost ?? "n/a"} session ${stream.sessionId}`);
  if (stream.errors.length > 0) {
    const said = stream.errors.join("\n");
    throw new Exit(1, `the ${stage} session failed: ${said}`);
  }

  if (!(stream.complete && stream.result)) {
    throw new Exit(1, `the ${stage} session ended without a completed result`);
  }
}

function agentName(agent: StageAgent): string {
  return `${agent.provider}:${agent.model}${agent.effort ? `:${agent.effort}` : ""}`;
}

async function runCommand(
  command: { readonly argv: readonly string[]; readonly stdin?: string },
  provider: StageAgent["provider"],
  logPath: string,
): Promise<Stream> {
  const child = spawn([...command.argv], {
    detached: true,
    cwd: process.cwd(),
    env: process.env,
    stdin: command.stdin === undefined ? "ignore" : new Blob([command.stdin]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const pid = child.pid;
  const stream: Stream = {
    result: "",
    errors: [],
    sessionId: "",
    turns: undefined,
    cost: undefined,
    complete: false,
  };
  const stderr = new Response(child.stderr).text();
  const idleMs = idleMinutes * 60 * 1000;
  let shutdown: Promise<void> | undefined;
  const stop = (reason: string, signal: NodeJS.Signals) => {
    if (shutdown) return;

    stream.errors.push(reason);
    clearTimeout(idle);
    signalGroup(pid, signal, stream);
    shutdown = new Promise((resolve) => {
      setTimeout(() => {
        signalGroup(pid, "SIGKILL", stream);
        resolve();
      }, shutdownGraceMs);
    });
  };
  const onIdle = () => stop(`silent for ${idleMinutes} minutes, so it was stopped`, "SIGTERM");
  const onInterrupt = () => stop("received SIGINT", "SIGINT");
  const onTerminate = () => stop("received SIGTERM", "SIGTERM");
  let idle = setTimeout(onIdle, idleMs);
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);

  try {
    try {
      for await (const line of lines(child.stdout)) {
        if (!shutdown) {
          clearTimeout(idle);
          idle = setTimeout(onIdle, idleMs);
        }

        appendFileSync(logPath, `${line}\n`);
        try {
          take(stream, line, provider);
        } catch (error) {
          stream.errors.push(message(error));
        }
      }
    } catch (error) {
      stop(message(error), "SIGTERM");
    }

    const exitCode = await child.exited;
    const diagnostic = (await stderr).trim();
    if (exitCode !== 0 && !shutdown) {
      stream.errors.push(`exit ${exitCode}: ${diagnostic || "no stderr output"}`);
    }

    return stream;
  } finally {
    clearTimeout(idle);
    await shutdown;
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
  }
}

function signalGroup(pid: number, signal: NodeJS.Signals, stream: Stream): void {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (missingProcess.safeParse(error).success) return;

    stream.errors.push(`could not send ${signal} to the agent group: ${message(error)}`);
  }
}

function take(stream: Stream, line: string, provider: StageAgent["provider"]): void {
  for (const event of eventsFrom(provider, line)) {
    if (event.type === "text") say(event.text);
    if (event.type === "tool_call") say(`> ${event.name}: ${event.args}`);
    if (event.type === "result") stream.result = event.result;
    if (event.type === "session_id") stream.sessionId = event.sessionId;
    if (event.type === "complete") stream.complete = true;
    if (event.type === "error") stream.errors.push(event.message);
    if (event.type === "usage") {
      stream.turns = event.turns ?? stream.turns;
      stream.cost = event.cost ?? stream.cost;
    }
  }
}

async function* lines(stdout: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let rest = "";

  for await (const chunk of stdout) {
    rest += decoder.decode(chunk, { stream: true });
    const parts = rest.split("\n");
    rest = parts.pop() ?? "";
    for (const part of parts) yield part;
  }

  rest += decoder.decode();
  if (rest) yield rest;
}

function logFile(stage: Stage): string {
  const directory = join(tmpdir(), "iterate");
  mkdirSync(directory, { recursive: true, mode: 0o700 });

  return join(directory, `${new Date().toISOString().replace(/[:.]/g, "-")}-${stage}.log`);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
