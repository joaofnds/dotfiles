---
name: board
description: Governs a session's use of the backlog board, the column a card sits in, the status it claims, the record it keeps, and the CLI's refusals and replace-not-append behavior. Use before any backlog command or card move, in any project.
---

# Board

All work runs through the backlog board, the `backlog` CLI. The board is where
João and the other sessions see what is in flight. Your transcript is not where
they look. The skills own the process and the board holds state only: never adopt
backlog's own `instructions` or agent-guide output as process truth.

## Columns

A card sits in To Do, Shape, Build, Review, or Done. Shape, Build, and Review are
the steps a task may take, and each has a skill of the same name that owns the
work there. The column names the work the card is waiting for. A task takes only
the steps that benefit it. Skipping needs no ceremony, backward moves are legal,
and a card may be created directly in any column, which is how small work skips
the front half. Directed work that an existing card describes is that card. Work
it and move it. Review holds only a review in flight; never leave a card parked
there. Done means closed out.

## The status is a claim

A card's status is a claim like any other, and only the session doing the work
can keep it true. Set it to the column you enter when you pick the card up, with
@claude as assignee, and to the next step, or Done, when you finish, in the same
turn as the work. A card left in a column whose work is finished tells the next
session the wrong thing. Before ending a turn that changed card state, put what
changed on the card.

## The guard

The CLI enforces schema, not workflow. It accepts a Done move with unchecked
criteria, a forward move over an open dependency, and an attachment path that
does not exist. Refuse all three yourself, before issuing the command:

- Before moving a card to Done, read its JSON; when any acceptance criterion is
  unchecked, refuse, unless the card carries a `partial` or `abandoned` label,
  which is the sanctioned early closeout and goes on only at João's direction,
  with the reason in the final summary.
- Before a forward move, read the card's dependencies; when any listed card is
  not Done, refuse. Backward moves are exempt.
- Before passing a path to `--doc` or `--ref`, check it exists.

A refusal is not an error to route around. Report the blocked operation and what
unblocks it: check the criterion with evidence, close the dependency, create the
file first.

## The card is the record

The task's own card holds its documents. The next session reads only the card. A
dated triage doc answers "what's next" while it is newer than the board, and a
directed triage run is the other session that moves cards.

Documents are hand-editable markdown in flat `backlog/docs/`, attached with
`--doc`, never inlined into a task field. Title them for their stage and feature,
with no date stems, and say the doc path and the card id after attaching. A file
that legitimately lives elsewhere in the repo attaches with `--ref` instead.

A feature too big for one build session becomes a parent card with one child per
milestone, each child carrying its own document and acceptance criteria. Park the
parent in Build, create the children in Build, chain them in sequence with
`--dep`, then add every child as a dependency of the parent. That order is load
bearing: once the child dependencies exist, the guard's refusal keeps the parent
from moving until every child is Done. A unit of work stays a checkbox inside the
plan document unless it warrants its own context, acceptance criteria, or
documents.

Closing a card records the outcome: the final summary carries what landed and
what is next, and a leftover item routes by its disposition. A blocking item
becomes a card without asking, a decision becomes a card once João says yes, and
a note stays a note on the card.

## The CLI

Every board change goes through the CLI, never by editing the files, so the
metadata stays consistent. Never run `backlog init`: it writes backlog's own
workflow-instruction block into the repository's agent instructions, a second
source of process truth. Where a repository has no board and the work needs one,
create it by hand: confirm the board directory is git-ignored, make the tasks and
docs directories, and copy the config from `~/.agents/backlog-config.yml`, naming
the project for its directory.

Read card state from the card's JSON, and check the envelope's schema version
first: an unexpected value is a stop-and-report condition, not a guess.

Every value flag on an edit replaces its field rather than extending it, so a
command naming one value silently drops the values already there. Use the
additive sibling where the CLI has one, appending notes rather than setting them,
since setting them overwrites a handoff. Where a flag has no additive sibling,
read the current values and pass every one you are keeping in a single command.
The review-instructions skill's external-facts reference holds the probes these
behaviors rest on, and the trigger that re-verifies them.
