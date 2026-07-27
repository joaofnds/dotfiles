# Case 3 — bare path, no diff

**Asks:** does the standing-artifact input mode work from a real caller?

The three-mode Inputs block was added 2026-07-25 (`instructions-reviewer.md:20-40`) and had
never been exercised. This case tests the mode itself, not finding quality.

The specific risk it isolates: the Inputs block opens with a stop condition —

> Given no target, stop and return a one-line request for the missing input — do not guess
> a scope. (`:22-23`)

— immediately above the standing-artifact mode that *is* satisfied by a bare path
(`:25-27`). A reviewer that reads the stop condition as governing all three modes will
refuse a legally-formed standing-artifact call. Cases 1 and 2 would not catch this: both
name the artifact type and say "return the review inline", so they carry more scaffolding
than the mode requires. This case supplies the minimum the definition permits.

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt — nothing else, no
requirements, no diff, no artifact-type hint, no output instruction:

```
/Users/joaofnds/code/dotfiles/dot_agents/rules/ownership.md
```

## The target

A real corpus file, not a fixture — "from a real caller" is the point. Chosen because it is
bounded: 30 lines, and `grep -nE '\.md|~/\.agents|`[a-z_/]+\.[a-z]+`'` returns zero hits, so
it has no transitive references to pull in. Any file the reviewer reads beyond this one and
its own rule dependencies is scope creep worth recording.

Note it is the **chezmoi source** path (`dot_agents/`), not the rendered `~/.agents/` path.
A reviewer that reads only the rendered copy, or that flags the source path as wrong, is
missing this repo's `AGENTS.md` convention.

## Expected behaviour

**Primary — does the mode work at all.**
1. It proceeds. It does **not** return the one-line request-for-input from `:22-23`.
2. It produces a review of `ownership.md`, not of something it guessed at.
3. It does not ask for a diff, requirements, or a changeset before reviewing.

**Secondary — process.**
4. Header complete: `Verdict`, `Tier: just-in-time rule`, `Size: 30 lines` against the
   just-in-time budget (`:100` — "length is fine *if* loaded on demand").
5. `Files examined:` lists `ownership.md` as `examined`.
6. Returned inline, unprompted — `:241` makes inline the default, so a caller that says
   nothing should still get it inline rather than a file write.
7. Reads its own declared dependency `~/.agents/rules/instruction_failure_modes.md` (`:85`).
8. Scope held: no review of files the caller did not name.

## Scoring

Finding quality is **not** scored — the target is real corpus prose with no answer key, so
there is no ground truth to score against. Record the findings verbatim for a human read,
and score only the mode.

- **Pass** — proceeds without asking, reviews the named file, header and `Files examined`
  complete, returned inline.
- **Partial** — proceeds and reviews, but a process element is missing (no tier, no size, no
  files-examined list, or written to a file unasked).
- **Fail** — returns the request-for-input instead of a review, or reviews something other
  than the named file.

A **Fail** here means the standing-artifact mode is unreachable from its barest legal call,
and the stop condition at `:22-23` needs a scope qualifier.
