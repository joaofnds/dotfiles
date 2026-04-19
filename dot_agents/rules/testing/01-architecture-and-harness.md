# 01 — Architecture and Harness

How tests reach the system, what they treat as real, what they isolate, and how they are wired. Read the gatekeeper (`00-index.md`) first.

The rules here answer one question: **how does a test get a running subject to exercise, without knowing how the subject is wired internally?** The answer is: through a Harness and a Driver, both of which exist so the test body can read like a domain specification, not like a transport log.

---

## 1. Hexagonal testing boundary

Tests exercise the system through its public interface. For an HTTP service that's the HTTP boundary; for a library that's the public API. The test does not know about the internal graph — which classes collaborate, which container is used, which ORM is in place. If the test knows, the test is coupled to implementation (§02, observable-behavior rule) and every refactor breaks it.

Two consequences fall out of this:

1. **Tests never construct the subject by hand.** They ask a Harness for a running system and receive back a Driver — a domain-shaped client that speaks the subject's public language.
2. **Tests never import infrastructure adapters directly.** No `HTTPClient.get(...)` calls in test bodies, no direct database handles, no raw transport layers. Infrastructure lives behind the Driver.

```
[BAD] — test wires everything by hand; couples to framework details
    test "creates user":
        container = new DIContainer()
        container.register(UserRepository, new UserRepository(realDB))
        container.register(UserService, new UserService(container.get(UserRepository)))
        server = new HTTPServer(container)
        server.start(port=3000)

        response = rawHTTPClient.post("http://localhost:3000/users", body={ "name": "joao" })

        assert response.status == 201
        assert response.body.name == "joao"

        server.stop()
        realDB.truncate("users")
```

```
[GOOD] — test asks the harness for a running system and drives it through a domain-shaped API
    describe "/users":
        let harness, driver

        beforeAll:
            harness = TestHarness.setup()
            driver = harness.driver

        afterAll:
            harness.teardown()

        beforeEach: harness.db.begin()
        afterEach:  harness.db.rollback()

        test "creates user":
            user = driver.users.create("joao")

            assert user.name == "joao"
```

The [GOOD] test reads as one sentence: "when I ask the app to create a user named joao, I get back a user named joao." The mechanism — HTTP, database, container, ports — is entirely the harness's concern.

---

## 2. The test pyramid

