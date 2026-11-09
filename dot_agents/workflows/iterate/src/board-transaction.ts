import { AsyncLocalStorage } from "node:async_hooks";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  stat,
  unlink,
} from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { which } from "bun";
import { z } from "zod";
import { BoardTarget, boardTargetSchema, discoverBoard } from "./board-target.ts";
import { definedFields } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import {
  atomicJson as durableJson,
  type FileRemoval,
  type JsonWriter,
  readOptionalFile,
} from "./files.ts";
import {
  OwnedProcessGroup,
  type ProcessGroupSystem,
  processGroupIdentitySchema,
} from "./process-group.ts";

export type BoardOperations = {
  readonly target?: BoardTarget;
  readonly writeJson?: JsonWriter;
  readonly remove?: FileRemoval;
  readonly removeDirectory?: FileRemoval;
  readonly processSystem?: ProcessGroupSystem;
};

export type ExclusionRetention = { retained: boolean };

const executionCommands = new AsyncLocalStorage<{ gate?: NativeGate; execution?: Execution }>();

export function withBoardCommandContext<T>(operation: () => Promise<T>): Promise<T> {
  return executionCommands.run({}, operation);
}

const deadlineMs = 5000;
const ownerSchema = z
  .object({ host: z.string(), pid: z.number().int().positive(), user: z.number().int() })
  .readonly();
const backendSchema = z
  .object({ executable: z.string(), version: z.literal("1.50.1"), sha256: z.string() })
  .readonly();
export const lockSnapshotSchema = z.object({
  path: z.string(),
  bytes: z.string(),
  dev: z.number(),
  ino: z.number(),
});
const executionSchema = z
  .object({
    schemaVersion: z.literal(1),
    root: z.uuid(),
    board: z.string(),
    card: z.string(),
    run: z.uuid(),
    journal: z.string(),
    owner: ownerSchema,
    locks: z.array(lockSnapshotSchema),
    tokens: z.array(z.uuid()).min(1),
    current: z.uuid(),
  })
  .refine(
    (value) =>
      value.tokens[0] === value.root &&
      value.tokens.at(-1) === value.current &&
      new Set(value.tokens).size === value.tokens.length,
  );
type Execution = z.infer<typeof executionSchema>;

export const markerSchema = z
  .object({
    schemaVersion: z.literal(1),
    token: z.uuid(),
    board: z.string(),
    card: z.string(),
    run: z.uuid(),
    journal: z.string(),
    owner: ownerSchema,
    intent: z.string(),
    backend: backendSchema,
    locks: z.array(lockSnapshotSchema).optional(),
    execution: z.uuid().optional(),
    target: boardTargetSchema.optional(),
  })
  .readonly();
type Marker = z.infer<typeof markerSchema>;

export class BoardCommandFailure extends Exit {
  constructor(
    message: string,
    readonly unsettled = false,
  ) {
    super(1, message);
  }
}

export { atomicJson as durableJson } from "./files.ts";

function exists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;

    throw error;
  }
}

const pause = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

