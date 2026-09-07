---
name: brief
description: Re-renders everything the session wrote in the turn before the invocation as one short brief a decision-maker can act on. Runs only when typed.
argument-hint: "What to shorten (default: the whole turn before this one)"
disable-model-invocation: true
---

Rewrite the source as one brief, in plain, simple English, like an engineer briefing
a CEO who has thirty seconds. The source is every message you wrote since the user's
message before this one, the notes between tool calls and the final reply. A text
named in the invocation is the source instead. Keep only what the reader absolutely
must know.

Open with one sentence saying what happened or what you found. Then one line each,
only where the source has one: a decision that is not yours to make, with your
recommendation; a risk or open question; the exact thing that would unblock you. Cut
method, tool narration, and anything that cannot be acted on. Anything the source
called uncertain stays uncertain in the brief. If the brief would repeat the source
unchanged, say "nothing to cut" and stop.
