# Coupling

A vocabulary for naming coupling and deciding which of it to accept. Loaded by
the `panel-review` Architecture mandate; read directly when a design draws or
moves a module or service boundary. *(See: coupling, release-it-nygard-2018)*

Added 2026-07-25 from Farley's coupling talk and Nygard's five-type taxonomy.
Re-evaluate after ~10 panel runs: if the Architecture axis has produced no
coupling finding, delete this file and fold the stability test into
`engineering_judgment.md` §2.

**Where these cures conflict with `coding_style.md`, `coding_style.md` wins.**
This file names the trade; it does not authorize a new default.

The goal is never zero coupling — parts with no connections are not a system.
The goal is deliberate coupling: choose what to accept, then manage the rest.
You don't eliminate coupling, you move it somewhere you can manage it. Naming
the type is what makes that choice available; each type has a different cure,
and you can't treat what you can't name.

## Nygard's five types

1. **Operational** — the consumer can't run without the provider. Cue: startup
   or request paths that hard-fail when a dependency is absent, synchronous
   calls with no degraded mode. The enemy of graceful degradation — one flaky
   shared provider takes everything with it. *(Propagation barriers:
   `engineering_judgment.md` §4.)*
2. **Developmental** — the two must change together; a modification in one
   forces a coordinated modification in the other. Cue: shared code between
   independently released units, lockstep version bumps. This is what shared
   code buys you, and shared code is often still worth it — the cost is that
   the coupling must then be managed.
3. **Semantic** — they share a *concept* — what a customer is, what an order
   contains — and must agree on its meaning with no code dependency linking
   them. Cue: the same domain notion modeled twice, in two places, with nothing
   that would break if one drifts. Nothing in the tooling warns you. **The
   least-covered type: no type checker, compiler, or grep finds it.**
4. **Functional** — different parts answer the same question in different ways.
   Cue: two implementations of one rule (two `calculateDiscount`, two notions of
   a valid email), which then drift.
5. **Incidental** — they change together for no reason at all. Cue: a module
   reaching across the system for a value it has no business knowing; two things
   that share a fate only because they share a host. Pure cost, no benefit.

Any real design exhibits several at once. Name all that apply rather than
forcing one label.

## Necessary or unnecessary — the stability test

**Strong coupling is fine when the target is stable.** Depending heavily on SQL
is reasonable; SQL barely changes year to year. Depending just as heavily on
this week's version of your own schema is a different risk entirely — same
coupling strength, and the difference is not in the code.

So the necessary/unnecessary judgment is a claim about the *dependency's rate of
change*, not about the coupling's shape. Never assert it from the code alone:
either cite an observed change history — the orchestrator owns that probe, see
`panel-review` §4 — or state the stability assumption *as* an assumption.

Golden rule: **tighten what's stable, loosen what's uncertain.** Couple tightly
to things you understand and that change slowly; couple loosely to what you're
still figuring out.

The coupling that actually hurts is the unstable, unintended, or invisible kind.

## Symptoms — coupling made visible

- **Complex test setup.** The best detector there is: paragraphs of scaffolding
  before one behavior can be exercised means the unit depends on too much. Fix
  the design; do not share the setup between tests. *(`engineering_judgment.md`
  §3, "Listen to the tests.")*
- **Tests that break on an internal rename.** Coupled to implementation detail
  instead of asserting behavior. *(`testing/03-test-aesthetics.md`.)*
- **Slow builds and circular dependencies.** Build time is a physical measure of
  coupling.
- **Lockstep releases.** Shared code forcing every dependent to take a version
  it didn't ask for.
- **Long parameter lists.** A function with eight parameters knows too much.
  (The smell and its remedy belong to the refactoring catalog — see below.)

## Cures

Coarser than a refactoring catalog; they change shape, not just structure.

- **Hide information behind APIs.** A public interface is what gives you room to
  change the insides. Services should keep secrets.
- **Guard the boundaries.** Treat module and service edges as special: translate
  and validate other people's data there. *(`coding_style.md` §2c, §2e.)*
- **Announce, don't command.** Publish that something happened and let listeners
  react, rather than calling a component to tell it what to do — trading
  operational and developmental coupling for semantic coupling in the message
  schema. Not a free win, and `coding_style.md` §3 makes direct orchestration
  the default: name event-driven integration as a cure only where the
  requirement (async delivery, independent ownership) already justifies it.
- **Parsimonious in what you consume, generous in what you produce.** Every
  field you read from another system is a coupling you accepted. Take only what
  you need; when you publish, tell the whole story. Adding a field to a message
  is easy; removing one is breaking.

Design is only one of the two tools; the other is **speed of feedback**. Strong
coupling plus slow feedback is the one combination that never works — teams
drift into it by deploying pieces independently that still share state, schemas,
and concepts. *(See: continuous-integration.)*

## Resolutions below the module boundary

The same axis at a finer grain. A loosely coupled service diagram doesn't help
if the objects inside ask each other questions instead of telling each other
what to do — Tell, Don't Ask and the Law of Demeter, `coding_style.md` §3.
*(See: law-of-demeter, simplicity-vs-ease.)*

Ordering and concurrency assumptions are not in Nygard's spatial taxonomy: name
them **temporal coupling** when the assumption is "do this, then always that."
*(See: temporal-coupling.)*

## Boundaries with other reviewers

Naming a type is not automatically a finding. Before reporting:

- **Does it reduce to a catalog smell?** Developmental coupling is usually
  Shotgun Surgery or Divergent Change; functional coupling is usually Duplicated
  Code; incidental is often Insider Trading, Message Chains, or Feature Envy.
  Use these names to decide what to withhold, not to report — never put a
  catalog smell name in your finding; name the coupling type. Keep the boundary
  claim: which types, and why this one is or isn't worth accepting. If the
  refactoring track names the same sites, its mechanics become the Fix and yours
  is dropped in arbitration; if it doesn't, state the coarse cure from §Cures
  and say the site-level mechanics are unenumerated.
- **Semantic coupling is yours.** No other lens covers it.
- **Is the target stable?** If yes, the coupling is a design choice, not a
  defect. Say so and move on rather than reporting it.
