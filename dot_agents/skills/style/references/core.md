# House coding style: core

The concrete patterns expected in code written for João, in every language. The
language files in this directory sit on top of this one. The review skill's Style and
Architecture briefs condense these rules; this file is the fine detail behind them.

Contents: precedence and conflicts; philosophy and mindset; architecture and
layering; construction and decoupling; testing.

## Precedence and conflicts

- On conflict, the more specific rule governs. A language file wins over this core
  file. The doctrine holds the reasons at principle level and wins where this skill
  seems to differ from it.
- Resolve conflicts out loud. Say which rule you set aside and why. Resolving a
  conflict silently is the defect, not having one. A precedence claim must quote a
  file you opened this session. Citing a document you did not read fabricates
  authority, and that is worse than the silent resolution it replaces. When no file
  states the winner, say so and ask. Do not infer a ladder.
- Apply these patterns in proportion to demonstrated domain and integration
  complexity.
- Preserve established project structure, dependencies, and idioms unless they
  conflict with an explicit house rule or the task changes them.
- Do not introduce classes, ports, mappers, DI, or messaging solely to satisfy this
  document.

## Philosophy and mindset

- **Simplicity, by Beck's four rules, in order.** The design passes the tests,
  contains no duplication, reveals intent, and has the fewest elements, in that
  order. Minimality is the fourth rule, not the first. A system that is minimal but
  unreadable is not simple.
- **Boring control flow.** Prefer plain if/else, loops, and early returns to clever
  expression-level tricks. Code that needs a comment to explain what it does is too
  clever. Rewrite it simpler.
- **Centralize control flow when splitting a function.** Branching is the part a
  reader must hold in their head, so keep it in one place. The parent keeps the if
  and switch statements and the loop-and-dispatch shape. Helpers take the non-branchy
  work, receive values, and return results. A helper that takes a flag telling it
  which path to run has inherited control flow the parent should have kept. This rule
  governs one decomposition. The same dispatch duplicated at several sites is the
  Repeated Switches smell, routed by the refactor skill's catalog index to its
  candidate refactorings.
- **Guards start at their strictest.** When creating a project, or adding a compiler,
  type checker, linter, or formatter to one, enable its strictest setting before code
  lands under it. Every line written under a loose guard becomes an argument against
  tightening it later.
- **Blank lines are a method's paragraph breaks.** A body reads as blocks of one
  thought each, separated by exactly one blank line, with none inside a block. One
  break is mandatory at any length, after a guard clause or early return. Past two
  statements, break also between deriving values and acting on them, between two
  independent effects, and before the statement that produces the result. A body of
  two statements or fewer takes no break. This applies to methods you wrote or
  restructured in this task. A one-line edit does not open a spacing pass. Gather
  related lines before separating the groups. A block that comes out with a name you
  can say is an Extract Function you had not spotted (the refactor skill's catalog
  holds its mechanics, and Slide Statements the gathering step). When you cannot say where one
  block ends, the method has no steps yet, and that is a design finding, not a
  spacing one. Test bodies mark their boundaries the same way; the Arrange, Act,
  Assert rules are the testing skill's.
- **Comments default to zero.** The test is not whether the comment says why instead
  of what. A why comment is usually still noise. The test is whether the code will
  be misread or silently broken without it. Before writing any comment, exhaust
  three moves: a clearer name, a smaller or extracted function, and moving the
  rationale to the design record (README, ADR, PRD). A comment survives only when
  all three fail and the code reads as removable when it is not. Then it states the
  consequence of removal and nothing else. When unsure, omit. Assume the reader
  wants no comment.
- **Never comment to explain your edit.** A note about what changed, when, what it
  replaced, or why you chose it is about the change, not the code. It goes in the
  commit message, where the reader looks for it. This applies to every file you
  touch, including config, data, and YAML frontmatter. Before typing one, confirm
  the format has comments at all. JSON does not.
- **Move understanding from your head into the code.** Renaming and extracting are
  how the understanding persists. Your head does not.
- **Never the `Impl` suffix.** `FooImpl` says nothing. Name a class for what it is:
  the technology, strategy, or source (`SlackNotifier`, `OtelProbe`,
  `PostgresUserRepository`). If the only thing distinguishing the class from its
  interface is being the implementation, you have not yet understood what makes it
  distinct.
- **Surgical execution.** Touch only what is directly relevant to the user's intent.
  Do not fix adjacent code, refactor for aesthetic reasons, or leave dead imports
  behind from your changes.
