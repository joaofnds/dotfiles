import { existsSync } from "node:fs";
import {
  appendFile,
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
import process from "node:process";
import {
  file,
  type ReadableSubprocess,
  type Subprocess,
  sleep,
  spawn,
  spawnSync,
  which,
} from "bun";
import { z } from "zod";
import { boardTargetRecordSchema, type boardTargetSchema } from "../board-target.ts";
import { markerSchema } from "../board-transaction.ts";
import { definedFields } from "../defined-fields.ts";
import { OwnedProcessGroup } from "../process-group.ts";
import { stageReceiptSchema } from "../stage-receipt.ts";
import { fakeCodex } from "./codex-harness.ts";
import { fakeBacklog, fakeClaude } from "./workflow-fakes.ts";

type Scenario = {
  firstId?: string;
  deferWhileNativeHeld?: boolean;
  shapeInvestigation?: string;
  labels?: string[];
  schemaVersion?: number;
  investigationStatus?: string;
  stall?: string;
  dirty?: boolean;
  stop?: boolean;
  stopOnFinalDoneRead?: boolean;
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
  reportedCosts?: string[];
  missingHistory?: boolean;
  resumedModel?: string;
  afterResult?: boolean;
  runtimeBookkeeping?: boolean;
  versionDescendant?: boolean;
};

type FixtureIOBoundary = {
  evidenceDirectory?: string;
  collectEvidence?: (read: () => Promise<string[]>) => Promise<string[]>;
  afterRunnersStopped?: () => Promise<void>;
  beforeRetireFiles?: (operation: "remove" | "archive", directory: string) => void;
};

type WorkflowFixture = {
  readonly directory: string;
  readonly pending: Set<Promise<unknown>>;
  accepting: boolean;
  evidenceFailure?: { readonly error: unknown };
};

export class WorkflowFixtureRetiredError extends Error {
  constructor() {
    super("workflow fixture no longer admits runner calls");
  }
}

export class WorkflowHarness {
  private fixture: WorkflowFixture | undefined;
  private resetting: Promise<void> | undefined;
  private tearingDown: Promise<void> | undefined;
  private ending = false;
  private readonly active = new Set<Subprocess>();
  private readonly stopping = new Map<Subprocess, Promise<void>>();

  private constructor(
    private readonly props: {
      readonly root: string;
      readonly runnerDeadlineMs: number;
      readonly fixtureIOBoundary: FixtureIOBoundary | undefined;
    },
  ) {}

  static async setup(
    options: { runnerDeadlineMs?: number; fixtureIOBoundary?: FixtureIOBoundary } = {},
  ): Promise<WorkflowHarness> {
    return new WorkflowHarness({
      root: await mkdtemp(join(tmpdir(), "iterate-workflow-test-")),
      runnerDeadlineMs: options.runnerDeadlineMs ?? 20_000,
      fixtureIOBoundary: options.fixtureIOBoundary,
    });
  }

  private get directory(): string {
    return this.fixture?.directory ?? "";
  }

  reset(): Promise<void> {
    if (this.ending) return Promise.reject(new WorkflowFixtureRetiredError());

    if (this.resetting) return this.resetting;

    if (this.fixture) this.fixture.accepting = false;
    const resetting = (async () => {
      await this.retireFixture();
      if (!this.ending) {
        const directory = await mkdtemp(join(this.props.root, "case-"));
        this.fixture = { directory, pending: new Set(), accepting: !this.ending };
      }
    })();
    this.resetting = resetting;
    void resetting.then(
      () => {
        this.resetting = undefined;
      },
      () => undefined,
    );

    return resetting;
  }

  teardown(): Promise<void> {
    if (this.tearingDown) return this.tearingDown;

    this.ending = true;
    if (this.fixture) this.fixture.accepting = false;
    const resetting = this.resetting;
    this.tearingDown = (async () => {
      if (resetting) await resetting;
      else await this.retireFixture();

      const evidence =
        this.props.fixtureIOBoundary?.evidenceDirectory ?? process.env.ITERATE_TEST_EVIDENCE;
      if (evidence) {
        await mkdir(evidence, { recursive: true });
        const destination = join(evidence, basename(this.props.root));
        this.props.fixtureIOBoundary?.beforeRetireFiles?.("archive", this.props.root);
        await cp(this.props.root, destination, {
          recursive: true,
          dereference: false,
          filter: async (source) => {
            if (source.endsWith(join("home", "Library", "Caches"))) return false;

            const entry = await lstat(source);
            if (entry.isFile() || entry.isDirectory() || entry.isSymbolicLink()) return true;

            await appendFile(
              join(evidence, "special-files.jsonl"),
              `${JSON.stringify({ source, mode: entry.mode, fifo: entry.isFIFO() })}\n`,
            );
            return false;
          },
        });
      }
      this.props.fixtureIOBoundary?.beforeRetireFiles?.("remove", this.props.root);
      await rm(this.props.root, { recursive: true, force: true });
    })();

    return this.tearingDown;
  }

  private async retireFixture(): Promise<void> {
    const fixture = this.fixture;
    await this.stopRunners();
    if (this.props.fixtureIOBoundary?.afterRunnersStopped)
      await this.props.fixtureIOBoundary.afterRunnersStopped();
    if (!fixture) return;

    await Promise.allSettled([...fixture.pending]);
    if (fixture.evidenceFailure) throw fixture.evidenceFailure.error;

    const evidence =
      this.props.fixtureIOBoundary?.evidenceDirectory ?? process.env.ITERATE_TEST_EVIDENCE;
    if (!evidence) {
      this.props.fixtureIOBoundary?.beforeRetireFiles?.("remove", fixture.directory);
      await rm(fixture.directory, { recursive: true, force: true });
    }
  }

  admitRunnerCall<T>(directory: string, operation: () => Promise<T>): Promise<T> {
    const fixture = this.fixture;
    if (this.ending || !fixture?.accepting || fixture.directory !== directory)
      return Promise.reject(new WorkflowFixtureRetiredError());

    const pending = (async () => operation())();
    fixture.pending.add(pending);
    void pending.then(
      () => {
        fixture.pending.delete(pending);
      },
      () => {
        fixture.pending.delete(pending);
      },
    );

    return pending;
  }

  async collectEvidence(directory: string, read: () => Promise<string[]>): Promise<string[]> {
    const fixture = this.fixture;
    try {
      return await (this.props.fixtureIOBoundary?.collectEvidence?.(read) ?? read());
    } catch (error) {
      if (fixture?.directory === directory) fixture.evidenceFailure ??= { error };
      throw error;
    }
  }

  run(repo: string, env: Record<string, string | undefined>, args: string[]) {
    const fixture = this.fixture;
    if (!fixture) return Promise.reject(new WorkflowFixtureRetiredError());

    const within = relative(fixture.directory, repo);
    if (isAbsolute(within) || within === ".." || within.startsWith(`..${sep}`))
      return Promise.reject(new WorkflowFixtureRetiredError());

    return this.admitRunnerCall(fixture.directory, () =>
      this.runAdmitted(fixture, repo, env, args),
    );
  }

  private async runAdmitted(
    fixture: WorkflowFixture,
    repo: string,
    env: Record<string, string | undefined>,
    args: string[],
  ) {
    const fault = ["step", "resume", "recover"].includes(args[0] ?? "")
      ? env.FAKE_RUNNER_FAULT
      : undefined;
    const faultDirectory = env.FAKE_RUNNER_DIRECTORY;
    if (fault && !faultDirectory)
      throw new Error("fault composition requires its owned fixture directory");
    const child = spawn(
      [
        process.execPath,
        ...(fault
          ? [join(import.meta.dir, "runner-entry.ts"), faultDirectory ?? "", fault]
          : [join(import.meta.dir, "..", "main.ts")]),
        ...args,
      ],
      {
        cwd: repo,
        env,
        detached: true,
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    this.active.add(child);
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_resolve, reject) => {
      deadline = setTimeout(
        () => reject(new Error("workflow runner exceeded its bounded deadline")),
        this.props.runnerDeadlineMs,
      );
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
      const gitPath = spawnSync(["git", "rev-parse", "--absolute-git-dir"], { cwd: repo, env });
      try {
        await appendFile(
          join(gitPath.stdout.toString().trim(), "runner-results.jsonl"),
          `${JSON.stringify({ argv: [process.execPath, ...(fault ? [join(import.meta.dir, "runner-entry.ts"), faultDirectory ?? "", fault] : [join(import.meta.dir, "..", "main.ts")]), ...args], args, cwd: repo, stdin: "ignore", pid: child.pid, processGroupId: child.pid, stdout, stderr, code })}\n`,
        );
      } catch (error) {
        fixture.evidenceFailure ??= { error };
        throw error;
      }
      if (fault && !existsSync(join(faultDirectory ?? "", `stage-fault-${fault}`)))
        throw new Error(
          `requested ${fault} fixture condition was not reached; raw runner result retained`,
        );
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

  async seedReal(scenario: Scenario = {}): Promise<WorkflowDriver> {
    const driver = await this.seed({ ...scenario, firstId: "TASK-1" });
    const board = join(this.directory, "iterate-p4-fixture");
    await Promise.all(
      ["tasks", "docs", "decisions"].map((name) => mkdir(join(board, name), { recursive: true })),
    );
    const template = await readFile(join(import.meta.dir, "backlog-config.yml"), "utf8");
    await writeFile(
      join(board, "config.yml"),
      template.replace("PLACEHOLDER", "iterate-p4-fixture"),
    );
    await rm(join(driver.repo, "backlog"), { recursive: true });
    await symlink(board, join(driver.repo, "backlog"));
    const mise = which("mise");
    if (!mise) throw new Error("the already installed mise backlog route is required");

    const installed = spawnSync([mise, "which", "backlog", "--tool", "npm:backlog.md@1.50.1"], {
      env: process.env,
    });
    if (installed.exitCode !== 0) throw new Error(installed.stderr.toString());
    const shim = installed.stdout.toString().trim();
    const resolver = join(
      dirname(shim),
      "../.mise/backlog.md@1.50.1/node_modules/backlog.md/resolveBinary.cjs",
    );
    const native = spawnSync([
      process.execPath,
      "-e",
      `console.log(require(${JSON.stringify(resolver)}).resolveBinaryPath())`,
    ]);
    if (native.exitCode !== 0) throw new Error(native.stderr.toString());
    const executable = native.stdout.toString().trim();
    await writeFile(
      join(this.directory, "bin", "backlog"),
      `#!/bin/sh\nexec '${executable}' "$@"\n`,
    );
    driver.env.FAKE_REAL_BOARD = "yes";
    driver.env.FAKE_NATIVE_BACKLOG = executable;
    await driver.boardCommand(
      "task",
      "create",
      "P4 ownership fixture",
      "--status",
      scenario.status ?? "Build",
      "--assignee",
      scenario.assignee ?? "",
      "--no-dod-defaults",
    );
    return driver;
  }

  async seed(scenario: Scenario = {}): Promise<WorkflowDriver> {
    const directory = this.directory;
    const bin = join(directory, "bin");
    const cli = join(directory, "cli");
    const repo = join(directory, "repo");
    const home = join(directory, "home");
    const config = join(home, ".claude");
    await Promise.all([mkdir(bin), mkdir(cli), mkdir(repo), mkdir(config, { recursive: true })]);
    await mkdir(join(repo, "backlog"));
    await writeFile(join(repo, "backlog", "config.yml"), "project_name: fixture\n");
    await writeFile(join(repo, ".gitignore"), "backlog\n.gitignore\n");
    await Promise.all([
      writeFile(join(cli, "claude"), fakeClaude),
      writeFile(join(cli, "codex"), fakeCodex),
      writeFile(join(bin, "backlog"), `#!${process.execPath}\n${fakeBacklog}`),
      writeFile(join(directory, "status"), `${scenario.status ?? "To Do"}\n`),
      writeFile(join(directory, "assignee"), scenario.assignee ?? ""),
      writeFile(join(directory, "labels"), JSON.stringify(scenario.labels ?? [])),
      writeFile(join(directory, "costs"), (scenario.reportedCosts ?? []).join("\n")),
      writeFile(join(config, ".claude.json"), JSON.stringify({ numStartups: 1 })),
      writeFile(
        join(directory, "runtime-bookkeeping"),
        JSON.stringify({
          numStartups: 2,
          cachedGrowthBookFeaturesAt: 7,
          projects: { [await realpath(repo)]: { lastSessionId: "fixture-session", lastCost: 0.1 } },
        }),
      ),
      ...[
        "notes",
        "calls",
        "edits",
        "systems",
        "arguments",
        "argv",
        "provider-bypass",
        "observed-deferred",
        "deferred-dispatches",
      ].map((name) => writeFile(join(directory, name), "")),
    ]);
    await Promise.all([
      chmod(join(cli, "claude"), 0o755),
      chmod(join(bin, "backlog"), 0o755),
      chmod(join(cli, "codex"), 0o700),
    ]);

    const env = {
      ...process.env,
      BACKLOG_CWD: undefined,
      HOME: home,
      CLAUDE_CONFIG_DIR: config,
      CODEX_HOME: join(home, ".codex"),
      FAKE_CODEX_DIRECTORY: directory,
      FAKE_CODEX_SCENARIO: "unavailable",
      PATH: `${bin}:${process.env.PATH}`,
      ITERATE_CLAUDE_CLI: join(cli, "claude"),
      ITERATE_CODEX_CLI: join(cli, "codex"),
      TMPDIR: directory,
      FAKE_STATUS: join(directory, "status"),
      FAKE_LABELS: join(directory, "labels"),
      FAKE_FIRST_ID: scenario.firstId ?? "DOT-1",
      FAKE_DEFER_WHILE_NATIVE_HELD: scenario.deferWhileNativeHeld
        ? join(repo, "backlog", ".locks", "task-dot-1")
        : "",
      FAKE_OBSERVED_DEFERRED: join(directory, "observed-deferred"),
      FAKE_DEFERRED_DISPATCHES: join(directory, "deferred-dispatches"),
      FAKE_SHAPE_INVESTIGATION: scenario.shapeInvestigation ?? "",
      FAKE_SCHEMA_VERSION: String(scenario.schemaVersion ?? 1),
      FAKE_INVESTIGATION_STATUS: scenario.investigationStatus ?? "",
      FAKE_CALLS: join(directory, "calls"),
      FAKE_ARGUMENTS: join(directory, "arguments"),
      FAKE_ARGV: join(directory, "argv"),
      FAKE_PROVIDER_BYPASS: join(directory, "provider-bypass"),
      FAKE_COSTS: join(directory, "costs"),
      FAKE_MISSING_HISTORY: scenario.missingHistory ? "yes" : "",
      FAKE_RESUMED_MODEL: scenario.resumedModel ?? "",
      FAKE_AFTER_RESULT: scenario.afterResult ? "yes" : "",
      FAKE_RUNTIME_BOOKKEEPING: scenario.runtimeBookkeeping
        ? join(directory, "runtime-bookkeeping")
        : "",
      FAKE_VERSION_DESCENDANT: scenario.versionDescendant ? join(directory, "version-pids") : "",
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
      FAKE_STOP_ON_FINAL_DONE_READ: scenario.stopOnFinalDoneRead
        ? join(repo, ".git", "iterate", "current.json")
        : "",
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
    readonly repo: string,
    readonly directory: string,
    readonly env: Record<string, string | undefined> & {
      readonly CLAUDE_CONFIG_DIR: string;
    },
    private readonly harness: WorkflowHarness,
  ) {}

  async codexProcess(): Promise<{ pid: number; running: boolean }> {
    const pid = z.coerce
      .number()
      .int()
      .positive()
      .parse(await readFile(join(this.directory, "codex-ready"), "utf8"));
    try {
      process.kill(pid, 0);
      return { pid, running: true };
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ESRCH")
        return { pid, running: false };
      throw error;
    }
  }

  async useCodex(scenario = "complete"): Promise<void> {
    const path = join(this.directory, "cli", "codex");
    await writeFile(path, fakeCodex);
    await chmod(path, 0o700);
    this.env.CODEX_HOME = join(this.directory, "home", ".codex");
    await mkdir(this.env.CODEX_HOME, { recursive: true });
    this.env.FAKE_CODEX_DIRECTORY = this.directory;
    this.env.FAKE_CODEX_SCENARIO = scenario;
  }

  async seedCodexInstruction(
    kind: "ancestor skill" | "configured fallback" | "standalone agent",
  ): Promise<string> {
    await mkdir(join(this.repo, "apps", "service"), { recursive: true });
    await appendFile(join(this.repo, ".gitignore"), "\n.agents\napps\nTEAM_GUIDE.md\n");
    let path: string;
    if (kind === "ancestor skill") {
      const folder = join(this.repo, ".agents", "skills", "build");
      await mkdir(folder, { recursive: true });
      path = join(folder, "SKILL.md");
    } else if (kind === "configured fallback") {
      await writeFile(
        join(String(this.env.CODEX_HOME), "config.toml"),
        'project_doc_fallback_filenames=["TEAM_GUIDE.md"]\n',
      );
      path = join(this.repo, "TEAM_GUIDE.md");
    } else {
      const folder = join(this.repo, ".codex", "agents");
      await mkdir(folder, { recursive: true });
      await appendFile(join(this.repo, ".gitignore"), ".codex\n");
      path = join(folder, "reviewer.toml");
      await writeFile(
        path,
        'name="reviewer"\ndescription="fixture"\ndeveloper_instructions="before"\n',
      );
      return path;
    }
    await writeFile(path, "synthetic instruction before");
    return path;
  }

  async seedCodexAlias(kind: "instruction reference" | "instruction root") {
    const home = await realpath(join(this.directory, "home"));
    this.env.HOME = home;
    this.env.CODEX_HOME = join(home, ".codex");
    let directory: string;
    let alias: string;
    let selectedFile: string;
    let targets: [string, string];
    if (kind === "instruction reference") {
      directory = join(this.env.CODEX_HOME, "agents");
      await mkdir(directory, { recursive: true });
      targets = [join(directory, "a.toml"), join(directory, "b.toml")];
      await writeFile(targets[0], 'developer_instructions="synthetic A"\n');
      await writeFile(targets[1], 'developer_instructions="synthetic B"\n');
      alias = join(directory, "selected.cfg");
      await symlink("a.toml", alias);
      selectedFile = alias;
      await writeFile(
        join(this.env.CODEX_HOME, "config.toml"),
        `model_instructions_file=${JSON.stringify(alias)}\n`,
      );
      return { alias, selectedFile, targets, nextTarget: "b.toml" };
    }

    directory = join(home, ".agents", "skills");
    await mkdir(join(directory, "a"), { recursive: true });
    await mkdir(join(directory, "b"), { recursive: true });
    targets = [join(directory, "a", "SKILL.md"), join(directory, "b", "SKILL.md")];
    await writeFile(targets[0], "synthetic skill A");
    await writeFile(targets[1], "synthetic skill B");
    alias = join(directory, "selected");
    await symlink("a", alias);
    selectedFile = join(alias, "SKILL.md");

    return { alias, selectedFile, targets, nextTarget: "b" };
  }

  async seedCodexFilteredInput(
    kind:
      | "personal reference"
      | "personal alias"
      | "canonical personal reference"
      | "lexical instruction"
      | "lexical role",
  ): Promise<string> {
    const home = await realpath(join(this.directory, "home"));
    this.env.HOME = home;
    const personal = join(home, ".codex");
    let active = personal;
    let target: string;
    if (kind.startsWith("lexical")) {
      target = join(this.directory, "synthetic-excluded.toml");
      await symlink(target, join(active, "auth.json"));
      const reference = join(active, "auth.json");
      const config =
        kind === "lexical role"
          ? `[agents.reviewer]\nconfig_file=${JSON.stringify(reference)}\n`
          : `model_instructions_file=${JSON.stringify(reference)}\n`;
      await writeFile(join(active, "config.toml"), config);
    } else {
      active = join(this.directory, "active-codex");
      await mkdir(active);
      if (kind === "canonical personal reference") {
        const canonical = join(this.directory, "personal-codex");
        await mkdir(canonical);
        await rm(personal, { recursive: true, force: true });
        await symlink(canonical, personal);
        target = join(canonical, "auth.json");
      } else target = join(personal, "auth.json");
      if (kind === "personal alias") {
        await mkdir(join(personal, "agents"));
        await symlink("../auth.json", join(personal, "agents", "resource.bin"));
      } else
        await writeFile(
          join(active, "config.toml"),
          `model_instructions_file=${JSON.stringify(target)}\n`,
        );
    }
    this.env.CODEX_HOME = active;
    await writeFile(target, 'developer_instructions="synthetic excluded before"\n');

    return target;
  }

  async loopCodexInstructionRoot(): Promise<void> {
    await mkdir(join(this.repo, ".agents"));
    await appendFile(join(this.repo, ".gitignore"), "\n.agents\n");
    await symlink("skills", join(this.repo, ".agents", "skills"));
  }

  async seedCodexReference(
    kind:
      | "absolute instruction"
      | "role configuration"
      | "shared role configuration"
      | "relative instruction"
      | "missing instruction"
      | "MCP configuration"
      | "credential target"
      | "custom root markers"
      | "ignored project profile"
      | "symlinked declaring config",
  ): Promise<string> {
    const home = String(this.env.CODEX_HOME);
    const target = join(this.directory, "referenced-instruction.md");
    await writeFile(target, "synthetic referenced instruction before");
    let config = `model_instructions_file=${JSON.stringify(target)}\n`;
    if (kind === "role configuration" || kind === "shared role configuration") {
      await mkdir(join(home, "roles"));
      await writeFile(join(home, "roles", "reviewer.toml"), config);
      config = '[agents.reviewer]\nconfig_file="roles/reviewer.toml"\n';
      if (kind === "shared role configuration")
        config += '[agents.advisor]\nconfig_file="roles/reviewer.toml"\n';
    } else if (kind === "relative instruction")
      config = 'model_instructions_file="../referenced-instruction.md"\n';
    else if (kind === "missing instruction")
      config = `model_instructions_file=${JSON.stringify(join(this.directory, "missing.md"))}\n`;
    else if (kind === "MCP configuration") config = '[mcp_servers.fixture]\ncommand="false"\n';
    else if (kind === "credential target") {
      const auth = join(home, "auth.json");
      await writeFile(auth, '{"synthetic":"credential"}');
      config = `model_instructions_file=${JSON.stringify(auth)}\n`;
    }
    if (kind === "custom root markers") config = "project_root_markers=[]\n";
    if (kind === "ignored project profile") {
      await mkdir(join(this.repo, ".codex"));
      await appendFile(join(this.repo, ".gitignore"), ".codex\n");
      await writeFile(
        join(this.repo, ".codex", "config.toml"),
        'profile="ignored"\n[profiles.ignored]\nmodel_instructions_file="unknown-relative-but-ignored.md"\n',
      );
    }
    if (kind === "symlinked declaring config") {
      await mkdir(join(home, "roles"));
      await writeFile(
        join(home, "roles", "reviewer.toml"),
        'developer_instructions="logical path"\n',
      );
      const external = join(this.directory, "declaring");
      await mkdir(join(external, "roles"), { recursive: true });
      await writeFile(
        join(external, "roles", "reviewer.toml"),
        'developer_instructions="canonical path"\n',
      );
      const declaring = join(external, "config.toml");
      await writeFile(declaring, '[agents.reviewer]\nconfig_file="roles/reviewer.toml"\n');
      await symlink(declaring, join(home, "config.toml"));
      return target;
    }
    await writeFile(join(home, "config.toml"), config);

    return target;
  }

  /** Each Codex exec the fake saw: its argv, working directory, prompt, and output schema. */
  async codexLaunches(): Promise<{ argv: string[]; outputSchema: unknown }[]> {
    try {
      return (await readFile(join(this.directory, "launches"), "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
      throw error;
    }
  }

  async boardCommand(...args: string[]): Promise<string> {
    const child = spawn([join(this.directory, "bin", "backlog"), ...args], {
      cwd: this.repo,
      env: this.env,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    await appendFile(
      join(this.directory, "board-results.jsonl"),
      `${JSON.stringify({ argv: [join(this.directory, "bin", "backlog"), ...args], args, cwd: this.repo, stdin: "ignore", pid: child.pid, stdout, stderr, code })}\n`,
    );
    if (code !== 0) throw new Error(`backlog fixture failed: ${stderr} ${stdout}`);

    return stdout;
  }

  async boardSnapshot(): Promise<string> {
    const output = await this.boardCommand("task", "view", "TASK-1", "--json");
    if (JSON.parse(output).schemaVersion !== 1) throw new Error("unsupported real board schema");

    return output;
  }

  async boardBytes(): Promise<string> {
    const { readdir } = await import("node:fs/promises");
    const board = await realpath(join(this.repo, "backlog"));
    const files = await readdir(join(board, "tasks"));
    const file = files.find((name) => name.endsWith(".md"));
    if (!file) throw new Error("fixture task missing");

    return readFile(join(board, "tasks", file), "utf8");
  }

  async boardTargetRoute(kind: "control" | "symlink" | "config" | "ambient") {
    const native = this.env.FAKE_NATIVE_BACKLOG;
    if (!native) throw new Error("real native fixture is required");
    const boardA = await realpath(join(this.repo, "backlog"));
    const projectB = join(this.directory, "project-B");
    const boardB = join(projectB, "backlog");
    const anchor = join(this.directory, "anchor-A");
    await mkdir(anchor);
    await symlink(boardA, join(anchor, "backlog"));
    await mkdir(boardB, { recursive: true });
    for (const name of ["tasks", "docs", "decisions"]) await mkdir(join(boardB, name));
    const config = await readFile(join(boardA, "config.yml"), "utf8");
    await writeFile(join(boardB, "config.yml"), config);
    const command = (args: string[], cwd: string, env = this.env) => {
      const result = spawnSync([native, ...args], { cwd, env, stdin: "ignore" });
      const receipt = {
        argv: [native, ...args],
        cwd,
        env: {
          BACKLOG_CWD: env.BACKLOG_CWD ?? null,
          USE_GLOBAL_TASK_ID_LOCK: env.USE_GLOBAL_TASK_ID_LOCK ?? null,
        },
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
        exit: result.exitCode,
      };
      return receipt;
    };
    const envB = { ...this.env, BACKLOG_CWD: projectB, USE_GLOBAL_TASK_ID_LOCK: undefined };
    const created = command(
      ["task", "create", "foreign target", "--status", "Build", "--no-dod-defaults"],
      projectB,
      envB,
    );
    if (created.exit !== 0) throw new Error(created.stderr);
    if (kind === "config" || kind === "control") {
      await symlink(boardA, join(this.repo, "route-a"));
      await symlink(boardB, join(this.repo, "route-b"));
      await writeFile(
        join(this.repo, "backlog.config.yml"),
        `${config}\nbacklog_directory: route-a\n`,
      );
      await writeFile(
        join(this.repo, ".gitignore"),
        "backlog\n.gitignore\nroute-a\nroute-b\nbacklog.config.yml\n",
      );
      if (kind === "control")
        await writeFile(join(boardA, "config.yml"), config.replace('"Build", ', ""));
    }
    const lock = join(boardB, ".locks", "task-task-1");
    let owned:
      | {
          readonly child: ReadableSubprocess;
          readonly owner: OwnedProcessGroup;
          stdout?: Promise<string>;
          stderr?: Promise<string>;
        }
      | undefined;
    let captured = false;
    const attempts = [];
    try {
      for (let attempt = 0; attempt < 30; attempt++) {
        const child = spawn(
          [native, "task", "edit", "TASK-1", "--notes", `owned native writer ${attempt}`],
          {
            cwd: projectB,
            env: envB,
            detached: true,
            stdin: "ignore",
            stdout: "pipe",
            stderr: "pipe",
          },
        );
        owned = { child, owner: new OwnedProcessGroup(child.pid) };
        const stdout = new Response(child.stdout).text();
        owned.stdout = stdout;
        const stderr = new Response(child.stderr).text();
        owned.stderr = stderr;
        const deadline = performance.now() + 3000;
        while (child.exitCode === null && performance.now() < deadline) {
          if (
            existsSync(lock) &&
            owned.owner.identity().members.some((member) => member.pid === child.pid)
          ) {
            signal(child.pid, "SIGSTOP");
            break;
          }
          await sleep(1);
        }
        const ps = spawnSync(
          ["/bin/ps", "-p", String(child.pid), "-o", "pid=,ppid=,pgid=,stat=,command="],
          { env: this.env },
        );
        attempts.push({
          pid: child.pid,
          ps: ps.stdout.toString(),
          stderr: ps.stderr.toString(),
          exit: ps.exitCode,
        });
        if (child.exitCode === null && /\sT\S*\s/.test(ps.stdout.toString())) {
          captured = true;
          break;
        }
        await this.finishBoardTargetWriter(owned);
        owned = undefined;
      }
      if (!(captured && owned))
        throw new Error("actual ordinary native writer lock was not captured");

      const owner = owned.owner;
      const heldIdentity = await lstat(lock);
      const contender = command(
        ["task", "edit", "TASK-1", "--assignee", "@contender"],
        projectB,
        envB,
      );
      const wrapper = join(this.directory, "bin", "backlog");
      const ready = join(this.directory, "route-preflight.json");
      const trace = join(this.directory, "route-commands.jsonl");
      await writeFile(
        wrapper,
        `#!${process.execPath}
import {existsSync,readFileSync,writeFileSync,appendFileSync,unlinkSync,symlinkSync} from "node:fs";
import {spawnSync} from "bun";
const args=process.argv.slice(2);
if(args[0]==="--version" && !existsSync(${JSON.stringify(ready)})) {
 writeFileSync(${JSON.stringify(ready)},JSON.stringify({BACKLOG_CWD:process.env.BACKLOG_CWD,cwd:process.cwd()}));
 if(${JSON.stringify(kind)}==="symlink"){unlinkSync(${JSON.stringify(join(this.repo, "backlog"))});symlinkSync(${JSON.stringify(boardB)},${JSON.stringify(join(this.repo, "backlog"))});}
 if(${JSON.stringify(kind)}==="config")writeFileSync(${JSON.stringify(join(this.repo, "backlog.config.yml"))},readFileSync(${JSON.stringify(join(this.repo, "backlog.config.yml"))},"utf8").replace("backlog_directory: route-a","backlog_directory: route-b"));
}
const p=spawnSync([${JSON.stringify(native)},...args],{env:process.env,stdin:"ignore"});
appendFileSync(${JSON.stringify(trace)},JSON.stringify({argv:[${JSON.stringify(native)},...args],cwd:process.cwd(),BACKLOG_CWD:process.env.BACKLOG_CWD,bypass:process.env.USE_GLOBAL_TASK_ID_LOCK??null,stdout:p.stdout.toString(),stderr:p.stderr.toString(),exit:p.exitCode})+"\\n");
process.stdout.write(p.stdout);process.stderr.write(p.stderr);process.exit(p.exitCode);
`,
      );
      if (kind === "ambient") this.env.BACKLOG_CWD = projectB;
      const run = await this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
      const state = (cwd: string) =>
        JSON.parse(
          command(["task", "view", "TASK-1", "--json"], cwd, { ...this.env, BACKLOG_CWD: cwd })
            .stdout,
        );
      const current = await lstat(lock);
      const board = kind === "ambient" ? boardB : boardA;
      const targets = await readdir(join(board, ".iterate", "targets")).catch((error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
        throw error;
      });
      const targetPath = targets.find(
        (name) => name.startsWith("project-") && name.endsWith(".json"),
      );
      const target = targetPath
        ? JSON.parse(await readFile(join(board, ".iterate", "targets", targetPath), "utf8"))
        : undefined;
      const result = {
        run,
        boardA,
        boardB: await realpath(boardB),
        A: state(anchor),
        B: state(projectB),
        contender,
        originalLock: { dev: heldIdentity.dev, ino: heldIdentity.ino },
        lockWhileHeld: { dev: current.dev, ino: current.ino },
        target,
        trace: (await readFile(trace, "utf8"))
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line)),
        attempts,
        heldIdentity: owner.identity(),
      };
      await writeFile(
        join(this.directory, "board-target-result.json"),
        JSON.stringify(result, null, 2),
      );
      return result;
    } finally {
      if (owned) await this.finishBoardTargetWriter(owned);
      delete this.env.BACKLOG_CWD;
    }
  }

  private async finishBoardTargetWriter(owned: {
    readonly child: ReadableSubprocess;
    readonly owner: OwnedProcessGroup;
    readonly stdout?: Promise<string>;
    readonly stderr?: Promise<string>;
  }): Promise<void> {
    const identity = owned.owner.identity();
    const receipt = join(this.directory, "board-target-cleanup.json");

    const settlement = await owned.owner.cancel("SIGCONT");
    if (settlement.state !== "settled") {
      await writeFile(receipt, JSON.stringify({ identity, settlement }));
      throw new Error("ordinary native writer cleanup remains uncertain; inspect its receipt");
    }

    const exit = await owned.child.exited;
    const stdout = await (owned.stdout ?? new Response(owned.child.stdout).text());
    const stderr = await (owned.stderr ?? new Response(owned.child.stderr).text());

    await writeFile(receipt, JSON.stringify({ identity, exit, stdout, stderr, settlement }));
  }

  async configInitialization(
    kind:
      | "initialize"
      | "unknown-addition"
      | "wrong-default"
      | "changed-field"
      | "missing-trigger"
      | "later-drift",
  ) {
    const board = await realpath(join(this.repo, "backlog"));
    const rootConfig = join(this.repo, "backlog.config.yml");
    const template = await readFile(join(import.meta.dir, "backlog-config.yml"), "utf8");
    const source = `${template.replace("PLACEHOLDER", "root-only initialization")}\nbacklog_directory: backlog\n${kind === "missing-trigger" ? "default_port: 6420\n" : ""}`;
    await writeFile(rootConfig, source);
    await appendFile(join(this.repo, ".gitignore"), "backlog.config.yml\n");
    const task = (await readdir(join(board, "tasks"))).find((name) => name.endsWith(".md"));
    if (!task) throw new Error("native task fixture is missing");
    const taskPath = join(board, "tasks", task);
    const phase = join(this.directory, "config-initialization.json");
    await this.wrapRealBoard(
      `
const phase = ${JSON.stringify(phase)};
const kind = ${JSON.stringify(kind)};
const config = process.env.BACKLOG_CWD ? join(process.env.BACKLOG_CWD, "backlog.config.yml") : "";
const initial = args[0] === "task" && args[1] === "view" && !existsSync(phase);
const readState = () => ({ config: readFileSync(config,"utf8"), configIdentity: lstatSync(config), task: readFileSync(${JSON.stringify(taskPath)},"utf8"), folderConfig: readFileSync(${JSON.stringify(join(board, "config.yml"))},"utf8"), source: readFileSync(${JSON.stringify(rootConfig)},"utf8") });
const before = initial ? readState() : undefined;
`,
      `
if(initial && result.exitCode === 0) {
 const nativeAfter = readState();
 if(kind === "unknown-addition") appendFileSync(config,"\\nunknown_initialization_field: true\\n");
 if(kind === "wrong-default") writeFileSync(config,readFileSync(config,"utf8").replace("max_column_width: 80","max_column_width: 81"));
 if(kind === "changed-field") writeFileSync(config,readFileSync(config,"utf8").replace("remote_operations: false","remote_operations: true"));
 if(kind === "missing-trigger") appendFileSync(config,"\\nmax_column_width: 80\\n");
 writeFileSync(phase,JSON.stringify({ argv: [real,...args], cwd: process.cwd(), BACKLOG_CWD: process.env.BACKLOG_CWD, bypass: process.env.USE_GLOBAL_TASK_ID_LOCK??null, before, nativeAfter, after: readState(), boardLock: readFileSync(${JSON.stringify(join(board, ".iterate", "TASK-1.lock"))},"utf8"), treeLock: readFileSync(${JSON.stringify(join(this.repo, ".git", "iterate", "lock"))},"utf8"), claimPresent: existsSync(${JSON.stringify(join(board, ".iterate", "TASK-1.json"))}), calls: readFileSync(${JSON.stringify(join(this.directory, "calls"))},"utf8"), stdout: result.stdout.toString(), stderr: result.stderr.toString(), exit: result.exitCode }));
}
if(kind === "later-drift" && args[0] === "--version" && existsSync(phase)) appendFileSync(config,"\\nunknown_later_field: true\\n");
`,
    );
    const result = await this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    const observed = JSON.parse(await readFile(phase, "utf8"));
    const targets = await this.targetViews();
    const original = await readFile(rootConfig, "utf8");
    const taskBytes = await readFile(taskPath, "utf8");
    await writeFile(
      join(this.directory, "config-initialization-result.json"),
      JSON.stringify({ kind, source, original, result, observed, targets, taskBytes }, null, 2),
    );
    return { result, source, original, observed, targets, taskBytes };
  }

  async initializableTargetConfig(): Promise<void> {
    const path = join(await realpath(join(this.repo, "backlog")), "config.yml");
    const before = await readFile(path, "utf8");
    const after = before.replace(/^default_port:.*\n/m, "");
    if (after === before) throw new Error("fixture default_port line was not present");

    await writeFile(path, after);
    await writeFile(
      join(this.directory, "target-source-config.json"),
      JSON.stringify({ path, before, after }),
    );
  }

  async retainedTarget() {
    const stage = await this.stageReceipt();
    const intentPath = stage.path.slice(0, -".stage.json".length);
    const intent = await readFile(intentPath, "utf8");
    const marker = markerSchema.parse(JSON.parse(intent));
    if (!marker.target) throw new Error("fixture original target manifest is missing");

    return { target: marker.target, marker, intent, stage };
  }

  async targetSnapshot(target: z.infer<typeof boardTargetSchema>) {
    const snapshot = async (path: string) => {
      const identity = await lstat(path).catch((error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
        throw error;
      });
      if (!identity) return null;

      return Object.assign(
        {
          identity: {
            dev: identity.dev,
            ino: identity.ino,
            uid: identity.uid,
            mode: identity.mode,
          },
        },
        definedFields({
          bytes: identity.isFile() ? await readFile(path, "utf8") : undefined,
          link: identity.isSymbolicLink() ? await readlink(path) : undefined,
          entries: identity.isDirectory() ? (await readdir(path)).sort() : undefined,
        }),
      );
    };
    const result = {
      config: await snapshot(join(target.view, "backlog.config.yml")),
      link: await snapshot(join(target.view, "backlog")),
      view: await snapshot(target.view),
      evidence: await snapshot(target.evidence),
      board: await snapshot(target.board),
      taskBytes: await this.boardBytes(),
      boardConfig: await readFile(join(target.board, "config.yml"), "utf8"),
      boardLock: await this.lockBytes().catch(() => null),
      treeLock: await snapshot(join(this.repo, ".git", "iterate", "lock")),
    };
    await appendFile(
      join(this.directory, "target-finalization-snapshots.jsonl"),
      JSON.stringify(result) + "\n",
    );
    return result;
  }

  async traceTargetCommands(): Promise<void> {
    const trace = join(this.directory, "target-cli-trace.jsonl");
    await writeFile(trace, "");
    await this.wrapRealBoard(
      `appendFileSync(${JSON.stringify(trace)}, JSON.stringify({ argv: process.argv, pid: process.pid, BACKLOG_CWD: process.env.BACKLOG_CWD }) + "\\n");`,
      "",
    );
  }

  async replaceTarget(
    kind: "config" | "link" | "view" | "extra" | "board" | "cleaned-replacement",
  ) {
    const { target } = await this.retainedTarget();
    const path =
      kind === "board"
        ? target.board
        : kind === "view"
          ? target.view
          : kind === "link"
            ? join(target.view, "backlog")
            : join(target.view, "backlog.config.yml");
    const before = await lstat(path);
    const backup = join(this.directory, `target-original-${kind}`);
    if (kind === "extra") {
      await writeFile(join(target.view, "unknown-entry"), "unowned data");
    } else {
      await rename(path, backup);
      if (kind === "board") {
        await cp(backup, path, {
          recursive: true,
          dereference: false,
          filter: (source) =>
            source !== join(backup, ".iterate") && source !== join(backup, ".locks"),
        });
        await rename(join(backup, ".iterate"), join(path, ".iterate"));
        await rename(join(backup, ".locks"), join(path, ".locks"));
      } else if (kind === "view") await mkdir(path, { mode: 0o700 });
      else if (kind === "link") await symlink(target.board, path);
      else await writeFile(path, await readFile(backup), { flag: "wx", mode: 0o600 });
      if (kind === "cleaned-replacement") {
        const record = JSON.parse(await readFile(target.evidence, "utf8"));
        await writeFile(target.evidence, JSON.stringify({ ...record, state: "cleaned" }));
      }
    }
    const after = await lstat(path);
    const result = {
      kind,
      path,
      backup,
      original: { dev: before.dev, ino: before.ino },
      replacement: { dev: after.dev, ino: after.ino },
      originalStillAllocated: kind === "extra" || existsSync(backup),
    };
    await writeFile(
      join(this.directory, `target-replacement-${kind}.json`),
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  async corruptTargetProof(
    kind: "manifest" | "record" | "fifo" | "conflict" | "ancestor" | "completion",
  ) {
    const original = await this.retainedTarget();
    const { target, marker } = original;
    if (kind === "manifest") {
      const { target: _target, ...without } = marker;
      await writeFile(marker.intent, JSON.stringify(without));
    } else if (kind === "record" || kind === "fifo") {
      await rename(target.evidence, join(this.directory, "original-target-record.json"));
      if (kind === "fifo") {
        const created = spawnSync(["/usr/bin/mkfifo", "-m", "600", target.evidence], {
          stdin: "ignore",
        });
        if (created.exitCode !== 0) throw new Error(created.stderr.toString());
      }
    } else if (kind === "conflict") {
      const record = JSON.parse(await readFile(target.evidence, "utf8"));
      await writeFile(
        target.evidence,
        JSON.stringify({ ...record, configBytes: `${record.configBytes}# changed\n` }),
      );
    } else if (kind === "completion") {
      await writeFile(
        `${marker.intent}.recovery-${marker.token}.json.completed.json`,
        JSON.stringify({
          at: new Date().toISOString(),
          run: marker.run,
          token: "00000000-0000-4000-8000-000000000000",
        }),
      );
    } else {
      const ancestor = dirname(target.view);
      const backup = join(this.directory, "original-targets-ancestor");
      await rename(ancestor, backup);
      await symlink(backup, ancestor);
    }
    return original;
  }

  async targetFinalizationRace() {
    const original = await this.retainedTarget();
    const foreign = await this.independentTree();
    await this.stagePersistenceFault("target-gate");
    const recovering = this.recoverStage();
    let result: Awaited<ReturnType<WorkflowDriver["run"]>>;
    try {
      await this.waitFor(join(this.directory, "target-gate.ready"));
      const before = await this.targetSnapshot(original.target);
      const marker = await this.nativeMarker();
      const guardPath = `${original.marker.intent}.recovery-lock`;
      const guard = { bytes: await readFile(guardPath, "utf8"), identity: await lstat(guardPath) };
      const env = { ...this.env };
      delete env.FAKE_RUNNER_FAULT;
      const contender = await this.harness.run(this.repo, env, [
        "recover",
        "TASK-1",
        "--run",
        original.marker.run,
        "--intent",
        original.marker.token,
        "--evidence",
        "exact fixture contender",
      ]);
      const same = await this.harness.run(this.repo, env, [
        "step",
        "TASK-1",
        "--model",
        "sonnet",
        "--effort",
        "high",
      ]);
      const other = await this.harness.run(foreign, env, [
        "step",
        "TASK-1",
        "--model",
        "sonnet",
        "--effort",
        "high",
      ]);
      const native = await this.nativeRecoveryContender();
      const after = await this.targetSnapshot(original.target);
      const guardAfter = {
        bytes: await readFile(guardPath, "utf8"),
        identity: await lstat(guardPath),
      };
      const observation = {
        before,
        after,
        marker,
        markerAfter: await this.nativeMarker(),
        guard,
        guardAfter,
        contender,
        same,
        other,
        native,
      };
      await writeFile(
        join(this.directory, "target-finalization-race.json"),
        JSON.stringify(observation, null, 2),
      );
      return {
        ...observation,
        recovered: await (async () => {
          await writeFile(join(this.directory, "target-gate.release"), "release");
          return recovering;
        })(),
      };
    } finally {
      await writeFile(join(this.directory, "target-gate.release"), "release");
      result = await recovering;
      delete this.env.FAKE_RUNNER_FAULT;
      await writeFile(
        join(this.directory, "target-finalization-race-result.json"),
        JSON.stringify(result, null, 2),
      );
    }
  }

  async targetViews() {
    const board = await realpath(join(this.repo, "backlog"));
    const directory = join(board, ".iterate", "targets");
    const records = [];
    for (const name of await readdir(directory)) {
      if (!(name.startsWith("project-") && name.endsWith(".json"))) continue;
      const record = boardTargetRecordSchema.parse(
        JSON.parse(await readFile(join(directory, name), "utf8")),
      );
      const viewExists = existsSync(record.view);
      if (viewExists) {
        records.push({
          record,
          viewExists,
          config: await readFile(join(record.view, "backlog.config.yml"), "utf8"),
          link: await readlink(join(record.view, "backlog")),
          identity: await lstat(record.view),
        });
      } else {
        records.push({ record, viewExists });
      }
    }
    await writeFile(
      join(this.directory, "target-view-snapshot.json"),
      JSON.stringify(records, null, 2),
    );
    return records;
  }

  async holdBoardLock(id = "TASK-1"): Promise<void> {
    const directory = join(this.repo, "backlog", ".iterate");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, `${id}.lock`),
      JSON.stringify({ pid: process.pid, fixture: "explicitly held" }),
    );
  }

  async interruptStage(abrupt = false): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    const gate = join(this.directory, "interrupt-stage");
    this.env.FAKE_DISPATCH_GATE = gate;
    const running = this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    let stage: Awaited<ReturnType<WorkflowDriver["stageReceipt"]>> | undefined;
    try {
      await this.waitFor(`${gate}.ready`);
      const handoffDeadline = performance.now() + 5000;
      while (await this.nativeMarker()) {
        if (performance.now() > handoffDeadline)
          throw new Error("stage native handoff did not complete");
        await sleep(10);
      }
      stage = await this.stageReceipt();
      if (!stage.value.identity) throw new Error("stage has no owned process identity");

      await writeFile(
        join(this.directory, "interrupt-signal.json"),
        JSON.stringify({ abrupt, identity: stage.value.identity }),
      );
      process.kill(stage.value.identity.ownerPid, abrupt ? "SIGKILL" : "SIGINT");
      return await running;
    } finally {
      if (stage?.value.identity) signal(-stage.value.identity.pid, "SIGKILL");
      await writeFile(gate, "release fixture");
      await running;
      delete this.env.FAKE_DISPATCH_GATE;
    }
  }

  async stagePersistenceFault(kind: import("./runner-faults.ts").FaultKind): Promise<void> {
    this.env.FAKE_RUNNER_FAULT = kind;
    this.env.FAKE_RUNNER_DIRECTORY = this.directory;
  }

  async replacementEvidence(kind: "identity" | "terminal") {
    return {
      fault: JSON.parse(await readFile(join(this.directory, `stage-fault-${kind}`), "utf8")),
      restored: JSON.parse(
        await readFile(join(this.directory, `fault-restored-${kind}.json`), "utf8"),
      ),
    };
  }

  async providerUnavailableAfterPreflight(): Promise<void> {
    this.env.PATH = `${join(this.directory, "bin")}:/usr/bin:/bin`;
    await writeFile(
      join(this.directory, "cli", "claude"),
      '#!/bin/bash\nif [ "$1" = --version ]; then\n  rm -- "$0"\n  echo 2.1.fixture\n  exit 0\nfi\nexit 91\n',
      { mode: 0o755 },
    );
  }

  async stageReceipt(): Promise<{ path: string; value: z.infer<typeof stageReceiptSchema> }> {
    const board = await realpath(join(this.repo, "backlog"));
    const directory = join(board, ".iterate", "transactions");
    const entries = (await readdir(directory)).filter((name) => name.endsWith(".stage.json"));
    const values = await Promise.all(
      entries.map(async (name) => ({
        path: join(directory, name),
        value: stageReceiptSchema.parse(JSON.parse(await readFile(join(directory, name), "utf8"))),
      })),
    );
    const record = JSON.parse((await this.run("status", "TASK-1")).stdout);
    const found = values.find((entry) => entry.value.attempt === record.attempts.at(-1)?.id);
    if (!found) throw new Error("fixture has no current stage receipt");

    return found;
  }

  async recoverAgainstLiveStageTarget(): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    const child = spawn(["/bin/sleep", "30"], {
      detached: true,
      stdout: "ignore",
      stderr: "ignore",
      stdin: "ignore",
    });
    try {
      const { path, value } = await this.stageReceipt();
      const group = new OwnedProcessGroup(child.pid);
      await writeFile(
        path,
        JSON.stringify({
          ...value,
          identity: { ...group.identity(), ownerPid: value.identity?.ownerPid },
        }),
      );
      return await this.recoverStage();
    } finally {
      signal(-child.pid, "SIGKILL");
      await child.exited;
    }
  }

  async nativeRecoveryContender(): Promise<number> {
    const env = { ...this.env };
    delete env.USE_GLOBAL_TASK_ID_LOCK;
    const argv = [
      join(this.directory, "bin", "backlog"),
      "task",
      "edit",
      "TASK-1",
      "--assignee",
      "@human",
    ];
    const child = spawn(argv, {
      cwd: this.repo,
      env,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    await appendFile(
      join(this.directory, "recovery-native-contender.jsonl"),
      JSON.stringify({ argv, pid: child.pid, stdin: "ignore", stdout, stderr, code }) + "\n",
    );

    return code;
  }

  async corruptStageEvidence(
    kind:
      | "report"
      | "receipt"
      | "journal"
      | "claim"
      | "lock"
      | "live-owner"
      | "foreign-owner"
      | "backend",
  ): Promise<void> {
    const { path, value } = await this.stageReceipt();
    if (kind === "report") {
      await appendFile(value.reportPath ?? "", " ");
    } else if (kind === "receipt") {
      await writeFile(
        path,
        JSON.stringify({ ...value, token: "00000000-0000-4000-8000-000000000000" }),
      );
    } else if (kind === "journal" || kind === "claim") {
      const recordPath = join(value.journal, "run.json");
      const record = JSON.parse(await readFile(recordPath, "utf8"));
      if (kind === "claim") record.runClaim.assignee = "@foreign-fixture";
      else record.limits.durationMs = 1;
      await writeFile(recordPath, JSON.stringify(record));
    } else if (kind === "lock") {
      await writeFile(join(this.repo, ".git", "iterate", "lock"), "replacement owner");
    } else {
      const intent = path.slice(0, -".stage.json".length);
      const marker = JSON.parse(await readFile(intent, "utf8"));
      if (kind === "live-owner") marker.owner.pid = process.pid;
      else if (kind === "backend") marker.backend.sha256 = "0".repeat(64);
      else marker.owner.host = "foreign-host";
      await writeFile(intent, JSON.stringify(marker));
    }
  }

  async recoverEarlierNativeIntent(): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    const stage = await this.stageReceipt();
    const directory = dirname(stage.path);
    const names = (await readdir(directory)).filter((name) =>
      /^TASK-1\.[0-9a-f-]{36}\.json$/.test(name),
    );
    const markers = await Promise.all(
      names.map(async (name) => JSON.parse(await readFile(join(directory, name), "utf8"))),
    );
    const earlier = markers.find(
      (marker) =>
        marker.token !== stage.value.token &&
        marker.run === stage.value.run &&
        marker.owner.pid === stage.value.identity?.ownerPid,
    );
    if (!earlier) throw new Error("fixture has no earlier native intent for this execution");

    await writeFile(
      join(this.directory, "earlier-recovery-intent.json"),
      JSON.stringify(earlier, null, 2),
    );
    return this.run(
      "recover",
      "TASK-1",
      "--run",
      earlier.run,
      "--intent",
      earlier.token,
      "--evidence",
      "Operator names a private fixture's earlier intent to check exact-current-intent refusal",
    );
  }

  async recoverStage(wrongToken = false): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    const { value } = await this.stageReceipt();
    return this.run(
      "recover",
      "TASK-1",
      "--run",
      value.run,
      "--intent",
      wrongToken ? "00000000-0000-4000-8000-000000000000" : value.token,
      "--evidence",
      "Operator inspected the exact original stage report, process identity and retained locks",
    );
  }

  async legacyOwnership(id: string): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const run = JSON.parse(await readFile(join(root, `${id}.json`), "utf8"));
    const path = join(root, run, "run.json");
    const record = JSON.parse(await readFile(path, "utf8"));
    delete record.runClaim;
    await writeFile(path, JSON.stringify(record));
    await rm(join(this.repo, "backlog", ".iterate", `${id}.json`));
    await this.boardCommand("task", "edit", id, "--assignee", "@claude");
  }

  async independentTree(): Promise<string> {
    const repo = await mkdtemp(join(this.directory, "independent-"));
    const child = spawn(["git", "init", "-q", repo], {
      env: this.env,
      stdout: "pipe",
      stderr: "pipe",
    });
    if ((await child.exited) !== 0) throw new Error(await new Response(child.stderr).text());
    await writeFile(join(repo, ".gitignore"), "backlog\n.gitignore\n");
    await symlink(await realpath(join(this.repo, "backlog")), join(repo, "backlog"));

    return repo;
  }

  async raceDispatches(sameRun = false): Promise<{
    winner: Awaited<ReturnType<WorkflowDriver["run"]>>;
    loser: Awaited<ReturnType<WorkflowHarness["run"]>>;
    loserJournal: boolean;
  }> {
    const other = sameRun ? this.repo : await this.independentTree();
    this.env.FAKE_DISPATCH_GATE = join(this.directory, "dispatch-gate");
    const winning = this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    const deadline = Date.now() + 10_000;
    while (!(await file(`${this.env.FAKE_DISPATCH_GATE}.ready`).exists())) {
      if (Date.now() > deadline) throw new Error("winner never reached its dispatch gate");
      await sleep(10);
    }

    const loser = await this.harness.run(other, this.env, [
      "step",
      "TASK-1",
      "--model",
      "sonnet",
      "--effort",
      "high",
    ]);
    await writeFile(this.env.FAKE_DISPATCH_GATE, "release");
    const winner = await winning;
    const loserJournal = await file(join(other, ".git", "iterate", "current.json")).exists();

    return { winner, loser, loserJournal };
  }

  async fileChangeDuringPreflight(kind: "stop" | "dirty" | "allowance"): Promise<void> {
    const executable = join(this.directory, "cli", "claude");
    await rename(executable, `${executable}.real`);
    await writeFile(
      executable,
      `#!${process.execPath}
import { spawnSync } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
if (process.argv[2] === "--version") {
  const kind = ${JSON.stringify(kind)};
  if (kind === "allowance") {
    const root = ${JSON.stringify(join(this.repo, ".git", "iterate"))};
    const id = JSON.parse(readFileSync(join(root, "TASK-1.json"), "utf8"));
    const path = join(root, id, "run.json");
    const record = JSON.parse(readFileSync(path, "utf8")); record.limits.durationMs = 0;
    writeFileSync(path, JSON.stringify(record));
  } else writeFileSync(${JSON.stringify(this.repo)} + (kind === "stop" ? "/.iterate-stop" : "/preflight-dirty"), "external preflight edit");
}
const result = spawnSync([${JSON.stringify(executable + ".real")}, ...process.argv.slice(2)], { env: process.env });
process.stdout.write(result.stdout); process.stderr.write(result.stderr); process.exit(result.exitCode);
`,
      { mode: 0o755 },
    );
  }

  async editDuringPreflight(args: readonly string[]): Promise<void> {
    const executable = join(this.directory, "cli", "claude");
    await rename(executable, `${executable}.real`);
    await writeFile(
      executable,
      `#!${process.execPath}
import { spawnSync } from "bun";
import { writeFileSync } from "node:fs";
if (process.argv[2] === "--version") {
  const edit = spawnSync([${JSON.stringify(join(this.directory, "bin", "backlog"))}, "task", "edit", "TASK-1", ...${JSON.stringify(args)}], { env: process.env });
  writeFileSync(${JSON.stringify(join(this.directory, "preflight-edit.json"))}, JSON.stringify({ code: edit.exitCode, stdout: edit.stdout.toString(), stderr: edit.stderr.toString() }));
}
const result = spawnSync([${JSON.stringify(executable + ".real")}, ...process.argv.slice(2)], { env: process.env });
process.stdout.write(result.stdout); process.stderr.write(result.stderr); process.exit(result.exitCode);
`,
      { mode: 0o755 },
    );
  }

  async scheduleHumanEdit(
    phase: "before-acquire" | "before-release" | "after-stage",
  ): Promise<void> {
    const board = await realpath(join(this.repo, "backlog"));
    const once = join(this.directory, "scheduled-human-result");
    await this.wrapRealBoard(
      "",
      `
if (args[0] === "task" && args[1] === "view" && result.exitCode === 0 && !existsSync(${JSON.stringify(once)})) {
  const phase = ${JSON.stringify(phase)};
  const snapshot = JSON.parse(result.stdout.toString()).task;
  const markerHeld = existsSync(${JSON.stringify(join(board, ".locks", "task-task-1"))});
  const claimed = existsSync(${JSON.stringify(join(board, ".iterate", "TASK-1.json"))});
  const { readdirSync } = await import("node:fs");
  const transactions = ${JSON.stringify(join(board, ".iterate", "transactions"))};
  const completedStage = existsSync(transactions) && readdirSync(transactions).filter((name) => name.endsWith(".stage.json")).some((name) => JSON.parse(readFileSync(join(transactions, name), "utf8")).state === "completed");
  const eligible = !markerHeld && ((phase === "before-acquire" && !claimed && snapshot.assignees.length === 0) || (phase === "before-release" && claimed && snapshot.status === "Done") || (phase === "after-stage" && completedStage && snapshot.status === "Shape"));
  if (eligible) {
    const edit = spawnSync([real, "task", "edit", "TASK-1", "--assignee", "@human"], { env: process.env });
    const after = spawnSync([real, "task", "view", "TASK-1", "--json"], { env: process.env });
    writeFileSync(${JSON.stringify(once)}, JSON.stringify({ phase, markerHeld, beforeAssignees: snapshot.assignees, code: edit.exitCode, stdout: edit.stdout.toString(), stderr: edit.stderr.toString(), afterCode: after.exitCode, after: after.stdout.toString(), assignees: after.exitCode === 0 ? JSON.parse(after.stdout.toString()).task.assignees : null }));
  }
}
`,
    );
  }

  async humanEditResult(): Promise<{
    code: number;
    assignees: string[];
    phase: string;
    markerHeld: boolean;
  }> {
    return JSON.parse(await readFile(join(this.directory, "scheduled-human-result"), "utf8"));
  }

  async gateBoardRead(
    phase: "before-claim" | "native",
  ): Promise<{ ready: string; release: string }> {
    const ready = join(this.directory, "board-gate.ready");
    const release = join(this.directory, "board-gate.release");
    const board = await realpath(join(this.repo, "backlog"));
    await this.wrapRealBoard(`
if (args[0] === "task" && args[1] === "view" && !existsSync(${JSON.stringify(ready)})) {
  const nativeHeld = existsSync(${JSON.stringify(join(board, ".locks", "task-task-1"))});
  const noClaim = !existsSync(${JSON.stringify(join(board, ".iterate", "TASK-1.json"))});
  const eligible = ${JSON.stringify(phase)} === "native" ? nativeHeld : !nativeHeld && noClaim;
  if (eligible) {
    writeFileSync(${JSON.stringify(ready)}, String(process.ppid));
    while (!existsSync(${JSON.stringify(release)})) await Bun.sleep(10);
  }
}
`);
    return { ready, release };
  }

  private async wrapRealBoard(before: string, after = ""): Promise<void> {
    const executable = join(this.directory, "bin", "backlog");
    await rename(executable, `${executable}.real`);
    await writeFile(
      executable,
      `#!${process.execPath}
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, appendFileSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { spawnSync, spawn } from "bun";
const args = process.argv.slice(2);
const real = ${JSON.stringify(executable + ".real")};
${before}
const result = spawnSync([real, ...args], { env: process.env });
${after}
process.stdout.write(result.stdout); process.stderr.write(result.stderr); process.exit(result.exitCode);
`,
      { mode: 0o755 },
    );
  }

  async failOwnershipWrite(
    kind:
      | "refusal"
      | "lost-ack"
      | "descendants"
      | "history"
      | "active"
      | "journal"
      | "receipt"
      | "pending",
    field: "--assignee" | "--status" = "--assignee",
  ): Promise<() => Promise<void>> {
    const once = join(this.directory, "write-fault-once");
    const fault = `args[0] === "task" && args[1] === "edit" && args.includes(${JSON.stringify(field)}) && !existsSync(${JSON.stringify(once)})`;
    if (kind === "refusal") {
      await this.wrapRealBoard(
        `if (${fault}) { writeFileSync(${JSON.stringify(once)}, "hit"); console.error("injected assignment refusal"); process.exit(1); }`,
      );
      return async () => {};
    }
    if (kind === "descendants") {
      await this.wrapRealBoard(`if (${fault}) {
        writeFileSync(${JSON.stringify(once)}, "hit");
        const child = spawn(["/bin/sh", "-c", "trap '' TERM; sleep 60"], { stdin: "ignore", stdout: "inherit", stderr: "inherit" });
        writeFileSync(${JSON.stringify(join(this.directory, "board-child-pids"))}, JSON.stringify([process.pid, child.pid]));
        process.on("SIGTERM", () => {});
        await new Promise(() => {});
      }`);
      return async () => {};
    }
    await this.wrapRealBoard(
      "",
      `if (${fault}) {
      writeFileSync(${JSON.stringify(once)}, "hit");
      ${
        kind === "lost-ack"
          ? 'console.error("injected lost acknowledgement after board write"); process.exit(1);'
          : `
      const board = ${JSON.stringify(join(this.repo, "backlog"))};
      const pending = JSON.parse(readFileSync(join(board, ".iterate", "TASK-1.pending.json"), "utf8"));
      const target = ${kind === "history" ? 'join(board, ".iterate", "TASK-1." + pending.run + ".json")' : kind === "active" ? 'join(board, ".iterate", "TASK-1.json")' : kind === "receipt" ? 'pending.intent + ".completed.json"' : kind === "pending" ? 'join(board, ".iterate", "TASK-1.pending.json")' : 'join(pending.journal, "run.json")'};
      if (existsSync(target)) renameSync(target, target + ".fault-backup");
      mkdirSync(target);
      writeFileSync(${JSON.stringify(join(this.directory, "blocked-write-target"))}, target);
      `
      }
    }`,
    );
    return kind === "lost-ack" ? async () => {} : () => this.restoreOwnershipWrite();
  }

  async interruptOwnershipTransition(
    operation: "acquire" | "release",
    selectors: readonly string[],
  ): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    if (operation === "release") {
      await this.run("step", "TASK-1", ...selectors);
      await this.boardCommand("task", "edit", "TASK-1", "--status", "Done");
    }
    await this.failOwnershipWrite("lost-ack");
    return this.run("step", "TASK-1", ...selectors);
  }

  async restoreOwnershipWrite(): Promise<void> {
    const target = await readFile(join(this.directory, "blocked-write-target"), "utf8");
    await rm(target, { recursive: true });
    if (await file(`${target}.fault-backup`).exists())
      await rename(`${target}.fault-backup`, target);
  }

  async waitFor(path: string): Promise<void> {
    const until = Date.now() + 10_000;
    while (!(await file(path).exists())) {
      if (Date.now() > until) throw new Error(`fixture gate not reached: ${path}`);
      await sleep(10);
    }
  }

  async raceInitialClaims(): Promise<{
    loser: Awaited<ReturnType<WorkflowHarness["run"]>>;
    winner: Awaited<ReturnType<WorkflowDriver["run"]>>;
    loserJournal: boolean;
    claimBefore: boolean;
  }> {
    const other = await this.independentTree();
    const gate = await this.gateBoardRead("before-claim");
    const winning = this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    await this.waitFor(gate.ready);
    const claimBefore = await file(join(this.repo, "backlog", ".iterate", "TASK-1.json")).exists();
    const loser = await this.harness.run(other, this.env, [
      "step",
      "TASK-1",
      "--model",
      "sonnet",
      "--effort",
      "high",
    ]);
    await writeFile(gate.release, "release");
    return {
      loser,
      winner: await winning,
      claimBefore,
      loserJournal: await file(join(other, ".git", "iterate", "current.json")).exists(),
    };
  }

  async holdDeadOwnerLock(): Promise<string> {
    const exited = spawn([process.execPath, "-e", "process.exit(0)"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    await exited.exited;
    const path = join(this.repo, "backlog", ".iterate", "TASK-1.lock");
    await mkdir(join(this.repo, "backlog", ".iterate"), { recursive: true });
    await writeFile(
      path,
      JSON.stringify({
        host: "fixture-observed-exit",
        pid: exited.pid,
        user: process.getuid?.(),
        evidence: "exited process observed by harness",
      }),
    );
    return readFile(path, "utf8");
  }

  async lockBytes(): Promise<string> {
    return readFile(join(this.repo, "backlog", ".iterate", "TASK-1.lock"), "utf8");
  }

  async nativeMarker(): Promise<string | undefined> {
    try {
      return await readFile(join(this.repo, "backlog", ".locks", "task-task-1"), "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async nativeGateScenario(
    age: boolean | "paused" = false,
    done = false,
  ): Promise<{
    heldEdit: number;
    markerPreserved: boolean;
    runner: Awaited<ReturnType<WorkflowDriver["run"]>>;
  }> {
    const gate = await this.gateBoardRead("native");
    const running = this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    await this.waitFor(gate.ready);
    const marker = await this.nativeMarker();
    if (age === "paused") {
      const owner = JSON.parse(marker ?? "{}");
      process.kill(owner.owner.pid, "SIGSTOP");
      await sleep(11_000);
    } else if (age) {
      const { utimes } = await import("node:fs/promises");
      const old = new Date(Date.now() - 30_000);
      await utimes(join(this.repo, "backlog", ".locks", "task-task-1"), old, old);
    }
    const human = spawnSync(
      [
        join(this.directory, "bin", "backlog.real"),
        "task",
        "edit",
        "TASK-1",
        "--assignee",
        "@human",
      ],
      { cwd: this.repo, env: this.env },
    );
    await appendFile(
      join(this.directory, "native-contention.jsonl"),
      JSON.stringify({
        code: human.exitCode,
        stdout: human.stdout.toString(),
        stderr: human.stderr.toString(),
        marker,
      }) + "\n",
    );
    const markerPreserved = (await this.nativeMarker()) === marker;
    if (age === "paused") process.kill(JSON.parse(marker ?? "{}").owner.pid, "SIGCONT");
    await writeFile(gate.release, "release");
    return { heldEdit: human.exitCode, markerPreserved, runner: await running };
  }

  async crashNativeTransaction(): Promise<{
    result: Awaited<ReturnType<WorkflowDriver["run"]>>;
    marker: string | undefined;
    lock: string;
  }> {
    const gate = await this.gateBoardRead("native");
    const running = this.run("step", "TASK-1", "--model", "sonnet", "--effort", "high");
    await this.waitFor(gate.ready);
    const marker = await this.nativeMarker();
    const owner = JSON.parse(marker ?? "{}");
    process.kill(owner.owner.pid, "SIGKILL");
    const result = await running;
    // The held child is a read-only fixture command. Settle that known child; do not touch the marker.
    await writeFile(gate.release, "settle read-only fixture child");
    return { result, marker, lock: await this.lockBytes() };
  }

  async holdNativeLock(): Promise<string> {
    const path = join(this.repo, "backlog", ".locks", "task-task-1");
    await mkdir(path, { recursive: true });
    await writeFile(join(path, "fixture-owner"), "ordinary native lock must not be removed");
    return path;
  }

  async retainSettledTransition(): Promise<void> {
    const { link } = await import("node:fs/promises");
    const board = await realpath(join(this.repo, "backlog"));
    const pending = JSON.parse(
      await readFile(join(board, ".iterate", "TASK-1.pending.json"), "utf8"),
    );
    const original = join(board, ".iterate", "transactions", `TASK-1.${pending.token}.json`);
    const marker = JSON.parse(await readFile(original, "utf8"));
    await link(original, join(board, ".locks", "task-task-1"));
    await writeFile(join(board, ".iterate", "TASK-1.lock"), JSON.stringify(marker.owner));
    await writeFile(join(this.repo, ".git", "iterate", "lock"), String(marker.owner.pid));
    marker.locks = await Promise.all(
      [
        join(board, ".iterate", "TASK-1.lock"),
        join(await realpath(this.repo), ".git", "iterate", "lock"),
      ].map(async (path) => {
        const identity = await lstat(path);
        return { path, bytes: await readFile(path, "utf8"), dev: identity.dev, ino: identity.ino };
      }),
    );
    await writeFile(original, JSON.stringify(marker, null, 2) + "\n");
    const executionPath = join(
      board,
      ".iterate",
      "transactions",
      `TASK-1.${marker.execution}.execution.json`,
    );
    const execution = JSON.parse(await readFile(executionPath, "utf8"));
    execution.locks = marker.locks;
    await writeFile(executionPath, JSON.stringify(execution, null, 2) + "\n");
  }

  async replaceBoardLockWithIdenticalBytes(): Promise<string> {
    const path = join(this.repo, "backlog", ".iterate", "TASK-1.lock");
    const bytes = await readFile(path, "utf8");
    const original = await lstat(path);
    await rename(path, `${path}.original-fixture-lock`);
    await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
    const replacement = await lstat(path);
    await writeFile(
      join(this.directory, "replacement-lock.json"),
      JSON.stringify({
        bytes,
        original: { dev: original.dev, ino: original.ino },
        replacement: { dev: replacement.dev, ino: replacement.ino },
      }),
    );

    return bytes;
  }

  async recoveryArtifacts(marker: string): Promise<{
    intent: string;
    audits: readonly unknown[];
    completions: readonly unknown[];
  }> {
    const { intent } = JSON.parse(marker);
    const paths = (await readdir(dirname(intent)))
      .filter(
        (name) =>
          name.startsWith(`${basename(intent)}.recovery-`) &&
          name.endsWith(".json") &&
          !name.endsWith(".completed.json"),
      )
      .map((name) => join(dirname(intent), name));
    return {
      intent: await readFile(intent, "utf8"),
      audits: await Promise.all(
        paths.map(async (path) => JSON.parse(await readFile(path, "utf8"))),
      ),
      completions: await Promise.all(
        paths.map(async (path) => JSON.parse(await readFile(`${path}.completed.json`, "utf8"))),
      ),
    };
  }

  async recoverTransaction(
    wrongToken = false,
  ): Promise<Awaited<ReturnType<WorkflowDriver["run"]>>> {
    const marker = JSON.parse((await this.nativeMarker()) ?? "{}");
    return this.run(
      "recover",
      "TASK-1",
      "--run",
      marker.run,
      "--intent",
      wrongToken ? "00000000-0000-4000-8000-000000000000" : marker.token,
      "--evidence",
      "Operator inspected this exact fixture run and retained intent, confirmed its settled child receipts and authorizes recovery",
    );
  }

  async cliProcesses(): Promise<{ pid: number; running: boolean }[]> {
    const pids: number[] = JSON.parse(
      await readFile(join(this.directory, "board-child-pids"), "utf8"),
    );
    return pids.map((pid) => {
      try {
        process.kill(pid, 0);
        return { pid, running: true };
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ESRCH")
          return { pid, running: false };
        throw error;
      }
    });
  }

  async useUnreadableNearestBoard(location: "nearer" | "configured" = "nearer"): Promise<string> {
    if (location === "configured") {
      await writeFile(
        join(this.repo, "backlog.config.yml"),
        'project_name: "iterate-p4-fixture"\nbacklog_directory: "loop"\n',
      );
      await symlink("loop", join(this.repo, "loop"));

      return this.repo;
    }

    const nested = join(this.repo, "stat-failure");
    const board = join(nested, "backlog");

    await mkdir(board, { recursive: true });
    await symlink("config.yml", join(board, "config.yml"));
    await appendFile(join(this.repo, ".gitignore"), "stat-failure\n");

    return nested;
  }

  async useNestedConfiguredBoard(): Promise<string> {
    await rename(join(this.repo, "backlog"), join(this.repo, "configured-board"));
    const template = await readFile(join(import.meta.dir, "backlog-config.yml"), "utf8");
    await writeFile(
      join(this.repo, "backlog.config.yml"),
      `${template.replace("PLACEHOLDER", "configured fixture")}\nbacklog_directory: configured-board\n`,
    );
    await appendFile(
      join(this.repo, ".gitignore"),
      "configured-board\nbacklog.config.yml\nsubdir\n",
    );
    const nested = join(this.repo, "subdir", "deeper");
    await mkdir(nested, { recursive: true });
    return nested;
  }

  async captureBoardEnvironment(): Promise<void> {
    await this.wrapRealBoard(
      `appendFileSync(${JSON.stringify(join(this.directory, "board-env.jsonl"))}, JSON.stringify({ args, bypass: process.env.USE_GLOBAL_TASK_ID_LOCK ?? null }) + "\\n");`,
    );
  }
  async boardEnvironment(): Promise<{ args: string[]; bypass: string | null }[]> {
    return (await readFile(join(this.directory, "board-env.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  async providerArguments(): Promise<string[][]> {
    return (await readFile(join(this.directory, "argv"), "utf8"))
      .split("\0\0")
      .filter(Boolean)
      .map((entry) => entry.split("\0"));
  }
  async providerBypass(): Promise<string> {
    return readFile(join(this.directory, "provider-bypass"), "utf8");
  }

  async unsupportedBoardVersion(): Promise<void> {
    await this.wrapRealBoard(
      'if (args[0] === "--version") { console.log("9.0.0"); process.exit(0); }',
    );
  }

  async unboundNativeEdit() {
    const stage = await this.stageReceipt();
    const intent = stage.path.slice(0, -".stage.json".length);
    const before = await this.boardBytes();
    const beforeCommands = await readdir(dirname(intent));
    const argv = [
      process.execPath,
      join(import.meta.dir, "ownership-entry.ts"),
      "unbound-native",
      intent,
    ];
    const child = spawn(argv, {
      cwd: this.repo,
      env: this.env,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    const receipt = {
      argv,
      cwd: this.repo,
      stdin: "ignore",
      pid: child.pid,
      stdout,
      stderr,
      code,
      before,
      after: await this.boardBytes(),
      beforeCommands,
      afterCommands: await readdir(dirname(intent)),
    };
    await writeFile(
      join(this.directory, "unbound-native-edit.json"),
      JSON.stringify(receipt, null, 2),
    );
    return receipt;
  }

  async ownershipBoundary(provider: string, stage: string): Promise<string> {
    const child = spawn(
      [process.execPath, join(import.meta.dir, "ownership-entry.ts"), provider, stage],
      { cwd: this.repo, env: this.env, stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    if (code !== 0) throw new Error(stderr);

    return stdout;
  }

  async journalBytes(id = "DOT-1"): Promise<string | undefined> {
    const root = join(this.repo, ".git", "iterate");
    try {
      const runId = JSON.parse(await readFile(join(root, `${id}.json`), "utf8"));
      return await readFile(join(root, runId, "run.json"), "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async claimBytes() {
    const directory = join(this.repo, "backlog", ".iterate");
    const names = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();

    return Promise.all(
      names.map(async (name) => [name, await readFile(join(directory, name), "utf8")]),
    );
  }

  async replaceRecordedRuntimeFingerprint(fingerprint: string, id = "DOT-1"): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const runId = JSON.parse(await readFile(join(root, `${id}.json`), "utf8"));
    const path = join(root, runId, "run.json");
    const record = JSON.parse(await readFile(path, "utf8"));
    record.attempts.at(-1).runtime.fingerprint = fingerprint;
    await writeFile(path, JSON.stringify(record));
  }

  async setRuntimeInstruction(bytes: Buffer | undefined): Promise<void> {
    await appendFile(join(this.repo, ".gitignore"), "AGENTS.md\n");
    const path = join(this.repo, "AGENTS.md");
    if (bytes === undefined) {
      await rm(path, { force: true });
      return;
    }

    await writeFile(path, bytes);
  }

  async changeRuntimeConfig(): Promise<void> {
    await mkdir(join(this.repo, ".claude"), { recursive: true });
    await writeFile(
      join(this.repo, ".claude", "settings.json"),
      JSON.stringify({ model: "changed-default" }),
    );
  }

  async changeRuntimeMcp(): Promise<void> {
    await writeFile(
      join(this.env.CLAUDE_CONFIG_DIR, ".claude.json"),
      JSON.stringify({ mcpServers: { changed: { command: "fixture-tool" } } }),
    );
  }

  async breakRuntimeConfig(): Promise<void> {
    await mkdir(join(this.env.CLAUDE_CONFIG_DIR, "settings.json"));
  }

  async setRuntimeMcpToggle(
    field: "enabledMcpServers" | "disabledMcpServers",
    servers: readonly string[],
  ): Promise<void> {
    await writeFile(
      join(this.env.CLAUDE_CONFIG_DIR, ".claude.json"),
      JSON.stringify({ projects: { [await realpath(this.repo)]: { [field]: servers } } }),
    );
  }

  async setRuntimeMcpEnvironment(value: string): Promise<void> {
    this.env.ITERATE_TEST_MCP_URL = value;
    await writeFile(
      join(this.repo, ".mcp.json"),
      JSON.stringify({
        mcpServers: { example: { type: "http", url: "${ITERATE_TEST_MCP_URL}/mcp" } },
      }),
    );
  }

  async blockRuntimeConfig(): Promise<void> {
    const child = spawn(["mkfifo", join(this.env.CLAUDE_CONFIG_DIR, "settings.json")]);
    if ((await child.exited) !== 0) throw new Error("creating the runtime FIFO fixture failed");
  }

  async linkRuntimeConfig(): Promise<void> {
    const target = join(this.directory, "linked-settings.json");
    await writeFile(target, "{}");
    await symlink(target, join(this.env.CLAUDE_CONFIG_DIR, "settings.json"));
  }

  async blockJournalRead(component: "index" | "record"): Promise<void> {
    const root = join(this.repo, ".git", "iterate");
    const index = join(root, "current.json");
    const runId = JSON.parse(await readFile(index, "utf8"));
    const path = component === "index" ? index : join(root, runId, "run.json");
    await readFile(path);
    await rename(path, `${path}.saved`);
    const child = spawn(["mkfifo", path]);
    if ((await child.exited) !== 0) throw new Error("creating the journal FIFO fixture failed");
  }

  async versionProcesses(): Promise<{ pid: number; running: boolean }[]> {
    const pids = (await readFile(join(this.directory, "version-pids"), "utf8")).trim().split(" ");
    return pids.map((value) => {
      const pid = Number(value);
      try {
        process.kill(pid, 0);
        return { pid, running: true };
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;

        return { pid, running: false };
      }
    });
  }

  addUnrelatedWork = () => writeFile(join(this.repo, "unrelated"), "preserve this edit");
  setAssignee = (assignee: string) => writeFile(join(this.directory, "assignee"), assignee);
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

  run = async (...args: string[]) => this.runAt(this.repo, args);

  runFrom = async (directory: string, ...args: string[]) =>
    this.runAt(join(this.repo, directory), args);

  private runAt = (cwd: string, args: string[]) =>
    this.harness.admitRunnerCall(this.directory, async () => {
      const { stdout, stderr, code } = await this.harness.run(cwd, this.env, args);
      const [calls, edits, systems, deferredDispatches, argsSeen] =
        await this.harness.collectEvidence(this.directory, async () => {
          const reads = ["calls", "edits", "systems", "deferred-dispatches", "arguments"].map(
            (name) => readFile(join(this.directory, name), "utf8"),
          );
          try {
            return await Promise.all(reads);
          } finally {
            await Promise.allSettled(reads);
          }
        });

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
    });
}

function signal(pid: number, name: NodeJS.Signals): void {
  try {
    process.kill(pid, name);
  } catch (error) {
    if (!(error instanceof Error && "code" in error) || error.code !== "ESRCH") throw error;
  }
}
