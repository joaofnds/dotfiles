#!/usr/bin/env bash
# Line budgets for dot_agents/, per the tiers in
# dot_agents/agents/instructions-reviewer.md §1.
#
# A target is advisory and prints WARN; a ceiling is binding and prints FAIL.
# The distinction is load-bearing: a router made entirely of deliberate house
# deltas may sit above its target indefinitely, but past its ceiling
# instruction-saturation applies regardless of how good each line is.
#
# Usage: check-corpus-budgets.sh
set -u

root="$(cd "$(dirname "$0")/.." && pwd)"
corpus="$root/dot_agents"

failures=0
warnings=0

fail() { printf 'FAIL  %s\n' "$*"; failures=$((failures + 1)); }
warn() { printf 'WARN  %s\n' "$*"; warnings=$((warnings + 1)); }
note() { printf '      %s\n' "$*"; }

lines() { wc -l < "$1" | tr -d ' '; }

# check <file> <target|-> <ceiling> <label>
check() {
  local file="$1" target="$2" ceiling="$3" label="$4" n rel
  [ -f "$file" ] || { fail "$label: $file does not exist"; return; }
  n=$(lines "$file")
  rel="${file#"$root"/}"

  if [ "$n" -gt "$ceiling" ]; then
    fail "$rel — $n lines, ceiling $ceiling"
  elif [ "$target" != "-" ] && [ "$n" -gt "$target" ]; then
    warn "$rel — $n lines, target $target (ceiling $ceiling)"
  else
    note "$rel — $n lines"
  fi
}

printf 'Always-loaded router\n'
check "$corpus/AGENTS.md" 60 200 router

printf '\nSub-agent system prompts\n'
for f in "$corpus"/agents/*.md; do
  [ -e "$f" ] || continue
  check "$f" 150 250 agent
done

printf '\nSkill bodies\n'
for f in "$corpus"/skills/*/SKILL.md; do
  [ -e "$f" ] || continue
  check "$f" - 500 skill
done

printf '\nTotals\n'
total=$(find "$corpus" -name '*.md' -exec cat {} + | wc -l | tr -d ' ')
always=$(lines "$corpus/AGENTS.md")
note "corpus $total lines across $(find "$corpus" -name '*.md' | wc -l | tr -d ' ') files"
note "always-loaded surface $always lines"

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'OK — %s warning(s)\n' "$warnings"
  exit 0
fi
printf '%s failure(s), %s warning(s)\n' "$failures" "$warnings"
exit 1