- **An exception is a design decision.** A suppression, ignore rule, lint or file
  exclusion, shim, or any other special case needed to get past a tool takes you out
  of a small fix and into design. Stop and enumerate the mechanisms that could
  express the intent, by reading each tool's actual interface (its options, its
  configuration schema, its type declarations), never your memory of it, and choose
  the one that needs no exception. An exception survives only with evidence that
  every surface was read and none can express the intent. A guard's refusal indicts
  the change, not the guard. A suppression's price is not its diff size. One line
  whose honest explanation is that a tool could not cope costs more than the larger
  change that needs no exception.
- **Goal-driven TDD.** Tests are written before the implementation. The loop and
  its green-step tactics are the testing skill's vocabulary.
- **Leverage the type system.** Use it to its fullest. Avoid escape hatches that
  bypass compile-time checks. Which token counts as an escape hatch is per-language,
  so take the list from the language file. Do not sniff fields on opaque values to
  guess the type. That is a runtime cast in disguise. Use real classes with
  `instanceof` or the language's equivalent, or parse with a schema validator at the
  boundary. If the compiler is unhappy, the upstream type is wrong. Fix it there.
- **Don't defend against your own code.** When you control both the producer and the
  consumer of a contract, enforce it at the type or schema level. Do not add
  fallback branches that handle a missing X when you decide whether X is provided.
  Iterative design leaves these branches behind, and they become the silent path
  where bugs hide as the code evolves around them. Make the contract mandatory and
  delete the fallback.
- **A shared contract change carries the deploy-compatibility constraint.** Schema,
  API response, event payload, queue message: a deploy is not atomic. The previous
  version keeps serving while the new shape is live, and a code rollback does not
  revert a migration. The change must be safe in both directions across that
  window, whether or not the task was framed as design. The doctrine's delivery and
  data sections hold the full reasoning.

## Architecture and layering

For applications with meaningful domain or integration complexity, use
Domain-Driven Design and hexagonal architecture to keep boundaries explicit and
dependencies pointing inward. The domain depends on nothing. Use cases depend on the
domain. Adapters depend on use cases. Simpler programs may use simpler structures
when contracts and testability remain clear.

A DI lookup key is not the type arrow these rules describe. Where a language file
has the consumer name its adapter as a DI token, the token is a lookup key. The
consumer touches no member of the adapter, and the compiler checks only the port.
Report a backward arrow when the type points the wrong way, not when the container's
lookup key does. The load-time module edge the key creates is a deliberate accepted
cost. Report it under no lens, neither dependency direction nor the operational or
developmental coupling types. A dependency cycle it produces is still reportable.

### Domain models and entities

- Entities are pure structural types holding business logic and core data. No raw
  database schemas, framework specifics, or wire formats leak in. Lightweight
  framework annotations are acceptable when they introduce no heavy coupling.
- **Behavior lives with data.** An entity that holds attributes with the real logic
  in services is the anemic domain model. Per-aggregate behavior belongs on the
  aggregate. The repository persists. The service orchestrates.
- **Explicit construction.** Entities map properties explicitly, never through bulk
  merges or reflection-based assignment. This keeps unexpected payload parameters
  and persistence-layer fields out of the domain.
- **Construction from canonical props only.** An entity's constructor takes the
  canonical domain shape, never a DB row, HTTP body, or wire payload directly. Each
  source translates into canonical properties at its boundary. Extract a
  source-specific mapper only under the mapper criteria below. Active Record fails
  in exactly this way: refactoring either the object or the schema forces the other
  to follow.

### Application layer

- Services and use cases orchestrate business rules. They consume parsed and
  validated inputs, execute the core logic, and delegate I/O and side effects to
  abstracted dependencies. The application layer coordinates. It does not contain
  domain logic.
- **Authorization is a boundary concern.** Whether this caller may perform this
  operation is resolved before the use case runs, in one place per route group. It
  is not re-derived inside domain logic and never left to the view. A use case that
  checks permissions has taken a second responsibility, and it will drift from the
  edge that checks them too.

### Infrastructure and adapters

- **The client defines the contract.** A port is a Separated Interface. It lives
  with the client that declares what it needs, not with the implementation that
  satisfies it. That placement is what makes the adapter depend on the port and
  never the reverse. Client count and locality decide where the interface goes. One
  client, or several inside one package, puts it there. Several unrelated clients,
  or a contract neither side owns, puts it in a third interface-only package.
  Re-run that test when a second consumer appears. Do not extract a port at all
  until you need to break a dependency or substitute an implementation. A test that
  needs a Fake is that need. An interface per class is overhead, not design.
