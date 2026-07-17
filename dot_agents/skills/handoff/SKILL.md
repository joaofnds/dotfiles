---
name: handoff
description: >
  Compact in-flight work into a briefing a fresh session can pick up cold. Use it for
  live investigation or partially executed plans; use /plan for a settled design that
  has not started.
argument-hint: "What will the next session focus on?"
disable-model-invocation: true
metadata:
  trigger: Work is in flight and needs to continue in a fresh session; preserve state, no formal plan
---

# Handoff

Compact this conversation into a briefing the next session can pick up cold. You are preserving state, not making decisions — capture where things actually are, including what's still undecided. Don't write or modify code now.

If the user passed an argument, treat it as what the next session will focus on and tailor the briefing to it — lead with the state and files that matter for that goal, trim what doesn't.

Name the file `YYYY-MM-DD-<slug>.md` (`<slug>` = 2–5 word kebab-case topic). Save it under `.boris/handoffs/` at the repo root (create the dir if absent) — git-ignored like the rest of `.boris/`. Outside a git repo, fall back to `$TMPDIR/handoff-YYYY-MM-DD-<slug>.md`. Tell the user the exact path.

## What goes in

Write it so the file alone is enough — no "as we discussed" pointers at lost context.

- **What we're doing** — the task and why, in a few sentences.
- **State right now** — what's done, what's in progress, what's untouched. Be honest about half-finished work.
- **Open questions** — decisions not yet made, things still being weighed. Don't paper over them as settled.
- **Key files & findings** — paths and `file:line` for anything load-bearing, plus non-obvious things learned this session (failed approaches, surprising constraints).
- **Next step** — the single most useful thing to do first in the new session.
- **Suggested skills** — if a skill fits the next move (e.g. `/plan` once the approach settles, `/grill` to stress-test it), name it.

For an active debug session, also include the exact reproduction command/input/output,
reported magnitude, hypotheses with evidence, ruled-out causes, retained probes, and the
next discriminating observation. For an active build, cite the plan and record completed
tasks, working-tree state, current verification, and the next unchecked task.

## Rules

- Reference existing artifacts (PRDs, plans, ADRs, issues, commits, diffs) by path or URL — don't restate what already lives in them.
- Redact secrets and PII — no keys, tokens, passwords, or personal data.
- Be direct: if the current direction looks wrong, say so in the briefing instead of handing the problem forward silently.
- Keep it tight. This is a briefing, not a transcript — no code blocks longer than ~10 lines.
