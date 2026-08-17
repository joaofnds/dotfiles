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
  check — recommend the narrower built-in (/security-review, /code-review) to
  the user, which is cheaper and user-invoked only;
  panel-review is for all five axes plus the refactoring track, the kill step,
  and a durable report. Work built THIS session is fine to panel-review;
  /adversarial-review is the lighter single-reviewer check for work that
  doesn't warrant five axes.
---

# Panel Review

You are the orchestrator: you build the briefs, arbitrate the findings, and write
the report — you don't review the code yourself.

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

## 2. Fan out — concurrent reviewers

Spawn six agents, each un-named with `run_in_background: true` — five when the
diff touches no test file — so they run concurrently and each report arrives on
its own notification (`~/.agents/rules/subagent_spawning.md`). The six: four
`code-reviewer` agents, one per axis; one
`testing-reviewer`, the fifth verdict axis; and one `refactoring-reviewer`, the
advisory track. Each code-reviewer gets the same shared context plus one axis
mandate.

Read `~/.agents/skills/panel-review/references/axis-mandates.md` before spawning; it holds
the shared context and the four axis mandates. Paste the shared block plus one axis mandate
into each `code-reviewer` brief **verbatim** — a paraphrase breaks the exactly-once partition
of `coding_style.md` §2 — and the specialist diff-seed block into each specialist brief.

`testing-reviewer` is the fifth **verdict axis** — a defective test in the patch
is a defect, not debt. Skip it entirely when the diff touches no test file, and
record that in the report header.

`refactoring-reviewer` is a track, not an axis.

You apply the revert test to both agents' findings yourself (§3) — neither is
told to self-classify, because both describe themselves as advisory in their own
sense and would read the instruction as vacuous. The Architecture axis's
coupling findings take the same test for a third reason: its mandate tells it to
report every coupling finding it can evidence and to leave the
introduced-versus-pre-existing call to you (§3). That call is separate from the
stability probe in §4.

## 3. Arbitrate

Union the axis result sets — five, or four when the testing axis was skipped —
then:

- **Dedup** findings hitting the same `file:line`; keep the strongest
  framing, note both axes. Exception: the Architecture axis's write-sequence
  finding and a coupling finding at the same `file:line` are never one of
  these — they carry different verification paths (§4's stability probe reaches
  one, never the other), so both stay, distinctly labeled.
- **Reconcile severity** when axes disagree — the concrete failure decides,
  not the louder reviewer.
- A reviewer that strayed outside its mandate: fold the finding into the
  owning axis's set if it stands; never double-count.
- **An arbitration resting on the repo's `AGENTS.md` / `CLAUDE.md` is a precedence
  claim**, and `coding_style.md`'s opening precedence paragraph governs it whether or not you loaded that
  file: quote the sentence you are ranking above the reviewer's rule, with its path. No
  quotable sentence means the repo does not state it — relay the disagreement to the
  user unresolved, and leave the finding at the severity its reviewer gave it.
- **A refactoring finding whose evidence overlaps an axis finding** merges into
  one entry — overlapping site lists count, not just an identical `file:line`,
  and so does a site list falling inside the module or seam the axis finding
  names, even with no shared line. The axis reviewer's rule citation is the **Why**, the
  refactoring reviewer's mechanics are the **Fix**; never list both. The merged
  entry carries the axis finding's severity and axis label, and, when §4 sends it
  to a skeptic, verifies under the standard mandate.

### Verdict-bearing or advisory

Mirrored in `~/.agents/rules/reporting_findings.md` §Dispositions, which states the same
test for reporting outside a panel — edit both.

The refactoring track, the testing axis, and the Architecture axis's coupling
findings all produce findings of either kind.
Refactoring severity measures friction cost, not defect severity — so
provenance, not severity, decides what can block a merge. Apply the revert test
to each such finding, with the patch in hand:

- **Verdict-bearing** — the finding's evidence would not stand with the patch
  reverted: the diff created the duplicated block, added a site to a cross-file
  smell's list, or grew the cited function, parameter list, or class past the
  point the finding rests on. For a coupling finding: the diff introduced the
  dependency, the shared concept, or the ordering assumption it rests on, or
  added a site to an existing coupling's span. These join the numbered findings at their stated
  severity, unless §6 assigns them **Noted**. Overlap between the cited lines and the diff is not sufficient — a
  two-line edit inside a pre-existing 300-line function did not introduce Long
  Function.
- **Advisory** — the finding survives reverting the patch, even when the cited
  lines sit inside it: pre-existing debt reached through the one-hop outward
  read, cross-file site lists rooted outside the diff, or a coupling whose full
  span predates the patch and that the patch only reaches through. These go to the
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
and state it above the verdict line rather than in it — a `[pre-existing]`-tagged
one routes to `/debug` or `/plan` for the owning code rather than becoming a
merge condition here. A `[correctness]` Blocker **inside** the diff is a defect
in the patch: it moves the verdict to Fail like any other untagged Blocker.

## 4. Verify — the kill step

For every **Blocker**, spawn a skeptic (general agent) — un-named,
`run_in_background: true`, `model: sonnet` (`~/.agents/rules/subagent_spawning.md`
§Model owns this choice — edit both) — mandated to refute it. Majors skip the kill
step:

