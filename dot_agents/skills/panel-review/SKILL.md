---
name: panel-review
description: >
  Run a five-axis panel review of a completed change — code style,
  architecture, spec conformance, security, testing — with parallel specialist
  reviewers, adversarial verification of major findings, and a
  self-contained fix report written to .boris/reviews/. Invoke on "panel
  review", "full review", "review this across all axes", or when a substantial
  unit of work needs a thorough pre-merge check. Skip for small plan-step
  reviews — spawn the code-reviewer agent directly. Skip for a single-axis
  check — the narrower built-in (/security-review, /code-review) is cheaper;
  panel-review is for all five axes plus the refactoring track, the kill step,
  and a durable report. Work built THIS session is fine to panel-review;
  /adversarial-review is the lighter single-reviewer check for work that
  doesn't warrant five axes.
metadata:
  trigger: A substantial completed change needs a thorough multi-axis review producing a durable fix report
---

# Panel Review

**Wrong skill if:** reviewing a small plan step → spawn the `code-reviewer` agent directly; a single axis → `/code-review` or `/security-review`; a lighter one-reviewer check of this session's work → `/adversarial-review`.

Five verdict axes plus a refactoring track — six reviewers in parallel — one
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

Spawn six agents **in a single message** so they run concurrently — five when
the diff touches no test file: four `code-reviewer` agents, one per axis; one
`testing-reviewer`, the fifth verdict axis; and one `refactoring-reviewer`, the
advisory track. Each code-reviewer gets the same shared context plus one axis
mandate.

Shared context, identical for the four code-reviewers:

> Patch: `<readable patch path>`. Changed files: `<paths>`. Spec: `<path>`.
> Verification is orchestrator-owned; this mandate waives code-reviewer input 3.
> Do not run tests or block on withheld suite output. Return a static axis verdict.
> Test files belong to the testing reviewer: review production code only, and
> skip loading `~/.agents/rules/testing/` — that axis owns it. A `[correctness]`
> defect you spot in a test file is still yours to report, tagged.
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
  `~/.agents/rules/engineering_judgment.md` (§2–3), `~/.agents/rules/coupling.md`,
  and the applicable baseline coding rules. Module level: boundaries,
  dependency direction, interfaces at the seams, coupling to other modules,
  orthogonality (one change, one place), structural over-abstraction. You own
  over-engineering as a structural question; simplicity relative to the spec
  belongs to the spec reviewer. Sweep all five of Nygard's coupling types
  against the change, then report only those that are defects under
  `coupling.md`'s stability test and its Boundaries section — a type that isn't
  present goes unmentioned; do not enumerate absences. Name each by its type
  verbatim. Apply the revert test to every coupling finding: if the evidence
  stands with the patch reverted, mark it advisory — it does not move the
  verdict. Only coupling the patch introduced or measurably worsened is
  verdict-bearing. When a finding turns on
  whether a dependency is stable, say so and ask for the change-history probe
  rather than assuming — you have no command execution."
- **Spec** — "Review mandate: spec conformance only. Read the spec at
   `<path>` — and the grilled design doc at `<path>`, when one exists; an
   implementation decision or spec-authorized deferral recorded there is not a miss
  — with the eyes of a product owner and a staff engineer. Requirement
  by requirement: is it actually implemented — behavior present, not merely
  code existing? Is anything built that no requirement asks for? Is this the
  simplest thing that satisfies the spec? Cite the spec clause in every
  finding. When the diff adds or changes behavior with no test movement, say so
  and name the requirement left unpinned — a Minor unless a spec clause requires
  the coverage."
- **Security** — "Review mandate: security only. Vulnerabilities and
  exploitable defects: injection, authn/authz gaps, unsafe handling of
  external input, secrets exposure, plausible-but-wrong logic an attacker can
  reach. Every finding needs a concrete attack path — input → effect. No
  'consider hardening X' without one."

Both specialists take a diff-seed brief and no mandate or spec; each follows its
own input rules for scope. One block, passed to each:

> Diff seed: patch at `<readable patch path>`. Changed files: `<paths>`. Review
> per your input rules. Structure inside test files belongs to the testing axis
> — refactoring findings are production code only. This brief deliberately
> contains no assessment of the work.

`testing-reviewer` is the fifth **verdict axis** — a defective test in the patch
is a defect, not debt. Skip it entirely when the diff touches no test file, and
record that in the report header.

`refactoring-reviewer` is a track, not an axis.

You apply the revert test to both agents' findings yourself (§3) — neither is
told to self-classify, because both describe themselves as advisory in their own
sense and would read the instruction as vacuous.

## 3. Arbitrate

Union the axis result sets — five, or four when the testing axis was skipped —
then:

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

The refactoring track and the testing axis both produce findings of either kind.
Refactoring severity measures friction cost, not defect severity — so
provenance, not severity, decides what can block a merge. Apply the revert test
to each such finding, with the patch in hand:

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
  report's Structural opportunities section and never move the verdict.

A test smell the patch introduced is verdict-bearing; one it merely read past is
advisory and lands in that section alongside the refactoring items. Two
exemptions from the revert test, both taking the third-class route below: a
`[correctness]` Blocker from either specialist, and a testing **Blocker**, which
claims false safety rather than friction — a test whose outcome is independent
of the subject is reported at Blocker severity wherever it was found.

