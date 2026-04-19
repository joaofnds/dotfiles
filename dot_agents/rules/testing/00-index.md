# Testing Style — Gatekeeper

**The rule.** We practice **GOOS-style Test-Driven Development** (Freeman & Pryce, *Growing Object-Oriented Software, Guided by Tests*). GOOS blends the **outside-in design discipline** of the London school — let tests drive the shape of the code — with the **classical verification bias** of the Detroit school: prefer real collaborators, use Fakes at I/O boundaries, verify by state and output over interaction. When the two schools conflict, we side with classical.

**The single most important property.** Tests describe observable behavior, not implementation. Every rule in the sub-files exists to preserve this property.

**Non-negotiables.**
- TDD is the default workflow, not a preference.
- Framework mocks on our own code are banned. We write Fakes.
- Tests never wire the application by hand. They go through a Harness and a Driver.
- A test without clear Arrange / Act / Assert structure, or without an imperative behavior-name, is not done.

This file is the gatekeeper. It routes you to the module that applies to what you're doing, and it holds the checklist for the end.

---

## Routing — which module to read, and when

Before you touch a test, identify which of these situations you are in and read the required module. A silent skip is a process defect, same as skipping a test itself.

| Situation | Required read |
|---|---|
| Scaffolding a feature's test infrastructure — wiring a harness, building a driver, choosing which dependencies are real and which are faked, deciding on integration boundaries, setting up transaction isolation | `01-architecture-and-harness.md` |
| Introducing or modifying any test double — a Fake, Stub, Spy, or Mock — or deciding whether to use one at all | `02-mocking-roles.md` |
| Writing the body of any test — names, structure, fixtures, assertions, readability | `03-test-aesthetics.md` |
| Reviewing an existing test, judging quality, or refactoring a suite | All three, then walk the checklist at the bottom of this file |

If you're doing more than one of these, read more than one module. These are not mutually exclusive — scaffolding a new feature typically means reading all three before you start.

---

## Foundational vocabulary

Four concepts every sub-file assumes. Internalize them here; the sub-files will not reintroduce them.

**The TDD loop: Red → Green → Refactor** (Beck, *Test-Driven Development: By Example*).
Every new behavior starts as a failing test whose message reads. Then the *simplest* change to go green — a literal, a hard-coded branch, a single new method. Then refactor on green with the test as safety net. Only then move to the next red. Pick one of Beck's three tactics for the green step by confidence level:
- **Fake it** — return a literal. The next test forces generalization.
- **Triangulate** — a second test with different inputs forces the real abstraction.
- **Obvious implementation** — when the answer is clear, just write it. Don't perform TDD kabuki.

**F.I.R.S.T.** (Martin, *Clean Code*).
- **Fast** — milliseconds for unit, sub-second for integration. Slow tests stop getting run.
- **Independent** — any order, in parallel, no shared mutable state.
- **Repeatable** — same input → same result, everywhere. Inject every non-deterministic seam (clock, random, network, IDs).
- **Self-validating** — pass/fail, no log inspection, no "run twice and diff".
- **Timely** — written just before the production code it describes, not after.

**The four pillars of a test** (Khorikov, *Unit Testing Principles, Practices, and Patterns*).
Every test trades off four properties:
1. Protection against regressions.
2. Resistance to refactoring — survives internal restructuring when behavior is unchanged.
3. Fast feedback.
4. Maintainability.

You can max three at once; one always gives. A test with low protection *and* low resistance is noise — delete it.

**The unit is a behavior, not a class** (Khorikov).
"Unit test" does not mean "one class, all collaborators mocked." It means "one behavior, isolated from other *tests*." A unit test may legitimately exercise a service, a value object, and a pure helper together if they form one cohesive behavior. What makes it a unit is that it's fast, hits no I/O, and doesn't depend on other tests' state.

---

## Pre-commit checklist

Walk this before calling any testing work done. Every bullet that doesn't apply must be consciously ruled out, not silently skipped.

### Structure and naming
- Did I start red, go green with the simplest change, and refactor on green?
- Does the test satisfy F.I.R.S.T.?
- Is the top-level describe the symbol under test (for a class or function) or the route path (for an HTTP endpoint)?
- Are my test names imperative, lowercase, third-person present tense? No "should". No method-name echoes.
- Are Arrange / Act / Assert visible as three phases separated by blank lines — or is the test trivial enough to collapse to one line?
- One behavior per test? Multiple unrelated behaviors → split.
- If the same behavior runs against many inputs, am I using the framework's parameterized primitive (one generated test per row), not a loop of asserts inside one test body?
- Happy path first, edge cases in nested "when …" blocks at the bottom?
- Did I declare test variables at the top of the describe and populate them inside the setup hook?

### Architecture and harness
- Does the test talk to the application only through a Harness and a Driver?
- Does my Driver expose both a high-level method (parses the response, asserts a successful status, returns a domain entity) and a low-level method (returns the raw response) for every operation?
- Do I reset Fake state and begin/rollback a transaction in `beforeEach`?
- Did I tear down the Harness in `afterAll`? Resource leakage across suites is a defect.
- For external dependencies: did I use the real thing for a **managed** dependency (my own DB, my own cache namespace) under isolation, and a **Fake** for an **unmanaged** dependency (third-party API, payment, email)?
- Did I start outside-in from a failing end-to-end test, or did I backfill tests after the code?
- Is this test earning its place on the pyramid, or could it run one layer down?

### Doubles and verification
- Am I using a framework mock (generated or inline) for a dependency I own? If yes, replace with a Fake.
- Am I mocking a type I don't own directly? Wrap it in an interface I own, and fake that.
- Does my Fake implement the real interface and expose explicit seed + reset methods?
- Did I inject the Fake through DI rather than import-time module patching?
- Am I using the right name for what I built — Dummy, Stub, Fake, Spy, or Mock?
- Could this verification be output-based instead of state- or communication-based? Prefer the simpler style.
- Am I asserting on observable behavior, or am I coupled to an implementation detail (private method call, internal field, exact call sequence)?
- When I assert on an error, am I comparing against a typed instance or exported sentinel, rather than substring-matching the message?
- When I assert on full objects, am I using structural equality and escaping to a containment matcher only for volatile fields — not spelling out every field by hand?
- At a protocol boundary (HTTP, queue, bus), am I asserting in order: protocol shape → observable state → captured side-effects?

### Smells and anti-patterns
- Did I listen to test pain and fix a design smell, or did I work around it with more mocks?
- Do I see any of the catalogued smells — Obscure, Eager, Mystery Guest, Fragile, Conditional Logic in the test body, Test Code Duplication, Flaky, Slow, Trivial, Assertion Roulette, Free Ride, Hard-Coded Test Data?
- Am I reading the test at the domain level, or at the framework level? Grow the DSL.
- Am I falling into an anti-pattern — testing a private method, chasing coverage percentages, rebuilding the DI container in every `beforeEach`, sleep-based waits, branching on environment inside the test, asserting on log output?

If any answer is wrong or unknown, the work is not done.
