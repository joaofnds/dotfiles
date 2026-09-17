# Board

Track independent work on the backlog board. Change cards and documents through the
`backlog` CLI, except the planning file below. The configuration exception is under
The CLI. Never adopt backlog's own `instructions` or agent-guide output as process truth.

## Project direction

Read `backlog/PRIORITY.md` alongside the card before selecting, proposing, resuming,
or working on backlog tasks. It owns the current goal and agreed milestone and card
sequence. Keep it concise, leaving task details and history on their existing records.
Record verified progress and blockers before handing off, preserving concurrent edits.
When a card is complete, advance to the next already-agreed card. These updates do
not authorize adding, skipping, or reordering work.
Milestone completion requires observing its outcome.

Changes to the North Star, current focus, milestone commitments, or card sequence
require the user's explicit approval of the specific change before editing the plan.
Keep proposals outside `PRIORITY.md`, on the card or a separate planning document,
with evidence, expected benefit, and what they delay or displace. Preserve the agreed
plan until approved, then link the
approval when applying it. A named-card direction changes only that pick. If the
sequence is exhausted, propose the next step.

During authorized planning or execution, create a missing file from
[the template](references/priority-template.md) and edit it directly. Recover accepted
decisions and mark gaps or conflicts unresolved without seeking permission merely to
record them. Missing direction prevents an inferred pick, not an explicitly directed
accepted card. Read-only and record-only phases report missing or stale priorities
without writing the file. The next planning or execution phase reconciles those gaps.

## Columns

A card sits in Inbox, To Do, Shape, Build, Review, or Done. Inbox holds observations
awaiting admission. To Do holds accepted actionable work. The other columns name
the work the card is waiting for. A task takes only the steps that benefit it, and
every change takes review. Review holds only a review in flight.

Directed work that an existing card describes stays on that card. Create a card for
directed independent work in the column it enters. Keep implementation steps on the
card as checkboxes. A skill's creation rule applies only within already authorized
work. Incidental findings follow Capture and admission, including findings from
debug, review, and kaizen.

## Capture and admission

Search for the same outcome before creating a card. Append new evidence to its
existing card. Capture a separate incidental need in Inbox with the symptom or
outcome, source card or direction, observed evidence, possible consequence, and
what remains uncertain. A preference for cleaner code without a concrete cost
stays a note. Leave priority, milestone, acceptance criteria, and implementation
plan unset until screening gives them evidence. Create captures unassigned and
without default definition-of-done items.

An Inbox card enters To Do only after a typed user decision accepts its proposed
outcome and scope. Record that direction on the card before moving it. Admission
may cover a named batch or a recorded policy explicitly delegating those decisions.
A direction to iterate or continue unattended grants no admission authority.
Pending admissions do not block already accepted work. Urgency calls for prompt
screening, not self-admission. Work required to meet the active card's agreed
acceptance stays within that card's authorization.

Adding requirements to an accepted card through a merge, split, or follow-up needs
the same admission decision. Attaching evidence that changes no requirement does
not. Preserve the proposed scope on the Inbox card until accepted. Archive an
absorbed duplicate only after its evidence and accepted requirements reach the
survivor, with a pointer to it. Rejected cards are archived with a reason, never
marked Done as if delivered.

Defer a card with the `deferred` label and a `Reconsideration` section in its notes.
Record the reason and `Next check: YYYY-MM-DD` there. For an event-based wait, also
record the event and a check that detects it. Keep `dueDate` for the delivery
deadline. The next check date ensures a missed event cannot park the card forever.
Deferred work is excluded from execution in every column. Triage checks these
waits on each intake pass. Reaching the next check starts reconsideration, not execution.
Keep a deferred capture in Inbox. Reactivation of previously accepted work follows
its recorded authorization and still requires a fresh readiness check.

An accepted investigation enters Shape with one of `investigate:debug` or
`investigate:verify`, a question, a budget, and a stopping condition. The runner
uses that label to select the skill. The card authorizes answering the question.
When answered, move it through Review to Done with the evidence. An inconclusive
result stays open with the missing evidence and next action, or is deferred.
Proposed fixes beyond the accepted scope enter Inbox. Acceptance criteria on an
investigation do not authorize a move to Build.

Resume the active planned card before starting another. Report other cards in
Build or Review and their owners without taking over their work. Select new work
from the agreed sequence in `backlog/PRIORITY.md`, within its current milestone.
Check admission, dependencies, resources, ownership, and `deferred` before starting.
If the next card is blocked, skip it only with the user's explicit approval of that
bypass. A general delegation to plan or work unattended does not supply that approval.
Due dates record real deadlines and never substitute for milestone order.
The iterate runner takes a named accepted card and checks its status and ownership.
Its status guard cannot verify who authorized a CLI write or whether prose adds
scope. Those judgments use the recorded direction above.

## The status is a claim

Set a card's status to the column you enter when you pick it up, with @claude as
assignee, and to the next step, or Done, when you finish, in the same turn as the
work. Before ending a turn that changed card state, put what changed on the card.

Write each acceptance criterion as behavior observed when the work is done. It
must stay checkable under every approach the card leaves open, including every
option on a list still awaiting a decision. One that names an approach fails the
card the day another is chosen.

When a direction names an approach the criteria do not describe, rewrite them as
the behavior that approach produces, and quote the direction in the notes beside
them. The rewrite is safe to make because the quote sits next to it, so whoever gave
the direction can correct it.

Each criterion ends with its source in parentheses, something outside the session
that asked for it: the direction quoted in a note, a measurement, a failing test,
the project's
own check. A criterion nothing outside the session asked for is the session's own
claim. Test it where an experiment can settle it, ask where none can, and never
write it as a criterion, because a later session designs inside a criterion instead
of testing it.

