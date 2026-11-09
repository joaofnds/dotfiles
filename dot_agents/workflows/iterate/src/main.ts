import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
  type AgentPlan,
  agentForStage,
  agentPlanFromArgs,
  resolveInvocation,
  roles,
  type Stage,
  type StageAgent,
} from "./agents.ts";
import { type Card, card, cardId, stageForStatus, tool } from "./board.ts";
import { BoardTarget, discoverBoard } from "./board-target.ts";
import {
  BoardCommandFailure,
  type BoardOperations,
  canonicalBoard,
  durableJson,
  type ExclusionRetention,
  recoverNativeGate,
  snapshotExecutionLock,
  withNativeGate,
} from "./board-transaction.ts";
import {
  acquireClaim,
  advanceClaim,
  matchingClaim,
  readClaim,
  reconcileClaim,
  releaseClaim,
  requireCheckedRequirements,
  requireOwnership,
  withBoardLock,
} from "./claims.ts";
import { definedFields, nonEmpty } from "./defined-fields.ts";
import { Exit, say } from "./exit.ts";
import type { JsonWriter } from "./files.ts";
import { type AuthorMode, Journal, journalDirectory, withJournalLock } from "./journal.ts";
import { adapterFor, adapters, budgetFor, providerNames, runtimeContract } from "./provider.ts";
import {
  idleMinutes,
  prepareSession,
  type RunningSession,
  SessionFailure,
  type SessionHost,
  type SessionResult,
  SessionStartFailure,
} from "./session.ts";
import { StageReceipt } from "./stage-receipt.ts";
import { stopFile, treeIsClean } from "./tree.ts";

export type RunnerOperations = {
  readonly journalWriter?: JsonWriter;
  readonly stageWriter?: JsonWriter;
  readonly board?: BoardOperations;
  readonly session?: SessionHost;
};

const sessionCapDefaults = adapters
  .flatMap(({ displayName, capabilities }) =>
    capabilities.dollarCap && capabilities.defaultDollarCap !== undefined
      ? [`${displayName} default ${capabilities.defaultDollarCap}`]
      : [],
  )
  .join(", ");
