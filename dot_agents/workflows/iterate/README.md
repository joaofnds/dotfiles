# iterate

A runner for a supervisor carrying one accepted card through its stages in fresh
agent sessions. Invoke the `iterate` skill with a card ID, or without one to have
it propose the next card for confirmation. The runner itself always takes an
explicit card. The supervisor reads each stage's result before deciding how to
continue.

```sh
iterate step CARD [--STAGE-agent provider:model[:effort] ...]
iterate step CARD --continue-author [agent options]
iterate resume CARD [--STAGE-agent provider:model[:effort] ...]
iterate status [CARD]  # read the run journal; omit CARD for the most recent run
iterate recover CARD --run UUID --intent UUID --evidence "typed inspection"
iterate --help
```

The top-level skill accepts the same stage selectors, for example
`/iterate CARD --build-agent claude:sonnet:high`. It passes the complete set to
every runner call, and the runner applies only the current stage's selection.
Shape, debug, verify, build, and review can each have an independent selection.

To Do and Shape run `shape`; Build runs `build`; Review runs `review`. A Shape card
with `investigate:debug` or `investigate:verify` runs that skill. If a normal shape
session leaves the card in the same Shape column with acceptance criteria, the
runner promotes it to Build; investigations require their own verdict and column
change. After a stage reports Done, one final `step` requires a clean tree and checked
acceptance criteria and definition-of-done items before closing the run without
starting another agent. Cards explicitly labeled `partial` or `abandoned` retain
the board policy's checklist exception. A refused run remains incomplete and can be
retried after its requirements are checked. Checking boxes does not prove the work's
correctness.

To retain a completed shaping author's context for Build, pass `--continue-author`
on that Build step. Both stages must use the same explicit provider, model and
effort, and the recorded native session, runtime inputs and role policy must still
be compatible. Use the exact native model identifier; an alias resolving to a
different model name is incompatible. For example, use the same `MODEL_ID` in
`step CARD --provider claude --model MODEL_ID --effort high` for Shape and
`step CARD --continue-author --provider claude --model MODEL_ID --effort high` for Build.
The flag applies to one call; ordinary steps and Review remain fresh. It refuses
missing, failed or incompatible history without starting a fresh author instead.
After a continued Build stalls, use ordinary `resume` for that Build session.
The current Build task and role instructions are sent to the retained session.

This is a CLI option; the installed supervisor skill and its defaults are unchanged.
Unknown required-tool outcome coverage blocks author continuity even when a Shape
attempt is otherwise recorded as completed. Source and fixture checks establish
routing and accounting, not native instruction uptake or accepted-delivery savings.

Each stage retains the review requirements of its skill. Build may complete those
reviews and move the card to Done itself. Triage and reflection remain separate
skills for screening work and assessing outcomes against the broader goal.

## Implementation

`main.ts` validates the requested card and advances one stage. `board.ts` reads
cards and writes the shape promotion through the backlog CLI. `journal.ts` keeps
attempts and limits across invocations. `session.ts` starts the selected
harness, retains raw output and reports, and handles cancellation and timeouts.
Each harness has an adapter, `claude.ts` or `codex.ts` with its `*-runtime.ts`
helper, that drives its vendor SDK (`@anthropic-ai/claude-agent-sdk` or
`@openai/codex-sdk`), turns the SDK's messages into the runner's events, and
declares its runtime contract, completion rule and resume rules. `harness-host.ts`
runs one adapter as the session's process-group leader, so the SDK and the CLI it
starts are descendants that a cancel or timeout stops together. It writes each SDK
message with its events as one JSON line, which `hosted.ts` decodes for the session.
Output an adapter cannot read stops the session: a Claude stdout line that is not
JSON, or a Codex event missing a field the adapter reads.
`provider.ts` registers the adapters, resolves a provider name to one, and checks
selections and dollar caps against the capabilities each adapter declares. Each
adapter runs the CLI its SDK bundles, so the SDK pin in `package.json` also pins the
CLI. `ITERATE_CLAUDE_CLI` or `ITERATE_CODEX_CLI` replaces that CLI with the one at the
absolute path it names, and nothing then checks that CLI against the SDK. A harness
whose SDK bundles a CLI that answers `--version` is added by writing its adapter and
registering it there. Each ordinary `step` starts a fresh
process on the host. The
[session diagram](../../../docs/iterate-session.svg) shows that lifecycle for
Claude.

