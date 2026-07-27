#!/usr/bin/env bash
# Reply length statistics over stored Claude Code session transcripts — the four-step
# extraction rule in .boris/plans/2026-07-27-reply-length-and-ste-prose-spec.md §1, and the
# output contract in .boris/plans/2026-07-27-reply-length-and-ste-prose.md §5.
#
# Usage: measure-reply-length.sh [--since ISO8601] [transcript-dir]
#   --since  drop turns whose opening user record is older than this timestamp. Compared as
#            a string, so any ISO 8601 UTC prefix works (2026-07-25, 2026-07-25T12:00:00Z).
#            Required to isolate turns produced after an output style became active: no
#            transcript record names the active style.
#   transcript-dir  defaults to ~/.claude/projects/-Users-joaofnds-code-dotfiles. Read
#            non-recursively: subagent transcripts live one level down and are not read.
#
# A word is a whitespace-separated token. Percentiles are nearest-rank, index
# ceil(p/100 * n) over the 1-based sorted list, and the median is the 50th percentile under
# the same rule. Turns are segmented per file, never across concatenated files.
#
# Reports numbers only. It does not pass or fail an acceptance criterion.
set -u
set -o pipefail

usage() {
  printf 'Usage: measure-reply-length.sh [--since ISO8601] [transcript-dir]\n' >&2
}

since=""
dir=""

while [ $# -gt 0 ]; do
  case "$1" in
    --since)
      if [ $# -lt 2 ]; then
        printf 'measure-reply-length.sh: --since needs a timestamp\n' >&2
        usage
        exit 2
      fi
      since="$2"
      shift 2
      ;;
    --since=*)
      since="${1#--since=}"
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      printf 'measure-reply-length.sh: unknown option %s\n' "$1" >&2
      usage
      exit 2
      ;;
    *)
      dir="$1"
      shift
      ;;
  esac
done

[ -n "$dir" ] || dir="$HOME/.claude/projects/-Users-joaofnds-code-dotfiles"

if ! command -v jq > /dev/null 2>&1; then
  printf 'measure-reply-length.sh: jq is required and was not found\n' >&2
  exit 1
fi

if [ ! -d "$dir" ]; then
  printf 'measure-reply-length.sh: not a directory: %s\n' "$dir" >&2
  exit 1
fi

segment='
def wordcount: [scan("[^[:space:]]+")] | length;

def boundary:
  .type == "user"
  and (
    (.message.content | type) == "string"
    or (
      (.message.content | type) == "array"
      and ([.message.content[] | select(type == "object" and .type == "tool_result")] | length) == 0
    )
  );

def text_block_words: [.message.content[]? | select(type == "object" and .type == "text") | .text // "" | wordcount];

reduce inputs as $record (
  {turns: [], current: null};
  if $record.isSidechain == true then
    .
  elif ($record | boundary) then
    (if .current then .turns += [.current] else . end)
    | .current = {words: 0, emissions: 0, start: ($record.timestamp // "")}
  elif $record.type == "assistant" and .current != null then
    ($record | text_block_words) as $counts
    | .current.words += ($counts | add // 0)
    | .current.emissions += ($counts | length)
  else
    .
  end
)
| (if .current then .turns += [.current] else . end)
| .turns[]
'

statistics='
def fmt1: (. * 10 | round) as $tenths | "\(($tenths / 10) | floor).\($tenths % 10)";
def nearest_rank($sorted; $n; $p): $sorted[((($p * $n) / 100) | ceil) - 1];

(if $since == "" then . else map(select(.start >= $since)) end)
| map(select(.words > 0))
| (map(.words) | sort) as $words
| ($words | length) as $n
| (map(.emissions) | add // 0) as $emissions
| ($words | add // 0) as $total
| [$words[] | select(. > 125)] as $over
| ["turns: \($n)", "emissions: \($emissions)"]
  + (
    if $n == 0 then
      ["median: n/a", "mean: n/a", "p75: n/a", "p90: n/a", "p99: n/a", "max: n/a",
       "over_125_pct: n/a", "over_125_prose_share_pct: n/a"]
    else
      ["median: \(nearest_rank($words; $n; 50))",
       "mean: \(($total / $n) | fmt1)",
       "p75: \(nearest_rank($words; $n; 75))",
       "p90: \(nearest_rank($words; $n; 90))",
       "p99: \(nearest_rank($words; $n; 99))",
       "max: \($words[-1])",
       "over_125_pct: \((($over | length) * 100 / $n) | fmt1)",
       "over_125_prose_share_pct: \((if $total == 0 then 0 else ($over | add // 0) * 100 / $total end) | fmt1)"]
    end
  )
  + ["note: exempt boilerplate (Reading:, Decision:, English coaching) is counted, not stripped"]
| .[]
'

if ! segmented="$(
  for file in "$dir"/*.jsonl; do
    [ -e "$file" ] || continue
    jq -c -n "$segment" "$file" || exit 1
  done
)"; then
  printf 'measure-reply-length.sh: failed to parse transcripts in %s\n' "$dir" >&2
  exit 1
fi

printf '%s\n' "$segmented" | jq -s -r --arg since "$since" "$statistics"