export async function backlogCommand(
  args: readonly string[],
  gate?: NativeGate,
  edit = false,
  selectedExecutable?: string,
  operations: BoardOperations = {},
): Promise<string> {
  gate ??= executionCommands.getStore()?.gate;
  operations = gate?.operations ?? operations;
  const writeJson = operations.writeJson ?? durableJson;
  const target = operations.target;
  await target?.validate();
  const executable = selectedExecutable ?? gate?.marker.backend.executable ?? which("backlog");
  if (!executable) throw new Exit(1, "backlog executable is unavailable");

  if (
    edit &&
    !(
      gate &&
      target &&
      !gate.released &&
      args[0] === "task" &&
      args[1] === "edit" &&
      args[2] === gate.marker.card &&
      target.board === gate.marker.board &&
      gate.marker.target?.token === target.evidence.token
    )
  )
    throw new Exit(1, "native lock delegation requires the same-card transaction");

  const root = gate
    ? dirname(gate.marker.intent)
    : target
      ? dirname(target.view)
      : (process.env.TMPDIR ?? "/tmp");
  const prefix = join(root, `backlog-${randomUUID()}`);
  const receipt = `${prefix}.json`;
  const commandTarget = target
    ? {
        target: target.evidence,
        environment: { BACKLOG_CWD: target.view, USE_GLOBAL_TASK_ID_LOCK: edit ? "false" : null },
        cwd: process.cwd(),
      }
    : {};
  if (gate || target)
    await writeJson(receipt, {
      state: "launching",
      marker: gate?.marker.token,
      executable,
      args,
      ...commandTarget,
    });

  const env = { ...process.env };
  delete env.USE_GLOBAL_TASK_ID_LOCK;
  if (target) env.BACKLOG_CWD = target.view;
  if (edit) env.USE_GLOBAL_TASK_ID_LOCK = "false";

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  process.on("SIGTERM", cancel);
  process.on("SIGINT", cancel);
  let group: OwnedProcessGroup | undefined;
  const started = performance.now();
  try {
    let child: ReturnType<typeof spawn> | undefined;
    let code: number | null = null;
    let failure: Error | undefined;
    let exited = false;
    let timedOut = false;
    try {
      const out = openSync(`${prefix}.stdout`, "wx", 0o600);
      try {
        const err = openSync(`${prefix}.stderr`, "wx", 0o600);
        try {
          child = spawn(executable, [...args], {
            detached: true,
            env,
            stdio: ["ignore", out, err],
          });
          if (gate) gate.uncertain = true;

          child.once("error", (error) => {
            failure = error;
            exited = true;
          });
          child.once("exit", (value) => {
            code = value;
            exited = true;
          });
          if (child.pid !== undefined)
            group = new OwnedProcessGroup(child.pid, operations.processSystem);
        } finally {
          closeSync(err);
        }
      } finally {
        closeSync(out);
      }
      if (gate || target)
        await writeJson(receipt, {
          state: "running",
          marker: gate?.marker.token,
          ...commandTarget,
          executable,
          args,
          pid: child.pid,
          group: child.pid,
          identity: group?.identity(),
        });
      while (!(exited || cancelled) && performance.now() - started < deadlineMs) await pause(10);
      timedOut = performance.now() - started >= deadlineMs;
    } catch (error) {
      if (!child) throw error;

      failure = error instanceof Error ? error : new Error(String(error));
    }

    if (!child) throw new Exit(1, "Backlog command has no started child");

    let settlement = await group?.settle();
    if (group && (timedOut || cancelled || failure || settlement?.state !== "settled"))
      settlement = await group.cancel();

    const unsettled = settlement?.state !== "settled" && child.pid !== undefined;
    if (gate || target) {
      try {
        await writeJson(receipt, {
          state: unsettled ? "uncertain" : "settled",
          marker: gate?.marker.token,
          ...commandTarget,
          executable,
          args,
          pid: child.pid,
          group: child.pid,
          identity: group?.identity(),
          settlement,
          code,
          timedOut,
          cancelled,
          failure: failure?.message,
        });
        if (gate) gate.uncertain = unsettled;
      } catch (error) {
        throw new BoardCommandFailure(
          `cannot persist child settlement at ${receipt}: ${error instanceof Error ? error.message : String(error)}`,
          true,
        );
      }
    }
    const stdout = await readFile(`${prefix}.stdout`, "utf8");
    const stderr = await readFile(`${prefix}.stderr`, "utf8");
    if (!(gate || target || unsettled))
      await Promise.all([unlink(`${prefix}.stdout`), unlink(`${prefix}.stderr`)]);
    if (unsettled || timedOut || cancelled || failure || code !== 0)
      throw new BoardCommandFailure(
        `backlog ${args.slice(0, 3).join(" ")} failed${timedOut ? " (deadline exceeded)" : cancelled ? " (cancelled)" : ""}: ${`${stdout}${stderr}`.trim() || failure?.message || `exit ${code}`}; evidence ${receipt}`,
        unsettled,
      );

    return stdout;
  } catch (error) {
    if (group) {
      const settlement = await group.cancel();
      if (settlement.state !== "settled") {
        if (gate) gate.uncertain = true;
        throw new BoardCommandFailure(
          `CLI settlement remains uncertain at ${receipt}: ${error instanceof Error ? error.message : String(error)}`,
          true,
        );
      }
    }
    throw error;
  } finally {
    process.off("SIGTERM", cancel);
    process.off("SIGINT", cancel);
  }
}

