# iterate

The runner for one iteration of the loop on a backlog board: triage, pick, the card
through its columns, reflect. Each stage is a fresh agent session on the host, with no
container, running that stage's skill from `~/.agents/skills`.

`main.ts` reads the board and advances one stage. Both `step` and the unattended loop
use that operation, including ownership checks and reflection validation. `session.ts`
runs the child process, streams and logs output, and handles cancellation and the
ten-minute silence limit. `provider.ts` builds argument arrays for Claude, Codex, and
OpenCode and normalizes their JSON events, including successful completion and errors.
The runner also holds the clean-tree guard, stop file, session cap, and Claude session
budget. Model and effort selection stays in `ITERATE_AGENTS`.

This directory installs to `~/.agents/workflows/iterate`, and `~/.scripts/iterate` is a
launcher that runs `src/main.ts` there with bun, reconciling the pinned dependencies before
each invocation. `iterate --help` documents the three forms, the exit codes, and
`ITERATE_AGENTS`, which names the agent and model for each stage, so one run can shape
on one model, build on another, and review on a third. The `iterate` skill drives
`iterate start` and `iterate step` and oversees between them.

Routine iterations run `triage inbox`, which screens a fixed batch of Inbox items
and due or triggered deferrals. New admissions and scope-expanding merges follow
the board's admission policy: require the user's batch decision unless a recorded
policy explicitly delegates those decisions. A direction to iterate or continue
unattended does not delegate admission. Reactivation follows the
recorded admission/reactivation policy; without recorded authorization, it returns
for the user's batch decision. Pending screening does not stop work already accepted.

The runner snapshots accepted card IDs before intake, then selects the first still
eligible card from `backlog task list --ready --sort priority`. Only To Do, Shape,
Build, and Review qualify, and the `deferred` label excludes a card in every column.
The snapshot includes blocked accepted work, so it can run if it becomes ready during
intake. Cards admitted during that intake cannot be picked in the same invocation,
even when admission was explicitly delegated.
Explicit card arguments and `step` refuse Inbox, unknown columns, and deferred cards.
The snapshot enforces selection timing; it cannot verify human authorization for
arbitrary board edits or changes to the scope of an existing accepted card.

Accepted investigations wait in Shape with one label, `investigate:debug` or
`investigate:verify`. They run the corresponding skill, configurable through
`ITERATE_AGENTS`, and remain in Shape until the stage records a verdict and changes
the column. Acceptance criteria alone never promote an investigation to Build.
Ordinary shape sessions retain the automatic promotion behavior.

Agent text and tool calls stream to stderr as provider events arrive. The final
reply stays on stdout, so callers can capture it separately from live progress. The
raw event log path is printed when a session starts. Unavailable usage totals are
shown as `n/a`.

    bun run check    # workflow and provider tests, typecheck, and lint
