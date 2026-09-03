---
name: debug
description: >-
  Investigates a failure, unexpected behavior, or cost symptom (sometimes slow,
  occasional hang) down to a confirmed root cause and shapes the fix task, whose
  acceptance observation is the reproduction. Use at the start of looking into a
  failure, before the cause is known, including a mid-task defect whose cause
  survives a direct look. Requests include debug this, why is this failing, why is
  this sometimes slow, and investigate this bug. A defect in the session's own
  process is kaizen. Build fixes the defective code from the card this skill leaves.
---

# Debug

Debug is the shape step for defects: it ends with the confirmed cause, the
evidence, and the reproduction on a card at Shape, created when none exists.
Land no fix during the investigation, because a fix changes the system under
study and the probes stop isolating anything. A defect met mid-task follows
build's rule, fixed now when small and a card when larger, and becomes a debug
card whatever its size when the cause survives a direct look.

Instrument and probe the system under study. On a live service, observation is
read-only, and the doctrine's sections 8 and 9 govern anything more.

## The reproduction comes first

Before any theory, get one command already run that goes red on this bug, with
its exact input and output. Every hypothesis is tested against that command.
When a direct reproduction is hard, any check that goes red now serves: a
failing test, a request against the running server, a replayed trace, a
bisection, a differential run of two configurations. Then minimize one element
at a time, re-checking after each cut that the case still goes red, and stop
when every remaining element has been tried and each cut goes green.

A cost symptom goes red as a measured cost on representative real input through
the real caller. Reach the reported magnitude before trusting any number: a
result far below what the user reported, or a minimization cut that lowers the
cost, means the measurement lost the cause.

Sensitive real input never enters version control. The committed reproduction
uses synthesized or redacted input, re-checked to still go red at the same
magnitude. When only the real input reproduces the symptom, the reproduction
stays a recorded command naming the input's location, and no fixture is
committed.

A failure that cannot be reproduced is the first finding, recorded on the card;
it narrows the investigation to why, and licenses no theory of the cause.

## More than one suspect

Name the causes the evidence could support, at least two unless the evidence
already names one, then find the observation that tells them apart: read the
code, trace the data, add instrumentation, bisect. Change one thing between
observations. Tag the probes you add with one unique prefix per investigation,
so cleanup is a single grep.

## Confirmed means switchable

The cause is confirmed when the symptom turns on and off through it and every
observation on the card fits it. "It works now" with no known why is
unconfirmed. An intermittent symptom confirms by frequency: enough runs with
the cause present and absent to tell the two rates apart. One toggle is not
enough.
Ask why past the triggering line to the cause whose fix would remove every
observed symptom at once. Multiple call sites needing the same patch share one
cause.

## Closing

Grep the probe prefix and remove the instrumentation. A probe that must stay is
recorded on the card with its path and purpose. An investigation that stalls,
with no reproduction, no discriminating observation, or no way to switch the
cause, also closes: the card records what was established, what is missing, and
the options, and goes to João. Otherwise the card leaves like any shaped task:
the goal, the confirmed cause with its evidence, and the reproduction as the
acceptance observation and the first test to write, a test where the repo has a
suite and the recorded command otherwise. Move the card in the same turn: to
Build when one fix is settled, the session continuing into build only when the
direction included fixing. Otherwise the card stays at Shape, with the cause and
whatever candidates exist recorded for João.
