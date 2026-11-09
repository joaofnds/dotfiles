import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  realpath,
  rmdir,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, normalize, resolve } from "node:path";
import process from "node:process";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { Exit } from "./exit.ts";
import { type FileRemoval, type JsonWriter, readOptionalFile } from "./files.ts";

const identitySchema = z.object({ dev: z.number(), ino: z.number() });
const ownedIdentitySchema = identitySchema.extend({
  uid: z.number().int(),
  mode: z.number().int(),
});
export const boardTargetSchema = z.object({
  token: z.uuid(),
  board: z.string(),
  start: z.string(),
  project: z.string(),
  config: z.object({ path: z.string(), bytes: z.string() }),
  targetIdentity: identitySchema,
  view: z.string(),
  viewIdentity: ownedIdentitySchema,
  linkIdentity: ownedIdentitySchema,
  configIdentity: ownedIdentitySchema,
  configBytes: z.string(),
  evidence: z.string(),
  initialization: z
    .object({
      before: z.string(),
      after: z.string(),
      added: z.record(z.string(), z.string()),
      locks: z.array(identitySchema.extend({ path: z.string(), bytes: z.string() })),
    })
    .optional(),
});
export const boardTargetRecordSchema = boardTargetSchema.extend({
  state: z.enum(["active", "retained", "cleaned"]),
  owner: z.number().int().positive(),
});

type Selection = {
  readonly board: string;
  readonly start: string;
  readonly project: string;
  readonly config: { readonly path: string; readonly bytes: string };
};

async function candidate(path: string) {
  try {
    return await stat(path);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    )
      return;

    throw error;
  }
}

export async function discoverBoard(
  start = resolve(process.env.BACKLOG_CWD?.trim() || process.cwd()),
): Promise<Selection> {
  try {
    return await findBoard(start);
  } catch (error) {
    if (error instanceof Exit) throw error;

    if (error instanceof Error && "code" in error && typeof error.code === "string")
      throw new Exit(1, `discovering the Backlog board from ${start} failed: ${error.message}`);

    throw error;
  }
}

async function findBoard(start: string): Promise<Selection> {
  if (!(await candidate(start))?.isDirectory())
    throw new Exit(1, `invalid Backlog starting directory ${start}`);

  let project = start;
  while (project !== dirname(project)) {
    const rootPath = join(project, "backlog.config.yml");
    const rootBytes = await readOptionalFile({
      path: rootPath,
      description: "backlog root configuration",
    });
    let projectName = "";
    let configured: string | undefined;
    for (const raw of rootBytes?.toString().split(/\r?\n/) ?? []) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const colon = line.indexOf(":");
      if (colon < 0) continue;

      const key = line.slice(0, colon).trim();
      const value = line
        .slice(colon + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if ((key === "project_name" || key === "projectName") && value) projectName = value;
      if (key === "backlog_directory" || key === "backlogDirectory") {
        const normalized = normalize(value).replace(/\\/g, "/").replace(/\/+$/g, "");
        configured =
          value &&
          !/^(?:[a-zA-Z]:)?[\\/]/.test(value) &&
          normalized !== "." &&
          normalized !== ".." &&
          !normalized.startsWith("../")
            ? normalized
            : undefined;
      }
    }
    const builtins = [join(project, "backlog"), join(project, ".backlog")];
    const folders: { path: string; config: string; bytes: string }[] = [];
    const directories: string[] = [];
    for (const path of builtins) {
      for (const name of ["config.yml", "config.yaml"]) {
        if (!(await candidate(join(path, name)))?.isFile()) continue;

        folders.push({
          path,
          config: join(path, name),
          bytes: (await readFile(join(path, name))).toString(),
        });
        break;
      }
      if ((await candidate(path))?.isDirectory()) directories.push(path);
    }
    const selected = projectName
      ? configured
        ? join(project, configured)
        : (folders[0]?.path ?? directories[0])
      : folders[0]?.path;
    if (selected) {
      const board = await realpath(selected);
      if (!(await stat(board)).isDirectory())
        throw new Exit(1, `the local backlog board is not a directory at ${board}`);

      const folder = folders.find((entry) => entry.path === selected);
      const config = projectName
        ? { path: rootPath, bytes: rootBytes?.toString() ?? "" }
        : { path: folder?.config ?? "", bytes: folder?.bytes ?? "" };

      return { board, start, project, config };
    }

    if (projectName) throw new Exit(1, `the local backlog board is missing at ${project}`);

    if ((await candidate(join(project, "backlog.json")))?.isFile())
      throw new Exit(
        1,
        "legacy backlog.json board resolution requires an explicit compatible backend",
      );

    project = dirname(project);
  }
  throw new Exit(1, "the local backlog board is missing; no ownership can be established");
}

