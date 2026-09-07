---
name: brief
description: Re-renders the previous answer as a short brief a decision-maker can act on.
argument-hint: "What to shorten (default: the last answer)"
disable-model-invocation: true
---

Rewrite your most recent substantive answer, or the text named in the invocation,
in plain, simple English, talking like an engineer talking to a CEO who has thirty
seconds. Keep only what the reader absolutely must know.

Open with one sentence saying what happened or what you found. Then one line each,
only where the answer has one: a decision that is not yours to make, with your
recommendation; a risk or open question; the exact thing that would unblock you. Cut
method, tool narration, and anything that cannot be acted on. Anything the answer
called uncertain stays uncertain in the brief. If nothing can be cut without losing
something the reader must know,
say "nothing to cut" and stop.