A verdict-bearing testing Major moves the verdict to Pass with revisions. Unlike
refactoring friction, a test the patch *introduced* that hides defects is a
defect in the patch.

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

A verdict-bearing **refactoring or test-smell** finding claims friction, not
wrong output — that mandate has no purchase on it, so refute its evidence
instead:

> Try to refute this finding against the actual code — read the code yourself,
> don't trust the claim: `<finding, with file:line, the smell, and the claimed
> friction>`. Refuted means positive disproof of the smell itself: the cited
> sites don't contain the pattern, or the blocks named as duplicated encode
> different knowledge. An under-inclusive site list is not a refutation — it
> understates the finding; return the missing sites. A wrong test path, or a
> cited document under `~/.agents/rules/refactoring/catalog/` or
> `~/.agents/rules/testing/` that doesn't say what the finding claims, is a
> correction and not a refutation: return the correct citation and keep the
> finding. If you can neither confirm the evidence nor positively disprove it,
> return inconclusive.

Testing **Blockers** go to the standard mandate above, not this one — "the
assertion's outcome is independent of the subject" is a claim about wrong
output and is statically provable or disprovable.

A coupling finding that turns on whether the coupled target is stable is yours
to settle — one probe run once by you beats N skeptics re-deriving the same
history. Run it regardless of severity; it is the only thing separating a Minor
coupling note from noise. In the repo the diff belongs to, run
`git log --since='1 year ago' --oneline -- <path>` plus
`git log --diff-filter=A --format=%ad -1 -- <path>` for the path's age. Three
outcomes:

- **Stable** — the path predates the window and changed in ≤2 commits within it:
  the coupling is a design choice. Drop the finding, recording the commit count.
- **Unstable** — more than that, or the path is younger than the window: keep
  the finding at its stated severity and cite the count as evidence.
- **Unprobeable** — the target is external (a protocol, a vendor API, another
  repo) or the path resolves to no history: keep the finding with `[unverified]`
  and state the stability assumption it rests on. An empty log is not evidence
  of stability.

A refuted finding is dropped from the findings list and recorded in the
report footer — dropped, never silently vanished. An inconclusive finding
stays in the report with `[unverified]` appended to its severity — silently
dropping a real Blocker costs more than carrying a doubtful one. Minor/Nit
findings and the whole advisory section skip verification — the stability probe
above excepted, which runs on every coupling finding regardless of severity or
provenance; spot-check any others you doubt yourself.

## 5. Report

Write to `.boris/reviews/YYYY-MM-DD-<topic>.md` **in the repo under review**
(the repo the diff belongs to); create the directory if absent. Every
finding block must be self-contained — a fresh session with zero context can fix from it, or run
/plan off it when a fix is large.

```markdown
# Panel review — <topic>

- **Patch:** <readable path> · **Spec:** <path>
- **Test run:** `<cmd>` → <result plus the relevant failing output when red>
- **Testing axis:** <ran | skipped — no test file in the diff>
- **Verdict:** Pass / Pass with revisions / Fail
- **Files examined:** <every file in the diff; flag any a reviewer skipped —
  the verdict is invalid while one is unexamined. List the refactoring
  reviewer's one-hop and coverage-probe files, and the testing reviewer's
  support files (harness, drivers, Fakes, production code read for
  observability), separately under the advisory section — they don't gate the
  verdict>

## 1. [<Severity>] <one-line defect> — <axis, or "refactoring" for the track>

- **Where:** `path:line`
- **Why:** <rule broken / spec clause / attack path — the concrete failure,
  not a preference>
- **Fix:** <simplest viable fix first. A heavier option (new layer,
  abstraction, dependency) must cite the verified reason the simpler one
  fails — no verified reason, recommend the simpler fix. Direction and
  options, not full implementation>
- **Verify:** <how to confirm the fix — test to run or add, behavior to observe>

## Structural opportunities — advisory, outside the verdict

- [<Severity>] <smell> → <refactoring> — `path:line` (full site list for a
  cross-file smell) — <what improves and along which axis, plus the mechanics
  or the catalog document to open>
- [<Severity>] <coupling type> — `path:line` — <why it isn't worth accepting,
  the stability evidence, and the coarse cure>
- [<Severity>] <test smell> — `path:line` — <the rule broken, the pillar lost,
  and the fix in the target's framework idiom>

## Dropped by verification

- [<Severity>] `path:line` — <finding> — dropped (<refuted | stable target>):
  <one-line reason, with the commit count when it's a stability drop>
```

Order findings worst first. The verdict follows the surviving verdict-bearing findings:
any untagged Blocker or failed required suite → Fail; Majors → Pass with revisions.
Advisory structural items and `[pre-existing]`-tagged Blockers never move it.

## 6. Recommend the next route

Record a proposed disposition for every finding. Recommend `/plan` and `/build` for
large fixes and a direct test-first fix for small ones. Advisory structural items are a
follow-up `/plan` candidate, never a merge condition — propose one only if the user wants
the debt addressed. Do not modify source as part of panel review; return the report
before remediation begins. After remediation, the owning session reruns the full suite
and targeted review for each affected axis.

## 7. Relay

Report to the user in the reviewers' words — worst first, verbatim or
near-verbatim, including findings that invalidate the work. Link the report
file. Your own commentary, if any, goes after the findings, clearly marked as
yours.
