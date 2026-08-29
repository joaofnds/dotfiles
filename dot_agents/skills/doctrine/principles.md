# Principles and practices

The engineering doctrine, derived from João's curated wiki (`~/code/wiki`). Every
line traces to a wiki page, named in parentheses; when a line reads ambiguous, the
page is the authority. Each numbered section stands alone, and its **bold lead**
carries the section's core commitment.

## 0. Standing directives (João's own; no wiki page)

- **Keep a per-project ubiquitous-language document.** Every project gets a glossary
  recording its domain terms as they're learned; load it whenever returning to the
  project, so the language is in context from the first message.
- **After every task, run a refactoring pass — architectural, not just in-file.**
  Look for the structural opportunity the task exposed, not only local cleanup.
- **DDD means the fundamentals:** knowledge crunching and the ubiquitous language of
  the book's first chapters, not the implementation-pattern catalog (§6 is ordered
  accordingly).

## 1. Working method: small steps, verified

**Work in the smallest coherent increments with the fastest feedback available;
verify each step empirically before the next.**

- Small batches and iteration at every scale — TDD commit, CD deploy, product MVP —
  because queue time and rework cost, not effort, are what to minimize, and iteration
  is what flattens the cost-of-change curve; refactoring and tests make it
  survivable (Small Batches; Small Steps & Fast Feedback; Working Iteratively;
  Incrementalism; Product Development Flow).
- Treat every change as an experiment: hypothesis, prediction of the exact result,
  controlled variables, measurement; assume your beliefs about the system are wrong
  until verified (Being Experimental; Empiricism in Software Engineering).
- Fail fast and prefer early feedback; treat the feedback layers (test, CI, deploy,
  production) as one system (Feedback).
- Decide at the last responsible moment; keep options open; design daily rather than
  up front, with duplication-elimination as the concrete heuristic (Incremental
  Design; Waterfall as Anti-pattern).
- Recognize which product phase you're in (Explore / Expand / Extract) and flip
  practices accordingly (3X).

## 2. TDD and the test discipline

**Write the test first, as a design tool; let test pain report design problems.**

- Three Laws of TDD; Red→Green→Refactor; choose Fake It / Triangulate / Obvious
  Implementation by confidence, not habit; keep a visible test list (Three Laws of
  TDD; Test-Driven Development by Example; Canon TDD).
- A hard-to-write test is design feedback about the abstraction, never a testing
  problem — "listen to the tests" (Growing Object-Oriented Software; Test-Driven
  Development).
