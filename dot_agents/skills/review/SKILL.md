---
name: review
description: Decides whether a change needs an independent second review, runs it (one round, fresh reviewer, axis briefs read off the diff), verifies every finding against evidence, disposes of each, records them all. Use at the Review column, before shipping anything outward-facing, irreversible, or security-surfaced, and whenever João asks for a review or a full review. A change to instruction files goes to review-instructions instead.
---

# Review

Every change gets author-side verification, and any defect found is fixed before
moving on, whatever the task's size. This skill covers the independent second review:
when it runs and how.

## The tier

Independent review runs when the work is outward-facing (others will read or run it),
irreversible (data, published history, money), security-surfaced (trust boundaries,
authentication, secrets, untrusted input), or when João asked for one. These are
properties of the change, read off the diff. If you're unsure whether one applies, it
applies. Otherwise the author-side verification already done is the review: say so in
a line and move on. Widen these triggers only on evidence that defects escaped, not
on unease.

## Inputs

- Materialize the diff as a patch at a readable path, with the changed-file list. A
  bare ref range can resolve to a different diff in the reviewer's context.
- Collect the task's acceptance observations, and the spec when one exists. A
  deferral a design doc records as spec-authorized is part of the spec. Implementing
  less than the spec asked is not a miss when the doc records why.
- Run the project's suite once, with the command from the project's own manifests.
  Keep the output for the record. Do not give the reviewer the result, the reason
  review was triggered, or what worries you. A primed reviewer repeats your reading
  instead of making its own.

## One round, fresh eyes

Which axes apply is read off the diff, like the tier. Unsure means it applies.

- **Style, architecture, security**: every code change.
- **Spec conformance**: when a spec or acceptance observations exist. When neither
  exists, record the skip and continue. Do not stop to ask.
- **Testing**: when the diff touches a test file. Record the skip otherwise.
- **Refactoring**: always. Its findings are advisory, because they describe the
  surrounding code rather than the change.

Read [references/axes.md](references/axes.md) and dispatch the `reviewer` agent with
the diff, the acceptance observations, and the applicable axis briefs pasted whole.
One reviewer reads all axes and reports each defect once, under the axis that owns
it. Split into parallel reviewers, grouped by axis, only when one context cannot
read every changed file plus the briefs. A reviewer reporting unexamined files means
split. When João names a single axis, send only that brief.

One round: the reviewer advises and you own the verdict. Settle a disagreement with
evidence, or send it to João with your recommendation. Never send it back to the
reviewer.

## Verify, then classify

Each finding is a claim. Confirm or refute it with a tool result: run the test, read
the line, reproduce the input. Refuting requires positive disproof: the failure
cannot occur, the cited clause doesn't say that, or the code already handles it. A
blocking claim you can neither reproduce nor disprove goes to João as escalated,
with the probe you couldn't run named. Record refuted findings as refuted, with the
evidence. Never drop one silently. To dismiss a finding because the repo's own
instructions allow the pattern, quote the sentence that allows it, with its path. If
you can't quote it, the repo doesn't say it, and the finding stands. When reviewers
were split and the same defect arrives under two names, record it once, keeping the
stronger evidence and the better fix.

Two checks classify what survives:

- **The revert test.** If the finding's evidence would still stand with the change
  reverted, the finding is about the codebase rather than the change. Pre-existing debt
  cannot block this change. It becomes a note or a tracked task. The change owns
  what it created: the duplication it introduced, the site it added to an existing
  smell's or coupling's span, the function it grew past the point the finding rests
  on. Line overlap does not decide it. A two-line edit inside a pre-existing
  300-line function did not introduce that function's length. Two findings are
  exempt and stay real wherever they sit: a concrete correctness defect (wrong
  output a nameable input reaches), and a test whose outcome is independent of its
  subject, which claims safety it does not provide.
- **The stability probe.** When a coupling finding's weight rests on the coupled
  target changing, run one git-history check: commits touching the path in the past
  year, plus the path's age. A path older than the window that changed in at most
  two commits is stable. Drop the finding and record the count. A younger or busier
  path keeps the finding, with the count as evidence. An external or historyless
  target keeps the finding, labeled with the stability assumption it rests on. An
  empty log is not evidence of stability. This probe does not apply to temporal
  coupling. Judge that on whether the ordering or interleaving assumption can be
  violated.

## Severity

