---
name: board
description: Governs a session's use of the backlog board, the column a card sits in, the status it claims, the record it keeps, and the CLI's refusals and replace-not-append behavior. Use before reading a card, and before any backlog command or card move, in any project.
---

# Board

All work runs through the backlog board. Every change goes through the `backlog`
CLI, never by editing a file under the board directory. Never adopt backlog's own
`instructions` or agent-guide output as process truth.

## Columns

A card sits in To Do, Shape, Build, Review, or Done. The column names the work
the card is waiting for. A task takes only the steps that benefit it. Backward
moves and direct creation in any column are legal. Directed work that an existing
card describes is that card. Work it and move it. Review holds only a review in
flight.

Given no card where the work needs one, create it in the column the work is
entering, unless the skill running says otherwise.

## The status is a claim

Set a card's status to the column you enter when you pick it up, with @claude as
assignee, and to the next step, or Done, when you finish, in the same turn as the
work. Before ending a turn that changed card state, put what changed on the card.

## The guard

Refuse these three yourself, before issuing the command:

- A move to Done while any acceptance criterion is unchecked, unless the card
  carries a `partial` or `abandoned` label. That label goes on only at João's
  direction, with the reason in the final summary.
- A move to a later column while any dependency is not Done. Backward moves are
  exempt.
- A `--doc` or `--ref` path that does not exist on disk.

These three refusals are not blockers to route around. Report the blocked
operation and what unblocks it: check the criterion with evidence, close the
dependency, create the file first.

## Where the board lives

A board sits at `backlog/` in the repository root, or at the path a root
`backlog.config.yml` names in `backlog_directory`. Never assume the path, and
never relocate a board you find.

Confirm a private board is ignored before the first write. `git check-ignore -q
<board-dir>/config.yml` exits 0 when it is. Probe that child path, never the
directory name, which exits 1 while nothing is on disk yet. On a non-zero exit,
write nothing and tell João the pattern to add.

A document goes on the board, and into the repository's tracked documentation
only at João's direction where that repository already has a documentation
convention. Where you judge a document belongs in the repository, write it to the
board and say so in the reply.

## The card is the record

The next session reads only the card.

Documents live in the board's flat `docs/` directory and attach with `--doc`,
never inlined into a task field. Create them through the CLI, which writes the
frontmatter the board reads. Title them for their stage and feature, with no date
stems, and say the doc path and the card id after attaching. A file that
legitimately lives elsewhere in the repo attaches with `--ref` instead.

A feature too big for one build session becomes a parent card with one child per
session, each child carrying its own document and acceptance criteria. Park the
parent in Build, create the children in Build, chain them in sequence with
`--dep`, then add every child as a dependency of the parent. A unit of work stays
a checkbox inside the plan document unless it warrants its own context,
acceptance criteria, or documents.

The final summary carries what landed and what is next. A leftover blocking item
becomes a card without asking, a decision becomes a card once João says yes, and
a note stays a note on the card.

## The CLI

Never run `backlog init`, which writes backlog's own workflow-instruction block
into the repository's agent instructions, a second source of process truth. Where
a repository has no board and the work needs one, create it by hand. A read-only
request reports that no board exists and creates nothing. Copy
`~/.agents/backlog-config.yml` to a root `backlog.config.yml`, where alone the
`backlog_directory` key is read, naming the project for its directory, and make
the tasks, docs, and decisions directories under the path it names.

Check `schemaVersion` on every read. A value other than 1 is a stop-and-report
condition. Consume only these fields from `task`: `title`, `description`,
`status`, `labels`, `milestone`, `dependencies`, `acceptanceCriteria`, `subtasks`,
`documentation`, `implementationNotes`, `finalSummary`, `parentTaskId`.

Every value flag on `backlog task edit` replaces its field rather than extending
it, so a command naming one value silently drops the values already there. Use
the additive sibling where the CLI has one. Where a flag has none, read the
current values and pass every one you are keeping in a single command.

## Syntax

    # the queue, ready cards by priority. --plain lists every column, Done included
    backlog task list --ready --sort priority

    # create a card, without -s it lands in default_status
    backlog task create "<title>" -s <column> --type <type> --ac "<criterion>"

    # add a note, --notes would overwrite the handoff already there
    backlog task edit <id> --append-notes "<text>"

    # create a doc, then attach it, repeating --doc for every doc you keep
    backlog doc create "<title>"
    backlog task edit <id> --doc "<path>" --doc "<path already there>"

    # parent first, then each child, then the deps
    backlog task create "<title>" --parent <parent-id> -s Build
    backlog task edit <parent-id> --dep <child-1> --dep <child-2>

    # decision create fails without this directory
    mkdir -p <board-dir>/decisions
