#!/usr/bin/env bash
# Every declared mirror is pointed at from both sides.
#
# A mirror mark says "this passage also lives in that file; edit together". The gate
# reviewer only ever sees one diff, so it can check the side it was handed and nothing
# else: a mark whose twin carries no mark back is invisible to it by construction, and
# the twin's editor gets no signal at all. That is how the two sides drift.
#
# What this checks: reciprocity. For every mark naming another file, that file must name
# this one back. What it does not check: whether the two passages still say the same
# thing. Nothing mechanical can, so a passing run means the marks point at each other,
# never that the copies agree.
#
# The sibling check in check-corpus-budgets.sh resolves a citation's §Heading; a mark can
# pass that one and still be one-sided, which is the case this exists for.
#
# Usage: check-mirror-marks.sh
set -u

root="$(cd "$(dirname "$0")/.." && pwd)"

failures=0

fail() { printf 'FAIL  %s\n' "$*"; failures=$((failures + 1)); }
note() { printf '      %s\n' "$*"; }

printf 'Declared mirror marks\n'

out=$(python3 - "$root" <<'PY'
import re, sys, pathlib, collections

root = pathlib.Path(sys.argv[1])

files = [p for p in (root / 'dot_agents').rglob('*.md')
         if 'evals' not in p.parts and p.name != 'review-checklist.md']
files += sorted((root / 'dot_claude' / 'output-styles').glob('*.md'))

by_name = collections.defaultdict(list)
for p in files:
    by_name[p.name].append(p)

text = {p: p.read_text(errors='replace') for p in files}

# The corpus writes marks in prose, and its lines are hard-wrapped, so a mark's phrase and
# the paths it names routinely sit on different lines. Unwrap, then read one sentence at a
# time: a paragraph-wide window pulls in the neighbouring sentence's citations, which is a
# false positive on a file that merely gets mentioned nearby.
MARK = re.compile(
    r'mirror mark|mirrored in|mirrored elsewhere|mirrored from|mirror it'
    r'|edit together|edit both|edit in step|edit that section in step|edit all \w+ together',
    re.I)
CITE = re.compile(r'`(~?[A-Za-z0-9_./-]+\.md)`')
SENTENCE = re.compile(r'(?<=[.!?])\s+')


def resolve(path_txt):
    parts = pathlib.PurePath(path_txt).parts
    cands = by_name.get(parts[-1], [])
    if len(cands) == 1:
        return cands[0]
    for i in range(len(parts)):
        tail = parts[i:]
        m = [c for c in cands if c.parts[-len(tail):] == tail]
        if len(m) == 1:
            return m[0]
    return None


def names(p):
    """How another file would write a pointer at p: its basename, or dir/basename when
    the basename is shared (17 files are called SKILL.md). The bare directory name is not
    enough: "brief" matches any prose using the word."""
    if len(by_name[p.name]) == 1:
        return [p.name]
    return [f'{p.parent.name}/{p.name}']


def paragraphs(p):
    """Each paragraph unwrapped to one line, with the line number it starts on."""
    out, buf, start = [], [], 0
    for i, line in enumerate(text[p].splitlines(), 1):
        if line.strip():
            if not buf:
                start = i
            buf.append(line.strip())
        elif buf:
            out.append((' '.join(buf), start))
            buf = []

    if buf:
        out.append((' '.join(buf), start))

    return out


pairs, skipped, marks = {}, 0, 0

for p in files:
    for para, ln_no in paragraphs(p):
        for sentence in SENTENCE.split(para):
            if not MARK.search(sentence):
                continue
            marks += 1
            for path_txt in CITE.findall(sentence):
                t = resolve(path_txt)
                if t is None:
                    skipped += 1
                    continue
                if t != p:
                    pairs.setdefault((p, t), ln_no)

for (src, dst), ln_no in sorted(pairs.items(), key=lambda kv: str(kv[0][0])):
    if not any(n in text[dst] for n in names(src)):
        print(f"FAIL::{src.relative_to(root)}:{ln_no} — mirror mark names "
              f"{dst.relative_to(root)}, which points back at nothing")

print(f"NOTE::{marks} mark(s), {len(pairs)} declared mirror(s) checked, {skipped} skipped (path not unique)")
PY
)

while IFS= read -r line; do
  case "$line" in
    FAIL::*) fail "${line#FAIL::}" ;;
    NOTE::*) note "${line#NOTE::}" ;;
  esac
done <<< "$out"

printf '\n%s failure(s)\n' "$failures"
[ "$failures" -eq 0 ] || exit 1
exit 0
