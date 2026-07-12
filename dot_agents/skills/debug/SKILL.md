---
name: debug
description: >
  Drive a disciplined investigation of a bug or unexpected behavior — reproduce,
  hold competing hypotheses, discriminate with evidence, confirm the root cause
  by prediction — instead of guessing at fixes. Invoke at the START of looking
  into a failure, before the cause is known: "debug this", "why is this failing",
  "figure out what's breaking", "investigate this bug". This finds and confirms
  the cause; it does not land the fix (that's /plan → /build) or write the durable
  report (that's /diagnose, run after to record what this found). For dumping
  in-flight state to a fresh session, that's /handoff.
metadata:
  trigger: Starting to investigate a failure this session, before the root cause is known
---

# Debug

Investigate a bug down to a confirmed root cause. The job is understanding, not
repair — probe and instrument freely, but don't land the fix here; that's
/plan → /build, off the cause you find. Your instinct will be to jump to a
plausible fix. Resist it.

**Build the loop before theorizing.** Get a tight, red-capable repro first: one
command you've already run that goes red on *this* bug and green once it's fixed —
the exact command, input, and output. That loop is the skill; hypotheses just
consume it, so spend your effort here. When a repro is hard to get, reach for a
failing test, a curl against a running server, a replay of a captured trace, a
bisection, or a differential run of two configs. Then *minimise* — cut to the
smallest scenario that still goes red, one element at a time. If you can't
reproduce it at all, that's finding #1, not a license to guess.

**Hold competing hypotheses.** Name more than one cause the evidence could
support; don't latch onto the first. Then go find the observation that tells them
apart — read the code, trace the data flow, add instrumentation, bisect. Change
one thing at a time. Tag any probe you add with a unique prefix (`[DEBUG-a4f2]`)
so cleanup is a single grep.

**Confirm by prediction, not plausibility.** You've found it only when you can
switch the symptom on and off at will and account for every observation. "It
works now" without knowing why is program-by-coincidence — keep going. Only tool
output and observed behavior count, never a story that fits.

**Reach the root, not the symptom.** Ask why until the cause is structural;
separate the proximate trigger from the root. Seven call sites with the same
patch are seven symptoms.

When the cause is confirmed (or the leads run out), debugging is done: hand off to
`/diagnose` to record it durably, or `/plan` to design the fix.
