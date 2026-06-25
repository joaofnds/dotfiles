---
name: grill
description: >
  Interview the user relentlessly to stress-test a plan or design before building.
  Use after an approach is on the table but before writing it up — to resolve open
  decisions, surface edge cases, and harden the design. Invoke on "grill me",
  "poke holes in this", "stress-test this plan", or when the user wants the design
  interrogated before a /plan. This runs BEFORE /plan, not after.
metadata:
  trigger: An approach exists but isn't hardened; interrogate it before writing the plan
---

# Grill

Interview the user relentlessly about every aspect of this plan until you reach a shared, hardened understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. The goal is to expose every open decision, edge case, and hidden assumption now — while context is full — so the plan that follows captures a design that's already been interrogated.

## How to run it

- **One question at a time.** Wait for the answer before asking the next. Asking several at once is bewildering and produces shallow answers.
- **Recommend an answer for every question.** Don't just ask — say what you'd choose and why, so the user can react to a concrete position instead of starting from blank.
- **Explore before asking.** If a question can be answered by reading the codebase, do that instead of asking the user.
- **Follow dependencies.** Resolve upstream decisions first; let each answer narrow the branches you still need to walk.
- **Be direct.** If an answer is inconsistent with an earlier one, or the approach has a flaw, say so — don't smooth it over.

## Close-out

When the design is hardened and there are no open branches left, stop interviewing and **summarize the resolved decisions**: each decision made, the edge cases and risks surfaced, and anything explicitly deferred. This summary is the input to `/plan` — write it so it can be pasted or pulled straight into the plan.
