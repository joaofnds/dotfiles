---
name: panel-review
description: >
  Run a four-axis panel review of a completed change — code style,
  architecture, spec conformance, security — with parallel specialist
  reviewers, adversarial verification of major findings, and a
  self-contained fix report written to .boris/reviews/. Invoke on "panel
  review", "full review", "review this across all axes", or when a substantial
  unit of work needs a thorough pre-merge check. Skip for small plan-step
  reviews — spawn the code-reviewer agent directly. Skip for a single-axis
  check — the narrower built-in (/security-review, /code-review) is cheaper;
  panel-review is for all four axes plus the refactoring track, the kill step,
  and a durable report. Work built THIS session is fine to panel-review;
  /adversarial-review is the lighter single-reviewer check for work that
  doesn't warrant four axes.
metadata:
  trigger: A substantial completed change needs a thorough multi-axis review producing a durable fix report
---

# Panel Review

**Wrong skill if:** reviewing a small plan step → spawn the `code-reviewer` agent directly; a single axis → `/code-review` or `/security-review`; a lighter one-reviewer check of this session's work → `/adversarial-review`.

Four verdict axes plus a refactoring track — five reviewers in parallel — one
adversarial kill step, one report a fresh session can fix from. You are the
orchestrator: you build the briefs, arbitrate the findings, and write the
report — you don't review the code yourself.

## 1. Gather inputs

Collect all three before spawning anyone; stop and ask for whatever is
missing — never invent it:

1. **Changeset** — materialize the complete patch at a readable temporary path and list
   every changed file. The read-only reviewers cannot resolve a bare ref range.
2. **Spec** — the PRD, plan file, or stated requirements the work implements.
   The spec axis is meaningless without it. When a `/grill` hardened-design
   doc exists, collect it too. Grill may clarify implementation and record
   deferrals already allowed by the spec; it cannot change scope or acceptance criteria.
3. **Test command** — grep the project (`Makefile`, `package.json`,
   `justfile`, `mise`). Run the full suite once yourself and keep the output
   for the report header. A failed required suite is a Blocker until diagnosed. Don't
   share the result with the reviewers — "tests
   pass" in a brief steers them (adversarial-review's withhold rule).

## 2. Fan out — one parallel batch

Spawn five agents **in a single message** so they run concurrently: four
`code-reviewer` agents, one per axis, and one `refactoring-reviewer`. Each
code-reviewer gets the same shared context plus one axis mandate.

Shared context, identical for the four code-reviewers:

> Patch: `<readable patch path>`. Changed files: `<paths>`. Spec: `<path>`.
> Verification is orchestrator-owned; this mandate waives code-reviewer input 3.
> Do not run tests or block on withheld suite output. Return a static axis verdict.
> Correctness is every reviewer's floor: keep a concrete wrong-output
> defect even when it's outside your lens, tagged `[correctness]`. This brief
> deliberately contains no assessment of the work — form your own from the
> code.

Axis mandates — pass one per reviewer:

- **Style** — "Review mandate: code style only. Load
  `~/.agents/rules/coding_style.md` plus the language file(s) matching the
  diff. You own: naming (domain language, the banned `Impl` suffix), comment
  policy, type-system escape hatches, unparsed boundary input, error
  translation, entity construction and constructor/DI shape, language-file
  idioms, hand-edits to generated files. Function length, parameter counts,
  and duplicated code belong to the refactoring reviewer — drop them, and name
  nothing from the Fowler catalog. Honor your own "What NOT to flag" list —
  missing comments, self-defense validation, and speculative hooks are
  deliberate house style, not findings.
  Architecture, spec, and security findings belong to other reviewers — drop
  them."
- **Architecture** — "Review mandate: architecture only. Load
  `~/.agents/rules/engineering_judgment.md` (§2–3) and the applicable baseline
  coding rules. Module level: boundaries,
  dependency direction, interfaces at the seams, coupling to other modules,
  orthogonality (one change, one place), structural over-abstraction. You own
  over-engineering as a structural question; simplicity relative to the spec
  belongs to the spec reviewer."
- **Spec** — "Review mandate: spec conformance only. Read the spec at
   `<path>` — and the grilled design doc at `<path>`, when one exists; an
   implementation decision or spec-authorized deferral recorded there is not a miss
  — with the eyes of a product owner and a staff engineer. Requirement
  by requirement: is it actually implemented — behavior present, not merely
  code existing? Is anything built that no requirement asks for? Is this the
  simplest thing that satisfies the spec? Cite the spec clause in every
  finding."
- **Security** — "Review mandate: security only. Vulnerabilities and
  exploitable defects: injection, authn/authz gaps, unsafe handling of
  external input, secrets exposure, plausible-but-wrong logic an attacker can
  reach. Every finding needs a concrete attack path — input → effect. No
  'consider hardening X' without one."

The fifth agent is `refactoring-reviewer` — a track, not an axis. It takes no
mandate and no spec; its brief is its own diff-seed input shape:

> Diff seed: patch at `<readable patch path>`. Changed files: `<paths>`. Review
> those files and one hop out, per your input rules. This brief deliberately
> contains no assessment of the work.

## 3. Arbitrate

Union the four axis result sets, then:

- **Dedup** findings hitting the same `file:line`; keep the strongest
  framing, note both axes.
- **Reconcile severity** when axes disagree — the concrete failure decides,
  not the louder reviewer.
- A reviewer that strayed outside its mandate: fold the finding into the
  owning axis's set if it stands; never double-count.
