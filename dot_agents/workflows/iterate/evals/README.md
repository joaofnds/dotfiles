# Iterate paired trials

This directory runs small, read-only stage trials without starting the iterate runner. It compares instruction snapshots, effort settings, or both against the same cases. Each attempt runs in a fresh temporary workspace and keeps the first output without correction.

These are judgment probes. Tools are disabled and the corpus is supplied up front,
so they cannot establish actual rule loading, exception discovery, evidence reuse,
continuation or supervision. Those behaviors need separate trials with observable
actions and the exact production prompts. A bundle comparison cannot attribute an
effect to each policy changed within it.

The record shape follows the local Rehearsal harness: frozen context, a provider envelope, raw per-model usage, exact checks, and explicit failures. This harness stays small and local to iterate because Rehearsal currently discovers cases under its own repository and copying this corpus into that control tree would make the experiment harder to reproduce.

## What the cases test

`triage` supplies an unsupported Inbox capture, a contradiction between a summary and its table, missing raw attempts, a deferred card whose return event has not happened, and one ready accepted card. Its exact checks refuse admission, retain the evidence gap, and select the already accepted work.

`reflect` supplies a Done card whose handoff claims a rollout from one medium triage attempt. The evidence lacks a high arm, a reflection case, repetitions, effective-effort evidence, and semantic review. Its exact checks require an Adjust verdict, preserve those missing facts, refuse a completion claim, and propose a representative holdout.

The harness validates the complete output schema, including unscored required fields, before applying exact checks. The checks guard fields with known answers. They do not judge whether `brief_reason` faithfully reconciles all evidence or whether the cited files support it. A reader who did not produce the output must inspect each `first-output.json` beside its request, instruction payload, fixture, and provider envelope. Record that judgment with [semantic-review.example.json](semantic-review.example.json). Do not derive a semantic pass from the script's PASS state.

## Freeze the experiment

Copy [experiment.example.json](experiment.example.json) and place the frozen corpus snapshots and criteria file beside the copy. Fill each SHA-256 before any model call. Each case entry also needs a `sha256` fingerprint covering the exact manifest, request, stage instructions, and fixture paths and bytes. The harness refuses changed criteria, instruction snapshots, or case bundles; unsafe or repeated arm or case IDs; an existing output directory (including symlinks); and schedules whose per-run caps exceed the total. It also refuses any total provider budget above $10.

Use two arms with the same corpus and different `effort` values for an effort comparison. Use two arms with the same effort and different snapshots for a corpus comparison. A small factorial trial can use baseline-high, baseline-medium, candidate-high, and candidate-medium arms.

Inspect the configured model and effort source without reading credentials:

```sh
jq '{model, effortLevel}' dot_claude/private_settings.json
/opt/homebrew/bin/claude --version
```

Keep the alias found in settings as the configured model. The provider envelope's `modelUsage` keys are the effective model IDs observed for each attempt.

Referenced inputs must resolve inside the configuration directory or a directory explicitly authorized with repeatable `--allow-root` arguments. Symlinks cannot expand that authority; fixture trees reject symlinks and special files. Authorize only the input directories intended for the experiment. When preparing a case fingerprint, its manifest directory is implicitly allowed instead of the configuration directory:

```sh
mise exec -- bun run evals/run.ts \
  --fingerprint /path/to/cases/triage/case.json \
  --allow-root /path/to/stage/instructions
```

Copy the printed digest to that case's `sha256` entry. Repeat the needed `--allow-root` arguments when running. A fingerprint command reads inputs and never calls the provider.

## Run

From `dot_agents/workflows/iterate`:

```sh
mise exec -- bun run evals/run.ts \
  --config /path/to/frozen/experiment.json \
  --output /tmp/iterate-eval-result
```

The output directory is created atomically with mode `0700`; all retained files use `0600`. Input bytes are frozen before provider dispatch and reused for every attempt. An interrupt seals the current attempt as `PROVIDER_ERROR`, records `interrupted: true` in the summary, and stops the remaining schedule.

The schedule rotates arm order between cases to reduce a fixed first-arm bias. Runs remain sequential so the harness can retain cost after every provider call. `maximumScheduledCostUsd` is the sum of every per-run cap. `actualProviderListCostUsd` is the sum reported by successful or failed provider envelopes.

Each attempt contains:

- `instruction-payload.md` and `request-payload.md`, which are the intended snapshots.
- `delivered-system-prompt.md` and `delivered-request.md`, which are the exact strings passed to the CLI.
- `invocation.json`, which records hashes, configured model and effort, the cap, and redacted argument positions.
- `provider-stdout.txt` and `provider-stderr.txt`, retained even when the provider or parser fails.
- `first-output.json` when structured output exists.
- `attempt.json`, which keeps all exact-check results and raw top-level and per-model usage fields.

The output receipt echoes four identifiers supplied before the corpus. Its checks
verify those echoes only. They cannot establish receipt of the corpus or its far
boundary, nor compliance with its instructions. The captured delivered files record
what the harness passed to the CLI, not the provider's hidden request body.

## Expand the holdout

Add a case directory with a manifest, request, fixture tree, output schema, and exact checks. Fix expected fields from the evidence before the first output. Prefer safety decisions, missing facts, contradictory evidence, ownership, and authority boundaries over wording or response-length checks.

Raise repetitions only while the sum of per-run caps stays within the declared and hard budgets. Preserve every attempt. A rerun goes to a new output directory. More cases and repetitions improve coverage, but the results remain bounded to the recorded model, corpus, fixtures, and first outputs.

Adopt medium for ordinary intake or reflection only after representative holdouts pass exact and independent semantic review often enough to characterize variation. One or two outputs per case support an explicit opt-in experiment. They do not establish general quality equivalence or justify changing the default.
