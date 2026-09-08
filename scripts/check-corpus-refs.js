#!/usr/bin/env bun
// Resolves every cross-reference in the instruction corpus against its target, so a rename or a
// deletion surfaces here instead of in a session that follows a dead pointer.
//
// A citation is the shortest name that identifies its file: a bare name resolves by unique
// basename, and only a name two files share needs a path to disambiguate it.
//
// Usage: check-corpus-refs.js
// Exits 0 when every citation resolves.

import { join } from "node:path";

import { findBrokenReferences } from "./corpus-refs.js";

const corpus = join(import.meta.dir, "..", "dot_agents");
const findings = await findBrokenReferences(corpus);

if (findings.length === 0) {
  console.log("every corpus cross-reference resolves");
  process.exit(0);
}

for (const { file, target, heading, reason, candidates } of findings) {
  const cited = heading ? `${target} §${heading}` : target;
  const detail = candidates ? ` (${candidates.join(", ")})` : "";
  console.log(`${reason.padEnd(24)} ${file} -> ${cited}${detail}`);
}

console.log(`\n${findings.length} unresolved cross-reference(s)`);
process.exit(1);
