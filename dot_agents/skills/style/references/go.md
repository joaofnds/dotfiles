# House coding style: Go

Language-specific rules for Go projects, on top of core.md.

Contents: domain modeling; errors; resource cleanup; concurrency; generics;
interface ownership; naming; imports; arithmetic; modern Go; testing.

## Domain modeling

- Domain structs contain domain data and behavior, without serialization or
  persistence tags.
- Adapter persistence models own their ORM's tags, generated database keys, and
  associations. Explicit mappers translate them to domain types when the shapes
  differ.
- DTOs are plain structs, one per operation: `CreateOrderDTO`, `UpdateOrderDTO`,
  `FindOrderDTO`. They carry no tags, because they serialize to neither JSON nor
  the database directly. They stay separate from entities. They represent operation
  inputs, not persisted state.
- Repository interfaces live in the package that owns the contract, placed by
  core.md's contract-placement rule: beside the entity when the domain service is
  the only client, in the capability's own interface-only package when several
  domains share it.
- Repository methods accept `context.Context` as the first parameter.
- Repositories return domain types plus stable port errors. Reserve domain errors
  for business outcomes.

## Errors

- Sentinels are package-level `var`s. Anything carrying data is a struct type with
  an `Unwrap() error` method.

```go
var (
    ErrNotFound   = errors.New("order not found")  // domain outcome
    ErrRepository = errors.New("repository error") // port failure
)
```

- **Wrap within a layer, translate across one.** `fmt.Errorf("loading order %s: %w",
  id, err)` adds context while keeping the cause reachable. At a boundary the cause
  is an implementation detail. An adapter returns the port's sentinel, not the
  driver's error. `%v` instead of `%w` is the deliberate choice to stop unwrapping.
- **`errors.Is` for identity, `errors.As` for data.** `errors.Is(err, ErrNotFound)`
  matches a sentinel through any depth of wrapping, where `err == target` misses
  wrapped errors. `errors.As(err, &pgErr)` extracts a typed error to read its
  fields. Never match on the message string.
- **Wrap once per layer.** Stacked "failed to" prefixes make unreadable sentences.
  Each `%w` adds only what the caller could not already know.

## Resource cleanup

- `defer` the release on the line after the acquisition. The pairing is what makes
  it reviewable.
- `defer` is function-scoped, not block-scoped. A `defer` inside a loop accumulates
  until the function returns. Extract the loop body into its own function.
- `defer cancel()` for every `context.WithCancel` and `WithTimeout`, including when
  the context is obviously finished. `go vet`'s `lostcancel` check exists because
  this is missed.
- Check the error from a deferred `Close` on anything you wrote to. That is where a
  flush failure surfaces. Discard it explicitly (`_ = f.Close()`) on a read-only
  handle.

## Concurrency

- Concurrency is minimal and explicit. Use goroutines and channels when concurrency
  is required and ownership, cancellation, and shutdown are clear.
- **Never start a goroutine without knowing how it stops.** The party that starts it
  owns waiting for it: `sync.WaitGroup`, `errgroup.Group`, or an explicit done
  channel. A fire-and-forget goroutine is a leak that has not yet been observed.
- Pass `context.Context` through I/O call paths for cancellation and deadlines.
  Propagate the context through every ORM and driver call.
- Select on `ctx.Done()` in any loop that can block. Give every channel send a
  receiver that outlives it. A send with no receiver blocks its goroutine forever.
- Never store a `context.Context` in a struct field. It is a call parameter. A
  stored one outlives the request it belongs to.

## Generics

- Introduce a type parameter only when two concrete instantiations already exist.
  One caller is speculative generality.
- Constrain to the smallest set that compiles. Use `any` only when the function
  never inspects the value.
- An interface dispatches; a generic specializes. Behavior that differs per type is
  an interface, not a constraint.

## Interface ownership

- **Accept interfaces, return structs.** A constructor returns its concrete type.
  The consumer declares the narrow interface it needs. Go packages are small enough
  that the consumer is usually a single package, so this lands where core.md's
  contract-placement rule does, the same principle at finer grain. It still decides
  something. Once several packages consume one contract, a narrow per-consumer
  interface and one shared port differ in width and owner, and the
  count-and-locality test picks between them. An interface sitting next to its
  single implementation is usually that implementation's shape, not a port.
