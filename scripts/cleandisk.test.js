import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { chmod, constants, copyFile, link, mkdir, mkdtemp, readdir, realpath, rm, stat, utimes, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";

const scripts = join(import.meta.dir, "..", "dot_scripts");
const cleandisk = join(scripts, "executable_cleandisk");
const cgus = ["0aaaaaaaaaaaaaaaaaaaaaaaa", "1bbbbbbbbbbbbbbbbbbbbbbbb"];
const directories = [];

let bigFile;

afterAll(async () => {
  if (bigFile) await rm(dirname(bigFile), { force: true, recursive: true });
});

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function temporaryDirectory(prefix) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  directories.push(directory);
  return directory;
}

async function fixture({ project = "project" } = {}) {
  const directory = await temporaryDirectory("cleandisk-test-");
  const home = join(directory, "home");
  const scratch = join(directory, "scratch");
  const bin = join(directory, "bin");
  const target = join(home, "code", project, "target");
  const deps = join(target, "debug", "deps");
  const examples = join(target, "debug", "examples");
  await mkdir(join(target, "debug", ".fingerprint"), { recursive: true });
  await mkdir(deps);
  await mkdir(examples);
  await mkdir(scratch);
  await mkdir(bin);
  await copyFile(join(scripts, "executable_cargokill"), join(bin, "cargokill"));
  await chmod(join(bin, "cargokill"), 0o755);
  await writeFile(
    join(target, "CACHEDIR.TAG"),
    "Signature: 8a477f597d28d172789f06886806bc55\n# This file is a cache directory tag created by cargo.\n",
  );

  return { bin, deps, examples, home, scratch, target };
}

function objectName(unit, compile, cgu = cgus[0]) {
  return `${unit}.${cgu}.${compile}.rcgu.o`;
}

function objectNames(unit, compile) {
  return cgus.map((cgu) => objectName(unit, compile, cgu));
}

async function writeObjects(dir, unit, compile) {
  await Promise.all(objectNames(unit, compile).map((name) => writeFile(join(dir, name), `object from ${compile}`)));
}

async function writeRlib(dir, unit, compile) {
  const staging = await temporaryDirectory("cleandisk-rlib-");
  const member = objectName(unit, compile);
  const rlib = join(dir, `lib${unit}.rlib`);
  await writeFile(join(staging, member), "member");
  await writeFile(join(staging, "lib.rmeta"), "metadata");

  const archived = Bun.spawnSync(["ar", "rcS", rlib, "lib.rmeta", member], { cwd: staging });

  expect(archived.exitCode).toBe(0);
  return rlib;
}

async function writeDebugMap(path, dir, unit, compile) {
  await writeFile(path, `\0\0OSO${join(dir, objectName(unit, compile))}\0\0`);
  await chmod(path, 0o755);
  return path;
}

function writeBinary(dir, unit, compile) {
  return writeDebugMap(join(dir, unit), dir, unit, compile);
}

function writeDylib(dir, unit, compile) {
  return writeDebugMap(join(dir, `lib${unit}.dylib`), dir, unit, compile);
}

async function linkedAt(path, secondsFromNow) {
  const when = Date.now() / 1000 + secondsFromNow;
  await utimes(path, when, when);
}

async function usedDaysAgo(path, days) {
  await linkedAt(path, -days * 86400);
}

async function writeUsed(path, days, contents = "used") {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
  await usedDaysAgo(path, days);
}

// Temp dirs under 100 MiB stay, so the temp dir tests clone one 101 MiB file
// (APFS clones are instant, and du counts each in full).
async function writeBig(path, days) {
  if (!bigFile) {
    bigFile = join(await mkdtemp(join(tmpdir(), "cleandisk-big-")), "big");
    await writeFile(bigFile, Buffer.alloc(101 * 2 ** 20, 1));
  }
  await mkdir(dirname(path), { recursive: true });
  await copyFile(bigFile, path, constants.COPYFILE_FICLONE);
  await usedDaysAgo(path, days);
}

async function exists(path) {
  return stat(path).then(
    () => true,
    () => false,
  );
}

