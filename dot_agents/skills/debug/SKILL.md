---
name: debug
description: Investigates a failure or unexpected behavior down to a confirmed root cause and shapes the fix task, whose acceptance observation is the reproduction. Use at the start of looking into a failure, before the cause is known: debug this, why is this failing, investigate this bug. A defect in the session's own process is kaizen; the fix itself is built by build, from the card this skill leaves.
---

# Debug

Debug is the shape step for defects: it ends with the confirmed cause, the
evidence, and the reproduction on a card at Shape, created when none exists.
Land no fix during the investigation, because a fix changes the system under
study and the probes stop isolating anything; when the direction included
fixing and one fix is settled, the same session continues into build off the
card. A defect met mid-task stays under build's fix-it-now rule until a direct
look fails to name the cause; then it becomes a debug card.

Instrument and probe the system under study; on a live service, observation is
read-only, and the doctrine's operations sections govern anything more.

## The reproduction comes first

Before any theory, get one command already run that goes red on this bug, with
its exact input and output; every hypothesis is tested against that command.
When a direct reproduction is hard, any check that goes red now serves: a
failing test, a request against the running server, a replayed trace, a
bisection, a differential run of two configurations. Then minimize one element
at a time, re-checking after each cut that the case still goes red, and stop
when no element can be removed.

A cost symptom (sometimes slow, occasional hang) goes red as a measured cost on
representative real input through the real caller. Reach the reported magnitude
before trusting any number: a result far below what the user reported, or a
minimization cut that lowers the cost, means the measurement lost the cause.
Real input carrying sensitive data stays out of version control; the committed
reproduction uses synthesized or redacted input, re-checked to still go red.

A failure that cannot be reproduced is the first finding, recorded on the card;
it narrows the investigation to why, and licenses no theory of the cause.

## More than one suspect

Name the causes the evidence could support, at least two unless the evidence
already names one, then find the observation that tells them apart: read the
code, trace the data, add instrumentation, bisect. Change one thing between
observations. Tag every probe you add with one unique prefix, so cleanup is a
single grep.

## Confirmed means switchable

The cause is confirmed when the symptom turns on and off through it and every
observation on the card fits it; "it works now" with no known why is
unconfirmed. An intermittent symptom confirms by frequency: enough runs with
the cause present and absent to tell the two rates apart, never one toggle.
Ask why past the triggering line to the cause that, fixed once, removes every
symptom; multiple call sites needing the same patch share one cause.

## Closing

Grep the probe prefix and remove the instrumentation; a probe that must stay is
recorded on the card with its path and purpose. An investigation that stalls,
with no reproduction, no discriminating observation, or no way to switch the
cause, also closes: the card records what was established, what is missing, and
the options, and goes to João. Otherwise the card leaves like any shaped task:
the goal, the confirmed cause with its evidence, and the reproduction as the
acceptance observation and first test, a test where the repo has a suite and
the recorded command otherwise. One settled fix, build takes the card; several
candidates or none, the options go to João.
