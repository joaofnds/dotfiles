# TypeScript Coding Style

Language-specific preferences for TypeScript projects. Read the generic `coding_style.md` first for universal principles.

## 1. Type Safety
- **Never use `as any` or `as unknown`**. Strong typing must be enforced end-to-end. Avoid type casting merely to bypass the TypeScript compiler. Take the time to write actual, correct type definitions. If TypeScript is complaining, it's telling you the upstream type is wrong — fix the upstream, never silence the compiler with a cast.
- **`z.infer` is for the intermediate parsed shape, not the domain**: Use `z.infer<typeof Schema>` for the value right after Zod validates it, or for pure DTOs that carry no behavior. Domain entities and value objects must be real classes constructed from the parsed data — never `z.infer` types masquerading as domain objects. Parity between runtime and compile-time is why we use Zod; domain modeling is why we still reach for classes on top of it.
- **No clever type-level programming**: Avoid heavy conditional types, mapped types, or generic gymnastics. Write types a junior engineer can read at a glance. If a type needs a comment to explain *what* it is, it's too clever — rewrite it simpler. The type system is a tool for correctness, not a puzzle.
- **No structural type detection at runtime**: Never write `'foo' in v && Array.isArray((v as any).foo)`-style checks to guess what shape an `unknown`/`object` value has. That is the same anti-pattern as `as any` dressed as caution: untyped, brittle, invisible to the compiler, and a defensive guard against your own code. If TypeScript hands you `unknown`, either parse it with Zod at the boundary or fix the upstream producer to return a real class instance and check with `instanceof`. Real `instanceof` checks on real classes are fine — sniffing fields on plain objects is not.
- **Either fully parse with Zod, or don't cast at all**: There is no middle ground. A `z.parse` (or `safeParse`) gives you a runtime guarantee that propagates into the type system. A cast gives you nothing in production. If you reach for a cast to "make TypeScript happy," stop and add the parse instead. The two acceptable boundary patterns are: (a) trust a real `instanceof` on a class you constructed, or (b) Zod-parse data crossing a boundary. Anything else means you don't actually know the type at runtime.

## 2. Safe Parsing at Boundaries (Zod)
- Rely heavily on **Zod** to define strict schemas for configuring environments, validating incoming HTTP request bodies, and parsing outgoing external fetch responses.
- Use `Schema.safeParse(body)` to validate payloads at runtime. If unsuccessful, throw a deliberate, controlled domain exception (e.g., `PatreonBodyValidationError`).
- Treat the edges of the application as strictly untrusted. Never let raw, unvalidated external data cross into the domain.
- **Parse, then construct a domain class**. The flow is always: `unknown → Zod parse → new DomainClass(parsed)`. Parsed data never reaches the domain layer as a bare object or a `z.infer` type. Zod solves the "this value has no type" problem; constructing a class solves the "this value has no identity or behavior" problem. Both are necessary.
- **Mapper class is the default pattern** for unknown-to-domain translation. A dedicated class takes raw input, parses it via Zod internally, and returns a constructed entity, value object, or DTO. Mappers are where boundary translation lives — not scattered across controllers, repositories, or constructors.
- **Static factory methods (`static parse(input: unknown)`) are an escape hatch**, not a first choice. Use them only when a mapper class isn't reachable — for example, config that loads *before* the DI container exists and therefore can't depend on a DI-registered mapper. In normal application code, prefer a mapper.

## 3. Entity Construction
- **Explicit Construction over Merging**: Entities must explicitly map properties rather than using bulk merges like `Object.assign()`. This prevents unexpected payload parameters or DB properties from leaking into the Entity prototype.
- **Props-object constructor is the canonical shape**: Entities take a single `props: { ... }` object and assign each field explicitly: `constructor(props: { id: string; name: string; ... }) { this.id = props.id; this.name = props.name; ... }`. No positional arguments, no builders, no `Object.assign(this, props)`. The repetition is the point — it's how you see exactly what crosses the boundary.
- **`readonly` by default**: All properties on entities, value objects, and DTOs are `readonly` unless there is a documented reason to be mutable. Use `readonly T[]` (or `ReadonlyArray<T>`) for collection properties so the array itself can't be mutated either, not just the reference.
- **Mutation by replacement, not in-place**: Entities don't expose setters or mutating methods. To "change" an entity, construct a new instance with the updated props — typically the repository takes the new instance and writes it. The entity is an immutable snapshot of state at one point in time. Value objects are always fully immutable, no exceptions.
- Lightweight ORM decorators (`@Entity`, `@Property`) are acceptable if they don't introduce heavy coupling.

## 4. Framework-Agnostic Constructors
- Do not tie class constructors directly to the DI framework. Instead of injecting `ConfigService` into a config class (which forces you to mock the service in tests), write the constructor to accept pure dependencies (like parsed primitives or specific interfaces).
- Use `static fromConfigService(configService: ConfigService)` or module `useFactory` declarations to adapt the framework's DI into the clean constructor.
- This ensures you can simply do `new MyService({...})` in unit tests cleanly.

## 5. Testing
- **Native Tooling**: Prefer native modules like `node:test` and `node:assert/strict` unless the project specifically mandates a heavy runner like Jest or Japa.
- **No spy/mock frameworks**: Strictly avoid `jest.fn()` or `vi.fn()` for domain logic dependencies. Author explicit, custom Fake implementations instead (e.g., a `FakeHTTPService` that captures an array of requests and pops predefined responses).
- Structure tests with strict `setup` and `teardown` lifecycles (e.g., `beforeEach` block to reset Fake states manually).

## 6. Tooling
- **Linting & Formatting**: Use `biome check --write` or the project's configured tool. Always run it after changes.
