---
name: loose-ends
description: Finds the work, findings, and deferrals a session would lose if archived, gives each one a home outside the conversation, and ends on a verdict whether the session can be archived. Runs on direction, before the session is archived. Work a fresh session will resume is relay, and work this same session resumes later is pause.
disable-model-invocation: true
---

# Loose ends

Nobody reopens an archived session, so whatever lives only in its conversation is
lost, such as an uncommitted edit, a deferred step, an unanswered question, or a fact
the next session needs. Check the state of the work in tool output from this turn,
because the session's own account of its work is what this check exists to test.

## Find the loose ends

Run each probe and keep every item it finds:

- Run `git status` in every repository this session wrote to, and keep only the
  paths this session changed, since other sessions write to the same trees.
- List what this session started that may still be running: background commands,
  sub-agents, and other sessions.
- Reread the conversation from the first request for anything left open: a plan step
  still pending, a "later" or "follow-up", a question that got no answer, a check you
  skipped, and a claim of done you never observed. Where part of it was summarized,
  grep the session's transcript for what the summary dropped
  (`~/.agents/skills/review-instructions/references/external-facts.md` §Harness
  mechanics).
- In the same reread, find what a future session would need that no file holds: a
  correction you were given, an approach that was confirmed, a surprise about a tool,
  and a decision you took on your own.

## Close each one

Give every item exactly one home:

- Finish it now where the direction asked for it, nothing said since holds it back,
  and it fits in this turn.
- Stop a running thing nothing needs, and wait for one whose result is part of the
  work.
- Capture work that does not fit under the board rules' Capture and admission.
- Save what a future session needs to know to memory or to the card it concerns.
- Put in the reply what only the user can settle, such as a decision, a claim you
  could not verify, or an action the hard lines reserve.

## The verdict

Open the reply with the verdict, archive or not yet, and what blocks it. Give the
verdict archive only when the reply asks nothing and every item sits in a commit, on
a card, or in memory. Name each open item once, as a question where the user must
settle it and otherwise as a clause saying where it went. Leave out the probes that
found nothing and the paths you left alone.
