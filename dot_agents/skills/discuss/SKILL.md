---
name: discuss
description: >
  Interview a rough goal into a durable spec/PRD — need, scope, constraints, and what
  "done" means. Invoke at the very start of a feature, while the goal is still vague:
  "spec out X", "discuss adding X", "help me scope X". Spec only: no implementation
  options (/research, run next), no approach pick (/grill), no plan, no code. Skip for
  a small, well-understood goal — go straight to /grill or /plan.
argument-hint: "The rough goal to spec out"
metadata:
  trigger: A rough feature goal exists but no spec; interview to pin down the problem and write a PRD
---

# Discuss

**Wrong skill if:** the goal is small and well-understood → `/grill` or `/plan` directly.

Interview a rough goal until the problem is sharp enough to write down. The output is
a spec/PRD — *what* must be true for this to be done, independent of *how* it's built.
The how comes later (`/research` → `/grill` → `/plan`).

This is the question-heavy phase. A fuzzy problem poisons everything downstream, so
spend your effort here.

## Interview discipline

- **One question at a time.** Wait for the answer before the next — batching produces
  shallow answers.
- **Recommend an answer for every question.** Say what you'd choose and why, so the
  user reacts to a concrete position instead of a blank. The recommendation is a
  proposal — don't build on it as settled until the user confirms.
- **Explore before asking.** If reading the codebase answers a scoping question, read
  it instead of asking. (You read only to ask better questions — surveying *how to
  build it* is `/research`'s job, not yours.)
- **Map the space before diving in.** Do a breadth-first pass across the whole
  problem first — enumerate every open question before going deep on any one (a map for
  yourself; still ask them one at a time). Going deep early tunnels into a branch a
  later answer may prune.
- **Follow dependencies.** Once the space is mapped, resolve upstream questions first;
  let each answer narrow what's left.
- **Be direct.** If an answer contradicts an earlier one, or the goal itself looks
  ill-scoped, say so — don't smooth it over.

## What to pin down

- **Need** — what problem this solves, for whom, and why it matters now.
- **Scope** — what's explicitly in, what's out, what's deferred.
- **Constraints** — technical, product, time; systems it must fit; things it must not
  break.
- **Success** — what "done" looks like, concrete enough to check.

## Output

When the problem is sharp and no blocking question is left open, write a durable spec a
fresh session (or `/research`) can pick up cold. Name it `YYYY-MM-DD-<slug>-spec.md`
(`<slug>` = 2–5 word kebab-case goal). Save it under `.boris/plans/` at the repo root
(create the dir if absent) — the git-ignored home the rest of the chain reads from. Tell
the user the exact path.

The test for whether an open question blocks the spec: is it a *what*-question you can
state precisely now? Sharp what-questions block — resolve them before writing.
How-questions (however sharp) are not blockers; they go downstream. A what-question too
fuzzy to state is still unresolved and remains in `/discuss`, unless an external fact
blocks it and the spec names that fact and who can resolve it.

### Structure

1. **Problem** — the need, the audience, why now, and the single job the feature does.
2. **Scope** — what's in, out, and deferred, as explicit lists.
3. **Constraints** — technical, product, and time constraints; systems it must fit;
   what it must not break.
4. **Acceptance criteria** — what must be true for this to be done, each concrete
   enough to check. Behavior, not implementation.
5. **Open questions** — implementation questions for `/research` or `/grill`, plus any
   externally blocked requirement question with its owner and unblock condition. Do not
   hand downstream an ambiguity that prevents the acceptance criteria from being read.
6. **Next step** — this spec feeds `/research` to survey implementation options (or
   `/grill` directly if the approach is already obvious and there's nothing to survey).

## Before done: red-team the draft

You ran the whole interview — you're the last person who can see the spec's gaps. Run
the producer gate from the `adversarial-review` skill ("As a producer gate") on the
draft. Aim the mandate at: unstated assumptions, scope gaps, a premise never
questioned, acceptance criteria that can't actually be checked, and internal
contradictions.

## Rules

- **Spec, not solution.** Describe what's needed and why — never how to build it. No
  options, no approach, no code.
- **Maintain the project glossary.** When the interview pins down domain terms, add
  them to `.boris/CONTEXT.md` at the repo root (create if absent). Inline any definition
  required to understand an acceptance criterion; the glossary is shared vocabulary,
  not hidden required context.
- Reference existing artifacts (issues, PRDs, prior plans, commits) by path or URL —
  don't restate them.
- Redact secrets and PII.
- Write it cold-readable — the file alone must suffice; no "as we discussed."
