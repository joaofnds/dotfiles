---
name: shape
description: Turns a request or backlog task into something a fresh session could build from. Surfaces the unknowns, settles the language, states acceptance as observable behavior, plans only what is likely to change. Use at the Shape column, or before building anything whose scope or meaning is not yet clear. Importing an instruction resource into the corpus goes to absorb instead, and a failure whose cause is unknown goes to debug.
---

# Shape

Shaping names assumptions while they're still cheap, before work builds on them. A
task that's already clear doesn't need this; a directed one-line fix goes straight
to `build`.

## Find the unknowns

Separate what João asked for, what he would recognize but didn't say, and what neither
of you has considered. Most of it is answerable from the repository, the glossary, the
board, and the git history, so read before you ask. What remains goes to him as one
numbered list, each item framed as the decision it is rather than the implementation
behind it, carrying your recommendation, ordered so the answers that would change the
architecture come first. Then end the turn; he answers the list in
one batch. If nothing needs him, don't manufacture a question.

A constraint the task inherits is an unknown too. When the request, the card, or a
prior review rules an approach out, find what backs the prohibition. A measurement
backs it. João's explicit decision backs it. A stated reason that predicts cost
without measuring it does not: that reason is the claim to test. When nothing backs
it and the work will be designed around it, run the cheapest experiment that
settles it before you design. An unmeasured prohibition never becomes an acceptance
criterion: once it is one, every later session designs inside it instead of testing
it.

## Settle the language

Every term the task introduces or leans on is in the project's glossary, in the words
João uses for it. A term with two meanings, or an awkward phrase everyone keeps working
around, is the model asking to be made explicit: say so and propose the concept.
Modeling is done with him, not for him.

## State acceptance as observation

Write acceptance as things you will directly observe when the work is done: a test
that fails now and will pass, a command and its expected output, a screen in a state.
"Works" is not an observation. This list becomes `build`'s test list.

## Plan only what will move

Plan where the decision is likely to be revisited: the data model, interfaces between
components, anything user-facing, and for new or untested code, whether a walking
skeleton or characterization tests come first. Mechanical parts don't need a plan.
When the acceptance list is the plan, stop there.

## What the task carries forward

When shaping is done, write onto the task's record the goal in one sentence, the
acceptance observations, the unknowns and how each was resolved, the glossary terms
added, and the first test to write, then move the card to the next column it takes.
The next session reads only the card.

A number the card takes from the repository is written with the command that
produced it and the date you ran it, so a later reader re-runs the command instead
of guessing whether the number drifted. This governs the evidence a card argues
from. Acceptance criteria stay observations of behavior.
