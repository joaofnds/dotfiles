# Coupling

A vocabulary for naming coupling and deciding which of it to accept. Loaded by the
`panel-review` Architecture mandate; read directly when a design draws or moves a module
or service boundary. Retirement trigger: if ten panel runs or design-phase loads pass
without this file producing a coupling finding, delete it and fold the stability test
into `engineering_judgment.md`.

**Where these cures conflict with `coding_style.md`, `coding_style.md` wins.** This file
names the trade; it does not authorize a new default.

The goal is never zero coupling: parts with no connections are not a system. The goal
is deliberate coupling: choose what to accept, then manage the rest. Naming the type is
what makes that choice available; each type has a different cure.

## Nygard's five types

1. **Operational**: the consumer can't run without the provider. Cue: startup or
   request paths that hard-fail when a dependency is absent, synchronous calls with no
   degraded mode. The enemy of graceful degradation.
2. **Developmental**: the two must change together. Cue: shared code between
   independently released units, lockstep version bumps. Often still worth it: the
   cost is that the coupling must then be managed.
3. **Semantic**: they share a *concept* and must agree on its meaning with no code
   dependency linking them. Cue: the same domain notion modeled twice with nothing that
   would break if one drifts. The least-covered type: no type checker, compiler, or
   grep finds it.
4. **Functional**: different parts answer the same question in different ways. Cue:
   two implementations of one rule, which then drift.
5. **Incidental**: they change together for no reason at all. Cue: a module reaching
   across the system for a value it has no business knowing. Pure cost, no benefit.

Any real design exhibits several at once. Name all that apply.

Ordering and concurrency assumptions are not in this taxonomy. Name them **temporal
coupling**, in either form: ordering ("do this, then always that") or concurrency ("can
two callers do this at once and stay safe").

## Necessary or unnecessary: the stability test

**Strong coupling is fine when the target is stable.** Depending heavily on SQL is
reasonable; depending as heavily on this week's version of your own schema is a
different risk at the same coupling strength. The judgment is a claim about the
dependency's *rate of change*, not the coupling's shape, so never assert it from the
code alone: cite an observed change history
(`git log --since='1 year ago' --oneline -- <path>`) or state the stability assumption
as an assumption. It governs the five spatial types; temporal coupling is judged on
whether the assumption can be violated.

Golden rule: **tighten what's stable, loosen what's uncertain.** The coupling that
actually hurts is the unstable, unintended, or invisible kind.

## Symptoms: coupling made visible

- **Complex test setup.** The best detector there is: paragraphs of scaffolding before
  one behavior can be exercised. Fix the design; do not share the setup between tests.
- **Tests that break on an internal rename.** Coupled to implementation detail instead
  of asserting behavior.
- **Slow builds and circular dependencies.** Build time is a physical measure of
  coupling.
- **Lockstep releases.** Shared code forcing every dependent to take a version it
  didn't ask for.
- **Long parameter lists.** A function with eight parameters knows too much.

## Cures

Coarser than a refactoring catalog; they change shape, not just structure.

- **Hide information behind APIs.** A public interface is what gives you room to change
  the insides.
- **Guard the boundaries.** Translate and validate other people's data at module and
  service edges.
- **Announce, don't command.** Publish that something happened and let listeners
  react, trading operational and developmental coupling for semantic coupling in the
  message schema. Not a free win: direct orchestration is the house default, so name
  this cure only where the requirement (async delivery, independent ownership) already
  justifies it.
- **Make the order or the interleaving explicit.** The cure for temporal coupling:
  encode a required ordering in the type or the API, and make concurrent entry safe
  rather than safe by convention. Ask first whether the write target must be shared: two
  targets with one writer each is not shared state; one target that several writers
  update, even in different fields, is. Where the shared target is inherent to the
  domain, make entry safe at one owner, a single writer, a lock, or an idempotent
  operation; an idempotent operation also covers repeated entry by a single writer.
- **Parsimonious in what you consume, generous in what you produce.** Every field you
  read from another system is a coupling you accepted. Take only what you need; when
  you publish, tell the whole story.

Design is only one of the two tools; the other is speed of feedback. Strong coupling
plus slow feedback is the one combination that never works.

## Before reporting this as a finding (panel-review)

During design, only the stability question above applies. Reporting into a review,
naming a type is not automatically a finding:

- **Does it reduce to a catalog smell?** Developmental coupling is usually Shotgun
  Surgery or Divergent Change; functional is usually Duplicated Code; incidental is
  often Insider Trading, Message Chains, or Feature Envy; temporal reduces to none:
  report it directly. Use these names to decide what to withhold, never to report:
  name the coupling type, keep the boundary claim. If the refactoring track names the
  same sites, its mechanics become the Fix and yours is dropped in arbitration.
- **Semantic coupling is yours.** No other lens covers it.
- **Is the target stable?** If so, the coupling is a design choice, not a defect; say
  so and move on.
