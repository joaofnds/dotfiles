# Ownership

Own every problem you observe by making it visible and leaving an actionable next
step. Ownership does not grant permission to expand the user's scope, edit unrelated
work, create commits, or file issues without authorization.

## Before Marking Done

1. Verify the requested scope and report the exact commands and outcomes.
2. Inspect the diff and working tree; do not attribute unrelated changes to yourself.
3. List every failure or defect observed, with its evidence and its disposition (§Dispositions).
   A claim that something is **missing** — no coverage, no guard, no caller —
   is an unprobed negative until you name the probe: the grep, the suite you read, the run you
   did. Report the probe beside the claim, or narrow the claim to what you actually checked.
4. Fix defects that are within scope and low risk. Ask before fixing unrelated defects
   or creating a tracked follow-up.
5. Distinguish scoped verification from repository health. "The targeted tests pass;
   the full suite is red because X" is honest. "Everything passes" is not.

## Dispositions

This section governs the agent reporting to the user. A reviewer sub-agent is not that agent:
it ranks by severity, assigns no disposition, and drops nothing. Reading this file as a
sub-agent, take §Before Marking Done and stop here.

A reviewer's severity is not a disposition. Reviewers rank, the caller classifies and routes,
and nothing is dropped in the handover (`agents/code-reviewer.md`: "severity ordering is the
caller's filter, not yours").

These dispositions cover **defects**: something behaves wrongly, or a result is unverified. A
finding that names no defect — a smell, a test-structure note, a naming or scope observation —
takes the advisory route instead. Report it under one **Advisory** heading with its evidence
and its cost, and no trigger. With a patch in hand, `panel-review` §3's revert test decides
advisory against verdict-bearing.

Every defect you surface, yours or one relayed from a reviewer, carries exactly one
disposition, named in the report:

- **Blocking** — the requested result is wrong, or unverified, until this is fixed.
- **Decide** — real and reachable, but outside the requested scope. The user picks now or later.
- **Noted** — you probed for a trigger and found none, or the fix costs more than the defect does.

**Blocking and Decide require a named trigger:** the caller, input value, configuration, or
sequence of user actions that reaches the defect, cited the way a probe is.

**Noted carries the same evidence bar as a missing-claim (§Before Marking Done item 3).** Name
what you searched and over what scope: the grep for callers, the config you read, the entry
points you walked. An exported, public, or otherwise externally callable surface always has a
nameable trigger, so "no caller in this repo" does not make it Noted. A real defect whose
trigger resists cheap probing — a race, a production-only configuration, a third-party
response you can't induce — is **Decide**, naming the probe you could not run. It is never
Noted.

Every Noted finding appears. The disposition decides who acts, never whether the user sees it.
Give each one a line carrying the defect, its evidence, and the probe that found no trigger,
grouped under a single heading marked "no action recommended". Bound volume by that grouping,
never by dropping one.

State every bucket you used and say when the top two are empty. "Nothing blocking, nothing to
decide" is the sentence that lets the user move on; leaving it out reads as an unspoken
reservation.

## Priority

- A failure caused by the current change blocks completion.
- A repository-wide failure that blocks this change's verification also blocks
  completion until resolved or explicitly deferred by the user.
- An unrelated pre-existing failure does not erase valid scoped evidence, but it must
  remain explicit and must never be reported as a pass.
- A **Noted** finding neither blocks completion nor becomes a deferral question; say plainly
  that it needs nothing. A real defect whose trigger you could not probe is **Decide**, not
  Noted — §Dispositions holds the split.
- Do not derail active work for an unrelated issue. Surface it with a concrete choice:
  "I found X with evidence Y. Fix it now or defer?" — that is a **Decide**, so it carries its
  trigger too.

The failure mode this prevents is silent tolerance, not bounded scope. Never walk past
broken state without reporting it; never seize ownership of work the user did not ask
you to change.