const usage = `iterate step <card> [agent options]    run one session for the card's current stage
iterate step <card> --continue-author [agent options]  reuse the completed shape author for Build
iterate resume <card> [agent options]  continue the last compatible author session
iterate status [card]                  print the durable run journal, without an agent
iterate recover <card> --run UUID --intent UUID --evidence "typed inspection"
iterate --help

Direct options are --provider ${providerNames.join("|")}, --model MODEL and --effort LEVEL for this
call. Bare calls reuse a saved supervised plan, or use Claude CLI defaults for direct runs.
${adapters.map((adapter) => adapter.summary).join("\n")}
A stage advances only after its process checks and required card transition.
Provider completion is recorded separately; missing cost or tool-coverage data
stays unknown.

Supervised selection options (pass the complete selector set to every call):
  --default-provider PROVIDER  --default-model MODEL  --default-effort LEVEL
  --STAGE-agent provider:model[:effort]  --STAGE-model MODEL  --STAGE-effort LEVEL
  --role-agent ROLE=provider:model[:effort]  --role-model ROLE=MODEL
  --role-effort ROLE=LEVEL
STAGE is shape, debug, verify, build or review; ROLE is screener, advisor or reviewer.
A tuple replaces the entire inherited selection, resetting omitted effort to the
provider's native default. Model/effort fields apply after tuples in any flag order.
Roles inherit their stage, retaining assigned role effort unless explicitly overridden.
Role resolution is available as data; native child dispatch is not wired yet.
Omitted model/effort use native defaults. Unknown capabilities refuse without fallback;
future-stage adapter availability is checked only when that stage is dispatched.
Direct and supervised/default/stage/role options cannot be combined.

Invoke the iterate skill with a card ID to supervise it through completion. The
supervisor reads each stage's result before calling step again. The runner takes
an explicit accepted card and never selects work, runs intake, or reflects.
A step on Done checks the tree and records completion without starting an agent.
Other steps run shape, build, or review according to the card's column. Shape
cards labeled investigate:debug or investigate:verify run that investigation.
An ordinary shape session leaving criteria in Shape is advanced to Build.

Agent text and tool calls stream on stderr. The final reply is stdout.
ITERATE_LIVE=0 opts into compact transport. ITERATE_SESSION_BUDGET caps each
invocation in dollars where the provider enforces one (${sessionCapDefaults}).
A session silent for ${idleMinutes} minutes is stopped. ITERATE_RUN_BUDGET
optionally caps known run dollars; unknown or parent-only costs stop further
sessions under that cap. ITERATE_RUN_MINUTES optionally bounds cumulative stage
wall time.
Limits are fixed when the run is created. Six stage attempts are allowed across
invocations, including failures. Journals and raw logs live under the Git metadata
directory's iterate folder. status also reads historical planning attempts.

Every session is told nobody is at the keyboard. Admission and scope changes still
follow the board's recorded authorization policy. Inbox, unknown columns, deferred
cards, and Build/Review cards held by another assignee are refused. A dirty tree is
handed to the stage only under the matching run-specific claim and journal.
Legacy adoption requires --adopt-legacy-claim "typed recovery direction" separately
from any selector or mode change. Claims and execution locks never expire automatically.
recover addresses one exact retained transaction or stage intent after its local owner
exits. It preserves the original intent, receipts and audit. Every recorded CLI and
stage scope needs positive settlement proof; missing identity/report evidence and
unresolved output work retain exclusion. A genuine durable normalized stage report
may be replayed into its original unfinished attempt without changing its measurements,
claim or limits. Recovery launches no provider. Run step/resume separately afterward;
incomplete accounting still refuses another dollar-capped invocation.
Completion requires a clean tree. Review always starts fresh. resume requires the
same pinned model/effort, stage, role policy, runtime fingerprint and explicit session ID. Ambiguous native defaults require a fresh step.
Done validation also requires checked acceptance criteria and definition-of-done items,
except cards labeled partial or abandoned under the board policy.
--continue-author is opt-in for one shape-to-Build handoff with the same pinned
author contract; missing, failed or incompatible history refuses without fallback.
After a failed continued Build, use ordinary resume for that Build author.

Exit codes: 0 the step succeeded or the card is Done, 1 refused or failed,
2 the column did not move, 3 the stop file .iterate-stop is present.`;

const unattended = `This session is one stage of an iteration running unattended. Nobody is at the keyboard, so the Acting section's rule for no one at the keyboard holds, and a turn that ends on a question stalls the loop. Read the priority doc (backlog doc view doc-0) alongside the named card before working. When this stage completes the card or meets a blocker, change only the priority doc lines the board's Project direction policy names for that event. Record progress on the card and never in the priority doc, and do not replan the remaining sequence. Finish this stage's work in this session, with each decision you took and its reason on the record this stage writes, since the next session reads only the board. Fix in this session what ~/.agents/rulebook/ownership.md tells you to fix, rather than proposing it. Admitting an Inbox card to To Do, a merge that adds scope to an accepted card, and reactivating deferred work each need the user's decision unless a recorded policy delegates it, and an unattended iteration cannot supply that decision. Record such a proposal on its card, leave the card where it is, and continue accepted work.`;
const completion =
  "End with a completion record containing outcome and card state, every new consequential claim and its evidence path, errors, scope changes, unresolved decisions, and the detailed record's location. Preserve these fields even when the stage's normal reply is shorter.";
const dirtyTree = `The tree carries uncommitted changes. Read them before anything else. Those that belong to this card are the previous session's unfinished work on it, yours to finish and commit. Leave any other change as you found it.`;

