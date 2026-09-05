# Reporting Findings

How every finding you hand to the user is classified and stated. `ownership.md` decides
what you must not walk past; this file decides how it arrives.

This governs the agent reporting to the user. A reviewer sub-agent is not that agent: it
ranks by severity, assigns no disposition, and drops nothing; reading this as a
sub-agent, take this paragraph and stop here. The caller classifies and routes every
ranked finding.

## Dispositions

Dispositions cover **defects**: something behaves wrongly, or a result is unverified. A
finding that names no defect, a naming, scope, or documentation observation, takes the
advisory route instead: report it under one **Advisory** heading with its evidence and
its cost, and no trigger.

Smells, test-structure notes, and coupling can be either. With a patch in hand, the
revert test decides: the finding is verdict-bearing when its evidence would not stand
with the patch reverted, advisory when it survives the revert. With no patch to revert,
these three classes take the advisory route. A verdict-bearing finding takes whichever
disposition the definitions below give it, its revert-test evidence standing in for the
trigger. A correctness defect is never advisory, and neither is a test whose outcome is
independent of its subject; that is false safety, not friction, and it takes a
disposition patch or no patch.

Mirrored in `~/.agents/skills/review/SKILL.md` §Dispose; edit together.

Every defect you surface, yours or one relayed from a reviewer, carries exactly one
disposition, named in the report:

- **Blocking**: the requested result is wrong, or unverified, until this is fixed.
- **Decide**: real and reachable, but outside the requested scope. The user picks now
  or later.
- **Noted**: you probed for a trigger and found none, or the fix costs more than the
  defect does.

Blocking and Decide require a named trigger: the caller, input value, configuration, or
sequence of user actions that reaches the defect. Noted carries the probe: name what you
searched and over what scope. An exported or externally callable surface always has a
nameable trigger, so "no caller in this repo" does not make it Noted. A real defect
whose trigger resists cheap probing, a race, a production-only configuration, a
third-party response you can't induce, is Decide, naming the probe you could not run.

Deferred work is not a finding, but takes the same three dispositions when a closeout
lists it, with a one-line reason for the deferral in place of the trigger.

A reviewer here reports blocking, should-fix, or note. `~/.agents/skills/review/SKILL.md`
§Severity assigns those words, and the dispositions above route them.

## The closing sentence

Every Noted finding appears, one line each, the defect, its evidence, and the ground
for Noted, grouped under a single heading marked "no action recommended". Bound volume
by that grouping, never by dropping one.

State every bucket you used and say when the top two are empty. "Nothing blocking,
nothing to decide" is the sentence that lets the user move on; leaving it out reads as
an unspoken reservation. When Decide is not empty, that sentence names the choice in
words that need no file open.
