import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile, rename, rmdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { sleep } from "bun";
import { z } from "zod";
import { boardTargetRecordSchema, boardTargetSchema } from "../board-target.ts";
import { durableJson, markerSchema, recoveryPlanSchema } from "../board-transaction.ts";
import { definedFields } from "../defined-fields.ts";
import type { JsonWriter } from "../files.ts";
import { atomicJson, journalSchema, sessionReportSchema } from "../journal.ts";
import type { RunnerOperations } from "../main.ts";
import { type ProcessGroupSystem, processGroupSystem } from "../process-group.ts";
import type { SessionHost } from "../session.ts";
import { stageReceiptSchema } from "../stage-receipt.ts";

export const faultKindSchema = z.enum([
  "terminal",
  "identity",
  "release",
  "cli-inspection",
  "observe",
  "output",
  "cleanup",
  "recovery-gate",
  "recovery-death",
  "post-stage-cli",
  "reader-setup",
  "reader-setup-locked",
  "target-config",
  "target-link",
  "target-directory",
  "target-cleaned",
  "target-gate",
]);
export type FaultKind = z.infer<typeof faultKindSchema>;
type Stage = z.infer<typeof stageReceiptSchema>;
type Marker = z.infer<typeof markerSchema>;

export class RunnerFaults {
  private readonly markers = new Map<string, Marker>();
  private readonly stages = new Map<string, Stage>();
  private readonly reports = new Set<string>();
  private readonly recoveryLocks = new Map<string, z.infer<typeof recoveryPlanSchema>>();
  private readonly recoveryTargets = new Map<
    string,
    { marker: Marker; audit: z.infer<typeof recoveryPlanSchema> }
  >();
  private afterStage = false;
  private stageObservation: unknown;
  readonly operations: RunnerOperations;

  constructor(
    private readonly directory: string,
    private readonly kind: FaultKind,
  ) {
    this.operations = {
      journalWriter: this.writer(atomicJson),
      stageWriter: this.writer(durableJson),
      board: {
        writeJson: this.writer(durableJson),
        remove: (path) => this.remove(path),
        removeDirectory: (path) => this.removeTargetDirectory(path),
        processSystem: this.boardSystem(),
      },
      session: { processSystem: this.stageSystem(), readers: this.readers() },
    };
  }

  private get hitPath(): string {
    return join(this.directory, `stage-fault-${this.kind}`);
  }
  private get hit(): boolean {
    return existsSync(this.hitPath);
  }
  private record(value: unknown): void {
    if (this.hit) return;

    writeFileSync(
      this.hitPath,
      JSON.stringify(
        { kind: this.kind, owner: process.pid, at: new Date().toISOString(), value },
        null,
        2,
      ),
    );
  }

  requireHit(): void {
    if (!this.hit) throw new Error(`requested ${this.kind} I/O condition was not reached`);
  }

  private writer(real: JsonWriter): JsonWriter {
    return async (path, value) => {
      const copied: unknown = JSON.parse(JSON.stringify(value));
      const stage = stageReceiptSchema.safeParse(copied);
      const journal = journalSchema.safeParse(copied);
      const identity =
        stage.success &&
        stage.data.identity &&
        !stage.data.reportPath &&
        this.stages.has(stage.data.token) &&
        this.markers.get(stage.data.token)?.owner.pid === stage.data.identity.ownerPid;
      const terminal =
        journal.success &&
        [...this.stages.values()].some(
          (entry) =>
            entry.run === journal.data.id &&
            this.reports.has(entry.attempt) &&
            journal.data.attempts.some(
              (attempt) =>
                attempt.id === entry.attempt &&
                attempt.reportPath === join(entry.journal, `${entry.attempt}.json`),
            ),
        );
      if (
        !this.hit &&
        ((this.kind === "identity" && identity) || (this.kind === "terminal" && terminal))
      ) {
        await this.obstruct(path, copied, real);
        return;
      }
      await real(path, value);
      const targetRecord = boardTargetRecordSchema.safeParse(copied);
      const recoveryTarget = this.recoveryTargets.get(path);
      if (
        !this.hit &&
        this.kind === "target-cleaned" &&
        targetRecord.success &&
        targetRecord.data.state === "cleaned" &&
        recoveryTarget?.marker.target?.token === targetRecord.data.token
      ) {
        await this.targetInterruption(path, recoveryTarget, "cleaned-write");
      }
      const marker = markerSchema.safeParse(copied);
      if (marker.success) this.markers.set(marker.data.token, marker.data);
      if (stage.success) this.stages.set(stage.data.token, stage.data);
      const report = sessionReportSchema.safeParse(copied);
      if (report.success) {
        for (const entry of this.stages.values()) {
          if (
            path === join(entry.journal, `${entry.attempt}.json`) &&
            report.data.logPath === entry.logPath
          )
            this.reports.add(entry.attempt);
        }
      }
      if (terminal) this.afterStage = true;
      const audit = recoveryPlanSchema.safeParse(copied);
      if (audit.success) {
        const original = markerSchema.parse(JSON.parse(audit.data.marker));
        this.markers.set(original.token, original);
        if (
          original.target &&
          original.run === audit.data.run &&
          original.token === audit.data.token
        ) {
          const record = boardTargetRecordSchema.parse(
            JSON.parse(await readFile(original.target.evidence, "utf8")),
          );
          if (
            !isDeepStrictEqual(boardTargetSchema.parse(record), original.target) ||
            record.board !== original.board
          )
            throw new Error("target fault requires matching original manifest/audit/record");
          this.recoveryTargets.set(original.target.evidence, {
            marker: original,
            audit: audit.data,
          });
        }
        for (const lock of audit.data.locks) this.recoveryLocks.set(lock.path, audit.data);
      }
    };
  }