export async function canonicalBoard(): Promise<string> {
  return (await discoverBoard()).board;
}

export async function snapshotExecutionLock(
  path: string,
): Promise<z.infer<typeof lockSnapshotSchema>> {
  const identity = await lstat(path);
  if (!identity.isFile()) throw new Exit(1, `execution lock is not a regular file at ${path}`);

  return { path, bytes: await readFile(path, "utf8"), dev: identity.dev, ino: identity.ino };
}

export class NativeGate {
  uncertain = false;
  released = false;
  async release(): Promise<void> {
    if (this.released) return;

    try {
      await releaseNativeGate(this);
    } catch (error) {
      await this.operations.target?.retain();
      throw error;
    }
    this.released = true;
  }
  constructor(
    readonly marker: Marker,
    readonly path: string,
    readonly operations: BoardOperations = {},
  ) {}
  edit(args: readonly string[]): Promise<string> {
    return backlogCommand(["task", "edit", this.marker.card, ...args], this, true);
  }
}

export async function withNativeGate<T>(
  input: {
    readonly board: string;
    readonly card: string;
    readonly run: string;
    readonly journal: string;
  },
  operation: (gate: NativeGate) => Promise<T>,
  operations: BoardOperations = {},
): Promise<T> {
  await operations.target?.validate();
  if (operations.target && operations.target.board !== input.board)
    throw new Exit(1, "native gate board differs from its recorded target");
  const executable = which("backlog");
  if (!executable) throw new Exit(1, "backlog executable is unavailable");

  const actual = await realpath(executable);
  if (!(await stat(actual)).isFile())
    throw new Exit(1, `backlog executable is not a regular file: ${actual}`);

  const writeJson = operations.writeJson ?? durableJson;
  const version = (
    await backlogCommand(["--version"], undefined, false, actual, operations)
  ).trim();
  if (version !== "1.50.1")
    throw new Exit(
      1,
      `unsupported Backlog native lock protocol ${version}; only observed 1.50.1 is supported`,
    );

  const sha256 = createHash("sha256")
    .update(await readFile(actual))
    .digest("hex");
  const token = randomUUID();
  const context = executionCommands.getStore();
  const rootToken = context?.execution?.root ?? token;
  const directory = join(input.board, ".iterate", "transactions");
  const intent = join(directory, `${input.card}.${token}.json`);
  const required: Omit<Marker, "target"> = {
    schemaVersion: 1,
    token,
    execution: rootToken,
    ...input,
    owner: { host: hostname(), pid: process.pid, user: process.getuid?.() ?? 0 },
    intent,
    backend: { executable: actual, version, sha256 },
    locks: await Promise.all([
      snapshotExecutionLock(join(input.board, ".iterate", `${input.card}.lock`)),
      snapshotExecutionLock(join(input.journal, "..", "lock")),
    ]),
  };
  const marker: Marker = Object.assign(
    required,
    definedFields({ target: operations.target?.evidence }),
  );
  const path = join(input.board, ".locks", `task-${input.card.toLowerCase()}`);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeJson(intent, marker);
  try {
    await link(intent, path);
  } catch (error) {
    throw new Exit(
      1,
      `native board transaction is locked at ${path}; no existing marker is removed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const lockDirectory = await open(dirname(path), "r");
  try {
    await lockDirectory.sync();
  } finally {
    await lockDirectory.close();
  }
  const gate = new NativeGate(marker, path, operations);
  try {
    if (
      context?.execution &&
      JSON.stringify(context.execution.locks) !== JSON.stringify(marker.locks)
    )
      throw new Exit(1, "execution lock identities changed during native admission");

    const execution = executionSchema.parse({
      schemaVersion: 1,
      root: rootToken,
      ...input,
      owner: marker.owner,
      locks: marker.locks,
      tokens: [...(context?.execution?.tokens ?? []), token],
      current: token,
    });
    await writeJson(join(directory, `${input.card}.${rootToken}.execution.json`), execution);
    if (context) {
      context.gate = gate;
      context.execution = execution;
    }

    return await operation(gate);
  } catch (error) {
    if (gate.uncertain && !(error instanceof BoardCommandFailure))
      throw new BoardCommandFailure(
        `native transaction ${intent} retains uncertain children: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );

    if (!(error instanceof Exit))
      throw new Exit(
        1,
        `native transaction ${intent} failed: ${error instanceof Error ? error.message : String(error)}; retain its pending evidence`,
      );

    throw error;
  } finally {
    if (gate.uncertain && !gate.released) await operations.target?.retain();
    if (!(gate.uncertain || gate.released)) await gate.release();
  }
}

