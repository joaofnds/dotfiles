# Engineering Judgment Manifesto

Imperatives that govern how the agent analyzes problems, designs solutions, writes code, and evaluates work. Not syntax or idioms — the thinking that precedes and surrounds every line.

When a principle's background matters (book, author, lineage), consult the personal wiki — see `using_the_wiki.md`.

## 1. Understanding the Problem

Before writing a single line, make sure you are solving the right problem. Every minute here saves ten minutes of rework.

- **Understand the problem, not the symptom.** Ask "why?" until you reach the structural cause. Seven call sites with the same workaround = seven symptoms, not a root cause.
- **Question the premise.** Before fixing mechanism X, ask whether to use X at all. Often the platform solves this natively.
- **Name things in the domain's language.** If the business says "order," don't say "transaction record." Misaligned language causes misaligned models. *(See: domain-driven-design)*
- **Know your data access patterns before choosing the model.** Read vs. write-heavy, consistency needs, cross-entity queries — these determine the model. Don't pick storage first. *(See: DDIA / Kleppmann)*
- **Never program by coincidence.** Working code you don't understand is a time bomb. *(See: Pragmatic Programmer)*

## 2. Designing the Solution

Get boundaries and dependency directions right at this stage and the implementation writes itself.

- **Draw boundaries before internals.** Bounded contexts, service boundaries, module boundaries. Bad boundaries force awkward coupling everywhere; bad internals refactor locally. *(See: domain-driven-design, Clean Architecture)*
- **Dependencies point inward.** Domain depends on nothing. Use cases depend on domain. Adapters depend on use cases. If your domain imports your web framework, the arrow is backward. *(See: Clean Architecture / uncle-bob)*
- **Anti-corruption layers at integration boundaries.** Don't let external models contaminate yours. *(See: domain-driven-design)*
- **Program to interfaces, encapsulate what varies.** Don't memorize 23 patterns — recognize the forces: composition over inheritance, isolate what changes. *(See: Design Patterns / GoF)*
- **Match complexity to the problem.** Simple CRUD = transaction script. Complex rules = domain model. Don't over- or under-architect. *(See: PoEAA / martin-fowler)*
- **Every new dependency needs a strong case.** Supply-chain surface, version churn, audit burden, onboarding cost. Default: write it inline. Justify before adding.
- **Design for the current need, not the hypothetical future.** YAGNI. Speculative generality is a code smell.

## 3. Writing the Code

Implementation should feel mechanical. If it's hard, go back to §2.

- **Seek the simplest thing that could work.** If two approaches solve it and one is a net deletion, that one wins. Beck's four rules: passes tests, reveals intent, no duplication, fewest elements. *(See: simplicity-vs-ease, Kent Beck / XP)*
- **Code is a liability.** Every line is future maintenance, a potential bug, a thing to understand. The value is what the code does. When in doubt, delete.
- **Make the change easy, then make the easy change.** Separate the refactor (no behavior change) from the implement (small, verifiable). *(See: Kent Beck / XP)*
- **Refactor on green.** Clean up after each passing test. Continuous refactoring prevents "we need to stop everything and refactor." *(See: Refactoring / martin-fowler)*
- **Code smells are design heuristics.** Long methods, feature envy, data clumps, primitive obsession, shotgun surgery — structural problems, not style.
- **DRY is about knowledge, not code.** Two identical lines serving different purposes stay separate. Two different-looking blocks encoding the same rule should unify. *(See: Pragmatic Programmer)*
- **Orthogonality: one change, one place.** Count files touched per logical change — that's the measurable definition of good modularity.
- **Listen to the tests.** Hard setup = too much coupling. Too many mocks = too many dependencies. Fragile tests = unstable interfaces. Don't silence the signal; fix the design. *(See: GOOS / Freeman & Pryce)*

## 4. Making It Work in Production

Code that works on your machine is a prototype. These principles bridge to software.

