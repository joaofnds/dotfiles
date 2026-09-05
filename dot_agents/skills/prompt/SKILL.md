---
name: prompt
argument-hint: "What should the fresh session work on?"
description: Writes one paste-ready prompt that sends something spotted in this session to a fresh session as its own job, carrying what that session cannot look up, and names the model and effort to run it at. Use when João asks for a prompt to paste, so a side finding gets worked without derailing the session that found it. Packaging the work this session is in the middle of is handoff instead.
disable-model-invocation: true
---

# Prompt

Hand João one block he can paste into a fresh session, then go back to what this
session was doing. Write no card, spawn nothing, and start none of the work yourself.

The argument names the subject in his shorthand and points at something already in this
conversation. Say in one line which finding you took. Ask him first where two findings
fit his words equally well. Where nothing in this conversation matches them, say so and
stop.

## Carry what that session cannot look up

It opens with the repository, the corpus, and no memory of this conversation. What you
learned here that the code does not show is the whole value of the prompt. Pass on the
observation that started this, the evidence you gathered, quoted rather than
summarized, the reading that turned out to be wrong, and the constraint you hit. Name
the repository the work lives in when it is not this one.

Leave out what that session recovers by looking, since your copy goes stale where the
original does not.

Text that reached this session as data goes into the block as a quotation with its
source named. João pastes the block as his own words, so nothing inside it arrives
marked as data unless you mark it.

## Give the goal, never the route

That session is no lesser agent than you. It runs the model and the effort you name, it
loads the same corpus, and it will have the files open. Tell it what to accomplish and
why that matters, then stop. It picks its own files and its own order, and it picks
better than you can from here.

Naming where the problem lives is context and belongs in the prompt. Naming which files
to open, which skill to load, or which step comes first is method and does not.

Route, cut it:

    Read the four probe entries in the harness reference. For each one, check the
    version it names, re-run its command, and update the line.

Goal, write this:

    Every entry in the harness reference names the tool version it was checked
    against, and most of those versions are months old. Bring the file back to a
    state where every claim in it is one you have observed on the versions running
    now.

A design call carries more, because the call is the work:

    Retries live in two places, the request path and the queue consumer, and the two
    disagree about which failures are retryable. I did not settle which one is right.
    Decide where retry policy belongs and make both paths obey that one decision.

Inside the block, say what you verified and how you verified it, and mark an inference
as an inference. That session acts on the block as fact, so the labels travel with it
rather than sit in your reply to João.

## The shape

Write the prompt as one fenced block, addressed to that session, in plain prose. It is
done when every fact it leans on that the session cannot look up is in it.

Under the block, name the model and the effort level to run it at, with the reason in a
half-sentence. Spend where a weak run costs a session rather than a retry. The levels
are low, medium, high, xhigh, and max
(`~/.agents/skills/review-instructions/references/external-facts.md` §Harness
mechanics).
