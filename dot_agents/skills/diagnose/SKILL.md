---
name: diagnose
description: >
  After debugging a problem this session, write a read-only diagnosis report —
  the bug, the engineering/coding rules it broke, five-whys, and root cause —
  saved to a durable file for a later session to turn into a fix plan. Invoke on
  "diagnose this", "root-cause report", "document what went wrong", once the
  investigation has concluded — a root cause confirmed, or this session's leads
  exhausted and the best hypothesis recorded. This is diagnosis only: it states
  what is broken and why, and proposes NO fixes, remedies, or implementation
  suggestions — that is /plan's job, run later off this report. Reach for it
  before /plan when the root cause is established but no fix approach has been
  chosen yet. For an already-settled fix approach, that's /plan; for in-flight
  state with no cause yet, that's /handoff.
metadata:
  trigger: A bug/problem was investigated this session; capture its root cause for a later /plan, no remedy
---

# Diagnose

Write a durable root-cause report on the bug investigated this session, for a
fresh session to act on later (usually via `/plan`). Diagnosis only — describe
the defect and why it exists; don't write code or propose fixes.

**Diagnose, don't prescribe.** Describe the problem and its cause — including
what's absent or what was already tried. Never propose or rate a fix; that's the
next session's job. A precise cause naturally narrows the fix space — that's the
value, not license to choose the fix.

- Allowed: "config loads before `doom env` regenerates `env.el`, so the gpg path is empty."
- Forbidden: "...so lazy-load the config."

**Ground every claim.** Re-check each cited `file:line` against the actual code
before writing it — don't trust session memory; a confident wrong cause misleads
`/plan`. If the root cause wasn't established, say so and give the leading
hypothesis plus what would confirm it. Tag each finding `confirmed` or `hypothesis`.

**Write it cold-readable.** The next session has zero memory of this one — the
file alone must suffice. Inline the evidence; no "as we discussed."

Save it durably where the repo keeps planning docs, as
`YYYY-MM-DD-<slug>-diagnosis.md`. Tell the user the path.

## Structure

1. **Summary** — the defect, its impact, and the commit SHA + branch it was diagnosed against.
2. **Findings** — per bug: symptom and evidence (`file:line`, command output, failing test); the causal chain from symptom to root cause (five-whys); the principle it broke, citing `~/.agents/rules/` when one maps; what was tried and ruled out; confidence.
3. **Open questions** — what's still unknown that `/plan` must resolve.
4. **Next step** — this report feeds `/plan` (or `/grill` first if the remedy space is wide).

## Rules

- Redact secrets and PII.
- Reference existing artifacts (issue, commit, prior plan) by path — don't restate them.
- If the session's own conclusion now looks wrong, say so instead of writing it forward as settled.
