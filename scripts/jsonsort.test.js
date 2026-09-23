import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
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

async function untilMarking(scratchParent) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const [scratch] = await readdir(scratchParent);
    if (scratch && (await readdir(join(scratchParent, scratch))).includes("marked")) return;
    await Bun.sleep(10);
  }
  throw new Error("jsonsort never started marking");
}

function run(args, stdin = "", cwd = undefined, env = process.env) {
  const result = Bun.spawnSync([jsonsort, ...args], {
    cwd,
    env,
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

test("sorts each block of members between blank lines on its own under --blocks", () => {
  const input = '{\n  "b": 1,\n  "a": 2,\n\n  "d": 3,\n  "c": 4\n}';

  expect(run(["--blocks"], input).stdout).toBe('{\n  "a": 2,\n  "b": 1,\n\n  "c": 4,\n  "d": 3\n}');
});

test("keeps three blocks of one object apart", () => {
  const input = '{\n  "b": 1,\n\n  "a": 2,\n\n  "d": 3,\n  "c": 4\n}';

  expect(run(["--blocks"], input).stdout).toBe('{\n  "b": 1,\n\n  "a": 2,\n\n  "c": 4,\n  "d": 3\n}');
});

test("sorts the blocks of a nested object on their own", () => {
  const input = '{\n  "z": {\n    "b": 1,\n    "a": 2,\n\n    "d": 3,\n    "c": 4\n  },\n  "y": 0\n}';

  expect(run(["--blocks"], input).stdout).toBe('{\n  "y": 0,\n  "z": {\n    "a": 2,\n    "b": 1,\n\n    "c": 4,\n    "d": 3\n  }\n}');
});

test("keeps the blocks below the depth in the order they came in", () => {
  const input = '{\n  "z": {\n    "b": 1,\n\n    "d": 3,\n    "c": 4\n  },\n  "y": 0\n}';

  expect(run(["--blocks", "--depth", "1"], input).stdout).toBe('{\n  "y": 0,\n  "z": {\n    "b": 1,\n\n    "d": 3,\n    "c": 4\n  }\n}');
});

test.each([["spaces", "    "], ["a tab", "\t"], ["a carriage return", "\r"]])("treats a line holding only %s as blank", (_, body) => {
  expect(run(["--blocks", "-c"], `{"b":1,\n${body}\n"a":2}`).stdout).toBe('{"b":1,"a":2}');
});

test("keeps an empty key below the blank line that opens its block", () => {
  expect(run(["--blocks"], '{\n  "b": 1,\n\n  "a": 2,\n  "": 3\n}').stdout).toBe('{\n  "b": 1,\n\n  "": 3,\n  "a": 2\n}');
});

test("sorts a key spelled like the blank-line marker as an ordinary key without --blocks", () => {
  expect(run(["-c"], '{"b":1,"\\u0000jsonsort-blank-0":2,"a":3}').stdout).toBe('{"\\u0000jsonsort-blank-0":2,"a":3,"b":1}');
});

test("drops the break before a block that a repeated key emptied", () => {
  expect(run(["--blocks"], '{\n  "a": 1,\n\n  "a": 2,\n\n  "b": 3\n}').stdout).toBe('{\n  "a": 2,\n\n  "b": 3\n}');
});

test("drops the break after the last block when a repeated key emptied it", () => {
  expect(run(["--blocks"], '{\n  "a": 1,\n\n  "a": 2\n}').stdout).toBe('{\n  "a": 2\n}');
});

test("drops the break of an emptied block below the depth too", () => {
  expect(run(["--blocks", "--depth", "1", "-c"], '{"z":{"a":1,\n\n"a":2}}').stdout).toBe('{"z":{"a":2}}');
});

test("merges consecutive blank lines into one break", () => {
  expect(run(["--blocks"], '{\n  "b": 1,\n\n\n  "a": 2\n}').stdout).toBe('{\n  "b": 1,\n\n  "a": 2\n}');
});

test("counts a blank line before the comma as a break", () => {
  expect(run(["--blocks"], '{\n  "b": 1\n\n  , "a": 2\n}').stdout).toBe('{\n  "b": 1,\n\n  "a": 2\n}');
});

test("drops a blank line that separates no two members", () => {
  const input = '{\n\n  "b": [\n    "y",\n\n    "x"\n  ],\n  "a": 0\n\n}';

  expect(run(["--blocks"], input).stdout).toBe('{\n  "a": 0,\n  "b": [\n    "y",\n    "x"\n  ]\n}');
});

test("sorts within blocks in compact output, which has no line to leave blank", () => {
  expect(run(["--blocks", "-c"], '{"d":1,"b":2,\n\n"c":3,"a":4}').stdout).toBe('{"b":2,"d":1,"a":4,"c":3}');
});

test("leaves the blank line empty under tab indentation", () => {
  expect(run(["--blocks", "--tab"], '{\n  "b": 1,\n\n  "a": 2\n}').stdout).toBe('{\n\t"b": 1,\n\n\t"a": 2\n}');
});

test("keeps the blocks of each file apart", async () => {
  const { paths } = await withFiles({ "one.json": '{"n":0,"m":1,\n\n"a":2}', "two.json": '{"z":0,\n\n"c":1,"b":2}' });

  expect(run(["--blocks", "-c", ...paths]).stdout).toBe('{"m":1,"n":0,"a":2}\n{"z":0,"b":2,"c":1}');
});

test("keeps the blocks of each document in a stream apart", () => {
  expect(run(["--blocks", "-c"], '{"n":0,"m":1,\n\n"a":2}\n{"z":0,\n\n"c":1,"b":2}').stdout).toBe('{"m":1,"n":0,"a":2}\n{"z":0,"b":2,"c":1}');
});

test("fails on a document that is not json under --blocks", () => {
  const result = run(["--blocks"], '{"a":1,\n\n"b"}');

  expect(result.status).toBe(1);
  expect(result.stdout).toBe("");
});

test.each([
  ["first", '{"\\u0000jsonsort-blank-0":7,\n\n"a":1}'],
  ["after a comma", '{"a":1,\n\n"\\u0000jsonsort-blank-0":null,"b":2}'],
])("refuses a key spelled like the marker it puts at blank lines when it comes %s", (_, input) => {
  const result = run(["--blocks"], input);

  expect(result.status).toBe(1);
  expect(result.stderr).toContain("reserved");
});

test("reads past an escaped quote inside a string", () => {
  expect(run(["--blocks", "-c"], '{"b":"x \\" y",\n\n"a":1}').stdout).toBe('{"b":"x \\" y","a":1}');
});

test("accepts a value that begins with the marker text", () => {
  expect(run(["--blocks", "-c"], '{"a":"\\u0000jsonsort-blank-0"}').stdout).toBe('{"a":"\\u0000jsonsort-blank-0"}');
});

test("keeps a key that holds the marker text after an escaped quote", () => {
  const input = '{"x\\"\\u0000jsonsort-blank-0":null,"y":1}';

  expect(run(["--blocks", "-c"], input).stdout).toBe(input);
});

test("reads stdin under --blocks for a file named dash", () => {
  expect(run(["--blocks", "-c", "-"], '{"b":1,\n\n"a":2}').stdout).toBe('{"b":1,"a":2}');
});

test("reads a file whose name begins with a dash under --blocks when it follows a double dash", async () => {
  const { directory } = await withFiles({ "-c": '{"b":1,\n\n"a":2}' });
  const result = run(["--blocks", "-c", "--", "-c"], "", directory);

  expect(result.stdout).toBe('{"b":1,"a":2}');
  expect(result.status).toBe(0);
});

test("leaves no scratch files behind", async () => {
  const { directory } = await withFiles({});

  const result = run(["--blocks"], '{"b":1,\n\n"a":2}', undefined, { ...process.env, TMPDIR: directory });

  expect(result.status).toBe(0);
  expect(await readdir(directory)).toEqual([]);
});

test("dies of the interrupt that stops it and leaves no scratch files", async () => {
  const { directory } = await withFiles({});
  const child = Bun.spawn([jsonsort, "--blocks"], { env: { ...process.env, TMPDIR: directory }, stdin: "pipe", stdout: "pipe" });
  await untilMarking(directory);

  child.kill("SIGINT");
  child.stdin.end();
  await child.exited;

  expect(child.signalCode).toBe("SIGINT");
  expect(await readdir(directory)).toEqual([]);
});

test.each(["-S", "--sort-keys", "-C", "--color-output", "-cS", "-R", "--raw-input", "--stream", "--stream-errors"])("refuses %s alongside --blocks", (option) => {
  const result = run(["--blocks", option], '{"a":1}');

  expect(result.status).toBe(2);
  expect(result.stderr).toContain("cannot be combined");
});

test("prints usage for --help", () => {
  const result = run(["--help"]);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain("usage: jsonsort");
});
