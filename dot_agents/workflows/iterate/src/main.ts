import { existsSync } from "node:fs";
import process from "node:process";
import { agentsFromSpec, agentsHelp, defaultAgent, type Stage, type StageAgent } from "./agents.ts";
import {
  acceptedQueue,
  appendNote,
  boardHasActiveMilestone,
  type Card,
  card,
  cardId,
  pick,
  setStatus,
  stageForStatus,
} from "./board.ts";
import { Exit, say } from "./exit.ts";
import { idleMinutes, session } from "./session.ts";
import { stopFile, treeIsClean } from "./tree.ts";

const usage = `iterate [card]        one whole iteration, unattended
iterate start          screen Inbox, pick accepted ready work, write its bet, print it
iterate step <card>     one session: the card's column, or reflect when it is Done

The loop on the board in the current directory. An iteration is triage, pick, the
card through its columns, reflect, each one a fresh agent session running that
stage's skill. start and step do the same work one session at a time, so a caller
can read what a stage did before starting the next. Live agent text and tool calls
stream to stderr. step prints the final reply on stdout. ITERATE_SESSION_BUDGET
caps each claude session in dollars (default 50), and a session silent for
${idleMinutes} minutes is stopped and counts as failed.

${agentsHelp}

Every session is told nobody is at the keyboard. Admissions follow the board's
recorded policy: require the user's batch decision unless explicitly delegated.
A direction to iterate or continue unattended does not delegate admission.
Intake screens Inbox and due or triggered deferrals; pick
considers only cards accepted before intake and ready afterward, in To Do, Shape,
Build, or Review, excluding deferred labels. Pending intake does not stop accepted
work. Explicit card arguments and step also refuse Inbox, unknown columns, and
deferred cards. A normal shape session that leaves criteria on a card in Shape
gets moved to Build here. Shape cards labeled investigate:debug or investigate:verify
run that skill; their explicit verdict controls the next column. A whole iteration
runs a stage again when it wrote on the card without moving its column, up to the session cap, and stops when a stage wrote
nothing at all, since the next run would see the same card. A dirty tree is handed
to the stage as the previous session's unfinished work when the card is assigned
to @claude, and refused otherwise.

Exit codes: 0 done, 1 refused or failed, 2 the column did not move and nothing on
the card let iterate advance it, 3 the stop file .iterate-stop is present, 4 the
board has no active milestone.`;

const ours = "@claude";
const sessionCap = 6;
const unattended = `This session is one stage of an iteration running unattended. Nobody is at the keyboard, so the Acting section's rule for no one at the keyboard holds, and a turn that ends on a question stalls the loop. Finish this stage's work in this session, with each decision you took and its reason on the record this stage writes, since the next session reads only the board. New Inbox admissions and scope-expanding merges follow the board's admission policy: require the user's batch decision unless a recorded policy explicitly delegates those decisions. Reactivation of deferred work follows its recorded admission/reactivation policy; without recorded authorization, propose reactivation for the user's batch decision. A direction to iterate or continue unattended does not delegate admission. An unattended iteration cannot supply the user's decision. Record a proposed batch, leave pending candidates outside the accepted queue, and continue already accepted work.`;
const dirtyTree = `The tree carries uncommitted changes. Read them before anything else. Those that belong to this card are the previous session's unfinished work on it, yours to finish and commit. Leave any other change as you found it.`;

function agentFor(stage: Stage): StageAgent {
  return agentsFromSpec(process.env.ITERATE_AGENTS ?? "").get(stage) ?? defaultAgent;
}

function sessionBudget(): string {
  const value = process.env.ITERATE_SESSION_BUDGET || "50";
  if (!(Number(value) > 0)) throw new Exit(1, `${value} is not a session budget in dollars`);

  return value;
}