  private async obstruct(path: string, value: unknown, real: JsonWriter): Promise<void> {
    const backup = `${path}.fault-${process.pid}.original`;
    const names = new Set(readdirSync(join(path, "..")));
    const original = { bytes: await readFile(path, "utf8"), identity: lstatSync(path) };
    await rename(path, backup);
    await mkdir(path);
    let failure: unknown;
    let restoredOriginal = false;
    try {
      await real(path, value);
    } catch (error) {
      failure = error;
      const partial = readdirSync(join(path, ".."))
        .filter((name) => !names.has(name) && join(path, "..", name) !== backup)
        .map((name) => {
          const target = join(path, "..", name);
          return { target, identity: lstatSync(target), bytes: readFileSync(target, "utf8") };
        });
      this.record({
        partial,
        operation: "json-replace",
        target: path,
        backup,
        original,
        attempted: value,
        error:
          error instanceof Error
            ? Object.assign(
                { name: error.name, message: error.message },
                definedFields({ code: "code" in error ? error.code : undefined }),
              )
            : String(error),
      });
    } finally {
      await rmdir(path);
      await rename(backup, path);
      const restored = lstatSync(path);
      writeFileSync(
        join(this.directory, `fault-restored-${this.kind}.json`),
        JSON.stringify({ target: path, bytes: await readFile(path, "utf8"), identity: restored }),
      );
      restoredOriginal =
        restored.dev === original.identity.dev &&
        restored.ino === original.identity.ino &&
        (await readFile(path, "utf8")) === original.bytes;
    }
    if (!restoredOriginal)
      throw new Error("fault obstruction did not restore original bytes/inode");
    if (!failure) throw new Error("JSON obstruction failed to cause a genuine writer error");
    throw failure;
  }

  private heldMarker(): { marker: Marker; path: string; bytes: string } | undefined {
    for (const marker of this.markers.values()) {
      const path = join(marker.board, ".locks", `task-${marker.card.toLowerCase()}`);
      if (!existsSync(path)) continue;
      const parsed = markerSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
      if (parsed.success && parsed.data.token === marker.token)
        return { marker, path, bytes: readFileSync(path, "utf8") };
    }
    return undefined;
  }

  private async targetInterruption(
    path: string,
    proof: { marker: Marker; audit: z.infer<typeof recoveryPlanSchema> },
    operation: string,
  ): Promise<never> {
    try {
      await readFile(join(this.directory, "absent-target-io-condition"), "utf8");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;

      this.record({
        operation,
        target: path,
        ...proof,
        effectCompleted: true,
        error: { name: error.name, message: error.message, code: error.code },
      });
      throw error;
    }
    throw new Error("target I/O interruption failed to reach a genuine error");
  }

  private async removeTargetDirectory(path: string): Promise<void> {
    await rmdir(path);
    const proof = [...this.recoveryTargets.values()].find(
      (entry) => entry.marker.target?.view === path,
    );
    if (!this.hit && this.kind === "target-directory" && proof)
      await this.targetInterruption(path, proof, "rmdir");
  }

