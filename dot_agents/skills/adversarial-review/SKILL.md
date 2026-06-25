---
name: adversarial-review
description: >
  Get an independent agent to adversarially review work done this session, with a
  brief built so it reaches its own verdict instead of ratifying yours — then relay
  the findings honestly. Invoke on "adversarial review", "red-team this", "get an
  unbiased second opinion on what I just did", or whenever you want your own
  just-finished work checked without priming the reviewer. Skip this skill for code
  you did NOT write (PR review, external audit) — use /review or /code-review for
  that. This is specifically for work you produced this session, where your own
  bias is the risk being controlled for.
metadata:
  trigger: Work was just produced this session; you want an independent, unbiased check before trusting it
---

# Adversarial Review

Spawn an independent agent to review work done this session — and construct the
brief so it reaches its own verdict instead of ratifying yours. The value is in
what you withhold: the moment you hand the reviewer your conclusions, you've
taught it the answer you want to hear.

## Send the reviewer

- **The goal / requirements** — what the work was meant to achieve, in the user's
  terms. Without the spec a reviewer can only judge style, not whether you solved
  the right problem. If no goal was stated this session, ask the user for it before
  building the brief — don't invent one.
- **The artifact as primary source** — the diff, the files, the `file:line`
  ranges. Point at the actual code or text and let it read for itself; don't
  summarize it.
- **How to verify** — the test command and how to run it. Tell it to run things,
  not to trust that they pass.
- **The mandate** — "Assume there are problems and find them. Default to skeptical.
  Cite `file:line` and give a concrete repro or counterexample for each finding;
  drop anything you can't substantiate."

## Withhold — this is the point

- Your own assessment: "I think this is correct," "tests pass," "the tricky part
  is handled." Anything that says where the answer lands.
- Which parts you're confident in or already checked — that steers the reviewer
  away from exactly where your blind spots are.
- Reassuring or leading framing. State the task neutrally.

Say it in the brief: "This brief deliberately contains no assessment of
correctness — form your own from the code."

## Scale to stakes

One reviewer by default. For high-stakes or wide-blast-radius work, spawn two or
three **independently** — same neutral brief, none sees the others — and union
their findings; a single reviewer has its own blind spots. Route to a specialized
reviewer when one fits (`code-reviewer` for code, `instructions-reviewer` for
instruction files); otherwise a general agent carrying this brief.

## Relay honestly

Report findings in the reviewer's words — quote them, don't summarize. Paraphrase
is how bias leaks back in: you "honestly" condense and unconsciously soften the
finding that threatens your work. Quoting closes that channel.

Format, worst first:

> **[Severity]** `file:line` — <the reviewer's finding, verbatim or near-verbatim>

Every finding gets listed, including the ones that invalidate what you just did —
no pre-arguing them away, no burying them under defenses. If you have a response,
put it in a separate section clearly marked as yours, after the findings:

> **My response** — <your view, kept apart from the reviewer's words>

A finding that kills the approach gets stated plainly first, before any defense.
