import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { $ } from "bun";
import { z } from "zod";
import {
  type AgentSelection,
  planSchemaOver,
  type Stage,
  type StageAgent,
  type SupervisedPlan,
  stages,
} from "./agents.ts";
import { BoardCommandFailure, type ExclusionRetention } from "./board-transaction.ts";
import { claimSchema } from "./claims.ts";
import { definedFields } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import { atomicJson, type JsonWriter, readOptionalFile } from "./files.ts";
import { adapterFor, providerNames } from "./provider.ts";
import {
  configuredSessionSchema,
  type RuntimeContract,
  toolOutcomeSchema,
} from "./provider-types.ts";
import type { SessionResult } from "./session.ts";
import {
  addTokens,
  costSchema,
  type SessionCost,
  type TokenUsage,
  tokenDelta,
  type UsageReport,
  usageSchema,
} from "./usage.ts";

export const sessionCap = 6;
export type AuthorMode = "fresh" | "resume" | "continue-author";
const nonnegative = z.number().finite().nonnegative();
export const runtimeContractSchema = z.object({
  cliVersion: z.string(),
  fingerprint: z.string(),
  rolePolicy: z.string(),
  localInputs: z
    .object({ established: z.boolean(), reasons: z.array(z.string()).readonly() })
    .optional(),
  coverage: z.array(z.string()).readonly().optional(),
  unknowns: z.array(z.string()).readonly().optional(),
});
/** Providers an earlier runner dispatched. Stored history may name them; nothing dispatches them. */
const retiredProviders = ["opencode", "antigravity", "agy"] as const;
const recordedProviders = [...providerNames, ...retiredProviders] as const;
type RecordedProvider = (typeof recordedProviders)[number];
const requestSchema = z.object({
  provider: z.enum(recordedProviders),
  model: z.string().optional(),
  effort: z.string().optional(),
});
const modelRerouteSchema = z.object({
  fromModel: z.string(),
  toModel: z.string(),
  reason: z.string(),
});
export const sessionReportSchema = z.object({
  status: z.enum(["completed", "failed"]),
  durationMs: nonnegative,
  result: z.string(),
  sessionId: z.string().optional(),
  logPath: z.string(),
  requestedAgent: requestSchema,
  configuredSession: configuredSessionSchema.optional(),
  providerCompleted: z.boolean().optional(),
  processExit: z
    .object({ code: z.number().int().nullable(), signal: z.string().nullable() })
    .optional(),
  requiredToolOutcomeCoverage: z.literal("unknown").optional(),
  toolOutcomes: z.array(toolOutcomeSchema).optional(),
  modelReroutes: z.array(modelRerouteSchema).optional(),
  resolvedModel: z.string().optional(),
  accountingComplete: z.boolean(),
  permissionDenials: nonnegative.optional(),
  killedAtExit: z.array(z.string()).optional(),
  usage: usageSchema,
  cost: costSchema.optional(),
  turns: nonnegative.optional(),
  errors: z.array(z.string()),
  settlement: z
    .object({
      state: z.enum(["settled", "uncertain"]),
      scope: z.literal("original-group-and-recorded-members"),
      unobservedDescendants: z.literal("unknown"),
      pid: z.number().int().positive(),
      processGroupId: z.number().int().positive(),
      evidence: z.array(z.string()),
      errors: z.array(z.string()),
      members: z.array(
        z.object({
          pid: z.number(),
          parentPid: z.number(),
          groupId: z.number(),
          uid: z.number(),
          started: z.string(),
          state: z.string(),
        }),
      ),
    })
    .passthrough()
    .optional(),
});
const savedPlanSchema = planSchemaOver(recordedProviders).transform(
  (value): SupervisedPlan<RecordedProvider> => value,
);
const attemptSchema = z
  .object({
    id: z.uuid(),
    stage: z.enum([...stages, "triage", "reflect"]),
    card: z.string(),
    startedAt: z.iso.datetime(),
    status: z.enum(["running", "completed", "failed"]),
    requestedAgent: requestSchema,
    selection: savedPlanSchema.optional(),
    runtime: runtimeContractSchema.optional(),
    configuredSession: configuredSessionSchema.optional(),
    modelReroutes: z.array(modelRerouteSchema).optional(),
    providerCompleted: z.boolean().optional(),
    processExit: z
      .object({ code: z.number().int().nullable(), signal: z.string().nullable() })
      .optional(),
    requiredToolOutcomeCoverage: z.literal("unknown").optional(),
    resolvedModel: z.string().optional(),
    accountingComplete: z.boolean().optional(),
    costReceipt: costSchema.optional(),
    usageReceipt: usageSchema.optional(),
    usageDelta: usageSchema.optional(),
    durationMs: nonnegative.optional(),
    costUsd: nonnegative.optional(),
    costScope: z.enum(["parent", "aggregateIncludingChildren"]).optional(),
    sessionId: z.string().optional(),
    reportPath: z.string().optional(),
    logPath: z.string().optional(),
  })
  .passthrough();
