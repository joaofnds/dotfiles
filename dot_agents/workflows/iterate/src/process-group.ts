import { execFileSync } from "node:child_process";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";

export type ProcessMember = {
  readonly pid: number;
  readonly parentPid: number;
  readonly groupId: number;
  readonly uid: number;
  readonly started: string;
  readonly state: string;
};

export type GroupObservation = {
  readonly state: "settled" | "uncertain";
  readonly scope: "original-group-and-recorded-members";
  readonly unobservedDescendants: "unknown";
  readonly pid: number;
  readonly processGroupId: number;
  readonly evidence: readonly string[];
  readonly errors: readonly string[];
  readonly members: readonly ProcessMember[];
};

export type GroupSettlement = GroupObservation & {
  readonly priorObservations?: readonly GroupObservation[];
};

export type ProcessGroupClock = {
  readonly now: () => number;
  readonly wait: (milliseconds: number) => Promise<void>;
};

const elapsedClock: ProcessGroupClock = {
  now: () => performance.now(),
  wait: (milliseconds) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
};

export type ProcessGroupSystem = {
  readonly clock?: ProcessGroupClock;
  readonly snapshot: () => readonly ProcessMember[];
  readonly signal: (groupId: number, signal: NodeJS.Signals | 0) => void;
};

const errno = z.object({ code: z.string() });
const row = z.object({
  pid: z.coerce.number().int().positive(),
  parentPid: z.coerce.number().int().nonnegative(),
  groupId: z.coerce.number().int().nonnegative(),
  uid: z.coerce.number().int(),
  started: z
    .string()
    .regex(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):[0-5]\d:[0-6]\d \d{4}$/,
    ),
  state: z.string().regex(/^[A-Za-z?][A-Za-z+< >NnsltWX-]*$/),
});

export function parseProcessTable(output: string): readonly ProcessMember[] {
  if (!output.endsWith("\n")) throw new Error("incomplete process-table output");

  return output
    .trim()
    .split("\n")
    .map((line) => {
      const columns = line.trim().split(/\s+/);
      if (columns.length !== 10) throw new Error("invalid process-table row");

      return row.parse({
        pid: columns[0],
        parentPid: columns[1],
        groupId: columns[2],
        uid: columns[3],
        started: columns.slice(4, 9).join(" "),
        state: columns[9],
      });
    });
}

export const processGroupSystem: ProcessGroupSystem = {
  snapshot: () => {
    const output = execFileSync("/bin/ps", ["-axo", "pid=,ppid=,pgid=,uid=,lstart=,stat="], {
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
      timeout: 200,
      killSignal: "SIGKILL",
      maxBuffer: 8 * 1024 * 1024,
    });
    return parseProcessTable(output);
  },
  signal: (groupId, signal) => {
    process.kill(-groupId, signal);
  },
};

export const processGroupIdentitySchema = z
  .object({
    pid: z.number().int().positive(),
    processGroupId: z.number().int().positive(),
    ownerPid: z.number().int().positive(),
    members: z.array(row),
    errors: z.array(z.string()),
  })
  .refine(
    (identity) =>
      identity.pid === identity.processGroupId &&
      identity.members.every((member) => member.groupId === identity.pid),
    "inconsistent process-group identity",
  );

export type ProcessGroupIdentity = {
  readonly pid: number;
  readonly processGroupId: number;
  readonly ownerPid: number;
  readonly members: readonly ProcessMember[];
  readonly errors: readonly string[];
};

export class OwnedProcessGroup {
  private readonly clock: ProcessGroupClock;
  private readonly known = new Map<number, ProcessMember>();
  private cancellation: Promise<GroupSettlement> | undefined;
  private readonly birthErrors: string[] = [];
  private ownerPid = process.pid;
  private allowBirthAnchor = true;

  static restore(
    identity: unknown,
    os: ProcessGroupSystem = processGroupSystem,
  ): OwnedProcessGroup {
    const saved = processGroupIdentitySchema.parse(identity);
    return new OwnedProcessGroup(saved.pid, os, saved);
  }

  constructor(
    private readonly pid: number,
    private readonly os: ProcessGroupSystem = processGroupSystem,
    saved?: ProcessGroupIdentity,
  ) {
    this.clock = os.clock ?? elapsedClock;
    if (saved) {
      this.allowBirthAnchor = false;
      this.ownerPid = saved.ownerPid;
      this.birthErrors.push(...saved.errors);
      for (const member of saved.members) this.known.set(member.pid, member);
      return;
    }

    try {
      this.observe(this.members());
    } catch (error) {
      this.birthErrors.push(message(error));
    }
  }

  identity(): ProcessGroupIdentity {
    return {
      pid: this.pid,
      processGroupId: this.pid,
      ownerPid: this.ownerPid,
      members: [...this.known.values()].map((member) => ({ ...member })),
      errors: [...this.birthErrors],
    };
  }

