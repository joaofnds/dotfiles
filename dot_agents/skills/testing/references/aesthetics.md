# Test aesthetics

How a test reads, how it is named, how it is structured, and how it stays useful
as the code changes.

Tests are documentation. When a test fails, its output must read like a sentence
stating what the system was supposed to do: "user service > DeleteAll > removes
all users." If the reader has to open the file to understand what was being
tested, the test name is wrong.

Contents: observable behavior; listening to the tests; naming; Arrange / Act /
Assert; assertions; fixtures and vocabulary; smells; anti-patterns.

## Observable behavior

Assert on what a client of the subject can see through its public API, never on
implementation details: private methods, internal fields, the exact sequence of
internal calls. A test coupled to implementation is brittle: it breaks under
refactoring with behavior unchanged, and the reader learns to stop refactoring or
stop trusting the tests. Both are worse than no test. Rule of thumb: a test for a
behavior must survive any refactoring that preserves that behavior's contract; if
it breaks, either the behavior broke or the test was coupled.

## Listen to the tests (GOOS)

Tests are a design feedback channel. Specific pains map to specific design
problems; do not silence test pain with more mocks, the pain is the signal.

| Test pain | What it says | Fix |
|---|---|---|
| Thirty lines of setup | Too many collaborators | Split the subject, or introduce a coarser role that owns them |
| Faking five things to test one method | The subject knows too much | Invert a dependency, or one Fake of a higher-level role |
| Cannot test without peeking at private state | The behavior is not observable | The API is missing a return value, event, or accessor; add one |
| A unit test needs a real database | The unit is too big, or repository concerns leaked | Split |

## Naming

- **The top-level describe names the subject.** A class or function: the symbol
  itself; pass the class reference where the language allows, so renames stay in
  sync, otherwise its bare name in lowercase. An HTTP endpoint: the route path as
  a string (`"/users"`). An adapter: the component name (`"key-value store"`).
- **Nest to group**: `describe` for the subject's own operations (`"create"`,
  `"find"`), `context` for modes and HTTP verbs (`"GET"`, `"unhealthy"`), `when`
  for conditional branches (`"not found"`, `"db is empty"`).
- **Test names are lowercase, declarative, third-person-present clauses** stating
  the observable outcome: `returns the user`, `throws user not found`, `rejects
  an invalid id`, `emits user.created event`. Banned: `should ...` (hedging
  noise), method-name echoes (`test_findByEmail_returnsUser`), names that say
  nothing (`Test 1`, `works`, `basic case`), trailing periods, a capitalized
  first letter, mixed tenses.
- **Inside a nested `when`, the name states only the outcome.** The hierarchy
  composes the sentence the failure prints: *UserService > findByEmail > when the
  email is unknown > throws user not found.*

## Arrange / Act / Assert

- **Three visible phases separated by blank lines.** No comments, no labels; the
  blank lines are the signal.
- **Collapse when trivial.** When there is no separate arrange step or the
  arrange is one literal, inline the test to one or two lines. Do not invent a
  blank line that marks no real phase.
- **One behavior per test.** Multiple asserts on the same outcome (a response's
  status, body shape, headers) are one behavior. Two unrelated behaviors are an
  Eager Test: split, because when the second breaks the first assertion is noise
  and when the first breaks the second never runs.
- **Happy path first.** Conditional branches as nested `when` or `context`
  blocks at the bottom; error cases in their own nested block, never mingled with
  success cases. The order mirrors how the reader thinks: what does it do, and
  under what edge conditions does it differ.
- **Values local to each test unless setup is genuinely shared.** The reader
  sees setup beside the behavior, and parallel tests cannot share accidental
  mutable state. Describe-scoped variables and hooks only for genuinely shared
  setup; reset mutable shared state before every test. Immutable fixtures shared
  by several tests may live as `const` at the top of the describe.
- **No conditional logic in a test body** (Meszaros): no `if`, `for`, `switch`,
  `try`/`catch`. Branches become separate tests, iteration becomes parameterized
  cases, expected exceptions use a rejection matcher.
