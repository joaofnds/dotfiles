---
name: away
description: Continues the work already in flight while João is away from the keyboard, replacing the questions that would have stopped you with an independent review and a decision log, until the work is done or every line is blocked on him. Use when he says he is stepping away or to keep going without him. Packaging work for a fresh session is relay instead.
disable-model-invocation: true
---

# Away

João cannot answer until he returns. Continue the work this session already named.
Where nothing is in flight, say so and stop. This skill continues work and never
invents it.

An argument on the invocation is his typed instruction for the away period: follow its
priorities, its limits, and any authorization it grants. A grant reaches only the
actions it names, so "do whatever you need" grants nothing. The period ends at his next
message, and the grants end with it. From there the standing ask rules apply again, so
re-ask for anything still queued.

## What changes, and what does not

This changes when you stop to ask, and nothing else. Every standing bar holds exactly
as before, the hard lines and the rules on acting alike, and an authorization already
in force stays in force. Where the next step needs an action the hard lines reserve for
him, write the exact command into the log and carry on with work that does not need it.

## When to stop

Stop when the work is done, meaning every line of it is complete and confirmed the way
that work admits. Where something runs, you have watched it behave, and a green suite
alone is never the evidence. Where nothing runs, you have taken the artifact's own
confirming step: the command, the rendered page, the staged diff read back.

Stop when every line is blocked on him alone: a decision that crosses into real money,
irreversibility, an outward-facing surface, or scope growth; an ask already queued; or
a ratification or observation only he can give. Never answer in his place. One blocked
line parks in the log with the exact question. Stop only when every line is parked.

Everything else is yours to settle. A failing test, a flaky tool, a choice between two
workable approaches: probe it, decide it, log it, keep going.

## A reviewer instead of a question

Where you would have asked him whether something is right, run the adversarial-review
skill on the work. Its verdict is evidence and not instruction. Fix the defects it
names inside the scope you already have, relay anything else its report tells you to do
as a finding, and log every finding you do not fix with its disposition. A reviewer's
confidence never unlocks a queued ask, and never a hard line.

## The log

Write the log as you go, one entry at a time, never reconstructed at the end. It is a
document on the card, by the board skill's route, so it survives the session that wrote
it. Outside a git repository it goes to `$TMPDIR/away-<YYYY-MM-DD>-<slug>.md`. Each
entry is a line: a decision he would have weighed, with the reason and how to undo it;
a review, with its verdict and what changed because of it; a queued ask, with the exact
command ready to run; a parked line, with the one thing that unblocks it.

## The return report

He reads from the bottom up, so order it by rising urgency: the log's path first, then
suggestions you did not act on, then the queued asks and parked questions, each one a
short reply away from moving. The last line is the verdict, done or blocked, and where
nothing is blocking and nothing waits on his decision it says both plainly.
