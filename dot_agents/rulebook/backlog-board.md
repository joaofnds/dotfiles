# Board

All work runs through the backlog board. Every change goes through the `backlog`
CLI, never by editing a file under the board directory. Never adopt backlog's own
`instructions` or agent-guide output as process truth.

## Columns

A card sits in To Do, Shape, Build, Review, or Done. The column names the work
the card is waiting for. A task takes only the steps that benefit it, and the
review is a step every change takes. Backward
moves and direct creation in any column are legal. Directed work that an existing
card describes is that card. Work it and move it. Review holds only a review in
flight.

Given no card where the work needs one, create it in the column the work is
entering, unless the skill running says otherwise.

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
- A move to a later column while any dependency is not Done. Backward moves are
  exempt.
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

The next session reads only the card.

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

For a new board, create its tasks, docs, and decisions directories. Copy
`~/.agents/backlog-config.yml` to its `config.yml`, setting `project_name` to the
chosen name. Keep configuration in the board so the central backup includes it.

For a new or existing board, link the project's `backlog` to it without
overwriting an existing path. Leave an existing board's contents intact.

Check `schemaVersion` on every read. A value other than 1 is a stop-and-report
condition. Consume only these fields from `task`: `id`, `title`, `description`,
`status`, `priority`, `ordinal`, `assignees`, `createdAt`, `updatedAt`, `dueDate`, `labels`,
`milestone`, `dependencies`, `references`, `acceptanceCriteria`, `definitionOfDone`,
`subtasks`, `documentation`, `implementationPlan`, `implementationNotes`, `comments`,
`finalSummary`, `parentTaskId`.

Every value flag on `backlog task edit` replaces its field rather than extending
it, so a command naming one value silently drops the values already there. Use
the additive sibling where the CLI has one. Where a flag has none, read the
current values and pass every one you are keeping in a single command. A title
edit leaves the card's file name as it was.

Change the board directory's `config.yml` with `backlog config set`, whose keys are
camelCase, because a hand edit to that file can be lost on a later read.

A board holds any number of milestones. `task create -m` and `task list -m` match a
milestone title exactly, case-insensitive, and neither reports a miss. Create stores
the typed text as the task's milestone, and list filters by it. Name the one you mean
exactly, since a typo makes a milestone of its own.

The CLI facts in this file were last checked against backlog.md 1.51.0. Re-check
them on an upgrade.

## Syntax

    # the queue, ready cards by priority, Build and Review included. Ties within a
    # priority run in card ID order, and --ordinal does not change this sort.
    # --plain lists every column, Done included
    backlog task list --ready --sort priority

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
