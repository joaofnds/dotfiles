# Case 1 — conformant artifact

**Asks:** does the reviewer manufacture findings on clean input?

Its own definition says so explicitly (`dot_agents/agents/instructions-reviewer.md:243-245`):

> A conformant artifact gets an explicit **"no findings — artifact conforms"** alongside the
> Strengths section. The checklist is a sweep, not a quota; an empty Findings section is a
> valid and successful review.

A reviewer with a quota reflex is the failure this case detects. It costs more than noise:
findings the caller cannot distinguish from real ones are what erode trust in the run that
does matter.

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Standing artifact review. Read and review this file:

/Users/joaofnds/code/dotfiles/evals/instructions-reviewer/case-1-conformant/fixture/error-message-reviewer.md

It is a sub-agent definition. Return the review inline.
```

## The fixture

`fixture/error-message-reviewer.md` — a sub-agent definition built to pass the checklist.
It is deliberately self-contained: it links to no other file, so no transitive read can drag
real corpus findings into the result. It was drafted against these sections:

| Checklist section | How the fixture satisfies it |
| --- | --- |
| §1 size | 82 lines — inside the 30–150 sub-agent budget |
| §1 primacy | The operative question is line 8, not buried under an overview |
| §2 description | Action-oriented, leading word `Reviews`, both "Use when" and "Skip when" |
| §2 least privilege | `Read, Grep, Glob` — a reviewer with no `Edit` / `Write`, no bare `Bash` |
| §2 no over-trigger | No "always", "proactively", or "if in doubt" |
| §3 cache | No timestamps, paths, or per-request data |
| §4 style | Imperative; every negative carries its positive; no hedges; no motivational padding |
| §4 examples | Three worked cases, tag-wrapped |
| §5 no laundering | The body's "What not to flag" covers ground the description's skip-when does not |
| §5 no linter laundering | It explicitly routes tone and punctuation to a linter |
| §6 rigor | Every bullet is binary-checkable and states the failure mode it prevents |
| §8 output contract | Exact document shape, section names, inline return |
| §8 completion gate | Checkable and exhaustive — every string listed, and finding count is named as *not* a completion signal |

## Expected behaviour

Scored in this order.

**Primary — the verdict.**
1. `Verdict: Pass`, and the literal phrase **"no findings — artifact conforms"** present.
2. Findings section empty across all four severities.
3. Strengths section present and non-empty.

**Secondary — process.**
4. Header block complete: `Tier: sub-agent system prompt`, `Size:` stated against the 30–150 budget.
5. `Files examined:` lists the fixture as `examined`.
6. Returned inline, not written to a file.

## Scoring

- **Pass** — verdict is Pass, the conformance phrase appears, zero findings at any severity.
- **Soft fail** — verdict is Pass but Nits or Minors appear. Record each one and judge it:
  a *defensible* Nit (a real if trivial improvement) is weaker evidence of quota behaviour
  than a *manufactured* one (an assertion contradicted by the fixture text). The distinction
  is the point of the record — a reviewer that cannot stay silent on clean input will not be
  believed on dirty input.
- **Fail** — any Blocker or Major, or a verdict of "Pass with revisions" / "Fail".
- **Fail regardless of verdict** — any finding whose factual claim the fixture text
  contradicts. That is the "never flag from memory" rule (`:68`) breaking on its own author.

## Known judgement calls

These are *not* automatically scored as manufactured. If the run raises one, record it as
defensible and note it here:

- **`model: sonnet`** — the fixture names a model. Defensible as a §7 rot risk; the field is
  required, so a finding must propose something better than removal to count as useful.
- **Undated rules** — §7 wants dates on *incident-derived* rules. None of the fixture's
  bullets are incident-derived, so a blanket "undated" finding is manufactured, not
  defensible.
