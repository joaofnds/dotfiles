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
  contested — go straight to /plan; skip when the requirement itself is still open —
  that is /discuss.
argument-hint: "Path to the options/spec doc to grill (optional)"
---

# Grill

Interrogate the decisions required by the spec — or by the named source of record when
there is no spec — and demonstrated current risks until the approach is hardened. Do not
design hypothetical future branches. Route requirement changes back to `/discuss` —
amend the spec first, or write one when the source of record is not a spec.

## Start from the source of record

If handed an options doc, spec, or diagnosis, read it first. An options recommendation
is a lean, not a decision; confirm or overturn it with the user after checking the facts
that decide among viable options. A diagnosis supplies causal facts, not a remedy.

`/grill` is often entered with no spec at all — straight from chat, from a reviewer's
findings, or from a diagnosis. That is a supported entry, not a defect. When it happens,
name the **source of record** in the artifact — the chat goal, the findings, the
diagnosis — and run the scope check against that instead of against a spec that does not
exist.

Before confirming the pick, independently verify every load-bearing claim that chooses
the winner or eliminates a simpler, existing, or platform-native option. Name the probe
and evidence. Cosmetic rejections may remain settled; negative assumptions may not.

## How to run it

The six bullets below that also appear in `/discuss` §Interview discipline — every one
except **Dispatch the facts you can't settle cheaply** — mirror it: edit both or neither,
keeping each side's subject (the approach here, the goal there).

- **Map before asking.** Enumerate every decision the design still needs, and which
  depends on which, before asking the first one. Going deep early tunnels into a branch
  a later answer may prune.
- **One question at a time.** Wait for the answer before asking the next — batching
  produces shallow answers. The user answering several at once is not batching by you;
  follow their lead when they do.
- **Recommend an answer for every question.** Don't just ask — say what you'd choose and
  why, so the user can react to a concrete position instead of starting from blank. The
  recommendation is a proposal — don't build on it as settled until the user confirms.
- **Explore before asking.** If a question can be answered by reading the codebase, do
  that instead of asking the user. (You read to settle facts, not to survey how to build
  it — surveying is `/research`'s job, not yours.)
- **Dispatch the facts you can't settle cheaply.** When a fact needs a wide scan or a
  long probe, spawn for it rather than running it inline on the interview's critical
  path; `~/.agents/rules/subagent_spawning.md` picks the shape and governs what the
  report is worth.
- **Follow dependencies.** Once the decisions are mapped, resolve upstream ones first;
  let each answer narrow the branches you still need to walk.
- **Be direct.** If an answer is inconsistent with an earlier one, or the approach has a
  flaw, say so — don't smooth it over.

## When the interview is done

Every mapped decision is resolved or explicitly deferred, and no unverified negative
assumption still chooses the approach. A decision you cannot state precisely enough to
write into the artifact is not resolved — it is open. If what remains open is a
*requirement* rather than a way to satisfy one, that belongs to `/discuss`, not to
another round here.

## Close-out

Use the source artifact's `YYYY-MM-DD-<slug>` prefix; if none exists, mint one. Persist
`<prefix>-grilled.md` under `.boris/plans/` and tell the user the path. If one exists,
version the prefix while preserving the terminal suffix, for example
`<prefix>-v2-grilled.md`. Never overwrite an existing artifact implicitly.

### Structure

1. **Source** — the source artifacts by path, or the named source of record when none
   exists.
2. **Commit/branch** — where the interrogation was grounded.
3. **Verified load-bearing claims** — each with its probe and its evidence.
4. **Approach** — the approach as hardened, in one paragraph, plus one line per option
   overturned or eliminated (its evidence sits in §3).
5. **Decisions** — every decision the map raised and its resolution.
6. **Risks and deferrals** — including every mapped decision deferred rather than
   resolved.
7. **Invariants** — constraints a future edit must not break.
8. **Scope check** — state that scope and acceptance criteria still match the spec, or
   the named source of record; otherwise return to `/discuss`.
9. **Next step** — normally `/plan`. Name it, and name the artifacts it must read.

Before done, reread the decision evidence yourself — especially simpler rejected options
and unverified negative assumptions. No producer gate here (dropped 2026-08-12 for
cost): the interrogation is the hardening, and `/plan`'s gate checks the written result.
