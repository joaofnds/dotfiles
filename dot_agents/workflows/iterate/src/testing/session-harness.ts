import { execFileSync, spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { setTimeout as wait } from "node:timers/promises";
import { z } from "zod";
import { defaultAgent } from "../agents.ts";
import { definedFields } from "../defined-fields.ts";
import {
  type PreparedSession,
  prepareSession,
  type RunningSession,
  SessionFailure,
  type SessionResult,
} from "../session.ts";
import { type LifecycleScenario, lifecycleAdapter, type SessionRules } from "./session-protocol.ts";

type Scenario =
  | "success"
  | "clock-backward"
  | "clock-forward"
  | "duplicate-terminal"
  | "conflicting-terminal"
  | "reordered-terminal"
  | "anonymous-reordered-terminal"
  | "anonymous-replayed-terminal"
  | "replayed-terminal"
  | "new-terminal-after-progress"
  | "regressed-cost"
  | "regressed-tokens"
  | "changed-accounting-session"
  | "no-result"
  | "no-final"
  | "later-no-final"
  | "unfinished-text"
  | "unfinished-tool"
  | "raw-stderr"
  | "nonzero"
  | "malformed-recognized"
  | "truncated-tail"
  | "unknown-tools"
  | "fixture-stdin"
  | "fixture-argv"
  | "idle"
  | "malformed"
  | "error"
  | "truncated"
  | "interrupt"
  | "interrupt-on-spawn"
  | "terminate-on-spawn"
  | "timeout"
  | "long"
  | "default-mode"
  | "denials"
  | "killed-at-exit"
  | "killed-unseen"
  | "killed-mid-turn"
  | "killed-between-results"
  | "reinvoked"
  | "reinvoked-grown"
  | "reinvoked-uncosted";
type Options = {
  readonly live?: boolean;
  readonly timeoutMs?: number;
  readonly idleTimeoutMs?: number;
  readonly prompt?: string;
  readonly resumeSessionId?: string;
};
type LifecycleOptions = {
  readonly timeoutMs?: number;
  readonly idleTimeoutMs?: number;
  readonly resumeSessionId?: string;
  readonly model?: string;
  readonly rules?: SessionRules;
};
const registration = z.object({
  role: z.enum(["agent", "descendant"]),
  pid: z.number().int().positive(),
});
const missingProcess = z.object({ code: z.literal("ESRCH") });

export class SessionHarness {
  private readonly runs = new Set<SessionDriver>();

  static setup(): SessionHarness {
    return new SessionHarness();
  }

  async start(scenario: Scenario = "success", options: Options = {}): Promise<SessionDriver> {
    const driver = new SessionDriver();
    this.runs.add(driver);
    await driver.start(scenario, options);
    return driver;
  }

  async teardown(): Promise<void> {
    const runs = [...this.runs];

    await Promise.all(runs.map((run) => run.teardown()));
    for (const run of runs) this.runs.delete(run);
  }
}

class SessionDriver {
  private readonly directory = mkdtempSync(join(tmpdir(), "iterate-session-test-"));
  private readonly changes = new EventEmitter();
  private readonly peers = new Map<
    string,
    { socket: Socket; pid: number; ready: boolean; closed: boolean }
  >();
  private readonly sockets = new Set<Socket>();
  private readonly server = createServer((socket) => this.connected(socket));
  private child: ReturnType<typeof spawn> | undefined;
  private exited: Promise<number | null> = Promise.resolve(null);
  stdout = "";
  stderr = "";

  async start(scenario: Scenario, options: Options): Promise<void> {
    execFileSync("git", ["-c", "init.defaultBranch=main", "init", "-q", this.directory]);

    const controlPath = join(this.directory, "control.sock");
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(controlPath, resolve);
    });
    const executable = join(this.directory, "cli", "claude");
    mkdirSync(dirname(executable));
    copyFileSync(join(import.meta.dir, "session-fake.ts"), executable);
    chmodSync(executable, 0o700);
    this.child = spawn(process.execPath, [join(import.meta.dir, "session-entry.ts")], {
      detached: true,
      cwd: this.directory,
      env: {
        ...process.env,
        PATH: `${this.directory}:${dirname(process.execPath)}:/usr/bin:/bin`,
        ITERATE_CLAUDE_CLI: executable,
        TMPDIR: this.directory,
        SESSION_SCENARIO: scenario,
        SESSION_CONTROL: controlPath,
        SESSION_LOG_DIRECTORY: this.directory,
        SESSION_RESUME_ID: options.resumeSessionId,
        SESSION_PROMPT: options.prompt,
        SESSION_INPUT_PATH: join(this.directory, "input.json"),
        SESSION_IDLE_TIMEOUT_MS: options.idleTimeoutMs?.toString(),
        ITERATE_LIVE: options.live === undefined ? undefined : options.live ? "1" : "0",
        SESSION_TIMEOUT_MS: options.timeoutMs?.toString(),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.child.stdout?.on("data", (chunk: Buffer) => {
      this.stdout += chunk.toString();
      this.changes.emit("change");
    });
    this.child.stderr?.on("data", (chunk: Buffer) => {
      this.stderr += chunk.toString();
      this.changes.emit("change");
    });
    this.exited = new Promise((resolve, reject) => {
      this.child?.once("error", reject);
      this.child?.once("close", resolve);
    });
    if (
      scenario !== "timeout" &&
      scenario !== "default-mode" &&
      scenario !== "interrupt-on-spawn" &&
      scenario !== "terminate-on-spawn"
    ) {
      await this.waitFor(() => this.peers.get("agent")?.ready === true);
    }
  }

  async finish(): Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
    result: Record<string, unknown> | undefined;
  }> {
    this.peers.get("agent")?.socket.write("finish\n");
    const code = await bounded(this.exited);
    return { code, stdout: this.stdout, stderr: this.stderr, result: this.sessionResult() };
  }

  async stopped(): Promise<{
    code: number | null;
    stopped: string[];
    result: Record<string, unknown> | undefined;
  }> {
    const code = await bounded(this.exited);
    await this.waitFor(() => [...this.peers.values()].every((peer) => peer.closed));
    return { code, stopped: [...this.peers.keys()].sort(), result: this.sessionResult() };
  }

  async interrupt(): Promise<{ code: number | null; stopped: string[] }> {
    await this.waitFor(() => this.peers.get("descendant")?.ready === true);
    this.child?.kill("SIGINT");
    const code = await bounded(this.exited);
    await this.waitFor(() => [...this.peers.values()].every((peer) => peer.closed));
    return { code, stopped: [...this.peers.keys()].sort() };
  }

  capturedInput(): unknown {
    return JSON.parse(readFileSync(join(this.directory, "input.json"), "utf8"));
  }

  recordedAttempt(): unknown {
    const root = join(this.directory, ".git", "iterate");
    const id = JSON.parse(readFileSync(join(root, "current.json"), "utf8"));
    const journal = JSON.parse(readFileSync(join(root, id, "run.json"), "utf8"));
    const attempt = journal.attempts.at(-1);
    return { ...attempt, report: JSON.parse(readFileSync(attempt.reportPath, "utf8")) };
  }

  processes(): { role: string; pid: number; running: boolean }[] {
    const registered = [...this.peers.entries()].map(([role, peer]) => ({ role, pid: peer.pid }));
    const spawned = join(this.directory, "spawned.pid");
    if (existsSync(spawned)) {
      registered.push({ role: "agent", pid: Number(readFileSync(spawned, "utf8")) });
    }

    return registered.map(({ role, pid }) => {
      let running = true;
      try {
        process.kill(pid, 0);
      } catch (error) {
        if (!missingProcess.safeParse(error).success) throw error;
        running = false;
      }
      return { role, pid, running };
    });
  }

  async teardown(): Promise<void> {
    const spawned = join(this.directory, "spawned.pid");
    if (existsSync(spawned)) kill(-Number(readFileSync(spawned, "utf8")));

    for (const peer of this.peers.values()) {
      if (!peer.closed) kill(peer.pid);
    }
    if (this.child?.pid && this.child.exitCode === null && this.child.signalCode === null) {
      kill(-this.child.pid);
    }
    for (const socket of this.sockets) socket.destroy();
    try {
      await bounded(this.exited);
    } finally {
      await new Promise<void>((resolve) => this.server.close(() => resolve()));
      rmSync(this.directory, { recursive: true, force: true });
    }
  }

  private connected(socket: Socket): void {
    this.sockets.add(socket);
    let peer: z.infer<typeof registration> | undefined;
    let pending = "";
    socket.on("error", () => socket.destroy());
    socket.on("data", (chunk) => {
      pending += chunk.toString();
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (line === "ready" && peer) {
          const current = this.peers.get(peer.role);
          if (current) current.ready = true;
        } else {
          peer = registration.parse(JSON.parse(line));
          this.peers.set(peer.role, { socket, pid: peer.pid, ready: false, closed: false });
          socket.write("start\n");
        }
      }
      this.changes.emit("change");
    });
    socket.on("close", () => {
      const current = peer && this.peers.get(peer.role);
      if (current) current.closed = true;
      this.changes.emit("change");
    });
  }

  private async waitFor(condition: () => boolean): Promise<void> {
    let changed = () => {};
    try {
      await bounded(
        new Promise<void>((resolve) => {
          changed = () => {
            if (condition()) resolve();
          };
          this.changes.on("change", changed);
          changed();
        }),
      );
    } finally {
      this.changes.off("change", changed);
    }
  }

  private sessionResult(): Record<string, unknown> | undefined {
    const line = this.stderr
      .split("\n")
      .find((candidate) => candidate.startsWith("SESSION_RESULT "));
    return line === undefined ? undefined : JSON.parse(line.slice("SESSION_RESULT ".length));
  }
}