function run({ bin, home, scratch }, args = [], { cwd } = {}) {
  return Bun.spawnSync(["bash", cleandisk, ...args], {
    cwd,
    env: {
      ...process.env,
      CARGO_HOME: process.env.CARGO_HOME ?? join(homedir(), ".cargo"),
      CLEANDISK_SCRATCH_ROOT: scratch,
      HOME: home,
      PATH: `${bin}:${process.env.PATH}`,
      RUSTUP_HOME: process.env.RUSTUP_HOME ?? join(homedir(), ".rustup"),
    },
    stderr: "pipe",
    stdout: "pipe",
  });
}

async function objectsOf(dir, unit) {
  return (await readdir(dir)).filter((name) => name.startsWith(`${unit}.`)).sort();
}

async function objectCounts(dir, units) {
  const counts = {};
  for (const unit of units) {
    counts[unit] = (await objectsOf(dir, unit)).length;
  }
  return counts;
}

async function superseded(dir, unit) {
  await writeObjects(dir, unit, "0old000");
  await writeObjects(dir, unit, "1new000");
  await linkedAt(await writeBinary(dir, unit, "1new000"), 60);
}

describe("cleandisk", () => {
  test.each([
    ["library", writeRlib],
    ["binary", writeBinary],
    ["dylib", writeDylib],
  ])("deletes the objects of a %s's earlier compiles", async (_, writeArtifact) => {
    const setup = await fixture();
    const unit = "some_crate-1111111111111111";
    await writeObjects(setup.deps, unit, "0old001");
    await writeObjects(setup.deps, unit, "1new001");
    await linkedAt(await writeArtifact(setup.deps, unit, "1new001"), 60);

    const result = run(setup);

    expect(result.exitCode).toBe(0);
    expect(await objectsOf(setup.deps, unit)).toEqual(objectNames(unit, "1new001"));
  });

  test("deletes the objects of an example's earlier compiles", async () => {
    const setup = await fixture();
    const unit = "demo-2222222222222222";
    await superseded(setup.examples, unit);

    const result = run(setup);

    expect(result.exitCode).toBe(0);
    expect(await objectsOf(setup.examples, unit)).toEqual(objectNames(unit, "1new000"));
  });

  when("the project path has a space", () => {
    test("deletes the objects of earlier compiles", async () => {
      const setup = await fixture({ project: "my project" });
      const unit = "demo-1212121212121212";
      await superseded(setup.deps, unit);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await objectsOf(setup.deps, unit)).toEqual(objectNames(unit, "1new000"));
    });
  });

  when("a compile is still writing its objects", () => {
    test("keeps the objects written after the artifact", async () => {
      const setup = await fixture();
      const unit = "some_crate-3333333333333333";
      await writeObjects(setup.deps, unit, "0old003");
      await writeObjects(setup.deps, unit, "1new003");
      await linkedAt(await writeRlib(setup.deps, unit, "0old003"), -60);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await objectsOf(setup.deps, unit)).toHaveLength(4);
    });
  });

  when("a unit has no artifact", () => {
    test("keeps objects changed within the idle hours", async () => {
      const setup = await fixture();
      const unit = "orphan-4444444444444444";
      await writeObjects(setup.deps, unit, "0old004");

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await objectsOf(setup.deps, unit)).toHaveLength(2);
    });

    test("deletes objects idle past the idle hours", async () => {
      const setup = await fixture();
      const unit = "orphan-4444444444444444";
      await writeObjects(setup.deps, unit, "0old004");

      const result = run(setup, ["--hours", "0"]);

      expect(result.exitCode).toBe(0);
      expect(await objectsOf(setup.deps, unit)).toEqual([]);
    });
  });

  when("a binary names none of its objects", () => {
    test("keeps cleaning the other units", async () => {
      const setup = await fixture();
      const stripped = "stripped-5555555555555555";
      const others = ["a-6666666666666666", "m-7777777777777777", "z-8888888888888888"];
      await writeObjects(setup.deps, stripped, "0old005");
      await writeObjects(setup.deps, stripped, "1new005");
      await linkedAt(await writeDebugMap(join(setup.deps, stripped), setup.deps, "unrelated", "1new005"), 60);
      for (const unit of others) {
        await superseded(setup.deps, unit);
      }

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await objectCounts(setup.deps, [stripped, ...others])).toEqual({
        [stripped]: 4,
        [others[0]]: 2,
        [others[1]]: 2,
        [others[2]]: 2,
      });
    });
  });

  when("an rlib is unreadable", () => {
    test("keeps its unit's objects and cleans the other units", async () => {
      const setup = await fixture();
      const broken = "broken-9999999999999999";
      const others = ["a-6666666666666666", "m-7777777777777777", "z-8888888888888888"];
      await writeObjects(setup.deps, broken, "0old009");
      await writeObjects(setup.deps, broken, "1new009");
      await writeFile(join(setup.deps, `lib${broken}.rlib`), "not an archive");
      for (const unit of others) {
        await superseded(setup.deps, unit);
      }

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(new TextDecoder().decode(result.stderr)).toContain(`keep  objects of ${broken}`);
      expect(await objectCounts(setup.deps, [broken, ...others])).toEqual({
        [broken]: 4,
        [others[0]]: 2,
        [others[1]]: 2,
        [others[2]]: 2,
      });
    });
  });

  when("a unit was last built within the idle days", () => {
    test("keeps its fingerprint and outputs", async () => {
      const setup = await fixture();
      const profile = join(setup.target, "debug");
      await writeUsed(join(profile, ".fingerprint", "current-1111111111111111", "lib-current"), 0);
      await writeUsed(join(profile, ".fingerprint", "variant-2222222222222222", "lib-variant"), 4);
      await writeUsed(join(setup.deps, "libvariant-2222222222222222.rlib"), 4);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(profile, ".fingerprint", "variant-2222222222222222"))).toBe(true);
      expect(await exists(join(setup.deps, "libvariant-2222222222222222.rlib"))).toBe(true);
    });
  });

  when("a unit was last built past the idle days", () => {
    test("deletes its fingerprint and outputs", async () => {
      const setup = await fixture();
      const profile = join(setup.target, "debug");
      await writeUsed(join(profile, ".fingerprint", "current-1111111111111111", "lib-current"), 0);
      await writeUsed(join(profile, ".fingerprint", "old-3333333333333333", "lib-old"), 15);
      await writeUsed(join(setup.deps, "libold-3333333333333333.rlib"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(profile, ".fingerprint", "old-3333333333333333"))).toBe(false);
      expect(await exists(join(setup.deps, "libold-3333333333333333.rlib"))).toBe(false);
    });
  });

  when("an older incremental dir of a crate was used within the idle days", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      const incremental = join(setup.target, "debug", "incremental");
      await writeUsed(join(incremental, "app-aaaaaaaaaaaaa", "s-new", "work"), 0);
      await writeUsed(join(incremental, "app-bbbbbbbbbbbbb", "s-old", "work"), 4);
      await usedDaysAgo(join(incremental, "app-bbbbbbbbbbbbb"), 4);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(incremental, "app-bbbbbbbbbbbbb"))).toBe(true);
    });
  });

  when("a nested target dir was used within the idle days", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      const nested = join(setup.target, "drive-build");
      await writeUsed(join(nested, "CACHEDIR.TAG"), 3, "created by cargo\n");
      await writeUsed(join(nested, "debug", "build-output"), 3);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(nested, "debug", "build-output"))).toBe(true);
    });
  });

  when("a temp dir was untouched for the idle days", () => {
    test("deletes it", async () => {
      const setup = await fixture();
      await writeBig(join(setup.scratch, "abandoned", "nested", "data"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await readdir(setup.scratch)).toEqual([]);
    });
  });

  when("an idle temp dir holds under 100 MiB", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      await writeUsed(join(setup.scratch, "daemon-state", "pid"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await readdir(setup.scratch)).toEqual(["daemon-state"]);
    });
  });

  when("a temp dir was used within the idle days", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      await writeUsed(join(setup.scratch, "worktree", "target", "debug", "app"), 4);
      await writeBig(join(setup.scratch, "worktree", "old-notes"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(setup.scratch, "worktree", "target", "debug", "app"))).toBe(true);
    });
  });

  when("a temp dir was only read within the idle days", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      const read = join(setup.scratch, "fresh-build", "fingerprint");
      await writeBig(read, 15);
      const now = Date.now() / 1000;
      await utimes(read, now - 4 * 86400, now - 15 * 86400);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(read)).toBe(true);
    });
  });

  when("part of an idle temp dir cannot be searched", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      const locked = join(setup.scratch, "partly-locked", "locked");
      await writeBig(join(setup.scratch, "partly-locked", "data"), 15);
      await writeUsed(join(locked, "recent"), 0);
      await chmod(locked, 0o000);

      const result = run(setup);
      await chmod(locked, 0o755);

      expect(result.exitCode).toBe(0);
      expect(await exists(join(setup.scratch, "partly-locked", "data"))).toBe(true);
    });
  });

  when("an idle temp dir is hidden", () => {
    test("keeps it", async () => {
      const setup = await fixture();
      await writeBig(join(setup.scratch, ".hidden-state", "data"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await readdir(setup.scratch)).toEqual([".hidden-state"]);
    });
  });

  when("a running process holds a file in an idle temp dir open", () => {
    test("keeps the temp dir", async () => {
      const setup = await fixture();
      const held = join(setup.scratch, "socket-dir", "held");
      await writeBig(held, 15);
      const holder = Bun.spawn(["sh", "-c", 'exec 3<"$0"; echo ready; sleep 30', held], { stdout: "pipe" });
      await holder.stdout.getReader().read();

      const result = run(setup);
      holder.kill();

      expect(result.exitCode).toBe(0);
      expect(await exists(held)).toBe(true);
    });
  });

  when("a temp dir's name has a newline", () => {
    test("deletes nothing outside the temp dirs", async () => {
      const setup = await fixture();
      const cwd = await temporaryDirectory("cleandisk-cwd-");
      await writeBig(join(setup.scratch, "evil\ncleandisk-precious", "data"), 15);
      await writeBig(join(cwd, "cleandisk-precious", "data"), 15);

      const result = run(setup, [], { cwd });

      expect(result.exitCode).toBe(0);
      expect(await readdir(join(cwd, "cleandisk-precious"))).toEqual(["data"]);
    });
  });

  when("a cargo target dir's name has a newline", () => {
    test("deletes nothing outside the cargo target dirs", async () => {
      const setup = await fixture();
      const victim = await realpath(await temporaryDirectory("cleandisk-victim-"));
      const forged = join(setup.home, "code", `evil\n${victim}`);
      const stale = join(victim, "debug", ".fingerprint", "old-3333333333333333");
      await writeUsed(join(forged, "CACHEDIR.TAG"), 0, "created by cargo\n");
      await writeUsed(join(victim, "debug", ".fingerprint", "current-1111111111111111", "lib-current"), 0);
      await writeUsed(join(stale, "lib-old"), 15);

      const result = run(setup);

      expect(result.exitCode).toBe(0);
      expect(await exists(stale)).toBe(true);
    });
  });

  when("an object's name has a newline", () => {
    test("deletes nothing outside the cargo target dirs", async () => {
      const setup = await fixture();
      const cwd = await temporaryDirectory("cleandisk-cwd-");
      const victim = "victim.a.0old.rcgu.o";
      await writeFile(join(setup.deps, `x.rcgu.o\n1 ${victim}`), "forged");
      await writeFile(join(cwd, victim), "user data");

      const result = run(setup, [], { cwd });

      expect(result.exitCode).toBe(0);
      expect(await readdir(cwd)).toEqual([victim]);
    });
  });

  when("run with --dry-run", () => {
    test("counts only files whose every name is doomed and deletes nothing", async () => {
      const setup = await fixture();
      const unit = "some_crate-1010101010101010";
      const [reused, recompiled] = objectNames(unit, "0old010");
      await writeFile(join(setup.deps, objectName(unit, "1new010", cgus[0])), Buffer.alloc(120 * 2 ** 20, 7));
      await link(join(setup.deps, objectName(unit, "1new010", cgus[0])), join(setup.deps, reused));
      await writeFile(join(setup.deps, recompiled), "small");
      await writeFile(join(setup.deps, objectName(unit, "1new010", cgus[1])), "small");
      await linkedAt(await writeBinary(setup.deps, unit, "1new010"), 60);

      const result = run(setup, ["--dry-run"]);

      expect(result.exitCode).toBe(0);
      expect(new TextDecoder().decode(result.stdout)).toContain("2 paths, 0.0 GiB");
      expect(await objectsOf(setup.deps, unit)).toHaveLength(4);
    });
  });
});

function when(condition, body) {
  describe(`when ${condition}`, body);
}
