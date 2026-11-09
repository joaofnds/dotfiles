import { existsSync } from "node:fs";
import { lstat, mkdir, unlink, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { z } from "zod";
import { type Card, card, setAssignee, setStatus, tool } from "./board.ts";
import {
  BoardCommandFailure,
  type BoardOperations,
  canonicalBoard,
  durableJson,
  type ExclusionRetention,
  type NativeGate,
  withBoardCommandContext,
  withNativeGate,
} from "./board-transaction.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import { readOptionalFile } from "./files.ts";
import type { Journal } from "./journal.ts";
import { stopFile, treeIsClean } from "./tree.ts";

export const claimSchema = z
  .object({
    schemaVersion: z.literal(1),
    board: z.string(),
    card: z.string(),
    run: z.uuid(),
    journal: z.string(),
    assignee: z.string(),
    owner: z.object({ host: z.string(), pid: z.number().int(), user: z.number().int() }).readonly(),
    acquiredAt: z.iso.datetime(),
    recovery: z.string().min(1).optional(),
    releasedAt: z.iso.datetime().optional(),
  })
  .readonly();
export type Claim = z.infer<typeof claimSchema>;

export { canonicalBoard } from "./board-transaction.ts";

export async function withBoardLock<T>(
  id: string,
  operation: (board: string) => Promise<T>,
  retention?: ExclusionRetention,
  selectedBoard?: string,
): Promise<T> {
  const board = selectedBoard ?? (await canonicalBoard());
  const directory = join(board, ".iterate");
  const path = join(directory, `${id}.lock`);

  await tool(
    () => mkdir(directory, { recursive: true, mode: 0o700 }),
    `preparing board execution storage at ${directory} failed`,
  );
  try {
    await writeFile(
      path,
      JSON.stringify({ host: hostname(), pid: process.pid, user: process.getuid?.() ?? 0 }),
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if (error instanceof Exit) throw error;

    if (!(error instanceof Error && "code" in error && error.code === "EEXIST"))
      throw new Exit(
        1,
        `creating board execution lock at ${path} failed: ${error instanceof Error ? error.message : String(error)}`,
      );

    throw new Exit(
      1,
      `board execution is locked at ${path}; inspect its owner and children before typed recovery`,
    );
  }

  const owned = await lstat(path);
  let settled = true;
  try {
    return await withBoardCommandContext(() => operation(board));
  } catch (error) {
    if (error instanceof BoardCommandFailure && error.unsettled) settled = false;
    throw error;
  } finally {
    if (settled && !retention?.retained) {
      const held = await lstat(path);
      if (held.dev === owned.dev && held.ino === owned.ino) await unlink(path);
    }
  }
}

export async function readClaim({
  board,
  id,
}: {
  readonly board: string;
  readonly id: string;
}): Promise<Claim | undefined> {
  const path = join(board, ".iterate", `${id}.json`);

  const raw = await readOptionalFile({ path, description: "board claim" });
  if (!raw) return undefined;

  let value: unknown;
  try {
    value = JSON.parse(raw.toString());
  } catch {
    throw new Exit(1, `invalid board claim ${path}; inspect it without transferring ownership`);
  }

  const parsed = claimSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.board !== board ||
    parsed.data.card !== id ||
    parsed.data.assignee !== `@iterate-${parsed.data.run}`
  )
    throw new Exit(1, `invalid board claim ${path}; inspect it without transferring ownership`);

  return parsed.data;
}

export function matchingClaim(claim: Claim | undefined, journal: Journal | undefined): boolean {
  if (!(claim && journal) || claim.releasedAt) return false;

  return (
    claim.run === journal.record.id &&
    claim.journal === journal.directory &&
    JSON.stringify(claim) === JSON.stringify(journal.record.runClaim)
  );
}

export function requireOwnership({
  before,
  claim,
  journal,
  recovery,
}: {
  readonly before: Card;
  readonly claim: Claim | undefined;
  readonly journal: Journal | undefined;
  readonly recovery: string | undefined;
}): void {
  if (
    matchingClaim(claim, journal) &&
    before.assignees.length === 1 &&
    before.assignees[0] === claim?.assignee
  )
    return;

  if (claim && !claim.releasedAt)
    throw new Exit(
      1,
      `${claim.card} has an active run claim at ${claim.journal}; matching journal and assignee are required`,
    );

  if (
    before.status === "Done" &&
    before.assignees.length === 0 &&
    !recovery &&
    claim?.releasedAt &&
    journal?.record.runClaim?.releasedAt &&
    claim.run === journal.record.id &&
    claim.journal === journal.directory &&
    same(claim, journal.record.runClaim)
  )
    return;

  if (journal?.record.runClaim && !journal.record.completed)
    throw new Exit(
      1,
      "the journal claim has no matching active board claim; inspect recovery evidence",
    );

  if (journal && !journal.record.completed && !journal.record.runClaim) {
    if (
      journal.record.ownershipInitiated &&
      journal.record.attempts.length === 0 &&
      before.assignees.length === 0
    )
      return;

    if (recovery && before.assignees.length === 1 && before.assignees[0] === "@claude") return;

    throw new Exit(
      1,
      "legacy ownership requires separately typed --adopt-legacy-claim recovery evidence; selection or mode changes do not adopt ownership",
    );
  }

  if (before.assignee) throw new Exit(1, `card is held in ${before.status} by ${before.assignee}`);

  if (recovery)
    throw new Exit(
      1,
      "legacy adoption requires an existing legacy journal and the exact @claude assignee",
    );
}

export async function requireCheckedRequirements({
  id,
  card,
  journal,
}: {
  readonly id: string;
  readonly card: Card;
  readonly journal: Journal;
}): Promise<void> {
  if (
    card.uncheckedRequirements > 0 &&
    !card.labels.some((label) => label === "partial" || label === "abandoned")
  ) {
    journal.record.completed = false;
    await journal.save();

    throw new Exit(
      1,
      `${id} has ${card.uncheckedRequirements} unchecked acceptance criteria or definition-of-done items; the run remains incomplete`,
    );
  }
}

const transitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    token: z.uuid(),
    operation: z.enum(["acquire", "release", "advance"]),
    board: z.string(),
    card: z.string(),
    run: z.uuid(),
    journal: z.string(),
    expected: z
      .object({ assignees: z.array(z.string()), status: z.string(), labels: z.array(z.string()) })
      .readonly(),
    targetAssignees: z.array(z.string()).readonly(),
    targetStatus: z.string(),
    claim: claimSchema,
    previousClaim: claimSchema.optional(),
    previousJournalClaim: claimSchema.optional(),
    intent: z.string(),
  })
  .readonly();
