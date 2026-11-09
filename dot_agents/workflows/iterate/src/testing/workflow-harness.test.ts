import { afterAll, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import { WorkflowFixtureRetiredError, WorkflowHarness } from "./workflow-harness.ts";

type WorkflowDriver = Awaited<ReturnType<WorkflowHarness["seed"]>>;

const fixtures = new Set<WorkflowHarness>();

afterAll(async () => {
  await Promise.all([...fixtures].map((fixture) => fixture.teardown()));
}, 20_000);

test("the workflow deadline cannot return a cancelled runner result", async () => {
  const harness = await WorkflowHarness.setup({ runnerDeadlineMs: 3000 });
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  await driver.useCodex("hold");

  await expect(
    driver.run(
      "step",
      "DOT-1",
      "--provider",
      "codex",
      "--model",
      "gpt-6.1-sol",
      "--effort",
      "high",
    ),
  ).rejects.toThrow("workflow runner exceeded its bounded deadline");

  expect(await driver.codexProcess()).toMatchObject({ running: false });

  await harness.teardown();
  fixtures.delete(harness);
}, 20_000);

test("reset retains evidence until an admitted failed call settles", async () => {
  const evidenceEntered = Promise.withResolvers<void>();
  const evidenceRelease = Promise.withResolvers<void>();
  const retirementEntered = Promise.withResolvers<void>();
  const retirementRelease = Promise.withResolvers<void>();
  const prematureRetirement = new Error("fixture files retired before evidence settled");
  let hold = false;
  let evidenceSettled = false;
  let prematureAttempt = false;
  const harness = await WorkflowHarness.setup({
    fixtureIOBoundary: {
      evidenceDirectory: "",
      collectEvidence: async (read) => {
        evidenceEntered.resolve();
        await evidenceRelease.promise;
        const evidence = await read();
        evidenceSettled = true;
        return evidence;
      },
      afterRunnersStopped: () => {
        if (!hold) return Promise.resolve();
        retirementEntered.resolve();
        return retirementRelease.promise;
      },
      beforeRetireFiles: () => {
        if (hold && !evidenceSettled) {
          prematureAttempt = true;
          throw prematureRetirement;
        }
      },
    },
  });
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const pending = driver.run("unrecognized-command");
  const observedCall = Promise.allSettled([pending]);
  await evidenceEntered.promise;
  const runnerReceipt = await readFile(join(driver.repo, ".git", "runner-results.jsonl"), "utf8");
  hold = true;
  const retirement = harness.reset();
  const observedRetirement = Promise.allSettled([retirement]);

  try {
    await retirementEntered.promise;
    retirementRelease.resolve();
    evidenceRelease.resolve();
    const [calls, cleanup] = await Promise.all([observedCall, observedRetirement]);

    expect(prematureAttempt, "retirement must wait for the admitted evidence read").toBe(false);
    expect(cleanup).toEqual([{ status: "fulfilled", value: undefined }]);
    expect(calls[0]?.status).toBe("fulfilled");
    const result = await pending;
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("name a card with iterate step <card>");
    expect(result.calls).toEqual([]);
    expect(result.edits).toBe("");
    expect(result.systems).toEqual([]);
    expect(result.deferredDispatches).toEqual([]);
    expect(result.argsSeen).toBe("");
    expect(JSON.parse(runnerReceipt.trim())).toMatchObject({ code: result.code });
  } finally {
    retirementRelease.resolve();
    evidenceRelease.resolve();
    await Promise.all([observedCall, observedRetirement]);
    hold = false;
    fixtures.delete(harness);
    const [retired] = await observedRetirement;
    if (retired?.status === "fulfilled") await harness.teardown();
  }
}, 20_000);

class EvidenceGate {
  readonly entered = Promise.withResolvers<void>();
  readonly releaseEvidence = Promise.withResolvers<void>();
  readonly retirementEntered = Promise.withResolvers<void>();
  readonly releaseRetirement = Promise.withResolvers<void>();
  readonly operations: string[] = [];
  armed = false;
  collected = false;

  constructor(readonly archive?: string) {}

  get boundary() {
    return {
      evidenceDirectory: this.archive ?? "",
      collectEvidence: async (read: () => Promise<string[]>) => {
        this.entered.resolve();
        await this.releaseEvidence.promise;
        const evidence = await read();
        this.collected = true;
        return evidence;
      },
      afterRunnersStopped: () => {
        if (!this.armed) return Promise.resolve();

        this.retirementEntered.resolve();
        return this.releaseRetirement.promise;
      },
      beforeRetireFiles: (operation: string) => {
        this.operations.push(operation);
        if (this.armed && !this.collected)
          throw new Error("fixture files retired before evidence settled");
      },
    };
  }

  release(): void {
    this.releaseRetirement.resolve();
    this.releaseEvidence.resolve();
  }
}

async function pendingEvidenceFixture(archive?: string) {
  const gate = new EvidenceGate(archive);
  const harness = await WorkflowHarness.setup({ fixtureIOBoundary: gate.boundary });
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const pending = driver.run("unrecognized-command");
  const observed = Promise.allSettled([pending]);
  await gate.entered.promise;
  gate.armed = true;
  return { harness, driver, gate, pending, observed };
}

async function finishFixture(harness: WorkflowHarness): Promise<void> {
  await harness.teardown();
  fixtures.delete(harness);
}

test("teardown retains evidence until an admitted failed call settles", async () => {
  const { harness, driver, gate, pending, observed } = await pendingEvidenceFixture();
  const retirement = harness.teardown();
  const cleanup = Promise.allSettled([retirement]);

  try {
    await gate.retirementEntered.promise;
    gate.release();
    const [calls, retired] = await Promise.all([observed, cleanup]);

    expect(calls[0]?.status).toBe("fulfilled");
    expect(retired).toEqual([{ status: "fulfilled", value: undefined }]);
    expect((await pending).code).toBe(1);
    expect(gate.collected).toBe(true);
    expect(existsSync(dirname(driver.directory))).toBe(false);
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    gate.armed = false;
    await finishFixture(harness);
  }
}, 20_000);

test("teardown archives the real evidence after admitted reads complete", async () => {
  const archive = await mkdtemp(join(tmpdir(), "workflow-lifetime-archive-success-"));
  const gate = new EvidenceGate(archive);
  const harness = await WorkflowHarness.setup({ fixtureIOBoundary: gate.boundary });
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const contents = {
    calls: "calls-evidence",
    edits: "edits-evidence",
    systems: "systems-evidence",
    "deferred-dispatches": "deferred-dispatches-evidence",
    arguments: "arguments-evidence",
  };
  const entries = Object.entries(contents);
  await Promise.all(entries.map(([name, value]) => writeFile(join(driver.directory, name), value)));
  const pending = driver.run("unrecognized-command");
  const observed = Promise.allSettled([pending]);
  await gate.entered.promise;
  gate.armed = true;
  const retirement = harness.teardown();
  const cleanup = Promise.allSettled([retirement]);

  try {
    await gate.retirementEntered.promise;
    gate.release();
    await Promise.all([observed, cleanup]);
    const result = await pending;
    const destination = join(
      archive,
      basename(dirname(driver.directory)),
      basename(driver.directory),
    );

    expect(result).toMatchObject({
      code: 1,
      calls: ["calls-evidence"],
      edits: "edits-evidence",
      systems: ["systems-evidence"],
      deferredDispatches: ["deferred-dispatches-evidence"],
      argsSeen: "arguments-evidence",
    });
    expect(
      await Promise.all(entries.map(([name]) => readFile(join(destination, name), "utf8"))),
    ).toEqual(Object.values(contents));
    expect(await cleanup).toEqual([{ status: "fulfilled", value: undefined }]);
    expect(gate.operations).toEqual(["archive", "remove"]);
    expect(existsSync(dirname(driver.directory))).toBe(false);
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    gate.armed = false;
    await finishFixture(harness);
    await rm(archive, { recursive: true, force: true });
  }
}, 20_000);

const coveredCalls = [
  {
    name: "run",
    call: (_harness: WorkflowHarness, driver: WorkflowDriver, args = ["unrecognized-command"]) =>
      driver.run(...args),
  },
  {
    name: "runFrom",
    call: (_harness: WorkflowHarness, driver: WorkflowDriver, args = ["unrecognized-command"]) =>
      driver.runFrom(".", ...args),
  },
  {
    name: "direct harness.run",
    call: (harness: WorkflowHarness, driver: WorkflowDriver, args = ["unrecognized-command"]) =>
      harness.run(driver.repo, driver.env, args),
  },
];

test.each(coveredCalls)(
  "retirement refuses late $name before spawning",
  async ({ call }) => {
    const { harness, driver, gate, observed } = await pendingEvidenceFixture();
    const receiptPath = join(driver.repo, ".git", "runner-results.jsonl");
    const originalReceipt = await readFile(receiptPath, "utf8");
    const retirement = harness.reset();
    const cleanup = Promise.allSettled([retirement]);
    await gate.retirementEntered.promise;
    const late = call(harness, driver);
    const lateObserved = Promise.allSettled([late]);

    try {
      gate.release();
      const [lateResults, oldResults, retired] = await Promise.all([
        lateObserved,
        observed,
        cleanup,
      ]);

      expect(lateResults[0]?.status, "retired runner admission must reject before spawn").toBe(
        "rejected",
      );
      await expect(late).rejects.toBeInstanceOf(WorkflowFixtureRetiredError);
      expect(oldResults[0]?.status).toBe("fulfilled");
      expect(retired).toEqual([{ status: "fulfilled", value: undefined }]);
      expect(originalReceipt.trim().split("\n")).toHaveLength(1);
      const fresh = await harness.seed();
      const freshResult = await fresh.run("unrecognized-command");
      expect(freshResult).toMatchObject({
        code: 1,
        calls: [],
        edits: "",
        systems: [],
        deferredDispatches: [],
        argsSeen: "",
      });
      const freshReceipt = await readFile(join(fresh.repo, ".git", "runner-results.jsonl"), "utf8");
      await expect(call(harness, driver)).rejects.toBeInstanceOf(WorkflowFixtureRetiredError);
      expect(await readFile(join(fresh.repo, ".git", "runner-results.jsonl"), "utf8")).toBe(
        freshReceipt,
      );
    } finally {
      gate.release();
      await Promise.all([observed, cleanup, lateObserved]);
      gate.armed = false;
      await finishFixture(harness);
    }
  },
  20_000,
);

test("concurrent resets produce one independent next fixture", async () => {
  const { harness, driver, gate, pending, observed } = await pendingEvidenceFixture();
  const root = dirname(driver.directory);
  const first = harness.reset();
  const second = harness.reset();
  const cleanup = Promise.allSettled([first, second]);

  try {
    await gate.retirementEntered.promise;
    gate.release();
    await Promise.all([observed, cleanup]);
    const fresh = await harness.seed();

    expect(await cleanup).toEqual([
      { status: "fulfilled", value: undefined },
      { status: "fulfilled", value: undefined },
    ]);
    expect((await pending).code).toBe(1);
    expect(fresh.directory).not.toBe(driver.directory);
    expect(await readdir(root)).toEqual([basename(fresh.directory)]);
    expect((await fresh.run("unrecognized-command")).code).toBe(1);
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    gate.armed = false;
    await finishFixture(harness);
  }
}, 20_000);

test("concurrent teardown closes a pending reset without a fresh admission window", async () => {
  const { harness, driver, gate, pending, observed } = await pendingEvidenceFixture();
  const resetting = harness.reset();
  await gate.retirementEntered.promise;
  const tearingDown = harness.teardown();
  const repeated = harness.teardown();
  const cleanup = Promise.allSettled([resetting, tearingDown, repeated]);

  try {
    gate.release();
    await Promise.all([observed, cleanup]);

    expect(await cleanup).toEqual([
      { status: "fulfilled", value: undefined },
      { status: "fulfilled", value: undefined },
      { status: "fulfilled", value: undefined },
    ]);
    expect((await pending).code).toBe(1);
    expect(existsSync(dirname(driver.directory))).toBe(false);
    await expect(harness.reset()).rejects.toBeInstanceOf(WorkflowFixtureRetiredError);
    await expect(driver.run("unrecognized-command")).rejects.toBeInstanceOf(
      WorkflowFixtureRetiredError,
    );
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    gate.armed = false;
    await finishFixture(harness);
  }
}, 20_000);

test("a real evidence read failure remains visible and retains the fixture", async () => {
  const { harness, driver, gate, pending, observed } = await pendingEvidenceFixture();
  await rm(join(driver.directory, "calls"));
  const retirement = harness.reset();
  const cleanup = Promise.allSettled([retirement]);

  try {
    await gate.retirementEntered.promise;
    gate.release();
    await Promise.all([observed, cleanup]);

    await expect(pending).rejects.toMatchObject({
      code: "ENOENT",
      path: join(driver.directory, "calls"),
    });
    await expect(retirement).rejects.toMatchObject({
      code: "ENOENT",
      path: join(driver.directory, "calls"),
    });
    expect(await readFile(join(driver.directory, "edits"), "utf8")).toBe("");
    expect(await readFile(join(driver.repo, ".git", "runner-results.jsonl"), "utf8")).toContain(
      '"code":1',
    );
    await expect(harness.teardown()).rejects.toMatchObject({
      code: "ENOENT",
      path: join(driver.directory, "calls"),
    });
    expect(existsSync(driver.directory)).toBe(true);
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    fixtures.delete(harness);
    await rm(dirname(driver.directory), { recursive: true, force: true });
  }
}, 20_000);

test("an archive copy failure remains visible without removing original evidence", async () => {
  const archive = await mkdtemp(join(tmpdir(), "workflow-lifetime-archive-failure-"));
  const { harness, driver, gate, observed } = await pendingEvidenceFixture(archive);
  await writeFile(
    join(archive, basename(dirname(driver.directory))),
    "archive destination is a file",
  );
  const retirement = harness.teardown();
  const cleanup = Promise.allSettled([retirement]);

  try {
    await gate.retirementEntered.promise;
    gate.release();
    await Promise.all([observed, cleanup]);

    expect((await cleanup)[0]?.status).toBe("rejected");
    await expect(retirement).rejects.toBeInstanceOf(Error);
    expect(await readFile(join(driver.directory, "calls"), "utf8")).toBe("");
    expect(await readFile(join(driver.directory, "edits"), "utf8")).toBe("");
    expect(gate.operations).toEqual(["archive"]);
    await expect(harness.teardown()).rejects.toBeInstanceOf(Error);
    expect(existsSync(driver.directory)).toBe(true);
  } finally {
    gate.release();
    await Promise.all([observed, cleanup]);
    fixtures.delete(harness);
    await rm(dirname(driver.directory), { recursive: true, force: true });
    await rm(archive, { recursive: true, force: true });
  }
}, 20_000);

function readyFile(path: string) {
  const ready = Promise.withResolvers<void>();
  function inspect() {
    try {
      const value = readFileSync(path, "utf8");
      if (!/^\d+$/.test(value)) return;

      clearInterval(timer);
      ready.resolve();
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return;

      clearInterval(timer);
      ready.reject(error);
    }
  }

  const timer = setInterval(inspect, 5);
  timer.unref();
  inspect();
  return { ready: ready.promise, close: () => clearInterval(timer) };
}

function knownProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;
    throw error;
  }
}

