import { describe, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import {
  buildSchedule,
  evaluateChecks,
  extractClaudeEnvelope,
  fingerprintCase,
  planExperiment,
  runExperiment,
} from "./harness.ts";

describe("paired trial planning", () => {
  test.each(
    ["../escape", "nested/name", "nested\\name", ".", " space", ""].flatMap((id) =>
      (["armIds", "caseIds"] as const).map((field) => ({ id, field })),
    ),
  )("rejects unsafe $field identifier '$id' before dispatch", ({ id, field }) => {
    expect(() =>
      planExperiment({
        totalBudgetUsd: 1,
        perRunBudgetUsd: 1,
        repetitions: 1,
        armIds: ["high"],
        caseIds: ["triage"],
        [field]: [id],
      }),
    ).toThrow("filename-safe");
  });
  test("alternates arm order across cases and stays within the declared cap", () => {
    const plan = planExperiment({
      totalBudgetUsd: 10,
      perRunBudgetUsd: 1.25,
      repetitions: 1,
      armIds: ["high", "medium"],
      caseIds: ["triage", "reflect"],
    });

    expect(plan.maximumScheduledCostUsd).toBe(5);
    expect(buildSchedule(plan)).toEqual([
      { armId: "high", caseId: "triage", repetition: 1 },
      { armId: "medium", caseId: "triage", repetition: 1 },
      { armId: "medium", caseId: "reflect", repetition: 1 },
      { armId: "high", caseId: "reflect", repetition: 1 },
    ]);
  });

  test("refuses a schedule whose per-run caps exceed the total budget", () => {
    expect(() =>
      planExperiment({
        totalBudgetUsd: 4,
        perRunBudgetUsd: 1.25,
        repetitions: 1,
        armIds: ["high", "medium"],
        caseIds: ["triage", "reflect"],
      }),
    ).toThrow("maximum scheduled cost $5.00 exceeds total budget $4.00");
  });
});

describe("deterministic checks", () => {
  test("reports every exact mismatch without replacing semantic review", () => {
    const checks = evaluateChecks(
      {
        admit_inbox_card: false,
        selected_card_id: "DOT-88",
        missing_facts: ["raw-attempt-records"],
      },
      [
        { id: "no-admission", path: "/admit_inbox_card", equals: false },
        { id: "no-selection", path: "/selected_card_id", equals: null },
        {
          id: "missing-evidence",
          path: "/missing_facts",
          includes: "raw-attempt-records",
        },
      ],
    );

    expect(checks).toEqual([
      { id: "no-admission", status: "PASS", observed: false },
      { id: "no-selection", status: "FAIL", observed: "DOT-88" },
      {
        id: "missing-evidence",
        status: "PASS",
        observed: ["raw-attempt-records"],
      },
    ]);
  });
});

describe("Claude evidence", () => {
  test("retains raw per-model usage, cache, and list-price cost", () => {
    const envelope = extractClaudeEnvelope(
      JSON.stringify({
        type: "result",
        subtype: "success",
        is_error: false,
        result: '{"verdict":"adjust"}',
        structured_output: { verdict: "adjust" },
        total_cost_usd: 0.42,
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          cache_read_input_tokens: 30,
          cache_creation_input_tokens: 40,
        },
        modelUsage: {
          "claude-opus-5": {
            inputTokens: 10,
            outputTokens: 20,
            cacheReadInputTokens: 30,
            cacheCreationInputTokens: 40,
            costUSD: 0.42,
          },
        },
      }),
    );

    expect(envelope.metrics).toEqual({
      totalCostUsd: 0.42,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 30,
        cache_creation_input_tokens: 40,
      },
      modelUsage: {
        "claude-opus-5": {
          inputTokens: 10,
          outputTokens: 20,
          cacheReadInputTokens: 30,
          cacheCreationInputTokens: 40,
          costUSD: 0.42,
        },
      },
    });
    expect(envelope.firstOutput).toEqual({ verdict: "adjust" });
  });
});

