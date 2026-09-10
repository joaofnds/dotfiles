---
name: triage
disable-model-invocation: true
description: Screens incoming work or audits the full board against evidence and the product goal, consolidates cards, and orders accepted work. Runs only on direction, per board. Detailed design belongs to shape.
argument-hint: "[inbox|full]"
---

# Triage

Leave a backlog whose cards describe the current need and whose first action can
start with the evidence and resources it requires. Work through the `backlog` CLI
under `~/.agents/rulebook/backlog-board.md`, which owns card creation and movement.
Apply planning decisions within the recorded goal, directive, and board admission
policy. Prepare new admissions and added scope for one batch decision. Ask also
about a missing or changed goal or an unresolved product tradeoff, with a
recommendation for each. Screening does not authorize implementing a discovered fix.

A held card, in Build or Review with an assignee, belongs to that session. Append
the triage verdict and add references or dependencies, keeping the holder's text and
values, since rewriting the notes field can drop a note the holder writes meanwhile.
Propose other changes on the triage doc. An old update is a reason to check ownership,
never proof that the session has released the card.

## Choose the scope

`inbox` screens incoming work and returning deferrals. Read
[Inbox screening](references/inbox.md) for its audit set and handoff.
`full`, or an invocation without an argument, audits the whole board. Read
[Full-board planning](references/full-board.md) for its audit set and handoff.
Both modes use the evidence, disposition, and scope accounting below. The audit
set is the fixed set of IDs recorded at entry. New arrivals wait for the next pass.

## Establish the goal

Read the newest triage doc for the goal, then every newer reflection and the board's
accepted decisions. Apply reflection proposals only where current evidence supports
them. Recover a missing goal from an explicit direction or an accepted project
record. If none states one, propose it and continue the factual audit, leaving
priority, milestone commitments, and goal-based removals unsettled until it is answered.
When an answer arrives, record it on this run's doc and finish the ordering.
Until then, mark the handoff incomplete even when the factual audit is complete.

Read the complete bodies, acceptance, definition of done, notes, attached records,
and dependencies for the audit set before editing it. Related cards outside that
set supply context without acquiring a full audit.

Follow cross-board pointers into the owning repository. If it is unavailable, mark
the affected claims and waits unverified and continue the independent work. Reading
a linked board does not authorize reorganizing it. Record cross-board waits on the
local card, with a reciprocal reference only where that board is also in scope.

## Establish what is true

Check the claims that support each disposition against the thing that owns the
fact. Read current code and callers for implementation claims, inspect the original record for a reported
decision, and reproduce behavior or measurements with a focused check. A matching
symbol or commit title alone proves neither behavior nor completion. For an absence
claim, record the search scope that would have found a counterexample.

Record each card's evidence on the triage doc, mapping its claims to confirmed,
contradicted, or unverified findings. Include the command or source, observed result,
repository revision, and relevant local changes. Check resources the next step needs as well as
code, since an unavailable fixture or service can invalidate an otherwise clear card.
A check that cannot run stays unverified with the reason and the action that would
settle it. Low priority never exempts a card in the audit set from checking.

Bring each editable card's description, acceptance, definition of done, and
dependencies to the present need, and leave a current field as it is. Keep every
requirement that still holds and state an unresolved one as an unknown. A rewritten
criterion keeps the source the board rules require. The next session must be able to
act from those fields without reconstructing the task from past triage records.

Fix any field of an editable card that disagrees with the card's own text, its
status, or another card's status, such as a parent left open with every child Done.
Note a title change on the card, since the file name keeps the old title. Remove
from an editable card ANSI escape codes pasted into a body and a note pointing at a
section that no longer exists, and replace a line-number citation with the symbol
that survives the next refactor.

Keep one dated `Triage verdict` section in each editable card's notes with its
current disposition, reason, unresolved claims or blockers, next action, and triage
doc link. Replace that section on each run, preserving other notes, and move the
prior verdict to the triage doc. A held card gets one appended per run, and the
newest is current.

## Decide what deserves work

For each card in the audit set, record who benefits, what observable outcome serves
the goal, and what happens if it is left undone. Test the proposed solution against that need.
A simpler change, an existing capability, or removing the need can replace the
proposal. Age, author emphasis, technical elegance, and effort already spent do not
establish value. Maintenance earns its place through a concrete risk or cost.

Give every audited card a disposition with its evidence and destination:

- Keep accepted work with a justified outcome, or propose acceptance of a capture.
  Name whether its next action is implementation, shaping, or investigation, and
  what each unresolved question prevents. An investigation needs a question,
  resource budget, and stopping condition. Its proposed outcome is an answer.
- Defer a valid need whose timing or prerequisite is absent. Record what would make
  it worth taking up and the next check required by the board deferral policy.