- Only mock types you own; mocks are a design-feedback tool; distinguish state from
  behavior verification before choosing a double (Mock Objects; Mocks Aren't Stubs).
- Hold unit tests to FIRST; see every test fail once before trusting it; select tests
  by risk and fear, not method coverage (FIRST Properties; Building Tests).
- Use the full double taxonomy precisely (dummy/stub/spy/mock/fake); design for
  testability up front — DI, Humble Object — rather than bolting on hooks (xUnit Test
  Patterns).
- Property-based testing for the edge cases you didn't anticipate; Marick's quadrant
  to choose test grain; the exploratory quadrant stays irreducibly manual (Property-
  Based Testing; Testing Strategy).
- Build a walking skeleton — the thinnest end-to-end slice through build, deploy, and
  test — before feature work (Walking Skeleton).
- Legacy code is code without tests: characterization tests to pin behavior, seams to
  break dependencies, sprout/wrap for additions, and the five-step change algorithm
  (find change points → test points → break dependencies → write tests → change)
  (Working Effectively with Legacy Code; Characterization Test; Seam Model; Legacy
  Code Change Algorithm).

## 3. Lean foundations: Deming, TPS, kata

**Manage by means, not results; make problems visible the moment they occur; improve
as a daily habit through PDCA.**

- Deming's four lenses together — system, variation, knowledge, psychology; never
  diagnose with one (System of Profound Knowledge). Distinguish common-cause from
  special-cause variation before reacting; tampering makes stable systems worse
  (Understanding Variation; The Red Beads Experiment). The system causes its own
  behavior — look there before blaming a person (Systems Thinking).
- Jidoka (stop-on-defect) plus pull-based flow as the structural pillars; poka-yoke —
  asserts, type systems, CI gates — over operator vigilance; muda/mura/muri, with
  slack as a feature against overburden, not waste (Toyota Production System;
  Poka-Yoke; The Three M's).
- Kaizen as a daily habit grounded in direct observation, not an event; visualize
  state — what gets visualized gets managed (Kaizen; Visual Management).
- The Improvement Kata in order: direction, current condition (measured directly, no
  averages), next target condition (a process pattern with a date, not an outcome
  number), PDCA against obstacles (Improvement Kata; Target Condition; Toyota Kata).
  The Coaching Kata's five questions bind by analogy: they are the shape of the
  retrospective loop between you and the agent (§13) (Coaching Kata).
- Spear's four capabilities as a package: design systems that reveal problems, swarm
  and solve at the point of occurrence, share knowledge in the form it needs, develop
  others as the senior person's primary job (The High-Velocity Edge, Capabilities
  1–4). Capabilities three and four bind by analogy: knowledge-sharing is the memory
  and wiki system, developing others is improving the corpus itself (§13).
- Theory of Constraints: find the bottleneck; optimizing a non-bottleneck changes
  nothing (Theory of Constraints; The Phoenix Project). Sequence by cost of delay;
  limit WIP; track percent-complete-and-accurate at handoffs (Product Development
  Flow; Percent Complete and Accurate).
- Five Whys to root cause; every defect is a system signal (Root-Cause Analysis).

## 4. Delivery: continuous, trunk-based, always releasable

**Keep the system always releasable; integrate on trunk daily; one pipeline promotes
one build of the bytes; done means released.**

- Trunk-based development, daily commits to main; long-lived branches structurally
  break CI (Trunk-Based Development; Continuous Integration; Single Code Base).
- One deployment pipeline per system; build the binary once and promote the same
  artifact; commit stage under ~5 minutes and owned green; failing acceptance test is
  a hard gate (Deployment Pipeline; Commit Stage; Automated Acceptance Testing).
- Everything in version control — application, environment, infrastructure as
  declarative self-healing code, database changes as roll-forward/roll-back scripts;
  expand-contract for breaking schema changes, decoupling migration from deploy
  (Configuration Management; Managing Infrastructure; Managing Data; Evolutionary
  Database Design; Schema Evolution).
- Separate deployed from released: blue-green, canary; smaller batches reduce release
  risk; daily deployment as the discipline target (Deploying and Releasing; Daily
  Deployment; Incremental Deployment).
- Automate compliance through the pipeline (access control + audit trail), not a
  change-advisory board — CAB correlates with worse outcomes (Managing Continuous
  Delivery; Accelerate).
- Nonfunctional requirements as quantitative stories up front; simpler code, not more
  complex code, is what achieves capacity (Testing Nonfunctional Requirements).
- Measure delivery by the DORA four keys as outcomes, never activity proxies; speed
  and stability are complementary; invest in the technical practices as primary, with
  loosely coupled architecture and empowered teams as the strongest predictors
  (DORA — Accelerate Metrics; Accelerate; Accelerate Architecture Findings).
- Painful off-hours deploys are deployability debt, not maturity (Deployment Pain
  and Burnout).

## 5. Architecture: boundaries, dependencies, coupling

**Fight complexity itself; draw boundaries along axes of change; point every
dependency at stability; couple deliberately, never accidentally.**

- Complexity is judged by the reader's cost to understand and modify; zero tolerance
  for its accumulation; invest 10–20% continually in strategic over tactical work;
  push complexity down into the implementation, never out into configuration
  parameters (A Philosophy of Software Design; Software Complexity; Strategic vs.
  Tactical Programming).
- The Dependency Rule: source dependencies point inward toward policy; database, web,
  and frameworks are volatile details behind boundaries; hexagonal core with adapters
  translating at the edge (Clean Architecture; X Is a Detail; Hexagonal Architecture).
- SOLID at class level, the component principles (cohesion vs coupling, stable-
  abstractions) at component level; boundaries along axes of change, watched so
  partial boundaries don't erode (SOLID Principles; Component Principles;
  Architectural Boundaries).
