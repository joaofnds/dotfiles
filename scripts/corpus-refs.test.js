import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { findBrokenReferences } from "./corpus-refs.js";

const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function corpus(files) {
  const directory = await mkdtemp(join(tmpdir(), "corpus-refs-test-"));
  directories.push(directory);

  for (const [path, contents] of Object.entries(files)) {
    const absolute = join(directory, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
  }

  return directory;
}

describe("a citation naming a file that exists", () => {
  test("resolves when the name is unique, from any directory", async () => {
    const root = await corpus({
      "rulebook/coding-style/go.md": "# Go\n",
      "rulebook/refactoring/catalog/extract-function.md": "See `go.md` for the idioms.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a path relative to the citing file", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/coding-style/core.md": "Tests live in `../testing/00-index.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a path anchored at the rendered home prefix", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n",
      "skills/build/SKILL.md": "Read `~/.agents/rulebook/coupling.md` first.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a path written from the corpus root", async () => {
    const root = await corpus({
      "rulebook/ownership.md": "# Ownership\n",
      "AGENTS.md": "Broken things go to `rulebook/ownership.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a path anchored at the chezmoi source directory", async () => {
    const root = await corpus({
      "skills/review-instructions/references/corrections-log.md": "# Log\n",
      "skills/review-instructions/SKILL.md": "Log it in `dot_agents/skills/review-instructions/references/corrections-log.md` today.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });
});

describe("a citation naming a file that does not exist", () => {
  test("reports a bare name matching nothing", async () => {
    const root = await corpus({
      "rulebook/coding-style.md": "Routed by `no-such-file.md` today.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.file).toBe("rulebook/coding-style.md");
    expect(finding.target).toBe("no-such-file.md");
    expect(finding.reason).toBe("no file with this name");
  });

  test("reports a relative path matching nothing", async () => {
    const root = await corpus({
      "rulebook/coding-style/core.md": "Tests live in `../testing/00-index.md`.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.target).toBe("../testing/00-index.md");
    expect(finding.reason).toBe("no file with this name");
  });

  test("reports a home-prefixed path matching nothing", async () => {
    const root = await corpus({
      "skills/build/SKILL.md": "Read `~/.agents/rulebook/gone.md` first.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.target).toBe("~/.agents/rulebook/gone.md");
    expect(finding.reason).toBe("no file with this name");
  });

  test("reports every broken citation, not only the first", async () => {
    const root = await corpus({
      "AGENTS.md": "Read `gone.md`, then `also-gone.md`.\n",
    });

    expect(await findBrokenReferences(root)).toHaveLength(2);
  });
});

describe("a bare name that two files share", () => {
  test("is reported as ambiguous, naming the candidates", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "# Refactoring\n",
      "AGENTS.md": "Start at `00-index.md`.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.reason).toBe("ambiguous name");
    expect(finding.candidates).toEqual(["rulebook/refactoring/00-index.md", "rulebook/testing/00-index.md"]);
  });

  test("resolves when the citation carries enough path to disambiguate", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "# Refactoring\n",
      "AGENTS.md": "Start at `testing/00-index.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a shared name against the citing file's own directory", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "Catalog entries live beside `00-index.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });
});

describe("a citation carrying a heading", () => {
  test("resolves when the target holds it as a markdown heading", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n\n## Temporal coupling\n",
      "AGENTS.md": "See `coupling.md` §Temporal coupling for the probe.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves when the target holds it as a bolded rule label", async () => {
    const root = await corpus({
      "rulebook/coding-style.md": "# Style\n\n- **Comments default to zero.** The test is.\n",
      "skills/deslop/SKILL.md": "Apply `coding-style.md` §Comments default to zero.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("resolves a heading the target numbers", async () => {
    const root = await corpus({
      "rulebook/testing/03-test-aesthetics.md": "# Aesthetics\n\n## 4.1 Arrange, act, assert\n",
      "AGENTS.md": "See `03-test-aesthetics.md` §Arrange, act, assert.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("reports a heading the target does not hold", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n\n## Temporal coupling\n",
      "AGENTS.md": "See `coupling.md` §Spatial coupling.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.target).toBe("coupling.md");
    expect(finding.heading).toBe("Spatial coupling");
    expect(finding.reason).toBe("no heading with this name");
  });

  test("resolves a heading whose citation runs on into the sentence", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n\n## Temporal coupling\n",
      "AGENTS.md": "See `coupling.md` §Temporal coupling for the probe.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("reports a bad heading whose citation wraps onto the next line", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n\n## Temporal coupling\n",
      "AGENTS.md": "The probe lives in `coupling.md`\n§Spatial coupling.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.heading).toBe("Spatial coupling");
    expect(finding.reason).toBe("no heading with this name");
  });

  test("resolves a good heading whose citation wraps onto the next line", async () => {
    const root = await corpus({
      "rulebook/coupling.md": "# Coupling\n\n## Temporal coupling\n",
      "AGENTS.md": "The probe lives in `coupling.md`\n§Temporal coupling.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("reports a missing file before checking its heading", async () => {
    const root = await corpus({
      "AGENTS.md": "See `gone.md` §Whatever for the probe.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.reason).toBe("no file with this name");
  });
});

describe("text that names no corpus file", () => {
  test("skips a citation by section number, which names no heading text", async () => {
    const root = await corpus({
      "rulebook/coding-style.md": "# Style\n\n## 2. Layering\n",
      "AGENTS.md": "See `coding-style.md` §2 for the layering rules.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a placeholder documenting the citation form", async () => {
    const root = await corpus({
      "skills/review/SKILL.md": "Cite the target as `file.md` in backticks.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a project file that the corpus does not own", async () => {
    const root = await corpus({
      "rulebook/coding-style.md": "The repo's own `AGENTS.md` wins over this file.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("checks a corpus file whose name a project file shares", async () => {
    const root = await corpus({
      "AGENTS.md": "Committing goes to `~/.agents/skills/delivery/SKILL.md`.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.target).toBe("~/.agents/skills/delivery/SKILL.md");
    expect(finding.reason).toBe("no file with this name");
  });

  test("resolves a skill pointer whose file exists", async () => {
    const root = await corpus({
      "skills/delivery/SKILL.md": "# Delivery\n",
      "AGENTS.md": "Committing goes to `~/.agents/skills/delivery/SKILL.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a fenced code block, where a name is an example and not a citation", async () => {
    const root = await corpus({
      "skills/build/SKILL.md": "Announce it:\n\n```\nReading: `gone.md`\n```\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips the corrections log, whose citations are history", async () => {
    const root = await corpus({
      "skills/review-instructions/references/corrections-log.md": "It said `coding-style-go.md` that day.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips the corrections rules, which quote names the corpus no longer holds", async () => {
    const root = await corpus({
      "skills/review-instructions/references/corrections-rules.md": "The rewrite of `rules/ownership.md` cut it.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a path outside the corpus, which the corpus does not own", async () => {
    const root = await corpus({
      "AGENTS.md": "The register is `~/.claude/output-styles/brief.md`.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a wiki page, which lives outside the corpus", async () => {
    const root = await corpus({
      "skills/review-code/references/wiki-checks.md": "Quoted from `raw/Release It 16 Chapter 11 - Security.md` there.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });

  test("skips a placeholder path standing in for a generated file", async () => {
    const root = await corpus({
      "skills/away/SKILL.md": "Write it to `$TMPDIR/away-<YYYY-MM-DD>-<slug>.md` first.\n",
    });

    expect(await findBrokenReferences(root)).toEqual([]);
  });
});

describe("a name two files share", () => {
  test("reports a bare shared name even when the line names a directory", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "# Refactoring\n",
      "skills/review-code/references/axes.md": "The testing rules at `~/.agents/rulebook/testing/`: `00-index.md` with its checklist.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.reason).toBe("ambiguous name");
  });

  test("stays ambiguous when the line names both directories", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "# Refactoring\n",
      "skills/a.md": "The catalog at `rulebook/refactoring/` routes; the testing entry `00-index.md` holds it.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.reason).toBe("ambiguous name");
  });

  test("stays ambiguous when no directory appears on the line", async () => {
    const root = await corpus({
      "rulebook/testing/00-index.md": "# Testing\n",
      "rulebook/refactoring/00-index.md": "# Refactoring\n",
      "AGENTS.md": "Start at `00-index.md` for the routing.\n",
    });

    const [finding] = await findBrokenReferences(root);

    expect(finding.reason).toBe("ambiguous name");
  });
});
