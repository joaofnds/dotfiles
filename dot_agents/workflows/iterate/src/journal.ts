import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { $ } from "bun";
import { z } from "zod";
import { type Stage, type StageAgent, stages } from "./agents.ts";
import { Exit } from "./exit.ts";
import type { SessionResult } from "./session.ts";

export const sessionCap = 6;
const nonnegative = z.number().finite().nonnegative();
const requestSchema = z.object({
  provider: z.enum(["claude", "codex", "opencode"]),
  model: z.string().optional(),
  effort: z.string().optional(),
});
const attemptSchema = z.object({
  id: z.uuid(),
  stage: z.enum([...stages, "triage", "reflect"]),
  card: z.string(),
  startedAt: z.iso.datetime(),
  status: z.enum(["running", "completed", "failed"]),
  requestedAgent: requestSchema,
  durationMs: nonnegative.optional(),
  costUsd: nonnegative.optional(),
  costScope: z.enum(["parent", "aggregateIncludingChildren"]).optional(),
  sessionId: z.string().optional(),
  reportPath: z.string().optional(),
  logPath: z.string().optional(),
});
const journalSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  card: z.string().optional(),
  acceptedIds: z.array(z.string()).optional(),
  completed: z.boolean(),
  reflectedFrom: z.string().optional(),
  reflectionCheck: z.enum(["pending", "failed", "passed"]).optional(),
  reflectedTo: z.string().optional(),
  bet: z.string().optional(),
  betRecorded: z.boolean().optional(),
  limits: z.object({ dollars: nonnegative.optional(), durationMs: nonnegative.optional() }),
  attempts: z.array(attemptSchema),
});
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
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

export async function journalDirectory(): Promise<string> {
  return resolve((await $`git rev-parse --git-path iterate`.quiet().text()).trim());
}

/** One writer per working tree; a crashed writer leaves evidence for recovery. */
export async function withJournalLock<T>(operation: () => Promise<T>): Promise<T> {
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
  try {
    return await operation();
  } finally {
    await unlink(path);
  }
}

export class Journal {
  private constructor(
    readonly directory: string,
    readonly record: Record,
  ) {}

  static async read(id?: string): Promise<Journal | undefined> {
    const directory = await journalDirectory();
    if (id) {
      const current = await Journal.read();
      if (current?.record.card === id) return current;
    }
    const pointer = await optionalFile(join(directory, id ? `${id}.json` : "current.json"));
    if (!pointer) return undefined;
    const runId = z.uuid().parse(JSON.parse(pointer));
    const raw = await readFile(join(directory, runId, "run.json"), "utf8");
    return new Journal(join(directory, runId), journalSchema.parse(JSON.parse(raw)));
  }

  static async open(id: string, newCycle = false): Promise<Journal> {
    const current = await Journal.read();
    if (current?.record.card)
      await atomicJson(
        join(await journalDirectory(), `${current.record.card}.json`),
        current.record.id,
      );

    const existing = await Journal.read(id);
    if (existing && !(newCycle && existing.record.completed)) {
      await atomicJson(join(await journalDirectory(), "current.json"), existing.record.id);
      return existing;
    }

    const dollars = configuredLimit("ITERATE_RUN_BUDGET");
    const durationMs = configuredLimit("ITERATE_RUN_MINUTES", 60_000);
    const record: Record = {
      schemaVersion: 1,
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      card: id,
      completed: false,
      limits: {
        ...(dollars === undefined ? {} : { dollars }),
        ...(durationMs === undefined ? {} : { durationMs }),
      },
      attempts: [],
    };
    const root = await journalDirectory();
    const journal = new Journal(join(root, record.id), record);

    await mkdir(journal.directory, { recursive: true, mode: 0o700 });
    await journal.save();
    await atomicJson(join(root, "current.json"), record.id);
    await atomicJson(join(root, `${id}.json`), record.id);

    return journal;
  }

  async save(): Promise<void> {
    await atomicJson(join(this.directory, "run.json"), this.record);
  }

  summary() {
    return {
      ...this.record,
      directory: this.directory,
      totals: {
        knownCostUsd: this.record.attempts.reduce(
          (sum, attempt) => sum + (attempt.costUsd ?? 0),
          0,
        ),
        unknownCostAttempts: this.record.attempts.filter((attempt) => attempt.costUsd === undefined)
          .length,
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
    return {
      ...(budget === undefined ? {} : { budget }),
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    };
  }

  resumeId(stage: Stage, agent: StageAgent): string {
    if (stage === "review")
      throw new Exit(1, `${stage} requires fresh independent judgment; it cannot resume`);
    const previous = this.record.attempts.at(-1);
    if (
      !previous ||
      previous.stage !== stage ||
      !previous.sessionId ||
      JSON.stringify(previous.requestedAgent) !== JSON.stringify(agent)
    )
      throw new Exit(
        1,
        "resume requires the same card stage and agent options with a recorded session ID",
      );
    return previous.sessionId;
  }

  async begin(stage: Stage, card: string, requestedAgent: StageAgent): Promise<Attempt> {
    const attempt: Attempt = {
      id: randomUUID(),
      stage,
      card,
      requestedAgent,
      startedAt: new Date().toISOString(),
      status: "running",
    };
    this.record.attempts.push(attempt);
    await this.save();
    return attempt;
  }

  async finish(attempt: Attempt, result: SessionResult): Promise<void> {
    const reportPath = join(this.directory, `${attempt.id}.json`);
    await atomicJson(reportPath, result);
    Object.assign(attempt, {
      status: result.status,
      durationMs: result.durationMs,
      ...(result.cost === undefined
        ? {}
        : { costUsd: result.cost.usd, costScope: result.cost.scope }),
      ...(result.sessionId === undefined ? {} : { sessionId: result.sessionId }),
      logPath: result.logPath,
      reportPath,
    });
    await this.save();
  }
}
