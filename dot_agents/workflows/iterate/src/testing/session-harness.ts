import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { chmodSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createServer, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { z } from "zod";

type Provider = "claude" | "codex";
type Scenario = "success" | "malformed" | "error" | "truncated" | "interrupt";
const registration = z.object({
  role: z.enum(["agent", "descendant"]),
  pid: z.number().int().positive(),
});
const missingProcess = z.object({ code: z.literal("ESRCH") });

export class SessionHarness {
  private readonly runs: SessionDriver[] = [];

  static setup(): SessionHarness {
    return new SessionHarness();
  }

  async start(provider: Provider, scenario: Scenario = "success"): Promise<SessionDriver> {
    const driver = new SessionDriver();
    this.runs.push(driver);
    await driver.start(provider, scenario);
    return driver;
  }

  async teardown(): Promise<void> {
    await Promise.all(this.runs.map((run) => run.teardown()));
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

  async start(provider: Provider, scenario: Scenario): Promise<void> {
    const controlPath = join(this.directory, "control.sock");
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(controlPath, resolve);
    });
    const executable = join(this.directory, provider);
    copyFileSync(join(import.meta.dir, "session-fake.ts"), executable);
    chmodSync(executable, 0o700);
    this.child = spawn(process.execPath, [join(import.meta.dir, "session-entry.ts")], {
      detached: true,
      cwd: this.directory,
      env: {
        ...process.env,
        PATH: `${this.directory}:${dirname(process.execPath)}`,
        TMPDIR: this.directory,
        SESSION_PROVIDER: provider,
        SESSION_SCENARIO: scenario,
        SESSION_CONTROL: controlPath,
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
    await this.waitFor(() => this.peers.get("agent")?.ready === true);
  }

  async progress(): Promise<{ stdout: string; stderr: string }> {
    await this.waitFor(() => this.stderr.includes("progress before final"));
    return { stdout: this.stdout, stderr: this.stderr };
  }

  async finish(): Promise<{ code: number | null; stdout: string }> {
    this.peers.get("agent")?.socket.write("finish\n");
    const code = await bounded(this.exited);
    return { code, stdout: this.stdout };
  }

  async interrupt(): Promise<{ code: number | null; stopped: string[] }> {
    await this.waitFor(() => this.peers.get("descendant")?.ready === true);
    this.child?.kill("SIGINT");
    const code = await bounded(this.exited);
    await this.waitFor(() => [...this.peers.values()].every((peer) => peer.closed));
    return { code, stopped: [...this.peers.keys()].sort() };
  }

  async teardown(): Promise<void> {
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
