import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import { z } from "zod";
import type { StageAgent } from "./agents.ts";
import { Exit, say } from "./exit.ts";
import { commandFor, eventsFrom, type SessionInput } from "./provider.ts";
import {
  addTokens,
  type ModelUsage,
  type SessionCost,
  type TokenUsage,
  type UsageReport,
} from "./usage.ts";

export const idleMinutes = 10;
const shutdownGraceMs = 1000;
const missingProcess = z.object({ code: z.literal("ESRCH") });

export type SessionResult = {
  readonly status: "completed" | "failed";
  readonly durationMs: number;
  readonly result: string;
  readonly sessionId?: string;
  readonly logPath: string;
  readonly requestedAgent: StageAgent;
  readonly resolvedModel?: string;
  readonly permissionDenials?: number;
  readonly killedAtExit?: readonly string[];
  readonly usage: UsageReport;
  readonly cost?: SessionCost;
  readonly turns?: number;
  readonly errors: readonly string[];
};

export class SessionFailure extends Exit {
  readonly result: SessionResult;

  constructor(message: string, result: SessionResult) {
    super(1, message);
    this.result = result;
  }
}

type Stream = {
  result: string;
  errors: string[];
  sessionId: string;
  resolvedModel: string;
  permissionMode: string;
  permissionDenials: number;
  taskDescriptions: Map<string, string>;
  afterResult: boolean;
  killedAtExit: string[];
  parentUsage: TokenUsage | undefined;
  aggregateUsage: TokenUsage | undefined;
  models: ModelUsage[];
  turns: number | undefined;
  cost: SessionCost | undefined;
  complete: boolean;
};

export async function session(input: SessionInput): Promise<SessionResult> {
  const { agent, stage, card } = input;
  say(`== ${stage}${card ? ` ${card}` : ""} on ${agentName(agent)}`);

  const startedAt = Date.now();
  const logPath = logFile(input);
  say(`   log ${logPath}`);
  let stream: Stream;
  try {
    stream = await runCommand(commandFor(input), logPath, input.timeoutMs);
  } catch (error) {
    stream = emptyStream();
    stream.errors.push(message(error));
  }

  if (!(stream.complete && stream.result) && stream.errors.length === 0) {
    stream.errors.push(`the ${stage} session ended without a completed result`);
  }

  const result = sessionResult(input, stream, logPath, Date.now() - startedAt);
  if (stream.result) console.log(stream.result);
  say(summary(result));
  for (const description of stream.killedAtExit) say(`   killed at exit: ${description}`);
  if (result.status === "failed") {
    throw new SessionFailure(`the ${stage} session failed: ${result.errors.join("\n")}`, result);
  }

  return result;
}

function sessionResult(
  input: SessionInput,
  stream: Stream,
  logPath: string,
  durationMs: number,
): SessionResult {
  const usage: UsageReport = {
    ...(stream.parentUsage === undefined ? {} : { parent: stream.parentUsage }),
    ...(stream.aggregateUsage === undefined
      ? {}
      : { aggregateIncludingChildren: stream.aggregateUsage }),
    ...(stream.models.length === 0 ? {} : { models: stream.models }),
  };

  return {
    status: stream.errors.length === 0 ? "completed" : "failed",
    durationMs,
    result: stream.result,
    ...(stream.sessionId ? { sessionId: stream.sessionId } : {}),
    logPath,
    requestedAgent: input.agent,
    ...(stream.resolvedModel ? { resolvedModel: stream.resolvedModel } : {}),
    ...(stream.permissionDenials === 0 ? {} : { permissionDenials: stream.permissionDenials }),
    ...(stream.killedAtExit.length === 0 ? {} : { killedAtExit: stream.killedAtExit }),
    usage,
    ...(stream.cost === undefined ? {} : { cost: stream.cost }),
    ...(stream.turns === undefined ? {} : { turns: stream.turns }),
    errors: stream.errors,
  };
}

function summary(result: SessionResult): string {
  return `   status ${result.status} duration ${result.durationMs}ms turns ${result.turns ?? "n/a"} denials ${result.permissionDenials ?? 0} cost ${result.cost?.usd ?? "n/a"} session ${result.sessionId ?? "n/a"}`;
}

function agentName(agent: StageAgent): string {
  return [agent.provider, agent.model, agent.effort].filter(Boolean).join(":");
}

