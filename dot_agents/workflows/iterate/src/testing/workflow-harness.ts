import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { type Subprocess, spawn } from "bun";
import { fakeBacklog, fakeClaude } from "./workflow-fakes.ts";

type Scenario = {
  firstId?: string;
  deferOnRead?: number;
  shapeInvestigation?: string;
  labels?: string[];
  schemaVersion?: number;
  investigationStatus?: string;
  stall?: string;
  dirty?: boolean;
  stop?: boolean;
  stopOnRead?: number;
  assignee?: string;
  status?: string;
  budget?: string;
  runBudget?: string;
  runMinutes?: string;
  unknownCost?: boolean;
  failedResult?: boolean;
  missing?: string;
  leaves?: string;
  stopDuring?: string;
  shaped?: boolean;
  mute?: boolean;
  reassignAt?: string;
};

export class WorkflowHarness {
  private directory = "";
  private readonly active = new Set<Subprocess>();
  private readonly stopping = new Map<Subprocess, Promise<void>>();

  private constructor(private readonly root: string) {}

  static async setup(): Promise<WorkflowHarness> {
    return new WorkflowHarness(await mkdtemp(join(tmpdir(), "iterate-workflow-test-")));
  }

  async reset(): Promise<void> {
    await this.stopRunners();
    this.directory = await mkdtemp(join(this.root, "case-"));
  }

  async teardown(): Promise<void> {
    await this.stopRunners();
    await rm(this.root, { recursive: true, force: true });
  }

  async run(repo: string, env: Record<string, string | undefined>, args: string[]) {
    const child = spawn([process.execPath, join(import.meta.dir, "..", "main.ts"), ...args], {
      cwd: repo,
      env,
      detached: true,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    this.active.add(child);
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_resolve, reject) => {
      deadline = setTimeout(() => {
        this.stopRunner(child).then(
          () => reject(new Error("workflow runner exceeded its 3 second deadline")),
          reject,
        );
      }, 3000);
    });

    try {
      const [stdout, stderr, code] = await Promise.race([
        Promise.all([
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
          child.exited,
        ]),
        expired,
      ]);
      return { stdout, stderr, code };
    } finally {
      clearTimeout(deadline);
      if (child.exitCode === null) await this.stopRunner(child);
      await child.exited;
      this.active.delete(child);
      this.stopping.delete(child);
    }
  }

  private async stopRunners(): Promise<void> {
    await Promise.all([...this.active].map((child) => this.stopRunner(child)));
  }

  private stopRunner(child: Subprocess): Promise<void> {
    const pending = this.stopping.get(child);
    if (pending) return pending;

    const stopped = this.terminate(child);
    this.stopping.set(child, stopped);
    return stopped;
  }

  private async terminate(child: Subprocess): Promise<void> {
    // The runner forwards SIGTERM to its separately detached agent group.
    signal(child.pid, "SIGTERM");
    const force = setTimeout(() => signal(-child.pid, "SIGKILL"), 1500);
    try {
      await child.exited;
    } finally {
      clearTimeout(force);
      signal(-child.pid, "SIGKILL");
    }
  }

  async seed(scenario: Scenario = {}): Promise<WorkflowDriver> {
    const directory = this.directory;
    const bin = join(directory, "bin");
    const repo = join(directory, "repo");
    await Promise.all([mkdir(bin), mkdir(repo)]);
    await Promise.all([
      writeFile(join(bin, "claude"), fakeClaude),
      writeFile(join(bin, "backlog"), `#!${process.execPath}\n${fakeBacklog}`),
      writeFile(join(directory, "status"), `${scenario.status ?? "To Do"}\n`),
      writeFile(join(directory, "assignee"), scenario.assignee ?? ""),
      writeFile(join(directory, "labels"), JSON.stringify(scenario.labels ?? [])),
      writeFile(join(directory, "reads"), "0"),
      ...[
        "notes",
        "calls",
        "edits",
        "systems",
        "arguments",
        "observed-deferred",
        "deferred-dispatches",
      ].map((name) => writeFile(join(directory, name), "")),
    ]);
    await Promise.all([chmod(join(bin, "claude"), 0o755), chmod(join(bin, "backlog"), 0o755)]);

    const env = {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      TMPDIR: directory,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      FAKE_STATUS: join(directory, "status"),
      FAKE_LABELS: join(directory, "labels"),
      FAKE_FIRST_ID: scenario.firstId ?? "DOT-1",
      FAKE_DEFER_ON_READ: String(scenario.deferOnRead ?? 0),
      FAKE_READS: join(directory, "reads"),
      FAKE_OBSERVED_DEFERRED: join(directory, "observed-deferred"),
      FAKE_DEFERRED_DISPATCHES: join(directory, "deferred-dispatches"),
      FAKE_SHAPE_INVESTIGATION: scenario.shapeInvestigation ?? "",
      FAKE_SCHEMA_VERSION: String(scenario.schemaVersion ?? 1),
      FAKE_INVESTIGATION_STATUS: scenario.investigationStatus ?? "",
      FAKE_CALLS: join(directory, "calls"),
      FAKE_ARGUMENTS: join(directory, "arguments"),
      FAKE_UNKNOWN_COST: scenario.unknownCost ? "yes" : "",
      FAKE_FAILED_RESULT: scenario.failedResult ? "yes" : "",
      FAKE_EDITS: join(directory, "edits"),
      FAKE_SYSTEMS: join(directory, "systems"),
      FAKE_NOTES: join(directory, "notes"),
      FAKE_STALL: scenario.stall ?? "",
      FAKE_ASSIGNEE: join(directory, "assignee"),
      FAKE_REASSIGN_AT: scenario.reassignAt ?? "",
      FAKE_MISSING: scenario.missing ?? "",
      FAKE_SHAPED: scenario.shaped ? "yes" : "",
      FAKE_MUTE: scenario.mute ? "yes" : "",
      FAKE_LEAVES: scenario.leaves ? join(repo, "left-behind") : "",
      FAKE_LEAVES_AT: scenario.leaves ?? "",
      FAKE_STOP_DURING: scenario.stopDuring ?? "",
      FAKE_STOP_ON_READ: String(scenario.stopOnRead ?? 0),
      FAKE_STOP_FILE: join(repo, ".iterate-stop"),
      ITERATE_SESSION_BUDGET: scenario.budget ?? "",
      ITERATE_RUN_BUDGET: scenario.runBudget ?? "",
      ITERATE_RUN_MINUTES: scenario.runMinutes ?? "",
      ITERATE_LIVE: "",
    };
    const git = spawn(["git", "-c", "init.defaultBranch=main", "init", "-q", repo], {
      env,
      stdout: "pipe",
      stderr: "pipe",
    });
    if ((await git.exited) !== 0) throw new Error(await new Response(git.stderr).text());
    if (scenario.dirty) await writeFile(join(repo, "untracked"), "");
    if (scenario.stop) await writeFile(join(repo, ".iterate-stop"), "");

    return new WorkflowDriver(repo, directory, env, this);
  }
}

