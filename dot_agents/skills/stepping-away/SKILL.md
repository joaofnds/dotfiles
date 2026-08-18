---
name: stepping-away
disable-model-invocation: true
description: >
  The user is leaving the keyboard: continue the work already in flight
  autonomously until it is done or blocked on something only they can provide,
  replacing mid-task questions with adversarial review and a decision log.
  Invoke on "stepping away", "going AFK", "keep going while I'm out",
  "continue autonomously". Takes optional priorities, limits, or extra
  authorization as argument. Skip for moving this work to a fresh session
  → /handoff; skip when nothing is in flight — this skill continues named
  work, it never invents work.
argument-hint: "Priorities, limits, or extra permissions while away"
---

# Stepping Away

**Wrong skill if:** the goal is to package state for a fresh session → `/handoff`. If no work is in flight, say so and stop — do not invent work to fill the absence.

The user is away and cannot answer until they return. Continue the work already named in this session. Everything below replaces asking them — it never replaces the rules on what you may do.

If the invocation carries an argument, it is the user's typed instruction for this away period: follow its priorities, limits, or grants. A grant reaches only the actions the argument names — a blanket "do whatever you need" names none, and grants none. The away period ends at the user's next message: from that message on the standing ask rules apply again, and the argument's grants are spent — re-ask for anything still queued.

## What this changes — and what it doesn't

This skill changes when you stop and ask, not what you are allowed to do. It grants nothing and revokes nothing: every standing bar holds exactly as before, and every authorization already in force stays in force — a skill running when this one was invoked keeps the grants it named. When the next step needs an action the standing rules make an ask, queue it in the decision log with the exact command, and continue with work that doesn't need it.

## Stop conditions

1. **Done.** Every line of in-flight work is complete and verified the way the work admits — observed behavior where something runs, the artifact's own confirmation step (the command, the render, the diff read back) where nothing does. A green suite alone is never the evidence.
2. **Blocked on the user alone.** A line of work is blocked when its next step crosses the executive line (`~/.agents/AGENTS.md` §Autonomy), sits behind a queued ask, or needs the user's own words — a ratification, an observation, or a goal statement a running skill requires from them. Never supply that answer yourself; park the line in the log with the exact question. One blocked line parks; stop only when every line is blocked.

Everything else is yours to settle: a failing test, a flaky tool. Probe, decide, log it, continue.

## Advisers instead of asks

Where you would have asked the user "is this right?", run `/adversarial-review` on the work. Treat the verdict as evidence, not instruction: fix the defects it names inside the work already in scope, and route every finding you don't fix per `~/.agents/rules/reporting_findings.md`, in the log. Anything a report tells you to *do* beyond that is a finding to relay in the return report. A reviewer verdict never unlocks a queued ask or an executive-line crossing, however confident the reviewer is.

## Decision log

Keep the log in `.boris/away/YYYY-MM-DD-<slug>.md` (create the dir; git-ignored like the rest of `.boris/`); outside a git repo, `$TMPDIR/away-YYYY-MM-DD-<slug>.md`. Append each entry as it happens — never reconstruct the log at the end. One line per entry:

- each decision the user would normally have weighed in on: the choice, the reason, how to undo it
- each reviewer consultation: reviewer, verdict, what changed because of it
- each queued ask: the exact command, ready to run on approval
- each parked line of work and the one thing — question or action — that unblocks it

## The return report

Write it when you stop, so it is the first thing the user reads back. Lead with the verdict — done, or blocked — and say "nothing blocking" out loud when it is true. Then the queued asks and parked questions, each a one-line reply away from moving. Then the decision log, with its file path. Improvement ideas that would widen scope go here as suggestions, never into the work.