async function runStage(
  journal: Journal,
  stage: Stage,
  id: string,
  agent: StageAgent,
  mode: AuthorMode,
  selection: ReturnType<typeof resolveInvocation> | undefined,
  retention: ExclusionRetention,
  expected: Card,
  operations: RunnerOperations,
): Promise<void> {
  const clean = await treeIsClean();
  const { budget, timeoutMs } = journal.allowances();
  const adapter = adapterFor(agent.provider);
  const cap = budgetFor(
    Object.assign(
      { provider: agent.provider, capabilities: adapter.capabilities },
      definedFields({
        explicitSession: nonEmpty(process.env.ITERATE_SESSION_BUDGET),
        runRemaining: budget,
      }),
    ),
  );
  if (cap !== undefined) journal.requireKnownCosts();
  const rolePolicy = rolePolicyFor(selection?.plan);
  const runtime = await runtimeContract({ provider: agent.provider, rolePolicy });
  const resumeSessionId = journal.authorSessionId(stage, agent, runtime, mode);
  const resumeConfiguration = resumeSessionId
    ? journal.record.attempts.at(-1)?.configuredSession
    : undefined;
  const prepared = prepareSession(
    Object.assign(
      {
        agent,
        stage,
        card: id,
        systemPrompt: [
          unattended,
          completion,
          roleSelectionForStage(selection?.plan ?? { direct: agent }, stage, agent),
          ...(clean ? [] : [dirtyTree]),
          ...(mode !== "fresh"
            ? [
                "Continue only this author role. Re-read the priority doc (backlog doc view doc-0) and the current card and check source/environment drift.",
              ]
            : []),
          ...(mode === "continue-author"
            ? [
                "Shaping is complete. Continue this session as the build author and execute the current Build skill and task, without repeating Shape. Required independent reviews still use fresh reviewers.",
              ]
            : []),
        ].join("\n\n"),
        logDirectory: journal.directory,
      },
      definedFields({ budget: cap, timeoutMs, resumeSessionId, resumeConfiguration }),
    ),
    undefined,
    operations.session,
  );
  const claim = journal.record.runClaim;
  if (!claim) throw new Exit(1, "stage launch requires an active run claim");

  let running: RunningSession | undefined;
  let receipt: StageReceipt | undefined;
  let startFailure: SessionStartFailure | undefined;
  try {
    await withNativeGate(
      { board: claim.board, card: id, run: journal.record.id, journal: journal.directory },
      async (gate) => {
        guardStop();
        await journal.requireCurrentSnapshot();
        const latest = await card(id, gate);
        refuseUnrunnableCard(id, latest);
        requireOwnership({
          before: latest,
          claim: await readClaim({ board: claim.board, id }),
          journal,
          recovery: undefined,
        });
        if (!isDeepStrictEqual(latest, expected) || stageForCard(latest) !== stage)
          throw new Exit(1, "card stage or admission changed during provider preflight");

        const latestClean = await treeIsClean();
        if (!(latestClean || matchingClaim(await readClaim({ board: claim.board, id }), journal)))
          throw new Exit(1, "the tree is not clean and has no matching run claim");

        if (latestClean !== clean)
          throw new Exit(1, "tree cleanliness changed during provider preflight; use a fresh step");

        if (!isDeepStrictEqual(journal.allowances(), definedFields({ budget, timeoutMs })))
          throw new Exit(1, "stage allowances changed during provider preflight");

        if (cap !== undefined) journal.requireKnownCosts();
        if (mode !== "fresh") journal.authorSessionId(stage, agent, runtime, mode);

        guardStop();
        await journal.requireCurrentSnapshot();
        await operations.board?.target?.validate();
        retention.retained = true;
        const attempt = await journal.begin(stage, id, agent, runtime, selection);
        receipt = await StageReceipt.create(
          gate,
          journal,
          attempt.id,
          prepared.logPath,
          operations.stageWriter,
        );
        try {
          await operations.board?.target?.validate();
          running = prepared.start();
        } catch (error) {
          if (!(error instanceof SessionStartFailure)) throw error;

          startFailure = error;
          await receipt.notStarted(error);
          await journal.finishRecordedReport(attempt.id, error.result);
          return;
        }
        gate.uncertain = true;
        await receipt.started(running);
        await gate.release();
      },
      operations.board,
    );
    if (startFailure) {
      retention.retained = false;
      throw startFailure;
    }
  } catch (error) {
    if (running) {
      await running.cancel("stage launch handoff failed");
      try {
        await persistStage(running, receipt, journal, retention);
      } finally {
        retention.retained = true;
      }
    }
    throw error;
  }
  if (!(running && receipt)) throw new Exit(1, "stage launch has no durable running owner");

  try {
    await persistStage(running, receipt, journal, retention);
  } catch (error) {
    await running.cancel("stage persistence or disposition failed");
    throw error;
  }
}

