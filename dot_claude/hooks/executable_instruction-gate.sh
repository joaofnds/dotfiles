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
# Harness facts (observed on claude-code 2.1.221, 2026-08-04 — re-verify after a
# CLI bump): PostToolUse receives the tool payload as JSON on stdin, injects text
# via hookSpecificOutput.additionalContext, takes effect mid-session without a
# restart, reaches the main conversation, and also fires inside sub-agents
# (probed 2026-08-04) — hence the main-conversation-only clause in the block.

set -u

body="${BASH_SOURCE[0]%/*}/instruction-gate.py"
[ -r "$body" ] || exit 0
command -v python3 >/dev/null 2>&1 || exit 0

python3 "$body" 2>/dev/null || true
exit 0