async function releaseNativeGate(gate: NativeGate): Promise<void> {
  const [held, owned] = await Promise.all([lstat(gate.path), lstat(gate.marker.intent)]);
  if (!(held.isFile() && held.dev === owned.dev && held.ino === owned.ino))
    throw new Exit(1, `native marker identity changed at ${gate.path}; retained for inspection`);

  await (gate.operations.remove ?? unlink)(gate.path);
}

const childReceiptSchema = z
  .object({
    state: z.enum(["launching", "running", "settled", "uncertain"]),
    marker: z.uuid(),
    args: z.array(z.string()),
    pid: z.number().int().optional(),
    group: z.number().int().optional(),
    identity: processGroupIdentitySchema.optional(),
  })
  .passthrough();

export const recoveryPlanSchema = z
  .object({
    at: z.iso.datetime(),
    locks: z.array(lockSnapshotSchema),
    run: z.uuid(),
    token: z.uuid(),
    evidence: z.string(),
    marker: z.string(),
    execution: z.string().optional(),
    journalLock: z.string().optional(),
    children: z.array(z.object({ path: z.string(), raw: z.string() })),
    inspection: z.object({ ownerExited: z.literal(true) }),
  })
  .passthrough();

export async function recoverNativeGate(input: {
  readonly board: string;
  readonly card: string;
  readonly run: string;
  readonly journal: string;
  readonly token: string;
  readonly evidence: string;
  readonly journalLock: string;
  readonly reconcile: (tokens: readonly string[]) => Promise<void>;
  readonly operations?: BoardOperations;
}): Promise<void> {
  const { board, card, token, run, journal, evidence } = input;
  const writeJson = input.operations?.writeJson ?? durableJson;
  const remove = input.operations?.remove ?? unlink;
  const intent = join(board, ".iterate", "transactions", `${card}.${token}.json`);
  const raw = await readOptionalFile({ path: intent, description: "original transaction intent" });
  if (!raw) throw new Exit(1, "typed recovery run/intent has no original durable intent");

  const marker = markerSchema.parse(JSON.parse(raw.toString()));
  if (
    !(
      marker.board === board &&
      marker.card === card &&
      marker.token === token &&
      marker.run === run &&
      marker.journal === journal &&
      marker.intent === intent
    )
  )
    throw new Exit(1, "typed recovery run/intent does not match the retained native marker");

  if (
    !(marker.owner.host === hostname() && marker.owner.user === (process.getuid?.() ?? 0)) ||
    exists(marker.owner.pid)
  )
    throw new Exit(1, "the retained marker owner is not an inspected exited local process");

  if (!marker.locks || marker.locks.length !== 2)
    throw new Exit(
      1,
      "original execution-lock byte/inode proof is missing from this intent; retain exclusion",
    );

  const executable = which("backlog");
  if (!executable)
    throw new Exit(1, "recovery backend executable proof is missing; retain exclusion");

  const actual = await realpath(executable);
  if (
    !(await stat(actual)).isFile() ||
    actual !== marker.backend.executable ||
    createHash("sha256")
      .update(await readFile(actual))
      .digest("hex") !== marker.backend.sha256
  )
    throw new Exit(
      1,
      "recovery backend differs from the originally observed 1.50.1 executable; retain exclusion",
    );

  if (!marker.execution)
    throw new Exit(1, "original execution intent linkage is missing; retain exclusion");

  const executionPath = join(dirname(intent), `${card}.${marker.execution}.execution.json`);
  const executionRaw = await readFile(executionPath, "utf8");
  const execution = executionSchema.parse(JSON.parse(executionRaw));
  if (execution.current !== token)
    throw new Exit(
      1,
      "typed recovery intent is not this execution's current intent; retain exclusion",
    );

  if (
    !(
      execution.root === marker.execution &&
      execution.board === board &&
      execution.card === card &&
      execution.run === run &&
      execution.journal === journal &&
      JSON.stringify(execution.owner) === JSON.stringify(marker.owner) &&
      JSON.stringify(execution.locks) === JSON.stringify(marker.locks)
    )
  )
    throw new Exit(1, "execution intent linkage conflicts with the original owner or locks");

  const guard = `${intent}.recovery-lock`;
  const guardHandle = await open(guard, "wx", 0o600).catch((error: unknown) => {
    if (error instanceof Exit) throw error;

    if (!(error instanceof Error && "code" in error && error.code === "EEXIST"))
      throw new Exit(
        1,
        `creating recovery guard at ${guard} failed: ${error instanceof Error ? error.message : String(error)}`,
      );

    throw new Exit(
      1,
      `recovery is already locked at ${guard}; exact guard settlement/unlock proof is missing; no existing guard is removed`,
    );
  });
  const guardBytes = JSON.stringify({
    schemaVersion: 1,
    run,
    token,
    nonce: randomUUID(),
    owner: { host: hostname(), pid: process.pid, user: process.getuid?.() ?? 0 },
  });
  await guardHandle.writeFile(guardBytes);
  await guardHandle.sync();
  const guardIdentity = await guardHandle.stat();
  const markerPath = join(board, ".locks", `task-${card.toLowerCase()}`);
  let acquired = false;
  let failure: unknown;
  let guardChanged = false;
  try {
    const held = await readOptionalFile({
      path: markerPath,
      description: "native transaction marker",
    });
    if (!held) {
      await link(intent, markerPath);
      acquired = true;
    }
    const [nativeIdentity, original] = await Promise.all([lstat(markerPath), lstat(intent)]);
    if (
      !(
        nativeIdentity.isFile() &&
        nativeIdentity.dev === original.dev &&
        nativeIdentity.ino === original.ino &&
        (await readFile(markerPath)).equals(raw)
      )
    )
      throw new Exit(1, "native marker is not the original durable intent hardlink");

    const children: unknown[] = [];
    for (const name of await readdir(dirname(intent))) {
      if (!(name.startsWith("backlog-") && name.endsWith(".json"))) continue;

      const path = join(dirname(intent), name);
      const bytes = await readFile(path, "utf8");
      const value: unknown = JSON.parse(bytes);
      const { marker: receiptToken } = z.object({ marker: z.uuid() }).parse(value);
      if (!execution.tokens.includes(receiptToken)) continue;

      const receipt = childReceiptSchema.parse(value);

      children.push({ path, raw: bytes });
      if (
        receipt.state !== "settled" ||
        (receipt.pid !== undefined &&
          (!receipt.identity ||
            (
              await OwnedProcessGroup.restore(
                receipt.identity,
                input.operations?.processSystem,
              ).settle()
            ).state !== "settled"))
      )
        throw new Exit(
          1,
          `child lifecycle remains uncertain at ${path}; typed evidence cannot waive this exclusion`,
        );
    }
    const boardExecutionPath = join(board, ".iterate", `${card}.lock`);
    const lockPaths = [input.journalLock, boardExecutionPath];
    const audit = `${intent}.recovery-${token}.json`;
    const priorBytes = await readOptionalFile({ path: audit, description: "recovery audit" });
    let locks: z.infer<typeof lockSnapshotSchema>[] = [];
    if (priorBytes) {
      const prior = recoveryPlanSchema.parse(JSON.parse(priorBytes.toString()));
      if (prior.run !== run || prior.token !== token || prior.marker !== raw.toString())
        throw new Exit(1, "recovery audit conflicts with original intent");

      locks = prior.locks;
    } else {
      if (!marker.locks)
        throw new Exit(
          1,
          "original execution-lock byte/inode proof is missing from this intent; retain exclusion",
        );

      locks = marker.locks;
      const stageRaw = await readOptionalFile({
        path: `${intent}.stage.json`,
        description: "stage lock evidence",
      });
      if (stageRaw) {
        const stageLocks = z
          .object({ locks: z.array(lockSnapshotSchema) })
          .parse(JSON.parse(stageRaw.toString())).locks;
        if (JSON.stringify(stageLocks) !== JSON.stringify(locks))
          throw new Exit(
            1,
            "stage execution-lock evidence changed from its original native intent",
          );
      }
    }
    if (JSON.stringify(locks) !== JSON.stringify(marker.locks))
      throw new Exit(1, "recovery execution-lock evidence conflicts with its original intent");

    if (
      locks.some((lock) => !lockPaths.includes(lock.path)) ||
      new Set(locks.map((lock) => lock.path)).size !== locks.length
    )
      throw new Exit(1, "recovery execution lock paths conflict");

    for (const path of lockPaths) {
      const current = await readOptionalFile({ path, description: "execution lock" });
      const saved = locks.find((lock) => lock.path === path);
      if (!current) {
        if (saved && !priorBytes)
          throw new Exit(1, `original execution lock is missing at ${path}`);

        continue;
      }

      const identity = await lstat(path);
      if (
        !(
          saved &&
          identity.isFile() &&
          identity.dev === saved.dev &&
          identity.ino === saved.ino &&
          current.toString() === saved.bytes
        )
      )
        throw new Exit(1, `recovery lock changed at ${path}`);

      if (path === input.journalLock) {
        if (current.toString() !== String(marker.owner.pid))
          throw new Exit(1, "journal execution lock belongs to a different owner");
      } else {
        const owner = ownerSchema.parse(JSON.parse(current.toString()));
        if (
          !(
            owner.pid === marker.owner.pid &&
            owner.host === marker.owner.host &&
            owner.user === marker.owner.user
          )
        )
          throw new Exit(1, "board execution lock belongs to a different owner");
      }
    }
    if ((await readFile(executionPath, "utf8")) !== executionRaw)
      throw new Exit(1, "execution intent linkage changed during recovery");

    await input.reconcile(execution.tokens);

    if (!priorBytes)
      await writeJson(audit, {
        at: new Date().toISOString(),
        run,
        token,
        evidence,
        marker: raw.toString(),
        locks,
        execution: locks.find((lock) => lock.path === boardExecutionPath)?.bytes,
        journalLock: locks.find((lock) => lock.path === input.journalLock)?.bytes,
        children,
        inspection: { ownerExited: true },
      });
    const completionPath = `${audit}.completed.json`;
    const completionBytes = await readOptionalFile({
      path: completionPath,
      description: "original recovery completion receipt",
    });
    if (completionBytes) {
      const completion = z
        .object({ at: z.iso.datetime(), run: z.uuid(), token: z.uuid() })
        .parse(JSON.parse(completionBytes.toString()));
      if (completion.run !== run || completion.token !== token)
        throw new Exit(1, "original recovery completion receipt conflicts with this intent");
    }
    if (!marker.target || marker.target.board !== board)
      throw new Exit(
        1,
        "original Backlog target manifest is missing or conflicts; retain exclusion",
      );

    await BoardTarget.finalize(marker.target, writeJson, remove, input.operations?.removeDirectory);
    if (!completionBytes)
      await writeJson(completionPath, { at: new Date().toISOString(), run, token });
    for (const saved of locks) {
      const current = await readOptionalFile({ path: saved.path, description: "execution lock" });
      if (!current) continue;

      const identity = await lstat(saved.path);
      if (
        !(
          identity.dev === saved.dev &&
          identity.ino === saved.ino &&
          current.toString() === saved.bytes
        )
      )
        throw new Exit(1, `recovery lock changed at ${saved.path}`);

      await remove(saved.path);
    }
    const current = await lstat(markerPath);
    if (
      !(
        current.dev === original.dev &&
        current.ino === original.ino &&
        (await readFile(markerPath)).equals(raw)
      )
    )
      throw new Exit(1, "native marker changed during recovery");

    await remove(markerPath);
    acquired = false;
  } catch (error) {
    failure = error;
    if (acquired) {
      const [held, owned] = await Promise.all([lstat(markerPath), lstat(intent)]);
      if (held.dev === owned.dev && held.ino === owned.ino) await remove(markerPath);
    }
  } finally {
    await guardHandle.close();
    const held = await lstat(guard);
    guardChanged =
      held.dev !== guardIdentity.dev ||
      held.ino !== guardIdentity.ino ||
      (await readFile(guard, "utf8")) !== guardBytes;
    if (!guardChanged) await remove(guard);
  }
  if (guardChanged)
    throw new Exit(
      1,
      `recovery guard changed at ${guard}; retain its exact ownership evidence; ${failure instanceof Error ? failure.message : ""}`,
    );

  if (failure) throw failure;
}
