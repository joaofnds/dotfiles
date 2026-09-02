#!/usr/bin/env bash
# Checks the brief-pass Stop hook against synthetic transcripts: it asks for the /brief
# rewrite once, only after a turn that used tools, and never when it is already the
# continuation of its own pass.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
hook="$root/dot_claude/hooks/executable_brief-pass.py"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fail=0
check() { # name expected-substring actual
  if printf '%s' "$3" | grep -q -- "$2"; then printf 'ok    %s\n' "$1"; else printf 'FAIL  %s\n      wanted: %s\n      got: %s\n' "$1" "$2" "$3"; fail=1; fi
}
skill="$tmp/skills/brief/SKILL.md"; mkdir -p "$(dirname "$skill")"
printf -- '---\nname: brief\n---\n\nREWRITE TASK TEXT\n' > "$skill"

user() { printf '{"type":"user","message":{"role":"user","content":"%s"}}\n' "$1"; }
meta() { printf '{"type":"user","isMeta":true,"message":{"role":"user","content":[{"type":"text","text":"%s"}]}}\n' "$1"; }
tool_use() { printf '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Read","id":"t1","input":{}}]}}\n'; }
tool_result() { printf '{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"x"}]}}\n'; }
text() { printf '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"%s"}]}}\n' "$1"; }

run() { # transcript stop_hook_active last_message; prints stdout, then "exit=N"
  BRIEF_SKILL="$skill" python3 "$hook" <<EOJ
{"hook_event_name":"Stop","transcript_path":"$1","stop_hook_active":$2,"last_assistant_message":"$3"}
EOJ
  printf 'exit=%s' "$?"
}

{ user "fix it"; tool_use; tool_result; text "long report"; } > "$tmp/tools.jsonl"
out="$(run "$tmp/tools.jsonl" false "long report")"
check "turn with tools asks for the rewrite" '"decision": "block"' "$out"
check "the reason carries the skill body" 'REWRITE TASK TEXT' "$out"
check "the reason says what to do when nothing can be cut" 'unchanged' "$out"

out="$(run "$tmp/tools.jsonl" true "the brief")"
check "its own continuation is let through" '^exit=0$' "$out"

{ user "does it retry?"; text "No, five attempts."; } > "$tmp/plain.jsonl"
out="$(run "$tmp/plain.jsonl" false "No, five attempts.")"
check "a turn without tools is let through" '^exit=0$' "$out"

{ user "earlier"; tool_use; tool_result; text "old"; user "/brief"; meta "skill body"; text "short"; } > "$tmp/manual.jsonl"
out="$(run "$tmp/manual.jsonl" false "short")"
check "a manual /brief turn is let through" '^exit=0$' "$out"

out="$(run "$tmp/tools.jsonl" false "")"
check "an empty final message is let through" '^exit=0$' "$out"

out="$(run "$tmp/missing.jsonl" false "text")"
check "a missing transcript fails open" '^exit=0$' "$out"

exit $fail
