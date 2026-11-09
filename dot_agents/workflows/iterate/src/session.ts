import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { spawn } from "bun";
import type { StageAgent } from "./agents.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import { Exit, say } from "./exit.ts";
import { cancelOutputs } from "./output-cleanup.ts";
import {
  type GroupSettlement,
  OwnedProcessGroup,
  type ProcessGroupIdentity,
  type ProcessGroupSystem,
} from "./process-group.ts";
import {
  adapterFor,
  type ProviderCommand,
  type ProviderEvent,
  type SessionAdapter,
  type SessionInput,
} from "./provider.ts";
import type { ConfiguredSession, ToolOutcome } from "./provider-types.ts";
import {
  addTokens,
  type ModelUsage,
  type SessionCost,
  type TokenUsage,
  type UsageReport,
} from "./usage.ts";

export const idleMinutes = 10;
const shutdownGraceMs = 1000;

export type SessionResult = {
  readonly status: "completed" | "failed";
  readonly durationMs: number;
  readonly result: string;
  readonly sessionId?: string;
  readonly logPath: string;
  readonly requestedAgent: StageAgent;
  readonly providerCompleted?: boolean;
  readonly processExit?: { readonly code: number | null; readonly signal: string | null };
  readonly requiredToolOutcomeCoverage?: "unknown";
  readonly configuredSession?: ConfiguredSession;
  readonly toolOutcomes?: readonly ToolOutcome[];
  readonly resolvedModel?: string;
  readonly accountingComplete: boolean;
  readonly permissionDenials?: number;
  readonly killedAtExit?: readonly string[];
  readonly usage: UsageReport;
  readonly cost?: SessionCost;
  readonly turns?: number;
  readonly errors: readonly string[];
  readonly settlement?: GroupSettlement;
};

export class SessionFailure extends Exit {
  readonly result: SessionResult;

  constructor(message: string, result: SessionResult) {
    super(1, message);
    this.result = result;
  }
}

export class SessionStartFailure extends SessionFailure {}

type Stream = {
  result: string;
  processExit: { code: number | null; signal: string | null } | undefined;
  configuredSession: ConfiguredSession | undefined;
  requiredToolOutcomeCoverage: "unknown" | undefined;
  toolOutcomes: ToolOutcome[];
  errors: string[];
  sessionId: string;
  accountingSessionId: string | undefined;
  resolvedModel: string;
  usageReceipts: Map<string, readonly unknown[]>;
  rawUsage: unknown[];
  usageBasis: Pick<UsageReport, "parentBasis" | "aggregateBasis" | "modelsBasis">;
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
  costCurrent: boolean;
  invalidAccounting: boolean;
};

export type PreparedSession = {
  readonly logPath: string;
  readonly start: () => RunningSession;
};

export type RunningSession = {
  readonly pid: number;
  readonly processGroupId: number;
  readonly processGroupIdentity: ProcessGroupIdentity;
  readonly logPath: string;
  readonly result: Promise<SessionResult>;
  readonly settlement: Promise<GroupSettlement>;
  readonly cancel: (reason?: string) => Promise<GroupSettlement>;
};

export type SessionReader = {
  readonly read: () => Promise<
    | { readonly done: true; readonly value?: Uint8Array | undefined }
    | { readonly done: false; readonly value: Uint8Array }
  >;
  readonly cancel: () => Promise<void>;
};
export type SessionHost = {
  readonly processSystem?: ProcessGroupSystem;
  readonly readers?: (pipes: {
    readonly stdout: ReadableStream<Uint8Array>;
    readonly stderr: ReadableStream<Uint8Array>;
  }) => { readonly stdout: SessionReader; readonly stderr: SessionReader };
};
const acquireReaders: NonNullable<SessionHost["readers"]> = ({ stdout, stderr }) => ({
  stdout: stdout.getReader(),
  stderr: stderr.getReader(),
});

export function prepareSession(
  input: SessionInput,
  adapter?: SessionAdapter,
  host: SessionHost = {},
): PreparedSession {
  const harness = adapter ?? adapterFor(input.agent.provider);
  const command = harness.command(input);
  const logPath = logFile(input);
  let started = false;

  return {
    logPath,
    start: () => {
      if (started) throw new Error("a prepared session can only be started once");

      started = true;
      const startedAt = performance.now();
      say(`== ${input.stage}${input.card ? ` ${input.card}` : ""} on ${agentName(input.agent)}`);
      say(`   log ${logPath}`);
      const running = startCommand({ harness, command, input, logPath, host });
      const result = running.result.then(({ stream, settlement }) =>
        finishSession(
          input,
          harness,
          stream,
          logPath,
          Math.round(performance.now() - startedAt),
          settlement,
        ),
      );
      void result.catch(() => {});

      const settlement = running.result.then((outcome) => outcome.settlement);
      void settlement.catch(() => {});

      return {
        pid: running.pid,
        processGroupId: running.pid,
        get processGroupIdentity() {
          return running.identity();
        },
        logPath,
        result,
        settlement,
        cancel: running.cancel,
      };
    },
  };
}