- **A refactoring finding whose evidence overlaps an axis finding** merges into
  one entry — overlapping site lists count, not just an identical `file:line`,
  and so does a site list falling inside the module or seam the axis finding
  names, even with no shared line. The axis reviewer's rule citation is the **Why**, the
  refactoring reviewer's mechanics are the **Fix**; never list both. The merged
  entry carries the axis finding's severity and axis label, and goes to the
  skeptic under the standard mandate — unless the merged **Fix** is the only
  disputed part, which verifies under the refactoring mandate instead.

### Verdict-bearing or advisory

The refactoring track produces both, and its severity measures friction cost,
not defect severity — so provenance, not severity, decides what can block a
merge. Apply the revert test to each of its findings, with the patch in hand:

- **Verdict-bearing** — the finding's evidence would not stand with the patch
  reverted: the diff created the duplicated block, added a site to a cross-file
  smell's list, or grew the cited function, parameter list, or class past the
  point the finding rests on. These join the numbered findings at their stated
  severity. Overlap between the cited lines and the diff is not sufficient — a
  two-line edit inside a pre-existing 300-line function did not introduce Long
  Function.
- **Advisory** — the finding survives reverting the patch, even when the cited
  lines sit inside it: pre-existing debt reached through the one-hop outward
  read, or cross-file site lists rooted outside the diff. These go to the
  report's Refactoring opportunities section and never move the verdict.

A `[correctness]` Blocker is neither verdict-bearing nor advisory — a third
class. Report it at Blocker severity wherever it was found; when it sits
outside the diff, tag it `[pre-existing]`, keep it in the numbered findings,
and state it above the verdict line rather than in it. It routes to `/debug`
or `/plan` for the owning code rather than becoming a merge condition here.

## 4. Verify — the kill step

For every **Blocker and Major** finding, spawn a skeptic (general agent) in
one parallel batch, mandated to refute it:

> Try to refute this review finding against the actual code — read the code
> yourself, don't trust the claim: `<finding, with file:line and the claimed
> failure>`. Refuted means positive disproof: the claimed failure cannot
> occur, the cited rule/spec clause doesn't say that, or the code already
> handles it. If you can neither reproduce the failure nor positively
> disprove it, return inconclusive — do not call it refuted.

A verdict-bearing **refactoring** finding claims friction, not wrong output —
that mandate has no purchase on it, so refute its evidence instead:

> Try to refute this refactoring finding against the actual code — read the
> code yourself, don't trust the claim: `<finding, with file:line, the smell,
> and the claimed friction>`. Refuted means positive disproof of the smell
> itself: the cited sites don't contain the pattern, or the blocks named as
> duplicated encode different knowledge. An under-inclusive site list is not a
> refutation — it understates the finding; return the missing sites. A wrong
> test path, or a document under `~/.agents/rules/refactoring/catalog/` that
> doesn't prescribe those mechanics, is a correction and not a refutation:
> return the correct mechanics and keep the finding. If you can neither confirm
> the evidence nor positively disprove it, return inconclusive.

A refuted finding is dropped from the findings list and recorded in the
report footer — dropped, never silently vanished. An inconclusive finding
stays in the report with `[unverified]` appended to its severity — silently
dropping a real Blocker costs more than carrying a doubtful one. Minor/Nit
findings and the whole advisory section skip verification; spot-check any you
doubt yourself.

## 5. Report

Write to `.boris/reviews/YYYY-MM-DD-<topic>.md` **in the repo under review**
(the repo the diff belongs to); create the directory if absent. Every
finding block must be self-contained — a fresh session with zero context can fix from it, or run
/plan off it when a fix is large.

```markdown
# Panel review — <topic>

- **Patch:** <readable path> · **Spec:** <path>
- **Test run:** `<cmd>` → <result plus the relevant failing output when red>
- **Verdict:** Pass / Pass with revisions / Fail
- **Files examined:** <every file in the diff; flag any a reviewer skipped —
  the verdict is invalid while one is unexamined. List the refactoring
  reviewer's one-hop and coverage-probe files separately under the advisory
  section — they don't gate the verdict>

## 1. [<Severity>] <one-line defect> — <axis, or "refactoring">

- **Where:** `path:line`
- **Why:** <rule broken / spec clause / attack path — the concrete failure,
  not a preference>
- **Fix:** <simplest viable fix first. A heavier option (new layer,
  abstraction, dependency) must cite the verified reason the simpler one
  fails — no verified reason, recommend the simpler fix. Direction and
  options, not full implementation>
- **Verify:** <how to confirm the fix — test to run or add, behavior to observe>

## Refactoring opportunities — advisory, outside the verdict

- [<Severity>] <smell> → <refactoring> — `path:line` (full site list for a
  cross-file smell) — <what improves and along which axis, plus the mechanics
  or the catalog document to open>

## Dropped by verification

- [<Severity>] `path:line` — <finding> — refuted: <one-line reason>
```

Order findings worst first. The verdict follows the surviving verdict-bearing findings:
any untagged Blocker or failed required suite → Fail; Majors → Pass with revisions.
Advisory refactoring items and `[pre-existing]`-tagged Blockers never move it.

## 6. Recommend the next route

Record a proposed disposition for every finding. Recommend `/plan` and `/build` for
large fixes and a direct test-first fix for small ones. Advisory refactoring items are a
follow-up `/plan` candidate, never a merge condition — propose one only if the user wants
the debt addressed. Do not modify source as part of panel review; return the report
before remediation begins. After remediation, the owning session reruns the full suite
and targeted review for each affected axis.

## 7. Relay

Report to the user in the reviewers' words — worst first, verbatim or
near-verbatim, including findings that invalidate the work. Link the report
file. Your own commentary, if any, goes after the findings, clearly marked as
yours.
