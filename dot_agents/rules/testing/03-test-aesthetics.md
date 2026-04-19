# 03 — Test Aesthetics

How a test reads, how it's named, how it's structured, and how it stays useful as the code changes. Read the gatekeeper (`00-index.md`) first.

Tests are documentation. When a test fails, its output must read like a sentence that tells the reader what the system was supposed to do. "user service > DeleteAll > removes all users" is one sentence. If the reader has to open the file to understand what was being tested, the test name is wrong.

This module covers everything about the *look* of a test: philosophy, naming, structure, fixtures, and the handful of smells that make a test body unreadable.

---

## 1. Tests describe observable behavior (Khorikov)

Assert on what a client of the subject can see through its public API. Do not assert on implementation details — private methods, internal fields, the exact sequence of internal calls.

A test coupled to implementation is *brittle*: it breaks under refactoring even when behavior is unchanged. The reader learns to either stop refactoring or stop trusting the tests. Both outcomes are worse than no test at all.

```
[BAD] — coupled to an internal call sequence
    test "finds the user":
        service = new UserService(repo)

        service.findByEmail("joao@x.com")

        assert repo.queryBuilder.wasCalled()
        assert repo.queryBuilder.where.wasCalledWith("email", "joao@x.com")
        assert repo.queryBuilder.limit.wasCalledWith(1)
```

The moment the repository stops using a query builder, this test fails — and nothing about behavior has changed.

```
[GOOD] — asserts the observable outcome
    test "finds the user by email":
        users = new InMemoryUserRepository()
        users.seed(new User("joao@x.com"))
        service = new UserService(users)

        found = service.findByEmail("joao@x.com")

        assert found.email == "joao@x.com"
```

The test now survives any refactor that preserves the behavior — query builder swap, ORM change, different caching strategy. That's the property we want.

**The rule of thumb:** a test for a behavior must survive any refactoring that preserves that behavior's contract. If the test breaks, one of two things is true — you broke the behavior, or the test was coupled to implementation.

---

## 2. Listen to the tests (GOOS)

Tests are a design feedback channel, not just a verification tool. Specific pains map to specific design problems. When a test is hard to write, the test is telling you something about the production code.

| Test pain | What it's saying | Fix |
|---|---|---|
| "This test needs thirty lines of setup." | The subject has too many collaborators. | Split the subject, or introduce a coarser-grained role that owns the collaborators. |
| "I need to fake five things to test one method." | The subject knows too much. | Invert a dependency, or replace the mock swarm with one Fake of a higher-level role. |
| "I can't test this without peeking at private state." | The behavior isn't observable through the public API. | The API is missing a return value, event, or accessor. Add one — don't reach into internals. |
| "The test breaks every time I refactor." | You're asserting on implementation details. | Move assertions to observable behavior (§1). |
| "This test is flaky." | Non-determinism has leaked in. | Find the seam — clock, random, network, ordering — and inject a deterministic Fake. |
| "I need a real database for this unit test." | The unit is too big, or repository concerns have leaked into the service. | Split. |

**Do not silence test pain with more mocks.** The pain is the signal. Every time you reach for "I'll just mock that too", ask what the design is trying to tell you.

---

## 3. Naming

### 3.1 The describe subject

The top-level describe names the subject of the test. Two cases:

- **Unit test of a class or function** → the symbol itself, not a string. When the language allows, pass the class reference; otherwise use its bare name in lowercase. This keeps the describe in sync when the symbol is renamed.
- **HTTP endpoint test** → the route path as a string: `"/users"`, `"/health"`, `"/auth"`.
- **Adapter test** → the component name: `"key-value store"`, `"ID generator"`.

### 3.2 Nested describes — grouping

Nest `describe` / `when` / `context` to group:

- **By method or action under test:** `describe "create"`, `describe "find"`, `describe "deleteAll"`.
- **By HTTP verb:** `context "GET"`, `context "POST"`.
- **By branching condition or state:** `when "not found"`, `when "db is empty"`, `context "healthy"`, `context "unhealthy"`.

