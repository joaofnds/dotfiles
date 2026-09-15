export const fakeClaude = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_ARGUMENTS"
prompt=""
system=""
while [ $# -gt 0 ]; do prompt="$1"; [ "$1" = "--append-system-prompt" ] && system="$2"; shift; done
skill=$(echo "$prompt" | cut -c2- | cut -d' ' -f1)
echo "$prompt" >> "$FAKE_CALLS"
if [ "$(cat "$FAKE_OBSERVED_DEFERRED")" = yes ]; then echo "$prompt" >> "$FAKE_DEFERRED_DISPATCHES"; fi
printf '%s\n---\n' "$system" >> "$FAKE_SYSTEMS"
if [ -n "$FAKE_LEAVES" ] && [ "$skill" = "$FAKE_LEAVES_AT" ]; then echo left > "$FAKE_LEAVES"; fi
if [ "$skill" = "$FAKE_STOP_DURING" ]; then echo > "$FAKE_STOP_FILE"; fi
if [ "$skill" = "$FAKE_REASSIGN_AT" ]; then echo "@someone-else" > "$FAKE_ASSIGNEE"; fi
if [ "$skill" = boom ] || [ "$FAKE_STALL" = boom ]; then echo "boom" >&2; exit 1; fi
if [ -n "$FAKE_FAILED_RESULT" ]; then echo '{"type":"result","is_error":true,"result":"failed after work","num_turns":1,"total_cost_usd":0.1,"session_id":"s-failed"}'; exit 1; fi
if [ "$skill" = shape ] && [ -n "$FAKE_SHAPE_INVESTIGATION" ]; then printf '["%s"]' "$FAKE_SHAPE_INVESTIGATION" > "$FAKE_LABELS"; fi
if [ "$FAKE_STALL" = none ]; then
  if [ "$(cat "$FAKE_STATUS")" = "To Do" ]; then echo Shape > "$FAKE_STATUS"; else echo "To Do" > "$FAKE_STATUS"; fi
elif [ "$skill" = "$FAKE_STALL" ]; then
  if [ -z "$FAKE_MUTE" ]; then echo "$skill wrote this" >> "$FAKE_NOTES"; fi
else
  case "$skill" in
    debug|verify) if [ -n "$FAKE_INVESTIGATION_STATUS" ]; then echo "$FAKE_INVESTIGATION_STATUS" > "$FAKE_STATUS"; fi;;
    shape) echo Build > "$FAKE_STATUS";;
    build) echo Review > "$FAKE_STATUS";;
    review) echo Done > "$FAKE_STATUS";;
  esac
fi
if [ -n "$FAKE_UNKNOWN_COST" ]; then
  echo '{"type":"result","is_error":false,"result":"ok","num_turns":1,"session_id":"s-'"$skill"'"}'
else
  echo '{"type":"result","is_error":false,"result":"ok","num_turns":1,"total_cost_usd":0.1,"session_id":"s-'"$skill"'"}'
fi
`;

export const fakeBacklog = `import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
const env = process.env;
const read = (name) => readFileSync(env[name], "utf8").trim();
const [group, action, id, ...args] = process.argv.slice(2);
if (group === "task" && action === "view") {
  const reads = Number(read("FAKE_READS")) + 1;
  writeFileSync(env.FAKE_READS, String(reads));
  if (reads === Number(env.FAKE_DEFER_ON_READ)) writeFileSync(env.FAKE_LABELS, JSON.stringify(["deferred"]));
  if (reads === Number(env.FAKE_STOP_ON_READ)) writeFileSync(env.FAKE_STOP_FILE, "");
}
const details = { type: null, project: null, reporter: null, title: "card", description: null, implementationPlan: null, finalSummary: null, documentation: [], comments: [], definitionOfDone: [], references: [], dependencies: [], priority: null, milestone: null, dueDate: null, ordinal: null, parentTaskId: null, subtasks: [] };
const first = {
  ...details,
  id: env.FAKE_FIRST_ID, status: read("FAKE_STATUS"), assignees: read("FAKE_ASSIGNEE") ? [read("FAKE_ASSIGNEE")] : [],
  labels: JSON.parse(read("FAKE_LABELS")),
  acceptanceCriteria: env.FAKE_SHAPED ? [{ index: 1, text: "it works", checked: false }] : [],
  implementationNotes: read("FAKE_NOTES"),
};
if (group === "task" && action === "view") {
  if (env.FAKE_MISSING || id !== first.id) { console.log("Task " + id + " not found. Task lookups read only the local working copy."); process.exit(1); }
  const task = first;
  writeFileSync(env.FAKE_OBSERVED_DEFERRED, task.labels.includes("deferred") ? "yes" : "no");
  console.log(JSON.stringify({ schemaVersion: Number(env.FAKE_SCHEMA_VERSION), kind: "task-view", task }));
} else if (group === "task" && action === "edit") {
  appendFileSync(env.FAKE_EDITS, process.argv.slice(2).join(" ") + "\\n");
  const position = args.indexOf("--status");
  if (position !== -1) writeFileSync(env.FAKE_STATUS, args[position + 1]);
}
`;
