import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
  durableJson,
  lockSnapshotSchema,
  markerSchema,
  type NativeGate,
  snapshotExecutionLock,
} from "./board-transaction.ts";
import { Exit } from "./exit.ts";
import { type JsonWriter, readOptionalFile } from "./files.ts";
import { type Journal, sessionReportSchema } from "./journal.ts";
import {
  OwnedProcessGroup,
  type ProcessGroupSystem,
  processGroupIdentitySchema,
} from "./process-group.ts";
import type { RunningSession, SessionResult, SessionStartFailure } from "./session.ts";

export const stageReceiptSchema = z.object({
  schemaVersion: z.literal(1),
  token: z.uuid(),
  board: z.string(),
  card: z.string(),
  run: z.uuid(),
  journal: z.string(),
  attempt: z.uuid(),
  logPath: z.string(),
  state: z.enum(["launching", "not-started", "running", "observed", "completed"]),
  journalSnapshot: z.unknown(),
  claim: z.unknown(),
  locks: z.array(lockSnapshotSchema),
  identity: processGroupIdentitySchema.optional(),
  reportPath: z.string().optional(),
  reportSha256: z.string().optional(),
});
type Receipt = z.infer<typeof stageReceiptSchema>;
export function sha256(bytes: string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export class StageReceipt {
  private constructor(
    readonly path: string,
    private readonly value: Receipt,
    private readonly writeJson: JsonWriter,
  ) {}

  get attempt(): string {
    return this.value.attempt;
  }

  static async create(
    gate: NativeGate,
    journal: Journal,
    attempt: string,
    logPath: string,
    writeJson: JsonWriter = durableJson,
  ): Promise<StageReceipt> {
    const receipt = new StageReceipt(
      `${gate.marker.intent}.stage.json`,
      {
        schemaVersion: 1,
        token: gate.marker.token,
        board: gate.marker.board,
        card: gate.marker.card,
        run: journal.record.id,
        journal: journal.directory,
        attempt,
        logPath,
        state: "launching",
        journalSnapshot: JSON.parse(JSON.stringify(journal.record)),
        claim: journal.record.runClaim,
        locks: await Promise.all([
          snapshotExecutionLock(join(gate.marker.board, ".iterate", `${gate.marker.card}.lock`)),
          snapshotExecutionLock(join(journal.directory, "..", "lock")),
        ]),
      },
      writeJson,
    );
    if (JSON.stringify(receipt.value.locks) !== JSON.stringify(gate.marker.locks))
      throw new Exit(1, "execution lock identities changed before stage creation");

    await writeJson(receipt.path, receipt.value);

    return receipt;
  }

  async started(running: RunningSession): Promise<void> {
    this.value.state = "running";
    this.value.identity = processGroupIdentitySchema.parse(running.processGroupIdentity);
    await this.writeJson(this.path, this.value);
  }

  async observed(result: SessionResult, running: RunningSession): Promise<void> {
    await this.recordReport(result);
    this.value.state = "observed";
    this.value.identity = processGroupIdentitySchema.parse(running.processGroupIdentity);
    await this.writeJson(this.path, this.value);
  }

  async notStarted(failure: SessionStartFailure): Promise<void> {
    await this.recordReport(failure.result);
    this.value.state = "not-started";
    await this.writeJson(this.path, this.value);
  }

  private async recordReport(result: SessionResult): Promise<void> {
    const reportPath = join(this.value.journal, `${this.attempt}.json`);
    await this.writeJson(reportPath, result);
    this.value.reportPath = reportPath;
    this.value.reportSha256 = sha256(await readFile(reportPath, "utf8"));
  }

  async completed(): Promise<void> {
    this.value.state = "completed";
    await this.writeJson(this.path, this.value);
  }

  static async recover(
    journal: Journal,
    token: string,
    board: string,
    processSystem?: ProcessGroupSystem,
  ): Promise<void> {
    const card = journal.record.card;
    const path = join(board, ".iterate", "transactions", `${card}.${token}.json.stage.json`);
    const raw = await readOptionalFile({ path, description: "retained stage receipt" });
    if (!raw) return;

    const receipt = stageReceiptSchema.parse(JSON.parse(raw.toString()));
    if (
      !(
        receipt.token === token &&
        receipt.board === board &&
        receipt.card === card &&
        receipt.run === journal.record.id &&
        receipt.journal === journal.directory
      )
    )
      throw new Exit(1, `stage receipt identity conflicts at ${path}`);

    if (
      !(
        receipt.reportPath &&
        receipt.reportSha256 &&
        ["not-started", "observed", "completed"].includes(receipt.state)
      )
    )
      throw new Exit(1, `stage lacks reliable identity or genuine normalized report at ${path}`);

    const originalMarker = markerSchema.parse(
      JSON.parse(await readFile(path.slice(0, -".stage.json".length), "utf8")),
    );
    const notStarted = receipt.state === "not-started";
    if (!notStarted) {
      if (!receipt.identity || receipt.identity.ownerPid !== originalMarker.owner.pid)
        throw new Exit(1, `stage process owner conflicts with its original intent at ${path}`);

      const inspection = await OwnedProcessGroup.restore(receipt.identity, processSystem).settle();
      if (inspection.state !== "settled")
        throw new Exit(
          1,
          `stage process scope remains uncertain at ${path}: ${inspection.errors.join("; ")}`,
        );
    }

    if (receipt.reportPath !== join(journal.directory, `${receipt.attempt}.json`))
      throw new Exit(1, `stage report path conflicts at ${path}`);

    const bytes = await readFile(receipt.reportPath, "utf8");
    if (sha256(bytes) !== receipt.reportSha256)
      throw new Exit(1, `original stage report changed at ${receipt.reportPath}`);

    const result = sessionReportSchema.parse(JSON.parse(bytes)) as SessionResult;
    const attempt = journal.record.attempts.find((entry) => entry.id === receipt.attempt);
    const settled = notStarted
      ? !receipt.identity &&
        result.status === "failed" &&
        !result.accountingComplete &&
        result.durationMs === 0 &&
        result.errors.length > 0 &&
        !result.sessionId &&
        !result.settlement &&
        !result.cost &&
        Object.keys(result.usage).length === 0
      : result.settlement?.state === "settled" &&
        result.settlement.pid === receipt.identity?.pid &&
        result.settlement.processGroupId === receipt.identity?.processGroupId;
    if (
      !(
        attempt &&
        result.logPath === receipt.logPath &&
        isDeepStrictEqual(result.requestedAgent, attempt.requestedAgent) &&
        settled
      )
    )
      throw new Exit(1, `stage report provenance or output settlement is unresolved at ${path}`);

    if (!isDeepStrictEqual(journal.record.runClaim, receipt.claim))
      throw new Exit(1, `stage claim changed at ${path}`);

    await journal.requireCurrentSnapshot();
    journal.requireReportSnapshot(receipt.journalSnapshot, receipt.attempt, result);
    if (attempt.status === "running") {
      if (!isDeepStrictEqual(JSON.parse(JSON.stringify(journal.record)), receipt.journalSnapshot))
        throw new Exit(1, `unfinished stage journal differs from its original launch at ${path}`);

      await journal.finishRecordedReport(receipt.attempt, result);
    } else {
      await journal.requireMatchingReport(receipt.attempt, result);
    }
    journal.requireSettledAttempts();
  }
}
