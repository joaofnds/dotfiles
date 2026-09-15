#!/usr/bin/env bun
import process from "node:process";
import { fingerprintCase, runExperiment } from "./harness.ts";

function usage(): never {
  process.stderr.write(
    "Usage: bun run evals/run.ts (--config <experiment.json> --output <new-directory> | --fingerprint <case.json>) [--allow-root <directory>]...\n",
  );
  process.exit(2);
}

function values(name: string): string[] {
  const result: string[] = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    if (process.argv[index] !== name) continue;
    const value = process.argv[index + 1];
    if (value === undefined || value.startsWith("--")) usage();
    result.push(value);
  }
  return result;
}

function option(name: string): string {
  const found = values(name);
  if (found.length !== 1 || found[0] === undefined) usage();
  return found[0];
}

try {
  const roots = values("--allow-root");
  if (process.argv.includes("--fingerprint")) {
    if (process.argv.includes("--config") || process.argv.includes("--output")) usage();
    process.stdout.write(`${await fingerprintCase(option("--fingerprint"), roots)}\n`);
  } else {
    await runExperiment(option("--config"), option("--output"), roots);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