export const journalSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    id: z.uuid(),
    startedAt: z.iso.datetime(),
    card: z.string().optional(),
    acceptedIds: z.array(z.string()).optional(),
    completed: z.boolean(),
    runClaim: claimSchema.optional(),
    ownershipInitiated: z.literal(true).optional(),
    reflectedFrom: z.string().optional(),
    reflectionCheck: z.enum(["pending", "failed", "passed"]).optional(),
    reflectedTo: z.string().optional(),
    bet: z.string().optional(),
    betRecorded: z.boolean().optional(),
    limits: z.object({ dollars: nonnegative.optional(), durationMs: nonnegative.optional() }),
    supervisedPlan: savedPlanSchema.optional(),
    selectionHistory: z
      .array(
        z.object({
          at: z.iso.datetime(),
          previous: savedPlanSchema.optional(),
          next: savedPlanSchema,
        }),
      )
      .optional(),
    attempts: z.array(attemptSchema),
  })
  .passthrough();
type Record = z.infer<typeof journalSchema>;
type Attempt = z.infer<typeof attemptSchema>;

function configuredLimit(name: string, multiplier = 1): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = Number(raw) * multiplier;
  if (!Number.isFinite(value) || value <= 0)
    throw new Exit(1, `${name} must be positive and finite`);
  return value;
}

async function optionalFile(path: string): Promise<string | undefined> {
  return (await readOptionalFile({ path, description: "iterate journal" }))?.toString();
}

export { atomicJson } from "./files.ts";

export async function journalDirectory(): Promise<string> {
  return resolve((await $`git rev-parse --git-path iterate`.quiet().text()).trim());
}

/** One writer per working tree; a crashed writer leaves evidence for recovery. */
export async function withJournalLock<T>(
  operation: () => Promise<T>,
  retention?: ExclusionRetention,
): Promise<T> {
  const directory = await journalDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "lock");
  try {
    await writeFile(path, String(process.pid), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;

    throw new Exit(
      1,
      `iterate is locked at ${path}; inspect its PID and any child before removing a stale lock`,
    );
  }
  const owned = await lstat(path);
  let settled = true;
  try {
    return await operation();
  } catch (error) {
    if (error instanceof BoardCommandFailure && error.unsettled) settled = false;

    throw error;
  } finally {
    if (settled && !retention?.retained) {
      const held = await lstat(path);
      if (
        held.dev === owned.dev &&
        held.ino === owned.ino &&
        (await readFile(path, "utf8")) === String(process.pid)
      )
        await unlink(path);
    }
  }
}

function knownCost(attempts: readonly Attempt[]): number {
  return attempts.reduce((sum, attempt) => sum + (attempt.costUsd ?? 0), 0);
}

export class Journal {
  private constructor(
    readonly directory: string,
    readonly record: Record,
    private readonly writeJson: JsonWriter = atomicJson,
  ) {}

