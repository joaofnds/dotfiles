import process from "node:process";
import { spawn } from "bun";
import { definedFields } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import { cancelOutputs } from "./output-cleanup.ts";
import { OwnedProcessGroup, type ProcessGroupSystem, processGroupSystem } from "./process-group.ts";

export type VersionProbeHost = {
  readonly spawn: (
    argv: string[],
    options: {
      readonly detached: true;
      readonly stdout: "pipe";
      readonly stderr: "pipe";
      readonly stdin: "ignore";
    },
  ) => {
    readonly pid: number;
    readonly stdout: ReadableStream<Uint8Array>;
    readonly stderr: ReadableStream<Uint8Array>;
    readonly exited: Promise<number>;
  };
  readonly processSystem: ProcessGroupSystem;
  readonly now: () => number;
  readonly signals: {
    readonly on: (signal: "SIGINT" | "SIGTERM", listener: () => void) => void;
    readonly off: (signal: "SIGINT" | "SIGTERM", listener: () => void) => void;
  };
  readonly schedule: (callback: () => void, milliseconds: number) => () => void;
};

const versionProbeHost: VersionProbeHost = {
  spawn: (argv, options) => spawn(argv, options),
  processSystem: processGroupSystem,
  now: () => performance.now(),
  signals: process,
  schedule: (callback, milliseconds) => {
    const timer = setTimeout(callback, milliseconds);
    return () => clearTimeout(timer);
  },
};
const runtimeProbeTimeoutMs = 2000;

export async function versionFor(
  {
    provider,
    executable,
  }: {
    readonly provider: string;
    readonly executable: string;
  },
  host: VersionProbeHost = versionProbeHost,
): Promise<string> {
  let pendingStop: string | undefined;
  let requestStop = (reason: string) => {
    pendingStop ??= reason;
  };
  const interrupted = () => requestStop("received SIGINT");
  const terminated = () => requestStop("received SIGTERM");

  host.signals.on("SIGINT", interrupted);
  host.signals.on("SIGTERM", terminated);

  try {
    const child = host.spawn([executable, "--version"], {
      detached: true,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
    });
    const cancelDeadline = host.schedule(
      () => requestStop(`exceeded the ${runtimeProbeTimeoutMs}ms version deadline`),
      runtimeProbeTimeoutMs,
    );
    const group = new OwnedProcessGroup(child.pid, host.processSystem);
    const stdout = outputReader(child.stdout);
    const stderr = outputReader(child.stderr);
    let failure: string | undefined;
    const diagnostics: string[] = [];
    let stopped = false;
    let shutdown: ReturnType<OwnedProcessGroup["cancel"]> | undefined;
    const stopping = Promise.withResolvers<undefined>();
    const stop = (reason: string) => {
      failure ??= reason;
      shutdown ??= group.cancel("SIGKILL");
      stopping.resolve(undefined);
    };
    requestStop = stop;
    if (pendingStop) stop(pendingStop);

    const complete = Promise.all([
      captureText(stdout, () => stopped),
      captureText(stderr, () => stopped),
      child.exited,
    ]).catch((error: unknown) => {
      stop(diagnostic(error));
    });
    let version = "";
    let cleanupDeadline: number | undefined;
    try {
      const outcome = await Promise.race([complete, stopping.promise]);
      if (outcome !== undefined && !shutdown) {
        const [output, errorOutput, code] = outcome;
        if (code !== 0 || !output.trim()) {
          stop(errorOutput.trim() || `exit ${code} without a version`);
        } else {
          version = output.trim();
          const observation = await group.settle();
          if (observation.state === "uncertain") {
            diagnostics.push(
              `completion settlement is uncertain: ${observation.errors.join("; ")}`,
            );
            stop("the version process exited before its recorded processes settled");
          }
        }
      }
      if (shutdown) {
        const settlement = await shutdown;
        if (settlement.state === "uncertain") {
          diagnostics.push(
            `process-group settlement is uncertain: ${settlement.errors.join("; ")}`,
          );
        }
        cleanupDeadline = host.now() + 200;
        let cancelDrain: (() => void) | undefined;
        try {
          const drained = await Promise.race([
            complete.then(() => true),
            new Promise<false>((resolve) => {
              cancelDrain = host.schedule(() => resolve(false), 200);
            }),
          ]);
          if (!drained)
            diagnostics.push(
              "version output or child exit did not drain within the 200ms settlement allowance",
            );
        } finally {
          cancelDrain?.();
        }
      }
    } finally {
      stopped = true;
      cancelDeadline();
      host.signals.off("SIGINT", interrupted);
      host.signals.off("SIGTERM", terminated);
      const cleanup = await cancelOutputs(
        Object.assign(
          { stdout, stderr, schedule: host.schedule },
          definedFields({
            allowanceMs:
              cleanupDeadline === undefined ? undefined : Math.max(0, cleanupDeadline - host.now()),
          }),
        ),
      );
      if (cleanup.state === "uncertain") diagnostics.push(...cleanup.errors);
    }
    if (failure || diagnostics.length > 0) {
      throw new Exit(
        1,
        `${provider} CLI version could not be established: ${[failure, ...diagnostics].filter(Boolean).join("; ")}`,
      );
    }

    return version;
  } finally {
    host.signals.off("SIGINT", interrupted);
    host.signals.off("SIGTERM", terminated);
  }
}

function outputReader(stream: ReadableStream<Uint8Array>) {
  try {
    return stream.getReader();
  } catch (error) {
    return { read: () => Promise.reject(error), cancel: () => stream.cancel() };
  }
}

async function captureText(
  reader: Pick<ReadableStreamDefaultReader<Uint8Array>, "read">,
  stopped: () => boolean,
): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";

  while (!stopped()) {
    const chunk = await reader.read();
    if (chunk.done || stopped()) break;

    text += decoder.decode(chunk.value, { stream: true });
  }

  return text + decoder.decode();
}

function diagnostic(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
