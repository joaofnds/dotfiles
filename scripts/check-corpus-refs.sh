#!/usr/bin/env bash
# Resolves every cross-reference in the instruction corpus against its target, so a rename
# or a deletion surfaces here instead of in a session that follows a dead pointer.
#
# Checks two things for each `path.md` §Heading citation under dot_agents/:
#   - the file exists
#   - the heading exists in it, as a markdown heading or a bolded rule label
#
# Usage: check-corpus-refs.sh
# Exits 0 when every citation resolves.
set -u

root="$(cd "$(dirname "$0")/.." && pwd)"
corpus="$root/dot_agents"

findings="$(mktemp)"
trap 'rm -f "$findings"' EXIT

report() {
  printf '%s\n' "$1" >>"$findings"
}

# Resolve a cited path against the citing file's directory, the corpus root, and the
# rendered ~/.agents prefix the corpus uses in absolute citations.
resolve() {
  local target="$1" from_dir="$2" candidate
  target="${target#\~/.agents/}"
  for candidate in "$from_dir/$target" "$corpus/$target"; do
    [ -f "$candidate" ] && { printf '%s' "$candidate"; return 0; }
  done
  return 1
}

# A heading matches when the target carries it as a markdown heading or a bolded label.
# A citation runs on into the citing sentence, so the target's own heading is a prefix of
# what we captured rather than the whole of it. Compare against each heading in the target.
heading_present() {
  local file="$1" heading="$2" candidate stripped
  while IFS= read -r candidate; do
    stripped="$(printf '%s' "$candidate" | sed 's/^#\{1,6\}[[:space:]]*//; s/\*\*//g; s/[[:space:]]*$//')"
    [ -z "$stripped" ] && continue
    cite_lc="$(printf '%s' "$heading" | tr '[:upper:]' '[:lower:]')"
    head_lc="$(printf '%s' "$stripped" | tr '[:upper:]' '[:lower:]')"
    # Either can be the longer string: a citation runs on into its sentence, and a heading
    # can carry a tail the citation shortens ("Cited sources" for "Cited sources, and ...").
    case "$cite_lc" in "$head_lc"*) return 0 ;; esac
    case "$head_lc" in "$cite_lc"*) return 0 ;; esac
  done < <(grep -oE '^#{1,6} .*|\*\*[^*]+\*\*' "$file" 2>/dev/null)
  return 1
}

while IFS= read -r file; do
  from_dir="$(dirname "$file")"
  # Citations look like: `some/path.md` §Heading words
  grep -o '`[^`]*\.md`[[:space:]]*§[^;,.)]*' "$file" 2>/dev/null | while IFS= read -r citation; do
    target="$(printf '%s' "$citation" | sed 's/^`\([^`]*\)`.*/\1/')"
    heading="$(printf '%s' "$citation" | sed 's/.*§[[:space:]]*//')"
    [ -z "$heading" ] && continue
    case "$heading" in
      # A placeholder like §<heading> documents the citation form rather than making one.
      '<'*) continue ;;
      # A numbered citation (§4.7, §2a) names a section by number. Those files head their
      # sections with the number, so the file check above is the whole of what resolves.
      [0-9]*) continue ;;
    esac

    # `file.md` is the placeholder the rules use when documenting the citation form.
    [ "$target" = "file.md" ] && continue

    if ! resolved="$(resolve "$target" "$from_dir")"; then
      report "MISSING FILE     ${file#$corpus/} -> $target"
      continue
    fi
    if ! heading_present "$resolved" "$heading"; then
      report "MISSING HEADING  ${file#$corpus/} -> $target §$heading"
    fi
  done
done < <(find "$corpus" -name '*.md' -type f)

count="$(wc -l <"$findings" | tr -d ' ')"
if [ "$count" -eq 0 ]; then
  printf 'every corpus cross-reference resolves\n'
  exit 0
fi
sort -u "$findings"
printf '\n%s unresolved cross-reference(s)\n' "$count"
exit 1
