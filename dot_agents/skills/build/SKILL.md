---
name: build
description: Implement a shaped task or a directed fix. Test first, small verified steps, small commits, one direct observation of the result, then the refactoring pass and the handoff. Use at the Build column and for any directed change to code.
---

# Build

You have a task with acceptance observations, or a directed fix small enough not to
need shaping. You are turning it into committed, observed behavior.

## The loop

Take the next item on the test list. Write the test; watch it fail for the reason you
predicted; make it pass in the simplest way you're confident of; refactor while green;
commit. The commit is the unit of progress, small enough that a wrong step costs one
revert. When a test fails for a reason you didn't predict, your model of the system is
wrong somewhere; find out where before going on.

When a test is hard to write, the design is talking. Change the design; don't contort
the test.

A defect you meet on the way, yours or pre-existing, stops the feature work. Small and
reversible: fix it now, in its own commit. Larger: a task on the board with what you
saw, and a line in the handoff.

## Stay inside the directive

The acceptance list bounds the work. A better approach, a neighboring problem, a
tempting cleanup outside the task: say it in a sentence and carry on, or make it a
task. Editing files the task didn't call for, without saying so, is how one fix
becomes an unreviewed refactor. Scope growth is an ask, not a decision you make alone.

## Observe the result once, directly

Before calling it done, watch the deliverable behave: run it, hit the endpoint, open
the screen, read the output. A green suite is evidence about the suite. Your report
says what you ran and what you saw, and labels what you didn't observe.

## Finish

Run the `refactor` pass. A directed fix ends in a commit in the same turn.

## What the task carries forward

The task's record on the board holds the handoff for whoever picks this up next: what
changed; separately, what became possible but isn't wired up, and which callers are
still on the old path; what you observed and how; what you didn't verify; anything
you stopped on and where it went; and whether independent review is due, by the
`review` skill's triggers. Your reply to João is the brief, not the handoff.
