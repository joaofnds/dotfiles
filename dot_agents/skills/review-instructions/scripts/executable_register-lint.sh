#!/usr/bin/env bash
# Prints the sentences in an instruction file that carry a shape worth a second
# read: a semicolon, an "X, not Y" pair, an em dash. A hit is a prompt to read
# the sentence and decide. A semicolon between list items, a precise contrast,
# and a prohibition are fine and stay. The setup sentence, the headline, the
# colon pivot, the metaphor, and the count that proves effort need a reader.
#
# usage: register-lint.sh FILE...
# Prints file:line: shape: text for each hit. Exits 1 only when a file cannot
# be read.
set -u
if [ $# -eq 0 ]; then echo "usage: register-lint.sh FILE..." >&2; exit 2; fi
status=0
check() {
  local shape="$1" re="$2" f="$3" hits
  hits=$(grep -n -E -- "$re" "$f") || return 0
  while IFS= read -r line; do
    printf '%s:%s: %s: %s\n' "$f" "${line%%:*}" "$shape" "${line#*:}"
  done <<<"$hits"
}
for f in "$@"; do
  if [ ! -r "$f" ]; then echo "$f: not readable" >&2; status=1; continue; fi
  check "semicolon" '; \S' "$f"
  check "not-pair" ', (not|never) |[^a-z]and not (of|the|a) |\bnot [a-z]+ but [a-z]|\bnever by |\bnot [a-z ]{0,20}\bbut\b' "$f"
  check "em dash" '—' "$f"
done
exit $status
