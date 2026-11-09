import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

setDefaultTimeout(20_000);

describe("iterate completion", () => {
  let harness: WorkflowHarness;
  beforeAll(async () => {
    harness = await WorkflowHarness.setup();
  });
  beforeEach(async () => {
    await harness.reset();
  });
  afterAll(async () => {
    await harness.teardown();
  }, 20_000);

  test("completes a Done card whose acceptance criteria and definition of done are checked", async () => {
    const driver = await harness.seedReal({ status: "Done" });
    await driver.boardCommand(
      "task",
      "edit",
      "TASK-1",
      "--ac",
      "An observed behavior",
      "--dod",
      "Independent review",
      "--check-ac",
      "1",
      "--check-dod",
      "1",
    );

    const result = await driver.run("step", "TASK-1");
    const status = await completionState(driver);

    expect(result.code).toBe(0);
    expect(status).toMatchObject({ completed: true, attempts: [] });
    expect(result.calls).toEqual([]);
  });

  test("completes a Done card with no checklist items", async () => {
    const driver = await harness.seedReal({ status: "Done" });

    const result = await driver.run("step", "TASK-1");
    const status = await completionState(driver);

    expect(result.code).toBe(0);
    expect(status).toMatchObject({ completed: true, attempts: [] });
    expect(result.calls).toEqual([]);
  });

  test("completes the same refused run after the remaining requirement is checked", async () => {
    const driver = await harness.seedReal({ status: "Done" });
    await driver.boardCommand("task", "edit", "TASK-1", "--dod", "Independent review");
    const refused = await driver.run("step", "TASK-1");
    const before = await completionState(driver);
    await driver.boardCommand("task", "edit", "TASK-1", "--check-dod", "1");

    const retried = await driver.run("step", "TASK-1");
    const after = await completionState(driver);

    expect(refused.code).toBe(1);
    expect(before.completed).toBe(false);
    expect(retried.code).toBe(0);
    expect(after).toEqual({ ...before, completed: true });
    expect(retried.calls).toEqual([]);
  });

  test.each([
    { name: "acceptance criterion", add: "--ac", check: "--check-ac", uncheck: "--uncheck-ac" },
    {
      name: "definition-of-done item",
      add: "--dod",
      check: "--check-dod",
      uncheck: "--uncheck-dod",
    },
  ])(
    "revalidates a completed claimed run after an existing $name is unchecked",
    async ({ add, check, uncheck }) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
      await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");
      await driver.boardCommand("task", "edit", "TASK-1", add, "Observed requirement", check, "1");
      const completed = await driver.run("step", "TASK-1");
      const before = await completionState(driver);
      await driver.boardCommand("task", "edit", "TASK-1", uncheck, "1");

      const refused = await driver.run("step", "TASK-1");
      const during = await completionState(driver);
      await driver.boardCommand("task", "edit", "TASK-1", check, "1");
      const retried = await driver.run("step", "TASK-1");
      const after = await completionState(driver);

      expect([completed.code, refused.code, retried.code]).toEqual([0, 1, 0]);
      expect(before.completed).toBe(true);
      expect(during).toEqual({ ...before, completed: false });
      expect(after).toEqual(before);
      expect(retried.calls).toEqual(["/build TASK-1"]);
    },
  );

  test.each(["partial", "abandoned"])(
    "closes explicitly %s work with unchecked requirements under the board policy",
    async (label) => {
      const driver = await harness.seedReal({ status: "Done" });
      await driver.boardCommand(
        "task",
        "edit",
        "TASK-1",
        "--ac",
        "An unfinished behavior",
        "--dod",
        "Unfinished review",
        "--add-label",
        label,
      );

      const result = await driver.run("step", "TASK-1");
      const status = await completionState(driver);

      expect(result.code).toBe(0);
      expect(status).toMatchObject({ completed: true, attempts: [] });
      expect(result.calls).toEqual([]);
    },
  );

  test("starts a fresh cycle when previously released work is reopened after failed revalidation", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    await driver.boardCommand(
      "task",
      "edit",
      "TASK-1",
      "--status",
      "Done",
      "--ac",
      "Observed",
      "--check-ac",
      "1",
    );
    const completed = await driver.run("step", "TASK-1");
    await driver.boardCommand("task", "edit", "TASK-1", "--uncheck-ac", "1");
    const refused = await driver.run("step", "TASK-1");
    const previous = await completionState(driver);
    const oldBytes = await readFile(join(previous.directory, "run.json"), "utf8");
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Build");

    const restarted = await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    const current = await completionState(driver);

    expect([completed.code, refused.code]).toEqual([0, 1]);
    expect(restarted.code).toBe(1);
    expect(restarted.calls).toEqual(["/build TASK-1", "/build TASK-1"]);
    expect(current.id).not.toBe(previous.id);
    expect(current.attempts).toHaveLength(1);
    expect(current.runClaim).toBeDefined();
    expect(current.runClaim?.releasedAt).toBeUndefined();
    expect(await readFile(join(previous.directory, "run.json"), "utf8")).toBe(oldBytes);
  });

  test("preserves a new human assignment while retrying invalidated released work", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    await driver.boardCommand(
      "task",
      "edit",
      "TASK-1",
      "--status",
      "Done",
      "--ac",
      "Observed",
      "--check-ac",
      "1",
    );
    const completed = await driver.run("step", "TASK-1");
    await driver.boardCommand("task", "edit", "TASK-1", "--uncheck-ac", "1");
    const invalidated = await driver.run("step", "TASK-1");
    await driver.boardCommand("task", "edit", "TASK-1", "--check-ac", "1", "--assignee", "@human");
    const before = await driver.boardBytes();

    const refused = await driver.run("step", "TASK-1");
    const state = await completionState(driver);

    expect([completed.code, invalidated.code, refused.code]).toEqual([0, 1, 1]);
    expect(state.completed).toBe(false);
    expect(await driver.boardBytes()).toBe(before);
    expect(refused.calls).toEqual(["/build TASK-1"]);
  });

  describe("when required items remain unchecked", () => {
    test.each([
      {
        name: "acceptance criterion before release",
        add: "--ac",
        check: "--check-ac",
        uncheck: "--uncheck-ac",
        fault: "refusal",
        released: false,
      },
      {
        name: "definition-of-done item before release",
        add: "--dod",
        check: "--check-dod",
        uncheck: "--uncheck-dod",
        fault: "refusal",
        released: false,
      },
      {
        name: "acceptance criterion after journal persistence",
        add: "--ac",
        check: "--check-ac",
        uncheck: "--uncheck-ac",
        fault: "receipt",
        released: true,
      },
      {
        name: "definition-of-done item after journal persistence",
        add: "--dod",
        check: "--check-dod",
        uncheck: "--uncheck-dod",
        fault: "receipt",
        released: true,
      },
    ] as const)(
      "revalidates a pending release with an unchecked $name",
      async ({ add, check, uncheck, fault, released }) => {
        const driver = await harness.seedReal({ failedResult: true });
        await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
        await driver.boardCommand(
          "task",
          "edit",
          "TASK-1",
          "--status",
          "Done",
          add,
          "Observed requirement",
          check,
          "1",
        );
        const restore = await driver.failOwnershipWrite(fault);
        const failed = await driver.run("step", "TASK-1");
        await restore();
        await driver.boardCommand("task", "edit", "TASK-1", uncheck, "1");

        const refused = await driver.run("step", "TASK-1");
        const state = await completionState(driver);
        await driver.boardCommand("task", "edit", "TASK-1", check, "1");
        const retried = await driver.run("step", "TASK-1");
        const after = await completionState(driver);

        expect(failed.code).toBe(1);
        expect(refused.code).toBe(1);
        expect(state.completed).toBe(false);
        expect(state.runClaim).toBeDefined();
        expect(Boolean(state.runClaim?.releasedAt)).toBe(released);
        expect(retried.code).toBe(0);
        expect(after).toMatchObject({ id: state.id, completed: true, attempts: state.attempts });
        expect(after.runClaim?.releasedAt).toBeString();
        expect(refused.calls).toEqual(["/build TASK-1"]);
        expect(retried.calls).toEqual(refused.calls);
      },
    );

    test.each([
      { name: "an acceptance criterion", options: ["--ac", "An observed behavior"] },
      { name: "a definition-of-done item", options: ["--dod", "Independent review"] },
      {
        name: "one of two acceptance criteria",
        options: ["--ac", "Observed", "--ac", "Not observed", "--check-ac", "1"],
      },
      {
        name: "the definition of done after acceptance criteria are checked",
        options: ["--ac", "Observed", "--check-ac", "1", "--dod", "Independent review"],
      },
      {
        name: "an acceptance criterion with a similar partial label",
        options: ["--ac", "Not observed", "--add-label", "partially-reviewed"],
      },
    ])("refuses Done with $name", async ({ options }) => {
      const driver = await harness.seedReal({ status: "Done" });
      await driver.boardCommand("task", "edit", "TASK-1", ...options);

      const result = await driver.run("step", "TASK-1");
      const status = await completionState(driver);

      expect(result.code).toBe(1);
      expect(status).toMatchObject({ completed: false, attempts: [] });
      expect(result.calls).toEqual([]);
    });

    test("still refuses dirty explicitly partial work", async () => {
      const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
      await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
      await driver.boardCommand(
        "task",
        "edit",
        "TASK-1",
        "--status",
        "Done",
        "--ac",
        "Unfinished",
        "--add-label",
        "partial",
      );

      const result = await driver.run("step", "TASK-1");
      const state = await completionState(driver);

      expect(result.code).toBe(1);
      expect(state.completed).toBe(false);
      expect(state.runClaim).toBeDefined();
      expect(state.runClaim?.releasedAt).toBeUndefined();
      expect(result.calls).toEqual(["/build TASK-1"]);
    });

    test("still refuses an unfinished attempt on explicitly abandoned work", async () => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
      await driver.boardCommand(
        "task",
        "edit",
        "TASK-1",
        "--status",
        "Done",
        "--add-label",
        "abandoned",
      );
      await driver.interruptRecordedAttempt("TASK-1");

      const result = await driver.run("step", "TASK-1");
      const state = await completionState(driver);

      expect(result.code).toBe(1);
      expect(state.completed).toBe(false);
      expect(state.runClaim).toBeDefined();
      expect(state.runClaim?.releasedAt).toBeUndefined();
      expect(result.calls).toEqual(["/build TASK-1"]);
    });
  });
});

const completion = z.object({
  id: z.uuid(),
  directory: z.string(),
  completed: z.boolean(),
  attempts: z.array(z.unknown()),
  runClaim: z.object({ releasedAt: z.string().optional() }).optional(),
});

async function completionState(driver: Awaited<ReturnType<WorkflowHarness["seedReal"]>>) {
  const result = await driver.run("status", "TASK-1");
  if (result.code !== 0) throw new Error(`reading completion state failed: ${result.stderr}`);

  return completion.parse(JSON.parse(result.stdout));
}
