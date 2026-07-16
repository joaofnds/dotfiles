---
name: grill
description: >
  Interview the user relentlessly to stress-test a design before building — and,
  handed an options doc from /research, pick the winning approach off its lean, then
  harden it. Use after an approach is on the table (or once /research has surveyed
  options) but before writing it up — to resolve open decisions, surface edge cases,
  and harden the design. Invoke on "grill me", "poke holes in this", "stress-test
  this plan", or when the user wants the design interrogated before a /plan. This runs
  BEFORE /plan, not after. Skip when the design is already hardened and nothing is
  contested — go straight to /plan.
argument-hint: "Path to the options/spec doc to grill (optional)"
metadata:
  trigger: An approach or /research options doc exists but isn't hardened; pick and interrogate it before the plan
---

# Grill

**Wrong skill if:** the design is already hardened and nothing is contested → `/plan`.

Interview the user relentlessly about every aspect of this plan until you reach a shared, hardened understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. The goal is to expose every open decision, edge case, and hidden assumption now — while context is full — so the plan that follows captures a design that's already been interrogated.

## Start from the options doc, if there is one

If you're handed a path — an options doc from `/research`, or a spec — read it first and interrogate *that*. Its recommendation is a lean, not a decision, so your **first move is to confirm or overturn the pick** with the user; picking the winning approach is grill's job, not research's. Treat the doc's per-option rejections as settled unless new evidence surfaces — don't reopen ground research already walked. With no doc handed in, grill the approach on the table in this conversation.

Before you confirm the pick, independently verify the one or two claims the recommendation actually hinges on — the tiebreaker facts, not every rejection. Options docs lean on assertions ("X can't compose with Y", "reuse isn't possible", "the platform can't do this") that may be stale or wrong; read the code and confirm before you ratify. A pick hardened on a false premise is the exact failure this step exists to prevent. Per-option *rejections* stay settled — this targets only the load-bearing claims under the lean itself.

## How to run it

- **One question at a time.** Wait for the answer before asking the next. Asking several at once is bewildering and produces shallow answers.
- **Recommend an answer for every question.** Don't just ask — say what you'd choose and why, so the user can react to a concrete position instead of starting from blank.
- **Explore before asking.** If a question can be answered by reading the codebase, do that instead of asking the user.
- **Follow dependencies.** Resolve upstream decisions first; let each answer narrow the branches you still need to walk.
- **Be direct.** If an answer is inconsistent with an earlier one, or the approach has a flaw, say so — don't smooth it over.

## Close-out

When the design is hardened and there are no open branches left, stop interviewing and **summarize the resolved decisions**, then **persist the summary to a durable doc** — don't leave it only in chat. Reuse the source doc's `YYYY-MM-DD-<slug>` prefix and name it `<prefix>-grilled.md` (mint a fresh `YYYY-MM-DD-<slug>` if you were handed no doc); save it under `.boris/plans/` at the repo root, beside the source, and tell the user the exact path. It's the hand-off `/plan` consumes, and a fresh planning session has none of this conversation's context. Cover: each decision made; where grilling overturned or sharpened the source doc; edge cases and risks surfaced; explicit deferrals; and the invariants that must not break.
