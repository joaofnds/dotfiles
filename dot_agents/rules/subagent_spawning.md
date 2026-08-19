# Subagent Spawning

Governs every subagent spawn, inside a workflow loop or ad hoc. Everything here is
observed harness behavior, not documented mechanism, last checked on claude-code
2.1.226, except the `name` behavior, whose probe is recorded in
`instruction_external_facts.md` §Harness mechanics. Re-verify a line here after a CLI
bump before trusting it; the shapes have reversed on a release before.

## The two shapes

Two shapes, picked per spawn. Neither carries a `name`.

- **You need the result before you can continue**: one agent, un-named,
  `run_in_background: false`. The report arrives in the tool result on that turn.
- **You are launching several at once**: a fan-out: every agent un-named, each with
  `run_in_background: true`. Each report arrives on its own notification. This is still
  the shape when you have nothing to do but wait for all of them.

The selector is needing the result now, not the count: a single agent you are not
waiting on takes `run_in_background: true`, same as a fan-out member. Before picking
either, check whether an agent you already ran holds the context; continuing it is
often cheaper than a new spawn.

## Model

A spawn inherits the parent's model unless the definition pins one or the call passes
`model`; the call outranks the pin. Inheriting the top model is the expensive default;
pick per mandate:

- `haiku`: mechanical retrieval: Explore sweeps, locating files, existence probes,
  extracting a value from a file you can name.
- `sonnet`: output a named artifact settles: refutation skeptics, deep dives,
  summarizing a subsystem.
- omit (inherit): only when the mandate needs the parent's model: an unprimed review
  whose finding list sets your next step, or analysis no artifact settles.

A specialist's frontmatter pin already encodes this choice; don't override it without a
reason you can state. Re-checking a report's load-bearing evidence is unconditional at
every tier.

## Continuing a completed agent

A completed agent stays continuable by the session that spawned it: `SendMessage` to its
`agentId`, printed on the spawn result, repeated as a background report's task id,
resumes it from its transcript with context intact. Choose it when the follow-up trades
on the agent's accumulated context: a clarification, a re-check against files it already
read, recovering work an error or quota kill cut short. Spawn fresh when the point is an
unprimed read; never continue an agent into an adversarial-review or kaizen-critic
role. A resumed run reports like any background agent, on its own notification. Treat
continuation as session-local: a new session holds no `agentId`, so cross-session work
travels by file.

## Never pass `name`

A named spawn has returned only a receipt in place of its report, and the cause is
unsettled; no explanation may be restored as settled
(`instruction_external_facts.md` §Harness mechanics records what is and is not
established). Do not pass `name` on any spawn.

## Truncated reports

- **Background**: the notification carries an `<output-file>` path. Extract the final
  assistant text from it; never `Read` or `tail` the file whole: it is the subagent's
  full JSONL transcript and will overflow your context.
- **Synchronous**: the result carries a trailing `agentId` with a resume instruction.
  Resume that agent and ask for the missing part; fall back to a fresh spawn.

## What a report is worth

A sub-agent's report is a claim, not evidence. Re-run a finding's load-bearing
evidence, the grep, the Read, the count, before acting on it, and doubly so when the
finding turns into an edit. A subagent's account of itself, what shape it is, what its
prompt says, what the harness did to it, is unobservable from inside and carries no
weight at all; settle those from outside, by reading on-disk state from a different
process.