  inspect(): GroupSettlement {
    const evidence: string[] = [];
    const errors: string[] = [];
    let members: readonly ProcessMember[] = [];
    let absent = false;

    try {
      try {
        this.os.signal(this.pid, 0);
        evidence.push("group signal-0 succeeded");
      } catch (error) {
        const code = errno.safeParse(error).data?.code;
        if (code === "ESRCH") {
          absent = true;
          evidence.push("group signal-0 returned ESRCH");
        } else {
          errors.push(`group signal-0: ${message(error)}`);
          if (code !== "EPERM") return this.receipt("uncertain", evidence, errors, members);
        }
      }

      const table = this.os.snapshot();
      const currentGroup = this.members(table);
      members = this.observedMembers(table);
      const owned = absent ? false : this.observe(currentGroup);
      const repeated = this.observedMembers(this.os.snapshot());
      if (!isDeepStrictEqual(members, repeated)) {
        errors.push("group membership or identity changed during inspection");
      } else if (
        members.some((member) => {
          const known = this.known.get(member.pid);
          return known?.started === member.started && known.uid !== member.uid;
        })
      ) {
        errors.push("a previously observed owned member changed credentials");
      } else if (
        members.some((member) => member.groupId !== this.pid && !member.state.startsWith("Z"))
      ) {
        errors.push("a previously observed owned member remains live outside the original group");
      } else if (absent) {
        if (currentGroup.length > 0)
          errors.push("the process group appeared after signal-0 reported absence");
        else return this.receipt("settled", evidence, errors, members);
      } else if (!owned) {
        errors.push("group identity has no surviving owned member");
      } else if (
        currentGroup.length > 0 &&
        currentGroup.every((member) => member.state.startsWith("Z"))
      ) {
        evidence.push("two complete snapshots establish the same whole owned group is zombie-only");
        return this.receipt("settled", evidence, errors, members);
      } else {
        errors.push(
          "the whole owned group is not proved terminal (live, stopped, absent or unknown members)",
        );
      }
    } catch (error) {
      errors.push(`process-table inspection: ${message(error)}`);
    }

    return this.receipt("uncertain", evidence, [...this.birthErrors, ...errors], members);
  }

  async settle(): Promise<GroupSettlement> {
    const deadline = this.clock.now() + 200;
    const priorObservations: GroupObservation[] = [];
    let observed = this.inspect();
    while (observed.state === "uncertain" && this.clock.now() < deadline) {
      priorObservations.push(observed);
      await this.clock.wait(25);
      observed = this.inspect();
    }

    return priorObservations.length === 0 ? observed : { ...observed, priorObservations };
  }

  cancel(signal: NodeJS.Signals = "SIGTERM"): Promise<GroupSettlement> {
    if (this.cancellation) return this.cancellation;

    this.cancellation = this.cancelGroup(signal);

    return this.cancellation;
  }

  private async cancelGroup(signal: NodeJS.Signals): Promise<GroupSettlement> {
    let observed = this.inspect();
    if (observed.state === "settled") return observed;

    const errors: string[] = [];
    this.send(signal, errors);
    const forceAt = this.clock.now() + 1000;
    const deadline = forceAt + 1000;
    let forced = false;
    while (this.clock.now() < deadline) {
      observed = this.inspect();
      if (observed.state === "settled") {
        return { ...observed, evidence: [...observed.evidence, ...errors] };
      }

      if (!forced && this.clock.now() >= forceAt) {
        forced = true;
        this.send("SIGKILL", errors);
      }
      await this.clock.wait(25);
    }

    return {
      ...observed,
      errors: [...observed.errors, ...errors, "process-group settlement deadline exceeded"],
    };
  }

  private send(signal: NodeJS.Signals, errors: string[]): void {
    try {
      if (!this.observe(this.members())) {
        errors.push(`refused ${signal}: process-group identity is uncertain`);
        return;
      }

      this.os.signal(this.pid, signal);
    } catch (error) {
      if (errno.safeParse(error).data?.code !== "ESRCH")
        errors.push(`group ${signal}: ${message(error)}`);
    }
  }

  private members(table = this.os.snapshot()): readonly ProcessMember[] {
    return table.filter((member) => member.groupId === this.pid).sort((a, b) => a.pid - b.pid);
  }

  private observedMembers(table: readonly ProcessMember[]): readonly ProcessMember[] {
    return table
      .filter((member) => {
        if (member.groupId === this.pid) return true;

        const known = this.known.get(member.pid);
        return known?.started === member.started;
      })
      .sort((a, b) => a.pid - b.pid);
  }

  private observe(members: readonly ProcessMember[]): boolean {
    if (members.length === 0) return false;

    const anchored = members.some((member) => {
      const known = this.known.get(member.pid);
      if (known) return known.uid === member.uid && known.started === member.started;

      return (
        this.allowBirthAnchor &&
        this.known.size === 0 &&
        member.pid === this.pid &&
        member.parentPid === process.pid &&
        member.uid === process.getuid?.()
      );
    });
    if (!anchored) return false;

    for (const member of members) {
      const known = this.known.get(member.pid);
      if (known && (known.uid !== member.uid || known.started !== member.started)) return false;
    }

    for (const member of members) this.known.set(member.pid, member);

    return true;
  }

  private receipt(
    state: GroupSettlement["state"],
    evidence: readonly string[],
    errors: readonly string[],
    members: readonly ProcessMember[],
  ): GroupSettlement {
    return {
      state,
      scope: "original-group-and-recorded-members",
      unobservedDescendants: "unknown",
      pid: this.pid,
      processGroupId: this.pid,
      evidence,
      errors,
      members,
    };
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