export class BoardTarget {
  retained = false;
  private initialReadComplete = false;
  private constructor(
    readonly evidence: z.infer<typeof boardTargetSchema>,
    private readonly writeJson: JsonWriter,
    private readonly remove: FileRemoval = unlink,
    private readonly removeDirectory: FileRemoval = rmdir,
  ) {}

  get board(): string {
    return this.evidence.board;
  }
  get view(): string {
    return this.evidence.view;
  }

  static async create(
    writeJson: JsonWriter,
    selection: Selection,
    remove: FileRemoval = unlink,
    removeDirectory: FileRemoval = rmdir,
  ): Promise<BoardTarget> {
    const directory = join(selection.board, ".iterate", "targets");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const view = await mkdtemp(join(directory, "project-"));
    const route = /^(\s*)(backlog_directory|backlogDirectory)\s*:.*$/gm;
    const hasRoute = route.test(selection.config.bytes);
    const configBytes =
      selection.config.bytes.replace(route, '$1$2: "backlog"') +
      (hasRoute ? "" : '\nbacklog_directory: "backlog"\n');
    await symlink(selection.board, join(view, "backlog"));
    await writeFile(join(view, "backlog.config.yml"), configBytes, { flag: "wx", mode: 0o600 });
    const evidence = boardTargetSchema.parse({
      ...selection,
      token: randomUUID(),
      view,
      configBytes,
      targetIdentity: await stat(selection.board),
      viewIdentity: await lstat(view),
      linkIdentity: await lstat(join(view, "backlog")),
      configIdentity: await lstat(join(view, "backlog.config.yml")),
      evidence: `${view}.json`,
    });
    const target = new BoardTarget(evidence, writeJson, remove, removeDirectory);
    await writeJson(evidence.evidence, { ...evidence, state: "active", owner: process.pid });
    try {
      await target.validate();
    } catch (error) {
      await target.retain();
      throw error;
    }

    return target;
  }

  private async requireSource(): Promise<void> {
    const current = await discoverBoard(this.evidence.start);
    if (
      JSON.stringify(current) !==
      JSON.stringify({
        board: this.board,
        start: this.evidence.start,
        project: this.evidence.project,
        config: this.evidence.config,
      })
    )
      throw new Exit(1, "Backlog route or effective configuration changed; use a fresh invocation");
  }

  async validate(): Promise<void> {
    await this.requireSource();
    await this.requireOwned(this.evidence.configBytes);
  }

  async freezeInitialRead(
    locks: readonly { path: string; bytes: string; dev: number; ino: number }[],
  ): Promise<void> {
    if (this.initialReadComplete || locks.length !== 2)
      throw new Exit(1, "initial Backlog read requires its original two execution locks");

    await this.requireSource();
    const after = await readFile(join(this.view, "backlog.config.yml"), "utf8");
    await this.requireOwned(after);
    for (const saved of locks) {
      const current = await lstat(saved.path);
      if (
        !(
          current.isFile() &&
          current.dev === saved.dev &&
          current.ino === saved.ino &&
          (await readFile(saved.path, "utf8")) === saved.bytes
        )
      )
        throw new Exit(1, "execution lock changed during initial Backlog read");
    }
    const before = this.evidence.configBytes;
    if (after !== before) {
      const initial = flatConfig(before);
      const current = flatConfig(after);
      const additions = new Map([
        ["labels", "[]"],
        ["max_column_width", "80"],
        ["default_port", "6420"],
        ["active_branch_days", "30"],
        ["task_prefix", "task"],
      ]);
      if (
        !(
          initial &&
          current &&
          !initial.has("default_port") &&
          (initial.has("project_name") || initial.has("projectName")) &&
          ["statuses", "auto_open_browser", "remote_operations", "auto_commit"].every((key) =>
            initial.has(key),
          ) &&
          current.get("default_port") === "6420" &&
          [...initial].every(([key, value]) => current.get(key) === value) &&
          [...current].every(([key, value]) => initial.has(key) || additions.get(key) === value)
        )
      )
        throw new Exit(
          1,
          "private Backlog configuration changed beyond observed native default initialization; retain evidence",
        );

      this.evidence.initialization = {
        before,
        after,
        added: Object.fromEntries([...current].filter(([key]) => !initial.has(key))),
        locks: [...locks],
      };
      this.evidence.configBytes = after;
    }
    this.initialReadComplete = true;
    await this.writeJson(this.evidence.evidence, {
      ...this.evidence,
      state: "active",
      owner: process.pid,
    });
    await this.validate();
  }

