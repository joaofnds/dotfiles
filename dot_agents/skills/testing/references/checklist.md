# Pre-commit checklist

Walk the applicable sections before calling testing work done. Test-type-specific
items do not apply to every test.

## Did the loop actually run

Skip this section when reviewing a suite you did not write: it asks about a
transcript you do not have.

- Did I see the test fail before writing the code? Name the test and quote the
  line that failed. A step that only creates a symbol the test names earns its
  red as the compiler error. A step that changes behavior earns its red as a
  failing assertion from a run where the test compiled and the assertion fired. A
  refactoring step earns no red at all: it stays green.
- Where does the scenario list live? Give the path or the message holding it.
- Did a run surprise me? Point at the prediction and at what actually happened.

Point at these; don't assert them. Each one already exists as output above; cite
it rather than recall it. If it didn't go that way, say so plainly here; an
admitted skip is worth more than a false claim. The per-iteration form of this
loop is the build skill's loop.

## Structure and naming

Walk the [aesthetics](aesthetics.md) rules and the SKILL.md vocabulary:
F.I.R.S.T.; the describe subject; the name form; AAA visible or trivially
collapsed; one behavior per test; the parameterized primitive rather than an
assert loop; happy path first; values local unless genuinely shared, with mutable
shared state reset.

## Architecture and harness

Walk the [architecture](architecture.md) rules: Harness and Driver rather than
hand-wiring; raw or error-returning operations, with a success convenience only
where it removes repeated boilerplate; Fake reset and an isolation mechanism per managed dependency;
`afterAll` teardown; real managed and faked unmanaged dependencies; outside-in
for a cross-boundary slice and the narrowest observable layer for local behavior;
whether the test earns its pyramid layer or could run one layer down.

## Doubles and verification

Walk the [doubles](doubles.md) rules and the assertion rules in
[aesthetics](aesthetics.md): no framework mock on owned code; no third-party mock
outside the adapter escape hatch; the Fake implements the real interface with
seeds and reset, injected through DI; the double named for its role; the simplest
verification style that expresses the contract; behavior asserted, not
implementation; typed errors or sentinels, not message substrings; structural
equality with the containment escape; the protocol-boundary assertion order.

## Smells and anti-patterns

Did I listen to test pain and fix a design smell, or work around it with more
mocks? Walk the smell and anti-pattern lists at the bottom of all three reference
files, Test Code Duplication among them, and check that the test reads at the
domain level, not the framework level. Am I in an anti-pattern: testing a private
method, chasing coverage, rebuilding the DI container in every `beforeEach`,
sleep-based waits, branching on environment inside the test, asserting on log
output?

## Mutation claims

Walk this only when the work claims a guard or branch is verified by mutation.

- Enumerate the mutants from the diff, not from memory: every predicate, every
  boundary constant, every ordering between statements that touch shared state.
  Name each mutant and the test that kills it. A mutant picked from memory
  re-checks only the guards you already had in mind. When the project has a
  mutation tool, run it instead of enumerating by hand.

## Verdict

If any applicable answer is wrong, the work is not done. "Unknown" is also not
done; name the evidence that would settle it. An item that doesn't apply is
neither; say which and why.
