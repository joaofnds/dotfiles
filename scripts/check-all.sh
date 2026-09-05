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

run "Claude Desktop launcher" bun test "$root/scripts/test-cdl.test.js"
run "iterate runner" bun test "$root/scripts/test-iterate.test.js"
run "corpus cross-references" "$root/scripts/check-corpus-refs.sh"
run "corpus orphans" "$root/scripts/check-corpus-orphans.sh"

printf '\n%s passed, %s failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ] || exit 1
exit 0
