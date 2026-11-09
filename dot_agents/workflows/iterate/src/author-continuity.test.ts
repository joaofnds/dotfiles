import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import { Exit } from "./exit.ts";
import { Journal } from "./journal.ts";
import type { SessionResult } from "./session.ts";

const agent = { provider: "claude", model: "sonnet", effort: "high" } as const;
const runtime = {
  cliVersion: "fixture",
  fingerprint: "same-runtime",
  rolePolicy: "same-roles",
  localInputs: { established: true, reasons: [] },
};

function completed(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    requestedAgent: agent,
    resolvedModel: agent.model,
    sessionId: "shape-session",
    status: "completed",
    accountingComplete: true,
    durationMs: 10,
    result: "shaped",
    logPath: "fixture.log",
    errors: [],
    usage: {},
    ...overrides,
  };
}

describe("Journal author continuity", () => {
  const originalCwd = process.cwd();
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "iterate-author-continuity-"));
    const git = spawn(["git", "init", "-q", directory]);
    if ((await git.exited) !== 0) throw new Error("fixture Git initialization failed");

    process.chdir(directory);
  });
  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  });

  test.each([
    {
      name: "Codex",
      author: { provider: "codex", model: "gpt-6.1-sol", effort: "xhigh" },
      configuration: {
        provenance: "codex.sdk.requested" as const,
        model: "gpt-6.1-sol",
        effort: "xhigh",
        cwd: "/fixture",
      },
    },
  ])(
    "reuses a completed synthetic $name contract without changing its configuration",
    async ({ author, configuration }) => {
      const journal = await Journal.open("TASK-1");
      await journal.finish(
        await journal.begin("shape", "TASK-1", author, runtime),
        completed({
          requestedAgent: author,
          resolvedModel: author.model,
          configuredSession: configuration,
        }),
      );

      const id = journal.authorSessionId("build", author, runtime, "continue-author");

      expect(id).toBe("shape-session");
      expect(journal.record.attempts[0]?.configuredSession).toEqual(configuration);
    },
  );

  test.each(["debug", "verify", "build", "review"] as const)(
    "refuses a completed %s predecessor",
    async (stage) => {
      const journal = await Journal.open("TASK-1");
      await journal.finish(await journal.begin(stage, "TASK-1", agent, runtime), completed());

      expect(() => journal.authorSessionId("build", agent, runtime, "continue-author")).toThrow(
        Exit,
      );
    },
  );

  test("refuses an unfinished shaping attempt", async () => {
    const journal = await Journal.open("TASK-1");
    await journal.begin("shape", "TASK-1", agent, runtime);

    expect(() => journal.authorSessionId("build", agent, runtime, "continue-author")).toThrow(Exit);
  });

  test.each([
    { name: "unknown tool coverage", report: { requiredToolOutcomeCoverage: "unknown" as const } },
    { name: "model reroute", report: { resolvedModel: "opus" } },
  ])("refuses $name evidence", async ({ report }) => {
    const journal = await Journal.open("TASK-1");
    await journal.finish(await journal.begin("shape", "TASK-1", agent, runtime), completed(report));

    expect(() => journal.authorSessionId("build", agent, runtime, "continue-author")).toThrow(Exit);
  });

  test("refuses a missing native session ID", async () => {
    const journal = await Journal.open("TASK-1");
    const { sessionId: _id, ...report } = completed();
    await journal.finish(await journal.begin("shape", "TASK-1", agent, runtime), report);

    expect(() => journal.authorSessionId("build", agent, runtime, "continue-author")).toThrow(Exit);
  });

  test.each([
    { name: "role policy", changed: { ...runtime, rolePolicy: "other-roles" } },
    { name: "runtime", changed: { ...runtime, fingerprint: "other-runtime" } },
    { name: "CLI version", changed: { ...runtime, cliVersion: "other-version" } },
  ])("refuses changed $name evidence", async ({ changed }) => {
    const journal = await Journal.open("TASK-1");
    await journal.finish(await journal.begin("shape", "TASK-1", agent, runtime), completed());

    expect(() => journal.authorSessionId("build", agent, changed, "continue-author")).toThrow(Exit);
  });

  test("refuses a Codex author whose recorded configuration belongs to another harness", async () => {
    const codex = { provider: "codex", model: "gpt-6.1-sol", effort: "xhigh" } as const;
    const journal = await Journal.open("TASK-1");
    await journal.finish(
      await journal.begin("shape", "TASK-1", codex, runtime),
      completed({
        requestedAgent: codex,
        resolvedModel: codex.model,
        configuredSession: {
          provenance: "other.harness/init",
          model: codex.model,
          effort: codex.effort,
        },
      }),
    );

    expect(() => journal.authorSessionId("build", codex, runtime, "continue-author")).toThrow(Exit);
  });

  test("refuses unestablished Codex runtime inputs", async () => {
    const journal = await Journal.open("TASK-1");
    const codex = { provider: "codex", model: "gpt-6.1-sol", effort: "xhigh" } as const;
    const unknown = { ...runtime, localInputs: { established: false, reasons: ["unsupported"] } };
    await journal.finish(
      await journal.begin("shape", "TASK-1", codex, unknown),
      completed({
        requestedAgent: codex,
        resolvedModel: codex.model,
        configuredSession: {
          provenance: "codex.sdk.requested",
          model: codex.model,
          effort: codex.effort,
          cwd: "/fixture",
        },
      }),
    );

    expect(() => journal.authorSessionId("build", codex, unknown, "continue-author")).toThrow(Exit);
  });
});