test.each(coveredCalls)(
  "reset preserves a cancelled $name result and settles its known fake",
  async ({ call }) => {
    const harness = await WorkflowHarness.setup();
    fixtures.add(harness);
    await harness.reset();
    const driver = await harness.seed();
    await driver.useCodex("hold");
    const ready = readyFile(join(driver.directory, "codex-ready"));
    const args = [
      "step",
      "DOT-1",
      "--provider",
      "codex",
      "--model",
      "gpt-6.1-sol",
      "--effort",
      "high",
    ];
    const pending = call(harness, driver, args);
    const observed = Promise.allSettled([pending]);

    try {
      await ready.ready;
      const known = await driver.codexProcess();
      expect(known.running).toBe(true);
      await harness.reset();
      const result = await pending;

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("received SIGTERM");
      expect(knownProcessRunning(known.pid)).toBe(false);
      expect((await observed)[0]?.status).toBe("fulfilled");
    } finally {
      ready.close();
      await finishFixture(harness);
      await observed;
    }
  },
  20_000,
);

test("cleanup boundary uncertainty retains evidence and the original rejection", async () => {
  const uncertainty = new Error("fixture retirement boundary is uncertain");
  let retiring = false;
  const harness = await WorkflowHarness.setup({
    fixtureIOBoundary: {
      afterRunnersStopped: () => (retiring ? Promise.reject(uncertainty) : Promise.resolve()),
    },
  });
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const result = await driver.run("unrecognized-command");
  retiring = true;

  try {
    await expect(harness.reset()).rejects.toBe(uncertainty);

    expect(result.code).toBe(1);
    expect(await readFile(join(driver.directory, "calls"), "utf8")).toBe("");
    await expect(harness.teardown()).rejects.toBe(uncertainty);
    expect(existsSync(driver.directory)).toBe(true);
  } finally {
    fixtures.delete(harness);
    await rm(dirname(driver.directory), { recursive: true, force: true });
  }
}, 20_000);

