# iterate

A runner for a supervisor carrying one accepted card through its stages in fresh
agent sessions. Invoke the `iterate` skill with an explicit card ID. The supervisor
reads each stage's result before deciding how to continue.

```sh
iterate step CARD [--STAGE-agent provider:model[:effort] ...]
iterate resume CARD [--STAGE-agent provider:model[:effort] ...]
iterate status [CARD]  # read the run journal; omit CARD for the most recent run
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
change. After a stage reports Done, one final `step` checks the tree and closes the
run without starting another agent.

Each stage retains the review requirements of its skill. Build may complete those
reviews and move the card to Done itself. Triage and reflection remain separate
skills for screening work and assessing outcomes against the broader goal.

## Implementation

`main.ts` validates the requested card and advances one stage. `board.ts` reads
cards and writes the shape promotion through the backlog CLI. `journal.ts` keeps
attempts and limits across invocations. `session.ts` starts Claude, retains raw
output and reports, and handles cancellation and timeouts. `provider.ts` builds
the Claude argument array and normalizes its events. Each ordinary `step` starts
a fresh process on the host.
The [session diagram](../../../docs/iterate-session.svg) shows that lifecycle.

This directory installs to `~/.agents/workflows/iterate`. The launcher at
`~/.scripts/iterate` reconciles pinned dependencies with Bun, then runs
`src/main.ts` with the caller's arguments and working directory.

Every stage currently uses the `claude` executable. A stage selector has the form
`--STAGE-agent provider:model[:effort]`. A stage without one uses the Claude CLI
defaults. Only `claude` is implemented, so a future provider selection is refused
when its stage is reached. The direct `--provider`, `--model`, and `--effort`
options remain available for one runner call and cannot be mixed with stage
selectors. Selection does not come from environment configuration.

## Guards and continuation

Inbox, unknown columns and deferred cards are refused. Build or Review held by an
assignee other than `@claude` is refused. A dirty tree is allowed only for a card
assigned to `@claude`; the stage is told to inspect changes, finish and commit that
card's work, and preserve other changes. Done requires a clean tree. An untracked
`.iterate-stop` is excluded from that check but stops dispatch with exit 3.

Every stage asks Claude for auto permission mode, so its tool calls pass Claude
Code's classifier rather than skipping permission checks. A session that starts in
any other mode is stopped and fails, because in print mode nobody can answer a
permission prompt. Claude falls back that way on models without auto mode, Haiku
among them on CLI 2.1.280. The status line counts the tool calls Claude denied, and
the attempt report carries the count as `permissionDenials`.

Exit 0 means the stage advanced or the Done check passed. Exit 2 means the card
stayed in its column and the supervisor must interpret the result. Exit 1 covers
refusals and failures. The runner makes no automatic retry after a stage result.

`resume` requires the immediately preceding session to be in the same author stage,
to resolve to the same provider, model and effort, and to have a recorded session
ID. Pass the same stage selectors again. The author must refresh the card and `backlog/PRIORITY.md` and check
source/environment drift. Review requires a fresh session. Claude's session history
must still be available.

## Journals and limits

Records live under `git rev-parse --git-path iterate`: one directory per run with
`run.json`, per-attempt reports and raw logs. Atomic card-ID and `current.json`
pointers locate runs. `status` prints attempts, requested agents, report paths,
durations, known dollars and counts of unknown or parent-only costs. Session
reports retain token categories, reported models and cost scope; do not add parent
and aggregate usage together.

The six-attempt limit spans calls and includes failures. A completed card reopened
for work starts a new run. Existing schema-version-1 journals retain planning
history and its cost and duration accounting; new runs start with the named card.

| Setting | Behavior |
| --- | --- |
| `ITERATE_SESSION_BUDGET` | Claude's per-session dollar cap; default `50`. |
| `ITERATE_RUN_BUDGET` | Optional dollar ceiling across the run. |
| `ITERATE_RUN_MINUTES` | Optional cumulative stage wall-time ceiling; waiting between calls does not count. |
| `ITERATE_LIVE=0` | Suppress live text and tool output; keep the final reply and raw logs. |

Run limits are fixed at creation. Claude receives the smaller of its session cap
and remaining run dollars. Unknown or parent-only costs block the next stage when
a run dollar ceiling is set. Known costs are Claude-reported estimates. Ten minutes
without stdout or expiration of a time ceiling stops the child process group,
allowing a one-second grace period before forced shutdown.

One writer holds a lock per Git metadata directory. After an abrupt termination,
inspect the lock's PID and children before removing a stale lock. An attempt
without a terminal record blocks dispatch; inspect its raw log and report before
repairing the journal. Missing costs must stay unknown. Deleting state deletes the
run's enforcement history. Records have no automatic retention cleanup.

## Output and verification

The stage's final reply goes to stdout. Stderr includes live agent text and tool
calls by default, plus stage identity, evidence paths, usage and errors. Raw
Claude events remain on disk in both output modes. The completion reply is asked
to preserve outcome, consequential claims and evidence, errors, scope changes,
unresolved decisions and detailed-record paths. The supervisor reads both streams
and probes new consequential claims before proceeding.

```sh
bun run check
```

The check runs workflow and Claude stream tests, runtime and evaluation type checks,
and lint. Tests with fake Claude and backlog executables establish runner
behavior under those fixtures. They do not establish real-agent task quality.

The [paired-trial harness](evals/README.md) retains historical tool-free judgment
experiments, instruction snapshots, first outputs and raw provider evidence. Its
small fixtures do not test production supervision or justify changing instruction
loading, evidence requirements, review policy or default output transport. Further
behavioral changes need trials that expose the changed actions on the target
harness with production prompts.
