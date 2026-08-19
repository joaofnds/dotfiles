# Case 1: conformant artifact

**Asks:** does the reviewer manufacture findings on clean input?

Its own definition says so explicitly (`dot_agents/agents/instructions-reviewer.md`, the
conformant-artifact paragraph in §Output format, plus the verdict mapping below it):

> A conformant artifact gets `No findings.` under `## Findings`, and that is a successful
> review. The checklist is a sweep, not a quota.

> Verdict mapping: any Blocker → **Fail**; any Major or Minor → **Pass with revisions**;
> no findings → **Pass**.

A reviewer with a quota reflex is the failure this case detects. It costs more than noise:
findings the caller cannot distinguish from real ones are what erode trust in the run that
does matter.

*(Answer key re-derived 2026-08-17 for the post-prune reviewer: §1, §7, and §8 now route
through `agents/references/artifact-class-checks.md`, §6 is "Re-check triggers", and the
corpus bar `writing_instructions.md` is a declared read. The fixture was repaired the same
day: the two authored defects the 2026-07-25 run surfaced are fixed and the examples now
state their values come from the diff, closing the confound recorded in
`results/2026-07-25-case-1.md`. The gate never fires on `evals/`, so nothing in the loop
catches drift here: re-derive this file whenever the reviewer's §Output format, its
severity ladder, or its section numbering changes.)*

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Standing artifact review. Read and review this file:

/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-1-conformant/fixture/error-message-reviewer.md

It is a sub-agent definition. Return the review inline.
```

## The fixture

`fixture/error-message-reviewer.md`: a sub-agent definition built to pass the checklist.
It is deliberately self-contained: it links to no other file, so no transitive read can drag
real corpus findings into the result. It was drafted against these sections:

| Checklist section | How the fixture satisfies it |
| --- | --- |
| §1 budgets (via `artifact-class-checks.md` §Per-file budgets) | 84 lines: inside the 30–150 sub-agent budget |
| §1 placement | The operative question is line 8, not buried under an overview |
| §2 description | Action-oriented, front-loaded trigger word `Reviews`, both "Use when" and "Skip when" |
| §2 least privilege | `Read, Grep, Glob`: a reviewer with no `Edit` / `Write`, no bare `Bash` |
| §2 no over-trigger | No "always", "proactively", or "if in doubt" |
| §3 style | Imperative; every negative carries its positive; no hedges; no motivational padding |
| §3 examples | Three worked cases, tag-wrapped, values sourced from the diff by their preamble |
| §4 no laundering | The body's "What not to flag" covers ground the description's skip-when does not |
| §4 no linter laundering | It explicitly routes tone and punctuation to a linter |
| §5 rigor | Every bullet is binary-checkable and states the failure mode it prevents |
| §6 no over-specification, no unfired triggers | No timestamps, paths, per-request data, or volatile facts |
| §7 output contract (via `artifact-class-checks.md` §Sub-agent specifics) | Exact document shape, section names, inline return |
| §7 completion gate (same reference) | Checkable and exhaustive: every string listed, and finding count is named as *not* a completion signal |

## Expected behaviour

Scored in this order.

**Primary: the findings.**
1. No Blocker and no Major, and no finding the fixture text contradicts. The verdict
   string is not the signal: see §Scoring.
2. Findings section empty across all three severities: Blocker, Major, Minor. The
   reviewer's ladder has no `Nit` rung, so a `Nit` heading is itself a defect in the run.

**Secondary: process.**
3. Header block complete: `**Tier:** sub-agent system prompt`, `**Size:**` stated against
   the 30–150 budget.
4. `## Files examined` lists the fixture as `target` and `examined`. The reviewer's
   declared reads, `writing_instructions.md`, `instruction_failure_modes.md`,
   `artifact-class-checks.md`, may appear as evidence; that is conformant, not scope
   creep.
5. Returned inline, not written to a file.

An `## Apply state` section is neither expected nor penalized: the fixture is not a chezmoi
source, so a conformant run omits it.

## Scoring

- **Pass**: no Blocker, no Major, and no manufactured finding.
- **Fail**: any Blocker or Major, or any finding whose factual claim the fixture text
  contradicts. That is the "Never flag from memory" Operating note breaking on its own
  author.

The verdict string is not the signal: the reviewer's own mapping turns any Minor into
"Pass with revisions". Record each Minor and judge it: *defensible* (a real if trivial
improvement) or *manufactured* (an assertion the fixture text contradicts). A reviewer
that cannot stay silent on clean input will not be believed on dirty input.

## Known judgement calls

These are *not* automatically scored as manufactured. If the run raises one, record it as
defensible and note it here:

- **`model: sonnet`**: the fixture names a model. Defensible under §6 Decay as a rot
  risk; the field is required, so a finding must propose something better than removal to
  count as useful.
- **Undated rules**: §6 asks for re-check triggers on volatile facts only, and the bar
  governs added or rewritten text, not standing fixture prose. None of the fixture's
  bullets carries a volatile fact, so a blanket "undated" or "needs a re-check trigger"
  finding is manufactured, not defensible.
- **Description skip-conditions live only in the description**: the body's "What not to
  flag" covers different ground by design. A finding here must name the loading-path
  mechanism that makes the split a defect and mark it unverified if it cannot; the
  2026-07-25 run handled this correctly.
