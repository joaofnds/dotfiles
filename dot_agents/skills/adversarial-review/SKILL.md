---
name: adversarial-review
description: Sends work this session produced to an independent reviewer that is told nothing about where the answer lands, then relays every finding in the reviewer's own words. Covers reasoning documents as well as code, red-teaming the argument where there is nothing to run. Use when work needs a second reader who has no stake in it. A change going through the Review column uses the review skill instead.
---

# Adversarial review

The brief decides whether the review is worth anything. A reader told where you
landed confirms it. A reader told nothing forms its own view.

This covers anything you produced this session that no other skill already gates. Code
you did not write, a pull request or an outside audit, is not this skill's work, and it
waits for João to ask for a review rather than being sent from here. A change moving
through the Review column belongs to the review skill, an instruction file to
review-instructions, a corpus import to absorb, and a process defect to kaizen, each of
which runs its own unprimed pass with its own checks. A work product stays here
however imperative it reads, so a shaped task, a plan, or a diagnosis is this skill's,
not review-instructions'. What is left is the work in between: a document, a decision,
a change nobody else is reading.

For code, the reviewer runs what it can. For a reasoning document, a shaped task, an
options survey, a diagnosis, there is nothing to run, so the mandate is to red-team
the argument: the unstated assumption, the gap in scope, the premise nobody
questioned, the conclusion the evidence does not reach.

## What the reviewer gets

The goal in João's terms, since a reviewer without it can only judge style rather than
whether you solved the right problem. Where no goal was stated this session, ask him
for it before you build the brief.

The artifact itself, as the diff, the files, the lines. Point at it and let it read.
A summary of the work is your reading of it.

How to verify, where something runs: the command and how to run it, with the
instruction to run it rather than to trust that it passes.

The mandate. Open it with the read-only clause the delegation skill's read-only
review spawn heading requires, since a general agent inherits the editing and shell
tools and the brief is the only thing bounding it. Then: assume there are problems and
find them, default to skeptical, cite the place, give a concrete reproduction or
counterexample for each finding, and drop anything you cannot substantiate by a command
or by a stated argument. Every finding says whether a command verified it or reasoning alone did, and
names the command. A clean report is a valid result.

Rank each finding blocking, should-fix, or note, in the review skill's words under its
Severity heading, and say so where a rank has nothing in it. Those words are written
for code, so for a document read them by what the finding costs. Blocking is a document
that is wrong or unsafe as written. Should-fix changes the approach, the evidence, or
what the next stage does with it. A note carries a bounded cost. Turn each rank into a
disposition by the mapping under that skill's Dispose heading, which decides on its own
terms which findings are advisory.

## What the reviewer does not get

Your assessment. That the tests pass. That the tricky part is handled. Anything that
says where the answer lands.

Which parts you are confident in, or already checked. That steers the reader away from
exactly where your blind spots are.

Reassuring framing. State the task flat, and put this in the brief: "This brief
deliberately contains no assessment of correctness. Form your own from the artifact."

## Relay it in the reviewer's words

Quote each finding rather than summarizing it. Condensing is where softening enters.
Order them worst first, and state a finding that kills the approach plainly, before
any defense of it.

Every finding is listed, including the ones that invalidate what you just did. The
disposition is yours and the words are the reviewer's, so keep your own view in its
own section, after the findings, marked as yours.

## As a gate on your own draft

A document that ratifies something expensive to reverse, an approach, a plan, a cause,
runs this gate before it is called done. Say out loud when you skip this gate, and when
you skip a stage that would have run it, since either way nothing checked the work but
you.

Fold or defer each material finding. A deferral takes a disposition and closes the
finding for the gate, never for the report. A finding that invalidates the document's
core reopens the work that produced it, rather than being edited around. That ends this
gate, the redrafted document gets a fresh round of its own, and you tell João why.

An edit answering a finding that named a compile error, a command, a count, or a line
gets that same probe re-run against the new text. Name each fix you probed and the
command. A throwaway program in a temporary directory counts as a probe, and running
one does not breach a producing skill's bar on changing the code it is studying.

The gate is one round. Fold the findings, probe the fixes, then say out loud whether
you are sending it back once more or proceeding. Send it back only where a fix changed
a claim about how something behaves, or repaired a blocking finding in a way its probe
cannot confirm. One rerun at most. After it, proceed, giving every open finding a
disposition. Run a further round only where João asks for one. Where he asks for a
clean report, tell him first what the residue will look like, because a skeptical
reader of a long document does not return an empty list.

Where the gate catches the same class of gap across two documents, or twice on one, the
defect is in what produced them rather than in the draft. Name whether that is the
producing skill or your own revision loop. Say so to João in that round, with both
instances quoted, before fixing the document again.