  static async read(id?: string, writeJson: JsonWriter = atomicJson): Promise<Journal | undefined> {
    const directory = await journalDirectory();
    if (id) {
      const current = await Journal.read(undefined, writeJson);
      if (current?.record.card === id) return current;
    }
    const pointerPath = join(directory, id ? `${id}.json` : "current.json");
    const pointer = await optionalFile(pointerPath);
    if (pointer === undefined) return undefined;

    let runId: string;
    try {
      runId = z.uuid().parse(JSON.parse(pointer));
    } catch {
      throw new Exit(
        1,
        `invalid iterate index ${pointerPath}; inspect it without resetting the run`,
      );
    }
    const path = join(directory, runId, "run.json");
    const raw = await optionalFile(path);
    if (raw === undefined)
      throw new Exit(
        1,
        `iterate journal ${path} is missing; inspect its index without resetting the run`,
      );

    try {
      const value = JSON.parse(raw);
      const version = z.object({ schemaVersion: z.number() }).parse(value).schemaVersion;
      if (version !== 1 && version !== 2)
        throw new Exit(
          1,
          `unsupported iterate journal schema ${version}; use compatible code without rewriting the journal`,
        );

      const record = journalSchema.parse(value);
      if (record.id !== runId)
        throw new Exit(
          1,
          `iterate journal ${path} has a different run identity; inspect its index`,
        );

      if (id !== undefined && record.card !== id)
        throw new Exit(
          1,
          `iterate index ${pointerPath} does not establish card ${id}; inspect its journal`,
        );

      return new Journal(join(directory, runId), record, writeJson);
    } catch (error) {
      if (error instanceof Exit) throw error;

      throw new Exit(1, `invalid iterate journal ${path}; inspect it without resetting the run`);
    }
  }

  static async open(
    id: string,
    newCycle = false,
    writeJson: JsonWriter = atomicJson,
  ): Promise<Journal> {
    const current = await Journal.read(undefined, writeJson);
    if (current?.record.card)
      await writeJson(
        join(await journalDirectory(), `${current.record.card}.json`),
        current.record.id,
      );

    const existing = await Journal.read(id, writeJson);
    if (existing && !(newCycle && existing.cycleEnded())) {
      await writeJson(join(await journalDirectory(), "current.json"), existing.record.id);
      return existing;
    }

    const dollars = configuredLimit("ITERATE_RUN_BUDGET");
    const durationMs = configuredLimit("ITERATE_RUN_MINUTES", 60_000);
    const record: Record = {
      schemaVersion: 2,
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      card: id,
      completed: false,
      ownershipInitiated: true,
      limits: definedFields({ dollars, durationMs }),
      attempts: [],
    };
    const root = await journalDirectory();
    const journal = new Journal(join(root, record.id), record, writeJson);

    await mkdir(journal.directory, { recursive: true, mode: 0o700 });
    await journal.save();
    await writeJson(join(root, "current.json"), record.id);
    await writeJson(join(root, `${id}.json`), record.id);

    return journal;
  }

  async save(): Promise<void> {
    this.record.schemaVersion = 2;
    await this.writeJson(join(this.directory, "run.json"), this.record);
  }

  cycleEnded(): boolean {
    return this.record.completed || this.record.runClaim?.releasedAt !== undefined;
  }

  summary() {
    return {
      ...this.record,
      directory: this.directory,
      totals: {
        knownCostUsd: knownCost(this.record.attempts),
        usage: usageTotals(this.record.attempts),
        unknownCostAttempts: this.record.attempts.filter(
          (attempt) =>
            attempt.costUsd === undefined ||
            attempt.costScope === undefined ||
            attempt.accountingComplete === false,
        ).length,
        parentOnlyCostAttempts: this.record.attempts.filter(
          (attempt) => attempt.costScope === "parent",
        ).length,
        durationMs: this.record.attempts.reduce(
          (sum, attempt) => sum + (attempt.durationMs ?? 0),
          0,
        ),
        interruptedAttempts: this.record.attempts.filter((attempt) => attempt.status === "running")
          .length,
      },
    };
  }

