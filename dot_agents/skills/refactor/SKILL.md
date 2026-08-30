---
name: refactor
description: The after-task refactoring pass, architectural and not only in-file. Finds the structural opportunity the task just exposed, does the small ones in separate commits, makes tasks of the large ones. Runs at the end of every task, before the handoff.
---

# Refactor

This pass runs right after the task, when the structural cost the task exposed is
most visible.

## Look wider than the diff

Litter-pickup in the files you touched is the baseline. The question here is what the
task revealed, asked at the level of boundaries and dependencies: one change that had
to be made in two places (duplicated knowledge); a dependency that runs toward
something volatile; a module that gained a second reason to change; a primitive
carrying domain meaning nobody named; a hierarchy that would be simpler as delegation;
a boundary the task crossed awkwardly. The doctrine's sections 5 and 7 are the
vocabulary.

## Do or file

Behavior-preserving and small enough to finish now, tests green before and after: do
it, in its own commit, apart from the feature commits, so a reader can skip it or
revert it alone. Anything else becomes a task on the board carrying the case: what the
task exposed, the target structure, and the cost. Never leave a restructuring
half-done in the tree.

The goal is the structural opportunity, not tidiness for its own sake. When the task
exposed nothing, "nothing to refactor" in the handoff is a complete result.