async function persistStage(
  running: RunningSession,
  receipt: StageReceipt | undefined,
  journal: Journal,
  retention: ExclusionRetention,
): Promise<void> {
  let result: SessionResult;
  let failure: unknown;
  try {
    result = await running.result;
  } catch (error) {
    if (!(error instanceof SessionFailure)) throw error;

    result = error.result;
    failure = error;
  }
  if (!receipt) throw new Exit(1, "stage has no durable receipt; retain execution exclusion");

  await receipt.observed(result, running);
  if (result.settlement?.state !== "settled")
    throw new Exit(
      1,
      `stage lifecycle remains uncertain at ${receipt.path}; retain execution exclusion`,
    );

  const spent = await journal.finishRecordedReport(receipt.attempt, result);
  await receipt.completed();
  retention.retained = false;
  say(`   cost ${spent ?? "n/a"}`);
  if (failure) throw failure;
}

function rolePolicyFor(plan?: AgentPlan): string {
  return JSON.stringify({
    contract: "iterate-native-roles-v2",
    overrides: roles.map((role) => {
      const entry = plan?.supervised?.roles[role];
      return [
        role,
        entry?.agent?.provider,
        entry?.agent?.model,
        entry?.agent?.effort,
        entry?.model,
        entry?.effort,
      ];
    }),
  });
}

function roleSelectionForStage(plan: AgentPlan, stage: Stage, agent: StageAgent): string {
  const receipt = {
    stage,
    requestedAgent: agent,
    overrides: plan.supervised?.roles ?? {},
  };

  return `Use the delegation skill's native dispatch and selection contract for required child roles.\nITERATE_ROLE_SELECTION=${JSON.stringify(receipt)}`;
}

function stageForCard({ status, labels }: Card): Stage {
  if (status === "Shape") {
    const investigations = labels.filter(
      (label) => label === "investigate:debug" || label === "investigate:verify",
    );
    if (investigations.length > 1)
      throw new Exit(1, "a card cannot request both debug and verify investigations");

    if (investigations[0] === "investigate:debug") return "debug";

    if (investigations[0] === "investigate:verify") return "verify";
  }

  const stage = stageForStatus(status);
  if (!stage) throw new Exit(1, `unknown status: ${status}`);

  return stage;
}

async function advance(
  journal: Journal,
  id: string,
  plan: AgentPlan,
  mode: AuthorMode,
  selection: ReturnType<typeof resolveInvocation> | undefined,
  retention: ExclusionRetention,
  operations: RunnerOperations,
): Promise<void> {
  guardStop();

  const before = await card(id, undefined, operations.board);

  refuseUnrunnableCard(id, before);
  const claim = journal.record.runClaim;
  if (claim)
    requireOwnership({
      before,
      claim: await readClaim({ board: claim.board, id }),
      journal,
      recovery: undefined,
    });
  if (before.status === "Done") {
    if (mode !== "fresh") throw new Exit(1, "a Done card has no author stage to resume");

    journal.requireSettledAttempts();
    await requireCheckedRequirements({ id, card: before, journal });

    await refuseWorkLeftBehind();
    await releaseClaim(journal, operations.board);
    journal.record.completed = true;
    await journal.save();
    say(`${id} is Done`);
    return;
  }

  const stage = stageForCard(before);
  const agent = agentForStage(plan, stage);
  await runStage(journal, stage, id, agent, mode, selection, retention, before, operations);

  const after = await card(id, undefined, operations.board);
  if (
    after.status !== before.status ||
    (stage === "shape" && (await advanceShapedCard(journal, id, after, operations)))
  ) {
    return;
  }

  throw new Exit(2, `${id} stayed in ${before.status}`);
}

async function advanceShapedCard(
  journal: Journal,
  id: string,
  after: Card,
  operations: RunnerOperations,
): Promise<boolean> {
  if (after.status !== "Shape") return false;

  if (stageForCard(after) !== "shape" || after.criteria === 0) return false;

  // To Do maps to the shape skill, which refuses a shaped card, so a shaped card
  // sent there never moves again.
  await advanceClaim(journal, operations.board);
  say(`${id} was shaped and left in Shape, so iterate moved it to Build`);

  return true;
}

function guardStop(): void {
  if (existsSync(stopFile)) throw new Exit(3, "stop file present");
}

