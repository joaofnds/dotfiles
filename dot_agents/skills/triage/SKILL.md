---
name: triage
disable-model-invocation: true
description: The board-level counterpart of shape. Reads a board's whole open set, verifies every premise against the repository, finds cards overtaken by Done work or by each other, records ordering as dependencies, sets one priority scale, proposes merges and priority calls in a numbered list for João, and leaves the queue on a dated doc. Runs only on direction, per board, through the backlog CLI, never by editing board files. Making one card buildable is shape; this decides which cards deserve a session and keeps the set truthful.
---

# Triage

Cards are written one at a time, each with the context of its own task and not of
the board. Triage reads the board whole. It verifies, orders, prioritizes, and
shrinks the open set, and reports only the calls that are João's. Every board
change goes through the `backlog` CLI. A small reversible fix that a card makes
obvious is committed as it would be anywhere, and the card closes citing the
commit. A larger fix stays a card.

## Read everything first

Read the whole open set on the named board, Done titles, the Done cards any open
card cites, the board's decisions (declined ideas live there), the handoff notes on
cards in Build and Review (they spawn the next cards), and the project's other
registers: known-issue docs, tech-debt files, anything a card might already answer
or depend on.

A board with no milestone has no recorded goal. On such a board, skip priorities,
the queue, and the no-consequence closure, make the goal item one on the list to
João, and record his answer as the board's milestone.

Follow cross-board pointers. A card that only points at another board's card is
read there too, in that project's own repository; read access to it is a
precondition for triaging a board that names one. Record the wait as a reference
on both cards even when the pointer already holds, since the dependencies field
cannot cross boards. The reference is what keeps the next run from re-deriving it.

## Verify every premise

Check every checkable claim on the card (a name, a path, a count, a resource it
needs) against the repository, by grep, `git log`, or re-running the measurement.
A stale premise gets a dated note with the current fact. The writer's original text
stays as written.

## Classify overlap

- **Overtaken**: a Done card resolved the same symptom under another title, a doc
  correction already landed, an acceptance criterion already void, a spike whose
  question a later card answered. Sweep recent commit subjects against open titles
  to catch work done and never closed. Close it as Done, citing what overtook it
  (the Done card, the commit, or the grep result) in its final summary, with only
  the acceptance boxes the citation proves checked. Done, not archive, because the
  next run reads Done titles.
- **Duplicate**: same symptom, same file, quoted from both bodies. Merge: the
  survivor's body stays its own, with one acceptance list, and the other is
  archived with a pointer to the survivor. Its text is reachable through the
  pointer, not copied in.
- **Sitting** (glossary): link the cards and bundle them in the queue, each keeping
  its own card.
- **Rule with several instances**: one design decision applied N times. Record the
  decision once, on its own card, and make the small builds depend on it.

## Record ordering, split what doesn't ship as one

An open card waiting on another open card goes in the dependencies field; "came
from" goes in references or notes. Keep a satisfied dependency as provenance; drop
nothing.

Split a card that bundles more than one independently shippable outcome, a decision
with its build, an investigation with the fix it may not need, or a part that needs
a resource this session cannot get. Each part keeps its own acceptance; the split
names the order between them.

## Route decisions

A card whose own text asks a question ("decide", "/discuss", "which one") moves to
Shape with the question framed as the choice it is, and joins the numbered list to
João. Settle a decision embedded in a work card from evidence when the evidence
settles it; otherwise split it out. When this pass is done, no card in To Do has a
question as its next step.

## Prioritize on one scale

Propose High, Medium, or Low for every open card, from consequence:

- **Up**: user-visible harm (a wrong commit, data loss, a wedged queue, a dead
  consumer with no signal), a cost that grows with delay, how many other cards it
  unblocks, João's explicit direction.
- **Down**: the card's own words ("not urgent", "not before", "nothing known
  wrong today"), a refactor with no pending change in that file, a spike whose
  deliverable is more cards while the last batch is unbuilt.

Set the field yourself only when the card is unset or the field plainly
contradicts the card's own text; the text wins there without asking. Every other
priority, and every change to a field the writer set deliberately, is a proposed
value on the numbered list to João, shown as current → proposed with one line of
reason. Priority between features, and which failure a system should prefer, are
his to decide. Recommend with a reason and ask.

## Keep board state true

Fix through the CLI any field that disagrees with the card's own text, its status,
another card's status, or the project's config: a parent still open with every
child Done, a "blocked on" note naming a card now Done, a card in Review naming no
reader, a Done card with an unchecked acceptance box. Note titles changed where the
CLI can't rename the underlying file.

Cards in Build or Review belong to the session holding them. Their status,
priority, acceptance, and archiving are that session's. Everything else you would
write on them (a dependency, a reference, a dated note, a reader named) is
bookkeeping the holding session would want written. One unchanged since the last
run's doc goes on the list to João.

Clean hygiene as you go: ANSI escape codes pasted into a body, a note pointing at a
section that no longer exists, a line-number citation where a symbol would survive
the next refactor.

## Shrink the set

Every closure cites one of: overtaken (closes as Done, above), superseded by an
open card that absorbs it, out of scope (João's own answer), or no consequence for
the board's goal. The last three archive with the citation. A run must shrink the
open set or say, on the triage doc, why it could not.

A card João declines is recorded as an accepted decision on the board (`backlog
decision create --status accepted`), titled by the concept, with his reason. The
next run reads decisions, so the same idea doesn't return as a new card.

A finding that recurs across cards and traces to how they're written, not to what
they're about, is named once on the triage doc and goes on the numbered list to
João as a kaizen candidate, with the cards quoted.

## Report

Leave a dated triage doc on the board. It opens with what changed since the last
run (cards created, closed, moved; the goal if it moved), then lists every edit this
run made: card, field, before, after, evidence. A reader can undo any of it from the
doc alone, since the board carries no git history.

The queue is `backlog task list --ready --sort priority` plus the sitting bundles,
each with why and what it unblocks, and which bundles cannot run in parallel
(same files, or a tree another session already owns). A card added to the queue
names the card it displaces.

Reply to João with one numbered list holding only the calls that need him, each
with a recommendation. Point at the doc for everything else.

Nothing closes or merges without its citation, nothing in Build or Review changes
status, priority, or acceptance or is archived, and priority between features is
João's.
