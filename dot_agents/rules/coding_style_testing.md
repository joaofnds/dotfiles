# Testing Coding Style

Testing-specific preferences, learned from the Nest, Go, and Deno templates. Read the generic `coding_style.md` first for the universal testing principles (GOOS, fakes over mocks, test lifecycle discipline). This document pins down the concrete shape a test should take in this codebase: file layout, names, body structure, harness composition, fake authoring, and assertion style.

Applies to every language unless a section is explicitly scoped. Language-specific details live at the bottom.

## 1. Philosophy

- **Tests describe behavior, not implementation.** The `describe` block names the subject; the `it` block names the observable behavior. Implementation details (method calls, internal state) are plumbing, not the subject of an assertion.
- **A test is documentation.** When a test fails, the output must read like a sentence that tells the reader what the system was supposed to do. `user service > DeleteAll > removes all users` is one sentence. Write names that work in that sentence.
- **GOOS-style harnesses and drivers, always.** The test never wires the application by hand. It calls `TestHarness.setup()` (or the Go `harness.Setup()`) and talks to the system through a `Driver` that mirrors the public API. A test that knows `supertest`, `Hono`, or `fiber` directly has crossed a layer it shouldn't.
- **Fakes are first-class production-style code.** A `FakeX` is not a one-line lambda inside a `beforeEach` — it is a class that implements the real interface, lives under `test/fakes/` (or `test/` in Go), and is reused across every test that touches that seam.
- **Framework mocks (`jest.fn()`, `vi.fn()`, `fn()` from `@std/expect`, mockgen) are only allowed for thin interaction verification** against an external interface we don't own (BullMQ's `Queue`, `PinoLogger`). The moment the mock grows state or branching, replace it with a Fake. Never mock your own domain interfaces — write a Fake.
- **Each test is independent.** Setup resets state explicitly (transaction begin/rollback, fake reset, `Clear()`). Tests do not share mutable state through closures or module globals; if they need shared setup, use `BeforeAll`/`beforeAll` with a per-test reset hook.
- **The TDD loop is Red → Green → Refactor** (Beck, *TDD By Example*). Every new behavior starts as a failing test — "failing" meaning the assertion fails with a readable message, not that the type doesn't compile. Once red, write the *simplest* thing that turns it green: a literal, a hard-coded branch, a single new method. Then refactor on green, with the test as safety net. Only then move to the next red. Beck's three tactics for the green step — **fake it** (return a literal, let the next test force generalization), **triangulate** (add a second test with different inputs to force the abstraction), **obvious implementation** (just write it when the answer is clear) — are picked by confidence level: fake it when exploring, obvious-implement when not.
- **F.I.R.S.T.** (Martin, *Clean Code*). Every test must be **Fast** (milliseconds for unit, sub-second for integration — slow tests stop getting run), **Independent** (any order, in parallel, no shared mutable state), **Repeatable** (same input, same result, in any environment — inject `Clock`, `IDService`, `HTTPService`, never touch the wall clock or a live network), **Self-validating** (pass/fail, no log-inspection, no "run it twice and diff"), and **Timely** (written just before the production code it describes, not after). A test that fails any of the five is debt.

## 2. File Layout

### 2.1 Location
- **Unit tests co-locate with the source.** `user.service.ts` → `user.service.test.ts` next to it. `service.go` → `service_test.go` in the same package (but `package X_test`, see 11.2).
- **End-to-end / HTTP tests live under `test/e2e/`** (TS) or inside the `<feature>_http` package (Go). They boot the full app and drive it through HTTP.
- **Shared test support lives under `test/`**: `test/harness/`, `test/driver/`, `test/fakes/`, `test/util/`, `test/matchers/`, `test/req/`. Never inline these helpers into a single test file "for now"; they earn their directory the moment a second file needs them.

### 2.2 File naming
- TypeScript: `<name>.test.ts`. Never `.spec.ts` — the templates settled on `.test.ts`.
- Go: `<name>_test.go`. E2E HTTP tests live in `controller_test.go` inside the `<feature>_http` package.

## 3. Describe / It Naming

### 3.1 Top-level subject
- **Unit test of a class or function → pass the symbol itself**, not a string:
  - TS: `describe(UserService, () => { ... })`, `describe(UserCreatedQueue, () => { ... })`.
  - Go: `var _ = Describe("user service", Ordered, func() { ... })` (Ginkgo takes a string, but keep it lowercased and tied to the subject name).
- **HTTP endpoint test → the route path as a string**: `describe("/users", ...)`, `describe("/health", ...)`, `Describe("/kv", Ordered, func() { ... })`, `Describe("/auth", ...)`.
- **Adapter / driver test → the component name**: `Describe("Redis Store", ...)`, `Describe("UUIDGenerator", ...)`, `Describe("casbin role manager", ...)`.

### 3.2 Nested describes
Nest `describe` (TS) / `Describe` / `Context` / `When` (Ginkgo) to group:
- **By method or action under test**: `describe("create", ...)`, `describe("find", ...)`, `Describe("DeleteAll", ...)`, `Describe("token provider", () => Describe("get", ...))`.
- **By HTTP verb**: `Context("GET", ...)`, `Context("POST", ...)`, `Context("DELETE", ...)`.
- **By branching condition**: `describe("when not found", ...)`, `describe("when db is empty", ...)`, `When("user does not exist", ...)`, `When("email is invalid", ...)`, `When("deny override", ...)`, `Context("healthy", ...)`, `Context("unhealthy", ...)`.
- **Ginkgo semantics**: `Describe` for a feature/method, `Context`/`When` for a precondition or state. `When` reads best for conditional branches ("when X is true"); `Context` reads best for modes ("healthy", "GET").

