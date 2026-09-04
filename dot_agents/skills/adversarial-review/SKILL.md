---
name: adversarial-review
description: Sends work this session produced to an independent reviewer that is told nothing about where the answer lands, then relays every finding in the reviewer's own words. Covers reasoning documents as well as code, red-teaming the argument where there is nothing to run. Use when work needs a second reader who has no stake in it. A change going through the Review column uses the review skill instead.
---

# Adversarial review

An independent reader sees what you have stopped seeing, but only where the brief
does not tell it where you landed.

This covers anything you produced this session that no other skill already gates. A
change moving through the Review column belongs to the review skill, an instruction
file to review-instructions, a corpus import to absorb, and a process defect to
kaizen, each of which runs its own unprimed pass with its own checks. What is left is
the work in between: a document, a decision, a change nobody else is reading.

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
tools and the brief is the only thing bounding it. Then: assume there are problems
and find them, cite the place, give a concrete reproduction or counterexample for
each finding, and drop anything you cannot substantiate. Every finding says whether
a command verified it or reasoning alone did, and names the command. Rank each one
blocking, should-fix, or note, in the review skill's words under its Severity
heading, and say so where a rank has nothing in it. A clean report is a valid
result.

## What the reviewer does not get

Your assessment. That the tests pass. That the tricky part is handled. Anything that
says where the answer lands.

Which parts you are confident in, or already checked. That steers the reader away from
exactly where your blind spots are.

Reassuring framing. State the task flat, and say in the brief that it deliberately
contains no assessment, so the reviewer forms its own.

## Relay it in the reviewer's words

Quote each finding rather than summarizing it. Condensing is where softening enters.
Order them worst first, and state a finding that kills the approach plainly, before
any defense of it.

Every finding is listed, including the ones that invalidate what you just did. The
disposition is yours and the words are the reviewer's, so keep your own view in its
own section, after the findings, marked as yours.

## As a gate on your own draft

A document that ratifies something expensive to reverse, an approach, a plan, a cause,
runs this gate before it is called done. Skipping it is said out loud.

Fold or defer each material finding. A deferral takes a disposition and closes the
finding for the gate, never for the report. A finding that invalidates the document's
core reopens the work that produced it, rather than being edited around.

An edit answering a finding that named a command, a count, or a line gets that same
probe re-run against the new text. Name each fix you probed and the command.

The gate is one round. Fold the findings, probe the fixes, then say out loud whether
you are sending it back once more or proceeding. Send it back only where a fix changed
a claim about how something behaves, or repaired a blocking finding in a way its probe
cannot confirm. One rerun at most. After it, proceed, giving every open finding a
disposition. Where João asks for a clean report, tell him first what the residue will
look like, because a skeptical reader of a long document does not return an empty list.

Where the gate catches the same class of gap across two documents, or twice on one,
the defect is in how you draft rather than in the draft. Say so, with both instances
quoted, before fixing the document again.