async function runStage(stage: Stage, id: string): Promise<void> {
  const clean = await treeIsClean();
  await session({
    agent: agentFor(stage),
    stage,
    card: id,
    systemPrompt: clean ? unattended : `${unattended}\n\n${dirtyTree}`,
    budget: sessionBudget(),
  });
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

type Progress =
  | { readonly kind: "advanced" }
  | { readonly kind: "reflected" }
  | {
      readonly kind: "stayed";
      readonly column: string;
      readonly stage: Stage;
      readonly changed: boolean;
    };

async function advance(id: string): Promise<Progress> {
  guardStop();

  const before = await card(id);

  refuseUnrunnableCard(id, before);
  if (before.status === "Done") {
    await runStage("reflect", id);
    await refuseWorkLeftBehind();
    await refuseSilentReflection(id, before.text);
    say(`${id} is Done`);
    return { kind: "reflected" };
  }

  const stage = stageForCard(before);
  await runStage(stage, id);

  const after = await card(id);
  if (
    after.status !== before.status ||
    (stage === "shape" && (await advanceShapedCard(id, after)))
  ) {
    return { kind: "advanced" };
  }

  return { kind: "stayed", column: before.status, stage, changed: after.text !== before.text };
}

async function triageAndPick(): Promise<string> {
  if (!(await boardHasActiveMilestone())) throw new Exit(4, "the board has no active milestone");

  const accepted = new Set(await acceptedQueue("all"));

  await runStage("triage", "inbox");

  const id = await pick(accepted);
  if (!id) return "";

  refuseUnrunnableCard(id, await card(id));
  const today = new Date().toISOString().slice(0, 10);
  await appendNote(
    id,
    `Bet, ${today}: picked first from work accepted before this intake pass and still ready afterward. The card's recorded outcome is the bet.`,
  );

  return id;
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
  if ((status === "Build" || status === "Review") && held) {
    throw new Exit(1, `${id} is held in ${status} by ${assignee}`);
  }
}

async function runCard(id: string): Promise<void> {
  if ((await card(id)).status === "Done") {
    say(`${id} was already Done`);
    return;
  }

  for (let sessions = 0; ; sessions += 1) {
    if (sessions === sessionCap && (await card(id)).status !== "Done") {
      throw new Exit(1, `${id} passed the ${sessionCap} session cap without reaching Done`);
    }

    const progress = await advance(id);
    if (progress.kind === "reflected") return;

    if (progress.kind === "advanced") continue;

    if (!progress.changed) {
      throw new Exit(
        2,
        `${id} stayed in ${progress.column} and the ${progress.stage} stage wrote nothing on it`,
      );
    }

    say(`${id} stayed in ${progress.column}`);
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

async function refuseSilentReflection(id: string, before: string): Promise<void> {
  const after = await card(id);
  if (after.text === before) throw new Exit(1, `the reflect stage wrote nothing on ${id}`);
}

async function main(argument: string, second: string): Promise<void> {
  if (argument === "--help" || argument === "-h") {
    console.log(usage);
    return;
  }

  guardStop();
  sessionBudget();
  agentsFromSpec(process.env.ITERATE_AGENTS ?? "");

  if (argument === "step") {
    const id = cardId(second);
    await refuseDirtyTree(id);
    const progress = await advance(id);
    if (progress.kind === "stayed") throw new Exit(2, `${id} stayed in ${progress.column}`);

    return;
  }

  if (argument === "start") {
    await refuseDirtyTree("");
    const id = await triageAndPick();
    if (!id) {
      say("the queue is empty");
      return;
    }

    console.log(id);
    return;
  }

  let id = argument ? cardId(argument) : "";
  if (id) {
    await refuseDirtyTree(id);
    refuseUnrunnableCard(id, await card(id));
  } else {
    await refuseDirtyTree("");
    id = await triageAndPick();
    if (!id) {
      say("the queue is empty");
      return;
    }

    say(`picked ${id}`);
  }

  await runCard(id);
}

try {
  await main(process.argv[2] ?? "", process.argv[3] ?? "");
} catch (error) {
  if (!(error instanceof Exit)) throw error;

  say(error.message);
  process.exit(error.code);
}
