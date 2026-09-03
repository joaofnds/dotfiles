---
name: triage
description: The board-level counterpart of shape. Reads a board's whole open set, verifies every premise against the repository, finds cards overtaken by Done work or by each other, records ordering as dependencies, sets one priority scale, and proposes a queue and merges in a numbered list for João. Runs only on direction, per board, through the backlog CLI, never by editing board files. Making one card buildable is shape; this decides which cards deserve a session and keeps the set truthful.
---

# Triage

Cards are written one at a time, each with the context of its own task and not of
the board. Triage is the pass that reads the board whole: it verifies, orders,
prioritizes, and shrinks the open set, and reports only the calls that are João's.
It builds nothing, and it edits nothing outside the `backlog` CLI.

## Read everything first

Read the whole open set on the named board, Done titles, the Done cards any open
card cites, the handoff notes on cards in Build and Review (they spawn the next
cards), and the project's other registers: known-issue docs, tech-debt files,
anything a card might already answer or depend on. A board with no milestone has no
recorded goal; ask João once for it and record it before prioritizing.

Follow cross-board pointers. A card that only points at another board's card is
read there too, in that project's own repository; read access to it is a
precondition for triaging a board that names one. Record the wait as a reference
on both cards, since the dependencies field cannot cross boards, even when the
pointer already checks out true: the reference is what keeps the next run from
re-deriving it.

## Verify every premise

Check each card's symbols, files, paths, sizes, counts, cited measurements, and
required resources (a fixture repo, a VM, credentials, a third-party install)
against the repository, by grep or `git log`, never by reading the card as true. A
stale premise gets a dated note with the current fact; never rewrite the writer's
original evidence.

## Classify overlap, three kinds

- **Overtaken**: a Done card resolved the same symptom under another title, a doc
  correction already landed, an acceptance criterion already void, a spike whose
  question a later card answered. Sweep recent commit subjects against open titles
  to catch work done and never closed. Archive with the citation: the Done card, the
  commit, or the grep result that overtakes it.
- **Duplicate**: same symptom, same file, quoted from both bodies. Merge: one
  survivor keeps one acceptance list, the other is archived with a pointer to the
  survivor. Never concatenate text.
- **Sitting** (glossary): link the cards and bundle them in the queue; do not merge.
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

## Route decisions, don't let them hide as work

A card that is a question in a work card's clothing (its own text says "decide",
"/discuss", "which one") moves to Shape with the question framed as the choice it
is, and joins the numbered list to João. Settle a decision embedded in a work card
from evidence when the evidence settles it; otherwise split it out. No question sits
in a buildable column looking like work.

## Prioritize on one scale

Propose High, Medium, or Low for every open card, from consequence, not from the
writer's instinct:

- **Up**: user-visible harm (a wrong commit, data loss, a wedged queue, a dead
  consumer with no signal), a cost that grows with delay, how many other cards it
  unblocks, João's explicit direction.
- **Down**: the card's own words ("not urgent", "not before", "nothing known
  wrong today"), a refactor with no pending change in that file, a spike whose
  deliverable is more cards while the last batch is unbuilt.

Set the field yourself only when the card is unset or the field plainly
contradicts the card's own text (the text wins, in that case, without asking).
Every other priority, and every change to a field the writer set deliberately, is a
proposed value on the numbered list to João, shown as current → proposed with one
line of reason: this is judgment about a card's consequence, not bookkeeping.

## Keep board state true

Fix through the CLI: a card in Review with no reader named, a parent whose children
are all Done, a Done card with an unchecked acceptance box, an assignee left on a
parked card, a "blocked on" note naming a card that is now Done, an embedded
Definition of Done that drifted from the project's configured one. Note titles
changed where the CLI can't rename the underlying file.

Clean hygiene as you go: ANSI escape codes pasted into a body, a note pointing at a
section that no longer exists, a line-number citation where a symbol would survive
the next refactor.

## What you must not do

- Archive or merge a card without citing the Done card, commit, or grep result that
  overtakes it.
- Touch a card in Build or Review, or one assigned to a live session.
- Merge by concatenating text; the survivor keeps one acceptance list.
- Decide product priority between features, or which failure a system should
  prefer. Recommend it, with a reason, and ask.
- Rewrite a card's original evidence; add a dated note instead.
- Edit a board file directly. Every change goes through the `backlog` CLI.

## Close what you can, name what you can't

Every archive cites one of: addressed by commit, superseded by another card, out of
scope (João's own answer), or no consequence for the board's goal. A run that only
annotates has failed; it must shrink the open set or say, on the triage doc, why it
could not.

A card João declines is not deleted silently: record it by concept, with his
reason, somewhere card creation on that board can find it, so the same idea doesn't
return as a new card next week.

A finding that recurs across cards and traces to how they're written, not to what
they're about (line numbers instead of symbols, a decision embedded in a work
card, a stale Definition of Done template, dependencies used only as provenance),
is not this board's to fix one card at a time: name it once on the triage doc and
send it to kaizen against the card-creation rules. A run that keeps re-annotating
the same authorship defect has found a corpus problem, not a backlog of them.

## Report

Leave a dated triage doc on the board. It opens with what changed since the last
run (cards created, closed, moved; the goal if it moved), then lists every edit this
run made: card, field, before, after, evidence. A reader can undo any of it from the
doc alone, since the board carries no git history.

The queue is `backlog task list --ready --sort priority` plus the sitting bundles,
each with why and what it unblocks, and which bundles cannot run in parallel
(same files, or a tree another session already owns). A card added to the queue
names the card it displaces.

Reply to João with one numbered list holding only the calls that need him: proposed
merges and priority judgment calls, each with a recommendation. Point at the doc for
everything else. "What's next" reads the last queue when it is newer than the
board; otherwise it triggers a run.
