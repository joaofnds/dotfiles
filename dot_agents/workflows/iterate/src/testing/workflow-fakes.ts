export const fakeClaude = `#!/usr/bin/env bash
prompt=""
system=""
while [ $# -gt 0 ]; do prompt="$1"; [ "$1" = "--append-system-prompt" ] && system="$2"; shift; done
skill=$(echo "$prompt" | cut -c2- | cut -d' ' -f1)
echo "$prompt" >> "$FAKE_CALLS"
printf '%s\n---\n' "$system" >> "$FAKE_SYSTEMS"
if [ -n "$FAKE_LEAVES" ] && [ "$skill" = "$FAKE_LEAVES_AT" ]; then echo left > "$FAKE_LEAVES"; fi
if [ -n "$FAKE_STOP_AFTER" ] && [ "$skill" = reflect ]; then echo > "$FAKE_STOP_AFTER"; fi
if [ "$skill" = "$FAKE_STOP_DURING" ]; then echo > "$FAKE_STOP_FILE"; fi
if [ "$skill" = "$FAKE_REASSIGN_AT" ]; then echo "@someone-else" > "$FAKE_ASSIGNEE"; fi
if [ "$skill" = boom ] || [ "$FAKE_STALL" = boom ]; then echo "boom" >&2; exit 1; fi
if [ "$FAKE_STALL" = none ]; then
  if [ "$(cat "$FAKE_STATUS")" = "To Do" ]; then echo Shape > "$FAKE_STATUS"; else echo "To Do" > "$FAKE_STATUS"; fi
elif [ "$skill" = "$FAKE_STALL" ]; then
  if [ -z "$FAKE_MUTE" ]; then echo "$skill wrote this" >> "$FAKE_NOTES"; fi
else
  case "$skill" in
    shape) echo Build > "$FAKE_STATUS";;
    build) echo Review > "$FAKE_STATUS";;
    review) echo Done > "$FAKE_STATUS";;
    reflect) echo "reflection recorded" >> "$FAKE_NOTES";;
  esac
fi
echo '{"type":"result","is_error":false,"result":"ok","num_turns":1,"total_cost_usd":0.1,"session_id":"s-'"$skill"'"}'
`;

export const fakeBacklog = `#!/usr/bin/env bash
case "$* " in
  "task view "*) if [ -n "$FAKE_MISSING" ]; then echo "Task $3 not found. Task lookups read only the local working copy."; exit 1; fi; echo "Status: $FAKE_GLYPH $(cat "$FAKE_STATUS")"; echo "Assignee: $(cat "$FAKE_ASSIGNEE")"; if [ -n "$FAKE_SHAPED" ]; then echo "Acceptance Criteria:"; echo "- [ ] #1 it works (the direction)"; echo "Definition of Done:"; echo "- [ ] #1 reviewed"; fi; echo "Implementation Notes:"; cat "$FAKE_NOTES";;
  "task list "*) echo "Tasks for MILESTONE-1 (sorted by priority):"; echo "  [HIGH] DOT-1 - first card (To Do)"; echo "  [LOW] DOT-2 - second card (To Do)";;
  "task edit "*) echo "$*" >> "$FAKE_EDITS"; while [ $# -gt 0 ]; do [ "$1" = "--status" ] && echo "$2" > "$FAKE_STATUS"; shift; done;;
  "milestone list "*) echo "Active milestones ($FAKE_GOALS):";;
esac
`;
