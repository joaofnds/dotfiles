# Coding Style & Architecture Manifesto

Cross-language coding style. Language-specific preferences live in `coding_style_typescript.md` / `coding_style_go.md`. Testing rules live in `testing/00-index.md`. When a principle's background matters, query the wiki — see `using_the_wiki.md`.

## 1. Core Philosophy & Mindset

- **Simplicity, by Beck's four criteria.** Passes the tests, reveals intent, no duplication, fewest elements — *in that order*. Minimality is the **fourth** criterion, not the first; a system that is minimal but unreadable is not simple. *(See: beck-s-four-rules-of-simple-design, simplicity-vs-ease, incremental-design)*
- **Boring control flow.** Plain `if`/`else`, loops, early returns over clever expression-level tricks. If a piece of code needs a comment to explain *what* it is, it's too clever — rewrite it simpler.
- **Comments default to zero.** The test is *not* "is this a *why* or a *what*" — a *why* comment is usually still noise. The test is: **will this code be misread or silently broken without it?** Before writing any `//`, exhaust three moves: (1) a clearer name, (2) a smaller/extracted function, (3) move the rationale to the design doc (README / CLAUDE.md / PRD). A comment survives only when all three fail *and* the code reads as removable-but-isn't — then it states the consequence of removal, nothing else. When unsure, omit; assume the reader wants no comment. *(See: code-comments)*
- **Move understanding from your head into the code.** Renaming and extracting are how the persistence happens — your head is volatile storage. *(See: refactoring-fowler-2018)*
- **Surgical execution.** Only touch what is directly relevant to the user's intent. Do not "fix" adjacent code, refactor for aesthetic reasons, or leave dead imports behind from your changes.
- **Goal-driven TDD.** Tests are written *before* the implementation. Red → simplest green → refactor. Beck's three green-step tactics: **fake it** (return a literal, let the next test force generalization), **triangulate** (a second test forces the abstraction), **obvious implementation** (just write it when the answer is clear) — picked by confidence. *(See: canon-tdd, growing-object-oriented-software-guided-by-tests, test-driven-development)*
- **Leverage the type system.** Use it to its fullest. Avoid escape hatches that bypass compile-time checks (`any`, unchecked conversions, raw `interface{}`). Don't sniff fields on opaque values to guess the type — that is a runtime cast in disguise. Use real classes with `instanceof` (or the language's equivalent), or parse with a schema validator at the boundary. If the compiler is unhappy, the upstream type is wrong — fix it there.
- **Don't defend against your own code.** When you control both the producer and the consumer of a contract, enforce it at the type/schema level — don't add fallback branches that "handle the case where X is missing" when *you* decide whether X is provided. Iterative design leaves these branches behind ("schema is optional for now"); they become the silent path where bugs hide as the code evolves around them. Make the contract mandatory and delete the fallback.

## 2. Architectural Principles & Layering

Strictly decoupled layers following **Domain-Driven Design** and **Hexagonal Architecture** (Ports & Adapters / Clean Architecture). Same pattern under three names; the modern descendant adds an explicit Dependency Rule: **dependencies point inward** — domain depends on nothing; use cases depend on domain; adapters depend on use cases. *(See: hexagonal-architecture, clean-architecture, layered-architecture-ddd, domain-driven-design)*

### a. Domain Models / Entities

- **Pure structural types** encapsulating business logic and core data. Standard attributes + behavior. No raw database schemas, framework specifics, or wire formats leak in. Lightweight framework annotations are acceptable if they don't introduce heavy coupling. *(See: entity-ddd, domain-model)*
- **Behavior lives with data.** An entity that holds attributes but no behavior is the **anemic domain model** — getters and setters with the real logic in services. Per-aggregate behavior belongs on the aggregate; the repository persists, the service orchestrates. *(See: anemic-domain-model)*
- **Explicit construction.** Entities map properties explicitly — never bulk merges or reflection-based assignment. Prevents unexpected payload parameters or persistence-layer fields from leaking into the domain.
- **Construction from canonical props only.** An entity's constructor takes the canonical domain shape — never a DB row, HTTP body, or wire payload directly. Translation lives in mappers (§d). When a single entity has multiple sources (DB + HTTP + webhook), each source gets its own mapper, all funneling into the one canonical constructor. (Active Record's failure mode is precisely this coupling collapse — refactoring either the object or the schema means the other has to follow.) *(See: active-record, anemic-domain-model)*

### b. Application / Business Logic (Services / Use Cases)

