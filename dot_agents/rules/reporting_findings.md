# Reporting Findings

How every finding you hand to the user is classified and stated. `ownership.md` decides what
you must not walk past; this file decides how it arrives.

This governs the agent reporting to the user. A reviewer sub-agent is not that agent: it ranks
by severity, assigns no disposition, and drops nothing — reading this as a sub-agent, take this
paragraph and stop here. The caller classifies and routes every ranked finding
(`agents/code-reviewer.md`: "severity ordering is the caller's filter, not yours").

## Dispositions

These dispositions cover **defects**: something behaves wrongly, or a result is unverified. A
finding that names no defect — a naming, scope, or documentation observation — takes the
advisory route instead: report it under one **Advisory** heading with its evidence and its
cost, and no trigger. Smells, test-structure notes, and coupling are the three classes that
can be either: with a patch in hand, the **revert test** decides — the finding is
verdict-bearing when its evidence would not stand with the patch reverted, advisory when it
survives the revert (mirrors `~/.agents/skills/panel-review/SKILL.md` §3 "Verdict-bearing or
advisory", which holds the worked forms and the two exemptions — edit both). With no patch
to revert, a finding in these three classes takes the advisory route: evidence and cost,
no trigger. A verdict-bearing
finding is never advisory: it takes whichever disposition the definitions below give it, its
revert-test evidence standing in for the trigger wherever one is required. A correctness
defect is never advisory either, whether or not it survives the revert. Neither is a test
whose outcome is independent of its subject: that is false safety, not friction, and it
takes a disposition patch or no patch, even though it is a test-structure finding.

Every defect you surface, yours or one relayed from a reviewer, carries exactly one
disposition, named in the report:

- **Blocking** — the requested result is wrong, or unverified, until this is fixed.
- **Decide** — real and reachable, but outside the requested scope. The user picks now or later.
- **Noted** — you probed for a trigger and found none, or the fix costs more than the defect does.

**Blocking and Decide require a named trigger:** the caller, input value, configuration, or
sequence of user actions that reaches the defect, named as concretely as a probe would be.

**Noted carries the same evidence bar as a missing-claim** (`ownership.md` §Before Marking Done
item 3). Name what you searched and over what scope: the grep for callers, the config you read,
the entry points you walked. An exported, public, or otherwise externally callable surface
always has a nameable trigger, so "no caller in this repo" does not make it Noted. A real
defect whose trigger resists cheap probing — a race, a production-only configuration, a
third-party response you can't induce — is **Decide**, naming the probe you could not run. It
is never Noted.

**Deferred work is not a finding, but takes the same three dispositions when a closeout lists
it** (`~/.agents/skills/build/SKILL.md` §Rules): a one-line reason for why it is deferred replaces the
named trigger. The advisory route above covers findings that name no defect, not work the
user still wants.

Every Noted finding appears. The disposition decides who acts, never whether the user sees it.
Give each one a line carrying the defect, its evidence, and the ground for Noted — the probe
that found no trigger, or the cost comparison that outweighs the defect — grouped under a
single heading marked "no action recommended". Bound volume by that grouping,
never by dropping one.

State every bucket you used and say when the top two are empty. "Nothing blocking, nothing to
decide" is the sentence that lets the user move on; leaving it out reads as an unspoken
reservation.
