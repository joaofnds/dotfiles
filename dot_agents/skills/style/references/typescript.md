# House coding style: TypeScript

Language-specific rules for TypeScript projects, on top of core.md.

Contents: type safety; safe parsing at boundaries; entity construction;
framework-agnostic constructors and DI; testing; tooling.

## Type safety

- **Never `as any`, and never cast merely to silence the compiler.** Fix owned
  upstream types. A narrow assertion is acceptable only when runtime evidence
  already establishes the type or an external declaration is demonstrably
  incomplete. Keep it local and record the mismatch.
- **`z.infer` represents a Zod-parsed boundary shape, not domain behavior.** Use it
  after Zod validation or for behavior-free DTOs. Model domain concepts with
  classes, modules, or functions according to their state and invariants.
- **No clever type-level programming.** Avoid heavy conditional types, mapped types,
  and generic gymnastics. Write types a junior engineer can read at a glance. A
  type that needs a comment to explain what it is is too clever. Rewrite it
  simpler. The type system is a tool for correctness, not a puzzle.
- **Use sound narrowing for trusted typed values.** Discriminants, `typeof`,
  `Array.isArray`, `instanceof`, and sound type predicates are normal TypeScript.
  At an untrusted boundary, parse the complete shape with the project's schema
  validator instead of field-sniffing or chained assertions.
- **Runtime evidence must match the claim.** Schema parsing proves external shapes.
  Class identity proves constructed instances. Do not turn a partial check into a
  broad assertion.

## Safe parsing at boundaries

- Use the project's configured schema validator for environment configuration,
  incoming payloads, and external responses. Prefer Zod in projects that already
  use it.
- Use the configured validator's parsing API. In Zod projects, use
  `Schema.safeParse(body)` when the caller needs structured failure. Return or
  throw the boundary framework's validation or application error. Malformed
  transport input is not a domain outcome.
- Treat the edges of the application as strictly untrusted. Raw, unvalidated
  external data never crosses into the domain.
- **Parse, then construct when the value has domain identity or behavior.** The flow
  is `unknown -> schema parse -> DomainClass`. Behavior-free configuration and DTOs
  may remain parsed typed values.
- **Extract a mapper when translation is non-trivial or reused.** Keep small one-off
  conversions local and pure. Static factories are acceptable when construction
  belongs naturally to the type and does not couple it to an external schema.

## Entity construction

- **Explicit construction over merging.** Entities map properties explicitly, never
  through bulk merges like `Object.assign()`. This keeps unexpected payload
  parameters and DB properties out of the entity.
- **Props-object constructor is the canonical shape.** Entities take a single
  `props: { ... }` object and assign each field explicitly:
  `constructor(props: { id: string; name: string }) { this.id = props.id;
  this.name = props.name; }`. No positional arguments, no builders, no
  `Object.assign(this, props)`. The repetition shows exactly what crosses the
  boundary, and that is why it stays.
- **`readonly` by default.** All properties on entities, value objects, and DTOs are
  `readonly` unless there is a documented reason to be mutable. Use `readonly T[]`
  or `ReadonlyArray<T>` for collection properties, so the array itself cannot be
  mutated either.
- **Mutation by replacement, never in place.** Entities expose no setters and no
  methods that mutate in place. A state transition is a named behavior method
  returning a new instance: `order.cancel(): Order`, never
  `order.status = 'cancelled'`, and never the service assembling the new props
  itself. The repository takes the returned instance and writes it. The entity is
  an immutable snapshot of state at one point in time. Immutability changes the
  return type, not who owns the transition; behavior still lives with data, per
  core.md. Value objects are always fully immutable, no exceptions.
- Lightweight ORM decorators (`@Entity`, `@Property`) are acceptable when they
  introduce no heavy coupling.

## Framework-agnostic constructors and DI

- Do not tie class constructors to the DI framework. Instead of injecting
  `ConfigService` into a config class, which forces mocking the service in tests,
  write the constructor to accept pure dependencies: parsed primitives or specific
  interfaces.
- Use `static fromConfigService(configService: ConfigService)` or module
  `useFactory` declarations to adapt the framework's DI into the clean constructor.
- **A port's DI token is the adapter class the module wires; the declared type is
  the port.** Write
  `@Inject(MongoUserRepository) private readonly users: UserRepository`. The
  concrete class supplies the runtime token, the interface supplies the
  compile-time contract, and the consumer names the implementation it wants.
  **Never introduce a standalone token constant.** No
  `export const USERS = Symbol("Users")`, no string token, no
  abstract-class-as-token, and no `{ provide: TOKEN, useClass: Adapter }` in the
  module. A token constant is a third name for a thing that already has two, and it
  hides the wiring. With a token, the module says which adapter satisfies the port,
  so reading the consumer no longer tells you what runs. Swapping the adapter is a
  one-line edit at the `@Inject` site and the module. That is the trade this rule
  accepts, in exchange for one form per constructor instead of two.
- **Decorator metadata is not a dependency.** `@Inject(Adapter)` hands the container
  a lookup key. It is not a construction, a call, or a declared type. The consumer
  touches no member of the adapter, so the coupling is to the adapter's identity,
  not its API. Nothing the compiler checks points at the concretion, and the
  interface stays the only contract. The load-time module edge is real and
  accounted for below. Requiring the concrete implementation is the other thing:
  `private readonly x: OrganizationKindsRepository` types the field to the adapter
  and lets the consumer reach past the port. That is the violation. Forbid it, and
  do not raise `@Inject(Adapter)` as an architecture or dependency-direction
  finding.
- Besides the second edit site, the rule costs one module-graph edge. The consumer
  requires the adapter's module at load time, so a cycle between two features
  becomes possible where a token constant in a third file would have broken it.
  Make the cycle survivable with `forwardRef`, at the `@Inject` site, and in both
  modules' imports when the cycle is module-level. Never with a new token constant.
- Verification note: with tsc 6.0.3 emit, `design:paramtypes` is `Object` at
  `@Inject` positions, which is why an interface-typed parameter needs a token at
  all. A clean review run is not evidence this rule is unneeded. Re-check on a
  TypeScript major or on a move to standard decorators, which emit no such
  metadata.

## Testing

- **Native tooling.** When choosing, prefer native modules like `node:test` and
  `node:assert/strict` over a heavy runner. This is the default for a new suite,
  not a mandate to fight an existing one. Where no repo AGENTS.md names a runner,
  the runner the suite already uses wins for new tests in it. A second runner
  alongside the first is worse than either choice. Jest or Japa when the project
  mandates them.
- **No spy or mock frameworks for domain logic dependencies.** Never `jest.fn()`
  or `vi.fn()` there; they are the testing skill's banned framework mocks. Author
  an explicit Fake to its contract instead, such as a `FakeHTTPService` that
  records the requests it received and pops predefined responses, reset in
  lifecycle hooks, one-test state local.

## Tooling

- Lint and format with the project's configured tools. Always run them after
  changes.
