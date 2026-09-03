import { afterEach, expect, test } from "bun:test";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const iterate = join(root, "dot_scripts", "executable_iterate");
const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

const fakeClaude = `#!/usr/bin/env bash
prompt=""
while [ $# -gt 0 ]; do [ "$1" = "-p" ] && prompt="$2"; shift; done
skill=$(echo "$prompt" | cut -c2- | cut -d' ' -f1)
echo "$prompt" >> "$FAKE_CALLS"
if [ "$skill" != "$FAKE_STALL" ]; then
  case "$skill" in
    shape) echo Build > "$FAKE_STATUS";;
    build) echo Review > "$FAKE_STATUS";;
    review) echo Done > "$FAKE_STATUS";;
  esac
fi
echo '{"is_error":false,"result":"ok","num_turns":1,"total_cost_usd":0.1,"session_id":"s-'"$skill"'"}'
`;

const fakeBacklog = `#!/usr/bin/env bash
case "$1 $2" in
  "task view") echo "Status: ○ $(cat "$FAKE_STATUS")"; echo "Assignee: ";;
  "task list") echo "  [HIGH] DOT-1 - a card (To Do)";;
  "task edit") echo "$*" >> "$FAKE_EDITS";;
  "milestone list") echo "Active milestones ($FAKE_GOALS):";;
esac
`;

async function fixture({ stall = "", dirty = false, stop = false, goals = "1" } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "iterate-test-"));
  directories.push(directory);
  const bin = join(directory, "bin");
  const repo = join(directory, "repo");
  await mkdir(bin);
  await mkdir(repo);
  await writeFile(join(bin, "claude"), fakeClaude);
  await writeFile(join(bin, "backlog"), fakeBacklog);
  await chmod(join(bin, "claude"), 0o755);
  await chmod(join(bin, "backlog"), 0o755);
  const status = join(directory, "status");
  const calls = join(directory, "calls");
  const edits = join(directory, "edits");
  await writeFile(status, "To Do\n");
  await writeFile(calls, "");
  await writeFile(edits, "");
  await Bun.$`git -c init.defaultBranch=main init -q ${repo}`;
  if (dirty) await writeFile(join(repo, "untracked"), "");
  if (stop) await writeFile(join(repo, ".iterate-stop"), "");
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    FAKE_STATUS: status,
    FAKE_CALLS: calls,
    FAKE_EDITS: edits,
    FAKE_STALL: stall,
    FAKE_GOALS: goals,
  };
  const run = async (...args) => {
    const proc = Bun.spawn([iterate, ...args], { cwd: repo, env, stdout: "pipe", stderr: "pipe" });
    const code = await proc.exited;
    return { code, calls: (await readFile(calls, "utf8")).trim().split("\n").filter(Boolean), edits: await readFile(edits, "utf8"), stderr: await new Response(proc.stderr).text() };
  };
  return { run };
}

test("one iteration runs triage, the queue's first card through its columns, and reflect", async () => {
  const { run } = await fixture();
  const result = await run();
  expect(result.calls).toEqual(["/triage", "/shape DOT-1", "/build DOT-1", "/review DOT-1", "/reflect DOT-1"]);
  expect(result.edits).toContain("Bet,");
  expect(result.code).toBe(0);
});

test("a stage that leaves the card in its column is a question for João and stops the run with exit 2", async () => {
  const { run } = await fixture({ stall: "shape" });
  const result = await run();
  expect(result.calls).toEqual(["/triage", "/shape DOT-1"]);
  expect(result.code).toBe(2);
});

test("a card argument skips triage and pick", async () => {
  const { run } = await fixture();
  const result = await run("DOT-1");
  expect(result.calls).toEqual(["/shape DOT-1", "/build DOT-1", "/review DOT-1", "/reflect DOT-1"]);
  expect(result.code).toBe(0);
});

test("a dirty tree stops the run before any session", async () => {
  const { run } = await fixture({ dirty: true });
  const result = await run("DOT-1");
  expect(result.calls).toEqual([]);
  expect(result.code).toBe(1);
});

test("the stop file ends the run before the next session", async () => {
  const { run } = await fixture({ stop: true });
  const result = await run("DOT-1");
  expect(result.calls).toEqual([]);
  expect(result.code).toBe(3);
});

test("a board with no goal stops before triage with exit 4", async () => {
  const { run } = await fixture({ goals: "0" });
  const result = await run();
  expect(result.calls).toEqual([]);
  expect(result.code).toBe(4);
});
