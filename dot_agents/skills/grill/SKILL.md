---
name: grill
description: >
  Interview the user relentlessly to stress-test a design before building — and,
  handed an options doc from /research, pick the winning approach off its lean, then
  harden it. Use after an approach is on the table (or once /research has surveyed
  options) but before writing it up — to resolve open decisions, surface edge cases,
  and harden the design. Invoke on "grill me", "poke holes in this", "stress-test
  this plan", or when the user wants the design interrogated before a /plan. This runs
  BEFORE /plan, not after.
argument-hint: "Path to the options/spec doc to grill (optional)"
metadata:
  trigger: An approach or /research options doc exists but isn't hardened; pick and interrogate it before the plan
---

# Grill

Interview the user relentlessly about every aspect of this plan until you reach a shared, hardened understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. The goal is to expose every open decision, edge case, and hidden assumption now — while context is full — so the plan that follows captures a design that's already been interrogated.

## Start from the options doc, if there is one

If you're handed a path — an options doc from `/research`, or a spec — read it first and interrogate *that*. Its recommendation is a lean, not a decision, so your **first move is to confirm or overturn the pick** with the user; picking the winning approach is grill's job, not research's. Treat the doc's per-option rejections as settled unless new evidence surfaces — don't reopen ground research already walked. With no doc handed in, grill the approach on the table in this conversation.

## How to run it

- **One question at a time.** Wait for the answer before asking the next. Asking several at once is bewildering and produces shallow answers.
- **Recommend an answer for every question.** Don't just ask — say what you'd choose and why, so the user can react to a concrete position instead of starting from blank.
- **Explore before asking.** If a question can be answered by reading the codebase, do that instead of asking the user.
- **Follow dependencies.** Resolve upstream decisions first; let each answer narrow the branches you still need to walk.
- **Be direct.** If an answer is inconsistent with an earlier one, or the approach has a flaw, say so — don't smooth it over.

## Close-out

When the design is hardened and there are no open branches left, stop interviewing and **summarize the resolved decisions**: each decision made, the edge cases and risks surfaced, and anything explicitly deferred. This summary is the input to `/plan` — write it so it can be pasted or pulled straight into the plan.
