import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const paths = execFileSync("git", ["ls-files", "dot_agents/skills/*/SKILL.md",
  "dot_agents/agents/*.md", "dot_claude/output-styles/*.md"], { cwd: root, encoding: "utf8" })
  .trim().split("\n");

test.each(paths)("%s has parseable instruction metadata", (path) => {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---/);

  expect(match).not.toBeNull();
  const metadata = Bun.YAML.parse(match[1]);
  expect(metadata.name).toBeString();
  expect(metadata.name.trim()).not.toBe("");
  expect(metadata.description).toBeString();
  expect(metadata.description.trim()).not.toBe("");
});
