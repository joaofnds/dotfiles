# Case 3 — bare path, no diff

**Asks:** does the standing-artifact input mode work from a real caller?

This case tests the mode itself, not finding quality. The specific risk it isolates: the
Inputs block opens with a stop condition —

> Given no target, stop and return a one-line request for the missing input — do not
> guess a scope. (§Inputs, the stop condition)

— immediately above the standing-artifact mode that *is* satisfied by a bare path
(§Inputs, the **Standing artifact** bullet). A reviewer that reads the stop condition as
governing all three modes will refuse a legally-formed standing-artifact call. Cases 1
and 2 would not catch this: both name the artifact type and say "return the review
inline", so they carry more scaffolding than the mode requires. This case supplies the
minimum the definition permits.

*(Answer key re-derived 2026-08-17: the target's facts refreshed — `ownership.md` has
grown since the case was written and now cites other rules — and the reviewer's declared
reads grew by the bar and the budgets reference.)*

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt — nothing else, no
requirements, no diff, no artifact-type hint, no output instruction:

```
/Users/joaofnds/code/dotfiles/dot_agents/rules/ownership.md
```

## The target

A real corpus file, not a fixture — "from a real caller" is the point. It cites
`reporting_findings.md` and `AGENTS.md` §Autonomy, so those are ordinary
evidence reads, not scope creep. Reads beyond the target, its cited files, and the
reviewer's own declared dependencies are the scope creep worth recording.

Note it is the **chezmoi source** path (`dot_agents/`), not the rendered `~/.agents/`
path. A reviewer that reads only the rendered copy, or that flags the source path as
wrong, is missing this repo's `AGENTS.md` convention.

## Expected behaviour

**Primary — does the mode work at all.**
1. It proceeds. It does **not** return the one-line request-for-input from §Inputs' stop
   condition.
2. It produces a review of `ownership.md`, not of something it guessed at.
3. It does not ask for a diff, requirements, or a changeset before reviewing.

**Secondary — process.**
4. Header complete: `Verdict`, `Tier: just-in-time rule`, and `Size:` stated against the
   just-in-time budget (`artifact-class-checks.md` §Per-file budgets — "length is fine
   *if* loaded on demand"). The count itself is not scored; the target is live corpus and
   grows.
5. `Files examined:` lists `ownership.md` as `target` and `examined`.
6. Returned inline, unprompted — §Output format's "**Return inline.**" makes inline the
   default, so a caller that says nothing should still get it inline rather than a file
   write.
7. Reads its declared dependencies: `instruction_failure_modes.md` (§Failure-mode
   vocabulary), `writing_instructions.md` (§The bar), and `artifact-class-checks.md`
   §Per-file budgets (read on every review).
8. Scope held: no review of files the caller did not name — cited files and declared
   dependencies appear as evidence, never as verdict-bearing targets.

## Scoring

Finding quality is **not** scored — the target is real corpus prose with no answer key,
so there is no ground truth to score against. Record the findings verbatim for a human
read, and score only the mode.

- **Pass** — proceeds without asking, reviews the named file, header and `Files examined`
  complete, returned inline.
- **Partial** — proceeds and reviews, but a process element is missing (no tier, no size,
  no files-examined list, or written to a file unasked).
- **Fail** — returns the request-for-input instead of a review, or reviews something
  other than the named file, or gives a cited file its own verdict.

A **Fail** here means the standing-artifact mode is unreachable from its barest legal
call, and §Inputs' stop condition needs a scope qualifier.
