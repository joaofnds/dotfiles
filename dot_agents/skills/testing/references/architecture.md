# Architecture and harness

How tests reach the system, what they treat as real, what they isolate, and how
they are wired. One question governs the file: how does an application-level
integration or end-to-end test get a running subject without knowing its internal
wiring? Through a Harness and Driver, so the test body reads like a domain
specification, not a transport log. Unit tests may construct cohesive behavior
directly.

Contents: hexagonal boundary; the pyramid; outside-in and the walking skeleton;
managed vs unmanaged dependencies; the Harness; isolation; Drivers; smells.

## Hexagonal testing boundary

- **Tests exercise the system through its public interface.** For an HTTP service
  that is the HTTP boundary; for a library, the public API. The test does not know
  the internal graph: which classes collaborate, which container, which ORM. A
  test that knows is coupled to implementation, and every refactor breaks it.
- **Application-level tests never hand-wire the application.** They ask a Harness
  for a running system and receive a Driver that speaks its public language.
- **Raw transport and database handles live behind the Harness or Driver**, never
  in an end-to-end test body. Focused adapter integration tests may exercise the
  adapter directly, because the adapter is their subject.

## The test pyramid

The mix is a portfolio, not a ranking; each layer buys different pillars.

- **Unit tests** at the base exercise domain logic with no I/O: fast feedback,
  high resistance to refactoring when they assert on behavior, weak at catching
  integration bugs.
- **Integration tests** in the middle exercise real managed dependencies, your
  database, your cache, under per-test isolation. They catch schema drift, mapper
  errors, and transaction boundaries that unit tests cannot see.
- **End-to-end tests** at the top exercise the full stack via the public
  interface: expensive, brittle if overused, indispensable for user-visible
  workflows.

An inverted pyramid (mostly end-to-end) gives slow, fragile feedback. An hourglass
(unit plus end-to-end, no integration) misses the bug class that lives at the
integration layer. Placement rule: write the test at the narrowest layer at which
it would fail if the behavior is wrong.

## Outside-in TDD and the walking skeleton

For a user-visible vertical slice that crosses application boundaries: write a
failing end-to-end test describing the user-visible behavior, drop to the
narrowest layer that explains the current failure and add only the tests needed to
drive its behavior, and move the failure inward until the end-to-end test goes
green. Inside-out building (repository, then service, then controller, then
wiring) discovers the mismatched signatures last and refactors three layers to
recover.

For domain-local behavior, fixes, and refactors, start at the narrowest test layer
that can observe the requirement. Do not add an end-to-end test to perform the
ritual.

Before any feature is tested this way, the project needs a **walking skeleton**:
the thinnest possible end-to-end path exercising the full stack, wiring, DI,
transport, harness, CI, returning a canned value through one route. It verifies
the plumbing before any real behavior exists, so every feature grafts onto a
known-working spine instead of pioneering infrastructure alongside logic.

## Managed vs unmanaged dependencies

The split that decides what runs real and what gets faked (Khorikov).

- **Managed dependencies**, state we fully own and that is not visible outside
  our application (our database, our cache namespace, our broker topic): use the
  **real thing**, isolated per test. Faking your own database is how migration
  bugs ship; a mock that works on a schema the real database does not have is
  worse than no test at all.
- **Unmanaged dependencies**, external services we do not own (third-party APIs,
  payment gateways, email, OAuth providers, upstream webhooks): use a **Fake**
  (see [doubles.md](doubles.md)). They are not our contract, cannot run
  deterministically in CI, and the network breaks Repeatability.

## The Test Harness

A Harness for application-level tests: boots the full DI graph using the *real*
production module; exposes a Driver; exposes the managed-dependency isolation
controls the suite uses; exposes a static `setup(options)` constructor and an
instance `teardown()`.

- **One instance per describe block, owned in `beforeAll`, released in
  `afterAll`.** Never module-global: a leaked harness leaks a connection pool, a
  port, and a thread.
- **Never hand-register dependencies in a test.** A test that needs a different
  implementation passes an override at `setup()` time.
- **Overrides are functional options, not flags.** No
  `setup(useFakeHTTP=true, ...)`. Take a list of customizers that each mutate the
  DI builder, with named helpers like `useFakeHTTP(fakeInstance)`.
- **Allocate ports dynamically for end-to-end runs.** Bind port zero, read back
  the chosen port, and let the Driver read it from the harness. Hardcoded ports
  break parallel runs.

## Managed-dependency isolation

Use the cheapest isolation mechanism that preserves production semantics. Prefer
transaction rollback when application operations share the transaction and commit
behavior is not under test. Otherwise use isolated schemas or databases, unique
namespaces, disposable containers, or verified cleanup. A test that crosses
processes or exercises commit behavior cannot be isolated by a transaction visible
only to the test runner.

Manual in-test cleanup (delete what you created at the end) flakes the first time
a test crashes mid-run. Apply an equivalent isolation primitive to every managed
stateful resource: unique cache namespaces, disposable topics, explicit reset
where production semantics allow it. The harness's `teardown()` is mandatory and
closes everything it opened; resource leakage across suites is a defect.

## Drivers

A Driver is the test's view of the application's public interface. Per-domain
driver classes (`UserDriver`, `AuthDriver`, `HealthDriver`) extend a base holding
the transport client the harness wired up; an `ApplicationDriver` aggregates them
as properties. The test calls `driver.users.create("joao")`, never a raw
transport call.

- **Each operation exposes a raw or error-returning method**
  (`createRaw(name) -> Response`), plus a success convenience
  (`create(name) -> User`, asserting the happy status and parsing) only where it
  removes repeated boilerplate. Error-path tests call the raw form and assert on
  the response.
- **Drivers parse to public types.** A high-level method returns a typed public
  contract or client model, not an unvalidated response body. Return the internal
  domain entity only when it genuinely is the public contract.
- **Drivers assert transport contracts, not domain content.** "Create returns 201
  and a user shape" is the Driver's own contract with the test. "The user's name
  was joao" is the test's job.
- **Provide a `mustX(...)` convenience** where an error-returning operation forces
  repeated happy-path scaffolding: it asserts no error, returns the value, and
  fails the test on error. Choose `mustX` or another success convenience, not
  three forms of every operation.

## Smells at this layer

- **Mystery Guest**: the test depends on data it did not create. Build all
  required state inside the test via the Driver.
- **Interacting Tests**: test A must run before test B. Per-test isolation; each
  test creates its own state.
- **Resource Leakage**: ports, pools, goroutines leaked across suites. `afterAll`
  teardown is mandatory.
- **Slow Test**: minutes of feedback. Push the assertion down the pyramid; what
  part actually needs a full round-trip?
- **Erratic / Flaky Test**: passes sometimes. Hunt down the non-determinism
  (wall clock, random, hash ordering, network, shared global state) and inject a
  deterministic Fake at the seam.
- **Test Logic in Production**: `if env == "test"` branches in domain code.
  Inject the seam properly so production and test run the same code.
