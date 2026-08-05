# Subagent Spawning

Governs every subagent spawn — inside a workflow loop or ad hoc.

The shapes and the fallbacks are **observed harness behavior**, not a documented mechanism:
observed on `claude-code` 2.1.220 (2026-07-27) and re-confirmed on 2.1.221 (2026-08-04, a
nine-agent fan-out plus three synchronous gates), not re-checked at 2.1.222; they reversed
once already — 2.1.187
returned the full report from a named spawn, 2.1.220 returned only a receipt. §Why no `name`
carries no settled explanation: the retraction and the two open candidates are in
`instruction_external_facts.md` §1, 2026-08-05 re-verification, and that section's schema observation is
unprobed. Re-verify every line here after a CLI bump rather than trusting it.

## The two shapes

Two shapes, picked per spawn: one agent you are waiting on, or several launched at once.
**Neither carries a `name`.**

- **You need the result before you can continue** — one agent, un-named,
  `run_in_background: false`. The report arrives in the tool result on that turn. A
  producer gate (`adversarial-review/SKILL.md` §As a producer gate) is this shape at its
  default of one reviewer; scaled up for high-stakes work (its §Scale to stakes) it is a
  fan-out.
- **You are launching several at once** — a fan-out: every agent un-named, each with
  `run_in_background: true`, which is what has been observed to produce concurrency here.
  Each report arrives on its own notification. This is still the shape when you have
  nothing to do but wait for all of them — a panel of reviewers is a fan-out even though
  the next step needs every verdict.

The selector is per spawn, not per skill: `/research` may run both a fan-out and a producer
gate, and takes a different shape for each. Picking `false` for a fan-out is not wrong,
only serialized — accept it when you did not want the concurrency, not by default.

The count is not the selector — needing the result now is. A single agent you are not
waiting on takes `run_in_background: true`, same as a fan-out member.

## Why no `name`

**Do not pass `name`.** On 2.1.222 with agent teams off the `Agent` tool appears to expose no
`name` property (`description`, `isolation`, `model`, `prompt`, `run_in_background`,
`subagent_type`) — read from inside the session, so unsettled: the probe is a spawn with
`name` set with the team state established first (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
absent from `~/.claude/settings.json` and unexported), recording whether the call errors as an
unknown parameter — **the user's probe to run, not yours**. Until it runs, treat the rule as
live rather than unreachable.

The reason recorded here through 2026-08-04 — that `name` selects an agent-team teammate — is
retracted, not disproved: `instruction_external_facts.md` §1, 2026-08-05 re-verification, carries what the
sub-agents reference does and does not settle, and why the 2.1.221 probe cannot isolate the
cause. Do not restore either explanation as settled. Memory `agent-teams-abandoned` (dotfiles
project store — unreachable from another project) carries why teams were tried and dropped.

## Truncated reports

- **Background** — the notification carries an `<output-file>` path. Extract the final
  assistant text from it. Never `Read` or `tail` the file whole: it is the subagent's
  full JSONL transcript and will overflow your context.
- **Synchronous** — there is no notification. The result carries a trailing `agentId`
  with a resume instruction; resume that agent and ask for the missing part. Untested —
  no truncated synchronous Agent result has been observed.

## What a report is worth

A sub-agent's report is a **claim, not evidence** (`engineering_judgment.md` §6, borrowed
authority). Re-run a finding's load-bearing evidence — the grep, the Read, the count —
before acting on it, and doubly so when the finding turns into an edit. Observed
2026-08-04: across eleven agent reports in one session, four carried `file:line` citations
that were shifted or wrong while the underlying claim held, and one asserted a defect that
a two-second grep disproved.

A subagent's account of **itself** — what shape it is, what its prompt says, what the harness
did to it — is unobservable from inside and carries no weight at all. Settle those from
outside, by reading on-disk state from a different process. Observed 2026-08-05: a nested
session reported "the teammate ran"; it was a subagent describing itself, and that claim was
published into this file before an outside probe disproved it.
