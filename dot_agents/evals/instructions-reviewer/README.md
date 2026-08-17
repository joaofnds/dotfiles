# Evals — `instructions-reviewer`

Known-answer test cases for `dot_agents/agents/instructions-reviewer.md`.

## Why these exist

That agent gates the quality of every other prompt in this corpus, and until 2026-07-25 it
had never been run against an input whose correct output was known in advance. Two things
that happened make the gap concrete:

- It asserted four wrong facts about Claude Code mechanics for months. A web fetch caught
  them; no internal check did. (See the `harness-facts-decay-in-instructions` memory.)
- Three consecutive review rounds each introduced roughly four new defects into the round
  before. Review alone was not converging, so more review was not the fix.

Both are the same shape: an unmeasured reviewer, trusted because it sounds authoritative.
These cases replace the trust with a score.

## Layout

```
case-1-conformant/       clean input — does it manufacture findings?
case-2-planted-defects/  known defects — does it find them?
case-3-bare-path/        bare path, no diff — does the standing-artifact mode work?
results/                 one file per run: YYYY-MM-DD-case-N.md
```

Each `CASE.md` holds the exact invocation prompt, the expected behaviour, and the scoring
rule. Cases 1 and 2 carry a fixture; case 3 targets a real corpus file on purpose.

This directory sits under `dot_agents/` to stay beside what it grades, but it is not corpus.
`scripts/check-corpus-budgets.sh` excludes it from the line totals, and a corpus-wide sweep
should skip it too: the case-2 fixture is a deliberately defective agent definition, and
scoring it as live corpus produces findings about nothing.

Run the cases against the repo paths the `CASE.md` files name. The rendered copy under
`~/.agents/evals/` is incidental — nothing reads it.

## Running a case

Invoke the `instructions-reviewer` agent with the prompt in the case's `CASE.md`, verbatim.
Paste its full output into `results/YYYY-MM-DD-case-N.md` along with the score.

Two rules that keep a run honest:

- **Verbatim prompt.** The prompt is part of the case. Case 3 in particular is testing what
  happens when the caller supplies nothing but a path; adding a word of scaffolding tests a
  different thing.
- **One run, recorded whole.** Record the output before scoring it, including runs that
  score well. A results file that only holds failures cannot show a regression.

## Scoring order

Final behaviour first, process compliance second — a review that reaches the right verdict
through a sloppy process beats a well-formatted one that reaches the wrong verdict. The
per-case scoring sections are written in that order.

## Runs to date

| Date | Case 1 (clean) | Case 2 (defects) | Case 3 (bare path) |
| --- | --- | --- | --- |
| [2026-07-25](results/) | **Fail** — `Pass with revisions`, 1 Major + 3 Minor + 3 Nits, no conformance phrase. **Confounded**: two findings are real fixture defects, so the case does not yet measure what it claims | **Pass** — 7/7 recall, both Blockers ranked Blocker, 0 decoys flagged, 0 manufactured | **Pass** — mode reachable from a bare path; proceeded without asking |
| [2026-08-17](results/) | **Fail** — `Pass with revisions` on one Minor, 0 Blockers, 0 Majors, 0 manufactured. The Minor is defensible and names a real §7 gap the key's fixture table calls clean | **Pass** — 7/7 recall, P2 and P4 as Blockers, D1 not flagged, 0 manufactured; severity 6/7 (P7 ranked Blocker, key says Major) | **Pass** — proceeded from the bare path, reviewed the named file, inline, header and files-examined complete |

All three answer keys were re-derived 2026-08-17 against the post-prune reviewer (the
corpus prune that landed `writing_instructions.md` and split the reviewer's §1/§7/§8
into `artifact-class-checks.md`). Same day: the case-1 fixture's two authored defects
were repaired, closing the 2026-07-25 confound, and case-2's D2 decoy became a
judgement call — the bar reversed the house position its decoy status rested on. The
2026-07-25 run predates the re-derivation; score future runs against the current keys
only.

Across all three runs: **0 fabricated citations** — every repo-local claim was re-verified
independently and held. One systematic cosmetic slip: line counts reported one high in all
three (82→83, 35→36, 30→31), never affecting a verdict.

## What these cases do not do

They do not fix the agent. Eval results and agent edits are deliberately kept in separate
sessions: a reviewer tuned in the same breath as the run that scored it is tuned to the run,
not to the failure mode. Record what the cases show, then stop.

They also do not cover: the diff-seed and session-grounded input modes, multi-file corpus
review, cross-file contradiction detection, or the `skillOverrides` settings lookup. Each is
a candidate for a case 4+.