type Transition = z.infer<typeof transitionSchema>;

async function saveClaim(claim: Claim, operations: BoardOperations): Promise<void> {
  const directory = join(claim.board, ".iterate");

  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const filename of [`${claim.card}.${claim.run}.json`, `${claim.card}.json`])
    await (operations.writeJson ?? durableJson)(join(directory, filename), claim);
}

async function pendingTransition(board: string, id: string): Promise<Transition | undefined> {
  const path = join(board, ".iterate", `${id}.pending.json`);
  const raw = await readOptionalFile({ path, description: "pending board transition" });
  if (raw === undefined) return undefined;

  try {
    const parsed = transitionSchema.parse(JSON.parse(raw.toString()));
    if (
      parsed.board !== board ||
      parsed.card !== id ||
      parsed.claim.run !== parsed.run ||
      parsed.claim.journal !== parsed.journal
    )
      throw new Error("identity mismatch");

    return parsed;
  } catch {
    throw new Exit(1, `invalid pending board transition ${path}; retain it for typed inspection`);
  }
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function requireTransitionAdmission(
  transition: Transition,
  latest: Card,
  stored: Claim | undefined,
  journal: Journal,
): Promise<void> {
  if (existsSync(stopFile)) throw new Exit(3, "stop file present");

  if (
    latest.labels.includes("deferred") ||
    !["To Do", "Shape", "Build", "Review", "Done"].includes(latest.status)
  )
    throw new Exit(1, `${transition.card} is no longer admitted for ownership transition`);

  if (transition.operation === "acquire" && latest.status === "Done")
    throw new Exit(1, `${transition.card} became Done before ownership acquisition`);

  if (transition.operation === "release" && latest.status !== "Done")
    throw new Exit(1, `${transition.card} is no longer Done`);

  if (transition.operation === "release")
    await requireCheckedRequirements({ id: transition.card, card: latest, journal });

  if (
    transition.operation === "advance" &&
    (latest.criteria === 0 ||
      latest.labels.some(
        (label) => label === "investigate:debug" || label === "investigate:verify",
      ))
  )
    throw new Exit(1, `${transition.card} is no longer an ordinary shaped card`);

  const clean = await treeIsClean();
  if (transition.operation === "release" && !clean)
    throw new Exit(1, "the tree still holds uncommitted work");

  if (!(clean || matchingClaim(stored, journal) || transition.claim.recovery))
    throw new Exit(1, "the tree is not clean and has no matching run claim");
}

async function finishTransition(
  transition: Transition,
  journal: Journal,
  gate: NativeGate,
): Promise<void> {
  const { board, card: id, expected, targetAssignees, targetStatus, claim } = transition;
  if (transition.run !== journal.record.id || transition.journal !== journal.directory)
    throw new Exit(
      1,
      `pending ownership transition belongs to another run at ${transition.journal}`,
    );

  journal.requireSettledAttempts();
  await journal.requireCurrentSnapshot();
  const latest = await card(id, gate);
  const stored = await readClaim({ board, id });
  const permitted = [transition.previousClaim, transition.claim];
  if (
    !(
      permitted.some((candidate) => same(stored, candidate)) &&
      [transition.previousJournalClaim, transition.claim].some((candidate) =>
        same(journal.record.runClaim, candidate),
      )
    )
  )
    throw new Exit(1, `pending ownership claim conflict for ${id}; retain ${transition.intent}`);

  const atExpected =
    same(latest.assignees, expected.assignees) && latest.status === expected.status;
  const atTarget = same(latest.assignees, targetAssignees) && latest.status === targetStatus;
  if (!(same(latest.labels, expected.labels) && (atExpected || atTarget)))
    throw new Exit(
      1,
      `ownership transition conflict for ${id}; human/foreign assignment or admission changed; retain ${transition.intent}`,
    );

  await requireTransitionAdmission(transition, latest, stored, journal);

  if (!atTarget) {
    if (!same(expected.assignees, targetAssignees))
      await setAssignee({ gate, assignee: targetAssignees.join(",") });
    else if (expected.status !== targetStatus) await setStatus({ gate, status: targetStatus });
    const after = await card(id, gate);
    if (
      !(
        same(after.assignees, targetAssignees) &&
        after.status === targetStatus &&
        same(after.labels, expected.labels)
      )
    )
      throw new Exit(
        1,
        `board did not preserve ownership transition for ${id}; retain ${transition.intent}`,
      );
  }
  await saveClaim(claim, gate.operations);
  journal.record.runClaim = claim;
  if (transition.operation === "release") journal.record.completed = true;
  await journal.save();
  await (gate.operations.writeJson ?? durableJson)(`${transition.intent}.completed.json`, {
    at: new Date().toISOString(),
    token: transition.token,
    run: transition.run,
  });
  await (gate.operations.remove ?? unlink)(join(board, ".iterate", `${id}.pending.json`));
}

export async function reconcileClaim(
  board: string,
  journal: Journal,
  operations: BoardOperations = {},
): Promise<void> {
  const id = journal.record.card ?? "";
  const transition = await pendingTransition(board, id);
  if (!transition) return;

  if (transition.run !== journal.record.id || transition.journal !== journal.directory)
    throw new Exit(
      1,
      `pending ownership transition belongs to another run at ${transition.journal}`,
    );

  await withNativeGate(
    { board, card: id, run: journal.record.id, journal: journal.directory },
    (gate) => finishTransition(transition, journal, gate),
    operations,
  );
}

async function transitionClaim(
  input: {
    readonly board: string;
    readonly journal: Journal;
    readonly operation: "acquire" | "release" | "advance";
    readonly recovery?: string;
    readonly expectedStatus?: string;
  },
  operations: BoardOperations = {},
): Promise<void> {
  const { board, journal, operation, recovery } = input;
  const id = journal.record.card ?? "";
  await withNativeGate(
    { board, card: id, run: journal.record.id, journal: journal.directory },
    async (gate) => {
      const pending = await pendingTransition(board, id);
      if (pending) {
        await finishTransition(pending, journal, gate);
        return;
      }

      await journal.requireCurrentSnapshot();
      const before = await card(id, gate);
      const previousClaim = await readClaim({ board, id });
      requireOwnership({
        before,
        claim: previousClaim,
        journal:
          operation === "acquire" &&
          !previousClaim &&
          !journal.record.runClaim &&
          journal.record.attempts.length === 0 &&
          !recovery &&
          before.assignees.length === 0
            ? undefined
            : journal,
        recovery,
      });
      if (
        before.labels.includes("deferred") ||
        !(before.status === "Done" || ["To Do", "Shape", "Build", "Review"].includes(before.status))
      )
        throw new Exit(1, `${id} is no longer admitted for ownership transition`);

      if (operation === "acquire" && before.status === "Done")
        throw new Exit(1, `${id} became Done before ownership acquisition`);

      if (operation === "acquire" && matchingClaim(previousClaim, journal)) return;

      if (operation !== "acquire" && !(previousClaim && matchingClaim(previousClaim, journal)))
        throw new Exit(1, `matching active ownership is required for ${operation}`);

      if (operation === "release" && before.status !== "Done")
        throw new Exit(1, `${id} is no longer Done`);

      if (
        operation === "advance" &&
        (before.criteria === 0 ||
          before.labels.some(
            (label) => label === "investigate:debug" || label === "investigate:verify",
          ))
      )
        throw new Exit(1, `${id} is no longer an ordinary shaped card`);

      if (operation === "advance" && before.status !== input.expectedStatus)
        throw new Exit(1, `${id} changed status before advancement`);

      const activeClaim = previousClaim;
      if (operation !== "acquire" && !activeClaim)
        throw new Exit(1, "the active claim disappeared");

      let claim: Claim;
      if (operation === "acquire") {
        claim = Object.assign(
          {
            schemaVersion: 1 as const,
            board,
            card: id,
            run: journal.record.id,
            journal: journal.directory,
            assignee: `@iterate-${journal.record.id}`,
            owner: { host: hostname(), pid: process.pid, user: process.getuid?.() ?? 0 },
            acquiredAt: new Date().toISOString(),
          },
          definedFields({ recovery: nonEmpty(recovery) }),
        );
      } else if (operation === "release") {
        claim = { ...requireActiveClaim(activeClaim), releasedAt: new Date().toISOString() };
      } else {
        claim = requireActiveClaim(activeClaim);
      }

      const transition: Transition = Object.assign(
        {
          schemaVersion: 1 as const,
          token: gate.marker.token,
          operation,
          board,
          card: id,
          run: journal.record.id,
          journal: journal.directory,
          expected: {
            assignees: [...before.assignees],
            status: before.status,
            labels: [...before.labels],
          },
          targetAssignees: operation === "release" ? [] : [claim.assignee],
          targetStatus: operation === "advance" ? "Build" : before.status,
          claim,
          intent: `${gate.marker.intent}.transition.json`,
        },
        definedFields({ previousClaim, previousJournalClaim: journal.record.runClaim }),
      );

      await (operations.writeJson ?? durableJson)(transition.intent, transition);
      await (operations.writeJson ?? durableJson)(
        join(board, ".iterate", `${id}.pending.json`),
        transition,
      );
      await finishTransition(transition, journal, gate);
    },
    operations,
  );
}

export async function acquireClaim(
  board: string,
  journal: Journal,
  recovery?: string,
  operations: BoardOperations = {},
): Promise<void> {
  await transitionClaim(
    Object.assign(
      { board, journal, operation: "acquire" as const },
      definedFields({ recovery: nonEmpty(recovery) }),
    ),
    operations,
  );
}

export async function releaseClaim(
  journal: Journal,
  operations: BoardOperations = {},
): Promise<void> {
  const claim = journal.record.runClaim;
  if (!claim || claim.releasedAt) return;

  await transitionClaim({ board: claim.board, journal, operation: "release" }, operations);
}

export async function advanceClaim(
  journal: Journal,
  operations: BoardOperations = {},
): Promise<void> {
  const claim = journal.record.runClaim;
  if (!claim) throw new Exit(1, "status advancement requires the active run claim");

  await transitionClaim(
    {
      board: claim.board,
      journal,
      operation: "advance",
      expectedStatus: "Shape",
    },
    operations,
  );
}

function requireActiveClaim(claim: Claim | undefined): Claim {
  if (!claim) throw new Exit(1, "the active claim disappeared");

  return claim;
}