  async requireCurrentSnapshot(): Promise<void> {
    const latest = await Journal.read(this.record.card, this.writeJson);
    if (
      !latest ||
      latest.directory !== this.directory ||
      !isDeepStrictEqual(
        JSON.parse(JSON.stringify(latest.record)),
        JSON.parse(JSON.stringify(this.record)),
      )
    )
      throw new Exit(
        1,
        `the journal changed during ownership admission at ${this.directory}; retain transition evidence`,
      );
  }

  requireSettledAttempts(): void {
    if (this.record.attempts.some((attempt) => attempt.status === "running"))
      throw new Exit(
        1,
        `an attempt has no terminal record; inspect ${this.directory} before recovering it`,
      );
  }

  allowances(): { budget?: number; timeoutMs?: number } {
    this.requireSettledAttempts();

    const { totals } = this.summary();
    if (
      this.record.attempts.filter(
        (attempt) => attempt.stage !== "triage" && attempt.stage !== "reflect",
      ).length >= sessionCap
    )
      throw new Exit(
        1,
        `${this.record.card} passed the ${sessionCap} session cap without reaching Done`,
      );
    const dollars = this.record.limits.dollars;
    if (dollars !== undefined && (totals.unknownCostAttempts || totals.parentOnlyCostAttempts))
      throw new Exit(
        1,
        `run budget cannot be enforced: attempt costs are unknown or parent-only; inspect ${this.directory}`,
      );
    const budget = dollars === undefined ? undefined : dollars - totals.knownCostUsd;
    if (budget !== undefined && budget <= 0.000_001)
      throw new Exit(1, "the run dollar budget is exhausted");
    const duration = this.record.limits.durationMs;
    const timeoutMs = duration === undefined ? undefined : duration - totals.durationMs;
    if (timeoutMs !== undefined && timeoutMs <= 0)
      throw new Exit(1, "the run time budget is exhausted");
    return definedFields({ budget, timeoutMs });
  }

  requireKnownCosts(): void {
    const { totals } = this.summary();
    if (totals.unknownCostAttempts || totals.parentOnlyCostAttempts) {
      throw new Exit(
        1,
        `dollar cap cannot be enforced: attempt costs are unknown, incomplete or parent-only; inspect ${this.directory}`,
      );
    }
  }

  authorSessionId(
    stage: Stage,
    agent: StageAgent,
    runtime: RuntimeContract,
    mode: AuthorMode,
  ): string | undefined {
    if (mode === "fresh") return undefined;

    this.requireSettledAttempts();
    if (mode === "continue-author") {
      const previous = this.record.attempts.at(-1);
      if (!(stage === "build" && previous?.stage === "shape" && previous.status === "completed"))
        throw new Exit(
          1,
          "author continuity requires Build immediately after a completed shape attempt; use a fresh step (Review always starts fresh)",
        );

      if (previous.requiredToolOutcomeCoverage === "unknown")
        throw new Exit(
          1,
          "author continuity cannot reuse a shape attempt with unknown required-tool outcome coverage; use a fresh step",
        );

      return this.resumeId("shape", agent, runtime);
    }

    return this.resumeId(stage, agent, runtime);
  }

