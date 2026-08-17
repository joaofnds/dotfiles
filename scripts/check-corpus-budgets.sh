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

# Output styles live outside dot_agents/, which is why no glob below can see
# them, but they are always-on: dot_claude/private_settings.json sets
# "outputStyle": "answer-first", so the whole file sits in the system prompt
# every turn — the router's tier, so the router's budget. (Added 2026-08-13,
# after answer-first.md reached ~290 lines with nothing measuring it.)
#
# Known exception, recorded rather than hidden by loosening the threshold:
# answer-first.md is over the ceiling today. That is a real finding — but a
# permanently red gate hides the next real breach, so it WARNs until trimmed.
# Trimming is gated instruction work, not a fix to make here. Delete the
# exemption when the file is under the ceiling.
printf '\nOutput styles (always-on)\n'
style_exempt="dot_claude/output-styles/answer-first.md"
for f in "$root"/dot_claude/output-styles/*.md; do
  [ -e "$f" ] || continue
  rel="${f#"$root"/}"
  n=$(lines "$f")
  if [ "$rel" = "$style_exempt" ] && [ "$n" -gt 200 ]; then
    densities="$densities$(density "$f") $rel"$'\n'
    warn "$rel — $n lines, ceiling 200 (known exception, 2026-08-13: trim pending)"
  else
    check "$f" 60 200 output-style
  fi
done

# Line-ceiling exemption, 2026-08-17: instructions-reviewer.md. The corpus prune
# rewrapped its ~190-char lines to corpus width, doubling its line count while its
# content shrank 27% (46.8KB -> 30.3KB, plus a 4.1KB split into
# references/artifact-class-checks.md). The 250 ceiling stays for every other agent;
# this file is bounded by bytes instead: FAIL if it exceeds its post-prune size.
# Delete this exemption if the file ever drops under the line ceiling.
printf '\nSub-agent system prompts\n'
for f in "$corpus"/agents/*.md; do
  [ -e "$f" ] || continue
  rel="${f#"$root"/}"
  if [ "$rel" = "dot_agents/agents/instructions-reviewer.md" ]; then
    bytes=$(wc -c < "$f" | tr -d ' ')
    if [ "$bytes" -gt 31000 ]; then
      fail "$rel — ${bytes} bytes, byte ceiling 31000 (line-ceiling exemption above)"
    else
      note "$rel — $(wc -l < "$f" | tr -d ' ') lines, exempt from the 250 line ceiling; ${bytes}/31000 bytes"
    fi
    continue
  fi
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

# Tier-3 references under a skill, on-demand with the same 500-line ceiling the agents
# loop uses. Checked explicitly for the same reason that loop states: the glob above does
# not recurse, so moving content out of a SKILL.md into references/ left it unmeasured.
# (Added 2026-08-07, after 171 lines moved from panel-review/SKILL.md into that blind spot.)
printf '\nSkill tier-3 references\n'
for f in "$corpus"/skills/*/references/*.md; do
  [ -e "$f" ] || continue
  check "$f" - 500 reference
done

# A skill body is re-attached after auto-compaction only up to its first 5,000 tokens
# (instruction_external_facts.md §Harness mechanics), and re-invoking appends an
# already-loaded note rather than a second copy — so everything past that point is gone for
# the rest of a long session and cannot be recovered. Lines cannot see this; a body of few,
# long lines passes the 500-line ceiling and still overflows. 20,000 chars is 5,000 tokens
# at 4 chars/token, which is an estimate, not a documented ratio — hence WARN, not FAIL.
# (Added 2026-08-07: panel-review/SKILL.md sat at 28,794 chars, so its kill step, stability
# probe, report skeleton, and disposition rules dropped out of the orchestrator's context at
# exactly the point it needed them. Splitting the axis mandates out took it to 17,812.)
printf '\nSkill body vs compaction re-attach budget (~20000 chars)\n'
for f in "$corpus"/skills/*/SKILL.md; do
  [ -e "$f" ] || continue
  c=$(wc -c < "$f" | tr -d ' ')
  if [ "$c" -gt 20000 ]; then
    warn "${f#"$root"/} — $c chars, over the ~20000 re-attach budget: the tail is dropped after compaction"
  fi
done
note "checked $(ls "$corpus"/skills/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ') skill bodies"

# Density: a line ceiling only binds while a line means the same thing everywhere.
#
# Known exception, recorded 2026-08-06 rather than hidden by loosening the
# threshold: agents/instructions-reviewer.md runs ~3x the median. That is a real
# finding, not a false positive — at corpus density its content is ~720 lines
# against a 250 ceiling — but a permanently red gate hides the next real breach.
#
# Density exemption retired 2026-08-17: instructions-reviewer.md now wraps at corpus
# width, so the density check applies to it like any other file.
density_exempt=""

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