  private async requireOwned(expectedConfig: string): Promise<void> {
    const value = this.evidence;
    const target = await stat(value.board);
    const view = await lstat(value.view);
    const link = await lstat(join(value.view, "backlog"));
    const config = await lstat(join(value.view, "backlog.config.yml"));
    const same = (actual: { dev: number; ino: number }, expected: { dev: number; ino: number }) =>
      actual.dev === expected.dev && actual.ino === expected.ino;
    if (
      !(
        target.isDirectory() &&
        same(target, value.targetIdentity) &&
        view.uid === value.viewIdentity.uid &&
        view.uid === process.getuid?.() &&
        view.isDirectory() &&
        !view.isSymbolicLink() &&
        (view.mode & 0o777) === 0o700 &&
        same(view, value.viewIdentity) &&
        link.uid === value.linkIdentity.uid &&
        link.uid === process.getuid?.() &&
        link.isSymbolicLink() &&
        same(link, value.linkIdentity) &&
        (await readlink(join(value.view, "backlog"))) === value.board &&
        (await realpath(join(value.view, "backlog"))) === value.board &&
        config.uid === value.configIdentity.uid &&
        config.uid === process.getuid?.() &&
        (config.mode & 0o777) === 0o600 &&
        config.isFile() &&
        !config.isSymbolicLink() &&
        same(config, value.configIdentity) &&
        (await readFile(join(value.view, "backlog.config.yml"), "utf8")) === expectedConfig
      )
    )
      throw new Exit(
        1,
        `owned Backlog target association changed at ${value.view}; retain evidence`,
      );
  }

  private async matchingRecord() {
    const value = this.evidence;
    const recordIdentity = await lstat(value.evidence);
    if (
      !(
        recordIdentity.isFile() &&
        !recordIdentity.isSymbolicLink() &&
        recordIdentity.uid === process.getuid?.() &&
        (recordIdentity.mode & 0o777) === 0o600
      )
    )
      throw new Exit(1, `original Backlog target evidence conflicts at ${value.evidence}`);

    const bytes = await readOptionalFile({
      path: value.evidence,
      description: "original Backlog target evidence",
    });
    if (!bytes)
      throw new Exit(1, `original Backlog target evidence conflicts at ${value.evidence}`);

    const record = boardTargetRecordSchema.parse(JSON.parse(bytes.toString()));
    if (!isDeepStrictEqual(boardTargetSchema.parse(record), value))
      throw new Exit(1, `original Backlog target evidence conflicts at ${value.evidence}`);

    return record;
  }

  async retain(): Promise<void> {
    this.retained = true;
    const record = await this.matchingRecord();
    if (record.state === "cleaned" || record.state === "retained") return;

    await this.writeJson(this.evidence.evidence, {
      ...this.evidence,
      state: "retained",
      owner: process.pid,
    });
  }

  static async finalize(
    evidence: z.infer<typeof boardTargetSchema>,
    writeJson: JsonWriter,
    remove: FileRemoval = unlink,
    removeDirectory: FileRemoval = rmdir,
  ): Promise<void> {
    await new BoardTarget(evidence, writeJson, remove, removeDirectory).finalize();
  }

