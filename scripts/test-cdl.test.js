import { afterEach, expect, test } from "bun:test";
import { chmod, cp, lstat, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const cdl = join(root, "dot_scripts", "executable_cdl");
const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "cdl-test-"));
  directories.push(directory);

  const home = join(directory, "home");
  const app = join(directory, "Claude.app");
  const applications = join(directory, "Applications");
  const bin = join(directory, "bin");
  const entrypoint = join(directory, "cdl");
  await mkdir(join(home, ".claude"), { recursive: true });
  await mkdir(join(app, "Contents", "MacOS"), { recursive: true });
  await mkdir(join(app, "Contents", "Resources"), { recursive: true });
  await mkdir(applications);
  await mkdir(bin);
  await cp(cdl, entrypoint);
  await chmod(entrypoint, 0o755);
  await writeFile(join(bin, "pgrep"), "#!/usr/bin/env bash\nexit 1\n");
  await chmod(join(bin, "pgrep"), 0o755);
  await writeFile(
    join(app, "Contents", "MacOS", "Claude"),
    '#!/usr/bin/env bun\nawait Bun.write(`${process.env.CLAUDE_CONFIG_DIR}/launch-record`, `${process.env.CLAUDE_CONFIG_DIR}\\n${process.argv[2]}\\n`);\n',
  );
  await chmod(join(app, "Contents", "MacOS", "Claude"), 0o755);
  await writeFile(join(app, "Contents", "Resources", "claude.icns"), "");

  return { app, applications, bin, entrypoint, home };
}

function run({ app, applications, bin, entrypoint, home }, args, input = "", environment = {}) {
  return Bun.spawnSync([entrypoint, ...args], {
    env: { ...process.env, APPLICATIONS_DIR: applications, CLAUDE_APP: app, HOME: home, PATH: `${bin}:${process.env.PATH}`, ...environment },
    stderr: "pipe",
    stdin: Buffer.from(input),
    stdout: "pipe",
  });
}

function output(result) {
  return new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
}

test("rejects traversal names without touching the default profile", async () => {
  const setup = await fixture();
  const sentinel = join(setup.home, ".claude", "sentinel");
  await writeFile(sentinel, "keep");

  const result = run(setup, ["delete", "probe/../.claude"]);

  expect(result.exitCode).toBe(1);
  expect(output(result)).toContain("Instance names must use letters, numbers, underscores, and hyphens only");
  expect((await lstat(join(setup.home, ".claude"))).isDirectory()).toBe(true);
  expect(await readFile(sentinel, "utf8")).toBe("keep");
});

test("builds an isolated wrapper", async () => {
  const setup = await fixture();
  const created = run(setup, ["new", "example"]);
  expect(created.exitCode).toBe(0);

  const wrapped = run(setup, ["wrapper", "example"], "Example\n");
  expect(wrapped.exitCode).toBe(0);

  const wrapper = join(setup.applications, "Claude Example.app");
  const plist = Bun.spawnSync(["plutil", "-lint", join(wrapper, "Contents", "Info.plist")]);
  expect(plist.exitCode).toBe(0);

  const launched = Bun.spawnSync([join(wrapper, "Contents", "MacOS", "claude-launcher")]);
  expect(launched.exitCode).toBe(0);
  expect(await readFile(join(setup.home, ".claude-example", "launch-record"), "utf8")).toBe(
    `${join(setup.home, ".claude-example")}\n--user-data-dir=${join(setup.home, ".claude-example", "electron-data")}\n`,
  );
});

test("keeps the existing wrapper when compilation fails", async () => {
  const setup = await fixture();
  run(setup, ["new", "example"]);
  run(setup, ["wrapper", "example"], "Example\n");

  const launcher = join(setup.applications, "Claude Example.app", "Contents", "MacOS", "claude-launcher");
  const original = await readFile(launcher);
  const plistBefore = await readFile(join(setup.applications, "Claude Example.app", "Contents", "Info.plist"));
  const iconBefore = await readFile(join(setup.applications, "Claude Example.app", "Contents", "Resources", "claude-icon.icns"));
  const compiler = join(join(setup.applications, ".."), "failing-cc");
  await writeFile(compiler, "#!/usr/bin/env bash\nexit 1\n");
  await chmod(compiler, 0o755);

  const result = run(setup, ["wrapper", "example"], "Example\ny\n", { CC: compiler });

  expect(result.exitCode).toBe(1);
  expect(await readFile(launcher)).toEqual(original);
  expect(await readFile(join(setup.applications, "Claude Example.app", "Contents", "Info.plist"))).toEqual(plistBefore);
  expect(await readFile(join(setup.applications, "Claude Example.app", "Contents", "Resources", "claude-icon.icns"))).toEqual(iconBefore);
});

test("preserves a migration target file", async () => {
  const setup = await fixture();
  const target = join(setup.home, ".claude-example", "electron-data");
  await mkdir(join(setup.home, ".claude-example"));
  await writeFile(target, "keep");
  await mkdir(join(setup.home, "Library", "Application Support", "Claude-example"), { recursive: true });

  const result = run(setup, ["migrate", "example"]);

  expect(result.exitCode).toBe(1);
  expect(await readFile(target, "utf8")).toBe("keep");
});

