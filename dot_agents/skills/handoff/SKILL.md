---
name: handoff
argument-hint: "What will the next session focus on?"
description: Moves in-flight work out of the conversation onto its card, so a fresh session can pick it up cold, and ends with a line João can paste to resume. Writes no file and decides nothing. Use when work pauses mid-flight. A session that keeps working while João is away uses the away skill instead.
disable-model-invocation: true
---

# Handoff

Everything the next session needs lives in this conversation and nowhere else. Move it
onto the card. You are preserving state, not deciding anything, so write no code and
no new file. The card and the documents already attached to it are the handoff.

Where the work has no card, create one in the column the work is in.

An argument on the invocation names what the next session will work on. Flush the
state that matters for that first, and trim what does not.

## What goes on the card

The task and why, in the description, where it is not there already.

Where the work actually stands: what is done, what is in progress, what is untouched.
Be exact about half-finished work. Check an acceptance criterion only where its
evidence exists.

The decisions still open, as open. A question you paper over as settled is the one the
next session will get wrong.

The paths and lines that are load-bearing, and what this session learned that the
repository does not show: an approach that failed, a constraint that surprised you.

A debugging session adds the reproduction, the magnitude, the hypotheses with their
evidence, the causes ruled out, and the next observation that would discriminate. A
build adds the working tree's state, what is verified, and the next unchecked item.

Reference a document that already exists by its path rather than restating it. Keep
secrets and personal data out. Where the current direction looks wrong to you, say so
in a note rather than handing the problem forward in silence.

## The resume line

End the reply with one line João can paste into a fresh session, in this form:

    continue TASK-N: read the card and its attached docs; next: <the first move>

Name a skill in that last part where one fits the move.

Outside a repository, where no board exists, the flush goes in the reply itself, above
that line.
