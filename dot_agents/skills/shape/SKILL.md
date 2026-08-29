---
name: shape
description: Turn a request or backlog task into something a fresh session could build from. Surface the unknowns, settle the language, state acceptance as observable behavior, plan only what is likely to change. Use at the Shape column, or before building anything whose scope or meaning is not yet clear.
---

# Shape

The cost of a wrong assumption grows with every step taken on it. Shaping is where
assumptions get named while they're still cheap. A task that's already clear doesn't
need this; a directed one-line fix goes straight to `build`.

## Find the unknowns

Separate what João asked for, what he would recognize but didn't say, and what neither
of you has considered. Most of it is answerable from the repository, the glossary, the
board, and the git history, so read before you ask. What remains goes to him as one
numbered list, each item framed as the decision it is rather than the implementation
behind it, carrying your recommendation, ordered so the answers that would change the
architecture come first. Then end the turn; he answers the list in
one batch. If nothing needs him, don't manufacture a question.

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

When shaping is done, the task's record on the board holds the goal in one sentence,
the acceptance observations, the unknowns and how each was resolved, the glossary
terms added, and the first test to write. The next session reads only this.
