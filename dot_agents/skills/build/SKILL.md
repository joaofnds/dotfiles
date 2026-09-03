---
name: build
description: Implements a shaped task or a directed fix. Test first, small verified steps, small commits, one direct observation of the result, then the refactoring pass and the handoff. Use at the Build column and for any directed change to code.
---

# Build

You have a task with acceptance observations, or a directed fix small enough not to
need shaping. You are turning it into committed, observed behavior. A board task
starts by claiming its card: status Build, assignee @claude.

Before writing code, read the style skill's core reference plus the file for the
task's language and stack, under `~/.agents/skills/style/references/`. The house
patterns the review's style axis checks live there. When the task touches tests,
which building almost always does, load the testing skill too. An instruction
file (a CLAUDE.md or AGENTS.md, a rules file, a skill, an agent definition, an
output style) is written under the review-instructions skill. Load it first, write
in the register its "Before you write" section states, and run its lint after every
edit.

## The loop

Take the next item on the test list and run one turn of the testing skill's TDD
loop: red for the predicted reason, the simplest green, refactor, then commit. The
commit is the unit of progress, small enough that a wrong step costs one revert. An
unpredicted failure and a hard-to-write test are that skill's design signals. Stop
and answer them before going on.

A defect you meet on the way, yours or pre-existing, stops the feature work. Small and
reversible: fix it now, in its own commit. Larger: a task on the board with what you
saw, and a line in the handoff.

## Stay inside the directive

The acceptance list bounds the work. A better approach, a neighboring problem, a
tempting cleanup outside the task: say it in a sentence and carry on, or make it a
task. Editing files the task didn't call for, without saying so, is how one fix
becomes an unreviewed refactor. Scope growth is an ask rather than a decision you
make alone.

## Observe the result once, directly

Before calling it done, watch the deliverable behave: run it, hit the endpoint, open
the screen, read the output. A green suite is evidence about the suite. Your report
says what you ran and what you saw, and labels what you didn't observe.

## Finish

Run the `refactor` pass. Then move the card: check the acceptance criteria your
evidence proves, write the final summary naming what you observed, and set the status
to the next step the task takes: Review when the `review` skill's triggers apply,
otherwise Done. A directed fix ends in a commit in the same turn, and its card, when
one exists, moves with it.

## What the task carries forward

Write onto the task's record the handoff for whoever picks this up next: what
changed; separately, what became possible but isn't wired up, and which callers are
still on the old path; what you observed and how; what you didn't verify; anything
you stopped on and where it went; and whether independent review is due, by the
`review` skill's triggers. Your reply to João is the brief. The handoff stays on the
record.
