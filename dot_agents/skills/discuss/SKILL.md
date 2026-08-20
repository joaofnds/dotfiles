---
name: discuss
disable-model-invocation: true
description: >
  Interview a rough goal into a durable spec/PRD: need, scope, constraints, and what
  "done" means. Invoke at the very start of a feature, while the goal is still vague:
  "spec out X", "discuss adding X", "help me scope X". Spec only: no implementation
  options (/research, run next), no approach pick (/grill), no plan, no code. Skip for
  a small, well-understood goal: go straight to /grill or /plan.
argument-hint: "The rough goal to spec out"
---

# Discuss

The how comes later (`/research` → `/grill` → `/plan`).

## The card

The stage column is Spec, and this stage usually creates the card. Acceptance criteria live on the
card: write each one with `--ac`, concrete enough to check: behavior, not
implementation.

## Interview discipline

Every bullet in this section mirrors `/grill` §How to run it, which adds one more
(**Dispatch the facts you can't settle cheaply**): edit both or neither, keeping each
side's subject (the goal here, the approach there).

- **One question at a time.** Wait for the answer before the next: batching produces
  shallow answers. The user answering several at once is not batching by you; follow
  their lead when they do.
- **Recommend an answer for every question.** Say what you'd choose and why, so the
  user reacts to a concrete position instead of a blank. The recommendation is a
  proposal; don't build on it as settled until the user confirms.
- **Explore before asking.** If reading the codebase answers a scoping question, read
  it instead of asking. (You read to settle facts, not to survey how to build it;
  surveying is `/research`'s job, not yours.)
- **Map before asking.** Do a breadth-first pass across the whole problem first:
  enumerate every open question and which depends on which, before asking the first
  one (a map for yourself; still ask them one at a time). Going deep early tunnels
  into a branch a later answer may prune.
- **Follow dependencies.** Once the space is mapped, resolve upstream questions first;
  let each answer narrow what's left.
- **Be direct.** If an answer contradicts an earlier one, or the goal itself looks
  ill-scoped, say so; don't smooth it over.

## Output

When the problem is sharp and no blocking question is left open, write a durable spec a
fresh session (or `/research`) can pick up cold: a doc in `backlog/docs/` titled
"<feature> spec", attached to the card with `--doc`.

The test for whether an open question blocks the spec: is it a *what*-question you can
state precisely now? Sharp what-questions block; resolve them before writing.
How-questions (however sharp) are not blockers; they go downstream. A what-question too
fuzzy to state is still unresolved and remains in `/discuss`, unless an external fact
blocks it and the spec names that fact and who can resolve it.

### Structure

1. **Problem**: the need, the audience, why now, and the single job the feature does.
2. **Scope**: what's in, out, and deferred, as explicit lists.
3. **Constraints**: technical, product, and time constraints; systems it must fit;
   what it must not break.
4. **Acceptance criteria**: on the card (§The card), not in the doc; the doc keeps
   the narrative and no criteria checklist.
5. **Open questions**: implementation questions for `/research` or `/grill`, plus any
   externally blocked requirement question with its owner and unblock condition. Do not
   hand downstream an ambiguity that prevents the acceptance criteria from being read.
6. **Next step**: this spec feeds `/research` to survey implementation options (or
   `/grill` directly if the approach is already obvious and there's nothing to survey).

## Before done: red-team the draft

You ran the whole interview; you're the last person who can see the spec's gaps. Reread
the draft yourself for: unstated assumptions, scope gaps, a premise never questioned,
acceptance criteria that can't actually be checked, and internal contradictions. No
producer gate here: `/grill` interrogates this content
next when it runs; if the chain skips straight to `/plan`, say out loud that the spec
had no independent check.

## Rules

- **Spec, not solution.** Describe what's needed and why: never how to build it. No
  options, no approach, no code.
- **Maintain the project glossary.** When the interview pins down domain terms, add
  them to `.boris/CONTEXT.md` at the repo root (create if absent). Inline any definition
  required to understand an acceptance criterion; the glossary is shared vocabulary,
  not hidden required context.
- Reference existing artifacts (issues, PRDs, prior plans, commits) by path or URL;
  don't restate them.
- Redact secrets and PII.
- Write it cold-readable: the file alone must suffice; no "as we discussed."
