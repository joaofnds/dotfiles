---
name: adversarial-review
description: >
  Independent, unprimed review of work you produced THIS session — the brief withholds
  your conclusions so the reviewer reaches its own verdict; findings are relayed in its
  words. Invoke on "adversarial review", "red-team this", "unbiased second opinion on
  what I just did". For code you did NOT write (PR review, external audit), recommend
  /review or /code-review to the user instead — both are user-invoked only. Skip for
  a substantial pre-merge unit needing all five axes → /panel-review.
---

# Adversarial Review

**Wrong skill if:** reviewing code you did NOT write this session (PR review, external audit) → recommend `/review` or `/code-review` to the user; neither can be invoked by an agent. A substantial pre-merge unit needing all five axes → `/panel-review`.

Spawn an independent agent to review work done this session — and construct the
brief so it reaches its own verdict instead of ratifying yours.

This applies to any artifact you produced this session — code, but also reasoning
docs (a spec, an options survey, a plan). For a doc there's nothing to run, so the
"how to verify" mandate below becomes: red-team the reasoning — unstated assumptions,
scope gaps, an unquestioned premise, a conclusion that doesn't follow from what's
stated. (Producer skills call this gate automatically — see "As a producer gate".)

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
- **The mandate** — "Assume there are problems and find them. Default to skeptical. Cite
  `file:line` and give a concrete repro or counterexample for each finding; drop anything
  you can't substantiate by a command or by a stated argument. Label each finding
  **verified by command** or **reasoning only**, and name the command. Rank each finding
  Blocker / Major / Minor — Blocker: the artifact is wrong or unsafe as written; Major: it
  changes the approach, the evidence, or what the next stage will do; Minor: bounded cost.
  If a severity has nothing in it, say so. If the work is sound as written, say that
  plainly — a clean report is a valid result, not a failure to look."

  Include that ladder only in a **general** agent's brief. `code-reviewer`,
  `testing-reviewer` and `instructions-reviewer` rank on their own — don't restate this one
  at them. Either way a Blocker or Major here always names a defect, so each takes a
  disposition and never the Advisory route; a Minor may take it
  (`~/.agents/rules/reporting_findings.md` §Reading a reviewer's severity ladder — edit
  both).

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
reviewer when one fits: `code-reviewer` for code; `instructions-reviewer` only for
instruction artifacts (rules, skills, agent definitions, CLAUDE.md/AGENTS.md, output
styles, slash commands, hook-injected text — its own description enumerates the set —
never a `.boris/` work product, however imperative it reads: a spec, plan, or diagnosis
takes a general agent, with `.boris/CONTEXT.md` the one exception, which
`instructions-reviewer` owns); otherwise a general agent carrying this brief.

## As a producer gate

`/diagnose` and `/plan` end by running this skill on their own draft doc — each names
its artifact-specific mandate aims; everything else about the gate lives here, once.
(`/discuss`, `/research`, and `/grill` dropped it 2026-08-12 for cost: their artifacts
are reread and stress-tested by the next stage, and `/plan`'s gate covers the chain's
last ratified artifact — a skipped stage means no independent check, and the producing
skill says so out loud.)

- It fires when the artifact ratifies something expensive to reverse — an approach, a
  lean, a plan. Skipping must be said out loud, never done silently.
- Fold or explicitly defer each material finding before calling it done — a deferral takes
  a disposition (`~/.agents/rules/reporting_findings.md`) and closes the finding for the
  loop's purpose, never for the report; a finding that only restates what's already written
  isn't material. One that invalidates the artifact's core (the lean, the approach) reopens
  the producing stage; don't edit around it.
- **Probe the fix before the artifact is called done.** An edit answering a finding that
  named a compile error, a command, a count or a `file:line` gets that same probe re-run
  against the new text; a scratch program in a temp dir is not the code the producing skill
  forbade. Name each fix you probed and its command. (2026-08-06: six consecutive gate
  rounds whose worst finding was the previous round's unprobed repair.)
- **The gate is one round.** Fold or defer the findings, probe the fixes, then decide out
  loud: send the revised artifact back for one more round, or proceed. Rerun only when a
  fix changed a claim about how code, tooling, or the platform behaves, or repaired a
  Blocker in a way its probe cannot confirm — name the reason. One rerun at most; after
  it, proceed regardless: give every open defect a disposition
  (`~/.agents/rules/reporting_findings.md`), list every open advisory, and hand them to
  the user. A finding that reopens the producing stage ends this gate — the redrafted
  artifact gets its own single round; tell the user why. If the user asks to run until the
  report is clean, say first what the residue will look like — a skeptical reviewer on a
  long prose artifact does not return an empty list. Run further rounds only if they still
  ask. Do not reintroduce a multi-round loop on your own initiative, absent evidence that
  rounds converge.
- If the gate catches the same class of gap across artifacts — or the same class in two
  rounds on one artifact — the producing skill or your own revision loop is defective. Say
  so to the user in that round, with the two instances quoted, before fixing the doc again.

## Relay honestly

Report findings in the reviewer's words — quote them, don't summarize; condensing
is where softening enters.

Format, worst first:

> **[Severity] [Blocking | Decide | Noted]** `file:line` — <the reviewer's finding, verbatim or near-verbatim>

The disposition is yours, not the reviewer's, and it never edits the reviewer's words
(`~/.agents/rules/reporting_findings.md`). A finding that names no defect takes that
file's **Advisory** route instead of a disposition.

Every finding gets listed, including the ones that invalidate what you just did —
no pre-arguing them away, no burying them under defenses. If you have a response,
put it in a separate section clearly marked as yours, after the findings:

> **My response** — <your view, kept apart from the reviewer's words>

A finding that kills the approach gets stated plainly first, before any defense.
