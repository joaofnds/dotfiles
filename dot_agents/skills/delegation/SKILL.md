---
name: delegation
description: Governs spawning and continuing sub-agents, the read-only review brief, the model choice per mandate, recovering a truncated report, and what a sub-agent's report is worth. Use before spawning a sub-agent or acting on one's report.
---

# Delegation

Work that is independent and sizeable goes to a sub-agent while you keep working.
Before spawning, check whether an agent you already ran holds the context;
continuing it is often cheaper than a fresh spawn.

## Native dispatch

Use this host's native child dispatch and wait operations. When the next action
needs the report, wait on the returned handle. Otherwise keep working and collect
the report through the host's supported notification or wait route. Retain each
child handle and its result location. A launch receipt is not a finished report.

Give a fresh child the shared role body through its native role adapter, or include
the body in its brief when the host accepts only a general child. Independent
reviewers and advisors start without the author's conversation history. Include the
session's Codex provider policy in every Codex child brief.
A denied or unavailable native child leaves required independent work incomplete.
Continue other permitted work in the parent and report the missing capability,
without switching providers or substituting the author's judgment for review.

## A review spawn is read-only

Every review, refutation, or audit brief tells the child to return findings without
editing files or running mutating commands. Name any exception for required test
commands in that brief.

## Model

An iterate stage receives an `ITERATE_ROLE_SELECTION` receipt containing the
requested stage selection and raw role overrides. Read the shared role definition
for its assigned effort before dispatch. A review's axis assignment replaces that
effort. Reviewer variants share the reviewer override.

Start with `requestedAgent` and replace its effort with the assignment, if present.
Replace that entire selection with the role's agent tuple when supplied, including
removing effort when the tuple omits it. Apply role model and effort fields last.
Preserve any target-supported assignment through this order. Omitted fields use
the native entry point's configured defaults, which can include role metadata.
Record omitted requests as omitted and effective settings only when observed.

Outside iterate, inherit this host's provider and model unless the typed direction
selects another. Keep assigned role effort unless explicitly overridden. Where the
selection is open, use a smaller model for mechanical retrieval, a middle model for
a bounded analysis, and the parent's model for an independent judgment. Record the
choice and its basis. Shared metadata never selects another provider.

Pass the requested model and effort through supported native fields. If the native
API cannot express an exact requested selection, report it unavailable and leave
required work incomplete. Do not guess an alias or drop effort. Keep native role
adapters free of pins that outrank the request. Record requested settings, native
child ID, actual provider and observed model/effort separately. Cross-provider
selection requires typed authority or a selection recorded from it. The Codex
provider policy overrides conflicting shared pins and forbids automatic fallback.

## Continuing an agent

Continue a completed agent for clarification or recovery within the same role when
the harness supports it. Refresh changed code, card state, and user steering before
it acts. Use the runner's resume policy for stage sessions. Start fresh when context
is stale or continuation is unsupported. An independent assessment needs a fresh
reviewer, so never resume the author into that role.

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
