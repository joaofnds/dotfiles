---
name: shape
description: Turns a request or backlog task into something a fresh session could build from. Use before building anything whose scope or meaning is not yet clear. A failure whose cause is unknown goes to debug first.
---

# Shape

Shaping names assumptions while they're still cheap, before work builds on them. A
task that's already clear doesn't need this. A directed one-line fix goes straight
to `build`.

## Find the unknowns

Separate what the request asked for, what it assumes without saying, and what nobody
has considered yet. Most of it is answerable from the repository, the glossary, the
board, and the git history, so read before you ask. What remains goes back as one
numbered list, each item framed as the decision it is rather than the implementation
behind it, carrying your recommendation, ordered so the answers that would change the
architecture come first. Then end the turn, since the list is answered in one batch.
Where nothing is genuinely open, don't manufacture a question.

A constraint the task inherits is an unknown too, whether the request, the card, or
a prior review rules an approach out or takes something as required. Find what
backs it. A direction backs it, and so does a measurement of the need. A reason
that predicts cost without measuring it backs nothing, and neither does a probe of
a mechanism. What a session derived from a direction is that session's claim, and
a claim is tested, never inherited. When nothing backs a constraint and the work
will be designed around it, look first for the path on which it never arises,
since that path settles it at no cost. Then run the cheapest experiment that
settles what remains before you design. What no experiment can settle goes on the
numbered list as the decision it is.

## Settle the language

Every domain term the task introduces or leans on is in the project's glossary, in
the words the project already uses for it. A term of the implementation stays out of
it. A term with two meanings, or an awkward phrase everyone keeps working around, is
the model asking to be made explicit, so say so and propose the concept. Never settle
a naming alone. It goes on the numbered list and lands confirmed.

## State acceptance as observation

Write acceptance as things you will directly observe when the work is done: a test
that fails now and will pass, a command and its expected output, a screen in a state.
"Works" is not an observation. This list becomes `build`'s test list. Each
criterion carries its source in the form the board rules give.

## Pick the approach, then harden it

The survey opens with the option that removes the problem, the move
`~/.agents/rulebook/engineering-judgment.md` §Understanding the Problem names: delete
the thing, drop the requirement, leave it undone. Say what rules it out and how you
know. When nothing does, it is the pick. A choice put up for decision carries it the
same way (`AGENTS.md` §Acting). Where more than one way to build it survives, set out
each with what it costs and what it buys, and say plainly when only one survives the
evidence. Two or three is the usual number.

Then pick, and interrogate the one you picked until it holds: where it fails, what
it assumes, what it costs to reverse. Something the pick requires from outside the
code, of its input, its caller, or its environment, that nothing on the card asked
for is the signal to reopen the survey at the removal option before you add the
requirement. What survives that survey joins the unknowns. A survey that leans
without deciding leaves the choice to the session that builds, which is the
session with the least context for it. Record the options and the reason the
winner won, so a later session
reopening the question starts from the argument rather than from scratch. When the
build breaks an assumption the pick rested on, the approach is reopened here rather
than pushed through.

Only one way to build it means no survey past the removal option. Say that and move
on.

## Plan only what will move

Plan where the decision is likely to be revisited: the data model, interfaces between
components, anything user-facing, and for new or untested code, whether a walking
skeleton or characterization tests come first. Mechanical parts don't need a plan.
When the acceptance list is the plan, stop there.

## What the task carries forward

When shaping is done, write onto the task's record the goal in one sentence, the
acceptance observations, the unknowns and how each was resolved, the glossary terms
added, and the first test to write. The next session reads only the card.

A number the card takes from the repository is written with the command that
produced it and the date you ran it, so a later reader re-runs the command instead
of guessing whether the number drifted.

## Before the handoff

Run the review skill, the one that sends each product to its reviewer, on the
record you wrote, and dispose of what it returns.
