# Workflows

Use-case loops that chain the custom skills under `~/.claude/skills/`. Each loop
funnels into `/plan → /build`; the skills before it feed the plan, the reviews
after it close the loop.

## Feature loop

Adding or changing a feature. Each front-half stage writes a durable doc the next
one consumes. These docs live under `.boris/plans/` at the repo root (reviews under
`.boris/reviews/`) — a personal, git-ignored home (via `core.excludesFile`), so
workflow artifacts never land in a repo's history.

```
(chat) → /discuss → /research → /grill → /plan → /build ⇄ /verify → review → learn
          spec.md    options.md   pick+harden  plan.md   execute  red/green          rules·tests·lint
```

Human judgment is heaviest at the two ends — *what to build* (`/discuss`, `/grill`)
and *did it actually work* (`/verify`, `review`) — and lightest in the mechanical
middle. The arrows also run backward: a broken plan assumption or a review finding
re-enters an earlier stage rather than pushing through.

- **chat** — optional plain conversation to shake out a rough goal. No skill, no
  artifact. Skip straight to `/discuss` when the goal is already stated.
- **/discuss** — interview the goal into a `*-spec.md` (need, scope, constraints,
  success). Question-heavy; no code, no options.
- **/research** — take the spec, explore the codebase, question the premise, survey
  2–3 implementation options with pros/cons → `*-options.md`. Leans, doesn't decide.
- **/grill** — read the options doc, confirm or overturn its lean (this is where the
  approach is *picked*), then interrogate that design until it's hardened.
- **/plan** — write the hardened approach to a self-contained plan file, citing the
  spec/options docs by path; work too big for one build session becomes sequential
  milestone plans, not one monolith.
- **/build** — execute that plan plus every artifact it cites (the acceptance
  criteria live in the spec), in a fresh session if the plan is large. If a plan
  assumption fails against reality, **stop** — record the discrepancy and route back to
  `/grill` (re-pick) or `/plan` (re-sequence). Never improvise past a broken plan; a
  plan the human ratified must not silently drift into something they never saw.
- **/verify** — drive the change end-to-end and watch it behave, turning the spec's
  success criteria into a red/green gate. `/build` isn't done until this is green.
  Prose review is the weakest verifier available; a running check is the strongest.
- **review** — `/adversarial-review` for work done this session (cheap);
  `/panel-review` for a substantial unit pre-merge (all four axes).
- **learn** — before closing, ask what recurs: a fix that could be a regression test, a
  mistake that could be a lint or a rule, friction worth a memory entry. Feed it back so
  loop N+1 is cheaper than loop N (`continuous_improvement.md` §1). A loop that only
  ships features is linear; one that also hardens the system compounds.

Skip points — the front half scales to the feature:

- **Goal already sharp?** Skip `/discuss`.
- **Only one sane way to build it?** Skip `/research` (and often `/grill`).
- **Small, well-understood change?** Skip all of them — edit directly, then review
  the diff. The spec/research/grill apparatus earns its keep on large or vague work.

For UI work, `/frontend-design` runs after `/grill` and before `/plan`: it
carries its own inner loop — brainstorm → plan → critique → build → critique
again — to converge a visual direction, which `/plan` then writes up:

```
/grill → /frontend-design → /plan → /build → /panel-review
```

Decision points:

- **Problem framed?** No → `/discuss`. Yes but approach open → `/research` then `/grill`.
  Approach settled → straight to `/plan`.
- **Same session or handing off?** Handing off after the plan → the plan file is the
  handoff. Pausing mid-work with no settled approach → `/handoff`.
- **Plan assumption broke mid-build?** Don't push through — back to `/grill` (re-pick)
  or `/plan` (re-sequence), then re-enter `/build`.
- **Review depth?** Quick check of this session's work → `/adversarial-review`.
  Substantial unit pre-merge → `/panel-review`, same session or not.

## Debug loop

Investigating a failure.

```
/debug → /diagnose → /plan → /build
```

- **/debug** — live investigation: build a red-capable repro, hold competing
  hypotheses, confirm the root cause by prediction. Finds the cause; lands no fix.
- **/diagnose** — serialize the confirmed cause to a durable `*-diagnosis.md` file.
  Read-only; proposes no fix. Exists to survive the context boundary.
- **/plan** — turn the diagnosis into a fix design.
- **/build** — execute it.

Decision points:

- **Cause known?** No → `/debug`. Yes → `/plan`.
- **Fixing now or later?** Same session, won't hand off → skip `/diagnose`, go
  `/debug → /plan`. Fix happens later or elsewhere → `/diagnose` first, so a cold
  session can act on it.

`/debug` and `/diagnose` both stop short of the fix — that's the shared boundary.

## Review-to-fix loop

A heavy review doesn't just report — it produces a durable fix artifact that
feeds back into the build loop.

```
/panel-review → .boris/reviews/*.md → /plan → /build
```

- **/panel-review** — four specialist reviewers, one adversarial kill step, one
  self-contained report under `.boris/reviews/`. Explicitly hand a large fix to
  `/plan` off that report; small fixes go straight in.
- Same shape as the debug loop: a durable diagnosis artifact drives the fix.

`/adversarial-review` is the lighter in-session variant — findings relayed live,
no durable report — so it loops informally: `review → fix → re-verify`.

## Cross-session continuity loop

When context runs low mid-work and the approach isn't settled yet, preserve
state rather than forcing a premature plan.

```
work in flight → /handoff → [new session] resume → (→ /grill → /plan once settled)
```

- **/handoff** — compacts in-flight, still-undecided state to an ephemeral
  `$TMPDIR/handoff-*.md`; names the next skill to reach for.
- The tell for handoff vs plan: `/handoff` preserves *undecided* state (ephemeral
  scratch file); `/plan` and `/diagnose` serialize *settled* conclusions (durable
  repo files). Undecided → handoff; settled → plan.
