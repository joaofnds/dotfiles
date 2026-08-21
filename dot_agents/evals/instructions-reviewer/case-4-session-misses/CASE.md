# Case 4: session misses

**Asks:** does the reviewer catch the three defect classes it missed in the 2026-08-20
backlog-migration session (dotfiles history around the migration commits)? Each plant
reproduces a real miss: sibling-skill boilerplate excused by a ratification note,
banned punctuation, and an outside-fact claim carrying no evidence citation.

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Diff-seed review. The patch is at:

/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-4-session-misses/fixture/PATCH.diff

Changed paths (both added by this patch):
/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-4-session-misses/fixture/ship-notes/SKILL.md
/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-4-session-misses/fixture/release-digest/SKILL.md

Return the review inline.
```

The prompt says nothing about defects being present.

**Why diff-seed and not standing.** All three plants are bar violations, and the bar
governs added or rewritten text, not standing prose (`writing-instructions.md`
preamble; the reviewer's §The bar restates it, and case 1's §Known judgement calls
scores a blanket standing-prose finding as manufactured). In standing mode the key
would demand findings a conformant reviewer is right to withhold. The patch adds both
files whole, so every plant is text the diff introduced. This is also the only case
covering diff-seed mode, the mode the house gate actually runs in: the run scores
`### Outside this diff` and the in-diff verdict line as process, not as findings.

## Answer key: 4 plants

| # | Plant | Lines | Checklist section | Expected severity |
| --- | --- | --- | --- | --- |
| **P1** | **Shared boilerplate with a ratification bait**: the ledger-duty paragraph is pasted verbatim in both skills, and each copy ends "(Ratified as a per-skill duty in the release-flow plan.)" | ship-notes 19-21, release-digest 15-17 | §4 Shared boilerplate; §How you review item 2, "Ratification does not downgrade" | Minor, reported as a finding that names the ratification; softening it to a non-finding or advisory *because* it was ratified is the fail this case exists to catch |
| **P2** | **Banned punctuation**: em dashes in fresh prose | ship-notes 16, release-digest 13 | `writing-instructions.md` §Written for someone acting now (plain punctuation) | Minor |
| **P3** | **Outside-fact claim with no evidence home**: "the `relnote` CLI rejects an empty body with exit 2 (probe)" cites no `instruction-external-facts.md` heading | ship-notes 13 | `writing-instructions.md` §Complete in place (outside-fact exception); `instruction-external-facts.md` preamble | Major (evidence quality) |
| **P4** | **Trigger list in a user-invoked description**: both descriptions carry "Invoke on ..." phrases while `disable-model-invocation: true`, so they feed no dispatch | ship-notes 5-6, release-digest 6 | §2 Invocation mode sets what the description is for | Minor. The 2026-08-21 run reported it against a scoring line that called the descriptions conformant; that run is what proved it a plant, so an earlier run is not penalised for missing it |

## Scoring

Pass: P1, P2, and P3 reported, P1 not downgraded on ratification grounds, P3 at Major.
P4 is scored but does not gate the pass. The verdict line reads `Pass with revisions`
(in-diff Minors and one Major, no Blocker); a missing or mis-formed `Outside this diff`
section is a process note, not a fail. The fixtures are otherwise conformant
(`disable-model-invocation` set, no privilege grants, no over-trigger language); findings
beyond the key are scored on their own evidence, not counted against the run.
