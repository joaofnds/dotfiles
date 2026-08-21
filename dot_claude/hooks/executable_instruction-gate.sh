#!/usr/bin/env bash
# PostToolUse hook. Fires the instructions-reviewer gate when an instruction
# artifact is edited — the file set named in ~/.agents/AGENTS.md §Task lifecycle.
#
# Demands an artifact (the `Gate:` line plus a reviewer run), not restraint: the
# gate's absence is then visible in the transcript. The body lives in the sibling
# instruction-gate.py; the payload reaches it on stdin, never argv.
#
# Fails open: any parse problem, missing python, or unexpected payload exits 0
# silently. A hook must never break the turn. That silence makes the hook's own
# liveness unobservable, so probe it after a CLI bump:
#
#   printf '{"tool_name":"Edit","tool_input":{"file_path":"/tmp/.agents/rules/x.md"},"session_id":"probe-'"$(date +%s)"'"}' \
#     | ~/.claude/hooks/instruction-gate.sh
#
# Expect a JSON hookSpecificOutput block on stdout. Silence means the gate is dead —
# but only with a fresh session_id: a repeated id is suppressed by its own state
# marker, so a pinned id goes quiet on the second run of a perfectly healthy hook.
#
# Substitute a chezmoi symlink source for the path to check both pointer classes:
#   .../dot_claude/symlink_CLAUDE.md.tmpl        — the pointer-file class
#   .../dot_claude-livefire/symlink_skills.tmpl  — the pointer-at-a-gated-dir class
# Both must produce a block. The second class was missing until 2026-08-05 because
# the probe set was scoped to `.md.tmpl` names, so the hole survived every re-probe.
#
# Harness facts, re-verified on claude-code 2.1.222, 2026-08-05 — re-verify after a
# CLI bump. Re-probed that day in a live session (an Edit to an instruction file
# produced the injected block, which the pipe above cannot show): PostToolUse receives
# the tool payload as JSON on stdin, injects text via
# hookSpecificOutput.additionalContext, and reaches the main conversation. The pipe
# alone proves only that this script accepts stdin JSON and emits a block — it says
# nothing about either harness end. The script body being re-read per event is a
# mechanism, not a 2.1.222
# probe: the harness exec's the command per event, so the file is read from disk each
# time — the mid-session-effect probe is still 2.1.221 / 2026-08-04, and settings-side
# reload is documented (instruction-external-facts.md §Harness mechanics).
# NOT re-probed at 2.1.222 either: that it also fires inside sub-agents (probed
# 2026-08-04 on 2.1.221) — the main-conversation-only clause rests on that older probe.

set -u

body="${BASH_SOURCE[0]%/*}/instruction-gate.py"
[ -r "$body" ] || exit 0
command -v python3 >/dev/null 2>&1 || exit 0

python3 "$body" 2>/dev/null || true
exit 0
