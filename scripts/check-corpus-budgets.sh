#!/usr/bin/env bash
# Line budgets for dot_agents/, per the tiers in
# dot_agents/agents/instructions-reviewer.md §1.
#
# A target is advisory and prints WARN; a ceiling is binding and prints FAIL.
# The distinction is load-bearing: a router made entirely of deliberate house
# deltas may sit above its target indefinitely, but past its ceiling
# instruction-saturation applies regardless of how good each line is.
#
# Every budget here is in lines, and a line is only a budget while lines stay
# comparable. A file that packs many rules onto few unwrapped lines passes a line
# ceiling while carrying far more instruction than its tier allows, and `wc -l`
# cannot see it. So density is checked separately, against the corpus median
# rather than an invented width — the median is what makes "lines" mean anything.
# (Added 2026-08-06: instructions-reviewer.md sat at 240/250 lines and 165
# chars/line, against 60-80 for its three siblings. A first attempt set an
# absolute char ceiling at 90 x the line ceiling; it failed that one file by 2x
# and would have forced a split that costs a Read on nearly every review. The
# defect is that its lines are not comparable to any other file's, so that is
# what this measures.)
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
density() { awk 'END { print (NR ? int(t / NR) : 0) } { t += length($0) + 1 }' "$1"; }

# Corpus median chars/line, computed below over every budgeted file. A file more
# than twice the median is carrying instruction its line count does not show.
median=0
densities=""

# check <file> <target|-> <ceiling> <label>
check() {
  local file="$1" target="$2" ceiling="$3" label="$4" n rel
  [ -f "$file" ] || { fail "$label: $file does not exist"; return; }
  n=$(lines "$file")
  rel="${file#"$root"/}"
  densities="$densities$(density "$file") $rel"$'\n'

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

# Tier-3 references under agents/ are on-demand, with the 500-line ceiling §1 states.
# Checked explicitly because the glob above does not recurse — without this, moving
# content into references/ would leave the 250-line ceiling entirely unmeasured.
printf '\nAgent tier-3 references\n'
for f in "$corpus"/agents/references/*.md; do
  [ -e "$f" ] || continue
  check "$f" - 500 reference
done

printf '\nSkill bodies\n'
for f in "$corpus"/skills/*/SKILL.md; do
  [ -e "$f" ] || continue
  check "$f" - 500 skill
done

# Density: a line ceiling only binds while a line means the same thing everywhere.
#
# Known exception, recorded 2026-08-06 rather than hidden by loosening the
# threshold: agents/instructions-reviewer.md runs ~3x the median. That is a real
# finding, not a false positive — at corpus density its content is ~720 lines
# against a 250 ceiling — but a permanently red gate hides the next real breach.
#
# Two splits have landed against it (references/chezmoi-targets.md and
# references/dispatch-fields.md), moving it 188 -> 181 chars/line. Both were
# genuine branch-specific extractions and neither cleared the threshold, which is
# the honest measure of how much of that file is load-bearing on every review.
# Further splits must come from material a review genuinely skips; do not move a
# section every review needs just to clear this number, and do not raise the
# threshold. Delete this exemption when the file is under it.
density_exempt="dot_agents/agents/instructions-reviewer.md"

printf '\nLine density (chars/line, vs corpus median)\n'
median=$(printf '%s' "$densities" | awk '{print $1}' | sort -n | awk '{v[NR]=$1} END {print (NR ? v[int((NR+1)/2)] : 0)}')
note "median $median chars/line across $(printf '%s' "$densities" | grep -c . ) budgeted files"
over=0
while read -r d rel; do
  [ -z "$rel" ] && continue
  [ "$median" -gt 0 ] || continue
  [ "$d" -gt $((median * 2)) ] || continue
  if [ "$rel" = "$density_exempt" ]; then
    warn "$rel — $d chars/line, over 2x the $median median (known exception, 2026-08-06: split pending)"
  else
    fail "$rel — $d chars/line, over 2x the $median median: its line count understates what it carries"
    over=$((over + 1))
  fi
done <<EOF
$(printf '%s' "$densities")
EOF
[ "$over" -eq 0 ] && note "no unexempted file over 2x the median"

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
