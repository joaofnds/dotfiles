# TypeScript Coding Style

Language-specific preferences for TypeScript projects. Read the generic `coding-style.md` first for universal principles.

## 1. Type Safety
- **Never use `as any`, and never cast merely to silence the compiler.** Fix owned upstream types. A narrow assertion is acceptable only when runtime evidence already establishes the type or an external declaration is demonstrably incomplete; keep it local and record the mismatch.
- **`z.infer` represents a Zod-parsed boundary shape, not domain behavior.** Use it after Zod validation or for behavior-free DTOs. Model domain concepts with classes, modules, or functions according to their state and invariants.
- **No clever type-level programming**: Avoid heavy conditional types, mapped types, or generic gymnastics. Write types a junior engineer can read at a glance. If a type needs a comment to explain *what* it is, it's too clever: rewrite it simpler. The type system is a tool for correctness, not a puzzle.
- **Use sound narrowing for trusted typed values.** Discriminants, `typeof`, `Array.isArray`, `instanceof`, and sound type predicates are normal TypeScript. At an untrusted boundary, parse the complete shape with the project's schema validator instead of field-sniffing or chained assertions.
- **Runtime evidence must match the claim.** Schema parsing proves external shapes; class identity proves constructed instances. Do not turn a partial check into a broad assertion.

## 2. Safe Parsing at Boundaries (Zod)
- Use the project's configured schema validator for environment configuration, incoming payloads, and external responses. Prefer **Zod** in projects that already use it.
- Use the configured validator's parsing API. In Zod projects, use `Schema.safeParse(body)` when the caller needs structured failure. Return or throw the boundary framework's validation or application error; malformed transport input is not a domain outcome.
- Treat the edges of the application as strictly untrusted. Never let raw, unvalidated external data cross into the domain.
- **Parse, then construct when the value has domain identity or behavior.** The flow is `unknown -> schema parse -> DomainClass`. Behavior-free configuration and DTOs may remain parsed typed values.
- **Extract a mapper when translation is non-trivial or reused.** Keep small one-off conversions local and pure. Static factories are acceptable when construction belongs naturally to the type and does not couple it to an external schema.

## 3. Entity Construction
- **Explicit Construction over Merging**: Entities must explicitly map properties rather than using bulk merges like `Object.assign()`. This prevents unexpected payload parameters or DB properties from leaking into the Entity prototype.
- **Props-object constructor is the canonical shape**: Entities take a single `props: { ... }` object and assign each field explicitly: `constructor(props: { id: string; name: string; ... }) { this.id = props.id; this.name = props.name; ... }`. No positional arguments, no builders, no `Object.assign(this, props)`. The repetition is the point: it's how you see exactly what crosses the boundary.
- **`readonly` by default**: All properties on entities, value objects, and DTOs are `readonly` unless there is a documented reason to be mutable. Use `readonly T[]` (or `ReadonlyArray<T>`) for collection properties so the array itself can't be mutated either, not just the reference.
- **Mutation by replacement, not in-place**: Entities don't expose setters or methods that mutate in place. A state transition is a **named behavior method returning a new instance**: `order.cancel(): Order`, not `order.status = 'cancelled'` and not the service assembling the new props itself. The repository takes the returned instance and writes it. The entity is an immutable snapshot of state at one point in time; immutability changes the return type, not who owns the transition (`coding-style.md` §2a: behavior lives with data). Value objects are always fully immutable, no exceptions.
- Lightweight ORM decorators (`@Entity`, `@Property`) are acceptable if they don't introduce heavy coupling.

## 4. Framework-Agnostic Constructors
- Do not tie class constructors directly to the DI framework. Instead of injecting `ConfigService` into a config class (which forces you to mock the service in tests), write the constructor to accept pure dependencies (like parsed primitives or specific interfaces).
- Use `static fromConfigService(configService: ConfigService)` or module `useFactory` declarations to adapt the framework's DI into the clean constructor.
- **A port's DI token is the adapter class the module wires; the declared type is the port.** Write
  `@Inject(MongoUserRepository) private readonly users: UserRepository`: the concrete class supplies the
  runtime token, the interface supplies the compile-time contract, and the consumer names the
  implementation it wants. **Never introduce a standalone token constant**: no
  `export const USERS = Symbol("Users")`, no string token, no abstract-class-as-token, and no
  `{ provide: TOKEN, useClass: Adapter }` in the module. A token constant is a third name for a thing
  that already has two, and it hides the wiring: the module says which adapter satisfies the port, so
  reading the consumer no longer tells you what runs. Swapping the adapter is a one-line edit at the
  `@Inject` site and the module; that is the trade this rule accepts, in exchange for one form per
  constructor instead of two.
  **Decorator metadata is not a dependency.** `@Inject(Adapter)` hands the container a lookup key:
  not a construction, a call, or a declared type. The consumer touches no member of the adapter, so
  the coupling is to the adapter's *identity*, not its API: nothing the compiler checks points at the
  concretion, and the interface stays the only contract. The load-time module edge is real and
  accounted for below. Requiring the concrete implementation is the *other* thing:
  `private readonly x: OrganizationKindsRepository` types the field to the adapter and lets the
  consumer reach past the port. That is the violation; forbid it, and do not raise `@Inject(Adapter)`
  as an architecture or dependency-direction finding.
  Besides that second edit site, the rule costs one module-graph edge: the consumer `require`s the
  adapter's module at load time, so a cycle between two features becomes possible where a token
  constant in a third file would have broken it. Make the cycle survivable with `forwardRef`: at the
  `@Inject` site, and in both modules' `imports` when the cycle is module-level; both forms are already
  in use here. Never with a new token constant.
  (Verified against `tsc` 6.0.3 emit: `design:paramtypes` is `Object` at `@Inject`
  positions, which is why an interface-typed parameter needs a token at all. A clean
  panel run is not evidence this rule is unneeded. Re-check on a TypeScript major or a
  move to standard decorators, which emit no such metadata.)

## 5. Testing
- **Native Tooling**: When choosing, prefer native modules like `node:test` and `node:assert/strict` over a heavy runner. This is the default for a new suite, not a mandate to fight an existing one: where no repo `AGENTS.md` names a runner, the runner the suite already uses wins for new tests in it. A second runner alongside the first is worse than either choice. Jest or Japa when the project mandates them.
- **No spy/mock frameworks**: Strictly avoid `jest.fn()` or `vi.fn()` for domain logic dependencies. Author explicit, custom Fake implementations instead (e.g., a `FakeHTTPService` that captures an array of requests and pops predefined responses).
- Reset shared Fakes in lifecycle hooks; keep one-test state local.

## 6. Tooling
- **Linting & Formatting**: Use `biome check --write` or the project's configured tool. Always run it after changes.
