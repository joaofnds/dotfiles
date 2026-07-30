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

# Cross-file citations name a rule, never a line. A line-anchored citation keeps
# resolving after the target is edited — to a different rule — and no reader can tell.
# (Added 2026-07-27: every catalog citation into coding_style.md had drifted 2-5 lines,
# and coding_style.md's own pointer at coupling.md:12 resolved to a blank line.)
#
# Scope covers the eval rubrics too: they cite the agent definition they grade, so an edit to
# that definition silently re-points them. Three forms, because the first pass matched only
# the first: `file.md:12`, a range `file.md:12-14`, and a bare `(`:85`)` anchor.
# `evals/*/results/` is excluded on purpose — those are dated records of past runs, and a
# citation there is evidence of what a line said then, not a pointer to maintain now.
# (Widened 2026-07-30: two insertions into instructions-reviewer.md re-pointed seven rubric
# anchors — one to a blank line — and the narrow regex plus the dot_agents-only root saw none.)
printf '\nCitation hygiene\n'
cites=$(grep -rnoE --exclude-dir=results \
  '`[A-Za-z0-9_/-]+\.md:[0-9]+(-[0-9]+)?`|\(`:[0-9]+(-[0-9]+)?`' \
  "$corpus" 2>/dev/null || true)
if [ -n "$cites" ]; then
  while IFS= read -r c; do
    [ -z "$c" ] && continue
    fail "line-anchored citation — cite the rule by name: ${c#"$corpus"/}"
  done <<EOF
$cites
EOF
else
  note "no line-anchored citations"
fi

# `evals/` lives under dot_agents/ but is not loaded into any context, so it is not corpus.
printf '\nTotals\n'
corpus_files() { find "$corpus" -name '*.md' -not -path "$corpus/evals/*"; }
total=$(corpus_files | tr '\n' '\0' | xargs -0 cat | wc -l | tr -d ' ')
always=$(lines "$corpus/AGENTS.md")
note "corpus $total lines across $(corpus_files | wc -l | tr -d ' ') files"
note "always-loaded surface $always lines"

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'OK — %s warning(s)\n' "$warnings"
  exit 0
fi
printf '%s failure(s), %s warning(s)\n' "$failures" "$warnings"
exit 1
