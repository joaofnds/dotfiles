# Coding Style & Architecture Manifesto

This document synthesizes coding style, preferences, abstractions, and philosophy that apply across any programming language. Language-specific preferences live in separate documents (see `coding_style_typescript.md`, `coding_style_go.md`).

## 1. Core Philosophy & Mindset
- **Simplicity First**: Write the minimum amount of code to solve the problem. Avoid "forward-thinking" configuration or complex abstractions for one-off use cases. If you write 200 lines and it could be 50, rewrite it.
- **Surgical Execution**: Only touch what is directly relevant to the user's intent. Do not randomly "fix" adjacent code, refactor things purely for aesthetic reasons, or leave abandoned imports/dead code behind if your changes made them dead.
- **Goal-Driven TDD**: Test-driven development is non-negotiable. Behavior is always defined by tests *before* writing the implementation logic. Transform tasks into verifiable goals (e.g., write failing test -> make it pass).
- **Leverage the Type System**: Use the language's type system to its fullest. Avoid escape hatches that bypass compile-time checks (e.g., type casts to `any`, unchecked conversions, raw `interface{}`/`Object`). Take the time to write actual, correct type definitions.

## 2. Architectural Principles & Layering
Regardless of the framework or language, prefer strictly decoupled layers following **Domain-Driven Design** and **Hexagonal Architecture** (Ports & Adapters / Clean Architecture). Do not merge concerns across these boundaries:

### a. Domain Models / Entities
- **What they are**: Pure structural types encapsulating business logic or core data models.
- **Rules**: They should hold standard attributes and mapping logic. Avoid leaking infrastructure concerns (raw database schemas, framework specifics) into the domain. Lightweight framework annotations are acceptable if they don't introduce heavy coupling.
- **Explicit Construction**: Entities must explicitly map properties rather than using bulk merges or reflection-based assignment. This prevents unexpected payload parameters or persistence-layer fields from leaking into the domain.

### b. Application / Business Logic (Services / Use Cases)
- **What they are**: The orchestrators of business rules, transforming inputs into outcomes.
- **Rules**: These components consume sanitized inputs, execute the core logic, and delegate I/O or side-effects to abstracted dependencies (Repositories, External API clients, etc.).

### c. Infrastructure & Adapters (Repositories / External APIs)
- **What they are**: Code that interacts with the outside world (Databases, Third-Party APIs, UI rendering layers).
- **Rules**:
  - **Framework-Agnostic Constructors**: Do not tie constructors directly to the DI framework. Write constructors that accept pure dependencies (parsed primitives or specific interfaces). Then, use factory methods or DI module declarations to adapt the framework's container into the clean constructor. This ensures you can construct objects in tests without the full DI container.
  - **Defensive Networking**: When interacting with external services, never expose raw, untyped errors. Catch native exceptions and map them into domain-specific errors (e.g., `ErrTimeout`, `ErrNotFound`).
  - **Safe Parsing at Boundaries**: Treat the edges of the application as strictly untrusted. Use schema validation to define strict contracts for environment configuration, incoming request payloads, and outgoing external responses. Never let raw, unvalidated external data cross into the domain.

### d. Data Transformation (Mappers / DTOs)
- **What they are**: Pure functions or types responsible for translating data between boundaries.
- **Rules**: Prevent database schemas or raw API responses from contaminating the internal application state. Always map raw data into strict Domain Models through explicit DTOs.

### e. Error Translation at Boundaries
- **What it is**: A thin translation layer between infrastructure errors and domain errors.
- **Rules**: Repositories and adapters should catch infrastructure-specific errors (ORM errors, HTTP status codes, driver errors) and translate them into domain error types. Business logic should never handle infrastructure error types directly.