- **Parameterized tests use the framework's primitive: one generated test per
  row.** Never loop assertions inside one body: a failure on row three will not
  say it was row three, and the first failing row hides the rest. One row, one
  test, one name, one assertion path. The primitive comes from the project's
  framework rather than from the language: `it.each` in Jest and Vitest,
  `DescribeTable` with one `Entry` per row in Ginkgo, `t.Run` subtests in Go's
  `testing`.

## Assertions

- **Prefer full structural equality; escape to containment for volatile
  fields.** A full deep-equal catches new fields, silently defaulted values, and
  omissions, and reads as one line instead of ten field checks. When parts are
  volatile or irrelevant (generated ids, timestamps, server-added fields), use a
  containment matcher naming only the fields that matter. Do not assert on
  volatile fields, and do not silence them with literals copied from a previous
  run.
- **Compare stable error contracts, never incidental strings.** Assert a typed
  error's class and stable fields, or compare an exported sentinel with the
  language's identity-aware mechanism; independently constructed error instances
  are not usually equal. Substring-matching the message breaks on a grammar
  edit. Message-matching is legitimate only when the message itself is the
  documented contract; then it is data, not prose.
- **At a protocol boundary, assert in order**: protocol shape (status, response
  shape, headers), then observable state (read back through the Driver or an
  owned public query port), then captured side-effects (the Fake's `requests[]`,
  `sent[]`). Shape first because a wrong status makes the rest unreliable to
  read; state second because the persisted record outranks any captured
  interaction; side-effects last because they are the weakest verification. Skip
  a level that does not apply; never reorder.

## Fixtures and vocabulary

- When fixture setup obscures the behavior, or shared setup repeats, read
  [builders.md](builders.md). Keep simple fixtures inline; add a Builder or
  Object Mother only after repetition demonstrates the need.
- **Tests read at the domain level, not the framework level.** Every driver
  method, harness helper, Fake seed method, Builder verb, and custom assertion is
  a word in the domain DSL: the test body says what happens, the vocabulary says
  how. A test that reads like a transport log grows the DSL. An assertion bundle
  repeated in three or more tests becomes a named custom assertion
  (`expectValidUser(user)`, `expectHealthOK(response)`).
- When changing untested legacy behavior, read
  [characterization.md](characterization.md). Not for greenfield code, and never
  let known-wrong behavior become the permanent contract.

## Smells at this layer

- **Obscure Test**: setup noise hides the behavior. Push setup into the harness,
  Builders, or a DSL helper.
- **Eager Test**: multiple unrelated behaviors. Split.
- **Fragile Test**: breaks under unrelated refactoring. Assert observable
  behavior.
- **Assertion Roulette**: many unlabeled assertions; the failure cannot say which
  fired. Split, or extract a named custom assertion.
- **Hard-Coded Test Data**: magic ids, timestamps, names scattered through the
  body. Named constants, or a Builder.
- **Free Ride**: piggy-backing a new assertion onto an existing test because the
  state is already there. A new behavior is a new test, even if setup repeats;
  duplication of intent beats conflation of cases.
- **Conditional Test Logic**: split or parameterize.
- **Trivial Test**: asserts a language-level assignment. Delete it unless the
  accessor performs behavior or protects a known regression.
- **`should` in every name**: remove it; the name is a clause describing what
  the system does, not a wish.

## Anti-patterns

- **Testing private methods.** The urge means the method is a collaborator
  wanting extraction: either it is an implementation detail already covered by
  the public tests, or it is a hidden object to extract and test through its own
  public API.
- **Chasing coverage percentages.** 100% line coverage with weak assertions is
  worse than 70% with sharp ones; coverage says what ran, not whether behavior is
  correct.
- **Asserting rendered log text in domain tests.** Prefer typed events. A
  focused logging-adapter contract test may assert structured records when their
  schema is the subject; do not grep stderr prose.
- **Sleep-based waits.** `sleep(500)` is a flaky test shipping itself. Wait on a
  condition: the event arrived, the state changed.
- **Branching on environment inside a test.** `if env == "CI"` trains everyone
  to ignore the other case. Make the test deterministic or split it.
- **Shared mutable fixtures.** A module-level value mutated by one test and read
  by another makes test order a hidden dependency. Each test builds its own
  state.
