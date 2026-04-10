# TypeScript Coding Style

Language-specific preferences for TypeScript projects. Read the generic `coding_style.md` first for universal principles.

## 1. Type Safety
- **Never use `as any` or `as unknown`**. Strong typing must be enforced end-to-end. Avoid type casting merely to bypass the TypeScript compiler. Take the time to write actual, correct type definitions.
- **Derive types from schemas**: Use `z.infer<typeof Schema>` to derive compile-time TypeScript types directly from validation schemas, guaranteeing exact parity between runtime and compile-time forms. Never cast external unknowns with `as MyType`.

## 2. Safe Parsing at Boundaries (Zod)
- Rely heavily on **Zod** to define strict schemas for configuring environments, validating incoming HTTP request bodies, and parsing outgoing external fetch responses.
- Use `Schema.safeParse(body)` to validate payloads at runtime. If unsuccessful, throw a deliberate, controlled domain exception (e.g., `PatreonBodyValidationError`).
- Treat the edges of the application as strictly untrusted. Never let raw, unvalidated external data cross into the domain.

## 3. Entity Construction
- **Explicit Construction over Merging**: Entities must explicitly map properties rather than using bulk merges like `Object.assign()`. This prevents unexpected payload parameters or DB properties from leaking into the Entity prototype.
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