test("migrates a symlinked external profile", async () => {
  const setup = await fixture();
  const externalProfile = join(setup.applications, "external-profile");
  await mkdir(join(setup.home, ".claude-example"));
  await mkdir(externalProfile);
  await writeFile(join(externalProfile, "sentinel"), "keep");
  await mkdir(join(setup.home, "Library", "Application Support"), { recursive: true });
  await symlink(externalProfile, join(setup.home, "Library", "Application Support", "Claude-example"));

  const result = run(setup, ["migrate", "example"]);

  expect(result.exitCode).toBe(0);
  expect((await lstat(join(setup.home, ".claude-example", "electron-data"))).isSymbolicLink()).toBe(true);
  expect(await readFile(join(setup.home, ".claude-example", "electron-data", "sentinel"), "utf8")).toBe("keep");
});

test("refuses migration while Claude Desktop is running", async () => {
  const setup = await fixture();
  await mkdir(join(setup.home, ".claude-example"));
  await mkdir(join(setup.home, "Library", "Application Support", "Claude-example"), { recursive: true });
  await writeFile(join(setup.bin, "pgrep"), '#!/usr/bin/env bash\n[ "$1" = "-x" ] && [ "$2" = "Claude" ] && exit 0\nexit 1\n');

  const result = run(setup, ["migrate", "example"]);

  expect(result.exitCode).toBe(1);
  expect(output(result)).toContain("Quit Claude Desktop before migrating its user data");
  expect(await lstat(join(setup.home, "Library", "Application Support", "Claude-example"))).toBeDefined();
  expect(await lstat(join(setup.home, ".claude-example", "electron-data")).catch(() => undefined)).toBeUndefined();
});

test("accepts a symlinked Claude.app", async () => {
  const setup = await fixture();
  const linkedApp = join(setup.applications, "Claude.app");
  await symlink(setup.app, linkedApp);

  const result = run({ ...setup, app: linkedApp }, ["list"]);

  expect(result.exitCode).toBe(0);
});

test("lists a symlinked instance directory", async () => {
  const setup = await fixture();
  const profile = join(setup.home, "profile");
  await mkdir(profile);
  await symlink(profile, join(setup.home, ".claude-example"));

  const result = run(setup, ["list"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("example");
});

test("lists an underscore-named instance", async () => {
  const setup = await fixture();
  await mkdir(join(setup.home, ".claude-work_profile"));

  const result = run(setup, ["list"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("work_profile");
});

test("refuses migration when process detection fails", async () => {
  const setup = await fixture();
  await mkdir(join(setup.home, ".claude-example"));
  await mkdir(join(setup.home, "Library", "Application Support", "Claude-example"), { recursive: true });
  await writeFile(join(setup.bin, "pgrep"), "#!/usr/bin/env bash\nexit 2\n");

  const result = run(setup, ["migrate", "example"]);

  expect(result.exitCode).toBe(1);
  expect(output(result)).toContain("Cannot determine whether Claude Desktop is running");
});

test("reports a non-executable Claude binary", async () => {
  const setup = await fixture();
  await chmod(join(setup.app, "Contents", "MacOS", "Claude"), 0o644);

  const result = run(setup, ["diagnose"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("not executable");
});

test("reports an executable Claude binary", async () => {
  const setup = await fixture();

  const result = run(setup, ["diagnose"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("executable:");
});

test("does not report a directory as an executable Claude binary", async () => {
  const setup = await fixture();
  const binary = join(setup.app, "Contents", "MacOS", "Claude");
  await rm(binary);
  await mkdir(binary);

  const result = run(setup, ["diagnose"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("not executable");
});

test("diagnoses a missing Claude.app", async () => {
  const setup = await fixture();
  const missingApp = join(setup.applications, "Missing.app");

  const result = run({ ...setup, app: missingApp }, ["diagnose"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain(`missing: ${missingApp}`);
});

test("skips broken shared links", async () => {
  const setup = await fixture();
  await symlink(join(setup.home, "missing"), join(setup.home, ".claude", "agents"));

  const result = run(setup, ["new", "example"]);

  expect(result.exitCode).toBe(0);
  expect(await lstat(join(setup.home, ".claude-example", "agents")).catch(() => undefined)).toBeUndefined();
});

test("removes stale shared links during repair", async () => {
  const setup = await fixture();
  const source = join(setup.home, ".claude", "agents");
  const destination = join(setup.home, ".claude-example", "agents");
  await mkdir(join(setup.home, ".claude-example"));
  await symlink(source, destination);
  await symlink(join(setup.home, "missing"), source);

  const result = run(setup, ["repair", "example"]);

  expect(result.exitCode).toBe(0);
  expect(await lstat(destination).catch(() => undefined)).toBeUndefined();
});

test("reports stale shared links during diagnosis", async () => {
  const setup = await fixture();
  await mkdir(join(setup.home, ".claude-example"));
  await symlink(join(setup.home, "missing"), join(setup.home, ".claude-example", "agents"));

  const result = run(setup, ["diagnose"]);

  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain("agents: broken symlink");
});