export async function session(
  input: SessionInput,
  adapter?: SessionAdapter,
): Promise<SessionResult> {
  const harness = adapter ?? adapterFor(input.agent.provider);
  let running: RunningSession;
  try {
    running = prepareSession(input, harness).start();
  } catch (error) {
    if (error instanceof SessionStartFailure) throw error;

    const stream = emptyStream();
    stream.errors.push(message(error));
    return finishSession(input, harness, stream, logFile(input), 0);
  }

  return running.result;
}

function finishSession(
  input: SessionInput,
  harness: SessionAdapter,
  stream: Stream,
  logPath: string,
  durationMs: number,
  settlement?: GroupSettlement,
): SessionResult {
  const { stage } = input;
  if (input.resumeSessionId && stream.sessionId !== input.resumeSessionId) {
    stream.errors.push(
      "the provider did not return the explicit resumed session ID; no fresh-session fallback is allowed",
    );
    stream.invalidAccounting = true;
  }
  if (
    harness.resume.resolvedModelMustMatchPin &&
    input.resumeSessionId &&
    input.agent.model &&
    stream.resolvedModel !== input.agent.model
  ) {
    stream.errors.push("the resumed session did not establish the pinned model");
  }

  if (!(stream.complete && stream.result) && stream.errors.length === 0) {
    stream.errors.push(`the ${stage} session ended without a completed result`);
  }

  const result = sessionResult(input, harness, stream, logPath, durationMs, settlement);
  if (result.status === "completed") console.log(result.result);
  say(summary(result));
  for (const description of stream.killedAtExit) say(`   killed at exit: ${description}`);
  if (result.status === "failed") {
    throw new SessionFailure(`the ${stage} session failed: ${result.errors.join("\n")}`, result);
  }

  return result;
}

function sessionResult(
  input: SessionInput,
  harness: SessionAdapter,
  stream: Stream,
  logPath: string,
  durationMs: number,
  settlement?: GroupSettlement,
): SessionResult {
  const usage: UsageReport = Object.assign(
    {},
    stream.usageBasis,
    definedFields({
      raw: nonEmpty(stream.rawUsage),
      parent: stream.parentUsage,
      aggregateIncludingChildren: stream.aggregateUsage,
      models: nonEmpty(stream.models),
    }),
  );

  return Object.assign(
    {
      status: stream.errors.length === 0 ? ("completed" as const) : ("failed" as const),
      durationMs,
      accountingComplete: stream.complete && stream.costCurrent && !stream.invalidAccounting,
      result: stream.result,
      logPath,
      requestedAgent: input.agent,
      usage,
      errors: stream.errors,
    },
    definedFields({
      providerCompleted: harness.providerCompletion
        ? stream.complete && !!stream.result
        : undefined,
      processExit: stream.processExit,
      configuredSession: stream.configuredSession,
      requiredToolOutcomeCoverage: stream.requiredToolOutcomeCoverage,
      toolOutcomes: nonEmpty(stream.toolOutcomes),
      settlement,
      sessionId: nonEmpty(stream.sessionId),
      resolvedModel: nonEmpty(stream.resolvedModel),
      permissionDenials: stream.permissionDenials === 0 ? undefined : stream.permissionDenials,
      killedAtExit: nonEmpty(stream.killedAtExit),
      cost: stream.cost,
      turns: stream.turns,
    }),
  );
}

function summary(result: SessionResult): string {
  return `   status ${result.status} duration ${result.durationMs}ms turns ${result.turns ?? "n/a"} denials ${result.permissionDenials ?? 0} session cost ${result.cost?.usd ?? "n/a"} session ${result.sessionId ?? "n/a"}`;
}

function agentName(agent: StageAgent): string {
  return [agent.provider, agent.model, agent.effort].filter(Boolean).join(":");
}

