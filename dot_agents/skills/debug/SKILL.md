---
name: debug
description: >
  Investigate a bug or unexpected behavior down to a confirmed root cause. Invoke at
  the START of looking into a failure, before the cause is known: "debug this", "why
  is this failing", "investigate this bug". Confirms the cause but lands no fix
  (/plan → /build) and writes no durable report (/diagnose, run after). Dumping
  in-flight state to a fresh session → /handoff.
metadata:
  trigger: Starting to investigate a failure this session, before the root cause is known
---

# Debug

**Wrong skill if:** dumping in-flight state to a fresh session → `/handoff`; investigation already concluded and you want the durable report → `/diagnose`.

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
smallest scenario that still goes red, one element at a time, re-checking the
minimised case still reproduces the *reported magnitude*; if the cost drops, you
minimised away the cause, not the noise. For a latency or intermittency symptom
("sometimes slow", "occasional hang"), "red" is a measured cost on
**representative real input through the real caller** — the user's own files, not
a unit test that bypasses the path and not a synthetic fixture; reproduce the
reported magnitude before you trust any number, and a result far smaller than
what the user perceives means you are measuring something else. If you can't
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
