import process from "node:process";
import type { ProcessGroupSystem, ProcessMember } from "../process-group.ts";
import type { VersionProbeHost } from "../version-probe.ts";

const leader: ProcessMember = {
  pid: 123_456,
  parentPid: process.pid,
  groupId: 123_456,
  uid: process.getuid?.() ?? 501,
  started: "Tue Nov 3 23:00:00 2026",
  state: "S",
};

export class VersionProbeFake implements VersionProbeHost, ProcessGroupSystem {
  private rows: readonly ProcessMember[] = [leader];
  private readonly output = this.outputStream();
  private readonly errors = this.outputStream();
  private readonly exitResult = Promise.withResolvers<number>();
  private elapsed = 0;
  private resistant = false;
  private signalError: string | undefined;
  private inspectionError: Error | undefined;
  private retainOutput = false;
  private cleanup: "settled" | "failed" | "incomplete" = "settled";
  private startupError: Error | undefined;
  private startupSignal: "SIGINT" | "SIGTERM" | undefined;
  private outputClosed = false;
  readonly clock = {
    now: () => this.elapsed,
    wait: async (milliseconds: number) => {
      this.elapsed += milliseconds;
    },
  };
  readonly destructiveSignals: { readonly signal: NodeJS.Signals; readonly elapsed: number }[] = [];
  readonly requests: {
    readonly argv: string[];
    readonly options: Parameters<VersionProbeHost["spawn"]>[1];
  }[] = [];
  readonly processSystem = this;
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly timers = new Map<
    () => void,
    { readonly milliseconds: number; readonly at: number }
  >();
  private readonly awaitingDrain: (() => void)[] = [];
  readonly now = () => this.elapsed;
  readonly signals = {
    on: (signal: string, listener: () => void) => {
      const listeners = this.listeners.get(signal) ?? new Set<() => void>();
      listeners.add(listener);
      this.listeners.set(signal, listeners);
    },
    off: (signal: string, listener: () => void) => {
      this.listeners.get(signal)?.delete(listener);
    },
  };
  readonly schedule = (callback: () => void, milliseconds: number) => {
    let turn: ReturnType<typeof setImmediate> | undefined;
    this.timers.set(callback, { milliseconds, at: this.elapsed + milliseconds });
    if (milliseconds === 200) {
      for (const resume of this.awaitingDrain.splice(0)) resume();
    }
    // Due timers follow pending promise reactions; elapsed time stays virtual.
    if (milliseconds === 0) turn = setImmediate(() => this.fire(callback));

    return () => {
      clearImmediate(turn);
      this.timers.delete(callback);
    };
  };
  readonly spawn: VersionProbeHost["spawn"] = (argv, options) => {
    this.requests.push({ argv, options });
    if (this.startupSignal) this.interrupt(this.startupSignal);
    if (this.startupError) throw this.startupError;
    return {
      pid: leader.pid,
      stdout: this.output.stream,
      stderr: this.errors.stream,
      exited: this.exitResult.promise,
    };
  };
  readonly snapshot = () => {
    if (this.inspectionError) throw this.inspectionError;
    return this.rows;
  };
  readonly signal = (_groupId: number, signal: NodeJS.Signals | 0) => {
    if (signal !== 0) this.destructiveSignals.push({ signal, elapsed: this.elapsed });
    if (this.signalError)
      throw Object.assign(new Error(this.signalError), { code: this.signalError });
    if (this.rows.length === 0) throw Object.assign(new Error("ESRCH"), { code: "ESRCH" });
    if (signal !== 0 && (!this.resistant || signal === "SIGKILL")) {
      this.rows = [];
      this.exitResult.resolve(137);
      if (!this.retainOutput) this.closeOutput();
    }
  };
  finish(
    generation: "absent" | "replacement" | "lost-anchor" | "live-descendant" = "absent",
    version = "  fake 1.2.3\n",
    code = 0,
    stderr = "",
  ) {
    this.rows =
      generation === "live-descendant"
        ? this.rows.filter((member) => member.pid !== leader.pid)
        : generation === "absent"
          ? []
          : [
              Object.assign(
                {},
                leader,
                generation === "replacement"
                  ? { started: "Wed Nov 4 23:00:00 2026" }
                  : { pid: leader.pid + 1, parentPid: 1 },
              ),
            ];
    this.output.writer.enqueue(new TextEncoder().encode(version));
    this.errors.writer.enqueue(new TextEncoder().encode(stderr));
    this.closeOutput();
    this.exitResult.resolve(code);
  }
  private closeOutput() {
    if (this.outputClosed) return;

    this.outputClosed = true;
    this.output.writer.close();
    this.errors.writer.close();
  }
  resistUntilKill() {
    this.rows = [leader, { ...leader, pid: leader.pid + 1, parentPid: leader.pid }];
    this.resistant = true;
  }
  seedDescendant() {
    this.rows = [leader, { ...leader, pid: leader.pid + 1, parentPid: leader.pid }];
  }
  refuseSignals() {
    this.signalError = "EPERM";
  }
  failInspection() {
    this.inspectionError = new Error("process table unavailable");
  }
  keepOutputOpen(cleanup: "settled" | "failed" | "incomplete") {
    this.retainOutput = true;
    this.cleanup = cleanup;
  }
  fail(kind: "output" | "exit") {
    this.retainOutput = true;
    if (kind === "output") this.output.writer.error(new Error("fake output read failed"));
    else this.exitResult.reject(new Error("fake child exit failed"));
  }
  failSpawn() {
    this.startupError = new Error("spawn unavailable");
  }
  interruptDuringSpawn() {
    this.startupSignal = "SIGINT";
  }
  interrupt(signal: "SIGINT" | "SIGTERM") {
    for (const listener of this.listeners.get(signal) ?? []) listener();
  }
  deadline() {
    for (const [callback, timer] of this.timers)
      if (timer.milliseconds === 2000) this.fire(callback);
  }
  async drainDeadline() {
    if (![...this.timers.values()].some((timer) => timer.milliseconds === 200)) {
      await new Promise<void>((resolve) => this.awaitingDrain.push(resolve));
    }

    for (const [callback, timer] of this.timers)
      if (timer.milliseconds === 200) this.fire(callback);
  }
  private fire(callback: () => void) {
    const timer = this.timers.get(callback);
    if (!timer) return;

    this.elapsed = Math.max(this.elapsed, timer.at);
    this.timers.delete(callback);
    callback();
  }
  resources() {
    return {
      timers: this.timers.size,
      listeners: [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0),
    };
  }
  activeDeadline() {
    return [...this.timers.values()].map((timer) => timer.milliseconds);
  }
  elapsedMs() {
    return this.elapsed;
  }
  livingMembers() {
    return this.rows.length;
  }
  private outputStream() {
    let writer: ReadableStreamDefaultController<Uint8Array> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        writer = controller;
      },
      cancel: () => {
        if (this.cleanup === "failed") return Promise.reject(new Error("fake cancellation failed"));
        if (this.cleanup === "incomplete") return new Promise<void>(() => {});
        return Promise.resolve();
      },
    });
    if (!writer) throw new Error("stream did not start");
    return { stream, writer };
  }
}
