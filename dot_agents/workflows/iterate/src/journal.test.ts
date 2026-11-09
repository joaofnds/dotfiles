import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, readlink, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import { agentPlanFromArgs, resolveInvocation } from "./agents.ts";
import { BoardCommandFailure } from "./board-transaction.ts";
import { definedFields } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import { Journal, withJournalLock } from "./journal.ts";
import type { SessionResult } from "./session.ts";

const agent = { provider: "claude", model: "sonnet", effort: "high" } as const;
const runtime = { cliVersion: "fixture", fingerprint: "hash", rolePolicy: "none" };
const codexRuntime = { ...runtime, localInputs: { established: true, reasons: [] } };

function result(usd: number, basis: "invocation" | "sessionCumulative"): SessionResult {
  return {
    status: "completed",
    accountingComplete: true,
    durationMs: 10,
    result: "ok",
    sessionId: "same-session",
    logPath: "fixture.log",
    requestedAgent: agent,
    resolvedModel: "sonnet",
    cost: { usd, scope: "aggregateIncludingChildren", basis },
    usage: {},
    errors: [],
  };
}

async function requiredJournal(card: string): Promise<Journal> {
  const journal = await Journal.read(card);
  if (!journal) throw new Error("fixture journal missing");

  return journal;
}

describe("Journal", () => {
  const originalCwd = process.cwd();
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "iterate-journal-"));
    const git = spawn(["git", "init", "-q", directory]);
    expect(await git.exited).toBe(0);
    process.chdir(directory);
  });
  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  });

  test("an unsettled command keeps the tree excluded from another card", async () => {
    const failure = new BoardCommandFailure("unsettled native child", true);
    await expect(
      withJournalLock(async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    await expect(
      withJournalLock(async () => {
        await Journal.open("OTHER-1");
      }),
    ).rejects.toMatchObject({ code: 1 });

    expect(await readFile(join(directory, ".git", "iterate", "lock"), "utf8")).toBe(
      String(process.pid),
    );
    expect(await Journal.read("OTHER-1")).toBeUndefined();
  });

  test("invocation receipts add without subtracting earlier session spend", async () => {
    const journal = await Journal.open("DOT-1");
    const first = await journal.begin("build", "DOT-1", { provider: "claude" });
    await journal.finish(first, result(2, "invocation"));
    const second = await journal.begin("build", "DOT-1", { provider: "claude" });

    await journal.finish(second, result(3, "invocation"));

    expect(journal.summary().totals.knownCostUsd).toBe(5);
  });

  test("cumulative receipts count only the session delta", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(2, "sessionCumulative"),
    );

    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(3, "sessionCumulative"),
    );

    expect(journal.summary().totals.knownCostUsd).toBe(3);
  });

  test("cumulative receipts subtract intervening invocation receipts from the same ledger", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(2, "sessionCumulative"),
    );
    await journal.finish(await journal.begin("build", "DOT-1", agent), result(3, "invocation"));

    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(6, "sessionCumulative"),
    );

    expect(journal.summary().totals.knownCostUsd).toBe(6);
  });

  test("a cumulative aggregate cannot treat an earlier parent counter as an aggregate baseline", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(await journal.begin("build", "DOT-1", agent), {
      ...result(2, "sessionCumulative"),
      cost: { usd: 2, scope: "parent", basis: "sessionCumulative" },
    });

    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(3, "sessionCumulative"),
    );

    expect(journal.record.attempts[1]?.costUsd).toBeUndefined();
    expect(journal.summary().totals.unknownCostAttempts).toBe(1);
  });

  test("equal session IDs from different providers have independent ledgers", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(
      await journal.begin("build", "DOT-1", agent),
      result(2, "sessionCumulative"),
    );

    await journal.finish(
      await journal.begin("build", "DOT-1", { provider: "codex", model: "historical" }),
      result(3, "sessionCumulative"),
    );

    expect(journal.summary().totals.knownCostUsd).toBe(5);
  });

  test("a duplicate terminal settlement changes neither spend nor report", async () => {
    const journal = await Journal.open("DOT-1");
    const attempt = await journal.begin("build", "DOT-1", agent);
    await journal.finish(attempt, result(2, "invocation"));
    const before = await readFile(join(journal.directory, "run.json"), "utf8");
    const reportPath = join(journal.directory, `${attempt.id}.json`);
    const reportBefore = await readFile(reportPath, "utf8");

    await journal.finish(attempt, result(3, "invocation"));

    expect(await readFile(join(journal.directory, "run.json"), "utf8")).toBe(before);
    expect(await readFile(reportPath, "utf8")).toBe(reportBefore);
    expect(journal.summary().totals.knownCostUsd).toBe(2);
  });

  test("historical spend with unknown scope cannot authorize another dollar cap", async () => {
    const journal = await Journal.open("DOT-1");
    const path = join(journal.directory, "run.json");
    const legacy = JSON.stringify({
      ...journal.record,
      schemaVersion: 1,
      attempts: [
        {
          id: crypto.randomUUID(),
          stage: "build",
          card: "DOT-1",
          startedAt: new Date().toISOString(),
          status: "completed",
          requestedAgent: { provider: "claude" },
          costUsd: 2,
        },
      ],
    });
    await writeFile(path, legacy);

    const loaded = await Journal.read("DOT-1");

    expect(loaded?.summary().totals.unknownCostAttempts).toBe(1);
    expect(() => loaded?.requireKnownCosts()).toThrow(Exit);
    expect(await readFile(path, "utf8")).toBe(legacy);
  });

  test("a card index cannot select another card's author journal", async () => {
    const journal = await Journal.open("DOT-1");
    const root = join(directory, ".git", "iterate");
    await writeFile(join(root, "DOT-2.json"), JSON.stringify(journal.record.id));
    const before = await readFile(join(journal.directory, "run.json"), "utf8");

    await expect(Journal.read("DOT-2")).rejects.toBeInstanceOf(Exit);

    expect(await readFile(join(journal.directory, "run.json"), "utf8")).toBe(before);
  });

  test("an index cannot select a record with another run identity", async () => {
    const journal = await Journal.open("DOT-1");
    const path = join(journal.directory, "run.json");
    const before = JSON.stringify({ ...journal.record, id: crypto.randomUUID() });
    await writeFile(path, before);

    await expect(Journal.read("DOT-1")).rejects.toBeInstanceOf(Exit);

    expect(await readFile(path, "utf8")).toBe(before);
  });

  test("present empty indexes cannot authorize a new run", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(await journal.begin("build", "DOT-1", agent), result(1, "invocation"));
    const root = join(directory, ".git", "iterate");
    const path = join(journal.directory, "run.json");
    const before = await readFile(path, "utf8");
    await writeFile(join(root, "current.json"), "");
    await writeFile(join(root, "DOT-1.json"), "");

    await expect(Journal.open("DOT-1")).rejects.toBeInstanceOf(Exit);

    expect(await readFile(path, "utf8")).toBe(before);
    expect(await readFile(join(root, "current.json"), "utf8")).toBe("");
    expect(await readFile(join(root, "DOT-1.json"), "utf8")).toBe("");
  });

  test("regular symlink indexes preserve the existing run", async () => {
    const journal = await Journal.open("DOT-1");
    const root = join(directory, ".git", "iterate");
    for (const name of ["current.json", "DOT-1.json"]) {
      const path = join(root, name);
      await rename(path, `${path}.saved`);
      await symlink(`${path}.saved`, path);
    }

    const reopened = await Journal.open("DOT-1");

    expect(reopened.record).toEqual(journal.record);
  });

  test("dangling indexes cannot replace an exhausted run with fresh allowances", async () => {
    const journal = await Journal.open("DOT-1");
    for (let index = 0; index < 6; index += 1) {
      await journal.finish(await journal.begin("build", "DOT-1", agent), result(1, "invocation"));
    }
    expect(() => journal.allowances()).toThrow(Exit);
    const root = join(directory, ".git", "iterate");
    const path = join(journal.directory, "run.json");
    const before = await readFile(path, "utf8");
    const target = join(root, "missing.json");
    for (const name of ["current.json", "DOT-1.json"]) {
      await rm(join(root, name));
      await symlink(target, join(root, name));
    }

    await expect(Journal.open("DOT-1")).rejects.toBeInstanceOf(Exit);

    expect(await readFile(path, "utf8")).toBe(before);
    expect(await readlink(join(root, "current.json"))).toBe(target);
    expect(await readlink(join(root, "DOT-1.json"))).toBe(target);
  });

  test("token deltas retain unknown categories and keep scopes separate", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(await journal.begin("build", "DOT-1", agent), {
      ...result(2, "sessionCumulative"),
      usage: {
        parent: { input: 20 },
        parentBasis: "invocation",
        aggregateIncludingChildren: { input: 2 },
        aggregateBasis: "sessionCumulative",
        raw: [{ future_category: 7 }],
      },
    });

    await journal.finish(await journal.begin("build", "DOT-1", agent), {
      ...result(3, "sessionCumulative"),
      usage: {
        parent: { input: 30 },
        parentBasis: "invocation",
        aggregateIncludingChildren: { input: 3, reasoning: 8 },
        aggregateBasis: "sessionCumulative",
        raw: [{ future_category: 9 }],
      },
    });

    expect(journal.summary().totals.usage).toEqual({
      parent: { input: 50 },
      aggregateIncludingChildren: { input: 3 },
    });
    expect(journal.record.attempts[1]?.usageReceipt?.raw).toEqual([{ future_category: 9 }]);
    expect(journal.record.attempts[1]?.usageDelta?.aggregateIncludingChildren).toEqual({
      input: 1,
    });
  });

  test.each(["parent", "incomplete", "missing"] as const)(
    "%s cost evidence blocks a subsequent dollar cap",
    async (evidence) => {
      const journal = await Journal.open("DOT-1");
      const report = result(2, "invocation");
      const { cost: _cost, ...withoutCost } = report;
      await journal.finish(
        await journal.begin("build", "DOT-1", agent),
        evidence === "missing"
          ? withoutCost
          : {
              ...report,
              accountingComplete: evidence !== "incomplete",
              cost: {
                usd: 2,
                basis: "invocation",
                scope: evidence === "parent" ? "parent" : "aggregateIncludingChildren",
              },
            },
      );

      expect(() => journal.requireKnownCosts()).toThrow(Exit);
    },
  );

  test("inspection preserves a version one journal and its historical metadata byte for byte", async () => {
    const journal = await Journal.open("DOT-1");
    const path = join(journal.directory, "run.json");
    const value = {
      ...journal.record,
      schemaVersion: 1,
      opaqueClaim: { owner: "not ownership proof" },
      attempts: [
        {
          id: crypto.randomUUID(),
          stage: "triage",
          card: "inbox",
          startedAt: new Date().toISOString(),
          status: "completed",
          requestedAgent: { provider: "claude" },
        },
        {
          id: crypto.randomUUID(),
          stage: "reflect",
          card: "DOT-1",
          startedAt: new Date().toISOString(),
          status: "completed",
          requestedAgent: { provider: "opencode", model: "old" },
        },
        {
          id: crypto.randomUUID(),
          stage: "build",
          card: "DOT-1",
          startedAt: new Date().toISOString(),
          status: "failed",
          requestedAgent: { provider: "codex", model: "old" },
        },
      ],
    };
    const bytes = JSON.stringify(value, null, 3);
    await writeFile(path, bytes);

    const loaded = await Journal.read("DOT-1");

    expect(loaded?.summary().attempts.map((attempt) => attempt.requestedAgent.provider)).toEqual([
      "claude",
      "opencode",
      "codex",
    ]);
    expect(await readFile(path, "utf8")).toBe(bytes);
  });

  test("a run recorded by a retired provider stays readable and its saved plan is not reused", async () => {
    const journal = await Journal.open("DOT-1");
    const path = join(journal.directory, "run.json");
    const codexPlan = agentPlanFromArgs(["--default-provider", "codex"]).supervised;
    const retiredPlan = JSON.parse(
      JSON.stringify(codexPlan).replaceAll('"codex"', '"antigravity"'),
    );
    const configuredSession = {
      provenance: "antigravity.stream-json.init",
      conversationId: "conversation",
      model: "old",
      cwd: "/fixture",
      permissionMode: "default",
    };
    await writeFile(
      path,
      JSON.stringify({
        ...journal.record,
        supervisedPlan: retiredPlan,
        attempts: [
          {
            id: crypto.randomUUID(),
            stage: "shape",
            card: "DOT-1",
            startedAt: new Date().toISOString(),
            status: "completed",
            requestedAgent: { provider: "antigravity", model: "old" },
            selection: retiredPlan,
            configuredSession,
          },
        ],
      }),
    );

    const loaded = await requiredJournal("DOT-1");

    expect(loaded.record.attempts[0]?.configuredSession).toEqual(configuredSession);
    expect(() =>
      resolveInvocation({ args: [], invocation: "step", savedPlan: loaded.record.supervisedPlan }),
    ).toThrow("the saved supervised plan cannot be reused");
  });

  test("forward journal schemas fail without a rewrite", async () => {
    const journal = await Journal.open("DOT-1");
    const path = join(journal.directory, "run.json");
    const bytes = JSON.stringify({ ...journal.record, schemaVersion: 3 });
    await writeFile(path, bytes);

    await expect(Journal.read("DOT-1")).rejects.toBeInstanceOf(Exit);
    expect(await readFile(path, "utf8")).toBe(bytes);
  });

  test("complete reselection preserves opaque run state and snapshots the next attempt", async () => {
    const journal = await Journal.open("DOT-1");
    const original = agentPlanFromArgs(["--default-provider", "codex", "--default-model", "old"]);
    journal.record.supervisedPlan = original.supervised;
    journal.record.claim = { token: "opaque" };
    journal.record.dirtyWork = ["opaque.ts"];
    journal.record.limits = { dollars: 100, durationMs: 500 };
    const attempt = await journal.begin("build", "DOT-1", { provider: "codex", model: "old" });
    await journal.finish(attempt, { ...result(2, "invocation"), status: "failed" });
    const before = structuredClone(journal.record);
    const loaded = await Journal.read("DOT-1");
    if (!loaded) throw new Error("fixture journal missing");
    const replacement = resolveInvocation({
      args: [
        "--default-provider",
        "claude",
        "--default-model",
        "sonnet",
        "--default-effort",
        "high",
      ],
      invocation: "step",
      savedPlan: loaded.record.supervisedPlan,
    });

    await loaded.begin("build", "DOT-1", agent, runtime, replacement);
    const reread = (await Journal.read("DOT-1"))?.record;

    expect(reread).toMatchObject({
      id: before.id,
      claim: before.claim,
      dirtyWork: before.dirtyWork,
      limits: before.limits,
    });
    expect(reread?.attempts[0]).toEqual(before.attempts[0]);
    expect(reread?.attempts).toHaveLength(2);
    expect(reread?.attempts[1]?.selection).toEqual(replacement.plan.supervised);
    expect(reread?.selectionHistory).toMatchObject([
      { previous: original.supervised, next: replacement.plan.supervised },
    ]);
  });

  test.each([
    { name: "runtime", updated: { ...runtime, fingerprint: "drift" } },
    { name: "version", updated: { ...runtime, cliVersion: "drift" } },
    { name: "roles", updated: { ...runtime, rolePolicy: "drift" } },
  ])("resume rejects a changed $name contract", async ({ updated }) => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(
      await journal.begin("build", "DOT-1", agent, runtime),
      result(2, "invocation"),
    );

    expect(() => journal.resumeId("build", agent, updated)).toThrow(Exit);
  });

  test("resume accepts the same pinned observable author contract", async () => {
    const journal = await Journal.open("DOT-1");
    await journal.finish(
      await journal.begin("build", "DOT-1", agent, runtime),
      result(2, "invocation"),
    );

    expect(journal.resumeId("build", agent, runtime)).toBe("same-session");
  });
  test("Codex configuration receipts survive persistence without invented telemetry", async () => {
    const journal = await Journal.open("DOT-1");
    const codex = { provider: "codex", model: "gpt-6.1-sol", effort: "high" } as const;
    const receipt = {
      ...result(2, "invocation"),
      requestedAgent: codex,
      status: "failed" as const,
      resolvedModel: undefined,
      configuredSession: {
        provenance: "codex.sdk.requested" as const,
        model: codex.model,
        effort: codex.effort,
        cwd: directory,
      },
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown" as const,
      errors: ["required-tool outcome coverage unknown"],
    };
    const { resolvedModel: _model, ...report } = receipt;
    await journal.finish(await journal.begin("build", "DOT-1", codex, codexRuntime), report);
    const loaded = await requiredJournal("DOT-1");

    expect(loaded.record.attempts.at(-1)).toMatchObject({
      requestedAgent: codex,
      configuredSession: report.configuredSession,
      providerCompleted: true,
      requiredToolOutcomeCoverage: "unknown",
      status: "failed",
    });
    expect(loaded.record.attempts.at(-1)?.resolvedModel).toBeUndefined();
    expect(loaded.resumeId("build", codex, codexRuntime)).toBe("same-session");
    expect(
      JSON.parse(await readFile(String(loaded.record.attempts.at(-1)?.reportPath), "utf8")),
    ).toEqual(report);
  });

  test.each([
    "model",
    "effort",
    "codexRuntime",
    "roles",
    "stage",
    "review",
    "id",
    "legacy",
    "reroute",
  ])("Codex resume refuses incompatible %s evidence", async (variation) => {
    const journal = await Journal.open("DOT-1");
    const codex = { provider: "codex", model: "gpt-6.1-sol", effort: "high" } as const;
    const { resolvedModel: _model, ...base } = result(2, "invocation");
    const configuredSession = {
      provenance: "codex.sdk.requested" as const,
      model: variation === "model" ? "gpt-6-luna" : codex.model,
      effort: variation === "effort" ? "low" : codex.effort,
      cwd: directory,
    };
    await journal.finish(
      await journal.begin("build", "DOT-1", codex, codexRuntime),
      Object.assign(
        {},
        base,
        { requestedAgent: codex },
        definedFields({
          configuredSession: variation === "legacy" ? undefined : configuredSession,
          resolvedModel: variation === "reroute" ? "gpt-6-luna" : undefined,
          sessionId: variation === "id" ? "" : undefined,
        }),
      ),
    );

    expect(() =>
      journal.resumeId(
        variation === "review" ? "review" : variation === "stage" ? "shape" : "build",
        codex,
        variation === "codexRuntime"
          ? { ...codexRuntime, fingerprint: "changed" }
          : variation === "roles"
            ? { ...codexRuntime, rolePolicy: "changed" }
            : codexRuntime,
      ),
    ).toThrow(Exit);
  });
});
