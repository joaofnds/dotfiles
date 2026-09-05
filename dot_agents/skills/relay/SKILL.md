---
name: relay
argument-hint: "What will the next session work on?"
description: Snapshots this session onto its card, so a fresh session resumes with what this one learned and none of what it went through, and ends with a line João can paste to start it. Writes no new file and decides nothing. Use when context is running low, or when work pauses mid-flight. A session that keeps working while João is away uses the away skill instead, and a side finding that deserves its own session goes to the prompt skill.
---

# Relay

Write no code, create no file, and decide nothing.

An argument names what the next session will work on. Where the work has no card, create
one in the column the work stopped in. Where this session touched several cards, the
snapshot goes on the one the next session resumes, and each of the others gets a note
pointing there. Where an earlier snapshot sits on that card, say which one this replaces.

## Read before you write

Keep secrets and personal data off the card.

Your account of a long session is a summary of it by now, so read the card before you add
to it. In a git repository, quote `git status --short` for the paths this session touched,
so the next session can diff the tree against what you left.

Say what each uncommitted path is for: keep, probe, half-done, or another session's. Git
holds the listing and holds none of that.

Put this session's transcript path on the card, to grep rather than read whole, since it
is the only complete copy of what the snapshot leaves out and nothing else says which
transcript was this one
(`~/.agents/skills/review-instructions/references/external-facts.md` §Harness mechanics).

## What goes on the card

Carry a fact when rediscovering it would cost the next session more than reading it here.
Everything else goes, including the order in which this session did things. Reference by
path or by URL whatever already exists somewhere, rather than restating it.

Quote João's corrections in his own words rather than paraphrasing them, since a
paraphrase arrives as your judgment and binds the next session as his.

Name every approach ruled out, who ruled it out, and why. An approach he refused never
failed, and a fresh session will propose it again.

Carry the command that verified a thing rather than the verdict. A tool result from this
session is not one from the next session's, so a bare "verified" is downgraded on arrival.

Name anything still running that a fresh process will not inherit: a server on a port, a
lock, a sub-agent whose report has not landed and where its output goes.

Put the task and why in the description, unless it already carries them.

Say where the work stands: what is done, what is in progress, what is untouched. Be exact
about half-finished work. Name the next move. Check an acceptance criterion only where its
evidence exists.

Leave the decisions still open as open. A question you paper over as settled is the one
the next session will get wrong.

Name what is load-bearing by symbol or by path, since a line number goes stale as soon as
anything above it moves. Add the constraints that surprised you, which the repository does
not show.

Where an investigation paused, add the reproduction, the magnitude as reported, the
hypotheses still live with their evidence, the causes ruled out, and the observation that
would tell them apart. A probe still in the working tree goes on the card with its path,
since the relay comes before debug's cleanup.

Where the current direction looks wrong to you, say so in a note rather than handing the
problem forward in silence. Write several notes where one will not hold it, and quote only
the lines of code or output the next session must read.

Before you write the resume line, read the card back and name in the reply anything above
that it does not answer.

## The resume line

Name the model and the effort level to run the session at, since he starts it by hand. The
levels are low, medium, high, xhigh, and max
(`~/.agents/skills/review-instructions/references/external-facts.md` §Harness mechanics).

Then end the reply with the line João pastes into a fresh session, in a fenced block so
it copies in one tap:

```
continue <card id>: read the card and its attached docs. next: <the first move>
```

Name a skill in that last part where one fits the move.

Outside a git repository, where no board is possible, the snapshot goes in the reply
itself, above that line.
