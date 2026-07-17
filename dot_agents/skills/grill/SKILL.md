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

Interrogate the decisions required by the spec and demonstrated current risks until the
approach is hardened. Do not design hypothetical future branches. `/grill` chooses how
to satisfy the spec; it does not change scope or acceptance criteria. Route requirement
changes back to `/discuss` and amend the spec first.

## Start from the options doc, if there is one

If handed an options doc, spec, or diagnosis, read it first. An options recommendation
is a lean, not a decision; confirm or overturn it with the user after checking the facts
that decide among viable options. A diagnosis supplies causal facts, not a remedy.

Before confirming the pick, independently verify every load-bearing claim that chooses
the winner or eliminates a simpler, existing, or platform-native option. Name the probe
and evidence. Cosmetic rejections may remain settled; negative assumptions may not.

## How to run it

- **One question at a time.** Wait for the answer before asking the next. Asking several at once is bewildering and produces shallow answers.
- **Recommend an answer for every question.** Don't just ask — say what you'd choose and why, so the user can react to a concrete position instead of starting from blank.
- **Explore before asking.** If a question can be answered by reading the codebase, do that instead of asking the user.
- **Follow dependencies.** Resolve upstream decisions first; let each answer narrow the branches you still need to walk.
- **Be direct.** If an answer is inconsistent with an earlier one, or the approach has a flaw, say so — don't smooth it over.

## Close-out

When the required decisions are hardened, use the source artifact's
`YYYY-MM-DD-<slug>` prefix; if none exists, mint one. Persist `<prefix>-grilled.md` under
`.boris/plans/` and tell the user the path. If one exists, version the prefix while
preserving the terminal suffix, for example `<prefix>-v2-grilled.md`. Cite the source artifacts, commit/branch,
verified load-bearing claims with evidence, each decision, risks, deferrals, and
invariants. State that scope and acceptance criteria still match the spec; otherwise
return to `/discuss`. Never overwrite an existing artifact implicitly.

Before done, run the producer gate from `adversarial-review` against the decision
evidence, especially simpler rejected options and unverified negative assumptions.
