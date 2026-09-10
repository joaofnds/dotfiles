---
name: debug
description: Investigates a failure, unexpected behavior, or a cost symptom such as slowness or a hang, down to a confirmed root cause and shapes the fix task. Use at the start of looking into a failure, before the cause is known, including a mid-task defect whose cause survives a direct look. A defect in the session's own process is a kaizen candidate.
---

# Debug

Debug establishes a defect's cause, evidence, and reproduction within authorized work.
Land no fix during the investigation, because a fix changes the system under
study and the probes stop isolating anything. A defect required by the active task
becomes a debug card when its cause survives a direct look. Capture an independent
finding under the board's Capture and admission policy before investigating it.

Instrument and probe the system under study. On a live service, observation is
read-only.

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
unconfirmed. An intermittent symptom confirms by frequency: enough runs with the
cause present and absent to tell the two rates apart. One toggle is not enough.
Ask why past the triggering line to the cause whose fix would remove every
observed symptom at once. Multiple call sites needing the same patch share one
cause.

## Closing

Grep the probe prefix and remove the instrumentation. A probe that must stay is
recorded on the card with its path and purpose. An investigation that stalls, with no
reproduction, no discriminating observation, or no way to switch the cause, records
what was established, what is missing, and the next observation needed. The reply
says the cause is unsettled. Finish the card under the board's investigation policy.

When the direction authorizes only finding the cause, record the answer against
that question's acceptance. Keep proposed fixes separate. When it includes fixing,
shape the fix with the confirmed cause, evidence, and reproduction as its first
test. Continue into build only when the fix is settled and authorized.
