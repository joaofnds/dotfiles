#!/usr/bin/env bash
# Runs every repo checker in one command, so a regression in any of them surfaces without
# remembering which scripts exist.
#
# Usage: check-all.sh [--quiet]
#   --quiet  print only the per-check verdicts and the summary, not each checker's output.
#
# Exits 0 only when every check passes. Add a new checker to the `checks` list below.
set -u

root="$(cd "$(dirname "$0")/.." && pwd)"

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

reply_length_fixture() {
  bash "$root/scripts/measure-reply-length.sh" "$root/scripts/fixtures/reply-length" \
    | diff - "$root/scripts/fixtures/reply-length/expected.txt"
}

# --since keeps whole sessions, not turns. The fixture's session opens 2026-07-20, so a
# later cutoff must drop all three of its turns even though two of them run past that date.
reply_length_since() {
  fixture="$root/scripts/fixtures/reply-length"
  after=$(bash "$root/scripts/measure-reply-length.sh" --since 2026-07-21 "$fixture" | head -1)
  before=$(bash "$root/scripts/measure-reply-length.sh" --since 2026-07-19 "$fixture" | head -1)
  status=0
  [ "$after" = "turns: 0" ] || { printf 'cutoff after session start: got "%s", want "turns: 0"\n' "$after"; status=1; }
  [ "$before" = "turns: 3" ] || { printf 'cutoff before session start: got "%s", want "turns: 3"\n' "$before"; status=1; }
  return $status
}

run "refactoring catalog structure" bash "$root/scripts/verify-refactoring-catalog.sh"
run "dot_agents line budgets" bash "$root/scripts/check-corpus-budgets.sh"
run "reply-length extraction" reply_length_fixture
run "reply-length --since is session-scoped" reply_length_since

printf '\n%s passed, %s failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ] || exit 1
exit 0
