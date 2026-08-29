---
name: review
description: Decide whether a change needs an independent second review, run it (one round, fresh reviewer), verify every finding against evidence, dispose of each, record them all. Use at the Review column, before shipping anything outward-facing, irreversible, or security-surfaced, and whenever João asks for a review.
---

# Review

The quality bar is the same everywhere: every change gets author-side verification,
and any defect found is fixed before moving on, whatever the task's size. This skill is
about the second look, independent review, and when it's worth its cost.

## The tier

Independent review runs when the work is outward-facing (others will read or run it),
irreversible (data, published history, money), security-surfaced (trust boundaries,
authentication, secrets, untrusted input), or when João asked for one. These are
properties of the change, read off the diff, not opinions about its importance; if
you're unsure whether one applies, it applies. Otherwise the author-side verification
already done is the review: say so in a line and move on. Widen these triggers only
on evidence that defects escaped, not on unease.

## One round, fresh eyes

Dispatch the `reviewer` agent with the diff and the task's acceptance observations,
and none of your reasoning: not why review was triggered, not what you're worried
about. Priming a reviewer with what you believe turns a second review into the first
one twice. Ask for everything it finds; you will filter. One
round: the reviewer advises, you own the verdict, and a disagreement you can't settle
with evidence goes to João with your recommendation, never back to the reviewer.

## Verify, then dispose

Each finding is a claim. Confirm or refute it with a tool result: run the test, read
the line, reproduce the input. A finding you can't reproduce is refuted, and you say
so. Then dispose of it one of four ways: fixed (small and reversible: in this batch);
not a defect, with why; tracked as a task, with its id; escalated to João, with your
recommendation.

Severity is yours to assign after verification, in the reviewer's three words:
blocking (wrong behavior, data loss, or a security hole; fixed before done),
should-fix (a real defect that doesn't block), note (an observation, no action
required). Inflation is as much a defect as under-reporting: a note called blocking
teaches the reader to ignore the word.

Security is part of this pass, not a separate one: what untrusted data enters, what
authority the code exercises, what a hostile input could reach.

## Record everything, brief the decision

Every finding, with its severity and disposition, goes on the task's record. None are
dropped or folded into "a few minor things". The reply to João is the brief: how many
findings by severity and what was done with them, and in full only the ones that need
his decision or that changed what's live. No findings is one line. Then the verdict:
proceed, or what blocks.