This directory installs to `~/.agents/workflows/iterate`. The launcher at
`~/.scripts/iterate` reconciles pinned dependencies with Bun, then runs
`src/main.ts` with the caller's arguments and working directory. Where `mise` is
installed, the launcher first loads the environment a mise-hooked shell would have
in that directory, so a stage uses the Claude or Codex account the directory's mise
config names even when the calling shell never ran mise's hook. A variable that
config sets replaces the caller's value, a variable mise set for the caller's
previous directory is removed, and every other variable passes through unchanged. It
refuses to run where that config is untrusted, because mise would skip the config
and the stage would use another account.

A stage selector has the form
`--STAGE-agent provider:model[:effort]`. A stage without one uses the Claude CLI
defaults. `claude` and `codex` can dispatch. An unknown provider is refused when
the options are parsed, and an unsupported model or effort when its stage is
reached. A journal that names a retired provider stays readable by `status`, and
its saved plan is not reused. Codex runs one `codex exec` per attempt through the
Codex SDK. It inherits native permissions and sends the literal `$STAGE CARD` plus
the supplied stage guards as turn input. Explicit pins are checked against the advertised
Codex 0.166.0 catalog; they are never substituted or clamped.
Codex turn completion and final reply are recorded separately from stage success.
Required-tool outcome coverage remains unknown in the SDK's events.
A settled completed turn with a final reply may complete the session when observed
tool items and the existing configuration and process guards pass.
The runner still requires the card transition, and native editing, resume,
permissions and cancellation acceptance require separate evidence.
The SDK reports no effective configuration, so the attempt records the model,
effort and working directory the runner requested, and these are not execution
telemetry. Its events carry no model reroute, declined tool or approval request,
so the runner cannot check for any of them. Codex's stderr reaches the raw log only
when the CLI exits nonzero, because the SDK holds it until then. A Codex session
recorded before the switch to the SDK has another configuration record and does not
resume.
Token receipts stay raw where scope/basis is unknown; dollars remain unknown.
Explicit dollar caps refuse before Codex dispatch. Native instruction/configuration
fingerprints record their bounded coverage and unknowns, excluding credentials and
mutable session stores. Compatible Codex resume requires an established local-input
receipt; unsupported or unavailable configuration references require a fresh step.
Unknown execution telemetry and required-tool visibility remain separate. The direct `--provider`, `--model`, and `--effort`
options remain available for one runner call and cannot be mixed with stage
selectors. Selection does not come from environment configuration.

## Guards and continuation

Inbox, unknown columns and deferred cards are refused. Build or Review held by an
assignee other than the run's own `@iterate-RUN` claim is refused, and a legacy
`@claude` assignee is adopted only with `--adopt-legacy-claim`. A dirty tree is
allowed only under the run's claim and its journal; the stage is told to inspect
changes, finish and commit that card's work, and preserve other changes. Done requires a clean tree. An untracked
`.iterate-stop` is excluded from that check but stops dispatch with exit 3.

Claude stages ask for auto permission mode, so its tool calls pass Claude
Code's classifier rather than skipping permission checks. A session that starts in
any other mode is stopped and fails, because nobody can answer a permission prompt
in an unattended session. Claude falls back that way on models without auto mode, Haiku
among them on CLI 2.1.280. The status line counts the tool calls Claude denied, and
the attempt report carries the count as `permissionDenials`.

Claude kills a background shell command still running when its session ends
(observed on CLI 2.1.280 in print mode), so a check the stage started in the background and never saw
finish produces no result. The runner names each task Claude killed after a result
and before the stage wrote anything more, on stderr as `killed at exit` and in the
attempt report as `killedAtExit`.

Exit 0 means the stage advanced or the Done check passed. Exit 2 means the card
stayed in its column and the supervisor must interpret the result. Exit 1 covers
refusals and failures. The runner makes no automatic retry after a stage result.

