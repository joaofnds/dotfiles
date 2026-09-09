---
name: triage
disable-model-invocation: true
description: Audits every open card against current evidence and the product goal, decides what remains worth doing, organizes milestones, merges and splits work, and orders the next iteration. Runs only on direction, per board. Detailed design belongs to shape.
---

# Triage

Leave a backlog whose cards describe the current need and whose first action can
start with the evidence and resources it requires. Work through the `backlog` CLI
under `~/.agents/rulebook/backlog-board.md`, which owns card creation and movement.
Apply evidence-backed planning decisions within the recorded goal and the current
directive. Ask only about a missing or changed goal, an unresolved product tradeoff,
or a choice the always-loaded Acting section reserves. Record a recommendation
for each.

A held card, in Build or Review with an assignee, belongs to that session. Append
the triage verdict and add references or dependencies, keeping the holder's text and
values, since rewriting the notes field can drop a note the holder writes meanwhile.
Propose other changes on the triage doc. An old update is a reason to check ownership,
never proof that the session has released the card.

## Establish the scope

Read the newest triage doc for the goal, then every newer reflection and the board's
accepted decisions. Apply reflection proposals only where current evidence supports
them. Recover a missing goal from an explicit direction or an accepted project
record. If none states one, propose it and continue the factual audit, leaving
priority, milestone commitments, and goal-based removals unsettled until it is answered.
When an answer arrives, record it on this run's doc and finish the ordering.
Until then, mark the handoff incomplete even when the factual audit is complete.

List every open card before editing any. Read their complete bodies, acceptance,
definition of done, notes, attached records, and dependencies, including held cards.
Read Done titles and the completed or archived records that may have answered an
open need. Search recent changes by behavior and domain concept as well as title.
Read the project's other work registers so an unfiled blocker is not missed.

Follow cross-board pointers into the owning repository. If it is unavailable, mark
the affected claims and waits unverified and continue the independent work. Reading
a linked board does not authorize reorganizing it. Record cross-board waits on the
local card, with a reciprocal reference only where that board is also in scope.

## Establish what is true

Check every checkable claim against the thing that owns the fact. Read current code
and callers for implementation claims, inspect the original record for a reported
decision, and reproduce behavior or measurements with a focused check. A matching
symbol or commit title alone proves neither behavior nor completion. For an absence
claim, record the search scope that would have found a counterexample.

Record each card's evidence on the triage doc, mapping its claims to confirmed,
contradicted, or unverified findings. Include the command or source, observed result,
repository revision, and relevant local changes. Check resources the next step needs as well as
code, since an unavailable fixture or service can invalidate an otherwise clear card.
A check that cannot run stays unverified with the reason and the action that would
settle it. Low priority never exempts a card from the sweep.

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

For each card, record who benefits, what observable outcome serves the goal, and
what happens if it is left undone. Test the proposed solution against that need.
A simpler change, an existing capability, or removing the need can replace the
proposal. Age, author emphasis, technical elegance, and effort already spent do not
establish value. Maintenance earns its place through a concrete risk or cost.

Give every card a disposition with its evidence and destination:

- Keep work with a justified outcome. Name whether its next action is implementation,
  shaping, or investigation, and what each unresolved question prevents.
- Defer a valid need whose timing or prerequisite is absent. Record what would make
  it worth taking up and when or on what event to reconsider it.
- Complete work only when current evidence proves all remaining acceptance and
  definition of done under the board guard. A partial fix leaves the remainder open.
  A small reversible defect fix a card makes obvious lands under Ownership, and the
  card closes citing the commit. A larger fix stays a card.
- Merge or split work through the scope accounting below.
- Archive a duplicate after absorption, a superseded proposal, or a need contradicted
  by evidence or excluded by the recorded goal. Cite the survivor or the reason.
  Uncertainty alone does not justify removal. Preserve the record rather than deleting it.

Record a settled rejection as an accepted board decision, named for the concept and
carrying the reason and evidence that would justify reconsidering it. A smaller
backlog is not a success measure. Explain net growth when necessary work or splits
add cards. A missing outcome needed for a milestone gets a card with its evidence.

