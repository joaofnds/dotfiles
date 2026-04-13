# Engineering Judgment Manifesto

This document codifies the engineering judgment principles that govern how an AI agent should analyze problems, design solutions, write code, and evaluate work. It is not about syntax, frameworks, or language-specific idioms — it is about the thinking that precedes and surrounds every line of code. An agent that follows the coding style manifesto but ignores these principles will produce technically correct code that solves the wrong problem or solves the right problem in the wrong way.

Good engineering is mostly thinking, not typing. The difference between a quick fix and an elegant solution is the quality of the analysis that precedes it.

## 1. Understanding the Problem

Before writing a single line, make sure you are solving the right problem. Most bad code traces back to a misunderstanding at this stage — jumping to the first plausible fix instead of diagnosing the actual disease. Every minute spent here saves ten minutes of rework later.

**Understand the problem, not the symptom.** A bug report describes symptoms. Your job is to find the disease. Ask "why?" repeatedly until you reach the structural cause. If you're patching 7 call sites with the same workaround, you've found 7 symptoms, not the root cause.

**Question the premise.** Before fixing mechanism X, ask: "Should we be using X at all?" Check if the platform already solves this natively. The best fix is often removing the thing that created the bug.

**Name things in the domain's language.** If the business calls it an "order," don't call it a "transaction record." Misaligned language causes misaligned models. If you can't name something clearly, you don't understand it yet.
- *Source — Domain-Driven Design (Eric Evans):* The central insight of DDD is that software should model the business domain in its own language. A "Ubiquitous Language" shared between developers and domain experts eliminates the translation errors that cause the most insidious bugs — the ones where the code does exactly what it says but means something different from what the business intended.

**Know your data access patterns before choosing the model.** Read-heavy or write-heavy? Strong or eventual consistency? Cross-entity queries? The answers determine the model — don't pick the storage technology first and force the data into it.
- *Source — Designing Data-Intensive Applications (Martin Kleppmann):* DDIA's core thesis is that data systems involve fundamental trade-offs (consistency vs. availability, latency vs. durability, normalization vs. denormalization) and the right choice depends entirely on your workload characteristics. There is no universally "best" database or data model — only the best fit for your access patterns.

**Never program by coincidence.** If something works and you don't know why, you don't have a solution — you have a time bomb. Understand why your code works.
- *Source — The Pragmatic Programmer (Hunt & Thomas):* The Pragmatic Programmer warns that coincidental correctness is the most dangerous kind of "working" code. When you don't understand why something works, you can't predict when it will stop working, and you can't safely change it.

## 2. Designing the Solution

Design is the bridge between understanding the problem and writing the code. Get the boundaries and dependency directions right at this stage and the implementation writes itself. Get them wrong and no amount of clever code will save you.

**Draw boundaries before internals.** Getting bounded contexts, service boundaries, and module boundaries right matters more than internal design. A bad boundary forces awkward coupling everywhere; bad internals can be refactored locally.
- *Source — Domain-Driven Design (Evans) and Clean Architecture (Robert C. Martin):* DDD teaches that bounded contexts define where a model is valid and where translation is needed. Clean Architecture reinforces this by making the boundary the most important architectural decision — internals are cheap to change, but a misdrawn boundary forces every change to ripple across modules.

**Dependencies point inward.** Business logic depends on nothing. Use cases depend on domain models. Adapters depend on use cases. Frameworks, databases, and UI are outer-ring details. If your domain imports your web framework, the arrow is backward.
- *Source — Clean Architecture (Martin):* The Dependency Rule is the single non-negotiable constraint: source code dependencies must point inward, toward higher-level policies. This ensures business logic is testable, portable, and immune to infrastructure churn.

**Anti-corruption layers at integration boundaries.** When integrating with external systems or legacy code, don't let their model contaminate yours. Build a translation layer that speaks your language internally and theirs externally.
- *Source — Domain-Driven Design (Evans):* The Anti-Corruption Layer is DDD's answer to the reality that you rarely control the systems you integrate with. Without this layer, external system quirks leak into your domain and every upstream API change becomes a domain model change.

**Program to interfaces, encapsulate what varies.** These two principles from the GoF matter more than any specific pattern. Don't memorize 23 patterns — recognize the forces that call for them: composition over inheritance, isolate what changes from what stays the same.
- *Source — Design Patterns (Gamma, Helm, Johnson, Vlissides):* The lasting insight of the GoF book is not the catalog of 23 patterns but the two principles that generate them. Most design problems reduce to: "What varies here?" and "How do I isolate it behind a stable interface?"