- **Orchestrators of business rules.** Consume parsed and validated inputs (see §c "Safe Parsing at Boundaries"), execute the core logic, delegate I/O or side-effects to abstracted dependencies (Repositories, External API clients). The Application layer coordinates; it does *not* contain domain logic. *(See: application-services, domain-layer)*

### c. Infrastructure & Adapters (Repositories / External APIs)

- **Framework-agnostic constructors.** Don't tie constructors to the DI framework. Constructors accept pure dependencies (parsed primitives or specific interfaces). Use factory methods or DI module declarations to adapt the framework's container into the clean constructor. You should be able to construct objects in tests without the full DI container. *(See: dependency-inversion-principle)*
- **Defensive networking.** Every integration point will eventually fail. Timeouts on every external call (no timeout = infinite timeout). Catch native exceptions and map them to domain-specific errors (e.g., `ErrTimeout`, `ErrNotFound`). *(See: release-it-nygard-2018)*
- **Safe parsing at boundaries.** Treat the edges as strictly untrusted. Use schema validation for environment configuration, incoming request payloads, and outgoing external responses. Never let raw, unvalidated external data cross into the domain. *(See: clean-boundaries)*

### d. Data Transformation (Mappers / DTOs)

- **Stateless, non-mutating translators between boundaries.** Same inputs yield same outputs; input objects are never modified in place. "Pure" in the functional sense, but housed in a class to keep dependency wiring and domain semantics consistent.
- **Anti-Corruption Layer at integration boundaries.** Don't let external models contaminate yours. Repository / API responses go through explicit mapper classes — never inline at call sites, never on entities, never in services. *(See: anti-corruption-layer, data-object-anti-symmetry)*

### e. Error Translation at Boundaries

- **A thin translation layer between infrastructure and domain errors.** Repositories and adapters catch infrastructure-specific errors (ORM errors, HTTP status codes, driver errors) and translate them into domain error types. Business logic never handles infrastructure error types directly. *(See: clean-boundaries)*

## 3. Code Construction & Decoupling Patterns

- **Tell, Don't Ask.** Tell objects what you want done in terms of the *role* the neighbor plays; don't ask for their internals and decide for them. The corollary to the Law of Demeter and the antidote to feature envy. *(See: coupling, growing-object-oriented-software-guided-by-tests)*
- **Event-driven integration across domains.** If a service action causes side effects across disparate domains, use event emitters or message passing — don't hard-couple cross-domain imports. The domain emits a state change; background listeners perform the downstream reaction. *(See: event-sourcing, responsibility-layers)*
- **No globals for side-effects.** Calling time/date functions, HTTP clients, or random generators directly couples code to uncontrollable, non-deterministic system state.
  - Define explicit interfaces for side-effects (`Clock`, `HTTPClient`, `IDGenerator`).
  - Inject the interface; production wiring uses the real implementation.
  - Provide a stateful Fake for tests (e.g., `FakeClock` with a frozen timestamp).
- **Probe / instrumentation pattern.** Define an observability interface (`Probe`) in the domain that declares business-relevant events (`HabitCreated()`, `TokenDecryptFailed()`). Implement with real metrics/logging in production, no-op in tests. Keeps observability decoupled from business logic.
- **Domain logic in classes, not loose functions.** Domain computations are methods on domain classes, not standalone exported functions. A class signals intent, groups related behavior, and keeps the design honest under hexagonal layering. *(See: anemic-domain-model)*
- **Generic utilities carve-out.** Truly generic utilities (`clamp`, `slugify`, pure math) may be loose functions. Test: would a second unrelated domain want to import this? If not, it's domain logic — promote it to a class.
- **Inject dependencies, don't instantiate inline.** Constructor injection over `new X()` inside a class. Inline instantiation hides dependencies, couples to concrete implementations, and makes testing harder. Even stateless collaborators get injected — the cost is trivial and the design stays honest. *(See: dependency-inversion-principle)*
- **YAGNI and orthogonality.** Design for the current need, not the hypothetical future. Speculative generality is a code smell. Count the files touched per logical change — that's the measurable definition of good modularity. *(See: separation-of-concerns)*

## 4. Testing

Testing rules live in `testing/00-index.md`. Read it for any task that touches tests — it gates routing into `01-architecture-and-harness.md`, `02-mocking-roles.md`, and `03-test-aesthetics.md`, and holds the pre-commit checklist.

One reminder relevant outside test files: treat any auto-generated files (Swagger clients, DB schema types, GraphQL codegen, mock files) as strictly read-only. Never modify them manually — re-run the generator.
