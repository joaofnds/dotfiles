import { describe, expect, test } from "bun:test";
import process from "node:process";
import { runProcess } from "./process.ts";

describe("trial provider process", () => {
  test("captures a completed version probe", async () => {
    const result = await runProcess([process.execPath, "-e", 'console.log("provider 1.0")'], 1000);

    expect(result).toEqual({
      stdout: "provider 1.0\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      interrupted: false,
    });
  });

  test("bounds a provider call by its deadline", async () => {
    const result = await runProcess([process.execPath, "-e", "setInterval(() => {}, 1000);"], 20);

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).not.toBe(0);
  });

  test("forces shutdown after the ready provider ignores the first signal", async () => {
    const fake =
      'process.on("SIGTERM", () => {}); console.log("ready"); process.kill(process.ppid, "SIGTERM"); setInterval(() => {}, 1000);';

    const result = await interruptedProcess(fake);

    expect(result.interrupted).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(result.stdout).toBe("ready\n");
    expect(result.exitCode).not.toBe(0);
  });

  test("reaps a ready resistant descendant holding pipes after its parent exits", async () => {
    const descendant =
      'process.on("SIGTERM", () => {}); console.log("descendant ready"); process.kill(process.ppid, "SIGUSR1"); setInterval(() => {}, 1000);';
    const fake = `process.on("SIGUSR1", () => { process.kill(process.ppid, "SIGTERM"); process.exit(0); }); Bun.spawn([process.execPath, "-e", ${JSON.stringify(descendant)}], { stdout: "inherit", stderr: "inherit" }); setInterval(() => {}, 1000);`;

    const result = await interruptedProcess(fake);

    expect(result).toEqual({
      stdout: "descendant ready\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      interrupted: true,
    });
  });
  test("records interruption even when the provider handles shutdown successfully", async () => {
    const fake =
      'process.on("SIGTERM", () => { console.log("stopped"); process.exit(0); }); process.kill(process.ppid, "SIGTERM"); setInterval(() => {}, 1000);';
    const result = await interruptedProcess(fake);

    expect(result).toEqual({
      stdout: "stopped\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      interrupted: true,
    });
  });
});

async function interruptedProcess(fake: string): Promise<Awaited<ReturnType<typeof runProcess>>> {
  const entry = `import { runProcess } from ${JSON.stringify(`${import.meta.dir}/process.ts`)}; console.log(JSON.stringify(await runProcess([process.execPath, "-e", ${JSON.stringify(fake)}], 10000)));`;
  const child = Bun.spawn([process.execPath, "-e", entry], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) throw new Error(`isolated process fixture exited ${code}: ${stderr}`);
  return JSON.parse(stdout);
}