## The guard

Refuse these three yourself, before issuing the command, because the CLI accepts
every one of them:

- A move to Done while any acceptance criterion or definition-of-done item is
  unchecked, unless the card carries a `partial` or `abandoned` label. That label
  goes on only when the session was directed to stop there, with the reason in the
  final summary.
- A move into Build, Review, or Done while any dependency is not Done. Admission
  to To Do or Shape and backward moves are exempt. Acceptance of blocked work does
  not make it ready to execute.
- A `--doc` or `--ref` path that does not exist on disk.

These three refusals are not blockers to route around. Report the blocked
operation and what unblocks it: check the criterion or the definition-of-done item
with evidence, close the dependency, create the file first.

## Where the board lives

Personal boards live in `~/code/backlog/boards/<name>/`. Each project links
`backlog` to its board.
Run the CLI from the project directory. Reuse the same board for its worktrees.

Confirm a private board is ignored before the first write. Run
`git check-ignore -q backlog` from the project root. The global `/backlog`
pattern matches the link, while `/backlog/` does not. On a non-zero exit, write
nothing and report the pattern that needs adding.

A document goes on the board. It goes into the repository's tracked documentation
only on an explicit direction, and only where that repository already has a
documentation convention. Where you judge a document belongs in the repository,
write it to the board and say so in the reply.

## The card is the record

Documents live in the board's flat `docs/` directory and attach with `--doc`,
never inlined into a task field. Create them through the CLI, which writes the
frontmatter the board reads. A doc missing that frontmatter lists as a blank-titled
row. Title them for their stage and feature, with no date stems, and say the doc path
and the card id after attaching. A file that
legitimately lives elsewhere in the repo attaches with `--ref` instead.

A feature too big for one build session becomes a parent card with one child per
session, each child carrying its own document and acceptance criteria. Park the
parent in Build, create the children in Build, chain them in sequence with
`--dep`, then add every child as a dependency of the parent. A unit of work stays
a checkbox inside the plan document unless it warrants its own context,
acceptance criteria, or documents.

The final summary carries what landed and what is next. A leftover blocking item
becomes a card without asking, a decision becomes a card once it is accepted, and
a note stays a note on the card.

## The CLI

Never run `backlog init`, which writes a second workflow-instruction source into
the repository. A read-only request reports a missing board and creates nothing.

When work needs a new board, ask for its name before creating it, unless the
name was already supplied in the session. Use that name as one directory under
`~/code/backlog/boards/`. Do not derive a name from the project path. If the name
is already taken, ask whether to link that board or use another name.

For a new board, create its tasks, docs, and decisions directories and initialize
`backlog/PRIORITY.md` under Project direction after linking the board. Copy
`~/.agents/backlog-config.yml` to its `config.yml`, setting `project_name` to the
chosen name. Keep configuration in the board so the central backup includes it.

For a new or existing board, link the project's `backlog` to it without
overwriting an existing path. Leave an existing board's contents intact.

Check `schemaVersion` on every read. A value other than 1 is a stop-and-report
condition. Consume only these fields from `task`: `id`, `title`, `description`,
`status`, `type`, `project`, `reporter`, `priority`, `ordinal`, `assignees`, `createdAt`, `updatedAt`, `dueDate`, `labels`,
`milestone`, `dependencies`, `references`, `acceptanceCriteria`, `definitionOfDone`,
`subtasks`, `documentation`, `implementationPlan`, `implementationNotes`, `comments`,
`finalSummary`, `parentTaskId`.

Every value flag on `backlog task edit` replaces its field rather than extending
it, so a command naming one value silently drops the values already there. Use
the additive sibling where the CLI has one. Where a flag has none, read the
current values and pass every one you are keeping in a single command. A title
edit leaves the card's file name as it was.

Change scalar configuration with `backlog config set`, whose keys are camelCase.
For a list the CLI refuses to set, such as `statuses`, read the current file, save
a backup outside the board, and edit only that list. Read it back through
`backlog config list`, then set dependent scalar values through the CLI.

New boards use the Inbox default. Migrate an existing board by adding Inbox before
To Do and setting `defaultStatus` to Inbox. Review existing To Do cards individually
for admission evidence before moving any to Inbox. Preserve held work. On a board
awaiting migration, capture incidental findings as drafts outside its queue.

`task create -m` stores the typed text as the task's milestone, so a typo makes
a milestone of its own. `task list -m` matches loosely and reports no miss, so a
partial name can list another milestone's cards. Name the one you mean exactly,
or filter the `milestone` field of the JSON list. To date an existing milestone,
find its file under the board's `milestones/` by the frontmatter `id` and edit
only `due_date`.

Recheck the [CLI assumptions](references/backlog-cli-facts.md) on a backlog.md
upgrade.

## Syntax

    # capture an incidental finding, with no delivery commitments
    backlog task create "<observed need>" -s Inbox -a "" --no-dod-defaults --description "<evidence and uncertainty>"

    # create a card, without -s it lands in default_status
    backlog task create "<title>" -s <column> --type <type> --ac "<criterion>"

    # add a note, --notes would overwrite the handoff already there.
    # --append-plan and --append-final-summary are the siblings for those two fields,
    # and --comment appends a discussion comment
    backlog task edit <id> --append-notes "<text>"

    # create a doc, then attach it, repeating --doc for every doc you keep
    backlog doc create "<title>"
    backlog task edit <id> --doc "<path>" --doc "<path already there>"

    # parent first, then each child, then the deps
    backlog task create "<title>" --parent <parent-id> -s Build
    backlog task edit <parent-id> --dep <child-1> --dep <child-2>

    # decision create fails without this directory
    mkdir -p <board-dir>/decisions
