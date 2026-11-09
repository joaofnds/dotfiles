import { afterAll, describe, expect, test } from "bun:test";
import process from "node:process";
import { spawn } from "bun";
import {
  OwnedProcessGroup,
  type ProcessGroupSystem,
  type ProcessMember,
  parseProcessTable,
} from "./process-group.ts";

const groupId = 123_456;
const leader: ProcessMember = {
  pid: groupId,
  parentPid: process.pid,
  groupId,
  uid: process.getuid?.() ?? 501,
  started: "Tue Nov 3 23:00:00 2026",
  state: "S",
};
const descendant: ProcessMember = { ...leader, pid: groupId + 1, parentPid: groupId };

class ElapsedClockFake {
  elapsed = 0;
  now = (): number => this.elapsed;
  wait = async (milliseconds: number): Promise<void> => {
    this.elapsed += milliseconds;
  };
}

class ProcessTableFake implements ProcessGroupSystem {
  readonly clock = new ElapsedClockFake();
  readonly signals: { readonly signal: NodeJS.Signals; readonly elapsed: number }[] = [];
  private rows: readonly ProcessMember[] = [leader, descendant];
  private output: string | undefined;
  private error: Error | undefined;
  private nextError: Error | undefined;
  private refusal: "EPERM" | "ESRCH" | "EIO" | undefined;
  private replacement: readonly ProcessMember[] | undefined;

  seed(rows: readonly ProcessMember[]): void {
    this.rows = rows;
    this.output = undefined;
  }
  seedTable(output: string): void {
    this.output = output;
  }
  refuse(code: "EPERM" | "ESRCH" | "EIO"): void {
    this.refusal = code;
  }
  failInspection(error: Error): void {
    this.error = error;
  }
  failNextInspection(error: Error): void {
    this.nextError = error;
  }
  race(rows: readonly ProcessMember[]): void {
    this.replacement = rows;
  }
  reset(): void {
    this.rows = [leader, descendant];
    this.output = undefined;
    this.error = undefined;
    this.nextError = undefined;
    this.refusal = undefined;
    this.replacement = undefined;
  }
  snapshot = (): readonly ProcessMember[] => {
    if (this.nextError) {
      const error = this.nextError;
      this.nextError = undefined;
      throw error;
    }

    if (this.error) throw this.error;

    if (this.output !== undefined) return parseProcessTable(this.output);

    const rows = this.rows;
    if (this.replacement) {
      this.rows = this.replacement;
      this.replacement = undefined;
    }
    return rows;
  };
  signal = (_groupId: number, signal: NodeJS.Signals | 0): void => {
    if (signal !== 0) this.signals.push({ signal, elapsed: this.clock.elapsed });
    if (this.refusal) throw Object.assign(new Error(this.refusal), { code: this.refusal });
  };
}

function rawProcessTable(members: readonly ProcessMember[]): string {
  return members
    .map(
      (member) =>
        `${member.pid} ${member.parentPid} ${member.groupId} ${member.uid} ${member.started} ${member.state}\n`,
    )
    .join("");
}