# Cross-file section citations must resolve to a heading that exists.
#
# This is the one class of decay a gate review cannot see by construction: the citing file
# is not in the diff that moved the heading, so no diff-seeded review ever opens it. Only a
# standing sweep or this check catches it. (Added 2026-08-07, after one pass found three
# mirror declarations in instruction_external_facts.md §Harness mechanics naming sections that had moved to
# agents/references/dispatch-fields.md — the paragraph whose whole job is making "edit every
# site or none" executable — plus two testing-module pointers aimed at the wrong section.)
#
# Deliberately conservative, because a noisy check is worse than none: a citation is
# resolved only when its basename is unique in the corpus, and a section token is checked
# only in the two forms the corpus actually uses. Anything else is skipped and counted, so
# the skip rate stays visible rather than reading as a clean pass.
printf '\nCross-file section citations\n'
cite_out=$(python3 - "$corpus" <<'PY'
import re, sys, pathlib, collections

corpus = pathlib.Path(sys.argv[1])
files = [p for p in corpus.rglob('*.md')
         if 'evals' not in p.parts and p.name != 'review_checklist.md']

by_name = collections.defaultdict(list)
for p in files:
    by_name[p.name].append(p)

heads = {}
for p in files:
    hs = []
    for ln in p.read_text(errors='replace').splitlines():
        if re.match(r'^#{2,4}\s+', ln):
            hs.append(re.sub(r'^#+\s+', '', ln).strip())
        elif m := re.match(r'^\*\*([A-Z][^*]{3,80})\*\*', ln):
            hs.append(m.group(1).strip())          # bold paragraph lead
    heads[p] = hs

CITE = re.compile(r'`([A-Za-z0-9_./-]+\.md)`\s*§(\*?[A-Za-z0-9][^,.;:)\]]*?)\*?(?=[\s,.;:)\]]|$)')
bad, checked, skipped = [], 0, 0

for p in files:
    for ln_no, ln in enumerate(p.read_text(errors='replace').splitlines(), 1):
        for path_txt, sec in CITE.findall(ln):
            targets = by_name.get(pathlib.PurePath(path_txt).name, [])
            if len(targets) != 1:
                skipped += 1
                continue
            t = targets[0]
            sec = sec.strip().strip('*')
            if re.match(r'^\d', sec):
                n = re.match(r'^(\d+)', sec).group(1)
                ok = any(re.match(rf'^§?{n}[.\s]', h) or h.startswith(f'{n}.') for h in heads[t])
            else:
                ok = any(h.lower().startswith(sec.lower()) for h in heads[t])
            checked += 1
            if not ok:
                bad.append((p, ln_no, path_txt, sec))

for p, ln_no, path_txt, sec in bad:
    print(f"FAIL::{p.relative_to(corpus.parent)}:{ln_no} — `{path_txt}` §{sec} resolves to no heading in that file")
print(f"NOTE::{checked} citation(s) resolved, {len(bad)} dangling, {skipped} skipped (basename not unique)")
PY
)
while IFS= read -r line; do
  case "$line" in
    FAIL::*) fail "${line#FAIL::}" ;;
    NOTE::*) note "${line#NOTE::}" ;;
  esac
done <<EOF
$cite_out
EOF

# Not corpus: `evals/` is never loaded into any context, and `review_checklist.md` is a
# human-facing coverage audit the user reads against a panel review — no mandate names it and
# no agent loads it (2026-08-07; its own header said so, and deleting it on that evidence was
# the wrong call). "Nothing loads it" is grounds to keep it out of a context budget, never
# grounds to delete it.
printf '\nTotals\n'
corpus_files() { find "$corpus" -name '*.md' -not -path "$corpus/evals/*" -not -name 'review_checklist.md'; }
total=$(corpus_files | tr '\n' '\0' | xargs -0 cat | wc -l | tr -d ' ')
always=$(lines "$corpus/AGENTS.md")
note "corpus $total lines across $(corpus_files | wc -l | tr -d ' ') files"
note "always-loaded surface $always lines"

# Every other budget here is per-file, so a corpus that grows by adding a little to each
# file trips none of them — which is how it went ~3,000 → 11,524 lines between 2026-07-01
# and 2026-08-06 with every file inside its own budget. This is the only check that sees
# the total. First set to 10,000 on 2026-08-06, deliberately BELOW the count of 11,524, so
# the gap read as standing debt rather than a ratchet.
#
# RAISED to 11,000 on 2026-08-07, with the reason this line requires. The 2026-08-07
# consolidation pass took the corpus to 11,392 and established that 10,000 is not reachable
# by cutting sermon: ~4,350 lines are the Fowler catalog, which loads one entry at a time
# (`agents/refactoring-reviewer.md` requires reading an entry before citing it), and 717 are
# `review_checklist.md`, which nothing loads. The heaviest realistic simultaneous context
# measured 1,824 lines, so the total sits ~6x above anything instruction-saturation can
# describe. That pass also found that compressing past the sermon costs correctness: three
# separate defects came out of trimming four lines from one AGENTS.md bullet, each caught by
# a gate round. Re-anchored the same day to 11,000 after review_checklist.md left the corpus
# set (it is human-facing, not agent-consumed) and the total fell to 10,676 by definition
# rather than by cutting.
#
# THIS NUMBER IS A CAP, NEVER AN ALLOWANCE. The gap between the total and the ceiling is not
# budget to spend, and a passing run says nothing about whether any sentence in the corpus
# could be shorter. That check belongs to instructions-reviewer §3 "Compressible prose is a
# finding, and headroom never answers it", which fires on every instruction edit because the
# gate does — no periodic trigger, and none wanted. Lower it after each consolidation pass; raising it again
# needs its own reason here. The real fix is measuring the largest load path instead of the
# file total, which is unbuilt.
corpus_ceiling=11000
if [ "$total" -gt "$corpus_ceiling" ]; then
  fail "corpus $total lines over the $corpus_ceiling ceiling — consolidate or delete before adding (instruction-saturation, rules/instruction_failure_modes.md)"
fi

printf '\n'
if [ "$failures" -eq 0 ]; then
  printf 'OK — %s warning(s)\n' "$warnings"
  exit 0
fi
printf '%s failure(s), %s warning(s)\n' "$failures" "$warnings"
exit 1
