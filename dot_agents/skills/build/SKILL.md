---
name: build
description: Implements a shaped task or a directed fix. Use when the work is settled enough to write, and for any directed change to code or to an instruction file.
---

# Build

You have a task with acceptance observations, or a directed fix small enough not to
need shaping. You are turning it into committed, observed behavior.

## The loop

Take the next item on the test list and run one turn of the TDD loop in
`~/.agents/rulebook/testing/00-index.md` §Foundational vocabulary: red for the
predicted reason, the simplest green, refactor, then commit. The commit is the unit
of progress, small enough that a wrong step costs one revert. The message is the
delivery skill's. An unpredicted failure and a hard-to-write test are design
signals the testing rules name. Stop and answer them before going on.

A defect in the path of the task stops the feature work. One outside it is closed
before the task is called done. `~/.agents/rulebook/ownership.md` says how.

## Stay inside the directive

The acceptance list bounds the work. A better approach or a tempting cleanup
outside the task: say it in a sentence and carry on, or make it a task. Editing
files the task didn't call for, without saying so, is how one fix becomes an
unreviewed refactor. Scope growth is an ask. It is not a decision you make alone.

The acceptance list says when the work is done. It does not say the work is still
worth doing. Three things end a task besides finishing it: the goal turns out to
cost more than it returns, the approach turns out to be the wrong one, and the
thing you are driving toward turns out to be a stand-in for the goal rather than
the goal. Report any of them with what you now know and end the turn, whatever the
effort already spent. Sunk effort is not a reason, and neither is a nearly-working
approach.

You cannot see any of the three from inside the step, so look between steps rather
than during one. At each commit, read the staged diff against the original words.
A stand-in shows itself when you can make it better by making the real goal worse.

## Observe the result once, directly

Before calling it done, watch the deliverable behave: run it, hit the endpoint, open
the screen, read the output. A green suite is evidence about the suite. Your report
says what you ran and what you saw, and labels what you didn't observe.

Every acceptance criterion gets evidence of one of two kinds: raw output from a check
you ran, or an outside report of a flow this session cannot exercise, never your own
account of one. For a criterion needing
the deployed app or a device you cannot reach, stop and ask for it to be exercised and
for what was observed. Prose review is not runtime verification, and a criterion with
neither kind of evidence stays unchecked.

## Finish

Run the pass in `~/.agents/rulebook/refactoring/after-task-pass.md`. Then run the
review skill, the one that sends each product to its reviewer, and dispose of what
it returns. Then check the acceptance criteria and definition-of-done items your
evidence proves, and write the final summary naming what you observed.

## What the task carries forward

Write onto the task's record the handoff for whoever picks this up next: what
changed; separately, what became possible but isn't wired up, and which callers are
still on the old path; what you observed and how; what you didn't verify; anything
you stopped on and where it went. Your reply is the brief. The handoff stays
on the record.