- Interfaces stay small, one to three methods. A large one marks a package boundary
  that has not been drawn yet.
- **Type assertions use the comma-ok form.** `v, ok := x.(T)`, never bare
  `v := x.(T)`. The bare form panics at runtime on the wrong dynamic type. A type
  switch is the multi-case spelling. The bare form is the escape hatch core.md
  means for Go. The checked forms are this language's `instanceof` and are the
  sanctioned move. `any` is not an escape hatch. It is the current spelling of
  `interface{}`, required only for a genuinely unconstrained type parameter, and
  the generics rules above govern it.

## Naming

- One receiver name per type, on every one of its methods (`staticcheck` ST1016).
  Length is the repo's call. Go's own norm is a one- or two-letter abbreviation;
  some codebases name the role in full. Match what the type's existing methods
  already use.
- Short names for short-lived variables: `o` for order, `err` for error, `ctx` for
  context. Descriptive names for longer scope: `userID`, `orderID`, `controller`.
- Interfaces are named as agent nouns or capabilities: `Repository`, `Service`,
  `Probe`, `Checker`, `Encrypter`, `Encoder`. One responsibility each:
  `OrderRepository`, never `OrderAndCustomerRepository`.
- Constructors follow `New<Type>`: `NewOrderService`, `NewController`.

## Imports

Run the project's formatter, `goimports`, usually through `golangci-lint fmt`. Do
not hand-arrange groups. `goimports` sorts within a group but never moves an import
between groups, so whatever grouping a file already has is the grouping it keeps.
Match the surrounding files. Only a configured tool (`goimports -local`, or `gci` in
`.golangci.yaml`) makes a project-wide order real. Absent that config, there is no
order to enforce.

## Arithmetic

- State rounding intent at integer division. Integer `/` truncates toward zero
  silently. Where rounding direction matters (pagination totals, capacity, chunk
  counts), use a named helper (`divCeil`) or the `(n + d - 1) / d` form beside the
  value it sizes. A bare `/` says truncation is what the result means.

## Modern Go

Write for the Go version in the project's go.mod. Apply each rule at or below
that version, and prefer these forms even when nearby code uses the older
pattern. Skip a rule only when it would not compile, would change behavior, or
clearly does not fit the code being edited. The list comes from
JetBrains' go-modern-guidelines repository, which gains rules as Go releases
land; refresh it from there.

Go 1.27:

- Generic methods instead of package-level generic helpers when the operation
  belongs to the type; keep package-level helpers for operations that belong to
  no single receiver type.
- `encoding/json/v2` for new JSON code; leave existing `encoding/json` code
  unchanged unless migration is explicitly requested.
- Set embedded struct fields directly with promoted field names in struct
  literals instead of constructing the embedded struct explicitly.
- `strings.CutLast` and `bytes.CutLast` instead of `LastIndex` plus manual
  slicing around the last separator.
- The standard library `uuid` package instead of third-party or custom UUID
  implementations.
- `URL.Clone` and `Values.Clone` from `net/url` instead of manual copying.

Go 1.26:

- `new(value)` for a pointer to a value instead of pointer-helper functions or a
  temporary variable used only for `&value`.
- `errors.AsType[T](err)` when checking whether an error matches a specific
  type.

Go 1.25:

- `wg.Go` when spawning goroutines tracked by a `sync.WaitGroup`.

Go 1.24:

- `t.Context()` when a test needs a context tied to the test lifetime.
- `omitzero` on JSON-tagged bool, numeric, struct, and time fields whose zero
  value should be omitted; `omitempty` stays for empty strings, slices, and
  maps.
- `b.Loop()` for the main loop in benchmark functions.
- `strings.SplitSeq`, `strings.FieldsSeq`, `bytes.SplitSeq`, or
  `bytes.FieldsSeq` when iterating over split results.

Go 1.23:

- `maps.Keys` or `maps.Values` directly as iterators instead of manually looping
  over a map.