  resumeId(stage: Stage, agent: StageAgent, runtime?: RuntimeContract): string {
    this.requireSettledAttempts();
    if (stage === "review")
      throw new Exit(1, `${stage} requires fresh independent judgment; it cannot resume`);
    const previous = this.record.attempts.at(-1);
    if (
      !previous ||
      previous.card !== this.record.card ||
      previous.stage !== stage ||
      !previous.sessionId ||
      previous.requestedAgent.provider !== agent.provider ||
      previous.requestedAgent.model !== agent.model ||
      previous.requestedAgent.effort !== agent.effort
    )
      throw new Exit(
        1,
        "resume requires the same card stage and agent options with a recorded session ID; use a fresh step",
      );
    const adapter = adapterFor(agent.provider);
    if (
      adapter.resume.requiresEstablishedLocalInputs &&
      !(previous.runtime?.localInputs?.established && runtime?.localInputs?.established)
    ) {
      throw new Exit(
        1,
        `${adapter.displayName} local runtime inputs are unestablished for compatible resume: ${runtime?.localInputs?.reasons.join("; ") || "missing established local-input receipt"}; use a fresh step`,
      );
    }
    const configurationMatches = adapter.resume.configurationMatches({ previous, agent });
    if (
      !(agent.model && agent.effort && configurationMatches) ||
      !previous.runtime ||
      !runtime ||
      JSON.stringify(previous.runtime) !== JSON.stringify(runtime)
    ) {
      throw new Exit(
        1,
        "resume effective author contract is unknown or changed (native defaults/runtime/role policy); use a fresh step with explicit model and effort",
      );
    }
    return previous.sessionId;
  }

  async begin(
    stage: Stage,
    card: string,
    requestedAgent: AgentSelection,
    runtime?: RuntimeContract,
    selection?: {
      readonly plan: { readonly supervised?: SupervisedPlan };
      readonly action: string;
    },
  ): Promise<Attempt> {
    this.requireSettledAttempts();
    if (
      selection?.plan.supervised &&
      (selection.action === "create" || selection.action === "replace")
    ) {
      const next = selection.plan.supervised;
      this.record.selectionHistory ??= [];
      this.record.selectionHistory.push(
        Object.assign(
          { at: new Date().toISOString(), next },
          definedFields({ previous: this.record.supervisedPlan }),
        ),
      );
      this.record.supervisedPlan = next;
    }
    const attempt: Attempt = Object.assign(
      {
        id: randomUUID(),
        stage,
        card,
        requestedAgent,
        startedAt: new Date().toISOString(),
        status: "running" as const,
      },
      definedFields({ runtime, selection: this.record.supervisedPlan }),
    );
    this.record.attempts.push(attempt);
    await this.save();
    return attempt;
  }

  async finish(attempt: Attempt, result: SessionResult): Promise<number | undefined> {
    if (attempt.status !== "running") return attempt.costUsd;

    const reportPath = join(this.directory, `${attempt.id}.json`);
    await this.writeJson(reportPath, result);
    if (result.settlement?.state === "uncertain") return undefined;

    return this.finishRecordedReport(attempt.id, result);
  }

  requireReportSnapshot(snapshot: unknown, id: string, result: SessionResult): void {
    const original = journalSchema.parse(snapshot);
    const probe = new Journal(this.directory, original, this.writeJson);
    const attempt = probe.record.attempts.find((entry) => entry.id === id);
    const current = this.record.attempts.find((entry) => entry.id === id);
    if (!(attempt && current && attempt.status === "running"))
      throw new Exit(1, "stage has no original unfinished attempt snapshot");

    if (current.status !== "running") probe.applyReport(attempt, result);

    if (
      !isDeepStrictEqual(
        JSON.parse(JSON.stringify(probe.record)),
        JSON.parse(JSON.stringify(this.record)),
      )
    )
      throw new Exit(
        1,
        "stage journal conflicts with original history, claim, selection or limits",
      );
  }

  async requireMatchingReport(id: string, result: SessionResult): Promise<void> {
    const before = JSON.parse(JSON.stringify(this.record));
    const attempt = this.record.attempts.find((entry) => entry.id === id);
    if (!attempt) throw new Exit(1, "original report attempt is missing");

    const probe = new Journal(this.directory, before, this.writeJson);
    const original = probe.record.attempts.find((entry) => entry.id === id);
    if (!original) throw new Exit(1, "original report attempt is missing");

    original.status = "running";
    probe.applyReport(original, result);
    if (!isDeepStrictEqual(probe.record, this.record))
      throw new Exit(1, "terminal attempt conflicts with its original report");
  }

