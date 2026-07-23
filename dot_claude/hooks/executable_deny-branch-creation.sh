#!/usr/bin/env bash
# PreToolUse(Bash) hook. Hard gate: the agent must not create a git branch on its own.
# House rule is "commit on the current branch"; prose alone kept failing across repos, so
# this enforces it. Deletion, rename, and listing stay allowed — only branch *creation* is
# blocked. Escape hatch: when the user wants a branch, they say so and run/approve it.
# Known gap: `git worktree add -b` is left alone, since worktree flows are legitimate.

set -euo pipefail

command="$(jq -r '.tool_input.command // ""')"

if printf '%s' "$command" | grep -Eq \
  '\bgit\b.*\bswitch\b.*( |=)(-c|-C|--create)( |=|$)|\bgit\b.*\bcheckout\b.*( )(-b|-B)( |$)|\bgit\b.*\bbranch\b +[A-Za-z0-9_/.]'; then
  echo "Blocked branch creation. House rule: commit on the CURRENT branch; never create a branch on your own. If a separate branch is genuinely warranted, explain why and ask the user first — do not auto-branch." >&2
  exit 2
fi

exit 0
