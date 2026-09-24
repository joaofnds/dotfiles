import { existsSync } from "node:fs";
import process from "node:process";
import {
  type AgentPlan,
  agentForStage,
  agentPlanFromArgs,
  type Stage,
  type StageAgent,
} from "./agents.ts";
import { type Card, card, cardId, inProgress, ours, setStatus, stageForStatus } from "./board.ts";
import { Exit, say } from "./exit.ts";
import { Journal, withJournalLock } from "./journal.ts";
import { idleMinutes, SessionFailure, session } from "./session.ts";
import { stopFile, treeIsClean } from "./tree.ts";

const usage = `iterate step <card> [agent options]    run one session for the card's current stage
iterate resume <card> [agent options]  continue the last compatible author session
iterate status [card]                  print the durable run journal, without an agent
iterate --help

Agent options are --provider claude, --model MODEL and --effort LEVEL. Claude is
the only implemented provider. Omit model and effort to use the Claude CLI defaults.
For one supervised run, use --STAGE-agent provider:model[:effort], where STAGE is
shape, debug, verify, build or review. Pass the same stage options to every call.
Direct agent options and stage agent options cannot be combined.

Invoke the iterate skill with a card ID to supervise it through completion. The
supervisor reads each stage's result before calling step again. The runner takes
an explicit accepted card and never selects work, runs intake, or reflects.
A step on Done checks the tree and records completion without starting an agent.
Other steps run shape, build, or review according to the card's column. Shape
cards labeled investigate:debug or investigate:verify run that investigation.
An ordinary shape session leaving criteria in Shape is advanced to Build.

Agent text and tool calls stream on stderr. The final reply is stdout.
ITERATE_LIVE=0 opts into compact transport. ITERATE_SESSION_BUDGET caps each Claude
session in dollars (default 50). A session silent for ${idleMinutes} minutes is
stopped. ITERATE_RUN_BUDGET optionally caps known run dollars; unknown or parent-only
costs stop further sessions under that cap. ITERATE_RUN_MINUTES optionally bounds
cumulative stage wall time.
Limits are fixed when the run is created. Six stage attempts are allowed across
invocations, including failures. Journals and raw logs live under the Git metadata
directory's iterate folder. status also reads historical planning attempts.

Every session is told nobody is at the keyboard. Admission and scope changes still
follow the board's recorded authorization policy. Inbox, unknown columns, deferred
cards, and Build/Review cards held by another assignee are refused. A dirty tree is
handed to the stage when the card is assigned to @claude, and refused otherwise.
Completion requires a clean tree. Review always starts fresh. resume requires the
same stage and agent options with a recorded session ID.

Exit codes: 0 the step succeeded or the card is Done, 1 refused or failed,
2 the column did not move, 3 the stop file .iterate-stop is present.`;

const unattended = `This session is one stage of an iteration running unattended. Nobody is at the keyboard, so the Acting section's rule for no one at the keyboard holds, and a turn that ends on a question stalls the loop. Read the priority doc (backlog doc view doc-0) alongside the named card before working. When this stage completes the card or meets a blocker, change only the priority doc lines the board's Project direction policy names for that event. Record progress on the card and never in the priority doc, and do not replan the remaining sequence. Finish this stage's work in this session, with each decision you took and its reason on the record this stage writes, since the next session reads only the board. New Inbox admissions and scope-expanding merges follow the board's admission policy: require the user's batch decision unless a recorded policy explicitly delegates those decisions. Reactivation of deferred work follows its recorded admission/reactivation policy; without recorded authorization, propose reactivation for the user's batch decision. A direction to iterate or continue unattended does not delegate admission. An unattended iteration cannot supply the user's decision. Record a proposed batch, leave pending candidates outside the accepted queue, and continue already accepted work.`;
const completion =
  "End with a completion record containing outcome and card state, every new consequential claim and its evidence path, errors, scope changes, unresolved decisions, and the detailed record's location. Preserve these fields even when the stage's normal reply is shorter.";
const dirtyTree = `The tree carries uncommitted changes. Read them before anything else. Those that belong to this card are the previous session's unfinished work on it, yours to finish and commit. Leave any other change as you found it.`;

function sessionBudget(): string {
  const value = process.env.ITERATE_SESSION_BUDGET || "50";
  if (!(Number.isFinite(Number(value)) && Number(value) > 0))
    throw new Exit(1, `${value} is not a session budget in dollars`);

  return value;
}

