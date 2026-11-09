import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { file } from "bun";
import { WorkflowHarness } from "./testing/workflow-harness.ts";

const pinned = ["--model", "sonnet", "--effort", "high"];
const supervised = [
  "--default-provider",
  "claude",
  "--default-model",
  "sonnet",
  "--default-effort",
  "high",
];
const replacement = [
  "--default-provider",
  "claude",
  "--default-model",
  "opus",
  "--default-effort",
  "high",
];

describe("real board run ownership", () => {
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

  test("an intervening human before acquisition remains held", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.scheduleHumanEdit("before-acquire");

    const result = await driver.run("step", "TASK-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(0);
    expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual(["@human"]);
    expect(JSON.parse((await driver.run("status", "TASK-1")).stdout).runClaim).toBeUndefined();
    expect(await driver.humanEditResult()).toMatchObject({
      code: 0,
      assignees: ["@human"],
      phase: "before-acquire",
      markerHeld: false,
    });
  }, 20_000);

  test("a newer human assignment before Done release remains held and incomplete", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");
    await driver.scheduleHumanEdit("before-release");

    const result = await driver.run("step", "TASK-1");
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual(["@human"]);
    expect(record.completed).toBe(false);
    expect(record.runClaim.releasedAt).toBeUndefined();
    expect(await driver.humanEditResult()).toMatchObject({
      code: 0,
      assignees: ["@human"],
      phase: "before-release",
      markerHeld: false,
    });
  }, 20_000);

  test.each([false, true, "paused"] as const)(
    "the real native gate excludes ordinary human writes, aged=%s",
    async (age) => {
      const driver = await harness.seedReal({ failedResult: true });

      const result = await driver.nativeGateScenario(age);

      expect(result.heldEdit).toBe(1);
      expect(result.markerPreserved).toBe(true);
      expect(result.runner.calls).toHaveLength(age === "paused" ? 0 : 1);
      expect(await driver.nativeMarker()).toBeUndefined();
      await driver.boardCommand("task", "edit", "TASK-1", "--assignee", "@human");
      expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual(["@human"]);
    },
    20_000,
  );

  test.each(["refusal", "lost-ack", "history", "active", "journal", "receipt", "pending"] as const)(
    "the same run reconciles acquisition after a restored %s fault",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
      const restore = await driver.failOwnershipWrite(kind);

      const failed = await driver.run("step", "TASK-1", ...pinned);
      await restore();
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const retried = await driver.run("step", "TASK-1", ...pinned);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(failed.code).toBe(1);
      expect(failed.calls).toHaveLength(0);
      expect(retried.calls).toHaveLength(1);
      expect(after.id).toBe(before.id);
      expect(after.limits).toEqual(before.limits);
      expect(after.attempts).toHaveLength(1);
      expect(after.runClaim.run).toBe(before.id);
      expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual([
        after.runClaim.assignee,
      ]);
    },
    20_000,
  );

  test.each(["refusal", "lost-ack", "history", "active", "journal", "receipt", "pending"] as const)(
    "the same run reconciles Done after a restored %s fault",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
      await driver.run("step", "TASK-1", ...pinned);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");
      const restore = await driver.failOwnershipWrite(kind);

      const failed = await driver.run("step", "TASK-1");
      await restore();
      const retried = await driver.run("step", "TASK-1");
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(failed.code).toBe(1);
      expect(retried.code).toBe(0);
      expect(retried.calls).toHaveLength(1);
      expect(after.id).toBe(before.id);
      expect(after.limits).toEqual(before.limits);
      expect(after.attempts).toEqual(before.attempts);
      expect(after.completed).toBe(true);
      expect(after.runClaim.releasedAt).toBeString();
      expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual([]);
    },
    20_000,
  );

  test.each(["acquire", "release"] as const)(
    "pending %s rechecks dirty-work authority before any replay write",
    async (operation) => {
      const driver = await harness.seedReal({ failedResult: true });
      const failed = await driver.interruptOwnershipTransition(operation, pinned);
      const dirty = join(driver.repo, "unrelated.txt");
      await writeFile(dirty, "new unrelated work after the interrupted transition");
      const pending = join(driver.repo, "backlog", ".iterate", "TASK-1.pending.json");
      const beforePending = await readFile(pending, "utf8");
      const beforeCard = await driver.boardBytes();
      const beforeJournal = await driver.journalBytes("TASK-1");

      const refused = await driver.run("step", "TASK-1", ...pinned);

      expect(failed.code).toBe(1);
      expect(refused.code).toBe(1);
      expect(refused.calls).toHaveLength(operation === "acquire" ? 0 : 1);
      expect(await driver.boardBytes()).toBe(beforeCard);
      expect(await driver.journalBytes("TASK-1")).toBe(beforeJournal);
      expect(await readFile(pending, "utf8")).toBe(beforePending);
      expect(await readFile(dirty, "utf8")).toBe(
        "new unrelated work after the interrupted transition",
      );
    },
    20_000,
  );

  test("pending Shape advancement rechecks current criteria before replay", async () => {
    const driver = await harness.seedReal({ status: "Shape" });
    await driver.boardCommand("task", "edit", "TASK-1", "--ac", "accepted criterion");
    await driver.failOwnershipWrite("refusal", "--status");
    const failed = await driver.run("step", "TASK-1", ...pinned);
    await driver.boardCommand("task", "edit", "TASK-1", "--remove-ac", "1");
    const pending = join(driver.repo, "backlog", ".iterate", "TASK-1.pending.json");
    const beforePending = await readFile(pending, "utf8");
    const beforeCard = await driver.boardBytes();
    const beforeJournal = await driver.journalBytes("TASK-1");

    const refused = await driver.run("step", "TASK-1", ...pinned);

    expect(failed.code).toBe(1);
    expect(refused.code).toBe(1);
    expect(refused.calls).toHaveLength(1);
    expect(await driver.boardBytes()).toBe(beforeCard);
    expect(await driver.journalBytes("TASK-1")).toBe(beforeJournal);
    expect(await readFile(pending, "utf8")).toBe(beforePending);
    expect(JSON.parse(await driver.boardSnapshot()).task.status).toBe("Shape");
  }, 20_000);

  test("an observed exited owner does not authorize automatic lock removal", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    const card = await driver.boardBytes();
    const journal = await driver.journalBytes("TASK-1");
    const lock = await driver.holdDeadOwnerLock();
    const other = await driver.independentTree();

    const same = await driver.run("step", "TASK-1", ...pinned);
    const foreign = await harness.run(other, driver.env, ["step", "TASK-1", ...pinned]);

    expect(same.calls).toHaveLength(1);
    expect(same.code).toBe(1);
    expect(foreign.code).toBe(1);
    expect(await driver.lockBytes()).toBe(lock);
    expect(await driver.boardBytes()).toBe(card);
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
  }, 20_000);

  test("nested cwd and a symlinked configured board share canonical ownership", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    const nested = await driver.useNestedConfiguredBoard();

    const result = await harness.run(nested, driver.env, ["step", "TASK-1", ...pinned]);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(result.code).toBe(1);
    expect(record.attempts).toHaveLength(1);
    expect(record.runClaim.board).toContain("iterate-p4-fixture");
    expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual([
      record.runClaim.assignee,
    ]);
  }, 20_000);

  test.each(["nearer", "configured"] as const)(
    "an unreadable %s board refuses without adopting ancestor authority",
    async (location) => {
      const driver = await harness.seedReal({ failedResult: true });
      const nested = await driver.useUnreadableNearestBoard(location);
      const before = await driver.boardBytes();

      const result = await harness.run(nested, driver.env, ["step", "TASK-1", ...pinned]);
      const status = await driver.run("status", "TASK-1");

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("ELOOP");
      expect(result.stderr).toContain("discovering the Backlog board");
      expect(result.stderr).not.toMatch(/(^|\n)\s+at\s.+:\d+/);
      expect(status.calls).toHaveLength(0);
      expect(await driver.boardBytes()).toBe(before);
      expect(await driver.journalBytes("TASK-1")).toBeUndefined();
    },
    20_000,
  );

  test("an unsupported native-lock backend refuses without card ownership", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    const before = await driver.boardBytes();
    await driver.unsupportedBoardVersion();

    const result = await driver.run("step", "TASK-1", ...pinned);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(0);
    expect(result.stderr).toContain("unsupported Backlog native lock protocol");
    expect(await driver.boardBytes()).toBe(before);
  }, 20_000);

  test("a stalled CLI and its descendants terminate within the bound before retry", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.failOwnershipWrite("descendants");

    const failed = await driver.run("step", "TASK-1", ...pinned);
    const retried = await driver.run("step", "TASK-1", ...pinned);

    expect(failed.code).toBe(1);
    expect(failed.stderr).toContain("deadline exceeded");
    expect(failed.calls).toHaveLength(0);
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(retried.calls).toHaveLength(1);
    expect((await driver.cliProcesses()).every((entry) => !entry.running)).toBe(true);
  }, 20_000);

  test("an abrupt transaction-owner exit retains both exclusion records", async () => {
    const driver = await harness.seedReal({ failedResult: true });

    const crashed = await driver.crashNativeTransaction();
    const refused = await driver.run("step", "TASK-1", ...pinned);
    const recovery = await driver.recoverTransaction();

    expect(recovery.code).toBe(1);
    expect(recovery.stderr).toContain("child lifecycle remains uncertain");
    expect(crashed.result.calls).toHaveLength(0);
    expect(refused.code).toBe(1);
    expect(refused.calls).toHaveLength(0);
    expect(await driver.nativeMarker()).toBe(crashed.marker);
    expect(await driver.lockBytes()).toBe(crashed.lock);
  }, 20_000);

  test("typed exact-intent recovery preserves intent then reconciles the same run", async () => {
    const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
    await driver.failOwnershipWrite("history");
    await driver.run("step", "TASK-1", ...pinned);
    await driver.restoreOwnershipWrite();
    await driver.retainSettledTransition();
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const marker = (await driver.nativeMarker()) ?? "";
    const retained = await driver.recoveryArtifacts(marker);

    const wrong = await driver.recoverTransaction(true);
    expect(wrong.code).toBe(1);
    expect(await driver.nativeMarker()).toBe(marker);
    const recovered = await driver.recoverTransaction();
    const retry = await driver.run("step", "TASK-1", ...pinned);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(recovered.code).toBe(0);
    const artifacts = await driver.recoveryArtifacts(marker);
    expect(artifacts.intent).toBe(retained.intent);
    expect(artifacts.audits).toEqual([
      expect.objectContaining({
        run: before.id,
        token: JSON.parse(marker).token,
        evidence:
          "Operator inspected this exact fixture run and retained intent, confirmed its settled child receipts and authorizes recovery",
        marker,
      }),
    ]);
    expect(artifacts.completions).toEqual([
      expect.objectContaining({ run: before.id, token: JSON.parse(marker).token }),
    ]);
    expect(recovered.calls).toHaveLength(0);
    expect(retry.calls).toHaveLength(1);
    expect(after.id).toBe(before.id);
    expect(after.limits).toEqual(before.limits);
    expect(after.attempts).toHaveLength(1);
  }, 20_000);

  test("native-only recovery refuses a same-bytes replacement lock before its first audit", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.failOwnershipWrite("history");
    await driver.run("step", "TASK-1", ...pinned);
    await driver.restoreOwnershipWrite();
    await driver.retainSettledTransition();
    const marker = await driver.nativeMarker();
    const replacement = await driver.replaceBoardLockWithIdenticalBytes();
    const journal = await driver.journalBytes("TASK-1");

    const refused = await driver.recoverTransaction();

    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("recovery lock changed");
    expect(await driver.lockBytes()).toBe(replacement);
    expect(await driver.nativeMarker()).toBe(marker);
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
  }, 20_000);

  test("an existing ordinary native directory lock is never replaced", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    const path = await driver.holdNativeLock();
    const before = await driver.boardBytes();

    const result = await driver.run("step", "TASK-1", ...pinned);

    expect(result.calls).toHaveLength(0);
    expect(result.code).toBe(1);
    expect(await readFile(join(path, "fixture-owner"), "utf8")).toBe(
      "ordinary native lock must not be removed",
    );
    expect(await driver.boardBytes()).toBe(before);
  }, 20_000);

  test("Done releases only while the real native gate excludes human edits", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");

    const result = await driver.nativeGateScenario(false, true);

    expect(result.heldEdit).toBe(1);
    expect(result.markerPreserved).toBe(true);
    expect(result.runner.code).toBe(0);
    expect(result.runner.calls).toHaveLength(1);
    expect(JSON.parse((await driver.run("status", "TASK-1")).stdout).completed).toBe(true);
  }, 20_000);

  test("an unbound same-card native gate refuses before launching a board edit", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    const before = await driver.boardBytes();

    const refusal = await driver.unboundNativeEdit();

    expect(refusal.code).toBe(1);
    expect(refusal.afterCommands).toEqual(refusal.beforeCommands);
    expect(refusal.after).toBe(refusal.before);
    expect(await driver.boardBytes()).toBe(before);
  }, 20_000);

  test("native delegation stays confined to same-card mutations and never enters the stage", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
    await driver.captureBoardEnvironment();
    await driver.run("step", "TASK-1", ...pinned);
    driver.env.FAKE_FINISH_WORK = join(driver.directory, "inspection");

    const result = await driver.run("step", "TASK-1", ...pinned);
    const observed = await driver.boardEnvironment();
    const delegated = observed.filter((entry) => entry.bypass !== null);

    expect(result.calls).toHaveLength(2);
    expect(delegated).toHaveLength(1);
    expect(delegated[0]).toMatchObject({
      args: ["task", "edit", "TASK-1", "--assignee", expect.any(String)],
      bypass: "false",
    });
    expect(observed.some((entry) => entry.args.includes("Review") && entry.bypass === null)).toBe(
      true,
    );
    expect(
      observed
        .filter((entry) => entry.args.includes("view") || entry.args.includes("--version"))
        .every((entry) => entry.bypass === null),
    ).toBe(true);
    expect(await driver.providerBypass()).toBe("unset\nunset\n");
  }, 20_000);

  test("a human assignment before automatic status advancement is preserved", async () => {
    const driver = await harness.seedReal({ status: "Shape" });
    await driver.boardCommand("task", "edit", "TASK-1", "--ac", "bounded fixture criterion");
    await driver.scheduleHumanEdit("after-stage");

    const result = await driver.run("step", "TASK-1", ...pinned);
    const after = JSON.parse(await driver.boardSnapshot());

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(after.task.assignees).toEqual(["@human"]);
    expect(after.task.status).toBe("Shape");
    expect(await driver.humanEditResult()).toMatchObject({
      code: 0,
      assignees: ["@human"],
      phase: "after-stage",
      markerHeld: false,
    });
  }, 20_000);

  test("a successful human reassignment during provider preflight admits no new attempt", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    const before = await driver.journalBytes("TASK-1");
    await driver.editDuringPreflight(["--assignee", "@human,@foreign"]);

    const refused = await driver.run("step", "TASK-1", ...replacement);

    expect(
      JSON.parse(await readFile(join(driver.directory, "preflight-edit.json"), "utf8")).code,
    ).toBe(0);
    expect(refused.code).toBe(1);
    expect(refused.calls).toHaveLength(1);
    expect(await driver.journalBytes("TASK-1")).toBe(before);
    expect(JSON.parse(await driver.boardSnapshot()).task.assignees).toEqual(["@human", "@foreign"]);
  }, 20_000);

  test.each([
    ["--status", "Review"],
    ["--label", "deferred"],
    ["--label", "investigate:debug"],
  ])(
    "latest native admission refuses a preflight card change %s %s",
    async (flag, value) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.run("step", "TASK-1", ...pinned);
      const before = await driver.journalBytes("TASK-1");
      await driver.editDuringPreflight([flag, value]);

      const refused = await driver.run("step", "TASK-1", ...replacement);

      expect(
        JSON.parse(await readFile(join(driver.directory, "preflight-edit.json"), "utf8")).code,
      ).toBe(0);
      expect(refused.code).toBe(1);
      expect(refused.calls).toHaveLength(1);
      expect(await driver.journalBytes("TASK-1")).toBe(before);
    },
    20_000,
  );

  test.each(["stop", "dirty", "allowance"] as const)(
    "latest native admission refuses a preflight %s change",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.run("step", "TASK-1", ...pinned);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      await driver.fileChangeDuringPreflight(kind);

      const refused = await driver.run("step", "TASK-1", ...replacement);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(refused.code).toBe(kind === "stop" ? 3 : 1);
      expect(refused.calls).toHaveLength(1);
      expect(after.attempts).toEqual(before.attempts);
      expect(after.selectionHistory).toEqual(before.selectionHistory);
      expect(after.runClaim).toEqual(before.runClaim);
    },
    20_000,
  );

  test("round-trips the UUID assignee through the real backlog CLI", async () => {
    const driver = await harness.seedReal({ failedResult: true });

    const result = await driver.run("step", "TASK-1", ...pinned);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const snapshot = JSON.parse(await driver.boardSnapshot());

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(snapshot.task.assignees).toEqual([`@iterate-${record.id}`]);
    expect(record.runClaim).toMatchObject({
      run: record.id,
      card: "TASK-1",
      journal: record.directory,
    });
  }, 20_000);

  test("Codex Build and Claude Review identities resolve to the same run claim", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);

    const build = JSON.parse(await driver.ownershipBoundary("codex", "build"));
    const review = JSON.parse(await driver.ownershipBoundary("claude", "review"));

    expect(build.selection.provider).toBe("codex");
    expect(review.selection.provider).toBe("claude");
    expect(build.claim).toEqual(review.claim);
  }, 20_000);

  test("two independent Git directories sharing a canonical board dispatch exactly one child", async () => {
    const driver = await harness.seedReal({ failedResult: true });

    const result = await driver.raceInitialClaims();

    expect(result.claimBefore).toBe(false);

    expect(result.loser.code).toBe(1);
    expect(result.loserJournal).toBe(false);
    expect(result.winner.calls).toHaveLength(1);
  }, 20_000);

  test("two concurrent dispatches of one run admit only one new attempt", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);

    const result = await driver.raceDispatches(true);
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(result.loser.code).toBe(1);
    expect(result.winner.calls).toHaveLength(2);
    expect(record.attempts).toHaveLength(2);
  }, 20_000);

  test("another run using the same provider cannot adopt an active claim", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    const other = await driver.independentTree();
    const before = await driver.boardBytes();

    const refused = await harness.run(other, driver.env, ["step", "TASK-1", ...pinned]);

    expect(refused.code).toBe(1);
    expect(await driver.boardBytes()).toBe(before);
    expect(await file(join(other, ".git", "iterate", "current.json")).exists()).toBe(false);
  }, 20_000);

  test("Done refuses dirty work without a child and completes cleanly with no budget left", async () => {
    const driver = await harness.seedReal({
      failedResult: true,
      leaves: "build",
      runBudget: "0.1",
    });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");

    const dirty = await driver.run("step", "TASK-1");
    await driver.clearWork();
    const clean = await driver.run("step", "TASK-1");
    const completed = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(dirty.code).toBe(1);
    expect(dirty.calls).toHaveLength(1);
    expect(clean.code).toBe(0);
    expect(clean.calls).toHaveLength(1);
    expect(completed.completed).toBe(true);
    expect(completed.runClaim.releasedAt).toBeString();
  }, 20_000);

  test("a reopened completed cycle receives a fresh claim and retains the old evidence", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Done");
    await driver.run("step", "TASK-1");
    const previous = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const oldBytes = await readFile(join(previous.directory, "run.json"), "utf8");
    await driver.boardCommand("task", "edit", "TASK-1", "--status", "Build");

    await driver.run("step", "TASK-1", ...pinned);
    const current = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(current.id).not.toBe(previous.id);
    expect(current.runClaim.assignee).not.toBe(previous.runClaim.assignee);
    expect(await readFile(join(previous.directory, "run.json"), "utf8")).toBe(oldBytes);
    expect(
      JSON.parse(
        await readFile(
          join(driver.repo, "backlog", ".iterate", `TASK-1.${previous.id}.json`),
          "utf8",
        ),
      ),
    ).toEqual(previous.runClaim);
  }, 20_000);

  test.each(["@human", "@codex", "@claude", "@human,@foreign"])(
    "refuses %s without changing the original card bytes",
    async (assignee) => {
      const driver = await harness.seedReal({ assignee });
      const before = await driver.boardBytes();

      const result = await driver.run("step", "TASK-1", ...pinned);

      expect(result.code).toBe(1);
      expect(result.calls).toEqual([]);
      expect(await driver.boardBytes()).toBe(before);
      expect(await driver.journalBytes("TASK-1")).toBeUndefined();
    },
    20_000,
  );

  test.each([
    { mode: "supervised reselection", initial: supervised },
    { mode: "direct to supervised", initial: pinned },
  ])(
    "preserves dirty attribution limits history and claim through $mode",
    async ({ initial }) => {
      const driver = await harness.seedReal({
        failedResult: true,
        leaves: "build",
        runBudget: "10",
        runMinutes: "10",
      });
      await driver.run("step", "TASK-1", ...initial);
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      await driver.addUnrelatedWork();

      const result = await driver.run("step", "TASK-1", ...replacement);
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(result.code).toBe(1);
      expect(result.calls).toHaveLength(2);
      expect(after.id).toBe(before.id);
      expect(after.runClaim).toEqual(before.runClaim);
      expect(after.limits).toEqual(before.limits);
      expect(after.attempts[0]).toEqual(before.attempts[0]);
      expect(after.attempts).toHaveLength(2);
      expect(after.attempts[1].requestedAgent.model).toBe("opus");
      expect(after.attempts[1].resolvedModel).toBe("opus");
      const argv = (await driver.providerArguments())[1] ?? [];
      expect(argv).toContain("--model=opus");
      expect(await driver.providerBypass()).toBe("unset\nunset\n");
      expect(after.selectionHistory.at(-1)).toMatchObject({ next: after.supervisedPlan });
      expect(after.selectionHistory.at(-1).previous).toEqual(before.supervisedPlan);
      expect(result.systems[1]).toContain("uncommitted changes");
      expect(await readFile(join(driver.repo, "unrelated"), "utf8")).toBe("preserve this edit");
      expect(await readFile(join(driver.repo, "left-behind"), "utf8")).toBe("left\n");
    },
    20_000,
  );

  test("a held board execution lock blocks reselection without state mutation", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
    await driver.run("step", "TASK-1", ...supervised);
    const before = await driver.journalBytes("TASK-1");
    const card = await driver.boardBytes();
    await driver.holdBoardLock();
    const targets = await driver.targetViews();

    const result = await driver.run("step", "TASK-1", ...replacement);

    expect(result.code).toBe(1);
    expect(result.calls).toHaveLength(1);
    expect(await driver.journalBytes("TASK-1")).toBe(before);
    expect(await driver.boardBytes()).toBe(card);
    expect(await driver.targetViews()).toEqual(targets);
  }, 20_000);

  test.each(["", "@foreign"])(
    "dirty work without authority refuses dispatch for %s",
    async (assignee) => {
      const driver = await harness.seedReal({ assignee, dirty: true });
      const before = await driver.boardBytes();

      const result = await driver.run("step", "TASK-1", ...pinned);

      expect(result.code).toBe(1);
      expect(result.calls).toHaveLength(0);
      expect(await driver.boardBytes()).toBe(before);
      expect(await file(join(driver.repo, "untracked")).exists()).toBe(true);
    },
    20_000,
  );

  test("the matching run inspects and finishes card work while preserving an unrelated edit", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.addUnrelatedWork();
    const inspection = join(driver.directory, "inspected-card-work");
    driver.env.FAKE_FINISH_WORK = inspection;

    const result = await driver.run("step", "TASK-1", ...pinned);

    expect(result.calls).toHaveLength(2);
    expect(await readFile(inspection, "utf8")).toBe("left\n");
    expect(await file(join(driver.repo, "left-behind")).exists()).toBe(false);
    expect(await readFile(join(driver.repo, "unrelated"), "utf8")).toBe("preserve this edit");
    expect(JSON.parse(await driver.boardSnapshot()).task.status).toBe("Review");
  }, 20_000);

  test("the first bound native read initializes only its private config under both locks", async () => {
    const driver = await harness.seedReal({ status: "Build", failedResult: true });

    const result = await driver.configInitialization("initialize");

    expect(result.result.code).toBe(1);
    expect(result.result.calls).toHaveLength(1);
    expect(result.original).toBe(result.source);
    expect(result.observed.before.task).toBe(result.observed.nativeAfter.task);
    expect(result.observed.before.folderConfig).toBe(result.observed.nativeAfter.folderConfig);
    expect(result.observed.before.source).toBe(result.observed.nativeAfter.source);
    expect(result.observed.before.configIdentity.ino).toBe(
      result.observed.nativeAfter.configIdentity.ino,
    );
    expect(result.observed.bypass).toBeNull();
    expect(result.observed.claimPresent).toBe(false);
    expect(result.observed.calls).toBe("");
    expect(JSON.parse(result.observed.boardLock).pid).toBe(Number(result.observed.treeLock));
    expect(result.targets[0]?.record.initialization?.added).toEqual({
      labels: "[]",
      max_column_width: "80",
      default_port: "6420",
      active_branch_days: "30",
      task_prefix: "task",
    });
    expect(result.targets[0]).toMatchObject({ viewExists: false, record: { state: "cleaned" } });
  }, 20_000);

  test.each([
    "unknown-addition",
    "wrong-default",
    "changed-field",
    "missing-trigger",
    "later-drift",
  ] as const)(
    "refuses %s private configuration changes without claim or stage mutation",
    async (kind) => {
      const driver = await harness.seedReal({ status: "Build", failedResult: true });

      const result = await driver.configInitialization(kind);

      expect(result.result.code).toBe(1);
      expect(result.result.calls).toHaveLength(0);
      expect(result.original).toBe(result.source);
      expect(result.taskBytes).toBe(result.observed.before.task);
      expect(result.targets[0]).toMatchObject({ viewExists: true, record: { state: "retained" } });
      expect(result.observed.claimPresent).toBe(false);
    },
    20_000,
  );

  test.each(["control", "symlink", "config", "ambient"] as const)(
    "binds the actual runner to one board under %s routing",
    async (kind) => {
      const driver = await harness.seedReal({ status: "Build", failedResult: true });

      const result = await driver.boardTargetRoute(kind);

      expect(result).toBeDefined();
      expect(result?.run.code).toBe(1);
      expect(result?.contender.exit).toBe(1);
      expect(result?.lockWhileHeld).toEqual(result?.originalLock);
      expect(result?.B.task.assignees).toEqual([]);
      expect(result?.target).toMatchObject({
        board: kind === "ambient" ? result.boardB : result?.boardA,
        state: "cleaned",
      });
      expect(result?.run.calls).toHaveLength(kind === "control" ? 1 : 0);
      expect(result?.A.task.assignees).toHaveLength(kind === "control" ? 1 : 0);
    },
    20_000,
  );

  test.each(["reader-setup", "reader-setup-locked"] as const)(
    "%s after spawn retains the actual bounded stage owner",
    async (kind) => {
      const driver = await harness.seedReal({ status: "Build", failedResult: true });
      await driver.stagePersistenceFault(kind);

      const failed = await driver.run("step", "TASK-1", ...pinned);
      const receipt = await driver.stageReceipt();
      const report = JSON.parse(await readFile(receipt.value.reportPath ?? "", "utf8"));
      const observation = JSON.parse(
        await readFile(join(driver.directory, "stage-created.json"), "utf8"),
      );

      expect(failed.code).toBe(1);
      expect(receipt.value.identity?.pid).toBeGreaterThan(0);
      expect(receipt.value.state).not.toBe("not-started");
      expect(report.errors.join(" ")).toContain("output reader acquisition failure");
      expect(report.accountingComplete).toBe(false);
      expect(report.settlement.pid).toBe(receipt.value.identity?.pid);
      expect(
        observation.table.some((row: { pid: number }) => row.pid === receipt.value.identity?.pid),
      ).toBe(true);
    },
    20_000,
  );

  test("unresolved output keeps the exact private board view through refused recovery", async () => {
    const driver = await harness.seedReal({ status: "Build", failedResult: true });
    await driver.stagePersistenceFault("output");
    await driver.run("step", "TASK-1", ...pinned);
    delete driver.env.FAKE_RUNNER_FAULT;
    const before = await driver.targetViews();

    const recovery = await driver.recoverStage();
    const after = await driver.targetViews();

    expect(recovery.code).toBe(1);
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ viewExists: true, record: { state: "retained" } });
    expect(before[0]?.config).toBe(before[0]?.record.configBytes);
    expect(before[0]?.link).toBe(before[0]?.record.board);
    expect(after).toEqual(before);
  }, 20_000);

  test("actual stage creation and durable identity precede native handoff and normal board edits", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.stagePersistenceFault("observe");
    driver.env.USE_GLOBAL_TASK_ID_LOCK = "false";
    driver.env.FAKE_FINISH_WORK = join(driver.directory, "handoff-work");

    const result = await driver.run("step", "TASK-1", ...pinned);
    const created = JSON.parse(
      await readFile(join(driver.directory, "stage-created.json"), "utf8"),
    );
    const handoff = JSON.parse(
      await readFile(join(driver.directory, "stage-handoff.json"), "utf8"),
    );

    expect(result.calls).toHaveLength(2);
    expect(created.markerBeforeInspection).toBe(created.markerAfterInspection);
    expect(handoff.marker).toEqual(JSON.parse(created.markerBeforeInspection));
    expect(handoff.receipt.state).toBe("running");
    expect(
      created.snapshot
        .split("\n")
        .some((row: string) => row.trim().split(/\s+/)[0] === String(handoff.receipt.identity.pid)),
    ).toBe(true);
    expect(
      created.table.some((row: { pid: number }) => row.pid === handoff.receipt.identity.pid),
    ).toBe(true);
    expect(created.independent.exit).toBe(0);
    expect(
      created.independent.stdout
        .split("\n")
        .some((row: string) => row.trim().split(/\s+/)[0] === String(handoff.receipt.identity.pid)),
    ).toBe(true);
    expect(handoff.receipt.identity.processGroupId).toBe(handoff.receipt.identity.pid);
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(await driver.providerBypass()).toBe("unset\nunset\n");
    expect(JSON.parse(await driver.boardSnapshot()).task.status).toBe("Review");
    expect(await readFile(join(driver.directory, "handoff-work"), "utf8")).toBe("left\n");
  }, 20_000);

  test("an actual uncertain CLI retains both locks and excludes another card in the tree", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.boardCommand(
      "task",
      "create",
      "Second fixture card",
      "--status",
      "Build",
      "--no-dod-defaults",
    );
    await driver.stagePersistenceFault("cli-inspection");

    const failed = await driver.run("step", "TASK-1", ...pinned);
    const lock = await driver.lockBytes();
    const treeLock = await readFile(join(driver.repo, ".git", "iterate", "lock"), "utf8");
    delete driver.env.FAKE_RUNNER_FAULT;
    const otherCard = await driver.run("step", "TASK-2", ...replacement);
    const otherTree = await driver.independentTree();
    const sameCard = await harness.run(otherTree, driver.env, ["step", "TASK-1", ...pinned]);
    const recovered = await driver.recoverTransaction();

    expect(failed.code).toBe(1);
    expect(failed.calls).toHaveLength(0);
    expect(failed.stderr).toContain("CLI settlement remains uncertain");
    expect(lock).toContain(treeLock);
    expect(otherCard.code).toBe(1);
    expect(otherCard.calls).toHaveLength(0);
    expect(sameCard.code).toBe(1);
    expect(await driver.journalBytes("TASK-2")).toBeUndefined();
    expect(await driver.lockBytes()).toBe(lock);
    expect(await readFile(join(driver.repo, ".git", "iterate", "lock"), "utf8")).toBe(treeLock);
    expect(recovered.code).toBe(1);
    expect(recovered.stderr).toContain("child lifecycle remains uncertain");
  }, 20_000);

  test("recovery inspects a runner CLI that becomes uncertain after stage handoff", async () => {
    const driver = await harness.seedReal({ status: "Build" });
    await driver.stagePersistenceFault("post-stage-cli");

    const failed = await driver.run("step", "TASK-1", ...pinned);
    delete driver.env.FAKE_RUNNER_FAULT;
    const journal = await driver.journalBytes("TASK-1");
    const lock = await driver.lockBytes();
    const target = (await driver.retainedTarget()).target;
    const viewBefore = await driver.targetSnapshot(target);
    const recovery = await driver.recoverStage();

    expect(failed.code).toBe(1);
    expect(failed.calls).toHaveLength(1);
    expect(recovery.code).toBe(1);
    expect(recovery.stderr).toContain("child lifecycle remains uncertain");
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
    expect(await driver.lockBytes()).toBe(lock);
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
  }, 20_000);

  test("an earlier same-owner intent cannot overlook later uncertain CLI work", async () => {
    const driver = await harness.seedReal({ status: "Build" });
    await driver.stagePersistenceFault("post-stage-cli");
    await driver.run("step", "TASK-1", ...pinned);
    delete driver.env.FAKE_RUNNER_FAULT;
    const journal = await driver.journalBytes("TASK-1");
    const lock = await driver.lockBytes();

    const target = (await driver.retainedTarget()).target;
    const viewBefore = await driver.targetSnapshot(target);
    const recovery = await driver.recoverEarlierNativeIntent();

    expect(recovery.code).toBe(1);
    expect(recovery.stderr).toContain("current intent");
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
    expect(await driver.lockBytes()).toBe(lock);
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
  }, 20_000);

  test.each([
    ["foreign", false],
    ["current", true],
  ] as const)(
    "recovery isolates a malformed %s command receipt",
    async (_, current) => {
      const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
      await driver.stagePersistenceFault("terminal");
      await driver.run("step", "TASK-1", ...pinned);
      delete driver.env.FAKE_RUNNER_FAULT;
      const stage = await driver.stageReceipt();
      const before = await driver.journalBytes("TASK-1");
      const marker = current ? stage.value.token : "00000000-0000-4000-8000-000000000000";
      await writeFile(
        join(dirname(stage.path), "backlog-scope-probe.json"),
        JSON.stringify({ marker, args: [] }),
      );

      const recovery = await driver.recoverStage();

      expect(recovery.code).toBe(current ? 1 : 0);
      expect(JSON.parse((await driver.journalBytes("TASK-1")) ?? "{}").id).toBe(
        JSON.parse(before ?? "{}").id,
      );
      expect(recovery.calls).toHaveLength(1);
    },
    20_000,
  );

  test("a provider unavailable after preflight records a terminal no-child failure", async () => {
    const driver = await harness.seedReal({ status: "Build" });
    await driver.providerUnavailableAfterPreflight();

    const failed = await driver.run("step", "TASK-1", ...pinned);
    const stage = await driver.stageReceipt();
    const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(failed.code).toBe(1);
    expect(failed.calls).toHaveLength(0);
    expect(record.attempts).toHaveLength(1);
    expect(record.attempts[0].status).toBe("failed");
    expect(record.runClaim).toEqual(stage.value.claim);
    expect(stage.value.state).toBe("not-started");
    expect(stage.value.identity).toBeUndefined();
    const report = JSON.parse(await readFile(stage.value.reportPath ?? "", "utf8"));
    expect(report).toMatchObject({
      status: "failed",
      durationMs: 0,
      accountingComplete: false,
      requestedAgent: { provider: "claude", model: "sonnet", effort: "high" },
    });
    expect(report.errors.join(" ")).toContain("claude");
    expect(report.settlement).toBeUndefined();
    expect(report.cost).toBeUndefined();
    expect(await file(join(driver.repo, ".git", "iterate", "lock")).exists()).toBe(false);
    expect(await file(join(dirname(stage.path), "..", "TASK-1.lock")).exists()).toBe(false);
    expect(await driver.nativeMarker()).toBeUndefined();

    const beforeRetry = await driver.journalBytes("TASK-1");
    const retry = await driver.run("step", "TASK-1", ...pinned);

    expect(retry.calls).toHaveLength(0);
    expect(retry.stderr).toContain("dollar cap cannot be enforced");
    expect(await driver.journalBytes("TASK-1")).toBe(beforeRetry);
  }, 20_000);

  test.each(["terminal", "release"] as const)(
    "a no-child %s persistence failure retains exact recovery evidence",
    async (kind) => {
      const driver = await harness.seedReal({ status: "Build" });
      await driver.providerUnavailableAfterPreflight();
      await driver.stagePersistenceFault(kind);

      const failed = await driver.run("step", "TASK-1", ...pinned);
      const stage = await driver.stageReceipt();
      const report = await readFile(stage.value.reportPath ?? "", "utf8");
      const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const lock = await driver.lockBytes();
      delete driver.env.FAKE_RUNNER_FAULT;
      const recovery = await driver.recoverStage();
      const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

      expect(failed.code).toBe(1);
      expect(failed.calls).toHaveLength(0);
      expect(stage.value.state).toBe("not-started");
      expect(lock).toBeString();
      expect(recovery.code).toBe(0);
      expect(recovery.calls).toHaveLength(0);
      expect(after.id).toBe(before.id);
      expect(after.runClaim).toEqual(before.runClaim);
      expect(after.limits).toEqual(before.limits);
      expect(after.attempts).toHaveLength(1);
      expect(after.attempts[0].status).toBe("failed");
      expect(await readFile(stage.value.reportPath ?? "", "utf8")).toBe(report);
      expect(await file(join(driver.repo, ".git", "iterate", "lock")).exists()).toBe(false);
      expect(await file(join(dirname(stage.path), "..", "TASK-1.lock")).exists()).toBe(false);
    },
    20_000,
  );

  test("handled SIGINT records genuine failure and incomplete accounting refuses the default cap", async () => {
    const driver = await harness.seedReal({ failedResult: true });

    const interrupted = await driver.interruptStage();
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const receipt = await driver.stageReceipt();
    const report = JSON.parse(await readFile(receipt.value.reportPath ?? "", "utf8"));
    const refused = await driver.run("step", "TASK-1", ...pinned);

    expect(interrupted.code).toBe(1);
    expect(report.status).toBe("failed");
    expect(report.errors).toContain("received SIGINT");
    expect(report.accountingComplete).toBe(false);
    expect(report.settlement.state).toBe("settled");
    expect(before.attempts[0].status).toBe("failed");
    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("dollar cap cannot be enforced");
    expect(JSON.parse((await driver.run("status", "TASK-1")).stdout).attempts).toHaveLength(1);
  }, 20_000);

  test("abrupt pre-report death retains exclusion and refuses missing terminal evidence", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.interruptStage(true);
    const before = await driver.journalBytes("TASK-1");
    const boardLock = await driver.lockBytes();

    const target = (await driver.retainedTarget()).target;
    const viewBefore = await driver.targetSnapshot(target);
    const recovered = await driver.recoverStage();

    expect(recovered.code).toBe(1);
    expect(recovered.stderr).toContain("genuine normalized report");
    expect(await driver.journalBytes("TASK-1")).toBe(before);
    expect(await driver.lockBytes()).toBe(boardLock);
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
  }, 20_000);

  test("fresh process absence cannot erase a genuine reader cleanup uncertainty", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("output");
    await driver.run("step", "TASK-1", ...pinned);
    delete driver.env.FAKE_RUNNER_FAULT;
    const receipt = await driver.stageReceipt();
    const report = await readFile(receipt.value.reportPath ?? "", "utf8");
    const journal = await driver.journalBytes("TASK-1");

    const target = (await driver.retainedTarget()).target;
    const viewBefore = await driver.targetSnapshot(target);
    const recovery = await driver.recoverStage();

    expect(JSON.parse(report).settlement.state).toBe("uncertain");
    expect(report).toContain("injected native reader cancellation refusal");
    expect(recovery.code).toBe(1);
    expect(recovery.stderr).toContain("output settlement is unresolved");
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
    expect(await readFile(receipt.value.reportPath ?? "", "utf8")).toBe(report);
    expect(await driver.lockBytes()).toBeString();
    expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
  }, 20_000);

  test("partial recovery cleanup retries without charging the genuine report twice", async () => {
    const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    const stage = await driver.stageReceipt();
    const report = await readFile(stage.value.reportPath ?? "", "utf8");
    await driver.stagePersistenceFault("cleanup");

    const partial = await driver.recoverStage();
    const before = await driver.journalBytes("TASK-1");
    const completionPath =
      stage.path.slice(0, -".stage.json".length) +
      `.recovery-${stage.value.token}.json.completed.json`;
    const completionBefore = await readFile(completionPath, "utf8");
    const target = (await driver.retainedTarget()).target;
    const cleanedBefore = await driver.targetSnapshot(target);
    const retry = await driver.recoverStage();
    const after = await driver.journalBytes("TASK-1");

    expect((await driver.targetSnapshot(target)).evidence).toEqual(cleanedBefore.evidence);
    expect(cleanedBefore.view).toBeNull();
    expect(JSON.parse(cleanedBefore.evidence?.bytes ?? "{}").state).toBe("cleaned");
    expect(partial.code).toBe(1);
    expect(partial.stderr).toContain("cleanup interruption");
    expect(retry.code).toBe(0);
    expect(after).toBe(before);
    expect(await readFile(completionPath, "utf8")).toBe(completionBefore);
    expect(JSON.parse(after ?? "{}").attempts[0].costUsd).toBe(0.1);
    expect(await readFile(stage.value.reportPath ?? "", "utf8")).toBe(report);
  }, 20_000);

  test("partial recovery never removes a replacement execution lock", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    await driver.stagePersistenceFault("cleanup");
    await driver.recoverStage();
    const journal = await driver.journalBytes("TASK-1");
    const path = join(driver.repo, ".git", "iterate", "lock");
    await writeFile(path, "replacement owner");

    const refused = await driver.recoverStage();

    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("recovery lock changed");
    expect(await readFile(path, "utf8")).toBe("replacement owner");
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
  }, 20_000);

  test.each([
    "report",
    "receipt",
    "journal",
    "claim",
    "lock",
    "live-owner",
    "foreign-owner",
    "backend",
  ] as const)(
    "recovery refuses changed %s evidence without changing authority or allowances",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.stagePersistenceFault("terminal");
      await driver.run("step", "TASK-1", ...pinned);
      const { value } = await driver.stageReceipt();
      await driver.corruptStageEvidence(kind);
      const journal = await driver.journalBytes("TASK-1");
      const board = await driver.boardBytes();
      const lock = await driver.lockBytes();

      const target = (await driver.retainedTarget()).target;
      const viewBefore = await driver.targetSnapshot(target);
      const recovery = await driver.run(
        "recover",
        "TASK-1",
        "--run",
        value.run,
        "--intent",
        value.token,
        "--evidence",
        "Operator inspects private corruption fixture",
      );

      expect(recovery.code).toBe(1);
      expect(recovery.calls).toHaveLength(1);
      expect(await driver.journalBytes("TASK-1")).toBe(journal);
      expect(await driver.boardBytes()).toBe(board);
      expect(await driver.lockBytes()).toBe(lock);
      expect(await driver.nativeMarker()).toBeUndefined();
      expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
    },
    20_000,
  );

  test("recovery serializes contenders and native writers until exact cleanup completes", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    await driver.stagePersistenceFault("recovery-gate");
    const recovering = driver.recoverStage();
    await driver.waitFor(join(driver.directory, "recovery-gate.ready"));

    const contender = await driver.recoverStage();
    const nativeContender = await driver.nativeRecoveryContender();
    const otherTree = await driver.independentTree();
    const dispatch = await harness.run(otherTree, driver.env, ["step", "TASK-1", ...pinned]);
    await writeFile(join(driver.directory, "recovery-gate.release"), "release");
    const recovered = await recovering;

    expect(contender.code).toBe(1);
    expect(nativeContender).toBe(1);
    expect(contender.stderr).toContain("recovery is already locked");
    expect(dispatch.code).toBe(1);
    expect(recovered.code).toBe(0);
    expect(recovered.calls).toHaveLength(1);
    expect(await driver.nativeMarker()).toBeUndefined();
  }, 20_000);

  test("recovery refuses an independently observed live stage process scope", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    const before = await driver.journalBytes("TASK-1");
    const lock = await driver.lockBytes();

    const target = (await driver.retainedTarget()).target;
    const viewBefore = await driver.targetSnapshot(target);
    const refused = await driver.recoverAgainstLiveStageTarget();

    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("stage process scope remains uncertain");
    expect(await driver.journalBytes("TASK-1")).toBe(before);
    expect(await driver.lockBytes()).toBe(lock);
    expect(await driver.targetSnapshot(target)).toEqual(viewBefore);
  }, 20_000);

  test("abrupt recovery-owner death preserves its attributable guard and refuses missing unlock proof", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    const stage = await driver.stageReceipt();
    await driver.stagePersistenceFault("recovery-death");
    const interrupted = await driver.recoverStage();
    delete driver.env.FAKE_RUNNER_FAULT;
    const journal = await driver.journalBytes("TASK-1");
    const guardPath = stage.path.slice(0, -".stage.json".length) + ".recovery-lock";
    const guard = await readFile(guardPath, "utf8");
    const death = JSON.parse(await readFile(join(driver.directory, "recovery-death.json"), "utf8"));

    const refused = await driver.recoverStage();

    expect(interrupted.code).not.toBe(0);
    expect(JSON.parse(guard)).toMatchObject({
      run: stage.value.run,
      token: stage.value.token,
      owner: { pid: death.pid },
    });
    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain("exact guard settlement/unlock proof is missing");
    expect(await readFile(guardPath, "utf8")).toBe(guard);
    expect(await driver.journalBytes("TASK-1")).toBe(journal);
    expect(await driver.nativeMarker()).toBeString();
  }, 20_000);

  test("exact recovery finalizes the original target and repeat preserves its evidence", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build", runBudget: "10" });
    await driver.initializableTargetConfig();
    await driver.traceTargetCommands();
    await driver.run("step", "TASK-1", ...pinned);
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    delete driver.env.FAKE_RUNNER_FAULT;
    const original = await driver.retainedTarget();
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const report = await readFile(original.stage.value.reportPath ?? "", "utf8");
    const cli = await readFile(join(driver.directory, "target-cli-trace.jsonl"), "utf8");

    const beforeWrong = await driver.targetSnapshot(original.target);
    const wrong = await driver.recoverStage(true);
    const afterWrong = await driver.targetSnapshot(original.target);
    const recovered = await driver.recoverStage();
    const cleaned = await driver.targetSnapshot(original.target);
    const settled = await driver.journalBytes("TASK-1");
    const settledStatus = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const audit = await driver.recoveryArtifacts(original.intent);
    const repeat = await driver.recoverStage();
    const repeated = await driver.targetSnapshot(original.target);

    expect(wrong.code).toBe(1);
    expect(afterWrong).toEqual(beforeWrong);
    expect(original.target.initialization).toBeDefined();
    expect(recovered.code).toBe(0);
    expect(repeat.code).toBe(0);
    expect(cleaned.config).toBeNull();
    expect(cleaned.link).toBeNull();
    expect(cleaned.view).toBeNull();
    expect(JSON.parse(cleaned.evidence?.bytes ?? "{}")).toEqual({
      ...original.target,
      state: "cleaned",
      owner: expect.any(Number),
    });
    expect(repeated.evidence).toEqual(cleaned.evidence);
    expect(await driver.recoveryArtifacts(original.intent)).toEqual(audit);
    expect(await driver.journalBytes("TASK-1")).toBe(settled);
    expect(await readFile(join(driver.directory, "target-cli-trace.jsonl"), "utf8")).toBe(cli);
    expect(recovered.calls).toHaveLength(2);
    expect(repeat.calls).toHaveLength(2);
    expect(await readFile(original.marker.intent, "utf8")).toBe(original.intent);
    expect(await readFile(original.stage.value.reportPath ?? "", "utf8")).toBe(report);
    const resumed = await driver.run("resume", "TASK-1", ...pinned);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    expect(resumed.calls).toHaveLength(3);
    expect(after.id).toBe(before.id);
    expect(after.runClaim).toEqual(before.runClaim);
    expect(after.limits).toEqual(before.limits);
    expect(after.attempts.slice(0, 2)).toEqual(JSON.parse(settled ?? "{}").attempts);
    expect(after.attempts[0]).toEqual(before.attempts[0]);
    expect(after.attempts[1].requestedAgent).toEqual(before.attempts[1].requestedAgent);
    expect(after.attempts[1].selection).toEqual(before.attempts[1].selection);
    expect(settledStatus.totals.knownCostUsd).toBe(0.2);
    expect(after.totals.knownCostUsd).toBe(settledStatus.totals.knownCostUsd);
    expect(after.totals.durationMs).toBe(
      settledStatus.totals.durationMs + after.attempts.at(-1).durationMs,
    );
    expect((await driver.targetSnapshot(original.target)).view).toBeNull();
    expect(
      (await driver.targetViews()).filter((entry) => entry.record.token !== original.target.token),
    ).toHaveLength(2);
  }, 20_000);

  test.each(["target-config", "target-link", "target-directory", "target-cleaned"] as const)(
    "%s interruption preserves exclusion and converges from the real partial target",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true, runBudget: "10" });
      await driver.stagePersistenceFault("terminal");
      await driver.run("step", "TASK-1", ...pinned);
      const original = await driver.retainedTarget();
      const report = await readFile(original.stage.value.reportPath ?? "", "utf8");
      await driver.stagePersistenceFault(kind);

      const partial = await driver.recoverStage();
      const interrupted = await driver.targetSnapshot(original.target);
      const auditPath = `${original.marker.intent}.recovery-${original.marker.token}.json`;
      const audit = await readFile(auditPath, "utf8");
      const journal = await driver.journalBytes("TASK-1");
      const fault = JSON.parse(
        await readFile(join(driver.directory, `stage-fault-${kind}`), "utf8"),
      );
      const retried = await driver.recoverStage();
      const cleaned = await driver.targetSnapshot(original.target);

      expect(partial.code).toBe(1);
      expect(fault.value.error.code).toBe("ENOENT");
      expect(fault.value.effectCompleted).toBe(true);
      expect(interrupted.config).toBeNull();
      expect(interrupted.link !== null).toBe(kind === "target-config");
      expect(interrupted.view !== null).toBe(kind === "target-config" || kind === "target-link");
      expect(JSON.parse(interrupted.evidence?.bytes ?? "{}").state).toBe(
        kind === "target-cleaned" ? "cleaned" : "retained",
      );
      expect(interrupted.boardLock).toBeString();
      expect(interrupted.treeLock).not.toBeNull();
      expect(retried.code).toBe(0);
      expect(cleaned.config).toBeNull();
      expect(cleaned.link).toBeNull();
      expect(cleaned.view).toBeNull();
      expect(JSON.parse(cleaned.evidence?.bytes ?? "{}")).toMatchObject({
        ...original.target,
        state: "cleaned",
      });
      expect(await readFile(auditPath, "utf8")).toBe(audit);
      expect(await driver.journalBytes("TASK-1")).toBe(journal);
      expect(await readFile(original.stage.value.reportPath ?? "", "utf8")).toBe(report);
      expect(JSON.parse(journal ?? "{}").attempts[0].costUsd).toBe(0.1);
    },
    20_000,
  );

  test.each(["config", "link", "view", "extra", "board", "cleaned-replacement"] as const)(
    "target finalization refuses a present %s replacement without touching it",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.stagePersistenceFault("terminal");
      await driver.run("step", "TASK-1", ...pinned);
      delete driver.env.FAKE_RUNNER_FAULT;
      const original = await driver.retainedTarget();
      const replacement = await driver.replaceTarget(kind);
      const before = await driver.targetSnapshot(original.target);

      const refused = await driver.recoverStage();
      const after = await driver.targetSnapshot(original.target);

      expect(refused.code).toBe(1);
      expect(
        JSON.parse(
          await readFile(
            `${original.marker.intent}.recovery-${original.marker.token}.json`,
            "utf8",
          ),
        ).marker,
      ).toBe(original.intent);
      expect(after).toEqual(before);
      expect(replacement.originalStillAllocated).toBe(true);
      expect(replacement.replacement.ino === replacement.original.ino).toBe(kind === "extra");
      expect(after.boardLock).toBeString();
      expect(after.treeLock).not.toBeNull();
    },
    20_000,
  );

  test("partial target finalization refuses a replacement of the remaining link", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);
    const original = await driver.retainedTarget();
    await driver.stagePersistenceFault("target-config");
    const partial = await driver.recoverStage();
    delete driver.env.FAKE_RUNNER_FAULT;
    const replacement = await driver.replaceTarget("link");
    const before = await driver.targetSnapshot(original.target);

    const refused = await driver.recoverStage();

    expect(partial.code).toBe(1);
    expect(before.config).toBeNull();
    expect(refused.code).toBe(1);
    expect(replacement.original.ino).not.toBe(replacement.replacement.ino);
    expect(await driver.targetSnapshot(original.target)).toEqual(before);
  }, 20_000);

  test.each(["manifest", "record", "fifo", "conflict", "ancestor", "completion"] as const)(
    "target finalization refuses missing or conflicting %s proof",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.stagePersistenceFault("terminal");
      await driver.run("step", "TASK-1", ...pinned);
      delete driver.env.FAKE_RUNNER_FAULT;
      const original = await driver.corruptTargetProof(kind);
      const before = await driver.targetSnapshot(original.target);

      const refused = await driver.recoverStage();

      expect(refused.code).toBe(1);
      expect(await driver.targetSnapshot(original.target)).toEqual(before);
      expect(before.view).not.toBeNull();
      expect(before.boardLock).toBeString();
      expect(before.treeLock).not.toBeNull();
    },
    20_000,
  );

  test("target finalization holds all exclusions against recovery and dispatch contenders", async () => {
    const driver = await harness.seedReal({ failedResult: true });
    await driver.stagePersistenceFault("terminal");
    await driver.run("step", "TASK-1", ...pinned);

    const race = await driver.targetFinalizationRace();

    expect(race.recovered.code).toBe(0);
    expect(race.contender.code).toBe(1);
    expect(race.same.code).toBe(1);
    expect(race.other.code).toBe(1);
    expect(race.native).toBe(1);
    expect(race.after).toEqual(race.before);
    expect(race.markerAfter).toBe(race.marker);
    expect(race.guardAfter.bytes).toBe(race.guard.bytes);
    expect(race.guardAfter.identity.ino).toBe(race.guard.identity.ino);
    expect(race.before.config).not.toBeNull();
    expect(race.before.boardLock).toBeString();
    expect(race.before.treeLock).not.toBeNull();
  }, 25_000);

  test("a genuine report persistence interruption recovers and resumes the original author", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build", runBudget: "10" });
    await driver.stagePersistenceFault("terminal");

    const interrupted = await driver.run("step", "TASK-1", ...pinned);
    const before = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const stage = await driver.stageReceipt();
    const report = await readFile(stage.value.reportPath ?? "", "utf8");
    const lock = await driver.lockBytes();
    const wrong = await driver.recoverStage(true);
    const unchanged = await driver.journalBytes("TASK-1");
    const recovered = await driver.recoverStage();
    const settled = JSON.parse((await driver.run("status", "TASK-1")).stdout);
    const resumed = await driver.run("resume", "TASK-1", ...pinned);
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(interrupted.code).toBe(1);
    expect(before.attempts[0].status).toBe("running");
    expect(await driver.nativeMarker()).toBeUndefined();
    expect(lock).toBeString();
    expect(wrong.code).toBe(1);
    expect(JSON.parse(unchanged ?? "{}").attempts[0].status).toBe("running");
    expect(recovered.code).toBe(0);
    expect(recovered.calls).toHaveLength(1);
    expect(settled.attempts[0]).toMatchObject({
      status: "failed",
      sessionId: "s-build",
      costUsd: 0.1,
    });
    expect(await readFile(stage.value.reportPath ?? "", "utf8")).toBe(report);
    expect(resumed.calls).toHaveLength(2);
    expect(resumed.argsSeen).toContain("--resume=s-build");
    expect(after.id).toBe(before.id);
    expect(after.runClaim).toEqual(before.runClaim);
    expect(after.limits).toEqual(before.limits);
    expect(after.attempts[0]).toEqual(settled.attempts[0]);
    expect(after.totals.knownCostUsd).toBe(0.1);
  }, 20_000);

  test.each(["terminal", "identity"] as const)(
    "a failed %s replacement retains its synced partial and original identity",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.stagePersistenceFault(kind);

      const failed = await driver.run("step", "TASK-1", ...pinned);
      const { fault, restored } = await driver.replacementEvidence(kind);

      expect(failed.code).toBe(1);
      expect(fault.value.error.code).toBe("EISDIR");
      expect(fault.value.partial).toHaveLength(1);
      const partial = fault.value.partial[0];
      const identity = await lstat(partial.target);
      const bytes = await readFile(partial.target, "utf8");
      expect(identity.isFile()).toBe(true);
      expect(identity.mode & 0o777).toBe(0o600);
      expect(identity.dev).toBe(partial.identity.dev);
      expect(identity.ino).toBe(partial.identity.ino);
      expect(bytes).toBe(partial.bytes);
      expect(JSON.parse(bytes)).toEqual(fault.value.attempted);
      expect(restored.bytes).toBe(fault.value.original.bytes);
      expect(restored.identity.dev).toBe(fault.value.original.identity.dev);
      expect(restored.identity.ino).toBe(fault.value.original.identity.ino);
    },
    20_000,
  );

  test.each(["identity", "release"] as const)(
    "a post-start %s failure keeps one cleanup owner and durable evidence",
    async (kind) => {
      const driver = await harness.seedReal({ failedResult: true });
      await driver.stagePersistenceFault(kind);

      const failed = await driver.run("step", "TASK-1", ...pinned);
      const stage = await driver.stageReceipt();
      const record = JSON.parse((await driver.run("status", "TASK-1")).stdout);
      const boardLock = await driver.lockBytes();
      const treeLock = await readFile(join(driver.repo, ".git", "iterate", "lock"), "utf8");
      const recovery = await driver.recoverStage();

      expect(failed.code).toBe(1);
      expect(stage.value.identity?.pid).toBeNumber();
      expect(record.attempts[0].status).toBe("failed");
      expect(stage.value.state).toBe("completed");
      expect(boardLock).toContain(treeLock);
      expect(recovery.code).toBe(0);
      expect(recovery.calls.length).toBeLessThanOrEqual(1);
    },
    20_000,
  );

  test("mode conversion cannot adopt legacy ownership without separate typed recovery", async () => {
    const driver = await harness.seedReal({ failedResult: true, leaves: "build" });
    await driver.run("step", "TASK-1", ...pinned);
    await driver.legacyOwnership("TASK-1");
    const before = await driver.journalBytes("TASK-1");

    const refused = await driver.run("step", "TASK-1", ...replacement);
    const unchanged = await driver.journalBytes("TASK-1");
    const adopted = await driver.run(
      "step",
      "TASK-1",
      "--adopt-legacy-claim",
      "Operator directs recovery of this inspected fixture run",
      ...replacement,
    );
    const after = JSON.parse((await driver.run("status", "TASK-1")).stdout);

    expect(refused.code).toBe(1);
    expect(refused.calls).toHaveLength(1);
    expect(unchanged).toBe(before);
    expect(adopted.calls).toHaveLength(2);
    expect(after.runClaim.recovery).toBe("Operator directs recovery of this inspected fixture run");
    expect(after.attempts).toHaveLength(2);
    expect(await readFile(join(driver.repo, "left-behind"), "utf8")).toBe("left\n");
  }, 20_000);
});