describe("experiment artifacts", () => {
  test.each([{ mutation: false }, { mutation: true }])(
    "retains frozen inputs across attempts with source mutation=$mutation",
    async ({ mutation }) => {
      const f = await createExperimentHarness({ mutation });
      try {
        f.config.repetitions = 2;
        await f.save();
        await runExperiment(f.configPath, f.output);
        const summary = JSON.parse(await readFile(join(f.output, "summary.json"), "utf8"));
        expect(summary.actualProviderListCostUsd).toBe(0.02);
        expect(summary.attempts.map((attempt: { status: string }) => attempt.status)).toEqual([
          "PASS",
          "PASS",
        ]);
        const first = join(f.output, "attempts", "01-probe-high-r1");
        const second = join(f.output, "attempts", "02-probe-high-r2");
        expect(await readFile(join(second, "instruction-payload.md"), "utf8")).toBe(
          await readFile(join(first, "instruction-payload.md"), "utf8"),
        );
        expect(await readFile(join(second, "request-payload.md"), "utf8")).toBe(
          await readFile(join(first, "request-payload.md"), "utf8"),
        );
        expect(JSON.parse(await readFile(join(first, "first-output.json"), "utf8"))).toHaveProperty(
          "claims_fact",
          false,
        );
      } finally {
        await f.close();
      }
    },
  );
});

function digest(value: string): string {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex");
}

async function createExperimentHarness(
  options: {
    omitReason?: boolean;
    paired?: boolean;
    interrupt?: boolean;
    mutation?: boolean;
    wrongFact?: boolean;
  } = {},
) {
  const root = await mkdtemp(join(tmpdir(), "iterate-eval-boundary-"));
  const approved = join(root, "approved");
  const caseDirectory = join(approved, "case");
  await mkdir(join(caseDirectory, "fixture"), { recursive: true });
  await mkdir(join(root, "outside"));
  const manifestPath = join(caseDirectory, "case.json");
  const manifest = {
    schemaVersion: 1,
    id: "probe",
    stage: "probe",
    request: "request.md",
    fixtureDirectory: "fixture",
    instructionFiles: ["stage.md"],
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { claims_fact: { type: "boolean" }, brief_reason: { type: "string" } },
      required: ["claims_fact", "brief_reason"],
    },
    checks: [{ id: "missing", path: "/claims_fact", equals: false }],
  };
  await Promise.all([
    writeFile(manifestPath, JSON.stringify(manifest)),
    writeFile(join(caseDirectory, "request.md"), "Judge evidence."),
    writeFile(join(caseDirectory, "stage.md"), "Read all evidence."),
    writeFile(join(caseDirectory, "fixture", "evidence.md"), "Fact is missing."),
    writeFile(join(approved, "criteria.txt"), "Retain uncertainty."),
    writeFile(join(approved, "corpus.md"), "Do not invent facts."),
    writeFile(join(root, "outside", "sample.md"), "Isolated outside fixture."),
  ]);
  const capture = join(root, "argv.jsonl");
  const executable = join(approved, "fake.ts");
  await writeFile(
    executable,
    `#!${process.execPath}
import {appendFileSync,writeFileSync} from "node:fs";
const args=process.argv.slice(2);
appendFileSync(${JSON.stringify(capture)}, JSON.stringify(args)+"\\n");
if(args.includes("--version")){console.log("fake 1");process.exit(0);}
${options.interrupt ? 'process.on("SIGTERM",()=>process.exit(0));process.kill(process.ppid,"SIGTERM");await new Promise(resolve=>setTimeout(resolve,5000));' : ""}
${options.mutation ? `for(const path of ${JSON.stringify([join(approved, "corpus.md"), join(caseDirectory, "request.md"), join(caseDirectory, "stage.md"), join(caseDirectory, "fixture", "evidence.md")])})writeFileSync(path,"CONTAMINATED");` : ""}
const prompt=args[args.indexOf("--system-prompt")+1];
const receipt=Object.fromEntries(["instruction_payload_sha256","request_payload_sha256","start_sentinel","end_sentinel"].map(key=>[key,prompt.split(key+"=")[1]?.split(/[, .]/)[0]]));
console.log(JSON.stringify({type:"result",is_error:false,result:JSON.stringify({claims_fact:${options.wrongFact === true},${options.omitReason ? "" : 'brief_reason:"Evidence missing.",'}receipt}),total_cost_usd:0.01}));
`,
  );
  await chmod(executable, 0o700);
  const arm = {
    id: "high",
    model: "model-A",
    effort: "high",
    instructionSnapshot: "corpus.md",
    instructionSha256: digest("Do not invent facts."),
  };
  const config = {
    schemaVersion: 1,
    experimentId: "boundary",
    provider: { executable },
    totalBudgetUsd: 0.5,
    perRunBudgetUsd: 0.25,
    repetitions: 1,
    timeoutMs: 5000,
    criteriaSnapshot: "criteria.txt",
    criteriaSha256: digest("Retain uncertainty."),
    arms: options.paired
      ? [arm, { ...arm, id: "medium", model: "model-B", effort: "medium" }]
      : [arm],
    cases: [
      { id: "probe", manifest: "case/case.json", sha256: await fingerprintCase(manifestPath) },
    ],
  };
  const configPath = join(approved, "experiment.json");
  const save = () => writeFile(configPath, JSON.stringify(config));
  await save();
  return {
    root,
    approved,
    caseDirectory,
    manifestPath,
    manifest,
    config,
    configPath,
    save,
    capture,
    output: join(root, "result"),
    close: () => rm(root, { recursive: true, force: true }),
  };
}

