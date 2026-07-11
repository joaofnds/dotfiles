---
name: panel-review
description: >
  Run a four-axis panel review of a completed change — code style,
  architecture, spec conformance, security — with parallel specialist
  reviewers, adversarial verification of major findings, and a self-contained
  fix report written to docs/reviews/. Invoke on "panel review", "full
  review", "review this across all axes", or when a substantial unit of work
  needs a thorough pre-merge check. Skip for small plan-step reviews — spawn
  the code-reviewer agent directly. Skip for a single-axis check — the
  narrower built-in (/security-review, /code-review) is cheaper; panel-review
  is for all four axes plus the kill step and a durable report. Skip for
  checking work you produced THIS session — that's /adversarial-review.
metadata:
  trigger: A substantial completed change needs a thorough multi-axis review producing a durable fix report
---

# Panel Review

Four specialist reviewers in parallel, one adversarial kill step, one report a
fresh session can fix from. You are the orchestrator: you build the briefs,
arbitrate the findings, and write the report — you don't review the code
yourself.

## 1. Gather inputs

Collect all three before spawning anyone; stop and ask for whatever is
missing — never invent it:

1. **Diff range** — an explicit ref range or file list (e.g. `git diff main...HEAD`).
2. **Spec** — the PRD, plan file, or stated requirements the work implements.
   The spec axis is meaningless without it.
3. **Test command** — grep the project (`Makefile`, `package.json`,
   `justfile`, `mise`). Run the full suite once yourself and keep the output
   for the report header. Don't share the result with the reviewers — "tests
   pass" in a brief steers them (adversarial-review's withhold rule).

## 2. Fan out — one parallel batch

Spawn four `code-reviewer` agents **in a single message** so they run
concurrently. Each gets the same shared context plus one axis mandate.

Shared context, identical for all four:

> Diff: `<range>`. Spec: `<path>`. Project test command: `<cmd>` — the
> orchestrator runs the full suite; run only the targeted tests a finding
> needs. Correctness is every reviewer's floor: keep a concrete wrong-output
> defect even when it's outside your lens, tagged `[correctness]`. This brief
> deliberately contains no assessment of the work — form your own from the
> code.

Axis mandates — pass one per reviewer:

- **Style** — "Review mandate: code style only. Load
  `~/.agents/rules/coding_style.md` plus the language file(s) matching the
  diff. Function/class level: naming, parameter counts, structure,
  duplication, house-style adherence — including its what-NOT-to-flag list.
  Architecture, spec, and security findings belong to other reviewers — drop
  them."
- **Architecture** — "Review mandate: architecture only. Load
  `~/.agents/rules/engineering_judgment.md` (§2–3). Module level: boundaries,
  dependency direction, interfaces at the seams, coupling to other modules,
  orthogonality (one change, one place), structural over-abstraction. You own
  over-engineering as a structural question; simplicity relative to the spec
  belongs to the spec reviewer."
- **Spec** — "Review mandate: spec conformance only. Read the spec at
  `<path>` with the eyes of a product owner and a staff engineer. Requirement
  by requirement: is it actually implemented — behavior present, not merely
  code existing? Is anything built that no requirement asks for? Is this the
  simplest thing that satisfies the spec? Cite the spec clause in every
  finding."
- **Security** — "Review mandate: security only. Vulnerabilities and
  exploitable defects: injection, authn/authz gaps, unsafe handling of
  external input, secrets exposure, plausible-but-wrong logic an attacker can
  reach. Every finding needs a concrete attack path — input → effect. No
  'consider hardening X' without one."

## 3. Arbitrate

Union the four result sets, then:

- **Dedup** findings hitting the same `file:line`; keep the strongest
  framing, note both axes.
- **Reconcile severity** when axes disagree — the concrete failure decides,
  not the louder reviewer.
- A reviewer that strayed outside its mandate: fold the finding into the
  owning axis's set if it stands; never double-count.

## 4. Verify — the kill step

For every **Blocker and Major** finding, spawn a skeptic (general agent) in
one parallel batch, mandated to refute it:

> Try to refute this review finding against the actual code — read the code
> yourself, don't trust the claim: `<finding, with file:line and the claimed
> failure>`. Refuted means positive disproof: the claimed failure cannot
> occur, the cited rule/spec clause doesn't say that, or the code already
> handles it. If you can neither reproduce the failure nor positively
> disprove it, return inconclusive — do not call it refuted.

A refuted finding is dropped from the findings list and recorded in the
report footer — dropped, never silently vanished. An inconclusive finding
stays in the report with `[unverified]` appended to its severity — silently
dropping a real Blocker costs more than carrying a doubtful one. Minor/Nit
findings skip verification; spot-check any you doubt yourself.

## 5. Report

Write to `docs/reviews/YYYY-MM-DD-<topic>.md` **in the repo under review**
(the repo the diff belongs to); create the directory if absent. Every
finding block must be self-contained — a fresh session with zero context can fix from it, or run
/plan off it when a fix is large.

```markdown
# Panel review — <topic>

- **Diff:** <range> · **Spec:** <path>
- **Test run:** `<cmd>` → <final output line>
- **Verdict:** Pass / Pass with revisions / Fail
- **Files examined:** <every file in the diff; flag any a reviewer skipped —
  the verdict is invalid while one is unexamined>

## 1. [<Severity>] <one-line defect> — <axis>

- **Where:** `path:line`
- **Why:** <rule broken / spec clause / attack path — the concrete failure,
  not a preference>
- **Fix:** <direction; options with reasoning where genuinely open — not full
  implementation>
- **Verify:** <how to confirm the fix — test to run or add, behavior to observe>

## Dropped by verification

- [<Severity>] `path:line` — <finding> — refuted: <one-line reason>
```

Order findings worst first. The verdict follows the surviving findings: any
Blocker → Fail; Majors → Pass with revisions.

## 6. Relay

Report to the user in the reviewers' words — worst first, verbatim or
near-verbatim, including findings that invalidate the work. Link the report
file. Your own commentary, if any, goes after the findings, clearly marked as
yours.