## Consolidate and split without losing scope

Compare outcomes, symptoms, and acceptance across the whole set. Shared files alone
justify neither a merge nor a dependency.

Merge cards that represent the same outcome or cannot be accepted independently.
Choose a survivor and give it one coherent description and acceptance list containing
all still-valid unique requirements, source references, and constraints from the
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

## Organize milestones and order

Make each milestone an observable increment of the goal. Record what becomes
possible, how completion will be demonstrated, the required cards, and what remains
outside it. Reuse or reshape existing milestones before creating another. Order them
by the feedback or outcome needed next, respecting actual commitments and constraints.

Distinguish the smallest set needed for that increment from optional follow-ups.
Assign retained planned work to the increment it serves. Keep deferred work outside
the committed set. Detail the next increment enough to execute while leaving later
ones at the outcome and dependency level.

Record real prerequisites as dependencies and historical relationships as references.
Recheck waits whose blockers are Done and detect missing targets and cycles after
merges and splits. Keep a Done dependency on the card, since the next session reads
only the card. Point a dependency on an archived card at the card that absorbed it,
or remove it where none did, and record the change on the triage doc. A blocked
valuable card keeps its priority while the feasible prerequisite comes first.

Use one consequence scale for every open card, including a recommendation for held
cards. Set priorities on editable cards with the reason in the current triage verdict:

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

## Prepare the next iteration

Write one ordered queue of feasible next actions, separating implementation from
shaping or investigation. A queue entry names its card, milestone, next action, why
it precedes the next entry, and what it unlocks. Keep deferred, externally blocked,
held, and unresolved product decisions out of the selectable queue with a reason
for each exclusion. A runnable investigation may remain when its purpose is to
resolve a named unknown. A build entry needs observable acceptance, checked premises,
available resources, and no unresolved decision that changes its scope.

Put the first card's bet on the triage doc with the goal observation it should
produce, how to observe it, and the budget it gets. Use the recorded budget or state
a proposed bound without inventing spending authority. Identify sitting companions
separately, since the next iteration picks one card. Name shared files or owned trees
that prevent parallel work. Account for capacity by naming work displaced from the
previous queue when new work moves ahead of it.

The iterate script picks the first card of the ready list sorted by priority, reads
no triage doc, and stops when that card is held. The list includes Build and Review
cards and orders ties by card ID, so the queue's first card has to be the lowest-ID
card at the top priority in use, held cards included. Set the priority the scale
gives, then read the list back before the handoff. Where the list and the queue
disagree, keep the fields truthful, say in the reply which card the script will
pick, and give the manual next action. Re-check this paragraph when the script reads
the triage doc.

## Apply and check the sweep

Before each mutation, re-read the affected card and reconcile intervening edits.
Record before and after values and evidence on the triage doc as changes happen,
including complete replaced text and newly created IDs. Read the result back so a
successful command with an incomplete write cannot pass unnoticed. The record must
support recovery even when the board has no git history.

Re-list the board after editing. Account for every initially open and newly created
card in the doc with its evidence verdict, disposition, milestone or deferral,
priority rationale, and readiness or blocker. Audit cards arriving during the sweep
or list their IDs as unreviewed and mark the sweep incomplete. Check that references
resolve and each retained requirement has a home. At the end of the sweep no card in
To Do has a question as its next step. Recheck the first action against the current
tree and resources before handing it off.

The dated triage doc opens with the goal, what changed since the last run, the next
card and its bet or the blocker, and whether the sweep and handoff are complete.
It carries the milestone sequence, ordered queue, coverage audit, reversible change
record, and unsettled decisions with recommendations. When there is a first card,
attach the doc so its next session can find it. Record recurring card-writing defects
and reflection kaizen candidates there without starting a corpus change during triage.

Run the review skill on the record before the handoff and resolve its findings.
Reply with the next action, the doc, and one numbered list of decisions that remain.
If no card can proceed, say what would make the first useful action possible.
