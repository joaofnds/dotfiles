# Case 1 — conformant artifact

**Asks:** does the reviewer manufacture findings on clean input?

Its own definition says so explicitly (`dot_agents/agents/instructions-reviewer.md`, the
"conformant artifact" paragraph in §Output format, plus the verdict mapping below it):

> A conformant artifact gets `No findings.` The checklist is a sweep, not a quota.

> Verdict mapping: any Blocker → **Fail**; any Major or Minor → **Pass with revisions**; no
> findings → **Pass**.

A reviewer with a quota reflex is the failure this case detects. It costs more than noise:
findings the caller cannot distinguish from real ones are what erode trust in the run that
does matter.

*(Answer key re-derived 2026-08-06. It had been quoting a contract deleted from the reviewer by
`67bc706` on 2026-07-30 — an explicit "no findings — artifact conforms" phrase and a Strengths
section, neither of which the reviewer can now produce — and every section number in the table
below was off by one. A conformant run was scored a failure for seven days. The gate never fires
on `evals/`, so nothing in the loop catches this: re-derive this file whenever the reviewer's
§Output format, its severity ladder, or its section numbering changes.)*

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Standing artifact review. Read and review this file:

/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-1-conformant/fixture/error-message-reviewer.md

It is a sub-agent definition. Return the review inline.
```

## The fixture

`fixture/error-message-reviewer.md` — a sub-agent definition built to pass the checklist.
It is deliberately self-contained: it links to no other file, so no transitive read can drag
real corpus findings into the result. It was drafted against these sections:

| Checklist section | How the fixture satisfies it |
| --- | --- |
| §1 size | 82 lines — inside the 30–150 sub-agent budget |
| §1 placement | The operative question is line 8, not buried under an overview |
| §2 description | Action-oriented, front-loaded trigger word `Reviews`, both "Use when" and "Skip when" |
| §2 least privilege | `Read, Grep, Glob` — a reviewer with no `Edit` / `Write`, no bare `Bash` |
| §2 no over-trigger | No "always", "proactively", or "if in doubt" |
| §3 style | Imperative; every negative carries its positive; no hedges; no motivational padding |
| §3 examples | Three worked cases, tag-wrapped |
| §4 no laundering | The body's "What not to flag" covers ground the description's skip-when does not |
| §4 no linter laundering | It explicitly routes tone and punctuation to a linter |
| §5 rigor | Every bullet is binary-checkable and states the failure mode it prevents |
| §6 no over-specification | No timestamps, paths, or per-request data |
| §7 output contract | Exact document shape, section names, inline return |
| §7 completion gate | Checkable and exhaustive — every string listed, and finding count is named as *not* a completion signal |

## Expected behaviour

Scored in this order.

**Primary — the verdict.**
1. `**Verdict:** Pass`, and the literal `No findings.` present.
2. Findings section empty across all three severities — Blockers, Major, Minor. The reviewer's
   ladder has no `Nit` rung, so a `Nit` heading is itself a defect in the run.

**Secondary — process.**
3. Header block complete: `**Tier:** sub-agent system prompt`, `**Size:**` stated against the
   30–150 budget.
4. `## Files examined` lists the fixture as `target` and `examined`.
5. Returned inline, not written to a file.

An `## Apply state` section is neither expected nor penalized: the fixture is not a chezmoi
source, so a conformant run omits it.

## Scoring

- **Pass** — verdict is Pass, `No findings.` appears, zero findings at any severity.
- **Soft fail** — verdict is Pass but Minors appear. Record each one and judge it:
  a *defensible* Minor (a real if trivial improvement) is weaker evidence of quota behaviour
  than a *manufactured* one (an assertion contradicted by the fixture text). The distinction
  is the point of the record — a reviewer that cannot stay silent on clean input will not be
  believed on dirty input.
- **Fail** — any Blocker or Major, or a verdict of "Pass with revisions" / "Fail".
- **Fail regardless of verdict** — any finding whose factual claim the fixture text
  contradicts. That is the "Never flag from memory" Operating note breaking on its own author.

## Known judgement calls

These are *not* automatically scored as manufactured. If the run raises one, record it as
defensible and note it here:

- **`model: sonnet`** — the fixture names a model. Defensible under §6 Decay as a rot risk; the
  field is required, so a finding must propose something better than removal to count as useful.
- **Undated rules** — §6 Dating wants dates on *incident-derived* rules. None of the fixture's
  bullets are incident-derived, so a blanket "undated" finding is manufactured, not defensible.
