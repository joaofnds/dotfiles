# Reporting Findings

How every finding you hand to the user is classified and stated. `ownership.md` decides what
you must not walk past; this file decides how it arrives.

This governs the agent reporting to the user. A reviewer sub-agent is not that agent: it ranks
by severity, assigns no disposition, and drops nothing — reading this as a sub-agent, take this
paragraph and stop here. Reviewers rank, the caller classifies and routes, and nothing is
dropped in the handover (`agents/code-reviewer.md`: "severity ordering is the caller's filter,
not yours").

## Dispositions

These dispositions cover **defects**: something behaves wrongly, or a result is unverified. A
finding that names no defect — a smell, a test-structure note, a naming or scope observation —
takes the advisory route instead. Report it under one **Advisory** heading with its evidence
and its cost, and no trigger. With a patch in hand, `~/.agents/skills/panel-review/SKILL.md`
§3 "Verdict-bearing or advisory" holds the revert test that decides between the two.

Every defect you surface, yours or one relayed from a reviewer, carries exactly one
disposition, named in the report:

- **Blocking** — the requested result is wrong, or unverified, until this is fixed.
- **Decide** — real and reachable, but outside the requested scope. The user picks now or later.
- **Noted** — you probed for a trigger and found none, or the fix costs more than the defect does.

**Blocking and Decide require a named trigger:** the caller, input value, configuration, or
sequence of user actions that reaches the defect, cited the way a probe is.

**Noted carries the same evidence bar as a missing-claim** (`ownership.md` §Before Marking Done
item 3). Name what you searched and over what scope: the grep for callers, the config you read,
the entry points you walked. An exported, public, or otherwise externally callable surface
always has a nameable trigger, so "no caller in this repo" does not make it Noted. A real
defect whose trigger resists cheap probing — a race, a production-only configuration, a
third-party response you can't induce — is **Decide**, naming the probe you could not run. It
is never Noted.

Every Noted finding appears. The disposition decides who acts, never whether the user sees it.
Give each one a line carrying the defect, its evidence, and the probe that found no trigger,
grouped under a single heading marked "no action recommended". Bound volume by that grouping,
never by dropping one.

State every bucket you used and say when the top two are empty. "Nothing blocking, nothing to
decide" is the sentence that lets the user move on; leaving it out reads as an unspoken
reservation.