- `slices.Collect` to build a slice from an iterator; `slices.Sorted` to collect
  and sort iterator values in one step.
- `time.Tick` where it fits; unreferenced tickers are garbage-collected without
  `Stop`.

Go 1.22:

- `for i := range n` when iterating from 0 to n-1.
- No redundant loop-variable copies before closures or taking addresses; each
  iteration has its own variables.
- `cmp.Or` to pick the first non-zero value from a fallback chain.
- `reflect.TypeFor[T]()` instead of `reflect.TypeOf((*T)(nil)).Elem()`.
- Method-aware `ServeMux` patterns and `r.PathValue` for path parameters.

Go 1.21:

- Built-in `min` and `max` instead of handwritten comparisons.
- `clear(m)` to delete all map entries; `clear(s)` to zero slice elements.
- `slices.Contains` instead of a manual search loop; `slices.Index` for the
  position, returning -1 when absent; `slices.IndexFunc` to find by predicate.
- `slices.Sort` for slices of ordered values; `slices.SortFunc` with
  `cmp.Compare` instead of `sort.Slice`; `slices.Max` and `slices.Min` instead
  of manual loops.
- `slices.Reverse` instead of a manual swap loop; `slices.Compact` to remove
  consecutive duplicates in place; `slices.Clip` to remove unused capacity;
  `slices.Clone` to copy a slice.
- `maps.Clone` instead of manual map iteration; `maps.Copy` to copy entries into
  another map; `maps.DeleteFunc` to delete entries matching a predicate.
- `sync.OnceFunc` instead of `sync.Once` plus a wrapper closure;
  `sync.OnceValue` to memoize a computed value.
- `context.AfterFunc` to run cleanup when a context is canceled; timeout and
  deadline contexts with causes when callers need the cancellation reason.

Go 1.20:

- `strings.CutPrefix` or `strings.CutSuffix` when you need both the trimmed
  result and whether it matched; `bytes.Clone` to copy a byte slice.
- `errors.Join` to combine multiple errors while preserving error matching.
- `context.WithCancelCause` and `context.Cause` when cancellation needs to carry
  an error cause.

Go 1.19:

- `fmt.Appendf` when appending formatted text to a byte slice without an
  intermediate `fmt.Sprintf` string.
- Typed atomics (`atomic.Bool`, `atomic.Int64`, `atomic.Pointer[T]`) instead of
  untyped atomic functions.

Go 1.18:

- `any` instead of `interface{}`.
- `strings.Cut` and `bytes.Cut` instead of `Index` plus manual slicing;
  `strings.Clone` to copy a string without retaining shared backing memory.

Go 1.8 and earlier:

- `time.Until(deadline)` instead of `deadline.Sub(time.Now())`;
  `time.Since(start)` instead of `time.Now().Sub(start)`.

## Testing

The testing skill governs test discipline. These are the Go spellings of its
rules, plus one Go-specific rule that lives only here.

- **The framework is a project fact, not a language default.** Take it from the
  project's AGENTS.md when it names one, otherwise from the test entry point in the
  same directory, otherwise from the nearest sibling suite in the repo, and write
  every new test in that framework. A directory whose `func TestX(t *testing.T)`
  calls `RunSpecs` is a Ginkgo suite, and a spec there belongs in the spec tree,
  where the suite's hooks and the Ginkgo reporter reach it. One entry point covers
  a whole directory: an internal `foo` and an external `foo_test` compile into one
  binary and share Ginkgo's global registry, so the single `RunSpecs` runs the
  specs of both. A directory with no `RunSpecs` and no project statement is a plain
  `testing` package. When the project statement and the directory disagree, the
  project's AGENTS.md wins and the directory is debt. Say which you followed.
- **One row, one named test** (the testing skill's parameterized rule). In a
  Ginkgo suite that is `DescribeTable` plus one `Entry` per row. In a plain
  `testing` package it is `t.Run`. Either way the row's name is the test's name,
  so the failure line identifies the input.
- **Fakes of owned ports are the default double**, hand-written to the testing
  skill's Fake contract, with the interface check as a compile-time assignment.
  `mock.go` from mockgen is permitted only under that skill's mock escape hatch.
