---
name: delegation
description: Governs spawning and continuing sub-agents, the read-only review brief, the model choice per mandate, recovering a truncated report, and what a sub-agent's report is worth. Use before spawning a sub-agent or acting on one's report.
---

# Delegation

Work that is independent and sizeable goes to a sub-agent while you keep working.
Before spawning, check whether an agent you already ran holds the context;
continuing it is often cheaper than a fresh spawn.

## The two shapes

Two shapes, picked per spawn. When you need the result before you can continue, spawn
one agent in the foreground and its report arrives in that turn's tool result.
Otherwise spawn in the background, whether it is one agent or a fan-out of several,
and each report arrives on its own notification. The selector is needing the result
now, not the count: a single agent you are not waiting on runs in the background,
same as a fan-out member.

## A review spawn is read-only

A general agent inherits the editing and shell tools, and the spawn call has no
tools field, so the brief is the only lever. A review, refutation, or audit brief
says in words that the agent makes no edits and runs no mutating commands, and
returns findings. The `reviewer` agent carries a read-only tool set of its own and
needs no such clause, except where the review is meant to run tests.

## Model

A spawn inherits the parent's model unless the definition pins one or the call
passes it, and the call outranks the pin. Inheriting the top model is the
expensive default. Pick by mandate: the small fast model for mechanical retrieval,
sweeps, locating files, existence probes, extracting a value from a file you can
name; the middle model where a named artifact settles the work, a deep dive or a
subsystem summary; and the parent's model only where the mandate needs it, an
unprimed review whose findings set your next step, or analysis no artifact
settles. A definition's pin already encodes this choice, so override it only for a
reason you can state.

## Continuing an agent

A completed agent stays continuable by the session that spawned it, from the id its
result carried, resuming with its context intact. Choose that when the follow-up
trades on what the agent already read: a clarification, a re-check, recovering work
an error cut short. Spawn fresh when the point is an unprimed read, and never
continue an agent into a role that needs one. Continuation is session-local, so
cross-session work travels by file.

Never pass a name on a spawn. A named spawn has returned a receipt in place of its
report, and the cause is unsettled.

## Recovering a truncated report

A background agent's notification carries the path to its output file. Extract the
final assistant text from it, and never read or tail the file whole: it is the full
transcript and it will overflow your context. A synchronous result that ends mid
report carries the agent's id, so resume it and ask for the missing part, falling
back to a fresh spawn.

## What a report is worth

A sub-agent's report is a claim, not evidence. Re-run a finding's load-bearing
evidence, the grep, the read, the count, before acting on it, and doubly so when
the finding becomes an edit. A sub-agent's account of itself, what shape it is,
what its prompt says, what the harness did to it, is unobservable from inside and
carries no weight at all. Settle those from outside, by reading on-disk state from
a different process.
