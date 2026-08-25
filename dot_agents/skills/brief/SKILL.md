---
name: brief
description: Re-render the previous answer as a short brief a decision-maker can act on. Invoke when a reply ran long or buried the point ("brief", "tldr", "wall of text").
disable-model-invocation: true
---

# Brief

Rewrite your most recent substantive answer, or the text the user points at, as a brief.
The brief becomes the reply of record: the user acts on it alone and never re-reads the
long version, so anything the user must know goes in it, however short it has to be
stated.

## Shape

These parts, in this order, each present only when it has content:

1. **Verdict**: what happened, what you found, or what you recommend, in one sentence.
2. **Findings and risks**: one line each, saying what it is, where it is, and what it
   costs. Compress by grouping, never by dropping.
3. **The ask**: what you need from the user, one line each, stated so they can act
   without asking a follow-up: a decision between named options with your
   recommendation, or the exact command, access, or answer that unblocks you. When you
   need nothing, say so, so the absence of an ask is a statement, not an omission.
4. **Evidence**, verbatim: a `Checked:` line, a `Rejected:` line, the commands you
   ran with their outcomes, and the probe behind any claim that something is missing.
   These stay in full because they are how the user checks you.

## What gets cut

Method, tool narration, self-assessment, and anything the user cannot act on. Hold back
the reasoning behind each finding; close with one line offering it ("reasoning on
request").

## Guardrails

- Plain words and short sentences. No internal shorthand: no rule filenames, agent
  names, generated ids, or `file:line` pointers. The test: would
  the user have to open a file to parse the sentence? An identifier that is the address
  the user needs to check your work stays, glossed on first use.
- Never add certainty the long answer did not have: a hedge that marks a real unknown
  survives as a one-line risk.
- When you are blocked, the ask names what the user can do, never what you will try
  next.

Mirror mark: the shorthand test, the finding-line format, the held-back reasoning, and
the stay-in-full list also stand in `answer-first.md` §Write to the decision-maker,
§Never leave a finding out, and §Route every kind of content to one place; the
`Checked:` and `Rejected:` labels are set by `AGENTS.md` §Solution decisions: mandatory
visible artifact; edit together.