test("a direct runner receipt failure remains visible and retains the fixture", async () => {
  const harness = await WorkflowHarness.setup();
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const receipt = join(await realpath(join(driver.repo, ".git")), "runner-results.jsonl");
  await mkdir(receipt);
  const pending = harness.run(driver.repo, driver.env, ["unrecognized-command"]);
  const observed = Promise.allSettled([pending]);

  try {
    const error = await pending.catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(Error);
    expect(error).toHaveProperty("code", "EISDIR");
    expect(error).toHaveProperty("message", expect.stringContaining(receipt));

    await expect(harness.reset()).rejects.toBe(error);
    await expect(harness.teardown()).rejects.toBe(error);
    expect(await readFile(join(driver.directory, "calls"), "utf8")).toBe("");
    expect(existsSync(driver.directory)).toBe(true);
  } finally {
    await observed;
    fixtures.delete(harness);
    await rm(dirname(driver.directory), { recursive: true, force: true });
  }
}, 20_000);

test("the current fixture admits its independent sibling repository", async () => {
  const harness = await WorkflowHarness.setup();
  fixtures.add(harness);
  await harness.reset();
  const driver = await harness.seed();
  const sibling = await driver.independentTree();

  try {
    const result = await harness.run(sibling, driver.env, ["unrecognized-command"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("name a card with iterate step <card>");
    expect(
      JSON.parse(await readFile(join(sibling, ".git", "runner-results.jsonl"), "utf8")),
    ).toMatchObject({ code: result.code, cwd: sibling });
  } finally {
    await finishFixture(harness);
  }
}, 20_000);
