import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, normalize, relative, sep } from "node:path";

const HOME_PREFIX = "~/.agents/";
const SOURCE_PREFIX = "dot_agents/";

// The corpus cites files it does not own: the rendered output styles, the personal wiki, a
// project's own dot-directories, and paths a session generates at runtime. Only `~/.agents/`
// names a corpus file.
const OUTSIDE = [/^~\/(?!\.agents\/)/, /^\$/, /^raw\//, /^\.[a-z]/];

// A project's own instruction files are named by the corpus and never owned by it.
const PROJECT_FILES = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "SKILL.md", "MEMORY.md", "GLOSSARY.md"];

// The rules document their own citation form with this placeholder rather than citing a file.
const PLACEHOLDER = "file.md";

// A citation wraps onto the next line when the paragraph does, so the heading may sit past a
// newline the sentence did not intend.
const CITATION = /`([^`\n]+\.md)`(?:\s*§[ \t]*([^;,.)\n]+))?/g;
const FENCE = /^```/;
const HEADING = /^#{1,6}\s+(.+)$/;
const BOLD_LABEL = /\*\*([^*]+)\*\*/g;
const LEADING_NUMBER = /^(?:\d{1,2}(?:\.\d{1,2})*\.?|[a-z]\.)\s+/;

async function markdownFiles(root) {
  const found = [];

  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.name.endsWith(".md")) {
        found.push(path);
      }
    }
  }

  await walk(root);
  return found.sort();
}

// A name inside a fenced block is an example the reader types, not a citation to resolve. Prose
// outside the fences is joined back into paragraphs, so a citation that wraps stays whole.
function citationsOutsideFences(text) {
  const paragraphs = [];
  let prose = [];
  let fenced = false;

  for (const line of text.split("\n")) {
    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    if (line.trim() === "") {
      paragraphs.push(prose.join(" "));
      prose = [];
      continue;
    }

    prose.push(line);
  }

  paragraphs.push(prose.join(" "));

  const found = [];

  for (const paragraph of paragraphs) {
    for (const [, target, heading] of paragraph.matchAll(CITATION)) {
      found.push({ target, heading: heading?.trim(), line: paragraph });
    }
  }

  return found;
}

function headingsOf(text) {
  const found = [];

  for (const line of text.split("\n")) {
    const heading = line.match(HEADING);
    if (heading) found.push(heading[1].trim());

    for (const [, label] of line.matchAll(BOLD_LABEL)) {
      found.push(label.trim());
    }
  }

  return found.map((heading) => heading.replace(LEADING_NUMBER, "").toLowerCase());
}

// A citation runs on into its sentence and a heading can carry a tail the citation shortens,
// so either string may be the longer one.
function holdsHeading(headings, cited) {
  const wanted = cited.toLowerCase();
  return headings.some((heading) => heading.startsWith(wanted) || wanted.startsWith(heading));
}

function index(paths, root) {
  const byName = new Map();

  for (const path of paths) {
    const name = basename(path);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(relative(root, path));
  }

  return byName;
}

// A citation is the shortest name that identifies a file, so a bare name resolves by unique
// basename and a longer one by path. The citing file's own directory wins a tie, which is how
// a shared name like an index stays citable from beside it.
function resolve(target, from, line, { byName, paths }) {
  const cleaned = target.startsWith(HOME_PREFIX)
    ? target.slice(HOME_PREFIX.length)
    : target.startsWith(SOURCE_PREFIX)
      ? target.slice(SOURCE_PREFIX.length)
      : target;

  const beside = normalize(join(dirname(from), cleaned));
  if (paths.has(beside)) return { path: beside };

  const fromRoot = normalize(cleaned);
  if (paths.has(fromRoot)) return { path: fromRoot };

  if (cleaned.includes(sep)) {
    const matches = [...paths].filter((path) => path === cleaned || path.endsWith(`${sep}${cleaned}`));
    if (matches.length === 1) return { path: matches[0] };
    if (matches.length > 1) return { candidates: matches.sort() };
    return {};
  }

  const named = byName.get(cleaned) ?? [];
  if (named.length === 1) return { path: named[0] };
  if (named.length === 0) return {};

  return { candidates: [...named].sort() };
}

function skips(target, heading) {
  if (target === PLACEHOLDER) return true;
  // Bare, these name the project's own files. Carrying a path, they name a corpus file:
  // every skill is a `SKILL.md` and the corpus routes to them by path.
  if (!target.includes(sep) && PROJECT_FILES.includes(target)) return true;
  if (OUTSIDE.some((pattern) => pattern.test(target))) return true;
  // A numbered citation names a section by number, and those files head their sections with it.
  if (heading && /^[0-9<]/.test(heading)) return true;
  return false;
}

export async function findBrokenReferences(root) {
  const absolute = await markdownFiles(root);
  const relatives = absolute.map((path) => relative(root, path));
  const corpus = { byName: index(absolute, root), paths: new Set(relatives) };

  const findings = [];

  for (const path of relatives) {
    const text = await readFile(join(root, path), "utf8");

    for (const { target, heading, line } of citationsOutsideFences(text)) {
      if (skips(target, heading)) continue;

      const { path: resolved, candidates } = resolve(target, path, line, corpus);

      if (candidates) {
        findings.push({ file: path, target, reason: "ambiguous name", candidates });
        continue;
      }

      if (!resolved) {
        findings.push({ file: path, target, reason: "no file with this name" });
        continue;
      }

      if (!heading) continue;

      const headings = headingsOf(await readFile(join(root, resolved), "utf8"));
      if (!holdsHeading(headings, heading)) {
        findings.push({ file: path, target, heading, reason: "no heading with this name" });
      }
    }
  }

  return findings;
}
