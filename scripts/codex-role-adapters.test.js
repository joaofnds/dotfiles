import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

// Codex finds a role only through its adapter, so a shared role without one fails
// every Codex dispatch by that name with "unknown agent_type".
const root = fileURLToPath(new URL("../", import.meta.url));
const listed = (pattern) =>
  execFileSync("git", ["ls-files", pattern], { cwd: root, encoding: "utf8" }).trim().split("\n");
const roles = listed("dot_agents/agents/*.md").map((path) => basename(path, ".md"));
const adapters = listed("dot_codex/agents/*.toml.tmpl").map((path) => basename(path, ".toml.tmpl"));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every Codex adapter renders a shared role", () => {
  expect(adapters.filter((adapter) => !roles.includes(adapter))).toEqual([]);
});

test.each(roles)("%s has a Codex adapter that renders its own definition", (role) => {
  expect(adapters).toContain(role);
  const adapter = read(`dot_codex/agents/${role}.toml.tmpl`);
  const metadata = Bun.YAML.parse(read(`dot_agents/agents/${role}.md`).match(/^---\n([\s\S]*?)\n---/)[1]);

  expect(adapter).toContain(`name = ${JSON.stringify(metadata.name)}\n`);
  expect(adapter).toContain(`description = ${JSON.stringify(metadata.description)}\n`);
  expect(adapter).toContain(`(include "dot_agents/agents/${role}.md")`);
});
