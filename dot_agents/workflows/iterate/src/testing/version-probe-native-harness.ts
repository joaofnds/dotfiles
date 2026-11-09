import { chmod, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import { OwnedProcessGroup, processGroupSystem } from "../process-group.ts";
import { type VersionProbeHost, versionFor } from "../version-probe.ts";

type ProbeChild = ReturnType<VersionProbeHost["spawn"]>;

export class VersionProbeNativeHarness implements VersionProbeHost {
  private readonly children = new Map<ProbeChild, OwnedProcessGroup>();
  private readonly directories = new Set<string>();
  private readonly observe: typeof versionFor;
  readonly cleanup: { readonly pid: number; readonly state: string; readonly reaped: boolean }[] =
    [];
  readonly processSystem = processGroupSystem;
  readonly signals = process;
  readonly now = () => performance.now();
  readonly schedule = (callback: () => void, milliseconds: number) => {
    const timer = setTimeout(callback, milliseconds);
    return () => clearTimeout(timer);
  };
  readonly spawn: VersionProbeHost["spawn"] = (argv, options) => {
    const child = spawn(argv, options);
    this.children.set(child, new OwnedProcessGroup(child.pid));
    return child;
  };

  constructor({ observe = versionFor }: { readonly observe?: typeof versionFor } = {}) {
    this.observe = observe;
  }

  async script(body: string): Promise<string> {
    const created = await mkdtemp(join(tmpdir(), "iterate-version-literal-"));
    this.directories.add(created);
    const directory = await realpath(created);
    const executable = join(directory, "fake $ 'quoted' `literal`\nversion");

    await writeFile(executable, body);
    await chmod(executable, 0o700);
    return executable;
  }

  async run(executable: string): Promise<string> {
    let cancelDeadline: (() => void) | undefined;
    let outcome: { readonly version: string } | { readonly error: unknown };
    const deadline = new Promise<never>((_resolve, reject) => {
      cancelDeadline = this.schedule(
        () => reject(new Error("native probe fixture exceeded 3000ms")),
        3000,
      );
    });

    try {
      outcome = {
        version: await Promise.race([
          this.observe({ provider: "fake", executable }, this),
          deadline,
        ]),
      };
    } catch (error) {
      outcome = { error };
    } finally {
      cancelDeadline?.();
    }

    try {
      await this.stopChildren();
    } catch (error) {
      outcome = {
        error:
          "error" in outcome
            ? new Error(`${String(outcome.error)}; fixture cleanup: ${String(error)}`)
            : error,
      };
    }

    if ("error" in outcome) throw outcome.error;

    return outcome.version;
  }

  trackedRoots(): number {
    return this.children.size;
  }

  async teardown(): Promise<void> {
    await this.stopChildren();
    const failures: string[] = [];
    for (const directory of this.directories) {
      try {
        await rm(directory, { recursive: true, force: true });
        this.directories.delete(directory);
      } catch (error) {
        failures.push(`${directory}: ${String(error)}`);
      }
    }

    if (failures.length > 0)
      throw new Error(`native fixture retains directories: ${failures.join("; ")}`);
  }

  private async stopChildren(): Promise<void> {
    const failures: string[] = [];
    for (const [child, group] of this.children) {
      const settlement = await group.cancel("SIGKILL");
      let cancelExitDeadline: (() => void) | undefined;
      let reaped = false;

      try {
        reaped = await Promise.race([
          child.exited.then(() => true),
          new Promise<false>((resolve) => {
            cancelExitDeadline = this.schedule(() => resolve(false), 200);
          }),
        ]);
      } finally {
        cancelExitDeadline?.();
      }
      this.cleanup.push({ pid: child.pid, state: settlement.state, reaped });
      if (settlement.state === "settled" && reaped) this.children.delete(child);
      else failures.push(`${child.pid}: ${settlement.state}; reaped=${reaped}`);
    }

    if (failures.length > 0)
      throw new Error(`native fixture retains uncertain roots: ${failures.join("; ")}`);
  }
}