`resume` requires the immediately preceding session to be in the same author stage,
to resolve to the same provider, model and effort, and to have a recorded session
ID. Pass the same stage selectors again. The author must refresh the card and the
priority doc (`backlog doc view doc-0`) and check source/environment drift. Review
requires a fresh session. Claude's session history must still be available.

## Journals and limits

Records live under `git rev-parse --git-path iterate`: one directory per run with
`run.json`, per-attempt reports and raw logs. Atomic card-ID and `current.json`
pointers locate runs. `status` prints attempts, requested agents, report paths,
durations, known dollars and counts of unknown or parent-only costs. Session
reports retain token categories, reported models and cost scope; do not add parent
and aggregate usage together.

Each journal attempt's `costUsd` is what that attempt spent, so attempt costs add
up to the run's. A resumed Claude session reports its running total, so an attempt
records that total less the costs already recorded for the same session ID, and the
stage's `cost` line on stderr prints that figure. An attempt stopped before its
result records no cost, and the CLI sometimes carries that spend into the resume, so
the resumed attempt's figure includes it. A total below the recorded costs means the
CLI restarted its count, and the attempt records it whole. The per-attempt report
keeps what the CLI said: its `cost` and the `models` and `aggregateIncludingChildren`
under `usage` are the session's totals, while `usage.parent` and `turns` cover that
attempt only. Stderr prints that `cost` as `session cost`. Background task
notifications that re-invoke a session within one attempt count once.

The six-attempt limit spans calls and includes failures. A completed card reopened
for work starts a new run. Existing schema-version-1 journals retain planning
history and its cost and duration accounting; new runs start with the named card.

| Setting | Behavior |
| --- | --- |
| `ITERATE_SESSION_BUDGET` | Claude's per-session dollar cap; default `50`. |
| `ITERATE_RUN_BUDGET` | Optional dollar ceiling across the run. |
| `ITERATE_RUN_MINUTES` | Optional cumulative stage wall-time ceiling; waiting between calls does not count. |
| `ITERATE_LIVE=0` | Suppress live text and tool output; keep the final reply and raw logs. |
| `ITERATE_CLAUDE_CLI`, `ITERATE_CODEX_CLI` | Run the CLI at this absolute path instead of the one the SDK bundles. A relative or missing path makes that provider unavailable. |

Run limits are fixed at creation. Claude receives the smaller of its session cap
and remaining run dollars. Unknown or parent-only costs block the next stage when
a run dollar ceiling is set. Known costs are Claude-reported estimates. Ten minutes
without a line from the harness host or expiration of a time ceiling stops the child process group,
allowing a one-second grace period before forced shutdown.

One writer holds a lock per Git metadata directory. After an abrupt termination,
inspect the lock's PID and children before removing a stale lock. An attempt
without a terminal record blocks dispatch; inspect its raw log and report before
repairing the journal. Missing costs must stay unknown. Deleting state deletes the
run's enforcement history. Records have no automatic retention cleanup.

## Output and verification

The stage's final reply goes to stdout. Stderr includes live agent text and tool
calls by default, plus stage identity, evidence paths, usage and errors. Every SDK
message stays in the raw log in both output modes. The completion reply is asked
to preserve outcome, consequential claims and evidence, errors, scope changes,
unresolved decisions and detailed-record paths. The supervisor reads both streams
and probes new consequential claims before proceeding.

```sh
bun run check
```

The check runs workflow and Claude and Codex stream tests, runtime and evaluation
type checks, and lint. Tests with fake Claude, Codex and backlog executables
establish runner behavior under those fixtures. They do not establish real-agent task quality.

`bun run format` applies formatting only, so `bun run check` can still report lint or
import order afterward. `biome check --write` also applies the lint preset's safe
fixes and assist actions, such as import sorting, to every line of each file it
touches.

The [paired-trial harness](evals/README.md) retains historical tool-free judgment
experiments, instruction snapshots, first outputs and raw provider evidence. Its
small fixtures do not test production supervision or justify changing instruction
loading, evidence requirements, review policy or default output transport. Further
behavioral changes need trials that expose the changed actions on the target
harness with production prompts.
