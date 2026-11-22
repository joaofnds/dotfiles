---
name: unpause
description: Picks up the work this session paused, checks what changed while it waited, and takes the next move its pause note named. Runs on direction, when the session is told to resume. Work handed to a fresh session resumes from its relay line instead.
disable-model-invocation: true
---

# Unpause

## Find the note

The pause note is the message that ended the pause turn, naming the next move, or this
session's own note on the card where the pause wrote one there. Where you find
neither, rebuild the state from the card and from `git log` and `git status`, and say
in the reply what you could not recover, since a guessed next move reads the same as a
recalled one.

## Check before anything else

Other sessions write to the same tree, and jobs the note left waiting have moved on
since. Before you restart, edit, or run anything:

1. Compare the paths this session touched with the state you left them in, as the note
   and your context describe it, using `git status` and `git log` in a repository and
   the files themselves outside one.
2. Read the outcome of each thing the note left waiting, such as a check's log, a CI
   run, or a sub-agent's report, never only that it ended. Where one is still running,
   say so, and hold any move that depends on its outcome until it ends.

## Go on

Restart each thing the note says was stopped. A stopped sub-agent's context is gone,
so launch it fresh with its original brief, after the check above has shown what it
left in the tree. Then take the next move the note named. Plan again only where the
check or the message that resumed you changed something, and say in the reply what
changed.

Resuming answers none of the questions the note left open, and it is no direction for
an action the hard lines reserve, even where the note names that action as the next
move.