### 3.3 It / test naming
- **Third-person imperative present tense**, describing the observable outcome:
  - ✅ `emits user.created event`
  - ✅ `returns the user`
  - ✅ `throws user not found`
  - ✅ `lists created users`
  - ✅ `removes all users`
  - ✅ `grants roles`
  - ✅ `recovers from panic`
  - ✅ `switches feature flag`
  - ✅ `logs in with admin user`
- **No `should` prefix.** `should return the user` is banned — it reads as hedging.
- **Lowercase, no trailing period.** The name is a clause, not a sentence.
- **Refer to the domain, not the mechanism.** `creates the user` beats `calls userService.create with email`.
- **When the branch is already expressed by a nested `describe`, the `it` name states only the outcome**: inside `describe("when not found", ...)`, write `it("throws user not found", ...)` — not `it("when not found, throws ...")`. The hierarchy does the composition.

## 4. Test Body Layout

### 4.1 Arrange / Act / Assert, separated by blank lines
Inside an `it` / `It` block, use blank lines to mark the AAA boundaries. Three visible phases. No phase labels, no comments — the blank lines are the signal.

```ts
it("finds created user", async () => {
  const user = await driver.users.create("joao");

  const found = await driver.users.find(user.id);

  expect(found).toEqual(user);
});
```

```go
It("grants permission", func(ctx SpecContext) {
  Expect(sut.Check(userPostDelete)).To(BeFalse())

  Must(sut.Add(userPostDeletePolicy))

  Expect(sut.Check(userPostDelete)).To(BeTrue())
})
```

### 4.2 Collapse when trivial
When there is no separate arrange step (or it is a single literal), inline act and assert into one expression. Don't invent a blank line that doesn't mark a real phase.

```ts
it("returns an empty array", async () => {
  expect(service.all()).resolves.toHaveLength(0);
});
```

```go
It("lists created users", func(ctx SpecContext) {
  user := Must2(userService.CreateUser(ctx, "joao@template.com"))
  Expect(userService.List(ctx)).To(ContainElement(user))
})
```

Rule of thumb: blank lines cost real estate. Use them when the reader benefits from seeing the phase boundary; skip them when the test fits on two lines.

### 4.3 One behavior per test
An `it` asserts one thing — one behavior, one outcome. Multiple `Expect` / `expect` calls on the *same* outcome (e.g. `status`, `body.x`, `body.y`) are fine because they describe one response. Asserting two unrelated behaviors ("creates the user AND emits the event") means two tests.

### 4.4 Happy path first, edge cases in nested blocks
Within a describe, order cases from most-general to most-specific:
1. Happy path `it`s at the top of the block.
2. Conditional branches as nested `describe("when X", ...)` / `When(...)` at the bottom.
3. Error cases as their own nested `describe`, never mingled with success cases.

This mirrors how the reader thinks about the method: "what does it do, and then under what edge conditions does it behave differently?"

## 5. Test-Scoped Variables

### 5.1 Declare outside, assign inside
Variables the test body reads are declared with `let` / `var` at the top of the `describe`, then populated in `beforeAll` / `BeforeEach`. Do not re-declare inside hooks.

```ts
describe(UserService, () => {
  let app: INestApplication;
  let service: UserService;
  let db: DBHarness;

  beforeAll(async () => {
    // ...assign service, app, db
  });
});
```

```go
var _ = Describe("user service", Ordered, func() {
  var (
    app         *fxtest.App
    userService *user.Service
    db          *gorm.DB
  )

  BeforeAll(func() {
    app = fxtest.New(...)
    // ...
  })
})
```

### 5.2 Constants at the top of the describe
Fixtures that don't change across tests — emails, passwords, IDs, ref values — go as `const` / bare declarations immediately inside the `describe`, above the setup hooks.

```go
var _ = Describe("casbin role manager", func() {
  user := ref.New("user", "111")
  admin := ref.New("role", "admin")
  customer := ref.New("role", "customer")

  var ( app *fxtest.App; sut *casbin.RoleManager )

  BeforeEach(func() { /* ... */ })
})
```

### 5.3 Subject naming
- TS: name the variable after the role — `service`, `controller`, `queue`, `processor`, `harness`, `driver`, `db`.
- Go: `sut` ("system under test") is acceptable when the test is narrowly focused on one object's behavior (see `permission_manager_test.go`, `role_manager_test.go`). For integration tests with multiple collaborators, name each one by its role (`app`, `api`, `db`, `checker`).

## 6. Setup / Teardown Lifecycle

### 6.1 The four hooks
| Hook | Purpose |
|---|---|
| `beforeAll` / `BeforeAll` | Boot the app / harness once per suite. Expensive setup goes here. |
| `beforeEach` / `BeforeEach` | Per-test reset: begin transaction, reset fake state, clear in-memory stores. |
| `afterEach` / `AfterEach` | Per-test teardown: rollback transaction. |
| `afterAll` / `AfterAll` | Tear down the harness / stop the fx app. |

### 6.2 Transaction isolation is the default
Integration tests wrap each `it` in a database transaction, rolled back in `AfterEach`. The harness exposes `db.begin()` / `db.rollback()` (or `BeginTx()` / `RollbackTx()`), so the test body only sees the primitives:

```ts
beforeEach(async () => { await harness.db.begin(); });
afterEach(async () => { await harness.db.rollback(); });
```

```go
BeforeEach(func() { app.BeforeEach() })
AfterEach(func()  { app.AfterEach() })
```

