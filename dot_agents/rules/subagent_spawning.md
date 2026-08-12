# Subagent Spawning

Governs every subagent spawn — inside a workflow loop or ad hoc.

The shapes and the fallbacks are **observed harness behavior**, not a documented mechanism:
observed on `claude-code` 2.1.220 (2026-07-27) and re-confirmed on 2.1.221 (2026-08-04, a
nine-agent fan-out plus three synchronous gates); the fan-out shape and continuation
(§Continuing a completed agent) re-confirmed on 2.1.226 (2026-08-10); they reversed
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

The selector is per spawn, not per skill: `/plan` may run both a fan-out and a producer
gate, and takes a different shape for each. Picking `false` for a fan-out is not wrong,
only serialized — accept it when you did not want the concurrency, not by default.

The count is not the selector — needing the result now is. A single agent you are not
waiting on takes `run_in_background: true`, same as a fan-out member.

Before picking either, check whether an agent you already ran holds the context — continuing
it is often cheaper than a new spawn (§Continuing a completed agent).

## Model

A spawn inherits the parent's model unless the agent definition pins one or the call
passes `model`. The parameter's own schema text says the call outranks the definition
(read in-session 2026-08-12 — documented, not probed; the probe when it matters: call a
specialist with a frontmatter pin using a different `model` and read the model off the
run).
Inheriting the top model is the expensive default; pick per mandate (2026-08-12, cost):

- `haiku` — mechanical retrieval: Explore sweeps, locating files, existence probes,
  extracting a value from a file you can name.
- `sonnet` — a bounded, checkable output you verify yourself: refutation skeptics
  (`panel-review` §4 — a refute/inconclusive verdict you re-derive from the code), deep
  dives, summarizing a subsystem.
- omit (inherit) — the mandate forms a judgment you will adopt: an unprimed review whose
  finding list sets your next step (a producer gate's reviewer, `/kaizen`'s critic), or
  analysis you would otherwise do yourself. Re-checking a report's load-bearing evidence
  (§What a report is worth) is mandatory in both branches; only the judgment-formation
  differs.

A specialist's frontmatter pin (`code-reviewer` and the other reviewers) already encodes
this choice — don't override it without a reason you can state. A continuation
(`SendMessage`, §Continuing a completed agent) runs on the model the original spawn
used; whether a resume can change it is unprobed — spawn fresh when you need a
different model.

## Continuing a completed agent

A completed agent stays continuable by the session that spawned it. A new session holds no
`agentId`, so treat continuation as session-local until a probe says otherwise — record an
`agentId` to a file, `SendMessage` it from a fresh session, and note here whether it
resolves or errors. Cross-session work travels by file (`/handoff`, `.boris/`) meanwhile. `SendMessage` to its `agentId`
— printed on the spawn result for both shapes, and repeated as a background report's task
id (read off both on 2026-08-10) — resumes it from its transcript with context intact.
Observed 2026-08-10 on 2.1.226: a finished background dive agent answered two recall
questions about its earlier reads with zero tool calls, and a quota-killed background agent
carrying ~110k tokens of reads was recovered by one follow-up message instead of a fresh
spawn re-reading everything.

Choose it when the follow-up trades on the agent's accumulated context — a clarification, a
re-check against files it already read, recovering work an error cut short. A fresh spawn is
the fallback, and stays the right shape when the point is an unprimed read —
`adversarial-review` and `/kaizen` both rest on one, so never continue an agent into either
role. The resumed run reports like any background agent: on its own notification.

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
  with a resume instruction; resume that agent and ask for the missing part. The truncated
  synchronous case is unobserved, and both resumes behind §Continuing a completed agent
  were background agents — try the resume first, fall back to a fresh spawn, and record a
  synchronous resume here when one is observed.

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
