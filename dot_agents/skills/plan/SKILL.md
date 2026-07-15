---
name: plan
description: >
  Stop building and write the agreed approach as a self-contained implementation
  plan saved to a file, so a fresh session with zero memory of this conversation
  can execute it (via /build). Invoke when the user says to stop and write a plan,
  or signals the approach is settled and they want to continue in a new session
  ("let's write this up", "start a fresh session", "I'm happy with this"). Do NOT
  invoke mid-debate, while trade-offs are still open, or when the user is still
  asking "what do you think about X" — that's exploration. For dumping in-flight
  context with no settled approach, that's /handoff, not /plan.
metadata:
  trigger: Goal/scope/approach settled this session; need a cold-readable plan file before context runs out
---

# Plan

Stop building. Write an implementation plan as a self-contained document — assume a fresh session with zero memory of this conversation will execute it (via `/build`). Don't write or modify any code now.

The goal, scope, and chosen approach are already settled in this conversation. Pull those from the discussion — don't ask the user to restate them. If a `/discuss` spec, `/research` options doc, or `/grill` hardened-design doc (`*-grilled.md`) exists, cite it by path and don't restate what it already holds (Goal, Scope, rejected options, the resolved decisions) — capture only the plan. The grill doc is where the approach was converged and hardened: read it before writing the Approach and Edge cases sections, since a fresh session holds none of that interrogation.

**Before writing:** read or grep the files the conversation referenced to confirm they exist and that the described state still matches. If a path or `file:line` from the discussion is stale or wrong, correct it in the plan — never copy a bad citation forward.

Name the file `YYYY-MM-DD-<slug>.md` (`<slug>` is a 2–5 word kebab-case goal, e.g. `2026-06-23-add-oauth-login.md`). Save it under `.boris/plans/` at the repo root (create the dir if absent) — the git-ignored home `/build` reads from. Tell the user the exact path.

**Slice big work into milestone plans.** If the tracker won't fit one build session — a rough tell: more than about a dozen vertical tasks, or several independently shippable surfaces — write two or three sequential milestone plans off the same grilled doc instead of one monolith: `YYYY-MM-DD-<slug>-1-<milestone>.md`, `-2-…`. Each milestone is independently buildable, verifiable, and reviewable, and states what the previous one delivered as its starting state. Slice by shippable behavior, never by layer. Sizing is the goal, not parallelism — milestones run in order.

## Structure

Structure it strictly as follows, readable cold:

1. **Goal** — what we're building and why, in a few sentences. If a spec doc exists, cite it and don't restate it.
2. **Scope boundary** — what's explicitly in, and what's out/deferred. Cite the spec instead of restating if one exists.
3. **Approach & rationale** — the option we picked and why it's not just workable but correct (trade-offs owned, not avoided). One-line note on each rejected alternative so the fresh session doesn't reopen settled debates — or cite the `/research` options doc if one already records them.
4. **Current state** — every file the work will touch or depend on, with paths, and how they fit together. If we're fixing a defect, include the root cause (or cite the `/diagnose` report if one exists, instead of restating it). Cite `file:line` for anything load-bearing so the next session doesn't re-investigate. If unsure whether a file is in scope, include it — omitting a relevant one forces re-investigation.
5. **Contracts** — schema/API/type/interface changes, with before/after.
6. **Edge cases & risks** — what could go wrong, side effects on other parts of the system, rollback/migration concerns.
7. **Testing strategy** — the exact command to run the tests (e.g. `pnpm test --run`, `go test ./...`), what to verify manually if tests aren't enough, and which existing tests are likely to break and why. When a spec exists, map every acceptance criterion to a runnable check or a named manual verification — an unmapped criterion is a plan gap, not a detail for `/build` to discover.
8. **Gotchas** — non-obvious things we learned this session that aren't visible in the code (failed approaches, surprising constraints, why something is the way it is).
9. **Task tracker** — a granular `- [ ]` checklist in execution order. Slice vertically: each task is one observable behavior cut through every layer it needs, never a layer or component ("GET /orders/:id returns the stored order" is one task; "add repository" / "add service" / "add endpoint" is that same behavior wrongly split into three — a layer alone has no behavior to verify). `/build` executes each task as an outside-in red→green loop, so each item names the first failing test that starts it (driver-level where a harness exists; `/build` triangulates the rest), the files it touches, and the observable behavior that confirms it done. For work with no runtime-observable behavior (config, tooling, docs), name the verifiable outcome instead. Small enough to do and verify independently.
10. **For the executing session** — instructions to the agent that picks this up cold (write this section into the plan):
    > If reality diverges from this plan — a file is missing, a cited line doesn't match, a dependency behaves differently than described — stop and surface it rather than silently adapting. Note it on the relevant task-tracker item (e.g. "BLOCKED: `src/foo.ts:42` no longer matches — actual state is X") and ask before proceeding. Silent deviation defeats the purpose of this document.

## Before done: red-team the plan

The plan is the last artifact a human ratifies and the first thing a cold session obeys — an error here gets executed verbatim. Run the producer gate from the `adversarial-review` skill ("As a producer gate") on the plan. Aim the mandate at executability: every spec acceptance criterion maps to a task and a check; each `file:line` citation holds against the actual code; no tracker item exceeds the Scope boundary; a session with zero context can execute each task without inventing a design decision. A finding that breaks the approach itself goes back to `/grill` — don't patch the plan around a broken design.

## Rules

- Write it so the file alone is enough — no "as we discussed" references that point at lost context.
- Don't restate what already lives in another artifact (PRD, ADR, issue, existing plan, commit, diff) — reference it by path or URL instead, and only capture what's new.
- Redact secrets and PII — no API keys, passwords, tokens, or personal data in the file.
- Be direct; if anything we agreed on now looks wrong, flag it instead of planning around it.
- No code blocks longer than ~10 lines; use a signature or prose for anything bigger.