- Complete work only when current evidence proves all remaining acceptance and
  definition of done under the board guard. A partial fix leaves the remainder open.
  Record a newly discovered fix for admission without implementing it during screening.
- Merge or split work through the scope accounting below.
- Archive a duplicate after absorption, a superseded proposal, or a need contradicted
  by evidence or excluded by the recorded goal. Cite the survivor or the reason.
  Uncertainty alone does not justify removal. Preserve the record rather than deleting it.

Record a rejection and what evidence would justify reconsidering it on the card.
A rejection that settles a recurring product choice also becomes a board decision.
A smaller backlog is not a success measure. Explain net growth when necessary work or splits
add cards. A newly discovered outcome needed for a milestone is captured for admission.

## Consolidate and split without losing scope

Compare outcomes, symptoms, and acceptance across the audit set and related cards.
Shared files alone justify neither a merge nor a dependency.

Merge cards that represent the same outcome or cannot be accepted independently.
Propose any added scope under the board admission policy before changing an accepted
card. Once authorized, give the survivor one coherent description and acceptance
list containing all still-valid unique requirements, source references, and constraints from the
absorbed cards. Map those requirements to the survivor and update incoming dependencies
before archiving the originals with pointers. Resolve self-links and cycles.
If a required dependency replacement affects a held card or another board outside
the directive, leave the merge proposed until that change is authorized and verified.

Split a card when its outcomes can be delivered and evaluated separately, when it
exceeds one build session, or when an uncertain or unavailable part blocks an
otherwise useful increment. Prefer slices that produce usable behavior over layers
that deliver value only after every card finishes. Keep an inseparable small change
on one card. A design decision needs its own card only when it warrants separate
context or blocks other work.

Map each original acceptance and definition-of-done item to a surviving card or an
explicitly justified retirement. Give each new card its own outcome, acceptance,
source references, and dependencies. Preserve parent relationships without a cycle
between a parent waiting on children and children waiting on that parent.

Keep distinct outcomes that benefit from one sitting as linked cards. Name the
shared setup and whether doing them together delays a useful result. Record a shared
design decision once and make the builds that need it depend on its resolution.

## Set priorities

Use one consequence scale for audited cards and related queue comparisons. Set
priorities on accepted editable cards and propose them for captures and held cards,
with the reason in the current triage verdict:

- High means delay causes material current harm, misses a substantiated time window,
  or blocks the next necessary increment. Name the consequence and its timing.
- Medium means a demonstrated benefit to a planned increment whose delay is affordable
  while High work is resolved.
- Low means a valid improvement with little present cost of delay. Speculative work
  whose need is unproven needs clarification or deferral before a build slot.

Order within that scale by cost of delay, the value of the outcomes unlocked, and
the effort and uncertainty of the smallest useful result. State the evidence behind
estimates. Do not rank by the number of dependent cards or invent numerical scores
from missing inputs. A short investigation can lead when it resolves a decision
blocking valuable work, with the question, budget, and stopping condition on its card.

When two outcomes need a product preference the sources do not settle,
recommend one and name what it displaces. Continue ordering the independent work.

## Reconcile selection

The runner selects dependency-ready, non-deferred work from the accepted statuses,
ordered by priority and then card ID. Automated intake cannot add IDs to that run's
selection set. Compare the proposed first action with that actual selection before
handoff. Where they differ, keep priorities truthful, report the runner's pick and
give the manual next action. Never treat a written queue as enforcement.

## Apply and check the sweep

Before each mutation, re-read the affected card and reconcile intervening edits.
Record before and after values and evidence on the triage doc as changes happen,
including complete replaced text and newly created IDs. Read the result back so a
successful command with an incomplete write cannot pass unnoticed. The record must
support recovery even when the board has no git history.

Re-list the board after editing. Account for every ID in the audit set and every
card created by a merge or split, with evidence verdict, disposition, milestone or
deferral, priority rationale, and readiness or blocker. List unrelated arrivals as
pending the next pass. They do not make this batch incomplete. Check that references
resolve and each retained requirement has a home. Every audited To Do card has an
accepted actionable outcome. Investigations follow the board route for answering a question. Recheck the first action against the current
tree and resources before handing it off.

The dated triage doc opens with the goal, what changed since the last run, the next
card and its bet or the blocker, and whether the sweep and handoff are complete.
It names the mode and carries its handoff, coverage audit, reversible change record,
and unsettled decisions with recommendations. When there is a first card,
attach the doc so its next session can find it. Record recurring card-writing defects
and reflection kaizen candidates there without starting a corpus change during triage.

Run the review skill on the record before the handoff and resolve its findings.
Reply with the next action, the doc, and one numbered list of decisions that remain.
If no card can proceed, say what would make the first useful action possible.
