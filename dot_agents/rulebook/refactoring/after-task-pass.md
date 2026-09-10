# The after-task refactoring pass

This pass runs right after the task, when the structural cost the task exposed is
most visible.

## Look wider than the diff

Litter-pickup in the files you touched is the baseline. The question here is what the
task revealed, asked at the level of boundaries and dependencies: one change that had
to be made in two places (duplicated knowledge); a dependency that runs toward
something volatile; a module that gained a second reason to change; a primitive
carrying domain meaning nobody named; a hierarchy that would be simpler as delegation;
a boundary the task crossed awkwardly. `engineering.md` §Writing the Code,
`coupling.md`, and `refactoring/00-index.md` §Smells are the vocabulary.

Fowler's twenty-four smells and sixty-six refactorings are
`~/.agents/rulebook/refactoring/00-index.md`, each refactoring linked to its own document
under `catalog/` beside it. Take a smell's or a refactoring's name
from the index rather than inventing one, and read the document before citing it: it
carries the mechanics, the example, and the house rules the finding must honor.

## Do or file

Within the active task's authorized scope, finish a small behavior-preserving
refactoring with tests green before and after, in its own commit. Capture an
independent structural opportunity under the board's Capture and admission policy
with the observed cost and proposed outcome. Never leave a restructuring half-done
in the tree.

The goal is the structural opportunity rather than tidiness for its own sake. When
the task exposed nothing, "nothing to refactor" in the handoff is a complete result.
