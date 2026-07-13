---
name: discuss
description: >
  Interview a rough goal into a tidy spec/PRD. Ask relentlessly to pin down the need,
  scope, constraints, and what "done" means — this is the phase that asks the most
  questions — then write a durable spec doc. Invoke at the very start of a feature,
  when the goal is still vague: "spec out X", "discuss adding X", "help me scope X",
  "what do we actually need for X". Produces a spec only — it does NOT research
  implementation options or read the codebase for alternatives (that's /research, run
  next off this spec), converge on an approach (/grill), write a plan (/plan), or write
  code. For a small, well-understood goal this is overkill — skip it and go straight to
  /grill or /plan.
argument-hint: "The rough goal to spec out"
metadata:
  trigger: A rough feature goal exists but no spec; interview to pin down the problem and write a PRD
---

# Discuss

Interview a rough goal until the problem is sharp enough to write down. The output is
a spec/PRD — *what* must be true for this to be done, independent of *how* it's built.
The how comes later (`/research` → `/grill` → `/plan`).

This is the question-heavy phase. A fuzzy problem poisons everything downstream, so
spend your effort here.

## Interview discipline

- **One question at a time.** Wait for the answer before the next — batching produces
  shallow answers.
- **Recommend an answer for every question.** Say what you'd choose and why, so the
  user reacts to a concrete position instead of a blank.
- **Explore before asking.** If reading the codebase answers a scoping question, read
  it instead of asking. (You read only to ask better questions — surveying *how to
  build it* is `/research`'s job, not yours.)
- **Follow dependencies.** Resolve upstream questions first; let each answer narrow
  what's left.
- **Be direct.** If an answer contradicts an earlier one, or the goal itself looks
  ill-scoped, say so — don't smooth it over.

## What to pin down

- **Need** — what problem this solves, for whom, and why it matters now.
- **Scope** — what's explicitly in, what's out, what's deferred.
- **Constraints** — technical, product, time; systems it must fit; things it must not
  break.
- **Success** — what "done" looks like, concrete enough to check.

## Output

When the problem is sharp and no scoping questions are open, write a durable spec a
fresh session (or `/research`) can pick up cold. Name it `YYYY-MM-DD-<slug>-spec.md`
(`<slug>` = 2–5 word kebab-case goal). Save it where the repo keeps planning/design
docs; only create a directory if there's no obvious home. Tell the user the exact path.

### Structure

1. **Problem** — the need, the audience, why now, and the single job the feature does.
2. **Scope** — what's in, out, and deferred, as explicit lists.
3. **Constraints** — technical, product, and time constraints; systems it must fit;
   what it must not break.
4. **Acceptance criteria** — what must be true for this to be done, each concrete
   enough to check. Behavior, not implementation.
5. **Open questions** — anything still unresolved that `/research` or `/grill` must
   settle. Don't paper over them as decided.
6. **Next step** — this spec feeds `/research` to survey implementation options (or
   `/grill` directly if the approach is already obvious and there's nothing to survey).

## Rules

- **Spec, not solution.** Describe what's needed and why — never how to build it. No
  options, no approach, no code.
- Reference existing artifacts (issues, PRDs, prior plans, commits) by path or URL —
  don't restate them.
- Redact secrets and PII.
- Write it cold-readable — the file alone must suffice; no "as we discussed."
