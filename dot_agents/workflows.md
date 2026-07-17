# Workflows

Use-case loops that chain the custom skills under `~/.agents/skills/`. They cover
development from problem framing through production feedback. Release and deployment
commands are project-specific; the verification, review, observation, and learning gates
are not.

## Feature loop

Adding or changing a feature. Each front-half stage writes a durable doc the next
one consumes. These docs live under `.boris/plans/` at the repo root (reviews under
`.boris/reviews/`, handoffs under `.boris/handoffs/`) — a personal, git-ignored home
(via `core.excludesFile`), so workflow artifacts are intended to remain untracked.

```
(chat) → /discuss → /research → /grill → /plan → /build → /verify → review → deploy → release → observe → learn
          spec.md    options.md   pick+harden  plan.md   execute    red/green                                 feedback
```

If `.boris/CONTEXT.md` exists, read it before producing any loop artifact — it holds
the project's domain language (`/discuss` maintains it).

Human judgment is heaviest at the two ends — *what to build* (`/discuss`, `/grill`)
and *did it actually work* (`/verify`, `review`) — and lightest in the mechanical
middle. The arrows also run backward: a broken plan assumption or a review finding
re-enters an earlier stage rather than pushing through.

- **chat** — optional plain conversation to shake out a rough goal. No skill, no
  artifact. Skip straight to `/discuss` when the goal is already stated.
- **/discuss** — interview the goal into a `*-spec.md` (need, scope, constraints,
  success). Question-heavy; no code, no options.
- **/research** — take the spec, explore the codebase, question the premise, survey the
  viable implementation options with pros/cons → `*-options.md`. Often there are two or
  three; say plainly when only one survives evidence. Leans, doesn't decide.
- **/grill** — read the options doc, confirm or overturn its lean (this is where the
  approach is *picked*), then interrogate that design until it's hardened.
- **/plan** — write the hardened approach to a self-contained plan file, citing the
  spec/options docs by path; work too big for one build session becomes sequential
  milestone plans, not one monolith.
- **/build** — execute that plan plus every artifact it cites (the acceptance
  criteria live in the spec), in a fresh session if the plan is large. If a material
  assumption fails, record the discrepancy and route back to `/grill` (re-pick) or
  `/plan` (re-sequence). Minor path or sequencing corrections may continue when they do
  not change scope, behavior, or approach; record them in the plan.
- **/verify** — when available, drive the change end-to-end and watch it behave. Otherwise
  execute the plan's acceptance-criterion checks directly. `/build` is not done until
  every criterion has execution evidence. Prose review is not runtime verification.
- **review** — name its purpose: correctness, architecture, security, or knowledge
  sharing. Review is a feedback channel, not a late quality phase: keep changes small and
  use `/adversarial-review` for this session's work; reserve `/panel-review` for a
  substantial unit. Runtime evidence remains the first line of defense.
- **deploy** — use the project's one documented pipeline, rollback path, and change
  controls. A verified change should be deployable with no hidden testing or sign-off
  work remaining. Never invent or execute a production command without authorization.
- **release** — expose the deployed behavior only when the authorized product decision
  says to. Deployment proves it can run safely; release decides whether users receive it.
- **observe** — confirm the deployed behavior and relevant service signals; a green
  deployment command is not evidence that users received the change.
- **learn** — before closing, ask what recurs: a fix that could be a regression test, a
  mistake that could be a lint or a rule, friction worth a memory entry. Feed it back so
  loop N+1 is cheaper than loop N (`continuous_improvement.md` §1). A loop that only
  ships features is linear; one that also hardens the system compounds.

Skip points — the front half scales to the feature:

- **Goal already sharp?** Skip `/discuss`.
- **Only one sane way to build it?** Skip `/research` (and often `/grill`).
- **Small, well-understood change?** Skip all of them — edit directly, then review
  the diff. The spec/research/grill apparatus earns its keep on large or vague work.

For design-heavy UI work, use `/frontend-design` during design to converge and ratify the
visual direction. `/plan` records that direction and `/build` implements it with the
skill's design guidance active:

```
/grill → /frontend-design → /plan → /build → /verify → /panel-review → learn
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
/debug → [/diagnose for cross-session work] → (/grill when remedy is open) → /plan → /build → /verify → review → learn
```

- **/debug** — live investigation: build a red-capable repro, hold competing
  hypotheses, confirm the root cause by prediction. Finds the cause; lands no fix.
- **/diagnose** — serialize the confirmed cause to a durable `*-diagnosis.md` file.
  Read-only; proposes no fix. Exists to survive the context boundary.
- **/grill** — when more than one remedy remains viable, choose and harden the fix without
  changing the diagnosed facts.
- **/plan** — serialize an already-settled fix design.
- **/build** — execute it.

Decision points:

- **Cause known?** No → `/debug`. Yes, remedy open → `/grill`. Yes, remedy settled → `/plan`.
- **Fixing now or later?** In the same session, skip `/diagnose`: use
  `/debug → /grill → /plan` when the remedy is open, or `/debug → /plan` when it is
  settled. Use `/diagnose` before a cross-session handoff.

`/debug` and `/diagnose` both stop short of the fix — that's the shared boundary.

## Review-to-fix loop

A heavy review doesn't just report — it produces a durable fix artifact that
feeds back into the build loop.

```
/panel-review → .boris/reviews/*.md → fix or /plan → /build → /verify → targeted re-review → learn
```

- **/panel-review** — four specialist reviewers, one adversarial kill step, one
  self-contained report under `.boris/reviews/`. Explicitly hand a large fix to
  `/plan` off that report; small fixes go straight in test-first. Record each finding's
  resolution, rerun verification, and re-review the affected axis before closing.
- Same shape as the debug loop: a durable diagnosis artifact drives the fix.

`/adversarial-review` is the lighter in-session variant — findings relayed live,
no durable report — so it loops informally: `review → fix → re-verify`.

## Cross-session continuity loop

When context runs low mid-work, preserve actual state rather than forcing a premature
plan or pretending an existing plan captures execution progress.

```
work in flight → /handoff → [new session] resume → next applicable stage
```

- **/handoff** — compacts in-flight state to
  `.boris/handoffs/YYYY-MM-DD-<slug>.md`; names the next skill to reach for.
  Resume by opening the new session with that file (`@.boris/handoffs/...`).
- Use `/plan` for a settled design that has not started. Use `/handoff` for any session
  that must preserve live execution or investigation state; cite the existing plan or
  diagnosis and record completed steps, current verification, and the next action.
