---
name: brief
description: Re-render the previous answer as a short brief a decision-maker can act on.
argument-hint: "What to shorten (default: the last answer)"
disable-model-invocation: true
---

# Brief

Rewrite your most recent substantive answer, or the text the user points at, as a brief.
The user acts on the brief alone: keep everything they must know, and add nothing the
answer does not already carry. When you cannot cut anything without dropping something
the user must know, say "nothing to cut" and stop.

## Shape

These parts, in this order, each present only when the answer has content for it, except
the ask. The verdict leads, an exception to the reply's verdict-last ordering
(`~/.claude/output-styles/verdict-last.md` §Answer last, and stop).

1. **Verdict**: what happened, what you found, or what you recommend, in one sentence.
2. **Findings, risks, and assumptions**: one line each, saying what it is, where it is,
   and what it costs. Keep any grouping the answer already made; group further to
   compress, never drop. A finding already fixed, needing no decision from the user, may
   be aggregated into a count ("eighteen problems, all fixed"), an exception to
   `~/.claude/output-styles/verdict-last.md` §Never leave a finding out; anything
   unresolved, every risk, and every caveat, disagreement, or assumption you acted on,
   keeps its own line.
3. **The ask**: what you need from the user, one line each, stated so they can act
   without asking a follow-up: a decision between named options with your
   recommendation, or the exact command, access, or answer that unblocks you. When you
   need nothing, say so, so the absence of an ask is a statement, not an omission.

## What gets cut

Method, tool narration, self-assessment, and anything the user cannot act on, unless the
answer already carried it as evidence: a `Checked:` line, a `Rejected:` line, the
commands you ran with their outcomes, or the probe behind a claim that something is
missing. Those stay verbatim, after the ask. Hold back the reasoning behind each
finding; close with one line offering it ("reasoning on request").

## Guardrails

- Never add certainty the long answer did not have: a hedge that marks a real unknown
  survives as a one-line risk.
- When you are blocked, the ask names what the user can do, never what you will try
  next.

Mirror mark: the finding-line format, the held-back reasoning, and the stay-in-full list
are mirrored in `~/.claude/output-styles/verdict-last.md` §Write to the decision-maker,
§Never leave a finding out, and §Route every kind of content to one place, whose §Answer
last, and stop is the ordering rule §Shape excepts; edit together. The `Checked:` and
`Rejected:` labels are set by `~/.agents/AGENTS.md` §Solution decisions: mandatory
visible artifact.
