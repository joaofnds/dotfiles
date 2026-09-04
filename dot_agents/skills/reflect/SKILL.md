---
name: reflect
disable-model-invocation: true
description: The look-back after one card's run has ended, at Done or on a stop. Reads the board's goal, the bet the card carried, and the card's record whole, answers the Coaching Kata's five questions, and leaves a reflection doc with one verdict on the goal (on track, adjust, or pivot) and the planning changes it proposes for the next triage to apply. Use when a card's run has ended, on direction or from the iteration loop. It proposes and never moves a card. Landing a process fix is kaizen, and the code-level pass is refactor.
---

# Reflect

Reflect judges what one card's run showed about the board's goal and proposes the
next step. It writes one doc and nothing else on the board.

## Read before judging

Read the board's goal from the newest triage doc, and the milestone the card belongs
to. Without a goal, write the reflection doc with only that finding and stop, since
nothing else can be judged.

Read the card whole: its description, its bet (the dated note the pick step wrote,
or the newest triage doc's queue line for it), its acceptance list with the evidence
that checked each item, its handoff (what changed, what became possible and is not
wired, what was observed and what was not), its review record, and the commits it
names. A run that stopped short of Done may lack the handoff, the review record,
or the commits. Say which are missing and judge from what is there. Without a bet,
answer question 1 from the acceptance list, say the bet was missing, and name that
as a process defect for kaizen.

Then look once yourself. Run the read-only check or open the screen the card's
observations name, so the actual condition is what you saw and not what the card
claims.

Read the open board and the newest triage doc, so a proposal does not re-derive a
card that exists.

## Answer the five questions

Write the reflection doc as the Coaching Kata's questions, in order, each answered
from the record above.

1. What is the target condition? The milestone this card belongs to, and the bet,
   meaning what this card was expected to make observable about it.
2. What is the actual condition now? What is observable, from the card's evidence
   and your own look. Where the bet and the observation differ, say how.
3. What obstacles stand between here and the goal, and which one is next? Name what
   the run met (a stopped step, a budget that ran out, a stand-in for the goal, a
   defect found) and what the handoff says became possible.
4. What is the next step, and what do you expect from it? One card, existing or
   proposed, with the observation it should produce. This is the proposal for the
   next bet, which triage writes with its budget.
5. When can João go and see? The thing he can open, run, or read to check the
   increment himself, and whether it is there now.

## The verdict

Close the doc with one of three words and the evidence that picked it.

- On track: the bet held and the next step continues the goal.
- Adjust: the goal stands and the plan changes. The proposals say how.
- Pivot: the evidence says the goal itself should change. Say what the evidence is
  and what goal it points to. Changing the goal is João's call, so end there.

A card that stumbled on its approach is adjust. Pivot names evidence about the goal,
not about the card.

## Proposals, not edits

List the planning changes as proposals, each with its reason: a card to add (title
and the observation it targets), a card to close (what overtook it), a split, a
reorder, a dependency. Reflect moves no card, so that triage, the session that
moves cards, applies the proposals with the whole board in view. A process defect,
something the corpus should have prevented, is one line naming the moment, for
kaizen. A structural opportunity in the code is one line, since refactor already
ran inside build.

## The record

Create the doc through the backlog CLI, titled "reflection: <card id>". A file
written by hand under the docs directory has no id and the CLI does not list it.
Attach it and commit it before you return, because the doc is the whole of what this
run leaves and the session that started you may not run again.

The reply to João is the brief: the verdict, the next bet, and what he can go and
see. Everything else stays on the doc.
