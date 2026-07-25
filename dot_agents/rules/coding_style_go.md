# Go Coding Style

Language-specific preferences for Go projects. Read the generic `coding_style.md` first for universal principles.

## 1. Domain Modeling

### Entities
- Domain structs contain domain data and behavior, without serialization or persistence tags.
- Adapter persistence models own their ORM's tags, generated database keys, and associations;
  explicit mappers translate them to domain types when the shapes differ.

### DTOs
- Plain structs for each operation: `CreateOrderDTO`, `UpdateOrderDTO`, `FindOrderDTO`.
- No tags needed on DTOs (they don't serialize to JSON or DB directly).
- Separate from entities -- they represent operation inputs, not persisted state.

### Repository Interfaces
- Defined in the domain package alongside entities.
- Methods accept `context.Context` as first parameter.
- Return domain types plus stable port errors. Reserve domain errors for business outcomes.

## 2. Errors

- **Sentinels are package-level `var`s**; anything carrying data is a struct type with an
  `Unwrap() error` method:

```go
var (
    ErrNotFound   = errors.New("order not found")  // domain outcome
    ErrRepository = errors.New("repository error") // port failure
)
```

- **Wrap within a layer, translate across one.** `fmt.Errorf("loading order %s: %w", id, err)`
  adds context while keeping the cause reachable. At a boundary the cause is an
  implementation detail — an adapter returns the port's sentinel, not the driver's error
  (`coding_style.md` §2e). `%v` instead of `%w` is the deliberate choice to stop unwrapping.
- **`errors.Is` for identity, `errors.As` for data.** `errors.Is(err, ErrNotFound)` matches a
  sentinel through any depth of wrapping; `errors.As(err, &pgErr)` extracts a typed error to
  read its fields. Never match on the message string.
- **Wrap once per layer.** "failed to" prefixes stack up into unreadable sentences; each `%w`
  adds only what the caller could not already know.

## 3. Resource Cleanup

- **`defer` the release on the line after the acquisition** — the pairing is what makes it reviewable.
- **`defer` is function-scoped, not block-scoped.** A `defer` inside a loop accumulates until
  the function returns; extract the body into its own function.
- **`defer cancel()` for every `context.WithCancel` / `WithTimeout`**, including when the
  context is obviously finished. `go vet`'s `lostcancel` check exists because this is missed.
- **Check the error from a deferred `Close` on anything you wrote to** — that is where a
  flush failure surfaces. Discard it explicitly (`_ = f.Close()`) on a read-only handle.

## 4. Concurrency

- **Minimal and explicit**: Use goroutines and channels when concurrency is required and ownership, cancellation, and shutdown are clear.
- **Never start a goroutine without knowing how it stops.** The party that starts it owns
  waiting for it — `sync.WaitGroup`, `errgroup.Group`, or an explicit done channel. A
  fire-and-forget goroutine is a leak that has not been observed yet.
- **Context propagation**: Pass `context.Context` through I/O call paths for cancellation and deadlines. Propagate the context through every ORM and driver call.
- **Select on `ctx.Done()` in any loop that can block**, and give every channel send a
  receiver that outlives it. A send with no receiver blocks its goroutine forever.
- **Never store a `context.Context` in a struct field.** It is a call parameter; a stored one
  outlives the request it belongs to.

## 5. Generics

- **Introduce a type parameter only when two concrete instantiations already exist.** One caller
  is speculative generality (`coding_style.md` §3).
- **Constrain to the smallest set that compiles.** `any` only when the function never inspects
  the value.
- **An interface dispatches; a generic specializes.** Behavior that differs per type is an
  interface, not a constraint.

## 6. Interface Ownership

- **Accept interfaces, return structs.** A constructor returns its concrete type; the consumer
  declares the narrow interface it needs, in its own package. An interface sitting next to its
  single implementation is usually that implementation's shape, not a port.
- Interfaces stay small — one to three methods. A large one is a package boundary that has not
  been drawn yet.

## 7. Naming Conventions

### Variables & Receivers
- **One receiver name per type, on every one of its methods** (`staticcheck` ST1016). Length is
  the repo's call — Go's own norm is a one- or two-letter abbreviation; some codebases name the
  role in full. Match what the type's existing methods already use.
- **Short-lived variables**: `o` for order, `err` for error, `ctx` for context.
- **Descriptive for longer scope**: `userID`, `orderID`, `controller`.

### Interfaces
- Named as agent nouns or capabilities: `Repository`, `Service`, `Probe`, `Checker`, `Encrypter`, `Encoder`.
- Single responsibility: `OrderRepository` (not `OrderAndCustomerRepository`).

### Constructors
- `New<Type>` pattern: `NewOrderService`, `NewController`.

### Import Organization
Run the project's formatter — `goimports`, usually through `golangci-lint fmt`. Do not
hand-arrange groups: `goimports` sorts *within* a group but never moves an import between
groups, so whatever grouping a file already has is the grouping it keeps. Match the
surrounding files. Only a configured tool (`goimports -local`, or `gci` in `.golangci.yaml`)
makes a project-wide order real; absent that config, there is no order to enforce.

## 8. Testing

`testing/00-index.md` governs test discipline; these are the Go spellings of two of its rules.

- **Table-driven tests use `t.Run`, one subtest per row** — the Go primitive `03-test-aesthetics.md`
  §4.7 names. The row's name is the test's name, and the failure line identifies the input.
- **Fakes of owned ports are the default double**, hand-written, with explicit seed and reset
  per `02-mocking-roles.md` §4. `mock.go` for mockgen output is permitted only in an adapter
  package whose subject is a third-party contract (`02-mocking-roles.md` §6).
