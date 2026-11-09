import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";

let directory: string;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "iterate-completion-contract-"));
  await mkdir(join(directory, ".git"));
  await writeFile(join(directory, "synthetic-executable"), "synthetic binary bytes");
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

test("changes author compatibility when the dispatched completion schema changes", async () => {
  const child = spawn(
    [
      process.execPath,
      "-e",
      `import { codexRuntimeContract } from ${JSON.stringify(join(import.meta.dir, "codex-runtime.ts"))};
import { codexCompletionOutputSchema } from ${JSON.stringify(join(import.meta.dir, "codex-completion.ts"))};
const input = { executable: './synthetic-executable', cliVersion: 'synthetic', rolePolicy: 'synthetic' };
const before = await codexRuntimeContract(input);
codexCompletionOutputSchema.properties.schemaVersion.const = 2;
const after = await codexRuntimeContract(input);
console.log(JSON.stringify({before, after}));`,
    ],
    {
      cwd: directory,
      env: { ...process.env, HOME: directory, CODEX_HOME: join(directory, ".codex") },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
  const { before, after } = JSON.parse(stdout);
  expect(before.localInputs).toEqual({ established: true, reasons: [] });
  expect(after.localInputs).toEqual(before.localInputs);
  expect(after.fingerprint).not.toBe(before.fingerprint);
});