## 3. Code Construction & Decoupling Patterns
- **Event-Driven Integration**: If a service action causes side effects across disparate domains, use event emitters or message passing rather than hard-coupling cross-domain imports. Let the domain emit a state change, and let background listeners perform the downstream reaction.
- **Managing Side Effects (No Globals)**: Never rely on globals directly inside business logic or adapters. Calling time/date functions, HTTP clients, or random generators directly couples code to uncontrollable, non-deterministic system states.
  - Define explicit interfaces for side-effects (e.g., `Clock`, `HTTPClient`, `IDGenerator`).
  - Implement a production-ready concrete version and inject the interface into your classes/structs.
  - Provide a stateful Fake for tests (e.g., `FakeClock` with a frozen timestamp).
- **Probe / Instrumentation Pattern**: Define an observability interface (Probe) in the domain that declares business-relevant events (e.g., `HabitCreated()`, `TokenDecryptFailed()`). Implement it with real metrics/logging for production and a no-op for tests. This keeps observability decoupled from business logic.
- **Domain Logic in Classes, Not Loose Functions**: If a computation is part of domain processing, it belongs as a method on a class — not an exported standalone function. Loose functions are acceptable only for truly generic utilities (e.g., `clamp`, `slugify`). A class signals intent, groups related behavior, and is consistent with hexagonal layering.
- **Inject Dependencies, Don't Instantiate Inline**: Domain classes should receive their collaborators via constructor injection, not instantiate them with `new` internally. Inline instantiation hides dependencies, couples to concrete implementations, and makes testing harder. Even stateless collaborators should be injected — the cost is trivial and the design stays honest.

## 4. Testing Approach (GOOS Inspired)
- **Harnesses & Drivers**: Inspired by "Growing Object-Oriented Software, Guided by Tests" (GOOS), build and use Test Harnesses and Drivers to interact with the application in tests. These abstractions decouple the tests from concrete implementation details, allowing tests to read like business requirements.
- **Fakes over Mocks**: Avoid spy/mock frameworks for domain logic dependencies. Author explicit, custom Fake implementations of interfaces (e.g., a `FakeHTTPClient` that captures requests and returns predefined responses). Fakes provide realistic, reliable behavior without framework magic.
- **Generated Mocks for Thin Verification**: Generated mocks (e.g., mockgen, jest mocks) are acceptable only for verifying that specific interface methods were called with specific arguments — thin interaction assertions, not behavioral simulation. The moment a mock needs state or complex setup, replace it with a Fake.
- **Test Lifecycle Discipline**: Structure tests with strict setup and teardown lifecycles. Reset state explicitly in each test rather than relying on global hook clearing.
- **Test Isolation**: Each test must be independent. Use mechanisms like database transaction rollbacks, unique port allocation, or isolated containers to ensure tests don't interfere with each other.
- **Generated Code**: Treat any auto-generated files (Swagger clients, DB schema types, GraphQL codegen, mock files) as strictly read-only. Never modify them manually.

## 5. Workflows for Agents
When working on any project:
1. **Define the Loop**: Before writing code, clarify the tasks as Verifiable Goals. State a brief plan (e.g., "1. [Step] -> verify: [check]").
2. **Review TDD**: Generate the setup tests for the expected behavior first. Observe them failing. *Only then* implement the production code to make them pass.
3. **Generate & Build**: If the project relies on code-generation steps (API clients, ORM schemas, mocks), run those scripts before using the newly generated types.
4. **Clean after Action**: Ensure there are no type errors across the project and run the linter/formatter before calling the task finished.

## 6. Summary Cheat Sheet
- **Are we modifying auto-generated files manually?** No. Run the generator script instead.
- **Did we bypass the type system?** Remove it. Figure out the real type.
- **Did we touch adjacent files because "they could be cleaner"?** Revert. Surgical precision only.
- **Did we write the logic before the behavior test?** Wrong order. TDD always.
- **Did we leak raw database/API shapes into the core logic?** Stop. Use strict safe parsing at the edges and DTOs at the boundaries.
- **Are infrastructure errors leaking into business logic?** Translate them at the adapter boundary.
- **Are side-effects hidden behind globals?** Extract an interface, inject it, fake it in tests.