async function runCommand(
  command: { readonly argv: readonly string[]; readonly permissionMode: string },
  logPath: string,
  timeoutMs: number | undefined,
): Promise<Stream> {
  const child = spawn([...command.argv], {
    detached: true,
    cwd: process.cwd(),
    env: process.env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const pid = child.pid;
  const stream = emptyStream();
  const stderr = new Response(child.stderr).text();
  const idleMs = idleMinutes * 60 * 1000;
  let shutdown: Promise<void> | undefined;
  let idle: ReturnType<typeof setTimeout>;
  let wall: ReturnType<typeof setTimeout> | undefined;
  const stop = (reason: string, signal: NodeJS.Signals) => {
    if (shutdown) return;

    stream.errors.push(reason);
    clearTimeout(idle);
    clearTimeout(wall);
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
  idle = setTimeout(onIdle, idleMs);
  if (timeoutMs !== undefined) {
    wall = setTimeout(
      () => stop(`exceeded the ${timeoutMs}ms wall-time budget, so it was stopped`, "SIGTERM"),
      Math.max(0, timeoutMs),
    );
  }
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
          take(stream, line, process.env.ITERATE_LIVE !== "0");
        } catch (error) {
          stream.errors.push(message(error));
        }

        if (stream.permissionMode && stream.permissionMode !== command.permissionMode) {
          stop(
            `the session started in ${stream.permissionMode} permission mode instead of ${command.permissionMode}, so it was stopped`,
            "SIGTERM",
          );
        }
      }
    } catch (error) {
      stop(message(error), "SIGTERM");
    }

    const exitCode = await child.exited;
    const diagnostic = (await stderr).trim();
    if (diagnostic) appendFileSync(logPath, `[stderr]\n${diagnostic}\n`);
    if (exitCode !== 0 && !shutdown) {
      stream.errors.push(`exit ${exitCode}: ${diagnostic || "no stderr output"}`);
    }

    return stream;
  } finally {
    clearTimeout(idle);
    clearTimeout(wall);
    await shutdown;
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
  }
}

function emptyStream(): Stream {
  return {
    result: "",
    errors: [],
    sessionId: "",
    resolvedModel: "",
    permissionMode: "",
    permissionDenials: 0,
    taskDescriptions: new Map(),
    afterResult: false,
    killedAtExit: [],
    parentUsage: undefined,
    aggregateUsage: undefined,
    models: [],
    turns: undefined,
    cost: undefined,
    complete: false,
  };
}

function signalGroup(pid: number, signal: NodeJS.Signals, stream: Stream): void {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (missingProcess.safeParse(error).success) return;

    stream.errors.push(`could not send ${signal} to the agent group: ${message(error)}`);
  }
}

function take(stream: Stream, line: string, live: boolean): void {
  for (const event of eventsFrom(line)) {
    if (live && event.type === "text") say(event.text);
    if (live && event.type === "tool_call") say(`> ${event.name}: ${event.args}`);
    if (event.type === "result") stream.result = event.result;
    if (event.type === "session_id") stream.sessionId = event.sessionId;
    if (event.type === "resolved_model") stream.resolvedModel = event.model;
    if (event.type === "permission_mode") stream.permissionMode = event.mode;
    if (event.type === "permission_denials") stream.permissionDenials += event.count;
    if (event.type === "text" || event.type === "tool_call") {
      stream.afterResult = false;
      stream.killedAtExit = [];
    }
    if (event.type === "task_started") stream.taskDescriptions.set(event.taskId, event.description);
    if (event.type === "task_killed" && stream.afterResult) {
      stream.killedAtExit.push(stream.taskDescriptions.get(event.taskId) ?? event.taskId);
    }
    if (event.type === "complete") {
      stream.complete = true;
      stream.afterResult = true;
    }
    if (event.type === "error") stream.errors.push(event.message);
    if (event.type === "usage") {
      if (event.turns !== undefined) {
        stream.turns = (stream.turns ?? 0) + event.turns;
      }
      stream.parentUsage = mergeUsage(stream.parentUsage, event.usage.parent);
      stream.aggregateUsage = mergeUsage(
        stream.aggregateUsage,
        event.usage.aggregateIncludingChildren,
      );
      if (event.usage.models) stream.models.push(...event.usage.models);
      stream.cost = mergeCost(stream.cost, event.cost, stream.errors);
    }
  }
}

function mergeUsage(current: TokenUsage | undefined, next: TokenUsage | undefined) {
  return next === undefined ? current : addTokens(current, next);
}

function mergeCost(
  current: SessionCost | undefined,
  next: SessionCost | undefined,
  errors: string[],
): SessionCost | undefined {
  if (next === undefined) return current;
  if (current === undefined) return next;
  if (current.scope !== next.scope) {
    errors.push(`provider mixed ${current.scope} and ${next.scope} cost scopes`);
    return current;
  }

  return { usd: current.usd + next.usd, scope: current.scope };
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

function logFile(input: SessionInput): string {
  const directory = input.logDirectory ?? join(tmpdir(), "iterate");
  mkdirSync(directory, { recursive: true, mode: 0o700 });

  const path = join(
    directory,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${input.stage}-${randomUUID()}.log`,
  );
  writeFileSync(path, "", { flag: "wx", mode: 0o600 });

  return path;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
