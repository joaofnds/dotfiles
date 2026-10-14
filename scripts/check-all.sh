#!/usr/bin/env bash
# Runs every repo checker in one command, so a regression in any of them surfaces without
# remembering which scripts exist.
#
# Usage: check-all.sh [--quiet]
#   --quiet  print only the per-check verdicts and the summary, not each checker's output.
#
# Exits 0 only when every check passes. Add a new checker as a `run` line below.
set -u

root="$(cd "$(dirname "$0")/.." && pwd)"

command -v bun >/dev/null || eval "$(mise activate bash --shims)"

quiet=false
[ "${1:-}" = "--quiet" ] && quiet=true

failed=0
passed=0

run() {
  name="$1"
  shift
  if $quiet; then
    output="$("$@" 2>&1)"
    status=$?
  else
    printf '\n=== %s ===\n' "$name"
    "$@"
    status=$?
  fi
  if [ "$status" -eq 0 ]; then
    passed=$((passed + 1))
    printf 'PASS  %s\n' "$name"
  else
    failed=$((failed + 1))
    printf 'FAIL  %s (exit %s)\n' "$name" "$status"
    $quiet && printf '%s\n' "${output:-}" | tail -20
  fi
}

# A mod's manifest lives in a folder chezmoi renames on apply, so validate what apply installs.
validate_mod() {
  local rendered
  rendered="$(mktemp -d)"
  chezmoi --source "$root" archive --format tar --output "$rendered/mod.tar" "$HOME/$1" &&
    tar -x -f "$rendered/mod.tar" -C "$rendered" &&
    claude plugin validate "$rendered/$1"
  local validated=$?
  rm -rf "$rendered"
  return "$validated"
}

run "Claude Desktop launcher" bun test "$root/scripts/test-cdl.test.js"
run "iterate project" bun run --cwd "$root/dot_agents/workflows/iterate" check
run "corpus reference resolver" bun test "$root/scripts/corpus-refs.test.js"
run "corpus cross-references" "$root/scripts/check-corpus-refs.js"
run "corpus orphans" "$root/scripts/check-corpus-orphans.sh"
run "visual-diff image diff" bash \
  "$root/dot_agents/skills/visual-diff/tests/image_diff_test.sh"
run "instruction evidence handoff" python3 \
  "$root/dot_agents/skills/review-instructions/tests/evidence_handoff_test.py"
run "instruction frontmatter" bun test "$root/scripts/instruction-frontmatter.test.js"
run "tmux claude switcher" bun test "$root/scripts/tmux-claude-switcher.test.js"
run "jsonsort" bun test "$root/scripts/jsonsort.test.js"
run "compaction-judge mod tests" claude plugin test "$root/dot_agents/mods/compaction-judge"
run "compaction-judge mod manifest" validate_mod .agents/mods/compaction-judge

printf '\n%s passed, %s failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ] || exit 1
exit 0
