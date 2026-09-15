import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const switcher = join(import.meta.dir, "..", "dot_scripts", "executable_tmux-claude-switcher");
const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function stub(bin, name, body) {
  const path = join(bin, name);
  await writeFile(path, `#!/usr/bin/env bash\n${body}\n`);
  await chmod(path, 0o755);
}

// One agent per row: [name, status, pid, tty, cwd, minutesSinceLastActivity].
// A null age leaves the transcript out, which is how a brand-new session looks.
async function fixture(agents) {
  const directory = await mkdtemp(join(tmpdir(), "switcher-test-"));
  directories.push(directory);

  const home = join(directory, "home");
  const bin = join(directory, "bin");
  const projects = join(home, ".claude", "projects", "fixture");
  await mkdir(projects, { recursive: true });
  await mkdir(bin, { recursive: true });

  const json = agents.map(([name, status, pid, , cwd]) => ({
    pid,
    cwd,
    kind: "interactive",
    sessionId: name,
    name,
    status,
  }));

  const now = Date.now();
  for (const [name, , , , , age] of agents) {
    if (age === null) continue;
    const transcript = join(projects, `${name}.jsonl`);
    await writeFile(transcript, "");
    const seconds = (now - age * 60_000) / 1000;
    await utimes(transcript, seconds, seconds);
  }

  const panes = agents
    .map(([name, , , tty, cwd], index) => `work\t${index}\t0\t%${index}\t${tty}\t${cwd}\t${name}`)
    .join("\n");
  const processes = agents.map(([, , pid, tty]) => `${pid} ${tty.replace("/dev/", "")}`).join("\n");

  await stub(bin, "claude", `cat <<'JSON'\n${JSON.stringify(json)}\nJSON`);
  await stub(bin, "ps", `cat <<'EOF'\n${processes}\nEOF`);
  await stub(
    bin,
    "tmux",
    [
      'case "$1" in',
      `list-panes) cat <<'EOF'\n${panes}\nEOF`,
      "  ;;",
      "display-message) echo somehost ;;",
      "esac",
    ].join("\n"),
  );

  return { bin, home };
}

function rows({ bin, home }) {
  const result = Bun.spawnSync(["bun", switcher, "--rows"], {
    env: { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}` },
    stderr: "pipe",
    stdout: "pipe",
  });

  return new TextDecoder()
    .decode(result.stdout)
    .split("\n")
    .filter((line) => line.length > 0);
}

function names(lines) {
  return lines.map((line) => line.split("\t")[1].trim().split(/\s+/).at(-1));
}

test("puts an agent waiting on you above the ones that need nothing", async () => {
  const setup = await fixture([
    ["busy-one", "busy", 101, "/dev/ttys001", "/tmp/a", 1],
    ["idle-one", "idle", 102, "/dev/ttys002", "/tmp/b", 1],
    ["waiting-one", "waiting", 103, "/dev/ttys003", "/tmp/c", 1],
  ]);

  expect(names(rows(setup))).toEqual(["waiting-one", "idle-one", "busy-one"]);
});

test("marks a waiting agent with a colour rather than a bare word", async () => {
  const setup = await fixture([["blocked", "waiting", 101, "/dev/ttys001", "/tmp/a", 1]]);

  const [row] = rows(setup);

  expect(row).toContain("\x1b[");
  expect(row).not.toContain("waiting");
});

test("ages each agent by its last transcript write", async () => {
  const setup = await fixture([
    ["fresh", "idle", 101, "/dev/ttys001", "/tmp/a", 2],
    ["stale", "idle", 102, "/dev/ttys002", "/tmp/b", 90],
  ]);

  const [fresh, stale] = rows(setup);

  expect(fresh).toContain("2m");
  expect(stale).toContain("1h");
});

test("renders a dash for an agent that has written no transcript", async () => {
  const setup = await fixture([["newborn", "idle", 101, "/dev/ttys001", "/tmp/a", null]]);

  expect(rows(setup)[0]).toContain("-");
});

test("sorts the agents that need nothing by how long they have sat", async () => {
  const setup = await fixture([
    ["older", "idle", 101, "/dev/ttys001", "/tmp/a", 30],
    ["newer", "idle", 102, "/dev/ttys002", "/tmp/b", 3],
  ]);

  expect(names(rows(setup))).toEqual(["newer", "older"]);
});