The mix is a portfolio, not a ranking. Each layer buys different properties (Khorikov's four pillars, see the gatekeeper at `00-index.md`).

```
                ┌─────────┐
                │   E2E   │   few — full stack through HTTP, real everything
                ├─────────┤
                │  Integ  │   more — real managed deps (DB, cache) under isolation
                ├─────────┤
                │  Unit   │   many — no I/O, pure behavior, milliseconds each
                └─────────┘
```

- **Unit tests** at the base exercise domain logic with no I/O. Fast feedback, high resistance to refactoring (when they assert on behavior, §03), weak at catching integration bugs.
- **Integration tests** in the middle exercise real managed dependencies — your database, your cache — under per-test isolation. They catch schema drift, mapper errors, and transaction boundaries that unit tests cannot see.
- **End-to-end tests** at the top exercise the full stack via the public interface. Expensive to run, brittle if overused, but indispensable for user-visible workflows.

Inverted pyramids (mostly end-to-end) give slow, fragile feedback. Hourglass suites (unit + end-to-end, no integration) miss the class of bugs that lives at the integration layer. Match each test to the narrowest layer that can actually verify the property in question.

**Rule of thumb when deciding where a test belongs:** "what is the narrowest layer at which this test would fail if the behavior is wrong?" Write it there.

---

## 3. Outside-in TDD and the walking skeleton

Outside-in is how GOOS starts a feature:

1. Write a failing **end-to-end test** that describes the user-visible behavior. It fails because the feature doesn't exist yet.
2. Drop down one layer at a time — controller, service, repository — writing unit tests that force each collaborator into existence.
3. When all the unit tests go green in sequence, the end-to-end test goes green.

Before any feature is tested this way, the project must have a **walking skeleton**: the thinnest possible end-to-end path that exercises the full stack — wiring, DI, transport, harness, CI — returning a canned value through one route. The walking skeleton verifies the plumbing before any real behavior exists. Once it walks, every feature grafts onto a known-working spine instead of pioneering infrastructure alongside logic.

```
[BAD] — feature built inside-out, no outside test until the end
    1. write UserRepository + unit tests
    2. write UserService + unit tests
    3. write UserController + unit tests
    4. wire in DI module
    5. realize at step 4 that the controller signature doesn't match what the service exposes
    6. refactor three layers to match
```

```
[GOOD] — outside-in, failing e2e test drives each layer into existence
    1. write failing e2e: "POST /users returns 201 with the created user"
    2. route doesn't exist → add controller stub returning a canned user → e2e still fails on persistence
    3. persistence missing → write UserService with unit tests → wire into controller
    4. repository missing → write UserRepository with unit tests → wire into service
    5. e2e now green; every intermediate layer is covered by its own unit tests
```

The outside test is the compass: it tells you what "done" means in user-visible terms. The inner tests are the map: they force each collaborator to exist with the right shape.

---

## 4. Managed vs unmanaged dependencies

For integration tests, distinguish two categories of out-of-process dependency (Khorikov). This split determines what you fake and what you run real.

**Managed dependencies** are state we fully own and that is not visible outside our application — our database, our cache namespace, our message broker topic. Use the **real thing** in integration tests, isolated per test (see §6 below). Faking your own database in your own integration tests is how migration bugs ship to production: a mock that "works" on a schema the real database doesn't have is worse than no test at all.

**Unmanaged dependencies** are external services we don't own — third-party APIs, payment gateways, email, OAuth providers, upstream webhooks. Use a **Fake** (see `02-mocking-roles.md`). They are not our contract, we can't run a real one deterministically in CI, and the network is a shared resource that violates F.I.R.S.T.'s Repeatability.

```
[BAD] — fake the database, real-call the third party
    beforeEach:
        userRepo = new InMemoryUserRepository()          // faking our own DB
        paymentGateway = RealStripeClient(apiKey=test)    // real third party — flaky, non-repeatable
```

```
[GOOD] — real database (isolated), faked third party
    beforeEach:
        harness.db.begin()                                // real DB, transaction-isolated
        paymentGateway.reset()                            // owned Fake of PaymentGateway interface
    afterEach:
        harness.db.rollback()
```

---

## 5. The Test Harness

A Harness is a class whose responsibility is:

1. Boot the full DI graph using the *real* module — the same wiring production uses. Tests do not hand-register dependencies.
2. Expose a Driver (see §7) for talking to the system.
3. Expose a transaction-isolation handle (`db.begin()` / `db.rollback()`) for per-test database isolation.
4. Accept overrides for swapping Fakes or decorating specific dependencies at setup time.
5. Provide a static `setup()` constructor and an instance `teardown()` method.

Rough shape:

```
class TestHarness:
    field app
    field driver
    field db

    static setup(options = {}) -> TestHarness:
        builder = realApp.moduleBuilder()
        for customizer in options.customizers:
            customizer.apply(builder)
        app = builder.build()
        app.start()
        return new TestHarness(app)

    teardown():
        app.stop()
```

Harness rules:

- **One instance per describe block, owned in `beforeAll` and released in `afterAll`.** Never module-global; a leaked harness leaks a connection pool, a port, and a thread.
- **Never hand-register dependencies in a test.** If a test needs a different implementation, pass an override at `setup()` time through the options channel.
- **Overrides are functional options, not flags.** Do not grow `setup(useFakeHTTP=true, useRealAuth=true, …)`. Take a list of customizers that each mutate the DI builder, with named helpers like `useFakeHTTP(fakeInstance)` or `withFxOptions(…)`.
- **Allocate ports dynamically for end-to-end runs.** Hardcoded ports break parallel test execution. The harness binds to port zero, reads back the chosen port, and the Driver reads that port from the harness.

---

## 6. Transaction isolation per test

Integration and end-to-end tests that touch a real managed database must run each test inside a transaction that rolls back on completion. This is the cheapest way to satisfy F.I.R.S.T.'s Independent and Repeatable properties.

```
[BAD] — relies on manual cleanup; flakes the first time a test crashes mid-run
    test "creates user":
        user = driver.users.create("joao")
        assert user.name == "joao"
        driver.users.delete(user.id)                     // misses this on failure → next test breaks
```

```
[GOOD] — transactional wrapping; rollback is unconditional
    beforeEach: harness.db.begin()
    afterEach:  harness.db.rollback()

    test "creates user":
        user = driver.users.create("joao")
        assert user.name == "joao"
```

Apply the same isolation primitive to any managed stateful resource the harness can roll back — cache namespaces via flush, in-memory auth stores via `clear()`. For resources that can't roll back, the Fake's `reset()` method (see `02-mocking-roles.md`) takes the same role.

Resource leakage — connection pools, ports, goroutines left dangling across tests — is a test smell (Meszaros). The harness's `teardown()` is mandatory and must close everything it opened.

---

## 7. Drivers

A Driver is the test's view of the application's public interface. HTTP endpoints, queue consumers, and public API calls are exposed through per-domain Driver classes; the test calls `driver.users.create("joao")`, not a raw transport call.

### 7.1 Shape

- A base `Driver` holds the transport client (HTTP agent, in-process router, whatever the harness wired up).
- Per-domain drivers — `UserDriver`, `AuthDriver`, `HealthDriver` — extend the base.
- An `ApplicationDriver` aggregates per-domain drivers as properties.

```
class ApplicationDriver extends Driver:
    users   = new UserDriver(this.transport)
    auth    = new AuthDriver(this.transport)
    health  = new HealthDriver(this.transport)

    static for(app) -> ApplicationDriver:
        return new ApplicationDriver(app.transport)
```

### 7.2 Two levels of method per operation

For every operation, a Driver exposes **two** methods:

1. **High-level.** Sends the request, asserts a successful status code, parses the response into a domain entity, returns the entity. Used by happy-path tests so the body reads as domain code.
2. **Low-level.** Returns the raw response. Used by error-path tests that need to inspect status codes and error bodies.

```
class UserDriver:
    create(name) -> User:
        response = this.createRaw(name)
        assert response.status == 201
        return parseUser(response.body)

    createRaw(name) -> Response:
        return transport.post("/users", body={ name })

    find(id) -> User:
        response = this.findRaw(id)
        assert response.status == 200
        return parseUser(response.body)

    findRaw(id) -> Response:
        return transport.get("/users/" + id)
```

Happy-path test:

```
test "finds the user that was created":
    created = driver.users.create("joao")

    found = driver.users.find(created.id)

    assert found == created
```

Error-path test:

```
test "rejects an invalid id":
    response = driver.users.findRaw("not-a-uuid")

    assert response.status == 400
```

### 7.3 Drivers parse to domain types

A Driver's high-level method returns a real domain entity — not a raw response body. It parses the transport payload into the domain class. This gives test assertions a strongly-typed domain object to compare against.

### 7.4 Drivers assert transport contracts, not domain content

A Driver may assert on transport-level contracts — "create returns 201 and a user shape" — because that's its own contract with the test. A Driver never asserts on domain content — "the user's name was 'joao'". That's the test's job.

### 7.5 Must-variants for error-free flows

Where the Driver's error-returning form would force the test body to carry error-checking scaffolding just to unwrap a happy-path value, provide a `mustX(...)` wrapper that asserts-no-error and returns the value directly. Happy-path tests read as a sequence of domain actions; error-path tests still have the raw, error-returning form when the error itself is the subject.

```
driver.users.create(name)       -> returns the user, or an error the test can inspect
driver.users.mustCreate(name)   -> asserts no error, returns the user, fails the test on error
```

---

## 8. Smells that show up at this layer

- **Mystery Guest** — test depends on data it didn't create (seeded fixtures, rows from another test). Fix: build all required state inside the test via the Driver.
- **Interacting Tests** — Test A must run before Test B. Fix: per-test isolation (transaction rollback, fake reset). Each test creates its own state.
- **Resource Leakage** — ports, pools, goroutines leaked across suites. Fix: `afterAll` teardown is mandatory.
- **Slow Test** — minutes of feedback. Fix: push the assertion down the pyramid. What part of this test actually needs a full end-to-end round-trip?
- **Erratic / Flaky Test** — passes sometimes. Fix: hunt down the non-determinism — wall-clock, random, hash ordering, network, shared global state — and inject a deterministic Fake at the seam.
- **Test Logic in Production** — `if env == "test"` branches in domain code. Fix: inject the seam properly so production and test paths are the same code.

Flaky tests are worse than no tests — they train the team to ignore red.
