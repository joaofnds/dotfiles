import process from "node:process";
import { runCli } from "../main.ts";
import { faultKindSchema, RunnerFaults } from "./runner-faults.ts";

const [directory = "", requested = "", ...args] = process.argv.slice(2);
const fixture = new RunnerFaults(directory, faultKindSchema.parse(requested));
try {
  process.exitCode = await runCli(args, fixture.operations);
} finally {
  fixture.requireHit();
}