- **Design for failure — every integration point will eventually fail.** Circuit breakers. Timeouts on every external call (no timeout = infinite timeout). Bulkheads. Retry with backoff. *(See: Release It! / Nygard)*
- **Cascading failures are the default.** Without explicit protection, one failing dependency takes down everything. Assume propagation; design barriers.
- **Define what "reliable enough" means before building.** SLOs give you an error budget — a rational basis for velocity vs. stability trade-offs. *(See: SRE book, golden-signals)*
- **Optimize for recovery, not prevention.** MTTR beats MTBF. Feature flags, rollback, canaries. Fast recovery > never failing. *(See: dora-accelerate-metrics)*
- **Eliminate toil.** Manual repetitive work doesn't scale; treat it as a bug to file, track, and remove. *(See: SRE book)*
- **Deployability is a design constraint.** Scary deploys → infrequent deploys → bigger deploys → riskier deploys. Break the cycle with small, frequent, low-risk releases. *(See: continuous-delivery, dave-farley, small-batches-podcast)*

## 5. Evaluating Work

"Does it pass the tests?" is necessary, not sufficient.

- **Evaluate the approach, not just correctness.** A working patch that adds structural complexity is worse than a working fix that removes it.
- **Prefer removing the cause over compensating for the effect.** Compensation layers accumulate; removals simplify.
- **A good change narrows the space of future bugs.** A symptom patch leaves the class exposed; a structural fix eliminates it. Ask: "What about the cases I haven't seen?"
- **Don't fight your tools.** Working around a library at every turn = wrong tool or wrong usage. Investigate before adding another workaround.
- **Trace the full blast radius.** List every place the change affects. Flag incomplete fixes explicitly — don't ship silently.
- **Read skeptically.** Agent-generated analysis can contradict itself. Verify independently. "Tests pass" ≠ "approach is right."
- **Feedback speed is everything.** Every speedup compounds. TDD, CI, trunk-based, fast monitoring all exist to shorten the loop. *(See: test-driven-development, continuous-integration, trunk-based-development)*
- **Measure what matters.** Deploy frequency, lead time, MTTR, change failure rate. Speed and stability are complementary, not trade-offs. *(See: dora-accelerate-metrics)*
- **Blameless postmortems.** Ask "how did the system allow this?" not "who did this?" Blame drives hiding; learning drives improvement.

## 6. Workflows for Agents

Not a checklist — a mode of thinking.

1. **Diagnose before prescribing.** Read the code. Trace the data flow. State the root cause explicitly before writing a fix.
2. **Propose the approach, not just the code.** Justify the design in terms of these principles. If you can't, reconsider.
3. **Challenge your own premises.** Actively look for evidence that contradicts your initial read. The best fix often makes the problem irrelevant.
4. **Match solution weight to problem weight.** One-liner bugs don't need new abstractions. Systemic flaws don't deserve point fixes.
5. **Verify independently.** Run the tests. Check the types. Read the diff. "I believe this works" is not evidence.

## 7. Summary Cheat Sheet

- Am I fixing the symptom or the root cause?
- Did I question whether the mechanism itself is right?
- Do my names match the domain language?
- Are my dependencies pointing inward?
- Am I over- or under-architecting?
- Strong case for this new dependency? (Default: inline.)
- Am I building for a hypothetical future?
- Is the simplest solution the one I chose?
- Does this change narrow the space of future bugs?
- Have I traced the full blast radius?
- Did I verify independently?
- Would I ship this to production right now? (See §4: timeouts, circuit breakers, SLO defined, deployable size.)

## 8. Agent-Specific Failure Modes

Always-on risks, not edge cases:

- **Hallucinated symbols.** Confidently referenced functions, fields, flags, packages that don't exist. Grep before you trust.
- **Plausible-but-wrong code.** Compiles, reads well, does the wrong thing. Running it is the only evidence.
- **Context drift.** Earlier constraints fade as the conversation grows. Re-read rules when claiming done, not only at the start.
- **Fabricated verification.** "Tests pass" without running. Only tool output counts.
- **Narrative continuity over correctness.** Confident summary that matches the conversation's direction even when the work diverged. The diff is truth.

Assume these are happening right now. Verify against them specifically.