### 6.3 Explicit fake resets
Global test hooks (`jest.clearAllMocks()`) are not a substitute for resetting your own fakes. If a Fake carries state between tests, reset it explicitly in `beforeEach`:

```ts
const http = new FakeHTTPService();
beforeEach(() => { http.reset(); });
```

`jest.clearAllMocks()` is acceptable only when the test uses `jest.fn()`/`fn()` — and then it sits alongside Fake resets, not instead of them.

### 6.4 `Ordered` in Ginkgo
Use `Describe(..., Ordered, func() { ... })` whenever `BeforeAll`-scoped state is shared across `It`s (i.e., the fx app is booted once, transactions happen per-test). Without `Ordered`, Ginkgo may reorder specs and break the implicit dependency on setup order.

## 7. Test Harness (GOOS)

Every application has a single `TestHarness` (TS) / `harness.Harness` (Go). Its job:
1. Boot the full DI graph using the real `AppModule` / fx modules. Tests do not hand-wire dependencies.
2. Expose a `driver` / `Driver` for talking to the app.
3. Expose a `db` / transaction API for isolation.
4. Accept overrides (fakes, fx decorators, module customizers) as constructor options.
5. Provide `static setup()` and instance `teardown()`.

### 7.1 Shape of the harness

```ts
export class TestHarness {
  readonly driver: ApplicationDriver;
  readonly db: DBHarness;

  constructor(readonly app: INestApplication, readonly config?: TestHarnessConfig) {
    this.driver = ApplicationDriver.for(app);
    this.db = DBHarness.for(app);
  }

  static async setup(config?: TestHarnessConfig) { /* ... */ }
  async setup()    { await this.app.init(); }
  async teardown() { await this.app.close(); }
}
```

```go
type Harness struct {
  fxOptions []fx.Option
  app       *fxtest.App
  db        *gorm.DB
  // ...
}

func Setup(options ...Option) *Harness { /* ... */ }

func (h *Harness) NewDriver() *driver.Driver { /* ... */ }
func (h *Harness) BeforeEach()               { /* begin tx, reset in-memory users */ }
func (h *Harness) AfterEach()                { /* rollback */ }
func (h *Harness) Teardown()                 { h.app.RequireStop() }
```

### 7.2 Overrides via options
Don't add ad-hoc flags to `setup()`. Take options:
- TS: a `moduleCustomizers: ModuleCustomizer[]` array, where a customizer is `(builder: TestingModuleBuilder) => void`. Expose named helpers like `useFakeHTTP(fake)`, `useValue(token, value)`.
- Go: a functional-options pattern — `harness.Setup(harness.WithFxOptions(fx.Decorate(...)), harness.WithoutTX())`. Options are `Option` interface values that mutate the harness struct before it boots.