  private async survivingResources() {
    const value = this.evidence;
    const targets = join(value.board, ".iterate", "targets");
    const refusal = () =>
      new Exit(1, `owned Backlog target association changed at ${value.view}; retain evidence`);
    if (
      value.board !== resolve(value.board) ||
      value.view !== resolve(value.view) ||
      dirname(value.view) !== targets ||
      !basename(value.view).startsWith("project-") ||
      value.evidence !== `${value.view}.json`
    )
      throw refusal();

    const board = await lstat(value.board);
    if (
      !(
        board.isDirectory() &&
        !board.isSymbolicLink() &&
        board.dev === value.targetIdentity.dev &&
        board.ino === value.targetIdentity.ino &&
        (await realpath(value.board)) === value.board
      )
    )
      throw refusal();

    for (const path of [join(value.board, ".iterate"), targets]) {
      const ancestor = await lstat(path);
      if (
        !(
          ancestor.isDirectory() &&
          !ancestor.isSymbolicLink() &&
          ancestor.uid === process.getuid?.() &&
          (await realpath(path)) === path
        )
      )
        throw refusal();
    }
    await this.matchingRecord();
    const optional = async (path: string) =>
      lstat(path).catch((error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return;

        throw error;
      });
    const same = (
      actual: { dev: number; ino: number; uid: number; mode: number },
      expected: z.infer<typeof ownedIdentitySchema>,
    ) =>
      actual.dev === expected.dev &&
      actual.ino === expected.ino &&
      actual.uid === expected.uid &&
      actual.uid === process.getuid?.() &&
      actual.mode === expected.mode;
    const view = await optional(value.view);
    if (!view) return { config: false, link: false, view: false };

    if (
      !(
        view.isDirectory() &&
        !view.isSymbolicLink() &&
        same(view, value.viewIdentity) &&
        (view.mode & 0o777) === 0o700
      )
    )
      throw refusal();

    const names = await readdir(value.view);
    if (names.some((name) => name !== "backlog.config.yml" && name !== "backlog")) throw refusal();

    const config = await optional(join(value.view, "backlog.config.yml"));
    const link = await optional(join(value.view, "backlog"));
    if (
      config &&
      !(
        config.isFile() &&
        !config.isSymbolicLink() &&
        same(config, value.configIdentity) &&
        (config.mode & 0o777) === 0o600 &&
        (await readFile(join(value.view, "backlog.config.yml"), "utf8")) === value.configBytes
      )
    )
      throw refusal();

    if (
      link &&
      !(
        link.isSymbolicLink() &&
        same(link, value.linkIdentity) &&
        (await readlink(join(value.view, "backlog"))) === value.board &&
        (await realpath(join(value.view, "backlog"))) === value.board
      )
    )
      throw refusal();

    return { config: !!config, link: !!link, view: true };
  }

  private async finalize(): Promise<void> {
    await this.survivingResources();
    if ((await this.survivingResources()).config)
      await this.remove(join(this.view, "backlog.config.yml"));
    if ((await this.survivingResources()).link) await this.remove(join(this.view, "backlog"));
    if ((await this.survivingResources()).view) await this.removeDirectory(this.view);
    const remaining = await this.survivingResources();
    if (remaining.config || remaining.link || remaining.view)
      throw new Exit(1, "owned Backlog target finalization remains incomplete; retain exclusion");

    const record = await this.matchingRecord();
    if (record.state !== "cleaned")
      await this.writeJson(this.evidence.evidence, {
        ...this.evidence,
        state: "cleaned",
        owner: process.pid,
      });
  }

  async cleanup(): Promise<void> {
    try {
      await this.finalize();
    } catch (error) {
      await this.retain();
      throw error;
    }
  }
}

function flatConfig(bytes: string): Map<string, string> | undefined {
  const values = new Map<string, string>();
  for (const raw of bytes.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const colon = line.indexOf(":");
    if (colon < 0) return;

    const key = line.slice(0, colon).trim();
    const value = line
      .slice(colon + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (
      values.has(key) &&
      (!(key === "backlog_directory" || key === "backlogDirectory") || values.get(key) !== value)
    )
      return;

    values.set(key, value);
  }

  return values;
}