async function runStage(
  journal: Journal,
  stage: Stage,
  id: string,
  agent: StageAgent,
  resume = false,
): Promise<void> {
  const clean = await treeIsClean();
  const { budget, timeoutMs } = journal.allowances();
  const resumeSessionId = resume ? journal.resumeId(stage, agent) : undefined;
  const attempt = await journal.begin(stage, id, agent);
  try {
    const result = await session({
      agent,
      stage,
      card: id,
      systemPrompt: [
        unattended,
        completion,
        ...(clean ? [] : [dirtyTree]),
        ...(resume
          ? [
              "Continue only this author role. Re-read the priority doc (backlog doc view doc-0) and the current card and check source/environment drift.",
            ]
          : []),
      ].join("\n\n"),
      budget: String(Math.min(Number(sessionBudget()), budget ?? Number.POSITIVE_INFINITY)),
      logDirectory: journal.directory,
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
      ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
    });
    await journal.finish(attempt, result);
  } catch (error) {
    if (error instanceof SessionFailure) await journal.finish(attempt, error.result);
    throw error;
  }
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
  resume = false,
): Promise<void> {
  guardStop();

  const before = await card(id);

  refuseUnrunnableCard(id, before);
  if (before.status === "Done") {
    if (resume) throw new Exit(1, "a Done card has no author stage to resume");

    journal.requireSettledAttempts();
    await refuseWorkLeftBehind();
    journal.record.completed = true;
    await journal.save();
    say(`${id} is Done`);
    return;
  }

  const stage = stageForCard(before);
  const agent = agentForStage(plan, stage);
  await runStage(journal, stage, id, agent, resume);

  const after = await card(id);
  if (
    after.status !== before.status ||
    (stage === "shape" && (await advanceShapedCard(id, after)))
  ) {
    return;
  }

  throw new Exit(2, `${id} stayed in ${before.status}`);
}

async function advanceShapedCard(id: string, after: Card): Promise<boolean> {
  if (after.status !== "Shape") return false;

  if (stageForCard(after) !== "shape" || after.criteria === 0) return false;

  // To Do maps to the shape skill, which refuses a shaped card, so a shaped card
  // sent there never moves again.
  await setStatus(id, "Build");
  say(`${id} was shaped and left in Shape, so iterate moved it to Build`);

  return true;
}

function guardStop(): void {
  if (existsSync(stopFile)) throw new Exit(3, "stop file present");
}

// Our own shape session assigns @claude when it moves a card to Build, so only
// another name means the card is held.
function refuseUnrunnableCard(id: string, { status, assignee, labels }: Card): void {
  if (labels.includes("deferred")) throw new Exit(1, `${id} is deferred and cannot run`);

  if (status !== "Done" && stageForStatus(status) === undefined)
    throw new Exit(1, `unknown or unaccepted status: ${status}`);

  const held = assignee && assignee !== ours;
  if (inProgress(status) && held) {
    throw new Exit(1, `${id} is held in ${status} by ${assignee}`);
  }
}

async function refuseDirtyTree(id: string): Promise<void> {
  if (await treeIsClean()) return;

  if (id && (await card(id)).assignee === ours) return;

  throw new Exit(1, "the tree is not clean");
}

async function refuseWorkLeftBehind(): Promise<void> {
  if (!(await treeIsClean())) throw new Exit(1, "the tree still holds uncommitted work");
}

async function main(args: readonly string[]): Promise<void> {
  const [argument = "", second = "", ...options] = args;
  if (argument === "--help" || argument === "-h") {
    if (second || options.length > 0) throw new Exit(1, "unexpected arguments; see iterate --help");

    console.log(usage);
    return;
  }

  if (argument === "status") {
    if (options.length > 0) throw new Exit(1, "unexpected arguments; see iterate --help");

    const journal = await Journal.read(second ? cardId(second) : undefined);
    console.log(JSON.stringify(journal?.summary() ?? { run: null }, null, 2));
    return;
  }

  if (argument !== "step" && argument !== "resume")
    throw new Exit(1, "name a card with iterate step <card>; see iterate --help");

  const id = cardId(second);
  const plan = agentPlanFromArgs(options);
  await withJournalLock(() => run(argument, id, plan));
}

async function run(argument: "step" | "resume", id: string, plan: AgentPlan): Promise<void> {
  guardStop();
  sessionBudget();

  await refuseDirtyTree(id);

  const journal = await Journal.open(id, (await card(id)).status !== "Done");
  await advance(journal, id, plan, argument === "resume");
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof Exit)) throw error;

  say(error.message);
  process.exit(error.code);
}
