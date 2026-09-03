---
name: testing
description: The house testing discipline. GOOS-style TDD, harness and driver architecture, Fakes over mocks, test aesthetics, and the done checklist. Load for any task that writes, changes, or reviews tests. The doctrine holds the principles and wins on conflict. The style skill's language files hold the Go and TypeScript spellings.
---

# Testing

The school, the non-negotiables, the shared vocabulary, and the routing to the
reference files. The doctrine skill states the testing principles at one line each;
this skill holds the operational detail under them, and the doctrine wins where the
two seem to differ. The Go and TypeScript spellings of these rules live in the style
skill's language files.

## The school

We practice GOOS-style TDD (Freeman and Pryce, *Growing Object-Oriented Software,
Guided by Tests*): the outside-in design discipline of the London school, where
tests drive the shape of the code, blended with the classical verification bias of
the Detroit school: prefer real collaborators, use Fakes at I/O boundaries, verify
by state and output over interaction. When the two schools conflict, side with
classical.

The single most important property: **tests describe observable behavior, not
implementation.** Every rule in this skill exists to preserve it.

## Non-negotiables

- TDD is the default workflow rather than a preference.
- Framework mocks on our own code are banned. We write Fakes.
- Application-level integration and end-to-end tests reach a running application
  through a Harness and Driver. Focused adapter integration tests may exercise the
  adapter directly. Unit tests may construct behavior with real collaborators and
  boundary Fakes.
- A test without readable Arrange / Act / Assert structure, or without a
  declarative behavior name, is not done.

## Routing

Identify which situation you are in before touching a test, and read the file that
owns it. A silent skip is a process defect, same as skipping a test.

| Situation | Read |
|---|---|
| Scaffolding a feature's test infrastructure: wiring a harness, building a driver, choosing real vs faked dependencies, integration boundaries, isolation | [references/architecture.md](references/architecture.md) |
| Introducing or modifying any test double, or deciding whether to use one at all | [references/doubles.md](references/doubles.md) |
| Writing the body of any test: names, structure, fixtures, assertions | [references/aesthetics.md](references/aesthetics.md) |
| Reviewing an existing test, judging quality, or refactoring a suite | All three, then walk [references/checklist.md](references/checklist.md) |
| Calling testing work done | [references/checklist.md](references/checklist.md) |
| Fixture setup obscuring the behavior, or repeating across tests | [references/builders.md](references/builders.md) |
| Changing untested legacy behavior | [references/characterization.md](references/characterization.md) |

These are not mutually exclusive. Scaffolding a new feature typically means reading
all three before you start.

## Vocabulary

Four concepts the reference files assume and do not reintroduce.

- **The TDD loop: Red, Green, Refactor** (Beck, *Test-Driven Development: By
  Example*). State a short scenario list in the active task note or progress
  update, then turn exactly one item into a runnable test. Before running it,
  predict how and why it will fail. An unexpected failure means the model, the
  test, or the setup is wrong. Reconcile it before production code. Make the
  simplest change to green, then refactor with the test as safety net. Only then
  choose the next scenario. Pick the green tactic by confidence: fake it (return a
  literal, and the next test forces generalization), triangulate (a second test with
  different inputs forces the real abstraction), or obvious implementation (when
  the answer is clear, write it directly).
- **F.I.R.S.T.** (Martin, *Clean Code*). Fast: milliseconds for unit, sub-second
  for integration, since slow tests stop getting run. Independent: any order, in
  parallel, no shared mutable state. Repeatable: same input, same result,
  everywhere, so inject every non-deterministic seam (clock, random, network, IDs).
  Self-validating: pass or fail, no log inspection, no run-twice-and-diff. Timely:
  written just before the production code it describes.
- **The four pillars of a test** (Khorikov, *Unit Testing Principles, Practices,
  and Patterns*): protection against regressions, resistance to refactoring, fast
  feedback, maintainability. You can max three at once, and one always gives. A test
  with low protection and low resistance is noise: delete it.
- **The unit is a behavior rather than a class** (Khorikov). "Unit test" does not mean
  one class with all collaborators mocked. It means one behavior, isolated from
  other *tests*. A unit test may exercise a service, a value object, and a pure
  helper together when they form one cohesive behavior. What makes it a unit is
  that it is fast, hits no I/O, and does not depend on other tests' state.