`when` reads best for conditional branches ("when X is true"); `context` reads best for modes. `describe` reads best for the subject's own operations.

### 3.3 Test names — imperative, present, third-person

Every test name describes the observable outcome.

- ✅ `emits user.created event`
- ✅ `returns the user`
- ✅ `throws user not found`
- ✅ `lists created users`
- ✅ `rejects an invalid id`
- ✅ `grants the role`
- ✅ `recovers from panic`

Banned forms:

- ❌ `should return the user` — drop the `should`. It's hedging, and it adds noise to every test name in the suite.
- ❌ `test_findByEmail_returnsUser` — method-name echoes, not a sentence.
- ❌ `Test 1` / `works` / `basic case` — names that tell the reader nothing.
- ❌ Trailing periods, capitalized first letter, mixed tenses. The name is a clause, not a sentence.

When the branch is already in a nested `when`, the test name states only the outcome. Inside `when "not found"`, write `test "throws user not found"` — not `test "when not found, throws user not found"`. The hierarchy does the composition.

```
describe UserService
  describe "findByEmail"
    test "returns the user"
    when "the email is unknown"
      test "throws user not found"
    when "the email is malformed"
      test "rejects the request"
```

Reads as: *UserService > findByEmail > when the email is unknown > throws user not found.* That's the sentence a failure will print.

---

## 4. Arrange / Act / Assert

### 4.1 Three visible phases, separated by blank lines

Inside every test body, mark the AAA boundaries with blank lines. Three phases, no comments, no labels. The blank lines are the signal.

```
test "finds the user that was created":
    created = driver.users.create("joao")

    found = driver.users.find(created.id)

    assert found == created
```

### 4.2 Collapse when trivial

When there's no separate arrange step or the arrange is one literal, inline the whole test into one or two lines. Don't invent a blank line that doesn't mark a real phase.

```
test "starts empty":
    assert service.all().length == 0
```

```
test "lists created users":
    created = mustCreate("joao")
    assert service.all().contains(created)
```

**Rule of thumb:** blank lines cost real estate. Use them when the reader benefits from seeing the phase boundary; skip them when the test fits on two lines.

### 4.3 One behavior per test

A test asserts one thing — one behavior, one outcome. Multiple `assert` calls on the *same* outcome (a response: its status, its body shape, its headers) are fine; that's one behavior. Asserting on two unrelated behaviors is an **Eager Test** smell.

```
[BAD] — two unrelated behaviors in one test
    test "creates and deletes user":
        created = driver.users.create("joao")
        assert created.name == "joao"

        driver.users.delete(created.id)

        assert driver.users.list().empty()
```

Two `describe`s, two names, two stories. If deletion breaks, the creation assertion is noise; if creation breaks, the deletion assertion never runs.

```
[GOOD] — two tests, each telling one story
    test "creates the user":
        created = driver.users.create("joao")

        assert created.name == "joao"

    test "forgets a deleted user":
        created = driver.users.create("joao")

        driver.users.delete(created.id)

        assert driver.users.list().empty()
```

### 4.4 Happy path first, edges in nested blocks

Within a describe, order cases from most-general to most-specific:

1. Happy-path tests at the top.
2. Conditional branches as nested `when "..."` or `context "..."` at the bottom.
3. Error cases in their own nested block, never mingled with success cases.

This mirrors how the reader thinks about the method: "what does it do, and then under what edge conditions does it behave differently?"

### 4.5 Test-scoped variables — declare outside, assign inside

Variables the test body reads are declared at the top of the describe and populated in the setup hook. Do not re-declare inside hooks.

```
describe UserService:
    let service, harness, db

    beforeAll:
        harness = TestHarness.setup()
        service = harness.get(UserService)
        db = harness.db

    beforeEach: db.begin()
    afterEach:  db.rollback()

    afterAll:   harness.teardown()

    test "...": ...
```

Fixtures that don't change across tests — constant emails, known IDs, reference values — go as plain `const` declarations at the top of the describe, above the setup hooks.

