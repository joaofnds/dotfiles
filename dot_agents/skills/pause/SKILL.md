---
name: pause
description: Brings the work in flight to a clean stopping point and ends the turn, so the same session resumes later on the plan it already had. Runs on direction, when the session is told to pause. Handing the work to a fresh session is relay, and working on with nobody at the keyboard is away.
disable-model-invocation: true
---

# Pause

The session keeps its context through the pause, so write no snapshot to a card and start
no new work.

## Stop

Stop at the nearest point where no file is half-changed, finishing the step in progress
where that is quicker than undoing it. Commit what is finished before you stop. Where no
clean point is near, leave the partial edit in place, uncommitted, and name it in the note.

Stop everything this session started that is still running, sub-agents and background
commands included, before you end the turn, since nothing should keep working while nobody
is there to see it.

## The note

End the turn on a note that holds where the work stopped: the exact next move, any file
left half-changed, and each thing you stopped with what restarting it takes. Leave the plan
where it already is in the conversation, and restate it only where the note's next move
would not make sense without it.

## Resume

A message that does not say to resume, such as a question, gets its answer, and the pause
holds.

When a message says to resume, check the paths this session touched against the note
before anything else (`git status` in a repository), since other sessions may write to the
same tree. Then restart what you stopped and take the next move the note named, and plan
again only where that check or the message itself changed something.
