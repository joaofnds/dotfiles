import process from "node:process";

export const fakeClaude = `#!/usr/bin/env bash
if [ "$1" = --version ]; then
  if [ -n "$FAKE_VERSION_DESCENDANT" ]; then
    trap '' TERM
    sleep 10 &
    printf '%s %s' "$$" "$!" > "$FAKE_VERSION_DESCENDANT"
    wait
  fi
  echo "2.1.fixture"; exit 0
fi
printf '%s\\n' "$*" >> "$FAKE_ARGUMENTS"
printf '%s\\0' "$@" >> "$FAKE_ARGV"
printf '\\0' >> "$FAKE_ARGV"
printf '%s\\n' "\${USE_GLOBAL_TASK_ID_LOCK-unset}" >> "$FAKE_PROVIDER_BYPASS"
if [ -n "$FAKE_DISPATCH_GATE" ]; then
  printf ready > "$FAKE_DISPATCH_GATE.ready"
  while [ ! -f "$FAKE_DISPATCH_GATE" ]; do sleep 0.02; done
fi
read -r initialize
read -r request
system=$(printf '%s' "$initialize" | "${process.execPath}" -e 'process.stdout.write(JSON.parse(await Bun.stdin.text()).request.appendSystemPrompt ?? "")')
prompt=$(printf '%s' "$request" | "${process.execPath}" -e 'process.stdout.write(JSON.parse(await Bun.stdin.text()).message.content[0].text)')
resumed=""
model="sonnet"
for argument in "$@"; do
  case "$argument" in
    --resume=*) resumed="\${argument#--resume=}";;
    --model=*) model="\${argument#--model=}";;
  esac
done
skill=$(echo "$prompt" | cut -c2- | cut -d' ' -f1)
echo "$prompt" >> "$FAKE_CALLS"
call=$(grep -cx -- "$prompt" "$FAKE_CALLS")
session="s-$skill"
if [ "$call" -gt 1 ]; then session="s-$skill-$call"; fi
if [ -n "$resumed" ]; then session="$resumed"; fi
cost=0.1
if [ -s "$FAKE_COSTS" ]; then cost=$(head -n 1 "$FAKE_COSTS"); tail -n +2 "$FAKE_COSTS" > "$FAKE_COSTS.rest"; mv "$FAKE_COSTS.rest" "$FAKE_COSTS"; fi
if [ "$(cat "$FAKE_OBSERVED_DEFERRED")" = yes ]; then echo "$prompt" >> "$FAKE_DEFERRED_DISPATCHES"; fi
printf '%s\n---\n' "$system" >> "$FAKE_SYSTEMS"
if [ -n "$FAKE_FINISH_WORK" ]; then
  cat "$FAKE_LEAVES" > "$FAKE_FINISH_WORK"
  rm "$FAKE_LEAVES"
  backlog task edit TASK-1 --status Review >/dev/null || exit 1
fi
if [ -z "$FAKE_FINISH_WORK" ] && [ -n "$FAKE_LEAVES" ] && [ "$skill" = "$FAKE_LEAVES_AT" ]; then echo left > "$FAKE_LEAVES"; fi
if [ "$skill" = "$FAKE_STOP_DURING" ]; then echo > "$FAKE_STOP_FILE"; fi
if [ "$skill" = "$FAKE_REASSIGN_AT" ]; then echo "@someone-else" > "$FAKE_ASSIGNEE"; fi
if [ "$skill" = boom ] || [ "$FAKE_STALL" = boom ]; then echo "boom" >&2; exit 1; fi
if [ -n "$resumed" ] && [ -n "$FAKE_RESUMED_MODEL" ]; then model="$FAKE_RESUMED_MODEL"; fi
echo '{"type":"system","subtype":"init","session_id":"'"$session"'","model":"'"$model"'","permissionMode":"auto"}'
if [ -n "$resumed" ] && [ -n "$FAKE_MISSING_HISTORY" ]; then echo '{"type":"result","subtype":"error_during_execution","is_error":true,"errors":["remote session history missing"],"result":"remote session history missing","session_id":"'"$session"'"}'; exit 1; fi
if [ -n "$FAKE_FAILED_RESULT" ]; then echo '{"type":"result","subtype":"error_during_execution","is_error":true,"errors":["failed after work"],"result":"failed after work","num_turns":1,"total_cost_usd":'"$cost"',"session_id":"'"$session"'"}'; exit 1; fi
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
  echo '{"type":"result","is_error":false,"result":"ok","num_turns":1,"session_id":"'"$session"'"}'
else
  echo '{"type":"result","is_error":false,"result":"ok","num_turns":1,"total_cost_usd":'"$cost"',"session_id":"'"$session"'"}'
fi
if [ -n "$FAKE_AFTER_RESULT" ]; then echo '{"type":"assistant","message":{"content":[{"type":"text","text":"later uncosted work"}]}}'; fi
if [ -n "$FAKE_RUNTIME_BOOKKEEPING" ]; then cp "$FAKE_RUNTIME_BOOKKEEPING" "$CLAUDE_CONFIG_DIR/.claude.json"; fi
`;

export const fakeBacklog = `import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
const env = process.env;
if (process.argv[2] === "--version") { console.log("1.50.1"); process.exit(0); }
const read = (name) => readFileSync(env[name], "utf8").trim();
const [group, action, id, ...args] = process.argv.slice(2);
if (group === "task" && action === "view") {
  if (env.FAKE_DEFER_WHILE_NATIVE_HELD && existsSync(env.FAKE_DEFER_WHILE_NATIVE_HELD)) writeFileSync(env.FAKE_LABELS, JSON.stringify(["deferred"]));
  if (env.FAKE_STOP_ON_FINAL_DONE_READ && existsSync(env.FAKE_STOP_ON_FINAL_DONE_READ) && read("FAKE_STATUS") === "Done") writeFileSync(env.FAKE_STOP_FILE, "");
}
const details = { type: null, reporter: null, title: "card", description: null, implementationPlan: null, finalSummary: null, documentation: [], comments: [], definitionOfDone: [], references: [], dependencies: [], priority: null, milestone: null, ordinal: null, parentTaskId: null, subtasks: [] };
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
  const assignee = args.indexOf("--assignee");
  if (assignee !== -1) writeFileSync(env.FAKE_ASSIGNEE, args[assignee + 1]);
}
`;
