# Coding Style & Architecture Manifesto

Cross-language coding style. Language-specific preferences live in `coding_style_typescript.md` / `coding_style_go.md`. Testing rules live in `testing/00-index.md`. When a principle's background matters, query the wiki — see `using_the_wiki.md`.

Apply these patterns in proportion to demonstrated domain and integration complexity.
Preserve established project structure, dependencies, and idioms unless they conflict
with an explicit house rule below or the task changes them. Do not introduce classes,
ports, mappers, DI, or messaging solely to satisfy this document.

## 1. Core Philosophy & Mindset

- **Simplicity, by Beck's four criteria.** Passes the tests, reveals intent, no duplication, fewest elements — *in that order*. Minimality is the **fourth** criterion, not the first; a system that is minimal but unreadable is not simple. *(See: beck-s-four-rules-of-simple-design, simplicity-vs-ease, incremental-design)*
- **Boring control flow.** Plain `if`/`else`, loops, early returns over clever expression-level tricks. If a piece of code needs a comment to explain *what* it is, it's too clever — rewrite it simpler.
- **Comments default to zero.** The test is *not* "is this a *why* or a *what*" — a *why* comment is usually still noise. The test is: **will this code be misread or silently broken without it?** Before writing any `//`, exhaust three moves: (1) a clearer name, (2) a smaller/extracted function, (3) move the rationale to the design record (README / ADR / PRD). A comment survives only when all three fail *and* the code reads as removable-but-isn't — then it states the consequence of removal, nothing else. When unsure, omit; assume the reader wants no comment. *(See: code-comments)*
- **Move understanding from your head into the code.** Renaming and extracting are how the persistence happens — your head is volatile storage. *(See: refactoring-fowler-2018)*
- **Never the `Impl` suffix.** `FooImpl` is forbidden — a non-name that says nothing. Name a class for what it *is*: the technology, strategy, or source (`SlackNotifier`, `OtelProbe`, `PostgresUserRepository`). If the only thing distinguishing the class from its interface is "the implementation," you haven't yet understood what makes it distinct.
- **Surgical execution.** Only touch what is directly relevant to the user's intent. Do not "fix" adjacent code, refactor for aesthetic reasons, or leave dead imports behind from your changes.
- **Goal-driven TDD.** Tests are written *before* the implementation. Red → simplest green → refactor. Beck's three green-step tactics: **fake it** (return a literal, let the next test force generalization), **triangulate** (a second test forces the abstraction), **obvious implementation** (just write it when the answer is clear) — picked by confidence. *(See: canon-tdd, growing-object-oriented-software-guided-by-tests, test-driven-development)*
- **Leverage the type system.** Use it to its fullest. Avoid escape hatches that bypass compile-time checks (`any`, unchecked conversions, raw `interface{}`). Don't sniff fields on opaque values to guess the type — that is a runtime cast in disguise. Use real classes with `instanceof` (or the language's equivalent), or parse with a schema validator at the boundary. If the compiler is unhappy, the upstream type is wrong — fix it there.
- **Don't defend against your own code.** When you control both the producer and the consumer of a contract, enforce it at the type/schema level — don't add fallback branches that "handle the case where X is missing" when *you* decide whether X is provided. Iterative design leaves these branches behind ("schema is optional for now"); they become the silent path where bugs hide as the code evolves around them. Make the contract mandatory and delete the fallback.

## 2. Architectural Principles & Layering

For applications with meaningful domain or integration complexity, use **Domain-Driven
Design** and **Hexagonal Architecture** to keep boundaries explicit and dependencies
pointing inward: domain depends on nothing; use cases depend on domain; adapters depend
on use cases. Simpler programs may use simpler structures when contracts and testability
remain clear. *(See: hexagonal-architecture, clean-architecture, layered-architecture-ddd, domain-driven-design)*

### a. Domain Models / Entities