- **Framework-agnostic constructors.** Constructors accept pure dependencies, parsed
  primitives or specific interfaces, never the DI framework's own types. Factory
  methods or DI module declarations adapt the container to the clean constructor.
  Objects must be constructible in tests without the full DI container.
- **Defensive networking.** Bound external calls with deadlines or cancellation.
  Translate native failures into stable application or port errors. Use domain
  errors only for domain outcomes.
- **Safe parsing at boundaries.** Treat the edges as strictly untrusted. Use schema
  validation for environment configuration, incoming request payloads, and external
  responses. Raw, unvalidated external data never crosses into the domain. A value
  can satisfy its schema and still be hostile: a well-formed URL that resolves to
  link-local or internal address space, a valid relative path that escapes its
  root. Shape is not destination. Validate both.

### Mappers and DTOs

- Mappers and DTOs are stateless, non-mutating translators between boundaries. Same
  inputs yield same outputs. Input objects are never modified in place.
- **Anti-corruption layer at integration boundaries.** Do not let external models
  contaminate yours. Extract a mapper when the translation is non-trivial, reused,
  independently tested, or protects the domain from an external model. A small
  local pure conversion is fine otherwise.

### Error translation at boundaries

- A thin translation layer sits between infrastructure and application errors.
  Repositories and adapters translate ORM, HTTP, and driver failures into stable
  port errors. Business logic never handles infrastructure-specific types. Domain
  errors remain reserved for domain outcomes.

## Construction and decoupling

- **Tell, don't ask.** Tell objects what you want done in terms of the role the
  neighbor plays. Do not ask for their internals and decide for them. Querying
  values, collections, and factories is fine. The rule applies to objects with
  identity and behavior, not to values.
- **One shape per class.** A data structure exposes data and carries no behavior. An
  object hides data behind behavior. A class that does both is the worst of both,
  and callers split into camps that break its invariants. Field chains through
  plain data structures are normal access, not a coupling violation.
- **Don't return null, don't pass null.** When absence is normal flow, return an
  empty collection or a special-case object. When absence is exceptional, throw or
  return a domain error. A null argument is a bug at the call site.
- **Event-driven integration across domains when the requirement calls for it.** Use
  events or messaging for asynchronous delivery, independent ownership, or
  decoupled evolution. Prefer direct orchestration when immediate consistency and a
  single owner make it simpler.
- **Control non-deterministic side effects.** Pass clocks, network clients, and
  random or ID generators explicitly when tests, lifecycle, or replacement require
  control. Production wiring uses the real collaborator. Tests use a deterministic
  Fake.
- **Probe pattern only when needed.** Introduce a Probe port only when
  business-level observability must remain independent of an adapter. Generic
  infrastructure telemetry stays at the adapter boundary.
- **Put domain behavior with the model it governs.** Use a class, value object,
  module, or pure function according to the language and the required state. Avoid
  service objects that manipulate anemic records.
- **Generic utilities carve-out.** Truly generic utilities (`clamp`, `slugify`, pure
  math) may be shared. Domain-specific computations stay with their domain even
  when implemented as pure functions.
- **Inject side-effecting or replaceable dependencies.** Constructor injection
  exposes I/O and runtime collaborators. Pure stateless helpers may be called
  directly. Wrapping them adds a seam without adding control.
- **Pass meaning-selecting options explicitly.** Where an option or flag controls
  how the callee interprets an argument (a parse or evaluation mode, a format, a
  protocol), state it at the call site even when the default is the value you
  want. An omitted mode is indistinguishable from an overlooked one, and a changed
  default silently rewrites what the call does. Tuning knobs (sizes, retries,
  buffers) stay at their defaults until a requirement sets them. Deadlines on
  external calls are already mandatory under defensive networking and are not
  tuning knobs.
- **A call must not compile with its arguments transposed.** Where adjacent
  parameters carry domain values of one type (two IDs, two amounts,
  `transfer(from, to string)`), give the call site a label: a parameter object, or
  a distinct type per role. Dependencies with unique types (a DB handle, a logger)
  stay positional. So do generic helpers whose order is the convention
  (`clamp(v, lo, hi)`, `divCeil(n, d)`).
- **YAGNI and orthogonality.** Design for the current need, not the hypothetical
  future. Speculative generality is a code smell. Scattered edits for one logical
  change are a coupling signal, not an automatic defect.

## Testing

- Testing discipline lives in the testing skill. Load it for any task that touches
  tests, and it wins over this skill on test matters; the doctrine wins over both.
  Its `references/checklist.md` is the pre-commit checklist.
- Treat auto-generated files (Swagger clients, DB schema types, GraphQL codegen,
  mock files) as strictly read-only. Never modify them manually. Re-run the
  generator.
