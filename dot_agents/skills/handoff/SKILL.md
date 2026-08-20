---
name: handoff
description: >
  Flush in-flight work onto its card and print a resume blurb a fresh session can
  pick up cold. Writes no file: the card and its attached docs are the handoff.
  Skip when the user is leaving but this session keeps working → /stepping-away.
argument-hint: "What will the next session focus on?"
disable-model-invocation: true
---

# Handoff

Move everything the next session needs out of this conversation and onto the card. You
are preserving state, not making decisions: capture where things actually are,
including what's still undecided. Don't write or modify code now, and write no handoff
file.

Given no card, create one in the column matching the work's stage.

If the user passed an argument, treat it as what the next session will focus on: flush
the state that matters for that goal first, trim what doesn't.

## What to flush

Everything a fresh session needs that lives only in this conversation goes onto the
card as notes (several when one won't hold it), never a new file:

- **What we're doing**: the task and why, onto the card description if it isn't
  already there.
- **State right now**: what's done, in progress, untouched. Be honest about
  half-finished work. Check an acceptance criterion only where its evidence exists.
- **Open questions**: decisions not yet made, things still being weighed. Don't paper
  over them as settled.
- **Key files & findings**: paths and `file:line` for anything load-bearing, plus
  non-obvious things learned this session (failed approaches, surprising constraints).

For an active debug session, also flush the exact reproduction command/input/output,
reported magnitude, hypotheses with evidence, ruled-out causes, retained probes, and
the next discriminating observation. For an active build, the plan doc is already
attached: flush completed tasks, working-tree state, current verification, and the
next unchecked task.

## The blurb

End with one paragraph the user can paste into a fresh session: the card ID, "read
the card and its attached docs", and one next-action hint (name a skill when one fits
the next move):

    continue TASK-N: read the card and its attached docs; next: <the single most useful first move>

Outside a git repo, where no board is possible, put the flush content in the reply
itself, above the closing next-action line; still no file.

## Rules

- Reference existing artifacts (PRDs, plans, ADRs, issues, commits, diffs) by path or
  URL; don't restate what already lives in them.
- Redact secrets and PII: no keys, tokens, passwords, or personal data.
- Be direct: if the current direction looks wrong, say so in a card note instead of
  handing the problem forward silently.
- Keep it tight: notes, not a transcript; no code blocks longer than ~10 lines.