function startCommand({
  harness,
  command,
  input,
  logPath,
  host,
}: {
  readonly harness: SessionAdapter;
  readonly command: ProviderCommand;
  readonly input: SessionInput;
  readonly logPath: string;
  readonly host: SessionHost;
}): {
  readonly pid: number;
  readonly identity: () => ProcessGroupIdentity;
  readonly result: Promise<{ stream: Stream; settlement: GroupSettlement }>;
  readonly cancel: (reason?: string) => Promise<GroupSettlement>;
} {
  let pendingSignal: { reason: string; signal: NodeJS.Signals } | undefined;
  let requestStop = (reason: string, signal: NodeJS.Signals) => {
    pendingSignal ??= { reason, signal };
  };
  const onInterrupt = () => requestStop("received SIGINT", "SIGINT");
  const onTerminate = () => requestStop("received SIGTERM", "SIGTERM");
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);

  let child: ReturnType<typeof spawn<"ignore" | Uint8Array, "pipe", "pipe">>;
  try {
    if (command.unavailable !== undefined) throw new Error(command.unavailable);
    const stdin = command.stdin === undefined ? "ignore" : new TextEncoder().encode(command.stdin);

    child = spawn([...command.argv], {
      detached: true,
      cwd: process.cwd(),
      env: process.env,
      stdin,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    const stream = emptyStream();
    stream.errors.push(message(error));
    const result = sessionResult(input, harness, stream, logPath, 0);
    say(summary(result));
    throw new SessionStartFailure(
      `the ${input.stage} session failed: ${result.errors.join("\n")}`,
      result,
    );
  }

  const stream = emptyStream();
  const group = new OwnedProcessGroup(child.pid, host.processSystem);
  let readers: ReturnType<typeof acquireReaders>;
  let setupFailure: unknown;
  try {
    readers = (host.readers ?? acquireReaders)({ stdout: child.stdout, stderr: child.stderr });
  } catch (error) {
    setupFailure = error;
    readers = {
      stdout: { read: () => Promise.reject(error), cancel: () => child.stdout.cancel() },
      stderr: { read: () => Promise.reject(error), cancel: () => child.stderr.cancel() },
    };
  }
  const { stdout, stderr } = readers;
  const idleMs = input.idleTimeoutMs ?? idleMinutes * 60 * 1000;
  let shutdown: Promise<GroupSettlement> | undefined;
  let settled: GroupSettlement | undefined;
  let completionObservation: GroupSettlement | undefined;
  let cleanupDeadline: number | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let wall: ReturnType<typeof setTimeout> | undefined;
  let drain: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let notifyStop = () => {};
  const stopping = new Promise<void>((resolve) => {
    notifyStop = resolve;
  });
  const stop = (reason = "cancelled by caller", signal: NodeJS.Signals = "SIGTERM") => {
    if (shutdown) return shutdown;

    if (settled) {
      shutdown = Promise.resolve(settled);
      return shutdown;
    }

    stream.errors.push(reason);
    stream.invalidAccounting = true;
    clearTimeout(idle);
    clearTimeout(wall);
    clearTimeout(drain);
    shutdown = group.cancel(signal);
    notifyStop();
    return shutdown;
  };
  const idleDuration = input.idleTimeoutMs === undefined ? `${idleMinutes} minutes` : `${idleMs}ms`;
  const onIdle = () => {
    stop(`silent for ${idleDuration}, so it was stopped`);
  };
  idle = setTimeout(onIdle, idleMs);
  if (input.timeoutMs !== undefined) {
    wall = setTimeout(
      () => {
        stop(`exceeded the ${input.timeoutMs}ms wall-time budget, so it was stopped`);
      },
      Math.max(0, input.timeoutMs),
    );
  }
  requestStop = stop;
  if (pendingSignal) stop(pendingSignal.reason, pendingSignal.signal);
  if (setupFailure) stop(`session output setup failed: ${message(setupFailure)}`);

  const output = (async () => {
    try {
      for await (const line of lines(stdout, logPath)) {
        if (stopped) break;

        if (!shutdown) {
          clearTimeout(idle);
          idle = setTimeout(onIdle, idleMs);
        }

        try {
          take(stream, harness.decode(line), process.env.ITERATE_LIVE !== "0");
        } catch (error) {
          stop(message(error));
        }
        if (
          command.permissionMode &&
          stream.permissionMode &&
          stream.permissionMode !== command.permissionMode
        ) {
          stop(
            `the session started in ${stream.permissionMode} permission mode instead of ${command.permissionMode}, so it was stopped`,
          );
        }
      }
      if (!(stopped || shutdown)) {
        clearTimeout(drain);
        drain = setTimeout(() => {
          stop("the agent closed output without settling its process group");
        }, shutdownGraceMs);
      }
    } catch (error) {
      stop(message(error));
    }
  })();
  const stderrChunks: Uint8Array[] = [];
  const diagnostics = (async () => {
    const decoder = new TextDecoder();
    let diagnostic = "";
    try {
      while (!stopped) {
        const chunk = await stderr.read();
        if (chunk.done || stopped) break;

        stderrChunks.push(chunk.value);
        diagnostic += decoder.decode(chunk.value, { stream: true });
      }

      return diagnostic + decoder.decode();
    } catch (error) {
      stop(message(error));
      return diagnostic;
    }
  })();
  const exited = child.exited.then((code) => {
    stream.processExit = { code, signal: child.signalCode ?? null };
    if (!(shutdown || stopped)) {
      clearTimeout(drain);
      drain = setTimeout(() => {
        stop("the agent exited with inherited output still open");
      }, shutdownGraceMs);
    }
    return code;
  });
  const complete = Promise.all([output, diagnostics, exited]);
  const result = (async () => {
    try {
      const outcome = await Promise.race([complete, stopping.then(() => undefined)]);
      if (outcome !== undefined && !shutdown) {
        const [, diagnostic, code] = outcome;
        clearTimeout(drain);
        const observed = await group.settle();
        completionObservation = observed;
        if (observed.state === "settled") {
          settled = observed;
          if (code !== 0)
            stream.errors.push(`exit ${code}: ${diagnostic.trim() || "no stderr output"}`);
        } else {
          stop("the agent exited before its recorded processes settled");
        }
      }
      if (shutdown) {
        settled = await shutdown;
        if (completionObservation) {
          const { priorObservations = [], ...lastObservation } = completionObservation;
          settled = {
            ...settled,
            priorObservations: [
              ...priorObservations,
              lastObservation,
              ...(settled.priorObservations ?? []),
            ],
          };
        }

        cleanupDeadline = performance.now() + 200;
        let outputDeadline: ReturnType<typeof setTimeout> | undefined;
        try {
          const drained = await Promise.race([
            complete.then(() => true),
            new Promise<false>((resolve) => {
              outputDeadline = setTimeout(() => resolve(false), 200);
            }),
          ]);
          if (!drained) {
            settled = {
              ...settled,
              state: "uncertain",
              errors: [
                ...settled.errors,
                "output did not drain within the 200ms settlement allowance",
              ],
            };
          }
        } finally {
          clearTimeout(outputDeadline);
        }
      }
      settled ??= group.inspect();
      if (settled.state === "uncertain") {
        stream.invalidAccounting = true;
        stream.errors.push(
          `agent process-group settlement is uncertain: ${settled.errors.join("; ")}`,
        );
      }
    } catch (error) {
      settled = await stop(`session observation failed: ${message(error)}`);
    } finally {
      stopped = true;
      clearTimeout(idle);
      clearTimeout(wall);
      clearTimeout(drain);
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onTerminate);
      const cleanup = await cancelOutputs(
        Object.assign(
          { stdout, stderr },
          definedFields({
            allowanceMs:
              cleanupDeadline === undefined
                ? undefined
                : Math.max(0, cleanupDeadline - performance.now()),
          }),
        ),
      );
      if (cleanup.state === "uncertain") {
        const observed = settled ?? group.inspect();
        settled = {
          ...observed,
          state: "uncertain",
          errors: [...observed.errors, ...cleanup.errors],
        };
        stream.errors.push(...cleanup.errors);
        stream.invalidAccounting = true;
      }

      try {
        if (stderrChunks.length > 0) {
          appendFileSync(logPath, "[stderr]\n");
          for (const chunk of stderrChunks) appendFileSync(logPath, chunk);
        }
      } catch (error) {
        stream.errors.push(`could not retain stderr: ${message(error)}`);
        stream.invalidAccounting = true;
      }
    }

    return { stream, settlement: settled ?? group.inspect() };
  })();
  let cancellation: Promise<GroupSettlement> | undefined;
  const cancel = (reason?: string): Promise<GroupSettlement> => {
    if (cancellation) return cancellation;

    stop(reason);
    cancellation = result.then((outcome) => outcome.settlement);
    return cancellation;
  };
  return { pid: child.pid, identity: () => group.identity(), result, cancel };
}

