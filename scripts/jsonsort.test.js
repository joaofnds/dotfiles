import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const jsonsort = join(import.meta.dir, "..", "dot_scripts", "executable_jsonsort");
const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function withFiles(documents) {
  const directory = await mkdtemp(join(tmpdir(), "jsonsort-test-"));
  directories.push(directory);

  const paths = [];
  for (const [name, contents] of Object.entries(documents)) {
    const path = join(directory, name);
    await writeFile(path, contents);
    paths.push(path);
  }

  return { directory, paths };
}

function run(args, stdin = "", cwd = undefined) {
  const result = Bun.spawnSync([jsonsort, ...args], {
    cwd,
    stderr: "pipe",
    stdin: new TextEncoder().encode(stdin),
    stdout: "pipe",
  });
  const decoder = new TextDecoder();

  return {
    status: result.exitCode,
    stderr: decoder.decode(result.stderr),
    stdout: decoder.decode(result.stdout).trimEnd(),
  };
}

test("sorts the keys of every level when no depth is given", () => {
  expect(run(["-c"], '{"a":{"d":2,"c":1}}').stdout).toBe('{"a":{"c":1,"d":2}}');
});

test("sorts only the top level at depth 1", () => {
  expect(run(["--depth", "1", "-c"], '{"m":0,"a":{"z":1,"b":2}}').stdout).toBe('{"a":{"z":1,"b":2},"m":0}');
});

test("sorts two levels at depth 2", () => {
  expect(run(["--depth", "2", "-c"], '{"m":0,"a":{"z":1,"b":2}}').stdout).toBe('{"a":{"b":2,"z":1},"m":0}');
});

test("leaves keys deeper than the depth in the position they arrived in", () => {
  expect(run(["--depth", "2", "-c"], '{"m":0,"a":{"z":{"y":1,"b":2}}}').stdout).toBe('{"a":{"z":{"y":1,"b":2}},"m":0}');
});

test("changes nothing at depth 0", () => {
  expect(run(["--depth", "0", "-c"], '{"m":0,"a":{"z":1,"b":2}}').stdout).toBe('{"m":0,"a":{"z":1,"b":2}}');
});

test("accepts the depth as a single --depth=N argument", () => {
  expect(run(["--depth=1", "-c"], '{"m":0,"a":1}').stdout).toBe('{"a":1,"m":0}');
});

test("keeps array elements in their original order", () => {
  expect(run(["-c"], '{"a":[3,1,2]}').stdout).toBe('{"a":[3,1,2]}');
});

test("sorts an object inside an array at the depth of the array that holds it", () => {
  expect(run(["--depth", "2", "-c"], '{"a":[{"z":1,"b":2}]}').stdout).toBe('{"a":[{"b":2,"z":1}]}');
});

test("spends no depth on array nesting", () => {
  expect(run(["--depth", "2", "-c"], '{"a":[[{"z":1,"b":2}]]}').stdout).toBe('{"a":[[{"b":2,"z":1}]]}');
});

test("passes a document with no object through untouched", () => {
  expect(run(["-c"], "[2,1]").stdout).toBe("[2,1]");
});

test("reads stdin when given no file", () => {
  expect(run(["-c"], '{"m":0,"a":1}').stdout).toBe('{"a":1,"m":0}');
});

test("reads stdin for a file named dash", () => {
  expect(run(["-c", "-"], '{"m":0,"a":1}').stdout).toBe('{"a":1,"m":0}');
});

test("sorts a document read from a file", async () => {
  const { paths: [one] } = await withFiles({ "one.json": '{"m":0,"a":1}' });

  expect(run(["-c", one]).stdout).toBe('{"a":1,"m":0}');
});

test("emits one document per file when given several", async () => {
  const { paths } = await withFiles({ "one.json": '{"m":0,"a":1}', "two.json": '{"z":0,"b":1}' });

  expect(run(["-c", ...paths]).stdout).toBe('{"a":1,"m":0}\n{"b":1,"z":0}');
});

test("sorts each document of a multi-document stream", () => {
  expect(run(["-c"], '{"m":0,"a":1}\n{"z":0,"b":1}').stdout).toBe('{"a":1,"m":0}\n{"b":1,"z":0}');
});

test("pretty-prints unless asked for compact output", () => {
  expect(run([], '{"m":0,"a":1}').stdout).toBe('{\n  "a": 1,\n  "m": 0\n}');
});