- Coupling is the central design skill: know the types, accept coupling to stable
  things (cite observed change history, not shape), loosen toward uncertain things;
  strong coupling plus slow feedback is the one combination that never works
  (Coupling; and your own framing in §0).
- Simple over easy — few interleaved concerns beats familiar; Beck's four rules in
  order (Simplicity vs. Ease; Beck's Four Rules).
- Architecture is evolutionary and unfinished; microservices are an organizational-
  decoupling play, not free architecture; the humble object at every boundary keeps
  logic testable (Software Architecture; Microservices; Humble Object Pattern).
- Deterministic core, imperative shell: inject the clock; determinism is a
  prerequisite for testability (Determinism).
- Patterns are shared vocabulary with trade-offs, not prescriptions: composition over
  inheritance, program to interfaces; choose each pattern by its forces; CQRS and
  event sourcing stay deep in the toolbag until the case genuinely needs them (Design
  Patterns; CQRS; Event-Driven Architecture; Event Sourcing). The wiki holds the full
  GoF and enterprise-architecture catalogs as reference vocabulary.
- Parse, don't validate: make illegal states unrepresentable; parse untrusted data
  once at the boundary into a precise type (Parse, Don't Validate). Wrap bare domain
  primitives in value objects that name the concept (Primitive Obsession; Money).
- Define errors out of existence where safe — redesign the interface so the error
  case can't occur (Defining Errors Out of Existence).

## 6. Domain-driven design (your emphasis: the fundamentals)

**One ubiquitous language shared by experts, developers, and code; the model is the
language; refactor toward deeper insight as understanding grows.**

- Knowledge crunching with domain experts, iteratively — never model in isolation;
  domain experts do the modeling with you (Knowledge Crunching; Analysis Patterns).
- The ubiquitous language lives everywhere — conversation, code, tests, diagrams —
  and per your standing directive, in a per-project glossary document loaded on
  return to the project (Ubiquitous Language; §0).
- Model and implementation reflect each other in one loop; whoever touches the model
  touches code and vice versa (Model-Driven Design; Hands-On Modelers).
- A model is judged by usefulness, not truth; listen to language, scrutinize
  awkwardness, contemplate contradictions to surface implicit concepts; act on a
  breakthrough even when it discards recent work (Analysis Patterns; Making Implicit
  Concepts Explicit; Breakthrough).
- Strategic before tactical: explicit bounded contexts, mapped relationships,
  anti-corruption layers against upstream models; concentrate effort on the core
  domain, minimal investment in generic subdomains (Bounded Context; Context Map;
  Anti-Corruption Layer; Core Domain; Generic Subdomain).
- Tactical patterns only when they earn their keep; the anemic domain model — logic
  pushed into a thick service layer — pays both costs and reaps neither benefit
  (Anemic Domain Model; Domain Model; Transaction Script as the legitimate cheap
  default for simple logic).

## 7. Code craft

**Code is read far more than written; optimize for the reader; leave everything
cleaner than found.**

- Clean Code: intention-revealing names, small single-purpose functions at one level
  of abstraction, comments as a failure signal except the categories code can't
  carry, formatting as team communication (Clean Code; Meaningful Names; Function
  Design; Code Comments).
- Refactoring is small, behavior-preserving steps, distinct from restructuring;
  opportunistic litter-pickup as the baseline habit, the other modes deliberate;
  tidy first in separate commits; smells are the trigger, the catalog is the
  vocabulary (Refactoring; Refactoring Workflows; Tidy First; Code Smells). Your
  standing directive (§0) extends this: after every task, look architecturally, not
  just in-file.
- Pragmatic: DRY is about knowledge, not code; design by contract, treating
  violations as bugs; never program by coincidence; Law of Demeter as a coupling
  smell-detector; fix broken windows immediately; tracer bullets for end-to-end
  feedback (The Pragmatic Programmer; Design by Contract; Programming by
  Coincidence; Law of Demeter).
- Never merge generated or AI-produced code without reading and understanding every
  line — interwoven code becomes yours to own (Evil Wizards).
- Isolate third-party code behind domain-named interfaces; write learning tests
  against third-party APIs (Clean Boundaries; Library and API Dependencies).

## 8. Data and distributed systems

*Binds when the task touches data stores, queues, or distributed state; context
otherwise.*

**Name the guarantee you're relying on and verify the system actually gives it;
design for partial failure and both-direction schema compatibility.**

- Know your actual isolation level and defend against what it doesn't prevent; pick
  replication and conflict strategies deliberately, never by default; never trust
  wall clocks for ordering; fencing tokens on locks; only pay for linearizability
  where recency is genuinely required (Transactions; Isolation Levels; Unreliable
  Clocks; Fencing Tokens; Linearizability).
- Choose storage, partitioning, and processing models by workload and fault-design,
  not familiarity; CDC over dual writes for derived stores; prefer integrity over
  timeliness when they trade off, with compensating actions over global blocking
  (OLTP Storage Engines; Partitioning; Change Data Capture; Timeliness vs.
  Integrity).
- Define scalability against concrete load parameters and tail percentiles, not
  claims (Scalability).

## 9. Operations and reliability

*Binds when designing or operating a running service; context otherwise.*

**Reliability is an engineered, budgeted property: SLOs with error budgets govern the
speed-stability trade; design for production from the start; learn blamelessly.**

- SLIs as good/total ratios, SLOs bounded on both sides, targets set by business
  tolerance — never more reliable than needed (Service Level Objectives; Embracing
  Risk).
- Toil capped and systematically eliminated; page on symptoms via the four golden
  signals; stabilize first, then root-cause; canary every change; blameless
  postmortem after every significant incident (Toil; Monitoring; Effective
  Troubleshooting; Emergency Response; Blameless Postmortem).
- The stability patterns — timeouts, circuit breakers, bulkheads, fail fast, shed
  load — as standard defenses; retry budgets and jittered backoff against death
  spirals; chaos experiments with a steady-state hypothesis and bounded blast radius
  (Stability Patterns; Cascading Failures; Chaos Engineering; Release It!).
- Business-meaningful telemetry from domain code via a probe abstraction — "logging
  is a feature" (Domain-Oriented Observability); T1/T2 signal separation; ops reviews
  around SLO burn-down (T1 and T2 Signals; Ops Reviews).
- The curator's reconciliation: SRE is restated lean — error budget as andon cord,
  SLO policy as jidoka, blameless postmortem as genchi genbutsu (Lean Roots of SRE).

## 10. Teams, culture, sustainability

**Quality non-negotiable; sustainable pace; culture and team-shape guidance routes
through §13's team-facing carve-out.**

- Fix time and quality, negotiate scope; keep slack in every plan; long hours are a
  control failure (Negotiated Scope Contract; Slack; Energized Work).
- Technical debt named and tracked as the deliberate metaphor it is (Technical Debt;
  WyCash Story).
- Culture and organization — generative culture and driving out fear, the Five
  Ideals, Team Topologies, Brooks's Law and quadratic communication cost — bind
  team-facing work as written and serve as advice context otherwise, per §13
  (Westrum Organizational Culture; Psychological Safety; The Five Ideals; Team
  Topologies; Team Continuity; The Mythical Man-Month).

## 11. AI-assisted development

**Use the model's real capability profile while guarding its named failure modes.**

- Structure agentic use around reflection, tool use, planning, and multi-agent
  patterns; guard against hallucination, context rot, vibe coding, and measurement
  theater (Agentic Workflows; LLM-Assisted Development).
- Evil Wizards applies with full force to LLM output: read and own every line (§7).

## 12. When the voices conflict

The wiki deliberately holds authors who disagree. An agent meets these disagreements
daily and must not resolve them silently. The canon, ruled by João: **PragProg, Clean
Code, XP, Refactoring, GOOS, Release It, Clean Architecture, Modern Software
Engineering.**

Ruled (João, 2026-08-28):

- **Ousterhout loses every conflict with the canon.** Concretely: comments remain a
  failure signal with narrow exceptions, not a design tool written first; test-first
  remains the design method, against his "tactical programming" critique of TDD;
  small, intention-revealing functions and classes beat his deep-modules skepticism
  of decomposition; design for the current need (YAGNI) beats "somewhat
  general-purpose". *A Philosophy of Software Design* keeps contributing where it
  doesn't collide: complexity judged by reader cost, zero tolerance for its
  accumulation, continuous strategic investment.
- **Language idiom outranks book guidance.** Clean Code's "prefer exceptions over
  error codes" yields to Go's errors-as-values; every canon rule renders through the
  language's own idiom.

- **Documentation permanence: decision and domain records earn it; excuses don't.**
  Keep ADRs, C4 architecture documents, context and domain glossaries, and their
  kin — records of decisions and of the domain. Eliminate any documentation or
  comment that exists as an excuse for bad code: the fix is the code, not the prose.
  XP's "code and tests are the only permanent artifacts" is narrowed accordingly,
  not adopted wholesale.
- **Composition over inheritance; inheritance is not the default.** Fowler's
  inheritance-first yields; the delegate-direction refactorings (Replace Subclass /
  Superclass with Delegate) are the expected direction of travel, and a new
  hierarchy needs a case.
- **Security: gap acknowledged, requirements stand.** The thinness is a known weak
  point of both the curator and the wiki — the corpus must not paper over it with
  invented depth. Two requirements stand regardless: security review is a standard
  part of the review process, and security shifts left into the toolchain and
  design. (The review-process half also binds the conduct brief's review machinery,
  not just this document.)

## 13. Scale translation: one person, agents, and teammates

**Read team-scale practices by who the work touches, not by team size.**

- **Directly applicable regardless of scale:** everything in §1–§9 — method,
  delivery, architecture, code, testing, operations.
- **Applicable whenever the work is team-facing:** writing
  documentation others read, reviewing pull requests, replying to comments on
  issues, crafting update messages and announcements. There, the team sections apply
  as written: generative-culture tone, blameless framing, visible reasoning,
  stories in customer-visible language.
- **By analogy for solo-plus-agents work:** pairing's continuous review becomes the
  human-agent loop and unprimed second review; swarming a defect becomes
  stop-and-fix before new work; collective ownership becomes any-session-can-touch-
  anything with the standards holding.
- **Context only, no compiled behavior:** org design (Team Topologies, SRE staffing,
  transformational leadership, on-call sizing) — judgment background for advice,
  never instructions to act out.

**Split with the conduct brief:** this document owns engineering
doctrine; the requirements brief owns agent conduct — evidence discipline, bounded
autonomy, communication shape, safety bars. Neither duplicates the other.

## 14. Lineage (context, not commitments)

Deming, Ohno, and Toyoda through Spear and Rother; the XP/refactoring/DDD cluster
(Beck, Cunningham, Fowler, Evans, Feathers); the CD/DevOps cluster (Farley, Humble,
Kim, Forsgren); the testing and architecture voices (Freeman, Pryce, Nygard, Parnas,
Kleppmann, Ousterhout). The wiki's syntheses reconcile these into one tradition —
lean thinking expressed as software practice.
