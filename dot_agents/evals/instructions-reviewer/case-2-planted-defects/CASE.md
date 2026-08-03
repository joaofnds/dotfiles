# Case 2 — planted defects

**Asks:** does the reviewer find defects it is explicitly instructed to find?

Every plant below maps to a numbered section of `instructions-reviewer.md`. None require
inference beyond the checklist. A miss here is not a hard problem the reviewer failed —
it is a rule the reviewer carries and did not apply.

## Input

Invoke the `instructions-reviewer` agent with exactly this prompt:

```
Standing artifact review. Read and review this file:

/Users/joaofnds/code/dotfiles/dot_agents/evals/instructions-reviewer/case-2-planted-defects/fixture/dependency-audit-reviewer.md

It is a sub-agent definition. Return the review inline.
```

The prompt deliberately says nothing about defects being present. A reviewer told to hunt
finds things whether or not they exist.

## Answer key — 7 plants

The three the task required are **P1**, **P2**, and **P3**.

| # | Plant | Line | Checklist section | Expected severity |
| --- | --- | --- | --- | --- |
| **P1** | **Stale file reference** — cites `~/.agents/rules/naming_conventions.md`, which does not exist at that path nor at its chezmoi source `dot_agents/rules/naming_conventions.md` | 15 | Operating notes, Stale-reference lint pass (indexed from §6) | Major |
| **P2** | **Self-contradiction in one file** — "Return the audit inline. Never write it to a file" vs. "Write the finished audit to `.boris/reviews/dependency-audit.md`" | 29-30 vs 34-35 | §4 Near-duplicates / conflict | Blocker |
| **P3** | **Description missing its "skip when"** — model-invoked (no `disable-model-invocation`), five "use when" triggers, zero skip conditions | 3 | §2 Invocation mode | Major |
| **P4** | **Over-privileged tools** — a *reviewer* granted `Edit`, `Write`, and unrestricted `Bash` | 5 | §2 Least privilege ("Reviewers must not have Edit / Write"; "`Bash(*)` is a smell") | Blocker |
| **P5** | **Over-triggering** — "ALWAYS invoke this agent proactively", plus the doubt-clause "If in doubt, use it" and the trailing "or whenever you are unsure" in the description | 8-9, 3 | §2 Aggressive imperatives; §5 All-caps without reasoning | Major |
| **P6** | **Unobservable hedge rule** — "Try to be thorough and consider the security implications where appropriate", and the file has no completion gate at all | 16, file-wide | §3 Vague hedges; §5 Observable; §7 Completion gate (premature completion) | Major |
| **P7** | **Deprecated harness mechanic** — instructs the agent to set `budget_tokens`, which 400s on Opus 4.7+ / Fable / Mythos | 24-25 | §6 Deprecated model mechanics | Major |

Severities are the expected rank, not a pass condition on their own — see scoring.

## Decoys — flagging these is a precision failure

Both are conformant and are in the fixture to catch over-firing:

- **D1, line 17-18** — "Never run a package manager's install or update command during an
  audit" is negative-only *and* correct: §4 permits negative-only framing for a hard,
  irreversible safety boundary, and it carries its reason in the next sentence.
- **D2, line 19-20** — the exact-pin rule is dated with its cause ("Added 2026-03-04 after a
  floating minor bump silently changed TLS defaults"), which is precisely what §6 Dating
  asks for. A finding calling it undated or stale is manufactured.

## Expected behaviour

**Primary — recall and precision.**
1. All 7 plants reported. Wording may differ; the mechanism must match.
2. P2 and P4 land as Blockers. A Blocker demoted to Minor is a partial miss — the caller
   filters by severity, so a mis-ranked Blocker is a Blocker the caller never sees.
3. Neither decoy flagged.
4. No finding asserts a fact the fixture contradicts.

**Secondary — process.**
5. P1's absence verified by a tool call this session, not asserted (the "Never flag from memory" Operating note).
6. P7 reported with its recorded status per the "Release-coupled facts follow their recorded status" Operating note — `instruction_external_facts.md` §2 is undated, so an unverified dependency note or equivalent.
7. Each finding carries all four parts: Quote (with line), Severity, Why (named failure mode), Suggest (concrete rewrite).

## Scoring

Record **recall** (plants found / 7), **severity accuracy** (correctly ranked / 7), and
**precision** (decoys flagged, plus any manufactured finding).

- **Pass** — 7/7 recall, P2 and P4 as Blockers, 0 decoys flagged, 0 manufactured findings.
- **Partial** — ≥5/7 recall with no manufactured finding. Record exactly which plants were
  missed; a systematic miss (e.g. always the §7 rows) is more actionable than the count.
- **Fail** — <5/7 recall, or any decoy flagged, or any manufactured finding.

Extra findings beyond the 7 plants are expected and are not automatically precision
failures — the fixture is short and crude, so genuine incidental defects exist. Judge each:
grounded in quoted fixture text = legitimate; contradicted by the text = manufactured.