**Match complexity to the problem.** Not everything needs a rich domain model. Simple CRUD is fine with transaction scripts. Complex rules need domain models. Recognize which you're dealing with and don't over-architect simple problems or under-architect complex ones.
- *Source — Patterns of Enterprise Application Architecture (Martin Fowler):* PoEAA catalogs a spectrum of architectural patterns from trivial (Transaction Script) to sophisticated (Domain Model). The key insight is that each pattern has a complexity threshold below which it's overkill and above which the simpler alternatives collapse under their own weight.

**Every new dependency needs a strong case.** Adding a library, framework, CLI tool, marketplace action, or SaaS integration is a design decision with real long-term costs: supply-chain surface, version churn, audit burden, onboarding friction, and a permanent entry in your mental model of the system. Before adding one, check whether the stdlib, existing project dependencies, or a small inline implementation can solve the problem. If a new dependency still seems warranted, make the case explicitly — what problem it solves, why existing options fall short, what it costs — and get approval before adding it. Default answer is "write it inline."
- *Source — The Pragmatic Programmer (Hunt & Thomas) and lessons from the npm/left-pad era:* Every dependency you take on becomes part of your system's surface area. The Pragmatic Programmer's "Good-Enough Software" principle and the broader supply-chain security literature converge on the same point: convenience alone does not justify a new dependency. The cheapest dependency is the one you don't add.