### 4.6 No conditional logic in the test body (Meszaros)

No `if`, no `for`, no `switch`, no `try`/`catch` in the body of a test. Branches become separate tests; iteration becomes parameterized cases; expected exceptions use a rejection matcher, not `try`/`catch`.

```
[BAD] — branching logic inside the test
    test "normalizes names":
        for each (input, expected) in cases:
            if input == "":
                assert throws(() => service.normalize(input))
            else:
                assert service.normalize(input) == expected
```

```
[GOOD] — parameterized test cases, one assertion path per case
    cases = [
        { input: "JOAO",  expected: "joao" },
        { input: "  j ",  expected: "j" },
    ]
    for each (input, expected) in cases:
        test "normalizes " + input:
            assert service.normalize(input) == expected

    test "rejects the empty string":
        assert throws(() => service.normalize(""))
```

### 4.7 Parameterized tests

When the same behavior runs against many inputs, use the framework's parameterized primitive — one generated test per row. Never loop multiple assertions inside a single test body: a failure on row three won't tell you it was row three, and the first failing row hides the rest.

```
[BAD] — one test wraps every case; a failure doesn't say which input broke
    test "normalizes inputs":
        cases = [
            { input: "JOAO", expected: "joao" },
            { input: "  j ", expected: "j" },
        ]
        for each (input, expected) in cases:
            assert service.normalize(input) == expected
```

```
[GOOD] — each row is its own named, independently-reporting test
    each case in [
        { name: "lowercases uppercase", input: "JOAO", expected: "joao" },
        { name: "trims whitespace",     input: "  j ", expected: "j" },
    ]:
        test case.name:
            assert service.normalize(case.input) == case.expected
```

The primitive varies by framework — `it.each`, table-driven `DescribeTable`, `t.Run` loops in Go — but the contract is always the same: one row, one test, one name, one assertion path. The failure line tells you exactly which input broke.

---

## 5. Assertions

How to write the assertion itself, once you have decided what to verify (§1) and which style to verify in (`02-mocking-roles.md` §2).

### 5.1 Prefer structural equality; escape to containment for volatile fields

Deep-equal the full expected object when you can. A full structural match catches more regressions than a hand-picked list of field checks — new fields, silently-defaulted values, accidental omissions — and it reads as one line instead of ten.

```
[BAD] — field-by-field; a new field on the domain object passes silently
    assert found.id    == user.id
    assert found.email == user.email
    assert found.name  == user.name
```

```
[GOOD] — full structural equality
    assert found == user
```

When parts of the object are volatile or irrelevant — generated ids, timestamps, server-added fields — escape to a **containment matcher** that asserts only on the fields you name. Do not assert on volatile fields, and do not silence them by equality-checking against arbitrary literals you had to copy from a previous run.

```
[GOOD] — containment for a volatile timestamp
    assert response.body containing { status: "ok", version: "1.0" }
```

### 5.2 Compare errors to typed instances or sentinels, never to strings

The contract of a domain error is its type and identity, not its rendered message. Assert on the instance or the exported sentinel.

```
[BAD] — coupled to message text; a grammar edit breaks the test
    assert thrown.message contains "user not found"
```

```
[GOOD] — compared against the domain error
    assert thrown == new UserNotFoundError(userId)         // typed-instance style
    assert isSameError(err, UserProvider.ErrNotFound)      // exported-sentinel style
```

Message-matching is legitimate only when the message itself *is* the contract — a panic message that a public assertion API specifies, or a structured error whose rendered form is documented. In those cases the message is data, not prose.

### 5.3 Order of assertions at a protocol boundary

When a test exercises the subject through a transport — HTTP, a queue, a message bus — assert in this order:

1. **Protocol shape.** Status code, response shape, headers. The boundary's own contract.
2. **Observable state.** The world has changed as expected — read back through the real repository or through the Driver's query methods.
3. **Captured side-effects.** Outbound calls the Fake recorded (`http.requests[]`, `emails.sent[]`, `queue.enqueued[]`).