function emptyStream(): Stream {
  return {
    result: "",
    processExit: undefined,
    configuredSession: undefined,
    requiredToolOutcomeCoverage: undefined,
    toolOutcomes: [],
    errors: [],
    sessionId: "",
    accountingSessionId: undefined,
    resolvedModel: "",
    usageReceipts: new Map(),
    rawUsage: [],
    usageBasis: {},
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
    costCurrent: false,
    invalidAccounting: false,
  };
}

function take(stream: Stream, events: readonly ProviderEvent[], live: boolean): void {
  const usage = events.find((event) => event.type === "usage");
  if (usage?.receiptId) {
    const receipt = usage.receiptId;
    const envelope = usage.usage.raw?.length ? usage.usage.raw : events;
    const previous = stream.usageReceipts.get(receipt);
    if (previous !== undefined) {
      if (!isDeepStrictEqual(previous, envelope))
        throw new Error("provider reused a terminal receipt identity with conflicting data");

      return;
    }

    if ([...stream.usageReceipts.values()].some((prior) => isDeepStrictEqual(prior, envelope)))
      return;

    stream.usageReceipts.set(receipt, envelope);
  }

  for (const event of events) {
    if (event.type === "configured_session") stream.configuredSession = event.configuration;
    if (event.type === "required_tool_coverage")
      stream.requiredToolOutcomeCoverage = event.coverage;
    if (event.type === "tool_outcome") stream.toolOutcomes.push(event.outcome);
    if (live && event.type === "text") say(event.text);
    if (live && event.type === "tool_call") say(`> ${event.name}: ${event.args}`);
    if (event.type === "result") stream.result = event.result;
    if (event.type === "session_id") {
      if (
        stream.accountingSessionId !== undefined &&
        stream.accountingSessionId !== event.sessionId
      ) {
        throw new Error("provider changed session identity after reporting accounting");
      }

      stream.sessionId = event.sessionId;
    }
    if (event.type === "resolved_model") stream.resolvedModel = event.model;
    if (event.type === "permission_mode") stream.permissionMode = event.mode;
    if (event.type === "permission_denials") stream.permissionDenials += event.count;
    if (event.type === "text" || event.type === "tool_call") {
      if (stream.complete) {
        stream.complete = false;
        stream.result = "";
      }
      stream.costCurrent = false;
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
      stream.costCurrent = event.cost !== undefined;
      stream.rawUsage.push(...(event.usage.raw ?? []));
      stream.accountingSessionId ??= stream.sessionId;
      stream.cost = latestCost(stream.cost, event.cost);
      stream.usageBasis = definedFields({
        parentBasis: event.usage.parentBasis,
        aggregateBasis: event.usage.aggregateBasis,
        modelsBasis: event.usage.modelsBasis,
      });
      if (event.turns !== undefined) {
        stream.turns = (stream.turns ?? 0) + event.turns;
      }
      stream.parentUsage =
        event.usage.parentBasis === "sessionCumulative"
          ? cumulativeUsage(stream.parentUsage, event.usage.parent)
          : mergeUsage(stream.parentUsage, event.usage.parent);
      stream.aggregateUsage =
        event.usage.aggregateBasis === "invocation"
          ? mergeUsage(stream.aggregateUsage, event.usage.aggregateIncludingChildren)
          : cumulativeUsage(stream.aggregateUsage, event.usage.aggregateIncludingChildren);
      if (event.usage.models) stream.models = [...event.usage.models];
    }
  }
}