  async finishRecordedReport(id: string, result: SessionResult): Promise<number | undefined> {
    const attempt = this.record.attempts.find((entry) => entry.id === id);
    if (!attempt) throw new Exit(1, "original report attempt is missing");

    if (attempt.status !== "running") {
      await this.requireMatchingReport(id, result);
      return attempt.costUsd;
    }

    this.applyReport(attempt, result);
    await this.save();

    return attempt.costUsd;
  }

  private applyReport(attempt: Attempt, result: SessionResult): void {
    const reportPath = join(this.directory, `${attempt.id}.json`);
    const earlier = this.record.attempts.filter(
      (entry) =>
        entry !== attempt &&
        entry.requestedAgent.provider === attempt.requestedAgent.provider &&
        entry.sessionId === result.sessionId,
    );
    const costUsd = spend(result.cost, result.sessionId, earlier);
    const usageDelta = usageSpend(result.usage, result.sessionId, earlier);
    Object.assign(
      attempt,
      {
        status: result.status,
        durationMs: result.durationMs,
        accountingComplete: result.accountingComplete,
        usageReceipt: result.usage,
        usageDelta,
        logPath: result.logPath,
        reportPath,
      },
      definedFields({
        processExit: result.processExit,
        configuredSession: result.configuredSession,
        providerCompleted: result.providerCompleted,
        requiredToolOutcomeCoverage: result.requiredToolOutcomeCoverage,
        costReceipt: result.cost,
        costScope: result.cost?.scope,
        costUsd,
        resolvedModel: result.resolvedModel,
        sessionId: result.sessionId,
      }),
    );
  }
}

function spend(
  cost: SessionCost | undefined,
  sessionId: string | undefined,
  earlier: readonly Attempt[],
): number | undefined {
  if (!cost) return undefined;

  if (cost.basis === "invocation") return cost.usd;

  if (!sessionId) return undefined;

  let baseline = 0;
  for (const entry of earlier) {
    const receipt = entry.costReceipt;
    if (!receipt || receipt.scope !== cost.scope) return undefined;

    if (receipt.basis === "invocation") baseline += receipt.usd;
    else {
      if (receipt.usd < baseline) return undefined;

      baseline = receipt.usd;
    }
  }
  const delta = Math.round((cost.usd - baseline) * 1e9) / 1e9;

  return delta < 0 ? undefined : delta;
}

function usageSpend(
  usage: UsageReport,
  sessionId: string | undefined,
  earlier: readonly Attempt[],
): UsageReport {
  const normalized: { parent?: TokenUsage; aggregateIncludingChildren?: TokenUsage } = {};
  for (const [scope, basis] of [
    ["parent", "parentBasis"],
    ["aggregateIncludingChildren", "aggregateBasis"],
  ] as const) {
    const current = usage[scope];
    if (!current) continue;

    if (usage[basis] === "invocation") normalized[scope] = current;
    if (usage[basis] === "sessionCumulative" && sessionId) {
      let baseline: TokenUsage | undefined;
      for (const entry of earlier) {
        const receipt = entry.usageReceipt;
        if (receipt?.[basis] === "sessionCumulative") baseline = receipt[scope] ?? {};
        else if (receipt?.[basis] === "invocation")
          baseline = addTokens(baseline, receipt[scope] ?? {});
        else baseline = {};
      }
      normalized[scope] = tokenDelta(current, baseline);
    }
  }

  return normalized;
}

function usageTotals(attempts: readonly Attempt[]): UsageReport {
  if (attempts.length === 0) return {};

  return {
    parent: attempts.reduce<TokenUsage | undefined>(
      (total, attempt) => addTokens(total, attempt.usageDelta?.parent ?? {}),
      undefined,
    ),
    aggregateIncludingChildren: attempts.reduce<TokenUsage | undefined>(
      (total, attempt) => addTokens(total, attempt.usageDelta?.aggregateIncludingChildren ?? {}),
      undefined,
    ),
  };
}