Protocol shape first, because if the status is wrong the rest of the response is unreliable to read. State second, because the persisted record of truth is more authoritative than any captured interaction. Side-effects last, because they are the weakest form of verification (`02-mocking-roles.md` §2).

```
test "creates the user":
    response = driver.users.createRaw("joao")

    assert response.status == 201
    assert response.body containing { name: "joao" }

    assert users.findById(response.body.id).name == "joao"

    assert emails.sent[0].subject == "Welcome"
```

Skip any level that doesn't apply — a pure query endpoint has no state change; a pure command may have no meaningful response body — but do not reorder.

---

## 6. Hide irrelevant data — Test Data Builders and Object Mothers

Setup noise is the single biggest source of the **Obscure Test** smell. If the reader has to skim past twenty fields of unrelated setup to find the field that matters, the test has failed as documentation.

### 6.1 Test Data Builders (Meszaros)

Fluent builders for domain fixtures. Sensible defaults hide irrelevant fields; the test body mentions only the fields it actually cares about.

```
[BAD] — twenty fields of setup; which one is this test about?
    test "promotes a user to admin":
        user = new User(
            id          = "00000000-0000-0000-0000-000000000001",
            email       = "joao@x.com",
            name        = "joao",
            role        = "default",
            createdAt   = clock.now(),
            updatedAt   = clock.now(),
            verified    = true,
            locale      = "en-US",
            timezone    = "UTC",
            preferences = defaultPreferences(),
        )

        promoted = users.promoteToAdmin(user)

        assert promoted.role == "admin"
```

```
[GOOD] — Builder with sensible defaults; test names only what matters
    test "promotes a user to admin":
        user = aUser().build()                           // defaults everything

        promoted = users.promoteToAdmin(user)

        assert promoted.role == "admin"

    test "cannot promote a banned user":
        user = aUser().banned().build()                  // only the relevant variant is named

        assert throws(() => users.promoteToAdmin(user))
```

Reach for a Builder once a test varies more than two fields, or once three tests share the same shape. Below that threshold, inline construction is simpler.

### 6.2 Object Mothers (Meszaros)

Named factory methods for common, reusable instances:

```
class Users:
    static alice():    return aUser().withRole("admin").withName("alice").build()
    static bob():      return aUser().withRole("customer").withName("bob").build()
    static banned():   return aUser().banned().build()

test "admins can see all users":
    admin = Users.alice()

    service.listAllAs(admin)

    // ...
```

Mothers are simpler than Builders but less flexible. Use them when fixtures are finite and named in the domain ("alice the admin"). Switch to a Builder when you're adding a tenth Mother variant or when variants multiply combinatorially.

Mothers and Builders compose: a Mother typically returns a Builder invocation, so one-off variants can re-customize without adding another Mother.

---

## 7. Domain-Specific Testing Language (Clean Code, GOOS)

Tests should read at the domain level, not the framework level. Every driver method, harness helper, Fake seed method, Builder verb, and custom assertion is a word in your domain DSL. The test body says *what* happens; *how* is in the vocabulary.

```
[BAD] — reads like a transport log
    response1 = agent.post("/auth/register", body={ email: "joao@x.com", password: "p4ss" })
    assert response1.status == 201
    response2 = agent.post("/auth/login", body={ email: "joao@x.com", password: "p4ss" })
    assert response2.status == 200
    token = response2.body.access_token
    response3 = agent.get("/auth/me", headers={ authorization: "Bearer " + token })
    assert response3.status == 200
    assert response3.body.email == "joao@x.com"
```

```
[GOOD] — reads like a spec
    api.auth.mustRegister("joao@x.com", "p4ss")
    token = api.auth.mustLogin("joao@x.com", "p4ss")

    profile = api.auth.mustGetMe(token)

    assert profile.email == "joao@x.com"
```

The [GOOD] version reads as three clauses describing the behavior. A failure in any clause prints a domain-level error, not a transport status code.