test("refuses a negative depth", () => {
  const result = run(["--depth", "-1"], '{"a":1}');

  expect(result.status).toBe(2);
  expect(result.stderr).toContain("non-negative");
});

test("refuses a depth that is not a number", () => {
  expect(run(["--depth", "abc"], '{"a":1}').status).toBe(2);
});

test("refuses a --depth with no value after it", () => {
  expect(run(["--depth"], '{"a":1}').status).toBe(2);
});

test("names the file it could not read", () => {
  const result = run([join(tmpdir(), "jsonsort-absent.json")]);

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("no such file");
});

test("fails on a document that is not json", () => {
  expect(run([], "not json").status).toBe(1);
});

test("reports a file that is not json as a plain failure, not with jq's own code", async () => {
  const { paths: [broken] } = await withFiles({ "broken.json": "not json" });

  expect(run([broken]).status).toBe(1);
});

test("keeps going through the remaining files after one fails", async () => {
  const { paths: [good] } = await withFiles({ "good.json": '{"m":0,"a":1}' });
  const result = run(["-c", join(tmpdir(), "jsonsort-absent.json"), good]);

  expect(result.stdout).toBe('{"a":1,"m":0}');
  expect(result.status).toBe(1);
});

test("treats a name holding a newline as one file", async () => {
  const { paths: [awkward] } = await withFiles({ "one\ntwo.json": '{"m":0,"a":1}' });
  const result = run(["-c", awkward]);

  expect(result.stdout).toBe('{"a":1,"m":0}');
  expect(result.status).toBe(0);
});

test("hands an option it does not know to jq", () => {
  expect(run(["--tab"], '{"m":0,"a":1}').stdout).toBe('{\n\t"a": 1,\n\t"m": 0\n}');
});

test("keeps the value of a jq option that takes one out of the file list", () => {
  const result = run(["--indent", "4", "-"], '{"m":0,"a":1}');

  expect(result.stdout).toBe('{\n    "a": 1,\n    "m": 0\n}');
  expect(result.status).toBe(0);
});

test("keeps both words of a jq option that takes a name and a value", () => {
  expect(run(["--arg", "unused", "value", "-c", "-"], '{"m":0,"a":1}').stdout).toBe('{"a":1,"m":0}');
});

test("refuses a value-taking jq option with nothing after it", () => {
  const result = run(["--indent"], '{"a":1}');

  expect(result.status).toBe(2);
  expect(result.stdout).toBe("");
});

test("reads an option holding a glob character the same way whatever the directory holds", async () => {
  const { directory, paths } = await withFiles({ "one.json": '{"m":0,"a":1}', "-cX": "" });
  const bare = await mkdtemp(join(tmpdir(), "jsonsort-test-"));
  directories.push(bare);

  const withMatch = run(["-c*", paths[0]], "", directory);
  const withoutMatch = run(["-c*", paths[0]], "", bare);

  expect(withMatch.stderr).toBe(withoutMatch.stderr);
  expect(withMatch.status).toBe(withoutMatch.status);
});

test("reads a file whose name begins with a dash when it follows a double dash", async () => {
  const { paths: [dashed] } = await withFiles({ "-c": '{"m":0,"a":1}' });
  const result = run(["-c", "--", dashed]);

  expect(result.stdout).toBe('{"a":1,"m":0}');
  expect(result.status).toBe(0);
});

test("sorts a named pipe rather than calling it a missing file", async () => {
  const { directory } = await withFiles({});
  const fifo = join(directory, "pipe.json");
  Bun.spawnSync(["mkfifo", fifo]);
  Bun.spawn(["sh", "-c", `printf '{"m":0,"a":1}' > ${JSON.stringify(fifo)}`]);

  const result = run(["-c", fifo]);

  expect(result.stdout).toBe('{"a":1,"m":0}');
  expect(result.status).toBe(0);
});

test("says where an option after a file belongs rather than calling it missing", async () => {
  const { paths: [one] } = await withFiles({ "one.json": '{"m":0,"a":1}' });
  const result = run([one, "-c"]);

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("options go before files");
});

test("says a directory is a directory rather than a missing file", async () => {
  const { directory } = await withFiles({});
  const result = run([directory]);

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("is a directory");
});

test("prints usage for --help", () => {
  const result = run(["--help"]);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain("usage: jsonsort");
});