### 7.3 Dynamic port allocation
E2E harnesses allocate ports via `net.Listen(":0")` (Go's `test.AvailablePortProvider`). Tests never hardcode ports; the driver reads the chosen port off the harness.

### 7.4 No module-level harness singletons
Each `describe` / `Describe` owns its own harness instance in `beforeAll`/`BeforeAll`. Tearing down in `afterAll`/`AfterAll` is mandatory — a leaked harness leaks a pg connection pool, a Redis client, and a port.

## 8. Drivers

### 8.1 Purpose
A driver is the test's view of the application's public interface. HTTP endpoints are exposed through per-domain driver classes; the test calls `driver.users.create("joao")`, not `supertest.post("/users").send(...)`.

### 8.2 Structure
- A base `Driver` class holds the HTTP client (supertest agent, Hono app, URL + headers).
- Per-domain drivers (`UserDriver`, `AuthDriver`, `KVDriver`, `HealthDriver`, `PokeAPIDriver`) extend `Driver`.
- An `ApplicationDriver` aggregates per-domain drivers as properties or getters.

```ts
export class ApplicationDriver extends Driver {
  readonly users = new UserDriver(this.agent);
  get pokeapi() { return new PokeAPIDriver(this.agent); }
  health() { return this.agent.get("/health"); }
  static for(app: INestApplication) { return new ApplicationDriver(agent(app.getHttpServer())); }
}
```

### 8.3 Two levels of methods per operation
For every domain operation, the driver exposes **two** methods:
1. **High-level** (`create(name)`, `find(id)`, `list()`) — sends the request, asserts a successful status code, parses the response into a domain entity, returns the entity.
2. **Low-level** (`createReq(name)`, `findReq(id)`, `GetReq(key)`) — returns the raw response so the test can inspect status codes and error bodies.

This way, the happy-path test reads like domain code (`const user = await driver.users.create("joao")`) and the error-path test reads like an HTTP test (`const response = await driver.users.createReq(""); expect(response.status).toEqual(400);`).

### 8.4 `Must`-variants in Go
Go's driver methods return `(T, error)` pairs; `MustX` wrappers call `matchers.Must2(X())` to assert no error and unwrap the value. Ginkgo tests use `MustX` for happy paths and the plain method when they want to assert on the error.

```go
func (d *UserDriver) Get(id string) (user.User, error)   { /* ... */ }
func (d *UserDriver) MustGet(id string) user.User        { return matchers.Must2(d.Get(id)) }
```

### 8.5 Domain parsing in drivers
A driver's high-level method parses the JSON body into the real domain class — it does not return a raw `body`. In TypeScript, use `new User(body.id, body.name)`; in Deno templates, Zod-parse first:

```ts
private parseUser(body: unknown): User {
  const { id, name } = this.userSchema.parse(body);
  return new User(id, name);
}
```

### 8.6 Drivers don't own assertions
A driver may assert on HTTP status to enforce its contract ("`create` returns 201 and a user"), but it never asserts on domain content. Domain assertions are the test's job.

## 9. Fakes vs Mocks

### 9.1 Fakes (the default)
Every collaborator behind an interface in the domain has a Fake implementation for tests. Rules:
- **Named `FakeX`** and placed under `test/fakes/` (TS) or `test/` (Go).
- **`implements` / satisfies the real interface.** Compile-time check; in Go, use `var _ Interface = (*FakeX)(nil)`.
- **Stateful, with explicit seed methods.** `addResponse(r)`, `setNextStatus("down")`, `Clear()`, `reset()`. No framework magic.
- **Captures inputs** for assertion: a `requests: [...]` array, a `generatedIDs: [...]` slice.
- **Deterministic.** `FakeClock` / `FixedClock` returns a fixed date. `IncrementalIDFactory` counts up from `1`. No randomness, no wall-clock calls.
- **`reset()` clears all captured state and queued responses.** Called explicitly in `beforeEach`.

Example (`FakeHTTPService`): implements `HTTPService`, stores `requests[]` and `responses[]`, exposes `addResponse(Response)` and `reset()`, pops responses from a queue on each `get`/`post`.

Example (`InMemoryUserProvider`): implements `authn.UserProvider`, backs users by `map[string]string`, exposes `Clear()` for per-test reset, is provided via `fx.Decorate` in the test harness.

### 9.2 Generated / inline mocks (narrow escape hatch)
Generated or inline mocks (`jest.fn()`, `fn()` from `@std/expect`, mockgen) are allowed **only** when:
- The interface is owned by a third-party library (BullMQ `Queue`, `PinoLogger`, GORM internals).
- The test is asserting **that a call happened with specific arguments** — not that a value was transformed, not that a sequence of calls produced an outcome.
- The mock has zero state beyond what `toHaveBeenCalledWith` reads.

Once you need `if (args.x) return y`, you've outgrown a mock. Write a Fake.

### 9.3 Injection
Fakes are injected through the DI container, not by import-time module patching:
- TS: `Test.createTestingModule({ imports: [AppModule] }).overrideProvider(Token).useValue(fake)`, wrapped in a named customizer like `useFakeHTTP(fake)`.
- Go: `fx.Decorate(func(original Interface) Interface { return fake })`, exposed as `NopProbeProvider`, `FakeAuthnProviders`, `harness.WithFxOptions(...)`.

### 9.4 `NopProbe` / `NopLogger`
Observability probes and loggers have a dedicated `NopProbe` / `NopLogger` / `NopLoggerProvider` implementation that satisfies the interface with empty bodies. Tests inject these to keep output quiet and to decouple from metric/log assertions (unless the test's subject *is* the probe).

## 10. Assertions

### 10.1 Style
- **Go (Gomega)**: `Expect(x).To(Equal(y))`, `ConsistOf`, `ContainElement`, `BeEmpty`, `BeNil`, `BeTrue`/`BeFalse`, `MatchError`, `BeTemporally("~", ...)`, `HaveKeyWithValue`, `HaveLen`, `PanicWith`, `ContainSubstring`.
- **TS (bun:test / @std/expect / node:test)**: `expect(x).toEqual(y)` for deep equality, `toBe(y)` for identity, `resolves.`/`rejects.` for promises, `toContainEqual`, `toMatchObject`, `toHaveBeenCalledWith`.

### 10.2 Structural matchers
Deep-equal full objects when practical (`expect(found).toEqual(user)`). When the object has volatile or irrelevant fields, use:
- `expect.objectContaining({...})`, `expect.arrayContaining([...])`, `expect.any(Class)`.
- The custom `containing()` helper (recursive `objectContaining` + `arrayContaining`) when you want "structurally contains these fields, everywhere, at any depth."

### 10.3 Error assertions
- TS: `expect(service.find(id)).rejects.toEqual(new UserNotFoundError(id))` — compare against the real domain error instance.
- Go: `Expect(err).To(MatchError(authn.ErrUserNotFound))` — compare against the exported sentinel.

Never assert on string-matched messages unless the message is the contract (e.g., panic messages in `PanicWith`).

### 10.4 HTTP assertions
For HTTP tests, assert on three things in order: status, body shape, and — if relevant — captured side-effect state (`http.requests`, fake DB counts). Pattern:

```ts
expect(res.status).toBe(404);
expect(res.body).toEqual({ /* ... */ });
expect(http.requests).toEqual([
  expect.objectContaining({ method: "get", url: "https://..." }),
]);
```

## 11. Test Helpers

### 11.1 `Must` / `Must2` (Go)
Lives in `test/matchers/must.go`. Strip the `error` out of a `(T, error)` return, asserting it's `nil`, so the test body reads linearly:

```go
user := Must2(userService.CreateUser(ctx, "joao@template.com"))
Must(sut.Add(policy))
```

Use `Must` / `Must2` for operations whose error is not the subject of the test; use the raw `err` return when the error *is* what you're asserting on.

### 11.2 `containing` (TS)
Recursive `objectContaining`/`arrayContaining` helper in `test/util/containing.ts`. Imports `test/assert-not-prod` at the top to guard against accidental inclusion in production builds.

### 11.3 `req` (Go) / supertest / Hono `app.request` (TS)
A thin HTTP client wrapping the stdlib or framework. Drivers call into `req`/`supertest`; tests never import it directly.

### 11.4 `assert-not-prod`
Test-only helpers that carry matcher-like behavior import `test/assert-not-prod` at the top so that accidentally bundling them into production throws at module load.

## 12. Principles from the Literature

The templates embody a stack of testing principles drawn from GOOS (Freeman & Pryce), *xUnit Test Patterns* (Meszaros), *Clean Code* (Martin), *TDD By Example* (Beck), *Refactoring* (Fowler), *Modern Software Engineering* (Farley), *The Pragmatic Programmer* (Hunt & Thomas), and *Unit Testing Principles, Practices, and Patterns* (Khorikov). What follows is the working subset — the principles you should actively apply, not just recognize.

### 12.1 The four pillars of a good unit test (Khorikov)
Every test trades off four properties:
1. **Protection against regressions** — catches real bugs in real code paths.
2. **Resistance to refactoring** — survives internal restructuring when behavior is unchanged.
3. **Fast feedback** — runs in milliseconds.
4. **Maintainability** — cheap to read, cheap to keep working.

You can max three at once; one always gives. Unit tests favor 2/3/4 and pay some 1. Integration tests buy more 1 by giving up some 3. End-to-end tests buy the most 1 by giving up 3 and often some 2 and 4. The mix is a portfolio, not a ranking — which is why we build a pyramid (§12.9), not a uniform suite.

The two axes we watch closest are **resistance to refactoring** and **protection against regressions** — together they determine whether a test is useful or noise. A test with low resistance to refactoring (breaks every time you rename an internal method) *and* low protection against regressions (wouldn't catch a real bug) is a trivial test — delete it.

### 12.2 Observable behavior vs implementation detail (Khorikov)
Assert only on **observable behavior** — what a client of the subject can see through its public API. Do not assert on implementation details (private methods, internal fields, the exact sequence of internal calls). A test coupled to implementation details is *brittle*: it breaks under refactoring even when behavior is unchanged, which teaches the reader to either stop refactoring or stop trusting the tests. Both outcomes are worse than no test.

Concretely:
- ✅ `userService.find(id)` returns the user that was created.
- ✅ `POST /users` returns 201 with the created user in the body.
- ✅ The event emitter received `UserCreatedEvent` — the event is an observable cross-boundary signal, not an internal detail.
- ✅ `http.requests` (the fake's captured-request list) contains the expected outbound call — the request crossing a system boundary *is* the contract.
- ❌ `userService.find` called `repository.queryBuilder().where(...)` internally.
- ❌ A private helper was invoked with specific arguments.

Rule: the test for a behavior must survive any refactoring of that behavior that preserves its contract. If it breaks, one of two things is true — you broke the behavior, or you were coupled to implementation.

### 12.3 Three styles of verification (Khorikov)
Three ways a test can know the code worked. Prefer them in this order:
1. **Output-based** — the function returns a value; assert on the return value. Purest. Survives any refactor except changing the return type.
2. **State-based** — the system mutates state; assert on the state afterward (e.g., read back through the real repository, check a fake's captured state).
3. **Communication-based** — the code calls a collaborator; assert on the interaction with a spy or mock. Most fragile; hardest to refactor around.

The templates lean strongly output- and state-based. Communication-based verification is reserved for the narrow escape hatch in §9.2 — a third-party queue, a logger, a probe — where the call itself *is* the observable outcome. If you reach for `toHaveBeenCalledWith` on your own code, you've coupled the test to a call sequence you chose, not a contract the client depends on. Rewrite the test around the return value, the persisted state, or the emitted event.

### 12.4 The test double taxonomy (Meszaros)
Precise names for precise roles. Use the right one and the test reads correctly.

| Double | Purpose |
|---|---|
| **Dummy** | Passed to satisfy a signature; never invoked. |
| **Stub** | Returns canned answers. No recording. |
| **Fake** | Working implementation with a shortcut (in-memory store, fixed clock, JWT signed with a test secret). Deterministic. |
| **Spy** | Records interactions for later inspection. May return canned answers. |
| **Mock** | Pre-programmed with expectations; fails the test itself if the protocol is wrong. |

The templates are built on **Fakes**: `FakeHTTPService` captures requests and pops pre-seeded responses; `InMemoryUserProvider` is a working in-memory `authn.UserProvider`; `FixedClock` is deterministic; `FakeHealthService` wraps a real checker with a healthy/unhealthy toggle. Many of these Fakes also spy (`FakeHTTPService.requests[]`) — a Fake can record without becoming a Mock. What the templates *don't* do: build Mocks that fail the test if the wrong method is called. `toHaveBeenCalledWith` on a `jest.fn()` is a thin spy with an external verification — not a Mock in Meszaros's sense.

Name your double after its role. A `StubUserProvider` that returns one canned user is not a `FakeUserProvider`, even if the type looks similar. The name tells the reader what power they have.

### 12.5 Only mock types you own (GOOS)
Never stand up a Mock, Stub, or Fake directly for a third-party class. Wrap the third-party in an interface *you* own, then fake your interface.

This is why the templates have `HTTPService` (our interface) with `FetchService` (real adapter) and `FakeHTTPService` (fake) — not a `jest.mock("node:fetch")`. Same pattern for `Clock`, `IDService`, `authn.UserProvider`, `authn.TokenProvider`, `kv.Store`. The third-party library (`node-fetch`, `uuid`, Casdoor, Redis) sits behind *our* interface; tests only ever see our interface.

Consequence: when a third-party API changes, one adapter class changes and every test keeps working. When the domain grows, we extend *our* interface — not a shim over someone else's API. Tests that mock a library directly bake that library's idioms into the test suite, and every library upgrade becomes a test-rewrite project.

### 12.6 Managed vs unmanaged dependencies (Khorikov)
For integration tests, distinguish:
- **Managed dependencies** — state we fully own, not visible outside our app (our database, our Redis namespace). Use the **real thing** in integration tests, isolated per test via transaction rollback (§6.2). Faking the DB in your own integration tests is a way to ship migration bugs to production — a mock that "works" on a schema the real DB doesn't have is worse than no test.
- **Unmanaged dependencies** — external services we don't own (third-party APIs, payment gateways, email, OAuth providers). Use **Fakes**: they're not our contract, we can't run a real one deterministically in CI, and the network is a shared resource that violates Repeatability.

The templates embody this split: Postgres and Redis are real in integration tests (via transaction rollback); PokeAPI (`FakeHTTPService`) and Casdoor (`InMemoryUserProvider` + `JWTTokenProvider`) are faked.

### 12.7 Outside-in TDD and the walking skeleton (GOOS)
Start a feature from the outside:
1. Write a failing **end-to-end test** that describes the full user-visible behavior (e.g., `POST /users` returns 201 with the new user). It fails because the route doesn't exist.
2. Drop down one layer at a time — controller, service, repository — writing unit tests that force each layer into existence.
3. When the unit tests are green all the way down, the e2e test goes green.

Before any of this, build a **walking skeleton**: the thinnest possible end-to-end path (a route returning a canned value, wired through real DI, served by the real HTTP framework, tested by the real harness). It verifies the plumbing — ports, DI wiring, test harness, CI — before any real behavior exists. Once the skeleton walks, every feature is an addition, not a pioneering act. The templates *are* walking skeletons: they each ship with one end-to-end route (`/users`, `/health`, `/kv`) wired through the full stack, so new features graft onto a known-working spine.

### 12.8 Listen to the tests (GOOS)
Tests are a design feedback channel, not just a verification tool. Specific pains map to specific design problems:
- **"This test needs 30 lines of setup."** → The subject has too many collaborators. Split it, or introduce a higher-level role that aggregates them.
- **"I need to mock five things to test one method."** → The subject knows too much about its collaborators. Invert a dependency, or replace the mock swarm with a single Fake of a coarser-grained role.
- **"I can't test this without peeking at private state."** → The behavior isn't observable through the public API. Either the behavior doesn't belong here, or the API is missing a return value / event / accessor that should represent the contract.
- **"The test breaks every time I refactor."** → You're asserting on implementation details (§12.2). Move assertions to observable behavior.
- **"This test is flaky."** → Non-determinism has leaked in (wall-clock, random, ordering, network, shared global state). Find the seam and inject a deterministic fake.
- **"I need a real database for this unit test."** → The "unit" is too big, or repository concerns have leaked into the service. Split.

Do not silence test pain with mocking frameworks. The pain is the signal.

### 12.9 The test pyramid (Cohn; reinforced by Farley, Khorikov)
Shape of a healthy suite:
- **Many fast unit tests** at the base — milliseconds, one behavior each, no I/O.
- **Fewer integration tests** in the middle — real managed dependencies (DB, Redis) under transaction isolation.
- **Even fewer end-to-end tests** at the top — full HTTP / full DI / full stack; expensive, so reserved for user-visible workflows.

Inverted pyramids (mostly e2e) give slow feedback and fragile suites. Hourglass suites (unit + e2e, skipping integration) miss the bugs that live at the integration layer — schema drift, mapper errors, transaction boundaries. Match each test to what it verifies: domain logic → unit; repository + DB contract → integration; user-visible workflow → e2e.

### 12.10 The unit is a behavior, not a class (Khorikov)
"Unit test" doesn't mean "one class, all collaborators mocked." It means "one behavior, isolated from other *tests*." A unit test may legitimately exercise a service, a value object, and a pure helper together — they form one cohesive behavior. What makes it a unit is that it's fast, hits no I/O, and doesn't depend on other tests' state.

This is the **classical** (Detroit) school of unit testing; the templates practice it. The **London** (mockist) school — mock every collaborator around the class — is what produces the "five mocks per method" test smell. We don't. Real collaborators are the first choice; Fakes enter at I/O boundaries and unmanaged seams.

## 13. Test Smells (Meszaros)

Recognize and fix. Not just style issues — each one is a pointer to a specific design or process defect.

- **Obscure Test** — the reader can't see what's being tested through the setup noise. *Fix*: extract setup into `beforeEach`, Test Data Builders (§14.1), or a Test DSL (§14.3).
- **Eager Test** — one `it` verifies multiple unrelated behaviors. *Fix*: split; one behavior per test (§4.3).
- **Mystery Guest** — the test depends on data it didn't create (a global fixture file, a DB row seeded elsewhere, an env var). *Fix*: create all required state inside the test via the driver or fake. Transaction rollback makes this cheap.
- **Fragile Test** — breaks under unrelated refactoring. *Fix*: move assertions from implementation details to observable behavior (§12.2).
- **Conditional Test Logic** — `if`/`else`, `for`, `try`/`catch` inside the test body. *Fix*: split branches into separate tests or use parameterized tests (§14.4). Replace `try`/`catch` with `rejects.toEqual(...)` / `Expect(err).To(MatchError(...))`.
- **Test Code Duplication** — the same setup block copy-pasted across files. *Fix*: extract into the harness, a driver method, a Test Data Builder, or a shared Fake. Test code is production code.
- **Erratic / Flaky Test** — passes sometimes, fails sometimes. *Fix*: find the non-determinism (wall-clock, random IDs, hash iteration, network, shared DB state) and replace it with a deterministic fake. Flaky tests are worse than no tests — they train the team to ignore red.
- **Slow Test** — minutes of feedback. *Fix*: push the assertion down the pyramid (§12.9). What of this test actually needs a real HTTP round-trip?
- **Interacting Tests** — Test A must run before Test B. *Fix*: each test creates its own state; rollback or fake-reset in `afterEach`.
- **Resource Leakage** — connection pool, port, goroutine leaks across tests. *Fix*: `afterAll` / `AfterAll` is mandatory; harness `teardown()` closes everything it opened.
- **Trivial Test** — asserts that a getter returns the constructor argument; verifies nothing the type system wouldn't. *Fix*: delete.
- **Test Logic in Production** — `if (process.env.NODE_ENV === "test") { ... }` in domain code. *Fix*: inject the seam. If production behaves differently under test, the injection is wrong.
- **Assertion Roulette** — many unlabeled asserts in one test; the failure message can't tell you which fired. *Fix*: split, or extract a named Custom Assertion (§14.6).
- **Hard-Coded Test Data** — magic UUIDs, timestamps, names scattered through the body. *Fix*: named constants at the top of the `describe`, or a Test Data Builder.
- **The Free Ride** — piggy-backing a new assertion into an existing test "because the state is already there." *Fix*: a new behavior is a new test, even if the setup repeats. Duplication of intent beats conflation of cases.

## 14. Test Patterns

### 14.1 Test Data Builders (Meszaros)
Fluent builders for domain fixtures. Sensible defaults hide irrelevant fields; only what the test cares about appears in the body.

```ts
const admin = aUser().withRole("admin").build();
const alice = aUser().withName("alice").withEmail("alice@template.com").build();
```

Reach for a Builder once a test varies more than two fields, or once three tests share the same shape. Below that threshold, inline construction is simpler — don't prematurely abstract.

### 14.2 Object Mother (Meszaros)
Named factory methods for common, named instances:

```ts
const alice = Users.alice();   // pre-configured admin
const bob   = Users.bob();     // pre-configured customer
```

Mothers are simpler than Builders but less flexible. Use them when fixtures are finite and named in the domain ("alice the admin", "bob the customer"). Switch to a Builder when you catch yourself adding a tenth `Users.xxx()`.

### 14.3 Domain-Specific Testing Language (Clean Code, GOOS)
Tests should read at the domain level, not the framework level. Build up a vocabulary in the driver, harness, and Fake seed methods so the `it` body says *what* happens, not *how*.

Bad:
```ts
const response = await agent.post("/auth/register").send({ email, password });
expect(response.status).toBe(201);
const login = await agent.post("/auth/login").send({ email, password });
expect(login.status).toBe(200);
```

Good:
```go
api.Auth.MustRegister(email, password)
token := api.Auth.MustLogin(email, password)
```

Every driver method, `Must` helper, and Fake seed method is a word in the DSL. The test reads like a spec, not a transport log.

### 14.4 Parameterized tests
When the same behavior runs against many inputs, use the framework's parameterized primitive — *not* a loop inside one `it`.

```ts
it.each([
  { name: "sets job id to user id",      spec: { jobId: event.user.id } },
  { name: "sets attempts to 5",          spec: { attempts: 5 } },
  { name: "removes the job on complete", spec: { removeOnComplete: true } },
])("$name", async ({ spec }) => {
  await queue.schedule(event);
  expect(bullQueue.add).toHaveBeenCalledWith(
    "user.created",
    expect.any(UserCreatedEvent),
    expect.objectContaining(spec),
  );
});
```

Each row reports as a separately named test — a failure tells you exactly which row broke. Never `for (const x of xs) it(...)` when `.each` (or Go's table-driven `for` wrapping `DescribeTable` / `It`) is available.

### 14.5 Characterization tests (Feathers; *Refactoring*)
When you inherit untested code and need to change it, pin down current behavior first. Write a test that asserts what the code *currently* does — not what it *should* do. The characterization test is a vice: it holds the code still while you refactor. Once the refactor is done and the test is still green, you can *then* change the behavior (and the test) deliberately. Without this step, every refactor is a guess.

### 14.6 Custom assertions / verification methods (Meszaros)
When the same assertion bundle appears in three or more tests, extract it into a named helper that reads at the domain level:

```ts
expectValidUser(user);     // id format, non-empty name, default role
expectHealthOK(response);  // 200 + body.status === "ok"
```

`containing()`, `Must`, `Must2` (§11) are the same idea at a lower abstraction. Domain-named matchers are the upper end of the same gradient.

## 15. Anti-Patterns

- **Testing private methods directly.** If you want to test a private method, the method is a collaborator wanting to be extracted. Either it's an implementation detail (covered by the public tests — no extra test needed) or it's a hidden object (extract to a class, test through *its* public API).
- **Chasing coverage percentages.** 100% line coverage with weak assertions is worse than 70% with sharp ones. Coverage says what code ran, not whether its behavior is correct. If you need to measure suite quality, measure mutation score (does the suite catch injected bugs?), not line coverage.
- **Mocking the subject's collaborators by default.** That's the London-school reflex. In the classical school we practice (§12.10), real collaborators are the first choice; Fakes enter at I/O boundaries and unmanaged seams.
- **`jest.mock()` / `vi.mock()` / module patching.** The templates never use import-time module replacement. Fakes are wired through DI (`overrideProvider`, `fx.Decorate`); that's the only seam.
- **`beforeEach` that rebuilds the DI container.** Each fresh boot costs seconds; the suite will slow until nobody runs it locally. Boot once in `beforeAll`; reset state per test.
- **"I'll add tests later."** Later never comes. TDD or the test lands in the same PR.
- **Asserting on log output.** Logs are for humans. If you need to assert on an event, it should be an event object (typed, structured), not a grep against stderr.
- **Sleep-based waits.** `await sleep(500)` is a flaky test waiting to happen. Wait on a condition (the event arrived, the state changed), not on wall-clock time.
- **Shared mutable test fixtures.** A module-level `const user = ...` mutated by one test and read by another is a pyramid scheme of test order. Each test builds its own state.
- **Catch-all `try/catch` around the subject.** Replaced by `expect(...).rejects.toEqual(...)` / `Expect(err).To(MatchError(...))`. `try/catch` in a test body is almost always a smell — you're either swallowing an assertion failure or you should be using a rejection matcher.
- **Branching on environment inside a test.** `if (process.env.CI) expect(...)` trains everyone to ignore the "other" case. Make the test deterministic or split it.

## 16. Language-Specific Notes

### 12.1 TypeScript
- Runners: **bun:test** (Nest template), **node:test** with **@std/testing/bdd** on Deno. Prefer the project's configured runner — do not add Jest or Vitest.
- Assertion library: `bun:test`'s `expect`, `@std/expect`'s `expect`, or `node:assert/strict`. Do not mix.
- Avoid `jest.fn()` / `vi.fn()` outside §9.2.
- `describe(ClassSymbol, () => {})` is preferred over `describe("ClassName", ...)` because it stays in sync when the class is renamed.

### 12.2 Go
- **Package name is `<pkg>_test`** for black-box testing — the test sees only the exported surface. Tests that need unexported access go in `package <pkg>` (same directory), but this should be the minority.
- Each test file has **one `TestXxx(t *testing.T)` entry point** that calls `RegisterFailHandler(Fail)` and `RunSpecs(t, "<name> suite")`. The rest of the file is package-level `var _ = Describe(...)` declarations.
- Use `func(ctx SpecContext)` for specs that need a context (GORM, HTTP). The `SpecContext` is Ginkgo's integration with `context.Context`.
- Use `Ordered` (§6.4) whenever `BeforeAll` boots state consumed by multiple `It`s.
- `fxtest.New(GinkgoT(), ...modules, fx.Populate(&target))` is the canonical harness boot. Never call constructors directly in an integration test.

### 12.3 Deno
- Runner: `@std/testing/bdd` + `@std/expect`.
- Mocks: `fn()` from `@std/expect` is the only acceptable mock primitive, and only under §9.2.
- `nock` via a `RequestRecorder` class captures external HTTP in fixtures under `test/nock/fixtures/` — treat fixtures as committed snapshots.

## 17. Summary Cheat Sheet

- **Did I co-locate the unit test with its source?** If not, move it.
- **Is the top-level `describe` the symbol under test (class ref) or the route path (string)?** Anything else is wrong.
- **Are my `it` names imperative, lowercase, no `should`?** `returns the user`, not `should return a user`.
- **Do arrange / act / assert sit in three visible phases separated by blank lines?** Or is the test trivial enough to be one line?
- **One behavior per `it`?** Multiple unrelated behaviors → split.
- **Happy path first, edge cases in nested `describe("when ...")` / `When(...)`?**
- **Did I declare test variables outside setup and populate them inside?** No re-declaration in hooks.
- **Is there a `TestHarness` / `harness.Harness`?** Is the test talking to the app only through a `Driver`? If the test imports `supertest`, `Hono`, or `fiber` directly, refactor.
- **Am I using `jest.fn()`/`fn()` for a domain dependency?** Stop. Write a Fake under `test/fakes/` or `test/`.
- **Does my Fake `implements` the real interface and expose explicit seed + `reset()` methods?**
- **Did I inject the Fake through DI (`overrideProvider` / `fx.Decorate`) rather than module patching?**
- **Do I reset Fake state and begin/rollback a transaction in `beforeEach`?** If not, tests leak state.
- **Did I use `Must`/`Must2` (Go) for errors that aren't the subject of the test?**
- **Does my driver expose both `X()` (high-level, parsed) and `XReq()` (raw response) for every operation?**
- **Did I use `Ordered` on Ginkgo `Describe`s that share `BeforeAll` state?**
- **Did I start red, go green with the simplest change, and refactor on green?** TDD loop (§1).
- **Does the test satisfy F.I.R.S.T.?** Fast, Independent, Repeatable, Self-validating, Timely.
- **Am I asserting observable behavior, or coupled to implementation details?** (§12.2)
- **Could this verification be output-based instead of state- or communication-based?** Prefer simpler styles. (§12.3)
- **Am I using the right test-double name for what I built?** Dummy / Stub / Fake / Spy / Mock — precise roles. (§12.4)
- **Am I mocking a type I don't own?** Wrap it, own the interface, fake that. (§12.5)
- **Is this a managed dependency (use real, isolate) or unmanaged (use fake)?** (§12.6)
- **Did I start outside-in from a failing e2e test, or did I stub a skeleton in and backfill?** (§12.7)
- **Did I listen to the test pain and fix a design smell, or did I work around it?** (§12.8)
- **Is this test earning its place on the pyramid, or could it run cheaper one layer down?** (§12.9)
- **Does this test have any of the catalogued smells?** Obscure, Eager, Mystery Guest, Fragile, Conditional Logic, Duplication, Flaky, Slow, Trivial, Assertion Roulette, Free Ride. (§13)
- **Am I reading the test at the domain level, or at the framework level?** Grow the DSL. (§14.3)
- **Am I falling into an anti-pattern?** Private-method tests, coverage worship, London-school reflex, module patching, slow `beforeEach`, sleep-based waits. (§15)
