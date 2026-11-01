---
name: architecture-audit
description: Reviews whether a multi-component system meets its fidelity, reliability and resource goals across code, data formats and production flows. Use for a system architecture assessment. A localized failure belongs to debug, and review of a patch belongs to review-code.
---

# Architecture audit

Assess the system against the user's investigative or operational goal. An audit
produces evidence and dispositions. It does not authorize implementation. Use
`adversarial-review` for independent judgment and finding dispositions, and add
the system-level questions below to its mandate.

## Establish the contract

Separate requested outcomes, current project decisions, measured constraints and
new hypotheses. Bind the assessment to a source revision and identify the running
binaries separately. Preserve existing recordings and observation cohorts while
using owned fixtures for fault and workload probes.

Turn claims such as comprehensive, fast or low overhead into an inspectable
coverage and workload inventory. Include hardware, permissions, cadence, source
identity and unavailable states. Keep an unimplemented feasible capability distinct
from a demonstrated platform limit. Report missing evidence before promising a
universal performance or completeness guarantee.

## Trace data through the system

Map acquisition, transport, durable commit, query, reduction and presentation for
representative data and failures. At each boundary record its owner, representation,
copy or conversion, admission bound and retained lifetime. Check identity, units,
clocks, missing values and provenance against the final value a user sees.

Trace work by frequency, input size and multiplicity. A cheap operation repeated
by two production consumers can dominate a well-optimized inner loop. Separate
CPU time from waiting, virtual reservation from charged memory, and a sampled
failure threshold from admission before allocation. A local implementation or
systems language supplies no measurement of these costs.

Inspect the lifecycle transitions the system has, such as startup failure, worker
exit, restart, partial commit, retention or capacity reuse. Check which information
survives each transition and who can recover it. Where presentation reduces retained
history, compare the source data with what remains visible as it ages or ranges widen.

## Review independently and integrate

Split substantial independent review by component or boundary under `delegation`.
Keep one integration owner responsible for crossings between reviews. A component
can satisfy its local contract while its caller loses information or repeats its work.

Reproduce load-bearing findings against production paths. Label source traces,
deterministic tests and runtime measurements separately. A profiler candidate
stays a hypothesis until measured. Verify an absence with a search or inventory
that would find the missing path, and preserve sound mechanisms worth keeping.

## Leave an actionable assessment

Give each finding a stable ID, user consequence, trigger, owning mechanism,
evidence, confidence limit and a discriminating verification case. Rank it under
the existing review severity rules. Keep advisories and unperformed probes in the
inventory, with a disposition, even when they do not justify a code change.

Merge duplicate symptoms by cause while retaining their original IDs and evidence.
Preserve evidence in the project's durable record and verify its links before handing it off.
State the inspected scope and untested claims. Do not equate a passing suite with
an architecture or efficiency verdict.

When remediation planning is requested, hand this complete inventory to
`remediation-plan`. Otherwise stop at the assessment and its unresolved decisions.
