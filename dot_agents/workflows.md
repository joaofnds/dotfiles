# Workflows

**Audience: you, not the agent.** This is a map of the development loop and why each stage
sits where it does. It carries no agent obligations — every rule an agent is bound by lives
in `~/.agents/AGENTS.md`, a skill under `~/.agents/skills/`, or a rule under
`~/.agents/rules/`. Where this file
states something as a rule, it is describing one that lives there.

Use-case loops that chain the custom skills under `~/.agents/skills/`. They cover
development from problem framing through production feedback. Release and deployment
commands are project-specific; the verification, review, observation, and learning gates
are not.

## Feature loop

Adding or changing a feature. Each front-half stage writes a durable doc the next
one consumes. These docs live under `.boris/plans/` at the repo root (reviews under
`.boris/reviews/`, handoffs under `.boris/handoffs/`, ratified visual directions under
`.boris/design/`, away logs under `.boris/away/`) — a personal, git-ignored home
(via `core.excludesFile`), so workflow artifacts are intended to remain untracked.

```
(chat) → /discuss → /research → /grill → /plan → /build → verify → review → deploy → release → observe → learn
          spec.md    options.md   pick+harden  plan.md   execute   red/green                                 feedback
```

The domain glossary at `.boris/CONTEXT.md` gates every loop artifact; `~/.agents/AGENTS.md`
§Task lifecycle owns that rule, `/discuss` maintains the file.

Human judgment is heaviest at the two ends — *what to build* (`/discuss`, `/grill`)
and *did it actually work* (`verify`, `review`) — and lightest in the mechanical
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
  milestone plans, not one monolith; a chain also gets a `-status.md` roll-up that `/build`
  keeps current.
- **/build** — execute that plan plus every artifact it cites (the acceptance
  criteria live in the spec), in a fresh session if the plan is large. If a material
  assumption fails, record the discrepancy and route back to `/grill` (re-pick) or
  `/plan` (re-sequence) — `build/SKILL.md` step 2. Minor path or sequencing corrections
  may continue when they do not change scope, behavior, or approach; record them in the plan.
- **verify** — get evidence for every acceptance criterion in the plan: raw output for the
  checks you can run, the user's own report for the ones only they can run. `/build` is not
  done until every criterion has one or the other; prose review is not runtime verification. Use `/verify-this` for a criterion the plan mapped to a runnable
  check — it turns the claim into a falsifiable baseline/treatment verdict. For a criterion
  that needs the deployed app, stop and ask the user to exercise that flow against the spec
  and report what they observed (`~/.agents/skills/build/SKILL.md` step 7). A `/verify-this`
  verdict does not stand in for that observation.
- **review** — name its purpose: correctness, architecture, security, or knowledge
  sharing. Review is a feedback channel, not a late quality phase: keep changes small and
  use `/adversarial-review` for this session's work; reserve `/panel-review` for a
  substantial unit. Runtime evidence remains the first line of defense. The narrower
  built-ins (`/code-review`, `/review`, `/security-review`) are governed by
  `skillOverrides` in settings and are frequently user-invoked only: a skill absent from
  your available-skills context cannot be called. Check there before routing to one, and
  when it isn't listed, recommend it to the user and say why rather than stalling on it.
  A reviewer's severity is not a disposition: relaying its findings to the user means giving
  each one a disposition (`~/.agents/rules/reporting_findings.md`).
- **deploy** — use the project's one documented pipeline, rollback path, and change
  controls. A verified change should be deployable with no hidden testing or sign-off
  work remaining. Never invent or execute a production command without authorization
  (`~/.agents/AGENTS.md` §Autonomy).
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

For design-heavy UI work, `/art-direction` converges and ratifies the visual direction
during design, and writes it to `.boris/design/<prefix>-design.md`. It is governed by
`skillOverrides` and is currently user-invoked only: check your available-skills context
before routing to it, and when it isn't listed, recommend it to the user and say why rather
than stalling. If the user declines, build on `coding_style_frontend.md`'s convention floor
and record in the plan that no visual direction was ratified. `/plan` cites that design file
and `/build` implements from it:

```
/grill → /art-direction → /plan → /build → verify → /panel-review → learn
```

The chain skills (`/discuss`, `/research`, `/grill`, `/plan`, `/build`) and `/absorb`,
`/dream`, `/kaizen`, `/handoff`, `/stepping-away` are user-invoked only: an agent
recommends the stage by name and the user runs it.

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
/debug → [/diagnose for cross-session work] → (/grill when remedy is open) → /plan → /build → verify → review → learn
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
/panel-review → .boris/reviews/*.md → fix or /plan → /build → verify → re-review or proceed → learn
```

- **/panel-review** — five verdict axes plus a refactoring track (six reviewers), one
  adversarial kill step, one self-contained report under `.boris/reviews/`. Explicitly
  hand a large fix to `/plan` off that report; small fixes go straight in test-first.
  Record each finding's resolution, rerun verification, then decide: re-review the
  affected axis or proceed. The report's advisory structural items are a separate
  follow-up, not a merge condition.
- Same shape as the debug loop: a durable diagnosis artifact drives the fix.

`/adversarial-review` is the lighter in-session variant — findings relayed live,
no durable report. As a producer gate it runs one round, then reruns once only if a fix
changed a behavioral claim or a Blocker's repair can't be probed
(`adversarial-review` §As a producer gate).

## Cross-session continuity loop

When the session must survive a boundary — context running low, or the user stepping
away — preserve actual state rather than forcing a premature plan or pretending an
existing plan captures execution progress.

```
work in flight → /handoff → [new session] resume → next applicable stage
```

- **/handoff** — compacts in-flight state to
  `.boris/handoffs/YYYY-MM-DD-<slug>.md`; names the next skill to reach for.
  Resume by opening the new session with that file (`@.boris/handoffs/...`).
- Use `/plan` for a settled design that has not started. Use `/handoff` for any session
  that must preserve live execution or investigation state; cite the existing plan or
  diagnosis and record completed steps, current verification, and the next action.
- **/stepping-away** — the inverse case: the user leaves but this session keeps
  working. The agent continues autonomously, substitutes `/adversarial-review` for
  "is this right?" questions, queues the actions standing rules keep as asks
  (commits, deploys), and keeps an
  append-as-it-goes decision log in `.boris/away/`; it stops only when done or when
  everything left needs the user. `/handoff` moves work to a fresh session instead.

## Spawn shapes

Several stages above fan work out to subagents. The mechanics of that — the two shapes, continuing a completed agent, why a
subagent spawn never carries a `name`, and what to do with a truncated report — are agent
mechanics rather than workflow, and they live in `~/.agents/rules/subagent_spawning.md`.