**Custom assertions** sit at the top end of the same gradient. When the same assertion bundle appears in three or more tests, extract it into a named helper:

```
expectValidUser(user)        // asserts shape, id format, non-empty name, default role
expectHealthOK(response)     // asserts status == 200 and body.status == "ok"
```

---

## 8. Characterization tests (Feathers, *Working Effectively with Legacy Code*)

When you inherit untested code and need to change it, pin down the *current* behavior first. A characterization test asserts what the code does **today** — not what it should do. It is a vice: it holds the code still while you refactor.

```
[WORKFLOW]
    1. exercise the suspect code with a representative input through its public API
    2. observe what it actually produces — values, thrown errors, emitted events
    3. write a test asserting exactly that output, even when the output looks wrong
    4. refactor; the characterization test stays green, proving no observable change
    5. once the refactor settles, change the test and the behavior together, deliberately, in a separate commit
```

Without steps 1-3, every refactor is a guess — you may be preserving the current behavior, you may be silently correcting or breaking it, and there is no test to tell you which. With them, "change the shape" and "change the behavior" become two commits, two reviews, two bisect targets.

Characterization tests are **temporary by design** when they capture wrong-but-current behavior. Leave a comment or issue link next to the known-wrong assertion, and replace the test the moment the real contract takes over. A characterization test that ossifies into "the spec" is how bugs become features.

```
[GOOD] — characterization of a legacy normalizer that silently drops non-ASCII
    // TODO(#1423): legacy behavior drops accents silently; contract under discussion.
    //              This test pins CURRENT behavior so we can refactor the parser safely.
    test "drops non-ASCII characters":
        assert legacy.normalize("joão") == "joo"
```

Do not write characterization tests for green-field code. They only earn their place against an untested body of behavior that must be refactored before it can be specified.

---

## 9. Smells that show up at this layer

- **Obscure Test** — the reader can't see what's being tested through the setup noise. Fix: push setup into the harness, Builders, or a DSL helper.
- **Eager Test** — one test verifies multiple unrelated behaviors. Fix: split (§4.3).
- **Fragile Test** — breaks under unrelated refactoring. Fix: move assertions to observable behavior (§1).
- **Assertion Roulette** — many unlabeled assertions in one test; failure message can't tell you which fired. Fix: split, or extract a named custom assertion.
- **Hard-Coded Test Data** — magic IDs, timestamps, names scattered through the body. Fix: named constants, or a Builder.
- **Free Ride** — piggy-backing a new assertion onto an existing test "because the state is already there." Fix: a new behavior is a new test, even if setup repeats. Duplication of intent beats conflation of cases.
- **Conditional Test Logic** — `if`/`for`/`try`/`catch` in the test body. Fix: split or parameterize (§4.6).
- **Trivial Test** — asserts that a getter returns its constructor argument. Fix: delete. It verifies nothing the type system wouldn't.
- **`should` in every test name.** Fix: remove the `should`. The name is a clause describing what the system does, not a wish.

---

## 10. Anti-patterns to avoid at this layer

- **Testing private methods directly.** If you feel the urge, the method is a collaborator wanting to be extracted. Either it's an implementation detail covered by the public tests (no new test needed), or it's a hidden object (extract to a class, test through *its* public API).
- **Chasing coverage percentages.** 100% line coverage with weak assertions is worse than 70% with sharp ones. Coverage says what ran; it doesn't say whether behavior is correct.
- **Asserting on log output.** Logs are for humans. If you need to assert on an event, the event should be a typed, structured object — not a grep against stderr.
- **Sleep-based waits.** `sleep(500); assert ...` is a flaky test shipping itself. Wait on a condition (the event arrived, the state changed), not on wall-clock time.
- **Branching on environment inside a test.** `if env == "CI" then assert ...` trains everyone to ignore the "other" case. Make the test deterministic or split it.
- **Shared mutable test fixtures.** A module-level `user` mutated by one test and read by another is a pyramid scheme of test order. Each test builds its own state.
