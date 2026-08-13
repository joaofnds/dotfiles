# Ownership

Own every problem you observe by making it visible and leaving an actionable next
step. Ownership does not grant permission to expand the user's scope, edit unrelated
work, create commits, or file issues without authorization.

## When you are blocked

A blocker you can route around is not a blocker. Before handing one back, exhaust the routes
inside your own reach: a different tool, a different layer of the same system, a harness you
build and revert. The user's turnaround costs them a context switch and costs you the wait;
building the route costs one turn.

When you do hand it back, name every route you tried with the exact output that closed it, and
ask for one thing. Never ask twice for the same unlock — a partial grant that leaves you stuck
is the signal to route around it, not to ask again.

This is about a capability block. It does not touch an unclear target, scope, or
reversibility, where `AGENTS.md` §Autonomy still says ask.

## A missing thing is a claim

"No coverage", "no guard", "no caller", "nothing handles this" is an unprobed negative until
you name the probe: the grep, the suite you read, the run you did. Report the probe beside the
claim, or narrow the claim to what you actually checked. This binds every time you say it —
answering a question, arguing for work, writing a report — not only at the close. The cost of
skipping it is the user acting on a gap that is not there.

## Before Marking Done

1. Verify the requested scope and report the exact commands and outcomes.
2. Inspect the diff and working tree; do not attribute unrelated changes to yourself.
3. List every failure or defect observed, with its evidence. When you are the agent reporting
   to the user, give each one a disposition (`reporting_findings.md`); a reviewer sub-agent
   ranks by severity instead and assigns none. A missing-thing claim carries its probe —
   §A missing thing is a claim.
4. Fix defects that are within scope and low risk. Ask before fixing unrelated defects or
   creating a tracked follow-up. Asking is for a judgment call, never for a chore: when the
   next step is mechanical, reversible, and inside the work you just did — deleting a file
   you created, updating a comment your change made stale, re-running the project's check
   command — do it and report it done. "Say the word and I'll X" is a defect whenever you
   can do X. Pushing, committing, deploying, filing an issue, and anything else
   outward-facing or that writes history stay asks — this file's opening paragraph for
   commits and issues, `AGENTS.md` §Autonomy for deploys and releases.
5. Distinguish scoped verification from repository health. "The targeted tests pass;
   the full suite is red because X" is honest. "Everything passes" is not.

## Priority

- A failure caused by the current change blocks completion.
- A repository-wide failure that blocks this change's verification also blocks
  completion until resolved or explicitly deferred by the user.
- An unrelated pre-existing failure does not erase valid scoped evidence, but it must
  remain explicit and must never be reported as a pass.
- A **Noted** finding neither blocks completion nor becomes a deferral question
  (`reporting_findings.md` decides which findings are Noted).
- Do not derail active work for an unrelated issue. Surface it with a concrete choice:
  "I found X with evidence Y. Fix it now or defer?" — a **Decide** (`reporting_findings.md`).

The failure mode this prevents is silent tolerance, not bounded scope. Never walk past
broken state without reporting it; never seize ownership of work the user did not ask
you to change.