**Design for the current need, not the hypothetical future.** Don't add extension points or abstractions for requirements that don't exist. When those requirements arrive, you'll understand them better than you do now.
- *Source — Extreme Programming (Kent Beck) and The Pragmatic Programmer (Hunt & Thomas):* YAGNI (You Aren't Gonna Need It) is not laziness — it's a recognition that speculative generality is a code smell. Premature abstraction is just as harmful as premature optimization: it adds cost now for a future that usually arrives differently than predicted.

## 3. Writing the Code

Once the problem is understood and the solution designed, the implementation should be almost mechanical. If it feels hard, go back to section 2. The principles here are about staying disciplined while the code takes shape.

**Seek the simplest thing that could work.** Not the most clever, not the most general. The simplest. If two approaches solve the problem and one is a net deletion of code, that one wins. Beck's four rules: passes tests, reveals intent, no duplication, fewest elements.
- *Source — Extreme Programming (Kent Beck):* Beck's four rules of simple design are a priority-ordered checklist. "Passes tests" comes first because correctness is non-negotiable. "Reveals intent" comes next because code is read far more often than written. "No duplication" and "fewest elements" follow as refinements.

**Code is a liability, not an asset.** Every line is a future maintenance burden, a potential bug, a thing someone must understand. The value is in what the code does, not in the code itself. When in doubt, delete.

**Make the change easy, then make the easy change.** If the change is hard, first refactor until it's easy (without changing behavior), then make the small change.
- *Source — Kent Beck:* This deceptively simple maxim captures the entire refactoring workflow. It separates the "restructure" step (which should not change behavior) from the "implement" step (which should be trivial), making each step independently verifiable.

**Refactor on green.** After a test passes, clean up before moving on. Small, continuous refactoring prevents the debt that leads to "we need to stop everything and refactor."
- *Source — Refactoring (Martin Fowler) and Extreme Programming (Beck):* Continuous refactoring treats code health as a running concern rather than a separate project. The "green bar" is the only safe moment to restructure because you have a passing test suite as your safety net.

**Code smells are design heuristics.** Long methods, feature envy, data clumps, primitive obsession, shotgun surgery — these aren't style nitpicks, they're structural problems. Learn to recognize them and apply the corresponding refactoring.
- *Source — Refactoring (Fowler):* Fowler's catalog of code smells is a diagnostic vocabulary. Each smell points to a specific structural deficiency and maps to one or more named refactorings. The value is not in rote memorization but in developing the nose to detect when something is off.

**DRY is about knowledge, not code.** Two identical lines serving different purposes should stay separate. Two different-looking blocks encoding the same rule should be unified. The duplication that matters is knowledge and intent, not syntax.
- *Source — The Pragmatic Programmer (Hunt & Thomas):* The original formulation of DRY is "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system." This is about knowledge, not text. Mechanically de-duplicating code that happens to look the same but represents different decisions creates false coupling.

**Orthogonality: one change, one place.** If a single business rule change requires edits in 5 files, the design lacks orthogonality. This is the real test of good modularity.
- *Source — The Pragmatic Programmer (Hunt & Thomas):* Orthogonality means that changes in one concern do not ripple into unrelated concerns. It is the practical, measurable definition of "good modularity" — count how many files you touch for a single logical change.

**Listen to the tests.** Difficult test setup means too much coupling. Too many mocks means too many dependencies. Fragile tests mean unstable interfaces. Don't silence this signal with mocking frameworks — fix the design.
- *Source — Growing Object-Oriented Software, Guided by Tests (Freeman & Pryce):* GOOS teaches that tests are not just verification tools but design feedback mechanisms. When a test is painful to write, it is telling you something about the production code's structure. Suppressing the pain with mocking frameworks is like treating a broken bone with painkillers — the symptom disappears but the problem worsens.

## 4. Making It Work in Production

Code that works on your machine is a prototype. Code that works in production under real load, real failure modes, and real operational constraints is software. These principles bridge the gap.

**Design for failure — every integration point will eventually fail.** Use circuit breakers to stop cascading failures. Put timeouts on every external call (no timeout = infinite timeout). Use bulkheads to isolate blast radius. Retry with backoff, not tight loops.
- *Source — Release It! (Michael Nygard):* Release It's central argument is that the majority of production outages are caused by integration point failures that cascade through systems lacking protective patterns. Circuit breakers, timeouts, and bulkheads are not optional hardening — they are required for any system that calls another system.

**Cascading failures are the default.** Without explicit protection, one failing dependency takes down everything that calls it, and then everything that calls those callers. Assume failure propagates and design barriers.
- *Source — Release It! (Nygard):* Nygard demonstrates through real incident postmortems that cascading failure is not a worst case — it is the expected behavior of interconnected systems without isolation. The question is not "will this happen?" but "what stops it from happening?"

**Define what "reliable enough" means before building.** SLOs give you an error budget — a rational basis for deciding whether to ship features or fix reliability. Without them, you either over-engineer or under-invest.
- *Source — Site Reliability Engineering (Google):* The SRE book's most impactful contribution is the error budget concept. By defining reliability targets as SLOs and treating the gap between 100% and the target as a spendable budget, teams can make rational trade-offs between velocity and stability instead of arguing from gut feelings.

**Optimize for recovery, not prevention.** You can't prevent all failures. But you can make recovery fast: feature flags, rollback capability, canary releases. Systems that recover in minutes beat systems that try to never fail.
- *Source — Site Reliability Engineering (Google) and Accelerate (Forsgren, Humble, Kim):* Both books converge on MTTR (mean time to recovery) as a more impactful metric than MTBF (mean time between failures). Prevention has diminishing returns; recovery speed has compounding returns because it enables experimentation and faster iteration.

**Eliminate toil.** If you're doing the same operational task repeatedly and it could be automated, automate it. Manual repetitive work doesn't scale, breeds errors, and crowds out engineering.
- *Source — Site Reliability Engineering (Google):* Google's SRE practice defines toil as manual, repetitive, automatable work that scales linearly with service growth. The discipline is to treat toil as a bug — something that should be filed, tracked, and systematically eliminated.

**Deployability is a design constraint.** If your architecture makes deployment scary, it'll be infrequent. Infrequent deploys are bigger. Bigger deploys are riskier. Riskier deploys are scarier. Break the cycle: design for small, frequent, low-risk deployments.
- *Source — Accelerate (Forsgren, Humble, Kim) and Modern Software Engineering (Dave Farley):* Accelerate's research proves statistically that high-performing teams deploy more frequently with lower change failure rates. This is not a coincidence — small batches are inherently less risky and easier to debug. Farley extends this into a first principle: if deployment is painful, do it more often until the pain drives you to make it easy.

## 5. Evaluating Work

Every piece of work — whether your own, a teammate's, or an AI agent's — deserves scrutiny beyond "does it pass the tests?" These principles define what separates a working patch from a good solution.

**Evaluate the approach, not just the correctness.** "Does it work?" is necessary but insufficient. "Is this the right way to solve this?" is the real question. A working patch that adds structural complexity is worse than a working fix that removes it.

**Prefer removing the cause over compensating for the effect.** Compensation layers accumulate; removals simplify. If the fix involves a new utility and 7 call-site changes doing the same conversion, the abstraction is wrong.

**A good change narrows the space of future bugs.** A fix that patches one symptom leaves the class exposed. A fix that eliminates the structural cause prevents the entire class. Ask: "What about the cases I haven't seen yet?"

**Don't fight your tools.** If you're working around a library at every turn, you're using the wrong tool or using the right tool wrong. Investigate before adding another workaround.

**Trace the full blast radius.** If a fix touches height but not width, ask why. Incomplete fixes are time bombs.

**Read skeptically.** Agent-generated analysis, debug notes, and commit messages can contain contradictions. Verify independently. "The tests pass" is not "the approach is right."

**Feedback speed is everything.** The longer the gap between writing code and knowing if it works, the more expensive mistakes become. Fast tests, fast builds, fast deploys, fast monitoring — every speedup compounds.
- *Source — Modern Software Engineering (Farley) and Extreme Programming (Beck):* Both XP and modern continuous delivery treat feedback speed as the single most important property of a development process. Every practice — TDD, CI, trunk-based development, monitoring — exists to shorten the feedback loop.

**Measure what matters.** Deployment frequency, lead time, mean time to recovery, change failure rate. These four metrics distinguish high performers. If your practices don't improve them, question the practices.
- *Source — Accelerate (Forsgren, Humble, Kim):* The DORA metrics are not arbitrary — they emerged from multi-year statistical analysis of thousands of teams. They capture both speed (deployment frequency, lead time) and stability (MTTR, change failure rate), proving that these are not trade-offs but complementary properties of well-engineered systems.

**Blameless postmortems.** When things go wrong, ask "how did our system allow this?" not "who did this?" Blame drives hiding; learning drives improvement.
- *Source — Site Reliability Engineering (Google):* Blameless postmortems are the mechanism that converts incidents into systemic improvements. The insight is that humans are not root causes — systems, processes, and missing safeguards are. Blaming a person closes the investigation prematurely.

## 6. Workflows for Agents

When working with João, apply these judgment principles at every stage of work. This is not a checklist to run at the end — it is a mode of thinking that governs every decision.

1. **Diagnose before prescribing.** When presented with a bug, feature request, or task, spend time understanding the full context before proposing a solution. Read the relevant code. Trace the data flow. Identify the actual constraint or invariant that is being violated. State the root cause explicitly before writing any fix.

2. **Propose the approach, not just the code.** Before implementing, articulate why this approach is right — what structural property it preserves or improves, what alternatives were considered and rejected, what trade-offs are being made. If you can't justify the approach in terms of the principles in this document, reconsider.

3. **Challenge your own premises.** After forming an initial understanding, actively look for evidence that contradicts it. Check if the platform or framework already provides a solution. Check if the problem disappears with a better boundary or a simpler model. The best fix is often the one that makes the problem irrelevant.

4. **Evaluate blast radius.** Before submitting any change, trace all the places affected. If you fixed the height but not the width, say so. If the fix addresses one caller but three others have the same issue, flag it. Incomplete fixes should be explicitly called out, not silently shipped.

5. **Match the weight of the solution to the weight of the problem.** A one-liner bug does not need a new abstraction layer. A systemic design flaw does not deserve a point fix. Calibrate the response to the actual problem scope.

6. **Verify independently.** Do not trust your own analysis uncritically. Run the tests. Check the types. Read the diff. Confirm that what you think you changed is what you actually changed. "I believe this works" is not evidence — `task prepush` passing is.

## 7. Summary Cheat Sheet

- **Am I fixing the symptom or the root cause?** Trace to the structural origin. If the fix is a workaround applied in multiple places, step back.
- **Did I question whether the mechanism itself is right?** The best fix might be removing the thing that created the problem.
- **Do my names match the domain language?** If the code says "record" and the business says "order," something is wrong.
- **Are my dependencies pointing inward?** If domain code imports infrastructure, the arrow is backward.
- **Am I over-architecting or under-architecting?** Match the pattern to the problem's actual complexity.
- **Do I have a strong case for this new dependency?** Every library, tool, or service is a long-term cost. Default to inline; justify before adding.
- **Am I building for a hypothetical future?** Solve today's problem. Tomorrow's problem will be different.
- **Is the simplest solution also the one I chose?** If not, justify the additional complexity.
- **Does this change narrow the space of future bugs?** Or does it just patch one case?
- **Have I traced the full blast radius?** If the fix is partial, say so explicitly.
- **Did I verify independently?** Run the tests, check the types, read the diff. Don't ship on faith.
- **Would I be comfortable if this change was deployed to production right now?** If not, it's not done.
