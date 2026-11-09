import { afterAll, describe, expect, test } from "bun:test";
import { realpath } from "node:fs/promises";
import process from "node:process";
import { VersionProbeFake } from "./testing/version-probe-fake.ts";
import { VersionProbeNativeHarness } from "./testing/version-probe-native-harness.ts";
import { versionFor } from "./version-probe.ts";

function probe(host: VersionProbeFake) {
  return versionFor({ provider: "fake", executable: "/fake executable" }, host).then(
    (version) => ({ version, error: "" }),
    (error: Error) => ({ version: undefined, error: error.message }),
  );
}

function expectReleased(host: VersionProbeFake) {
  expect(host.resources()).toEqual({ timers: 0, listeners: 0 });
}

const nativeHarness = new VersionProbeNativeHarness();
afterAll(async () => {
  await nativeHarness.teardown();
});

describe(versionFor.name, () => {
  test("returns the trimmed version after normal completion", async () => {
    const host = new VersionProbeFake();
    const result = probe(host);

    host.finish();
    const outcome = await result;

    expect(outcome).toEqual({ version: "fake 1.2.3", error: "" });
    expect(host.destructiveSignals).toEqual([]);
    expectReleased(host);
  });

  test.each(["replacement", "lost-anchor"] as const)(
    "refuses a successful version and destructive signals after %s",
    async (generation) => {
      const host = new VersionProbeFake();
      const result = probe(host);

      host.finish(generation);
      const outcome = await result;

      expect(outcome.version).toBeUndefined();
      expect(host.destructiveSignals).toEqual([]);
      expect(outcome.error).toContain("uncertain");
      expect(outcome.error).toContain("no surviving owned member");
      expect(outcome.error).toContain("refused SIGKILL");
      expectReleased(host);
    },
  );

  test("preserves literal version argv, ignored stdin and default cwd/environment inheritance", async () => {
    const host = new VersionProbeFake();
    const result = probe(host);

    host.finish();
    await result;

    expect(host.requests).toEqual([
      {
        argv: ["/fake executable", "--version"],
        options: { detached: true, stdout: "pipe", stderr: "pipe", stdin: "ignore" },
      },
    ]);
    expectReleased(host);
  });

  test("refuses successful output while its recorded descendant remains live", async () => {
    const host = new VersionProbeFake();
    host.seedDescendant();
    const result = probe(host);

    host.finish("live-descendant");
    const outcome = await result;

    expect(outcome.version).toBeUndefined();
    expect(outcome.error).toContain("completion settlement is uncertain");
    expect(host.destructiveSignals.map((entry) => entry.signal)).toEqual(["SIGKILL"]);
    expect(host.livingMembers()).toBe(0);
    expectReleased(host);
  });

  test("enforces the fixed deadline and hard-stops resistant descendants", async () => {
    const host = new VersionProbeFake();
    host.resistUntilKill();
    const result = probe(host);
    expect(host.activeDeadline()).toEqual([2000]);

    host.deadline();
    const outcome = await result;

    expect(outcome.version).toBeUndefined();
    expect(outcome.error).toContain("exceeded the 2000ms version deadline");
    expect(host.livingMembers()).toBe(0);
    expect(host.destructiveSignals).toEqual([{ signal: "SIGKILL", elapsed: 2000 }]);
    expectReleased(host);
  });

  test.each(["SIGINT", "SIGTERM"] as const)(
    "preserves %s as the first cause and cancels the owned group",
    async (signal) => {
      const host = new VersionProbeFake();
      const result = probe(host);

      host.interrupt(signal);
      host.deadline();
      const outcome = await result;

      expect(outcome.version).toBeUndefined();
      expect(outcome.error).toContain(`received ${signal}`);
      expect(outcome.error).not.toContain("version deadline");
      expect(host.livingMembers()).toBe(0);
      expect(host.destructiveSignals).toEqual([{ signal: "SIGKILL", elapsed: 0 }]);
      expectReleased(host);
    },
  );

  test("handles a signal delivered during spawn", async () => {
    const host = new VersionProbeFake();
    host.interruptDuringSpawn();

    const outcome = await probe(host);

    expect(outcome.version).toBeUndefined();
    expect(outcome.error).toContain("received SIGINT");
    expect(host.livingMembers()).toBe(0);
    expectReleased(host);
  });

  test.each([
    ["output", "fake output read failed"],
    ["exit", "fake child exit failed"],
  ] as const)(
    "bounds an observed %s failure",
    async (kind, reason) => {
      const host = new VersionProbeFake();
      const result = probe(host);

      host.fail(kind);
      const outcome = await result;

      expect(outcome.version).toBeUndefined();
      expect(outcome.error).toContain(reason);
      expect(host.livingMembers()).toBe(0);
      expectReleased(host);
    },
    1000,
  );

  test("releases listeners when spawn fails", async () => {
    const host = new VersionProbeFake();
    host.failSpawn();

    const outcome = await probe(host);

    expect(outcome).toEqual({ version: undefined, error: "spawn unavailable" });
    expectReleased(host);
  });

  test.each([
    { version: "fake 1.2.3", code: 7, stderr: "fake refused version" },
    { version: "  ", code: 0, stderr: "fake returned no version" },
  ])("refuses invalid version completion %j", async ({ version, code, stderr }) => {
    const host = new VersionProbeFake();
    const result = probe(host);

    host.finish("absent", version, code, stderr);
    const outcome = await result;

    expect(outcome).toEqual({
      version: undefined,
      error: `fake CLI version could not be established: ${stderr}`,
    });
    expectReleased(host);
  });

  test.each(["settled", "failed", "incomplete"] as const)(
    "bounds open output with %s cancellation",
    async (cleanup) => {
      const host = new VersionProbeFake();
      host.keepOutputOpen(cleanup);
      const result = probe(host);

      host.deadline();
      await host.drainDeadline();
      const outcome = await result;

      expect(outcome.version).toBeUndefined();
      expect(outcome.error).toContain("exceeded the 2000ms version deadline");
      expect(outcome.error).toContain("200ms settlement allowance");
      expect(host.livingMembers()).toBe(0);
      expectReleased(host);
    },
    1000,
  );

  test("retains failed output cancellation diagnostics", async () => {
    const host = new VersionProbeFake();
    host.keepOutputOpen("failed");
    const result = probe(host);

    host.deadline();
    await host.drainDeadline();
    const outcome = await result;

    expect(outcome.error).toContain("stdout cleanup failed: fake cancellation failed");
    expect(outcome.error).toContain("stderr cleanup failed: fake cancellation failed");
    expectReleased(host);
  }, 1000);

  test("retains incomplete output cancellation diagnostics", async () => {
    const host = new VersionProbeFake();
    host.keepOutputOpen("incomplete");
    const result = probe(host);

    host.deadline();
    await host.drainDeadline();
    const outcome = await result;

    expect(outcome.error).toContain("stdout cleanup did not complete");
    expect(outcome.error).toContain("stderr cleanup did not complete");
    expectReleased(host);
  }, 1000);

  test("bounds refused cancellation and reports settlement uncertainty", async () => {
    const host = new VersionProbeFake();
    host.refuseSignals();
    const result = probe(host);

    host.deadline();
    await host.drainDeadline();
    const outcome = await result;

    expect(outcome.version).toBeUndefined();
    expect(outcome.error).toContain("exceeded the 2000ms version deadline");
    expect(outcome.error).toContain("process-group settlement is uncertain");
    expect(outcome.error).toContain("EPERM");
    expect(outcome.error).toContain("process-group settlement deadline exceeded");
    expect(host.elapsedMs()).toBe(4200);
    expectReleased(host);
  }, 1000);

  test("refuses signaling when process inspection is unavailable", async () => {
    const host = new VersionProbeFake();
    const result = probe(host);

    host.failInspection();
    host.deadline();
    await host.drainDeadline();
    const outcome = await result;

    expect(outcome.version).toBeUndefined();
    expect(outcome.error).toContain("process table unavailable");
    expect(host.destructiveSignals).toEqual([]);
    expectReleased(host);
  }, 1000);

  test("runs a literal fake executable with EOF stdin and inherited cwd/environment", async () => {
    const executable = await nativeHarness.script(
      '#!/bin/sh\nif IFS= read -r incoming; then input=read; else input=eof; fi\nprintf "argc=%s arg=%s cwd=%s env=%s stdin=%s\\n" "$#" "$1" "$PWD" "$TMPDIR" "$input"\n',
    );
    const result = await nativeHarness.run(executable);

    expect(result).toBe(
      `argc=1 arg=--version cwd=${await realpath(process.cwd())} env=${process.env.TMPDIR ?? ""} stdin=eof`,
    );
    expect(nativeHarness.trackedRoots()).toBe(0);
    expect(nativeHarness.cleanup.every((entry) => entry.state === "settled" && entry.reaped)).toBe(
      true,
    );
  }, 6000);
});