class WorkflowDriver {
  constructor(
    private readonly repo: string,
    private readonly directory: string,
    private readonly env: Record<string, string | undefined>,
    private readonly harness: WorkflowHarness,
  ) {}

  setStatus = (status: string) => writeFile(join(this.directory, "status"), status);
  clearWork = () => rm(join(this.repo, "left-behind"), { force: true });
  loseCardIndex = (id: string) => rm(join(this.repo, ".git", "iterate", `${id}.json`));
  async holdRunLock(): Promise<void> {
    const directory = join(this.repo, ".git", "iterate");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "lock"), String(process.pid));
  }

  async interruptRecordedAttempt(id: string): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const runId = JSON.parse(await readFile(join(root, `${id}.json`), "utf8"));
    const path = join(root, runId, "run.json");
    const record = JSON.parse(await readFile(path, "utf8"));
    record.attempts.at(-1).status = "running";
    await writeFile(path, JSON.stringify(record));
  }

  async replaceRecordedAgent(
    id: string,
    requestedAgent: { provider: string; model: string; effort?: string },
  ): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const runId = JSON.parse(await readFile(join(root, `${id}.json`), "utf8"));
    const path = join(root, runId, "run.json");
    const record = JSON.parse(await readFile(path, "utf8"));
    record.attempts.at(-1).requestedAgent = requestedAgent;
    await writeFile(path, JSON.stringify(record));
  }

  async seedLegacyRun(card: string, dollars: number): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const id = "00000000-0000-4000-8000-000000000001";
    const directory = join(root, id);
    const record = {
      schemaVersion: 1,
      id,
      startedAt: "2026-09-14T00:00:00.000Z",
      card,
      acceptedIds: [card],
      completed: false,
      bet: "Historical bet",
      betRecorded: true,
      reflectionCheck: "passed",
      reflectedFrom: "before reflection",
      reflectedTo: "after reflection",
      limits: { dollars },
      attempts: ["triage", "reflect"].map((stage, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index + 2}`,
        stage,
        card: stage === "triage" ? "inbox" : card,
        startedAt: "2026-09-14T00:00:00.000Z",
        status: "completed",
        requestedAgent:
          stage === "triage"
            ? { provider: "claude", model: "opus" }
            : { provider: "opencode", model: "openai/gpt-6", effort: "high" },
        durationMs: 10,
        costUsd: (index + 1) / 10,
        costScope: "aggregateIncludingChildren",
      })),
    };

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "run.json"), JSON.stringify(record));
    await writeFile(join(root, "current.json"), JSON.stringify(id));
    await writeFile(join(root, `${card}.json`), JSON.stringify(id));
  }
  setRunBudget = (value: string) => {
    this.env.ITERATE_RUN_BUDGET = value;
  };

  async steps(card: string, count: number): Promise<void> {
    for (let index = 0; index < count; index += 1) await this.run("step", card);
  }

  run = async (...args: string[]) => {
    const { stdout, stderr, code } = await this.harness.run(this.repo, this.env, args);
    const [calls, edits, systems, deferredDispatches, argsSeen] = await Promise.all(
      ["calls", "edits", "systems", "deferred-dispatches", "arguments"].map((name) =>
        readFile(join(this.directory, name), "utf8"),
      ),
    );

    return {
      code,
      stdout,
      stderr,
      calls: (calls ?? "").trim().split("\n").filter(Boolean),
      edits: edits ?? "",
      systems: (systems ?? "").split("\n---\n").filter(Boolean),
      deferredDispatches: (deferredDispatches ?? "").trim().split("\n").filter(Boolean),
      argsSeen: argsSeen ?? "",
    };
  };
}

function signal(pid: number, name: NodeJS.Signals): void {
  try {
    process.kill(pid, name);
  } catch (error) {
    if (!(error instanceof Error && "code" in error) || error.code !== "ESRCH") throw error;
  }
}