function refuseUnrunnableCard(id: string, { status, labels }: Card): void {
  if (labels.includes("deferred")) throw new Exit(1, `${id} is deferred and cannot run`);

  if (status !== "Done" && stageForStatus(status) === undefined)
    throw new Exit(1, `unknown or unaccepted status: ${status}`);
}

async function refuseWorkLeftBehind(): Promise<void> {
  if (!(await treeIsClean())) throw new Exit(1, "the tree still holds uncommitted work");
}

async function main(args: readonly string[], operations: RunnerOperations): Promise<void> {
  delete process.env.USE_GLOBAL_TASK_ID_LOCK;

  const [argument = "", second = "", ...options] = args;
  if (argument === "--help" || argument === "-h") {
    if (second || options.length > 0) throw new Exit(1, "unexpected arguments; see iterate --help");

    console.log(usage);
    return;
  }

  if (argument === "status") {
    if (options.length > 0) throw new Exit(1, "unexpected arguments; see iterate --help");

    const journal = await Journal.read(
      second ? cardId(second) : undefined,
      operations.journalWriter,
    );
    console.log(JSON.stringify(journal?.summary() ?? { run: null }, null, 2));
    return;
  }

  if (argument === "recover") {
    const id = cardId(second);
    const fields: Record<string, string> = {};
    for (let index = 0; index < options.length; index += 2) {
      const flag = options[index];
      const value = options[index + 1];
      if (
        !(
          flag &&
          ["--run", "--intent", "--evidence"].includes(flag) &&
          value &&
          !value.startsWith("--")
        ) ||
        fields[flag]
      )
        throw new Exit(1, "recover requires --run UUID --intent UUID --evidence typed-inspection");

      fields[flag] = value;
    }
    const request = z
      .object({ "--run": z.uuid(), "--intent": z.uuid(), "--evidence": z.string().trim().min(1) })
      .safeParse(fields);
    if (!request.success)
      throw new Exit(1, "recover requires --run UUID --intent UUID --evidence typed-inspection");

    const journal = await Journal.read(id, operations.journalWriter);
    if (!journal || journal.record.id !== request.data["--run"])
      throw new Exit(1, "typed recovery run does not match this tree's journal");

    const recoveryJournalLock = join(await journalDirectory(), "lock");
    const recoveryBoard = await canonicalBoard();
    await tool(
      () =>
        recoverNativeGate({
          board: recoveryBoard,
          card: id,
          run: journal.record.id,
          journal: journal.directory,
          token: request.data["--intent"],
          evidence: request.data["--evidence"],
          journalLock: recoveryJournalLock,
          operations: operations.board ?? {},
          reconcile: async (tokens) => {
            for (const token of tokens)
              await StageReceipt.recover(
                journal,
                token,
                recoveryBoard,
                operations.session?.processSystem,
              );
            journal.requireSettledAttempts();
          },
        }),
      "recovering native ownership failed",
    );
    say(
      `${id} retained transaction recovered; original intent and inspection audit preserved; run step to reconcile`,
    );
    return;
  }

  if (argument !== "step" && argument !== "resume")
    throw new Exit(1, "name a card with iterate step <card>; see iterate --help");

  const id = cardId(second);
  const selectors: string[] = [];
  let recovery: string | undefined;
  let continueAuthor = false;
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option === "--continue-author") {
      if (argument !== "step" || continueAuthor)
        throw new Exit(1, "--continue-author is allowed once, only on step");

      continueAuthor = true;
      continue;
    }
    if (option !== "--adopt-legacy-claim") {
      if (option !== undefined) selectors.push(option);
      continue;
    }

    const value = options[++index];
    if (recovery || !value?.trim() || value.startsWith("--"))
      throw new Exit(1, "--adopt-legacy-claim requires one nonempty typed recovery direction");

    recovery = value;
  }

  if (continueAuthor && recovery)
    throw new Exit(1, "legacy claim adoption requires a separate fresh step");

  const mode: AuthorMode =
    argument === "resume" ? "resume" : continueAuthor ? "continue-author" : "fresh";
  agentPlanFromArgs(selectors);
  const retention: ExclusionRetention = { retained: false };
  const selection = await discoverBoard();
  await withBoardLock(
    id,
    (board) =>
      withJournalLock(async () => {
        guardStop();
        const target = await BoardTarget.create(
          operations.board?.writeJson ?? durableJson,
          selection,
          operations.board?.remove,
          operations.board?.removeDirectory,
        );
        const bound = { ...operations, board: { ...operations.board, target } };
        try {
          await run(mode, id, selectors, board, retention, bound, recovery);
        } catch (error) {
          if (error instanceof BoardCommandFailure && error.unsettled) retention.retained = true;
          throw error;
        } finally {
          if (retention.retained || target.retained) {
            retention.retained = true;
            await target.retain();
          } else {
            retention.retained = true;
            await target.cleanup();
            retention.retained = false;
          }
        }
      }, retention),
    retention,
    selection.board,
  );
}