describe("parseProcessTable", () => {
  test("retains captured unknown-state rows while an owned terminal group settles without retries", async () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    const terminal = [leader, descendant].map((member) => ({ ...member, state: "Z" }));
    const captured = [
      "17498 15007 78357   501 Thu Nov  5 20:49:09 2026     ?E  ",
      "17542 15007 78357   501 Thu Nov  5 20:49:10 2026     ?E  ",
      "17578 15007 78357   501 Thu Nov  5 20:49:10 2026     ?E  ",
      "17604 58233 58233   501 Thu Nov  5 20:49:10 2026     ?   ",
    ];
    const output = `${rawProcessTable(terminal)}${captured.join("\n")}\n`;
    system.seedTable(output);
    system.refuse("EPERM");

    const parsed = parseProcessTable(output);
    const settlement = await group.settle();

    expect(parsed).toEqual([
      ...terminal,
      {
        pid: 17_498,
        parentPid: 15_007,
        groupId: 78_357,
        uid: 501,
        started: "Thu Nov 5 20:49:09 2026",
        state: "?E",
      },
      {
        pid: 17_542,
        parentPid: 15_007,
        groupId: 78_357,
        uid: 501,
        started: "Thu Nov 5 20:49:10 2026",
        state: "?E",
      },
      {
        pid: 17_578,
        parentPid: 15_007,
        groupId: 78_357,
        uid: 501,
        started: "Thu Nov 5 20:49:10 2026",
        state: "?E",
      },
      {
        pid: 17_604,
        parentPid: 58_233,
        groupId: 58_233,
        uid: 501,
        started: "Thu Nov 5 20:49:10 2026",
        state: "?",
      },
    ]);
    expect(settlement).toMatchObject({ state: "settled", members: terminal });
    expect(settlement.priorObservations).toBeUndefined();
    expect(system.clock.elapsed).toBe(0);
    expect(system.signals).toEqual([]);
  });

  test.each(["?", "?E"])(
    "retains owned %s uncertainty through parsing and a saved-identity round trip",
    async (state) => {
      const system = new ProcessTableFake();
      const members = [
        { ...leader, state: "Z" },
        { ...descendant, state },
      ];
      system.seedTable(rawProcessTable(members));
      system.refuse("EPERM");
      const original = new OwnedProcessGroup(groupId, system);
      const identity = JSON.parse(JSON.stringify(original.identity()));

      const restored = OwnedProcessGroup.restore(identity, system);
      const restoredMembers = restored.identity().members;
      const settlement = await restored.settle();

      expect(restoredMembers).toEqual(members);
      expect(settlement).toMatchObject({
        state: "uncertain",
        members,
        errors: [
          "group signal-0: EPERM",
          "the whole owned group is not proved terminal (live, stopped, absent or unknown members)",
        ],
      });
      expect(system.clock.elapsed).toBe(200);
      expect(system.signals).toEqual([]);
    },
  );

  test.each([
    ["missing final newline", rawProcessTable([leader]).trimEnd()],
    ["empty table", ""],
    ["blank table", "\n"],
    ["missing state", "123 1 123 501 Thu Nov 5 20:49:10 2026\n"],
    ["extra column", `${rawProcessTable([leader]).trimEnd()} extra\n`],
    ["malformed row beside a valid row", `${rawProcessTable([leader])}invalid\n`],
    ["invalid pid", "invalid 1 123 501 Thu Nov 5 20:49:10 2026 S\n"],
    ["invalid birth", "123 1 123 501 Thu Nov 32 20:49:10 2026 S\n"],
    ["invalid state", rawProcessTable([{ ...leader, state: "!" }])],
    ["unknown marker in a modifier", rawProcessTable([{ ...leader, state: "S?" }])],
  ])("rejects %s", (_name, output) => {
    expect(() => parseProcessTable(output)).toThrow();
  });
});