describe("input and artifact boundaries", () => {
  test.each(["criteria", "corpus", "manifest"])(
    "refuses an outside-root %s config reference",
    async (kind) => {
      const f = await createExperimentHarness();
      try {
        const outside = join(f.root, "outside", "sample.md");
        if (kind === "criteria") f.config.criteriaSnapshot = outside;
        if (kind === "corpus") f.config.arms[0]!.instructionSnapshot = outside;
        if (kind === "manifest") f.config.cases[0]!.manifest = outside;
        await f.save();
        await expect(runExperiment(f.configPath, f.output)).rejects.toThrow(
          "outside approved roots",
        );
        expect(await Bun.file(f.capture).exists()).toBe(false);
      } finally {
        await f.close();
      }
    },
  );

  test("refuses fixture symlinks even when their target root is approved", async () => {
    const f = await createExperimentHarness();
    try {
      await symlink(
        join(f.root, "outside", "sample.md"),
        join(f.caseDirectory, "fixture", "link.md"),
      );
      await expect(fingerprintCase(f.manifestPath, [join(f.root, "outside")])).rejects.toThrow(
        "regular files or directories",
      );
      expect(await Bun.file(f.capture).exists()).toBe(false);
    } finally {
      await f.close();
    }
  });

  test.each(["request.md", "stage.md", "fixture/evidence.md", "case.json"])(
    "rejects drift in frozen %s before provider dispatch",
    async (name) => {
      const f = await createExperimentHarness();
      try {
        const path = join(f.caseDirectory, name);
        await writeFile(path, (await readFile(path, "utf8")) + "\n");
        await expect(runExperiment(f.configPath, f.output)).rejects.toThrow("case bundle SHA-256");
        expect(await Bun.file(f.capture).exists()).toBe(false);
      } finally {
        await f.close();
      }
    },
  );

  test.each(["request", "instruction", "fixture", "symlink"])(
    "refuses outside-root %s before reading it into output",
    async (kind) => {
      const f = await createExperimentHarness();
      try {
        const outside = join(f.root, "outside", "sample.md");
        if (kind === "request") f.manifest.request = outside;
        if (kind === "instruction") f.manifest.instructionFiles = [outside];
        if (kind === "fixture") f.manifest.fixtureDirectory = join(f.root, "outside");
        if (kind === "symlink") {
          await symlink(outside, join(f.caseDirectory, "linked.md"));
          f.manifest.request = "linked.md";
        }
        await writeFile(f.manifestPath, JSON.stringify(f.manifest));
        await expect(runExperiment(f.configPath, f.output)).rejects.toThrow(
          "outside approved roots",
        );
        expect(await Bun.file(f.capture).exists()).toBe(false);
        expect(await Bun.file(join(f.output, "manifest.json")).exists()).toBe(false);
      } finally {
        await f.close();
      }
    },
  );

  test("requires explicit approval for an outside stage file and fingerprints its bytes", async () => {
    const f = await createExperimentHarness();
    try {
      f.manifest.instructionFiles = [join(f.root, "outside", "sample.md")];
      await writeFile(f.manifestPath, JSON.stringify(f.manifest));
      const roots = [join(f.root, "outside")];
      f.config.cases[0]!.sha256 = await fingerprintCase(f.manifestPath, roots);
      await f.save();
      await runExperiment(f.configPath, f.output, roots);
      expect(
        await readFile(
          join(f.output, "attempts", "01-probe-high-r1", "instruction-payload.md"),
          "utf8",
        ),
      ).toContain("Isolated outside fixture.");
    } finally {
      await f.close();
    }
  });

  test.each(["directory", "symlink"])("refuses an existing output %s atomically", async (kind) => {
    const f = await createExperimentHarness();
    try {
      if (kind === "directory") await mkdir(f.output);
      else await symlink(join(f.root, "outside"), f.output);
      await expect(runExperiment(f.configPath, f.output)).rejects.toThrow("EEXIST");
      expect(await Bun.file(f.capture).exists()).toBe(false);
      expect(await readdir(join(f.root, "outside"))).toEqual(["sample.md"]);
    } finally {
      await f.close();
    }
  });

  test("creates every retained file and directory with private modes", async () => {
    const f = await createExperimentHarness();
    try {
      await runExperiment(f.configPath, f.output);
      async function modes(path: string): Promise<void> {
        const info = await stat(path);
        expect(info.mode & 0o777).toBe(info.isDirectory() ? 0o700 : 0o600);
        if (info.isDirectory())
          for (const name of await readdir(path)) await modes(join(path, name));
      }
      await modes(f.output);
    } finally {
      await f.close();
    }
  });
});