function kill(pid: number): void {
  try {
    process.kill(pid, "SIGKILL");
  } catch (error) {
    if (!missingProcess.safeParse(error).success) throw error;
  }
}

async function bounded<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("session test handshake timed out")), 4000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class SessionLifecycleHarness {
  private readonly directory = mkdtempSync(join(tmpdir(), "iterate-lifecycle-test-"));
  private readonly running: RunningSession[] = [];
  private readonly fixtures = new Map<number, string>();
  private readonly stopped = new AbortController();

  prepare(scenario: LifecycleScenario, options: LifecycleOptions = {}): PreparedSession {
    const directory = mkdtempSync(join(this.directory, "run-"));
    const prepared = prepareSession(
      Object.assign(
        {
          agent:
            options.model === undefined ? defaultAgent : { ...defaultAgent, model: options.model },
          stage: "build" as const,
          card: "fixture",
          systemPrompt: "literal fixture prompt",
          logDirectory: directory,
        },
        definedFields({
          idleTimeoutMs: options.idleTimeoutMs,
          timeoutMs: options.timeoutMs,
          resumeSessionId: options.resumeSessionId,
        }),
      ),
      lifecycleAdapter(scenario, directory, options.rules),
    );
    return {
      logPath: prepared.logPath,
      start: () => {
        const running = prepared.start();
        this.running.push(running);
        this.fixtures.set(running.pid, directory);
        if (scenario === "output-error") {
          const log = readdirSync(directory).find((name) => name.endsWith(".log"));
          if (log === undefined) throw new Error("missing fixture log");
          rmSync(join(directory, log));
          mkdirSync(join(directory, log));
        }
        return running;
      },
    };
  }

  async releaseLeader(running: RunningSession): Promise<number> {
    const directory = this.fixtures.get(running.pid);
    if (directory === undefined) throw new Error("unknown fixture");
    const deadline = performance.now() + 4000;
    this.stopped.signal.throwIfAborted();
    while (!existsSync(join(directory, "ready"))) {
      if (performance.now() >= deadline) throw new Error("session test handshake timed out");

      await wait(5, undefined, { signal: this.stopped.signal });
    }

    const descendantPid = Number(readFileSync(join(directory, "descendant"), "utf8"));
    writeFileSync(join(directory, "release"), "release");
    return descendantPid;
  }

  async finish(running: RunningSession): Promise<SessionResult> {
    try {
      return await running.result;
    } catch (error) {
      if (error instanceof SessionFailure) return error.result;

      throw error;
    }
  }

  async teardown(): Promise<void> {
    this.stopped.abort();
    await Promise.all(
      this.running.map(async (running) => {
        await running.cancel("fixture teardown");
        await running.result.catch(() => {});
      }),
    );
    for (const directory of this.fixtures.values()) {
      if (existsSync(join(directory, "descendant"))) {
        kill(Number(readFileSync(join(directory, "descendant"), "utf8")));
      }
    }
    rmSync(this.directory, { recursive: true, force: true });
  }
}