function mergeUsage(current: TokenUsage | undefined, next: TokenUsage | undefined) {
  return next === undefined ? current : addTokens(current, next);
}

function latestCost(
  current: SessionCost | undefined,
  next: SessionCost | undefined,
): SessionCost | undefined {
  if (next === undefined) return current;

  if (current !== undefined && current.scope !== next.scope) {
    throw new Error(`provider mixed ${current.scope} and ${next.scope} cost scopes`);
  }

  if (current !== undefined && current.basis !== next.basis)
    throw new Error("provider changed the cost temporal basis within one invocation");

  if (current && next.basis === "sessionCumulative" && next.usd < current.usd)
    throw new Error("provider cumulative cost regressed within one invocation");

  return next;
}

function cumulativeUsage(
  current: TokenUsage | undefined,
  next: TokenUsage | undefined,
): TokenUsage | undefined {
  if (next === undefined) return current;

  for (const key of ["input", "cacheRead", "cacheWrite", "output", "reasoning"] as const) {
    const before = current?.[key];
    const after = next[key];
    if (before !== undefined && after !== undefined && after < before)
      throw new Error(`provider cumulative ${key} tokens regressed within one invocation`);
  }

  return next;
}

async function* lines(stdout: SessionReader, logPath: string): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let rest = "";

  while (true) {
    const { done, value: chunk } = await stdout.read();
    if (done) break;

    appendFileSync(logPath, chunk);
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