async function run(
  mode: AuthorMode,
  id: string,
  options: readonly string[],
  board: string,
  retention: ExclusionRetention,
  operations: RunnerOperations,
  recovery?: string,
): Promise<void> {
  guardStop();

  const initialLocks = await Promise.all([
    snapshotExecutionLock(join(board, ".iterate", `${id}.lock`)),
    snapshotExecutionLock(join(await journalDirectory(), "lock")),
  ]);
  let before = await card(id, undefined, operations.board);
  await operations.board?.target?.freezeInitialRead(initialLocks);
  refuseUnrunnableCard(id, before);
  if (mode !== "fresh" && before.status === "Done")
    throw new Exit(1, "a Done card has no author stage to resume");

  const existing = await Journal.read(id, operations.journalWriter);
  if (existing) {
    existing.requireSettledAttempts();
    await reconcileClaim(board, existing, operations.board);
    before = await card(id, undefined, operations.board);
    refuseUnrunnableCard(id, before);
  }
  const active =
    existing && !(existing.cycleEnded() && before.status !== "Done") ? existing : undefined;
  active?.requireSettledAttempts();
  const claim = await readClaim({ board, id });
  requireOwnership({ before, claim, journal: active, recovery });
  if (
    !(
      (await treeIsClean()) ||
      matchingClaim(claim, active) ||
      (recovery && active && !active.record.runClaim)
    )
  )
    throw new Exit(1, "the tree is not clean and has no matching run claim");

  const selection = resolveInvocation(
    Object.assign(
      { args: options, invocation: mode === "fresh" ? ("step" as const) : ("resume" as const) },
      definedFields({ savedPlan: active?.record.supervisedPlan }),
    ),
  );
  active?.requireSettledAttempts();
  if (before.status !== "Done") {
    const selected = agentForStage(selection.plan, stageForCard(before));
    const adapter = adapterFor(selected.provider);
    if (mode !== "fresh") {
      if (!active)
        throw new Exit(
          1,
          "resume requires an existing run and explicit recorded session ID; use a fresh step",
        );

      const runtime = await runtimeContract({
        provider: selected.provider,
        rolePolicy: rolePolicyFor(selection.plan),
      });
      active.authorSessionId(stageForCard(before), selected, runtime, mode);
    }
    const runBudget = process.env.ITERATE_RUN_BUDGET;
    budgetFor(
      Object.assign(
        { provider: selected.provider, capabilities: adapter.capabilities },
        definedFields({
          explicitSession: nonEmpty(process.env.ITERATE_SESSION_BUDGET),
          runRemaining:
            active?.record.limits.dollars ?? (runBudget ? Number(runBudget) : undefined),
        }),
      ),
    );
  }
  const journal = await Journal.open(id, before.status !== "Done", operations.journalWriter);
  if (before.status !== "Done") {
    await acquireClaim(board, journal, recovery, operations.board);
    if (!((await treeIsClean()) || matchingClaim(await readClaim({ board, id }), journal)))
      throw new Exit(1, "the tree is not clean and has no matching run claim");
  }
  await advance(journal, id, selection.plan, mode, selection, retention, operations);
}

export async function runCli(
  args: readonly string[],
  operations: RunnerOperations = {},
): Promise<number> {
  try {
    await main(args, operations);
    return 0;
  } catch (error) {
    if (!(error instanceof Exit)) throw error;

    say(error.message);
    return error.code;
  }
}

if (import.meta.main) process.exitCode = await runCli(process.argv.slice(2));