Assign severity after verification, in the reviewer's three words: blocking (wrong
behavior, data loss, or a security hole; fixed before done), should-fix (a real
defect that doesn't block), note (an observation, no action required). The concrete
failure picks the word. Inflating is as much a defect as under-reporting: a note
called blocking teaches the reader to ignore the word.

- Blocking also covers a failed required suite until it is diagnosed, and a
  change-introduced test whose outcome is independent of its subject.
- A pre-existing correctness defect belongs to the owning code. Track it there or
  escalate it. It is never this change's blocking condition. State it apart in the
  brief.
- A refactoring finding measures friction. It is at most should-fix, and only when
  the change created the friction. Otherwise it is a note or a tracked task.
- A testing finding takes its severity from what the test costs. Blocking: false
  safety, or production code contaminated by test logic. Should-fix: the test
  obstructs change or hides defects, which covers interaction assertions on code
  we own, coupling to implementation detail, a framework mock outside the escape
  hatch, shared mutable fixtures, a missing reset or teardown, a sleep-based wait,
  Mystery Guest, Interacting Tests, Resource Leakage, and Slow Test. Note: friction
  on the next reader, which covers naming, AAA structure, Eager Test, Obscure Test,
  Free Ride, Assertion Roulette, Hard-Coded Test Data, Trivial Test, and an
  assertion weaker than the situation allows. Low regression value alone does not
  block.

Security is part of this pass, with no separate pass later: what untrusted data
enters, what authority the code exercises, what a hostile input could reach.

## Dispose

Dispose of each verified finding one of four ways: fixed (small and reversible: in
this batch); not a defect, with why; tracked as a task, with its id; escalated to
João, with your recommendation. Fix blocking findings before done. Observe every
fix: rerun the suite and the check the finding names. You verify the fixes. Never
re-dispatch the reviewer for the same change.

A disposition covers a defect: something behaves wrongly, or a result is unverified.
A finding that names no defect, an observation about naming, scope, or documentation,
takes the advisory route instead, reported with its evidence and its cost and no
trigger. A smell, a test-structure note, and a coupling finding go either way, and
the revert test decides: verdict-bearing when the evidence would not stand with the
change reverted, advisory when it survives. A correctness defect is never advisory,
and neither is a test whose outcome is independent of its subject, which is false
safety rather than friction.

A blocking or should-fix finding names its trigger: the caller, input, configuration,
or sequence that reaches the defect. A note names the probe instead, what you searched
and over what scope. An exported surface always has a nameable trigger, so "no caller
in this repo" does not make a finding a note. A real defect whose trigger resists cheap
probing, a race, a production-only configuration, a third-party response you cannot
induce, is escalated with the probe you could not run.

A reviewer's severity words rank impact and say nothing about whether a finding is a
defect. Map them: its top word always names one; its middle word names one where its
ladder ranks defect impact, and where the ladder ranks friction instead, the revert
test decides; its lower words name a defect only where the concrete effect is the
system behaving wrongly. Severity does not survive the mapping. An advisory-routed
finding is advisory, not a lesser defect, and holds no gate open.

A finding can repeat the shape of one already fixed in this task: the same
invariant broken again, the same window guarded again. Treat the repeat as a
defect in the mechanism rather than in the fix. Only you can see it, because the
reviewer has one round. Before writing another guard, ask whether the mechanism
should exist, and record the answer with the disposition.

## Record everything, brief the decision

Every finding goes on the task's record with its severity and disposition, along
with the suite output and any recorded axis skips. None are dropped or folded into
"a few minor things". Each finding carries what a zero-context session needs to act
on it: the place; the concrete failure, as a rule, spec clause, or attack path,
never a preference; the trigger that reaches it (the caller, input, configuration,
or action sequence; revert-test evidence stands in for a change-created smell; an
exported surface always has a nameable trigger); the simplest viable fix, where a
heavier fix must cite the verified reason the simpler one fails; and how to verify
the fix. Order worst first. Group notes under one no-action heading, a line each.

The review ends when every finding has its disposition. Nothing re-opens it. A clean
report is one line on the record and in the brief. An empty review of a clean diff
is correct.

The reply to João is the brief. It names the findings that need his decision and
the ones whose damage predates the work under review. The `brief` output style says
how everything else appears.
When nothing blocks, say so plainly. Then the verdict: proceed, or what blocks. A
proceed verdict moves the card to Done.