  private async remove(path: string): Promise<void> {
    const proof = [...this.recoveryTargets.values()].find((entry) => {
      const view = entry.marker.target?.view;
      return view && (path === join(view, "backlog.config.yml") || path === join(view, "backlog"));
    });
    if (
      proof &&
      !this.hit &&
      this.kind === "target-gate" &&
      path === join(proof.marker.target?.view ?? "", "backlog.config.yml")
    ) {
      this.record({
        operation: "bounded-target-removal-gate",
        target: path,
        ...proof,
        identity: lstatSync(path),
      });
      writeFileSync(join(this.directory, "target-gate.ready"), String(process.pid));
      const deadline = performance.now() + 10_000;
      while (!existsSync(join(this.directory, "target-gate.release"))) {
        if (performance.now() > deadline) throw new Error("fixture target gate deadline");
        await sleep(10);
      }
    }
    const held = this.heldMarker();
    const stage = held ? this.stages.get(held.marker.token) : undefined;
    if (
      held?.path === path &&
      stage &&
      (stage.identity || (stage.reportPath && this.reports.has(stage.attempt)))
    ) {
      if (this.kind === "observe")
        writeFileSync(
          join(this.directory, "stage-handoff.json"),
          JSON.stringify({ marker: held.marker, receipt: stage }),
        );
      if (this.kind === "release" && !this.hit) {
        this.record({
          operation: "remove",
          target: path,
          marker: held.marker,
          stage,
          bytes: held.bytes,
          identity: lstatSync(path),
        });
        throw new Error("injected native-marker release failure");
      }
    }
    const audit = this.recoveryLocks.get(path);
    if (audit) {
      const saved = audit.locks.find((entry) => entry.path === path);
      if (
        this.kind === "recovery-death" &&
        held &&
        path === join(held.marker.journal, "..", "lock")
      ) {
        this.record({ operation: "SIGKILL", target: path, saved, audit });
        writeFileSync(
          join(this.directory, "recovery-death.json"),
          JSON.stringify({ pid: process.pid, target: path }),
        );
        process.kill(process.pid, "SIGKILL");
        await new Promise<void>(() => {});
      }
      if (
        this.kind === "recovery-gate" &&
        !this.hit &&
        held &&
        path === join(held.marker.journal, "..", "lock")
      ) {
        this.record({ operation: "bounded-removal-gate", target: path, saved, audit });
        writeFileSync(join(this.directory, "recovery-gate.ready"), String(process.pid));
        const deadline = performance.now() + 5000;
        while (!existsSync(join(this.directory, "recovery-gate.release"))) {
          if (performance.now() > deadline) throw new Error("fixture recovery gate deadline");
          await sleep(10);
        }
      }
      if (
        this.kind === "cleanup" &&
        !this.hit &&
        held &&
        path === join(held.marker.board, ".iterate", `${held.marker.card}.lock`)
      ) {
        this.record({
          operation: "remove",
          target: path,
          saved,
          audit,
          bytes: readFileSync(path, "utf8"),
          identity: lstatSync(path),
        });
        throw new Error("injected recovery execution-lock cleanup interruption");
      }
    }
    await unlink(path);
    if (
      !this.hit &&
      proof &&
      ((this.kind === "target-config" &&
        path === join(proof.marker.target?.view ?? "", "backlog.config.yml")) ||
        (this.kind === "target-link" && path === join(proof.marker.target?.view ?? "", "backlog")))
    )
      await this.targetInterruption(path, proof, "unlink");
  }

  private boardSystem(): ProcessGroupSystem {
    return {
      ...processGroupSystem,
      snapshot: () => {
        if (
          (this.kind === "cli-inspection" && this.heldMarker()) ||
          (this.kind === "post-stage-cli" && this.afterStage)
        ) {
          this.record({
            operation: "process-observation-refusal",
            marker: this.heldMarker(),
            independent: this.ps(),
          });
          throw new Error("injected process inspection refusal");
        }
        return processGroupSystem.snapshot();
      },
    };
  }

  private ps() {
    const argv = ["-axo", "pid=,ppid=,pgid=,uid=,lstart=,stat="];
    const result = spawnSync("/bin/ps", argv, {
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
      timeout: 500,
    });
    return {
      argv: ["/bin/ps", ...argv],
      envChanges: { LC_ALL: "C" },
      stdout: result.stdout,
      stderr: result.stderr,
      exit: result.status,
    };
  }

  private stageSystem(): ProcessGroupSystem {
    return {
      ...processGroupSystem,
      snapshot: () => {
        const held = this.heldMarker();
        const table = processGroupSystem.snapshot();
        if (
          held &&
          this.stages.has(held.marker.token) &&
          !this.hit &&
          (this.kind === "observe" ||
            this.kind === "reader-setup" ||
            this.kind === "reader-setup-locked")
        ) {
          const independent = this.ps();
          const observation = {
            markerBeforeInspection: held.bytes,
            markerAfterInspection: readFileSync(held.path, "utf8"),
            snapshot: execFileSync("/bin/ps", ["-axo", "pid=,ppid=,pgid=,uid=,lstart=,stat="], {
              encoding: "utf8",
              env: { ...process.env, LC_ALL: "C" },
              timeout: 500,
            }),
            table,
            independent,
          };
          this.stageObservation = observation;
          writeFileSync(join(this.directory, "stage-created.json"), JSON.stringify(observation));
          if (this.kind === "observe")
            this.record({ operation: "real-stage-observation", ...observation });
        }
        return table;
      },
    };
  }

  private readers(): NonNullable<SessionHost["readers"]> {
    return ({ stdout, stderr }) => {
      if ((this.kind === "reader-setup" || this.kind === "reader-setup-locked") && !this.hit) {
        if (this.kind === "reader-setup-locked") stdout.getReader();
        this.record({
          operation: "reader-acquisition-refusal",
          observation: this.stageObservation,
          stdoutLocked: stdout.locked,
        });
        throw new Error("injected output reader acquisition failure");
      }
      const out = stdout.getReader();
      const err = stderr.getReader();
      return {
        stdout: {
          read: () => out.read(),
          cancel: async () => {
            if (this.kind === "output" && !this.hit) {
              this.record({ operation: "actual-reader-cancellation-refusal" });
              throw new Error("injected native reader cancellation refusal");
            }
            await out.cancel();
          },
        },
        stderr: err,
      };
    };
  }
}