describe("delivered provider contract", () => {
  test("records a schema-valid exact-check failure and preserves the first output", async () => {
    const f = await createExperimentHarness({ wrongFact: true });
    try {
      await runExperiment(f.configPath, f.output);
      const attempt = join(f.output, "attempts", "01-probe-high-r1");
      expect(JSON.parse(await readFile(join(attempt, "attempt.json"), "utf8"))).toMatchObject({
        status: "DETERMINISTIC_FAIL",
        checks: expect.arrayContaining([{ id: "missing", status: "FAIL", observed: true }]),
      });
      expect(JSON.parse(await readFile(join(attempt, "first-output.json"), "utf8"))).toHaveProperty(
        "claims_fact",
        true,
      );
    } finally {
      await f.close();
    }
  });

  test("seals an interrupted attempt and stops the remaining schedule even after exit zero", async () => {
    const f = await createExperimentHarness({ paired: true, interrupt: true });
    try {
      const child = Bun.spawn(
        [
          process.execPath,
          join(import.meta.dir, "run.ts"),
          "--config",
          f.configPath,
          "--output",
          f.output,
        ],
        { stdout: "pipe", stderr: "pipe" },
      );
      const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
      expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
      const summary = JSON.parse(await readFile(join(f.output, "summary.json"), "utf8"));
      expect(summary.interrupted).toBe(true);
      expect(summary.attempts).toHaveLength(1);
      expect(summary.attempts[0]).toMatchObject({
        status: "PROVIDER_ERROR",
        interrupted: true,
        providerExitCode: 0,
      });
      expect(
        await readFile(
          join(f.output, "attempts", "01-probe-high-r1", "provider-stdout.txt"),
          "utf8",
        ),
      ).toBe("");
      expect((await readFile(f.capture, "utf8")).trim().split("\n")).toHaveLength(2);
    } finally {
      await f.close();
    }
  });

  test("delivers each arm's distinct model and effort with its actual per-run cap", async () => {
    const f = await createExperimentHarness({ paired: true });
    try {
      await runExperiment(f.configPath, f.output);
      const calls = (await readFile(f.capture, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as string[])
        .filter((args) => !args.includes("--version"));
      expect(
        calls.map((args) => [
          args[args.indexOf("--model") + 1],
          args[args.indexOf("--effort") + 1],
          args[args.indexOf("--max-budget-usd") + 1],
        ]),
      ).toEqual([
        ["model-A", "high", "0.25"],
        ["model-B", "medium", "0.25"],
      ]);
    } finally {
      await f.close();
    }
  });

  test("rejects fallback JSON missing an unscored required field", async () => {
    const f = await createExperimentHarness({ omitReason: true });
    try {
      await runExperiment(f.configPath, f.output);
      const attempt = join(f.output, "attempts", "01-probe-high-r1");
      expect(JSON.parse(await readFile(join(attempt, "attempt.json"), "utf8"))).toMatchObject({
        status: "INVALID_OUTPUT",
        checks: [],
        error: "provider output does not match the complete output schema",
      });
      expect(JSON.parse(await readFile(join(attempt, "first-output.json"), "utf8"))).toHaveProperty(
        "claims_fact",
        false,
      );
    } finally {
      await f.close();
    }
  });

  test("compares JSON object values independently of property insertion order", () => {
    expect(
      evaluateChecks({ value: { a: 1, b: 2 } }, [
        { id: "same", path: "/value", equals: { b: 2, a: 1 } },
      ]),
    ).toEqual([{ id: "same", status: "PASS", observed: { a: 1, b: 2 } }]);
  });
});
