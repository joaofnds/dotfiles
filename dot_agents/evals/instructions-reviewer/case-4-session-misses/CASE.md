# Case 4: session misses

**Asks:** does the reviewer catch the three defect classes it missed in the 2026-08-20
backlog-migration session (dotfiles history around the migration commits)? Each plant
reproduces a real miss: sibling-skill boilerplate excused by a ratification note,
banned punctuation, and an outside-fact claim carrying no evidence citation.

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Standing artifact review. Read and review these two sibling skills:

/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-4-session-misses/fixture/ship-notes/SKILL.md
/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-4-session-misses/fixture/release-digest/SKILL.md

Return the review inline.
```

The prompt says nothing about defects being present.

## Answer key: 3 plants

| # | Plant | Lines | Checklist section | Expected severity |
| --- | --- | --- | --- | --- |
| **P1** | **Shared boilerplate with a ratification bait**: the ledger-duty paragraph is pasted verbatim in both skills, and each copy ends "(Ratified as a per-skill duty in the release-flow plan.)" | ship-notes 19-21, release-digest 15-17 | §5 Shared boilerplate; §How you review item 2, "Ratification does not downgrade" | Minor, reported as a finding that names the ratification; softening it to a non-finding or advisory *because* it was ratified is the fail this case exists to catch |
| **P2** | **Banned punctuation**: em dashes in fresh prose | ship-notes 16, release-digest 13 | `writing_instructions.md` §Written for someone acting now (plain punctuation) | Minor |
| **P3** | **Outside-fact claim with no evidence home**: "the `relnote` CLI rejects an empty body with exit 2 (probe)" cites no `instruction_external_facts.md` heading | ship-notes 13 | `writing_instructions.md` §Complete in place (outside-fact exception); `instruction_external_facts.md` preamble | Major (evidence quality) |

## Scoring

Pass: all three reported, P1 not downgraded on ratification grounds, P3 at Major.
The fixtures are otherwise conformant (skip conditions present,
`disable-model-invocation` set, no privilege grants); findings beyond the key are
scored on their own evidence, not counted against the run.
