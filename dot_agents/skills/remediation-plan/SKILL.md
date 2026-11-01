---
name: remediation-plan
description: Turns an audit or set of cross-component findings into a complete execution plan with acceptance evidence, dependency order and a durable progress record. Use when a future orchestrator must remediate the whole set across sessions or compactions. Shape owns an individual task's design.
---

# Remediation plan

Preserve the outcome of every finding while choosing work that removes its cause.
Use `shape` for an unresolved package design and `review-docs` for independent
review of the completed plan. This skill owns coverage and the execution contract
across packages, not a second build or board workflow.

## Reconcile the complete input

Read the original findings, subsystem reports and advisories, current code state,
accepted decisions and overlapping work. Assign stable IDs before consolidating.
Map every input to an owning package or an evidenced disposition. Preserve prior
acceptance on reused work and distinguish an added outcome from a defect in a
previously completed task.

Record actual implementation authority separately from proposed scope and order.
A new plan does not itself reactivate deferred work. Preserve active ownership,
installed observations and privilege boundaries. An unavailable capability remains
an open requested outcome until its evidenced limitation is accepted.

## Define packages by observable outcomes

For each package record:

- The user-visible goal, source finding IDs and the production boundary that owns it.
- The counterexample or baseline probe, with the result that would disprove the finding.
- The chosen approach, its decisive evidence and the production paths it replaces.
- Stable acceptance IDs with input, expected result, verification method and evidence location.
- Prerequisite interfaces, allowed edits, exclusions and the condition that ends the package.

Keep numerical budgets tied to their source and workload. Mark new engineering
targets as proposals until adopted. Freeze the measurement contract before
optimizing, including build identity, input fidelity, sample conditions and
uncertainty. Passing by raising a budget, dropping a metric or narrowing history
changes the outcome and requires its own decision.

Fix the mechanism at its owner. A new abstraction, process or format needs a
demonstrated requirement that the existing boundary cannot meet. Preserve
compatibility and raw-data meaning through cutover, and identify obsolete
production paths to remove. A test-only replacement does not complete a migration.

## Test the contracts against each other

Before accepting the sequence, construct boundary counterexamples for interacting
criteria. Where the system has the relevant boundaries, examples include a recovery
deadline against commit cadence, reconstruction after predecessor and cache expiry,
ownership after supervisor death, or generation reuse with a paused reader. Include
the applicable counterexamples in acceptance, with the representation or policy that
makes the promised outcomes compatible.

Make the coverage inventory an acceptance set, including the sources or comparison
tools that define it. Assign every feasible missing family a delivery owner.
An implementation list that covers fewer cases than the goal cannot close it.

Separate an integrated prerequisite from its later observation gate. Record real
dependency edges and the authorized order. When work waits, name the unfinished
acceptance IDs and which independently authorized packages can proceed. A long
observation stays pending even when all code tests pass.

## Make progress recoverable

Keep the plan's acceptance contract stable and maintain a small execution index
in the project's durable record. Store raw evidence separately and link it by
acceptance ID. Each index entry carries status, owner, prerequisites, implementation
revision, evidence, review disposition and exact next action. Preserve failed and
unverified results as such. Planning completion is separate from implementation
completion.

At integration boundaries record the active acceptance IDs, HEAD, owned edits,
delegated scopes and blockers. Recovery after compaction reads that checkpoint
and its evidence, then reconciles the actual repository and agent state before
resuming. A stale checkpoint does not authorize discarding concurrent changes or
repeating work whose result is already verified.

Give each delegated package its goal, inputs, allowed writes, required acceptance
IDs, exclusions, provider policy and return contract. One orchestrator integrates
the results and verifies load-bearing evidence. New prerequisites require a named
acceptance case that cannot pass without them. Record unrelated discoveries
outside the sequence instead of turning them into detours.

## Close the planning work

Have independent review challenge coverage, assumptions, contract compatibility,
dependency cycles and the evidence needed to claim completion. Dispose of its
findings under the owning review workflow. Check IDs and links mechanically, then
test whether a fresh reader can recover the next action from the record alone.
That probe does not establish reliable behavior over a real long-running session.

Provide one handoff prompt pointing to the plan and execution index, carrying the
authorization actually given. State any remaining activation decision separately.
Execution ends only when the mapped acceptance is met or the remaining decisions
and observations are reported open. An explicitly accepted limitation is recorded
as a limitation, never as delivered functionality.
