---
name: brief
description: Re-renders everything the session wrote in the turn before the invocation as one short brief a decision-maker can act on. Runs only when typed.
argument-hint: "What to shorten (default: the whole turn before this one)"
disable-model-invocation: true
---

Rewrite everything you wrote since the user's previous message, notes and reply
together, as one brief for a CEO who has thirty seconds. A text named in the invocation
is the source instead.

One sentence on what happened. Then one line each, only where the source has one: a
decision that is not yours, with your recommendation; a risk or open question; the
exact thing that would unblock you. Cut method, tool narration, and anything the reader
cannot act on. What the source called uncertain stays uncertain. If the brief would
repeat the source unchanged, say "nothing to cut" and stop.
