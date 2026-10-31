---
name: triage
disable-model-invocation: true
description: Prunes a board to the work that serves the product's user or speeds up building and shipping it, archives the captures that do neither, proposes the accepted cards to cut, and names the next card. Runs only on direction, per board. Detailed design belongs to shape.
argument-hint: "[inbox|full]"
---

# Triage

Leave a board where every open card either changes what the product's user sees,
waits for, or pays, or removes friction the team meets building, testing, shipping,
or deploying it. Archive the captures that fail and propose cutting the accepted
cards that fail. Judge the pass by whether each verdict's reason holds against its
card, never by how many cards go. Work through the `backlog` CLI under
`~/.agents/rulebook/backlog-board.md`, and change no code.

## Scope

`inbox` takes the Inbox cards and every `deferred` card whose next check is due or
missing or whose recorded event has happened. `full`, or no argument, takes every
open card. A card that arrives during the pass waits for the next one.

Read doc-0 for the goal, the milestone, and the card sequence. Read every reflection
doc newer than the last triage doc. Archive a card one proposes to close when it fails
the keep test, and put their other proposals on the reply's list. Without a goal in doc-0, judge by
the keep test alone and put the missing goal first on the list.

Before the first verdict, create the pass's doc titled `Triage <mode> <YYYY-MM-DD>`,
so reflect and the next pass find the newest by that title. List in it every card in
scope and the open-card count at entry and at the end, and give each card a row with its verdict and a
one-line reason as you decide it. The table is the record that undoes a wrong
archive.

## The keep test

Keep a card when one of these holds:

- Its outcome changes what a user sees, waits for, or pays in how the product is
  used now or in the current milestone. A hole a hostile party can reach counts.
- It removes friction the team keeps meeting: a check that is red or has failed more
  than once, or a build, test, release, or deploy step that is still slow or broken.
  A missing check counts only when a defect already got past it to a user. Its reason
  quotes where the friction showed.
- An open accepted card depends on it, or a card in doc-0's sequence cannot proceed
  without it.

A card whose text records a consequence a user meets in normal use, a hole a hostile
party can reach, or friction the team keeps meeting stays, however small the fix.
Archive every other card. Most fail for one of these reasons:

- It handles an edge case that normal use does not produce.
- A cheaper design avoids the case: a limit in the form, a different flow, or the
  platform refusing the input. When the case still matters, rewrite the card to that
  cheaper change and keep it.
- It is cleanup, consistency, a refactor, or a test gap that answers no friction
  anyone met. A review finding counts as friction only once the card records a later
  session meeting it.
- It records a check, build, or deploy failure seen once and not reproduced since,
  which comes back as a capture if it recurs.
- It speculates about a future need, duplicates another card, or rests on a premise
  that no longer holds.

Read each card whole, notes included, before you give it a verdict, since the notes
hold the friction a session met and the later measurements that overturn the
description. An excerpt or a summary of a card is not its text. Every reason quotes
the card: for a keep, the line that shows which test holds, and for an archive, the
line that rules the card out where one does. Read code only where one look settles
the claim the verdict turns on, such as whether the feature still exists. Never
reproduce a card to archive it, since `backlog task restore` undoes an archive and a
need that was cut wrongly comes back as a capture the next time a session meets it.

## Apply

Archive each failing capture with `backlog task archive` after its row is on the doc
and one note on the card gives the verdict, the reason, and the doc. Re-read its
status just before, since another session may have taken it during the pass. Never
archive a card an open accepted card lists as a dependency, and never edit an
accepted card's dependencies, since either changes accepted work. When that card
fails the rest of the keep test, its item on the reply's list also offers dropping
the dependency. A
failing accepted card, in To Do or a later column, entered on a typed decision, so
it goes on the reply's list as a proposed cut, all of them in one item. A held card,
in Build or Review with an assignee, belongs to its session, so append the verdict
to its notes and change nothing but its notes.

Merge a duplicate capture by appending its unique evidence to the survivor's notes,
moving any dependency on it to the survivor, and archiving it with a pointer. A
merge that would archive a card an accepted card lists as a dependency, or add a
requirement to an accepted card, goes on the reply's list instead, since accepted
work changes only on a typed decision.

A kept capture stays in Inbox and goes on the reply's admission list with its
proposed outcome. A kept deferred card whose wait has ended loses the `deferred`
label, and one whose wait still stands gets a new next check.

## Next card and doc-0

The next card is doc-0's next agreed card. Name each blocked card of the sequence,
the next one included, under Next action with the decision it needs, and leave its
line in the sequence as it is. When the sequence
is exhausted, propose on the reply's list the kept card whose delay costs a user or
the team most. Put one queue line on the doc with the next card, its bet (the
observation it should produce toward the goal and how to see it), and its budget,
the recorded one or a bound marked as proposed.

Rewrite every line of doc-0 the board contradicts, such as a Done card shown as
pending, a Next action naming finished work, or a pending count or open question
about a card the pass archived. Cut every other line down to the plan as it stands
now, and each Planning authority entry down to the fields the board rules' Project
direction names. Move what you cut, such as how a session spent its time or what it
checked, into the notes of the card it concerns, or onto the pass's doc when it
concerns no card. Leave the North Star, focus, milestones, and the card sequence's
cards and order as they are.

Reply with what was archived, then one numbered list of the decisions the pass
leaves, each with a recommendation: captures proposed for admission, proposed cuts
of accepted cards, reflection proposals, merges that add scope, and the next
card when the sequence is exhausted.