describe("OwnedProcessGroup", () => {
  test("force and settlement bounds use elapsed time", async () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);

    const cancellation = group.cancel();
    const repeated = group.cancel();
    const settlement = await cancellation;

    expect(repeated).toBe(cancellation);
    expect(settlement.state).toBe("uncertain");
    expect(system.clock.elapsed).toBe(2000);
    expect(system.signals).toEqual([
      { signal: "SIGTERM", elapsed: 0 },
      { signal: "SIGKILL", elapsed: 1000 },
    ]);
  });

  test("settles a recovered inspection without sending a termination signal", async () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([]);
    system.refuse("ESRCH");
    system.failNextInspection(new Error("inspection interrupted"));

    const settlement = await group.settle();

    expect(settlement.state).toBe("settled");
    expect(settlement.priorObservations).toEqual([
      expect.objectContaining({
        state: "uncertain",
        errors: ["process-table inspection: inspection interrupted"],
      }),
    ]);
    expect(system.clock.elapsed).toBe(25);
    expect(system.signals).toEqual([]);
  });

  test("settles a stable terminal domain after an inconclusive membership observation", async () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([
      { ...leader, state: "Z" },
      { ...descendant, state: "Z" },
    ]);
    system.race([{ ...leader, state: "Z" }]);
    system.refuse("EPERM");

    const settlement = await group.settle();

    expect(settlement).toMatchObject({ state: "settled", members: [{ ...leader, state: "Z" }] });
    expect(settlement.priorObservations).toEqual([
      expect.objectContaining({
        state: "uncertain",
        errors: expect.arrayContaining(["group membership or identity changed during inspection"]),
      }),
    ]);
    expect(system.signals).toEqual([]);
  });

  test("passive settlement retains unresolved inspection uncertainty within its allowance", async () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.refuse("EPERM");
    system.failInspection(new Error("inspection unavailable"));

    const settlement = await group.settle();

    expect(settlement).toMatchObject({
      state: "uncertain",
      errors: ["group signal-0: EPERM", "process-table inspection: inspection unavailable"],
    });
    expect(settlement.priorObservations).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: "uncertain" })]),
    );
    expect(system.clock.elapsed).toBe(200);
    expect(system.signals).toEqual([]);
  });

  test("accepts ESRCH as whole-group absence", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([]);
    system.refuse("ESRCH");

    expect(group.inspect()).toMatchObject({
      state: "settled",
      scope: "original-group-and-recorded-members",
      unobservedDescendants: "unknown",
      members: [],
    });
  });

  test.each([
    ["absent original group", "ESRCH", []],
    ["zombie original leader", "EPERM", [{ ...leader, state: "Z" }]],
  ] as const)("retains a known escaped member beside %s", async (_name, refusal, rows) => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    const escaped = { ...descendant, parentPid: 1, groupId: descendant.pid };
    system.seed([...rows, escaped]);
    system.refuse(refusal);

    const observed = group.inspect();
    const cancellation = await group.cancel();

    expect(observed.state).toBe("uncertain");
    expect(observed.members).toContainEqual(escaped);
    expect(cancellation.state).toBe("uncertain");
    expect(cancellation.members).toContainEqual(escaped);
  });

  test("accepts positive stable whole-group zombie evidence after EPERM", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([leader, descendant].map((member) => ({ ...member, state: "Z" })));
    system.refuse("EPERM");

    const result = group.inspect();

    expect(result.state).toBe("settled");
    expect(result.errors).toContain("group signal-0: EPERM");
    expect(result.members).toHaveLength(2);
  });

  test.each([
    ["absent original group", "ESRCH", []],
    ["zombie original leader", "EPERM", [{ ...leader, state: "Z" }]],
  ] as const)("retains a recorded credential change beside %s", async (_name, refusal, rows) => {
    const system = new ProcessTableFake();
    const identity = new OwnedProcessGroup(groupId, system).identity();
    const group = OwnedProcessGroup.restore(JSON.parse(JSON.stringify(identity)), system);
    const escaped = {
      ...descendant,
      parentPid: 1,
      groupId: descendant.pid,
      uid: descendant.uid + 1,
    };
    system.seed([...rows, escaped]);
    system.refuse(refusal);

    const observed = group.inspect();
    const cancellation = await group.cancel();

    expect(observed.state).toBe("uncertain");
    expect(observed.members).toContainEqual(escaped);
    expect(cancellation.state).toBe("uncertain");
    expect(cancellation.members).toContainEqual(escaped);
    expect(system.clock.elapsed).toBe(2000);
  });

  test.each(["S", "T", "R", "?", "D"])(
    "retains uncertainty for a zombie leader with a %s descendant",
    (state) => {
      const system = new ProcessTableFake();
      const group = new OwnedProcessGroup(groupId, system);
      system.seed([
        { ...leader, state: "Z" },
        { ...descendant, state },
      ]);
      system.refuse("EPERM");

      expect(group.inspect().state).toBe("uncertain");
    },
  );

  test("retains genuine refusal when inspection fails", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.refuse("EPERM");
    system.failInspection(new Error("ps failed or returned partial output"));

    const result = group.inspect();

    expect(result.state).toBe("uncertain");
    expect(result.errors).toEqual([
      "group signal-0: EPERM",
      "process-table inspection: ps failed or returned partial output",
    ]);
  });

  test("retains an unexpected syscall error even with terminal rows", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([
      { ...leader, state: "Z" },
      { ...descendant, state: "Z" },
    ]);
    system.refuse("EIO");

    expect(group.inspect().state).toBe("uncertain");
  });

  test("refuses a disappearing member during the terminal inspection", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([
      { ...leader, state: "Z" },
      { ...descendant, state: "Z" },
    ]);
    system.race([{ ...leader, state: "Z" }]);
    system.refuse("EPERM");

    expect(group.inspect().state).toBe("uncertain");
  });

  test("refuses a reused owned PID even in an otherwise terminal group", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([{ ...leader, state: "Z", started: "Wed Nov 4 00:00:00 2026" }]);
    system.refuse("EPERM");

    expect(group.inspect().state).toBe("uncertain");
  });

  test("restores owned identity evidence without adopting a replacement group", () => {
    const system = new ProcessTableFake();
    const identity = new OwnedProcessGroup(groupId, system).identity();
    system.seed([{ ...leader, started: "another birth", state: "Z" }]);
    system.refuse("EPERM");

    const recovered = OwnedProcessGroup.restore(JSON.parse(JSON.stringify(identity)), system);

    expect(recovered.inspect().state).toBe("uncertain");
  });

  test("restores positive owned identity after a JSON round trip", () => {
    const system = new ProcessTableFake();
    const identity = new OwnedProcessGroup(groupId, system).identity();
    system.seed([
      { ...leader, state: "Z" },
      { ...descendant, state: "Z" },
    ]);
    system.refuse("EPERM");

    const recovered = OwnedProcessGroup.restore(JSON.parse(JSON.stringify(identity)), system);
    const settlement = recovered.inspect();

    expect(settlement).toMatchObject({
      state: "settled",
      members: [
        { ...leader, state: "Z" },
        { ...descendant, state: "Z" },
      ],
    });
  });

  test("refuses malformed persisted birth evidence", () => {
    const system = new ProcessTableFake();
    const identity = new OwnedProcessGroup(groupId, system).identity();
    const malformed = { ...identity, members: [{ ...leader, started: "unknown birth" }] };

    expect(() => OwnedProcessGroup.restore(malformed, system)).toThrow();
  });

  test("refuses an empty or unanchored group after a permission refusal", () => {
    const system = new ProcessTableFake();
    const group = new OwnedProcessGroup(groupId, system);
    system.seed([]);
    system.refuse("EPERM");

    expect(group.inspect().state).toBe("uncertain");
  });
});

class OwnedGroupHarness {
  private readonly children: ReturnType<typeof spawn>[] = [];

  start(): {
    readonly pid: number;
    readonly group: OwnedProcessGroup;
    readonly exited: Promise<number>;
  } {
    const child = spawn([process.execPath, "-e", "setInterval(() => {}, 1000)"], {
      detached: true,
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    });
    this.children.push(child);
    return { pid: child.pid, group: new OwnedProcessGroup(child.pid), exited: child.exited };
  }

  async teardown(): Promise<void> {
    for (const child of this.children) {
      if (child.exitCode === null) child.kill("SIGKILL");
      await child.exited;
    }
  }
}

describe("OwnedProcessGroup on the host", () => {
  const harness = new OwnedGroupHarness();
  afterAll(async () => {
    await harness.teardown();
  });

  test("distinguishes live and settled owned groups", async () => {
    const { pid, group, exited } = harness.start();
    const live = group.inspect();

    process.kill(-pid, "SIGKILL");
    await exited;
    const terminal = await group.settle();

    expect(live.state).toBe("uncertain");
    expect(terminal.state).toBe("settled");
  });
});