> Try to refute this review finding against the actual code — read the code
> yourself, don't trust the claim: `<finding, with file:line and the claimed
> failure>`. Refuted means positive disproof: the claimed failure cannot
> occur, the cited rule/spec clause doesn't say that, or the code already
> handles it. If you can neither reproduce the failure nor positively
> disprove it, return inconclusive — do not call it refuted.

A testing **Blocker** takes the same mandate — "the assertion's outcome is
independent of the subject" is a claim about wrong output and is statically
provable or disprovable.

A spatial coupling finding that turns on whether the coupled target is stable is
yours to settle — one probe run once by you beats N skeptics re-deriving the
same history. Run it regardless of severity; it is the only thing separating a
Minor coupling note from noise. Temporal coupling is exempt: `coupling.md`
§Necessary or unnecessary judges it on whether the ordering or concurrency assumption
can be violated, not on the target's rate of change — never drop a temporal
finding on a stability outcome. In the repo the diff belongs to, run
`git log --since='1 year ago' --oneline -- <path>` plus
`git log --diff-filter=A --format=%ad -1 -- <path>` for the path's age. Three
outcomes:

- **Stable** — the path predates the window and changed in ≤2 commits within it:
  the coupling is a design choice. Drop the finding, recording the commit
  count — only when the finding's evidence is the target's rate of change. A
  spatial-coupling label attached to a write-sequence defect (see the
  Architecture mandate's Production paragraph, `references/axis-mandates.md`) rests on
  different evidence
  and this probe has no purchase on it; keep it and route it back to the
  write-sequence check.
- **Unstable** — more than that, or the path is younger than the window: keep
  the finding at its stated severity and cite the count as evidence.
- **Unprobeable** — the target is external (a protocol, a vendor API, another
  repo) or the path resolves to no history: keep the finding with `[unverified]`
  and state the stability assumption it rests on. An empty log is not evidence
  of stability.

A refuted finding is dropped from the findings list and recorded in the
report footer — dropped, never silently vanished. An inconclusive finding
stays in the report with `[unverified]` appended to its severity — silently
dropping a real Blocker costs more than carrying a doubtful one. Major, Minor, and Nit
findings and the whole advisory section skip verification — the stability probe
above excepted, which runs on every spatial coupling finding whose evidence is
the target's rate of change, regardless of severity or provenance; spot-check
any others you doubt yourself.

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
- **Pre-existing correctness Blockers:** <count, listed at findings N…, outside
  the verdict | none>
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
- **Trigger:** <the caller, input value, configuration, or user-action sequence that
  reaches this; for a verdict-bearing smell or test defect, the revert-test
  evidence stands in>
- **Disposition:** <Blocking | Decide — per §6; a Noted finding belongs in
  **No action recommended**, not here>
- **Route:** <`/plan` + `/build` for a large fix | direct test-first fix |
  `/debug` or `/plan` for the owning code, on a `[pre-existing]` `[correctness]`
  Blocker | none>

## Structural opportunities — advisory, outside the verdict

- [<Severity>] <smell> → <refactoring> — `path:line` (full site list for a
  cross-file smell) — <what improves and along which axis, the cost of doing
  it, plus the mechanics or the catalog document to open>
- [<Severity>] <coupling type> — `path:line` — <why it isn't worth accepting,
  the stability evidence for a spatial type or the violable assumption for a
  temporal one, and the coarse cure with its cost>
- [<Severity>] <test smell> — `path:line` — <the rule broken, the pillar lost,
  and the fix in the target's framework idiom, with its cost>

## Dropped by verification

- [<Severity>] `path:line` — <finding> — dropped (<refuted | stable target>):
  <one-line reason, with the commit count when it's a stability drop>

## No action recommended

- [<Severity>] `path:line` — <defect> — <evidence> — ground for Noted: <the
  probe that found no trigger, or the cost comparison that outweighs it> —
  route: none
```

Order findings worst first. The verdict follows the surviving verdict-bearing findings:
any Blocker not tagged `[pre-existing]` — including one carrying `[unverified]` — or a
failed required suite → Fail; a surviving Major or Minor → Pass with revisions; nothing
surviving in the numbered list → Pass.
Advisory structural items, `[pre-existing]`-tagged Blockers, and findings §6 dispositioned
**Noted** never move it. A Blocker or Major you were about to disposition Noted is a signal
the disposition is wrong — re-check it against `reporting_findings.md`: a real defect whose
trigger resists cheap probing is **Decide**, never Noted.

## 6. Recommend the next route

Give every finding **in the numbered list** a disposition, plus the trigger Blocking and
Decide require (revert-test evidence stands in for it on a verdict-bearing smell), before
relaying it — `~/.agents/rules/reporting_findings.md` governs the report, relayed findings
included. **Noted** findings move out of the numbered list into **No action recommended**;
the numbered list carries Blocking and Decide only. Structural opportunities take that
file's advisory route instead: evidence and cost, no disposition, no trigger.

Record the route in each finding's **Route** field: `/plan` and `/build` for large
fixes, a direct test-first fix for small ones, `/debug` or `/plan` for the owning
code on a `[pre-existing]` `[correctness]` Blocker. Advisory structural items are a
follow-up `/plan` candidate, never a merge condition — propose one only if the user wants
the debt addressed. Do not modify source as part of panel review; return the report
before remediation begins. After remediation, the owning session reruns the full suite
and runs each remediated finding's **Verify** step (§5), then decides out loud: re-review, or
proceed. Re-review only the affected axis, and only when remediation changed the
approach a finding rested on, or touched a production file no reviewer read — an added,
relocated, or simply unexamined file has no reader, so send its path to
`refactoring-reviewer` (§2 makes it a track, so "affected axis" never reaches it).
Otherwise proceed: a fix confined to files an axis already read, with its Verify step
green, is covered.

## 7. Relay

Report to the user in the reviewers' words — worst first, verbatim or
near-verbatim, including findings that invalidate the work. Link the report
file. Your own commentary, if any, goes after the findings, clearly marked as
yours.