- **Pure structural types** encapsulating business logic and core data. Standard attributes + behavior. No raw database schemas, framework specifics, or wire formats leak in. Lightweight framework annotations are acceptable if they don't introduce heavy coupling. *(See: entity-ddd, domain-model)*
- **Behavior lives with data.** An entity that holds attributes but no behavior is the **anemic domain model** — getters and setters with the real logic in services. Per-aggregate behavior belongs on the aggregate; the repository persists, the service orchestrates. *(See: anemic-domain-model)*
- **Explicit construction.** Entities map properties explicitly — never bulk merges or reflection-based assignment. Prevents unexpected payload parameters or persistence-layer fields from leaking into the domain.
- **Construction from canonical props only.** An entity's constructor takes the canonical domain shape — never a DB row, HTTP body, or wire payload directly. Each source translates into canonical properties at its boundary. Extract a source-specific mapper only under §d's criteria. (Active Record's failure mode is precisely this coupling collapse — refactoring either the object or the schema means the other has to follow.) *(See: active-record, anemic-domain-model)*

### b. Application / Business Logic (Services / Use Cases)

- **Orchestrators of business rules.** Consume parsed and validated inputs (see §c "Safe Parsing at Boundaries"), execute the core logic, delegate I/O or side-effects to abstracted dependencies (Repositories, External API clients). The Application layer coordinates; it does *not* contain domain logic. *(See: application-services, domain-layer)*

### c. Infrastructure & Adapters (Repositories / External APIs)

- **Framework-agnostic constructors.** Don't tie constructors to the DI framework. Constructors accept pure dependencies (parsed primitives or specific interfaces). Use factory methods or DI module declarations to adapt the framework's container into the clean constructor. You should be able to construct objects in tests without the full DI container. *(See: dependency-inversion-principle)*
- **Defensive networking.** Bound external calls with deadlines or cancellation. Translate native failures into stable application or port errors; use domain errors only for domain outcomes. *(See: release-it-nygard-2018)*
- **Safe parsing at boundaries.** Treat the edges as strictly untrusted. Use schema validation for environment configuration, incoming request payloads, and outgoing external responses. Never let raw, unvalidated external data cross into the domain. *(See: clean-boundaries)*

### d. Data Transformation (Mappers / DTOs)

- **Stateless, non-mutating translators between boundaries.** Same inputs yield same outputs; input objects are never modified in place.
- **Anti-Corruption Layer at integration boundaries.** Don't let external models contaminate yours. Extract a mapper when translation is non-trivial, reused, independently tested, or protects the domain from an external model; a small local pure conversion is fine otherwise. *(See: anti-corruption-layer, data-object-anti-symmetry)*

### e. Error Translation at Boundaries

- **A thin translation layer between infrastructure and application errors.** Repositories and adapters translate ORM, HTTP, and driver failures into stable port errors. Business logic never handles infrastructure-specific types directly. Domain errors remain reserved for domain outcomes. *(See: clean-boundaries)*

## 3. Code Construction & Decoupling Patterns

- **Tell, Don't Ask.** Tell objects what you want done in terms of the *role* the neighbor plays; don't ask for their internals and decide for them. The corollary to the Law of Demeter and the antidote to feature envy. *(See: coupling, growing-object-oriented-software-guided-by-tests)*
- **Event-driven integration across domains when the requirement calls for it.** Use events or messaging for asynchronous delivery, independent ownership, or decoupled evolution. Prefer direct orchestration when immediate consistency and one owner make it simpler. *(See: event-sourcing, responsibility-layers)*
- **Control non-deterministic side effects.** Pass clocks, network clients, and random or
  ID generators explicitly when tests, lifecycle, or replacement require control.
  Production wiring uses the real collaborator; tests use a deterministic Fake.
- **Probe / instrumentation pattern when needed.** Introduce a `Probe` port only when
  business-level observability must remain independent of an adapter. Keep generic
  infrastructure telemetry at the adapter boundary.
- **Put domain behavior with the model it governs.** Use a class, value object, module, or pure function according to the language and required state; avoid service objects that manipulate anemic records. *(See: anemic-domain-model)*
- **Generic utilities carve-out.** Truly generic utilities (`clamp`, `slugify`, pure math) may be shared. Domain-specific computations stay with their domain even when implemented as pure functions.
- **Inject side-effecting or replaceable dependencies.** Constructor injection exposes I/O and runtime collaborators. Pure stateless helpers may be called directly; wrapping them adds a seam without adding control. *(See: dependency-inversion-principle)*
- **YAGNI and orthogonality.** Design for the current need, not the hypothetical future. Speculative generality is a code smell. Treat scattered edits for one logical change as a coupling signal, not an automatic defect. *(See: separation-of-concerns)*

## 4. Testing

Testing rules live in `testing/00-index.md`. Read it for any task that touches tests — it gates routing into `01-architecture-and-harness.md`, `02-mocking-roles.md`, and `03-test-aesthetics.md`, and holds the pre-commit checklist.

One reminder relevant outside test files: treat any auto-generated files (Swagger clients, DB schema types, GraphQL codegen, mock files) as strictly read-only. Never modify them manually — re-run the generator.
