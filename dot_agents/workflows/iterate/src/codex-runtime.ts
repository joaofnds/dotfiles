import { createHash } from "node:crypto";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { TOML } from "bun";
import { z } from "zod";
import { codexCompletionOutputSchema } from "./codex-completion.ts";
import { Exit } from "./exit.ts";
import { readOptionalFile } from "./files.ts";
import type { RuntimeContract } from "./provider-types.ts";

const table = z.record(z.string(), z.unknown());
const names = z.array(
  z
    .string()
    .min(1)
    .refine((name) => basename(name) === name && name !== "." && name !== ".."),
);
const fileReference = z.string().min(1);

export async function codexRuntimeContract(input: {
  readonly executable: string;
  readonly cliVersion: string;
  readonly rolePolicy: string;
}): Promise<RuntimeContract> {
  try {
    const home = homedir();
    const codexHome = resolve(process.env.CODEX_HOME || join(home, ".codex"));
    const inputs = new CodexRuntimeInputs({
      codexHome,
      personalCodexHome: join(home, ".codex"),
      agentsHome: join(home, ".agents"),
      cwd: process.cwd(),
    });
    await inputs.collect(input.executable);

    return inputs.contract(input);
  } catch (error) {
    if (error instanceof Exit) throw error;

    throw new Exit(
      1,
      `reading Codex runtime inputs at ${process.cwd()} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

class CodexRuntimeInputs {
  private readonly files = new Map<string, Buffer | undefined>();
  private readonly visited = new Set<string>();
  private readonly bindings = new Map<string, string>();
  private readonly configurations = new Map<string, Record<string, unknown>>();
  private readonly activeConfigurations = new Set<string>();
  private readonly protectedHomes = new Set<string>();
  private readonly unresolved = new Set<string>();
  private readonly fallbacks = new Set<string>();

  constructor(
    private readonly roots: {
      readonly codexHome: string;
      readonly personalCodexHome: string;
      readonly agentsHome: string;
      readonly cwd: string;
    },
  ) {}

  async collect(executable: string): Promise<void> {
    for (const home of [this.roots.codexHome, this.roots.personalCodexHome]) {
      this.protectedHomes.add(home);
      const canonical = await realpath(home).catch((error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return home;

        throw error;
      });
      this.protectedHomes.add(canonical);
    }
    await this.file(executable);
    const user = await this.config(join(this.roots.codexHome, "config.toml"), "user");
    const markers = names.safeParse(user.project_root_markers ?? [".git"]);
    const boundaryMarkers = [".git"];
    if (!markers.success)
      this.unresolved.add("project_root_markers cannot establish the project boundary");
    if (user.project_root_markers !== undefined)
      this.unresolved.add(
        "custom project_root_markers instruction and skill boundaries are unestablished",
      );

    const directories: string[] = [];
    let directory = this.roots.cwd;
    while (true) {
      directories.push(directory);
      const found = await Promise.all(
        boundaryMarkers.map((marker) => this.marker(join(directory, marker))),
      );
      if (found.some(Boolean)) break;

      const parent = dirname(directory);
      if (parent === directory) {
        directories.splice(1);
        break;
      }

      directory = parent;
    }
    for (const project of directories.toReversed()) {
      const config = await this.config(join(project, ".codex", "config.toml"), "project");
      if (config.project_root_markers !== undefined)
        this.unresolved.add(
          "project configuration overrides project_root_markers; boundary precedence is unestablished",
        );
    }
    for (const project of directories) await this.agentDirectory(join(project, ".codex", "agents"));
    await this.agentDirectory(join(this.roots.codexHome, "agents"));
    await this.agentDirectory(join(this.roots.personalCodexHome, "agents"));

    for (const project of directories) {
      for (const name of ["AGENTS.override.md", "AGENTS.md", ...this.fallbacks])
        await this.file(join(project, name));
      await this.directory(join(project, ".agents", "skills"));
    }
    for (const name of ["AGENTS.override.md", "AGENTS.md"])
      await this.file(join(this.roots.codexHome, name));
    await this.file(join(this.roots.agentsHome, "AGENTS.md"));
    for (const root of [
      join(this.roots.codexHome, "rules"),
      join(this.roots.codexHome, "skills"),
      join(this.roots.agentsHome, "agents"),
      join(this.roots.agentsHome, "rulebook"),
      join(this.roots.agentsHome, "skills"),
      "/etc/codex/skills",
    ])
      await this.directory(root);
  }

  contract(input: { readonly cliVersion: string; readonly rolePolicy: string }): RuntimeContract {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(["structured-completion-v1", codexCompletionOutputSchema]));
    for (const [path, bytes] of [...this.files].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const content = bytes === undefined ? null : createHash("sha256").update(bytes).digest("hex");
      hash.update(JSON.stringify(["file", path, content]));
    }
    for (const [path, canonical] of [...this.bindings].sort(([left], [right]) =>
      left.localeCompare(right),
    ))
      hash.update(JSON.stringify(["binding", path, canonical]));
    const reasons = [...this.unresolved].sort();
    hash.update(JSON.stringify({ ...this.roots, ...input, localInputReasons: reasons }));

    return {
      cliVersion: input.cliVersion,
      fingerprint: hash.digest("hex"),
      rolePolicy: input.rolePolicy,
      localInputs: { established: reasons.length === 0, reasons },
      coverage: [
        "executable/version",
        "CODEX_HOME/config.toml",
        "project-boundary config and AGENTS/fallback candidates",
        "ancestor repository and global skills/rules/agents",
        "supported explicit instruction and role configuration references",
        "lexical-to-canonical instruction/reference bindings",
        "requested role policy",
        "structured completion protocol/schema v1",
      ],
      unknowns: [
        "managed/remote configuration and dynamic instruction discovery",
        "per-turn execution telemetry",
        "required-tool outcome coverage",
      ],
    };
  }

  private async file(path: string): Promise<Buffer | undefined> {
    if (this.protectedStorage(path)) {
      this.unresolved.add("a runtime reference targets credential or mutable session storage");
      return undefined;
    }

    const canonical = await realpath(path).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return path;

      throw error;
    });
    if (this.protectedStorage(path) || this.protectedStorage(canonical)) {
      this.unresolved.add("a runtime reference targets credential or mutable session storage");
      return undefined;
    }

    this.bindings.set(path, canonical);
    if (this.files.has(path)) return this.files.get(path);

    const bytes = await readOptionalFile({ path, description: "Codex runtime input" });
    this.files.set(path, bytes);

    return bytes;
  }

  private async marker(path: string): Promise<boolean> {
    try {
      await lstat(path);
      return true;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;

      throw error;
    }
  }

  private async config(
    path: string,
    scope: "user" | "project" | "role" | "standalone",
  ): Promise<Record<string, unknown>> {
    if (this.activeConfigurations.has(path)) {
      this.unresolved.add("recursive role configuration references are unestablished");
      return {};
    }

    const cacheKey = `${scope}:${path}`;
    const cached = this.configurations.get(cacheKey);
    if (cached !== undefined) return cached;

    const bytes = await this.file(path);
    if (bytes === undefined) return {};

    let config: Record<string, unknown>;
    try {
      config = table.parse(TOML.parse(bytes));
    } catch {
      this.unresolved.add("a local TOML configuration cannot be parsed");
      return {};
    }
    this.configurations.set(cacheKey, config);
    this.activeConfigurations.add(path);
    if (config.project_doc_fallback_filenames !== undefined) {
      const parsed = names.safeParse(config.project_doc_fallback_filenames);
      if (parsed.success) for (const name of parsed.data) this.fallbacks.add(name);
      else
        this.unresolved.add(
          "project_doc_fallback_filenames cannot establish instruction filenames",
        );
    }
    for (const key of [
      "model_instructions_file",
      "experimental_instructions_file",
      "experimental_compact_prompt_file",
    ]) {
      if (config[key] === undefined) continue;

      const parsed = fileReference.safeParse(config[key]);
      if (!(parsed.success && isAbsolute(parsed.data))) {
        this.unresolved.add(
          `${key} reference resolution is unestablished; an absolute file is required for compatible resume`,
        );
        continue;
      }

      const canonical = await this.canonicalReference(parsed.data);
      if (canonical !== undefined) await this.file(canonical);
    }
    if (config.agents !== undefined) {
      const agents = table.safeParse(config.agents);
      if (agents.success)
        for (const value of Object.values(agents.data)) {
          const role = z
            .object({ config_file: fileReference.optional() })
            .passthrough()
            .safeParse(value);
          if (role.success && role.data.config_file !== undefined) {
            const declaringDirectory = await realpath(dirname(path));
            const actualDirectory = dirname(await realpath(path));
            if (!isAbsolute(role.data.config_file) && declaringDirectory !== actualDirectory) {
              this.unresolved.add(
                "relative role configuration base through a symlinked declaring file is unestablished",
              );
              continue;
            }

            const canonical = await this.canonicalReference(
              resolve(dirname(path), role.data.config_file),
            );
            if (canonical !== undefined) await this.config(canonical, "role");
          } else if (typeof value === "object" && value !== null && !role.success)
            this.unresolved.add("an agent configuration reference cannot be parsed");
        }
      else this.unresolved.add("agent configuration references are unestablished");
    }
    if (config.skills !== undefined) {
      const skills = z
        .object({
          config: z.array(z.object({ path: fileReference.optional() }).passthrough()).optional(),
        })
        .passthrough()
        .safeParse(config.skills);
      if (skills.success)
        for (const skill of skills.data.config ?? []) {
          if (skill.path === undefined) continue;

          if (isAbsolute(skill.path) && basename(skill.path) === "SKILL.md")
            await this.directory(dirname(skill.path));
          else this.unresolved.add("configured skill path resolution is unestablished");
        }
      else this.unresolved.add("configured skill references cannot be parsed");
    }
    for (const key of [
      "profile",
      "profiles",
      "mcp_servers",
      "plugins",
      "marketplaces",
      "hooks",
      "memories",
      "model_catalog_json",
      "model_providers",
    ]) {
      if (scope === "project" && ["profile", "profiles", "model_providers"].includes(key)) continue;
      if (
        scope === "standalone" &&
        ["profile", "profiles", "mcp_servers", "model_providers"].includes(key)
      )
        continue;

      if (config[key] !== undefined)
        this.unresolved.add(
          `${key} external runtime inputs are unestablished for compatible resume`,
        );
    }

    this.activeConfigurations.delete(path);

    return config;
  }

  private async canonicalReference(path: string): Promise<string | undefined> {
    if (this.protectedStorage(path)) {
      this.unresolved.add("a runtime reference targets credential or mutable session storage");
      return undefined;
    }

    try {
      const canonical = await realpath(path);
      if (this.protectedStorage(canonical)) {
        this.unresolved.add("a runtime reference targets credential or mutable session storage");
        return undefined;
      }

      this.bindings.set(path, canonical);

      return canonical;
    } catch {
      this.unresolved.add("a referenced local instruction/configuration file is unavailable");
      return undefined;
    }
  }

  private async agentDirectory(path: string): Promise<void> {
    await this.directory(path);
    let entries: string[];
    try {
      const canonical = await realpath(path);
      if (this.protectedStorage(path) || this.protectedStorage(canonical)) return;

      entries = await readdir(path);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return;

      throw error;
    }
    for (const name of entries.sort()) {
      if (name.endsWith(".toml")) await this.config(join(path, name), "standalone");
    }
  }

  private protectedStorage(path: string): boolean {
    for (const home of this.protectedHomes) {
      const within = relative(home, path);
      if (within.startsWith("..") || isAbsolute(within)) continue;

      const first = within.split("/")[0] ?? "";
      if (
        [
          "auth.json",
          "auth_tokens.json",
          "credentials.json",
          "sessions",
          "memories",
          "history.jsonl",
        ].includes(first) ||
        /^state_[0-9]+\.sqlite(?:-(?:wal|shm))?$/.test(first)
      )
        return true;
    }
    return false;
  }

  private async directory(path: string): Promise<void> {
    if (this.protectedStorage(path)) {
      this.unresolved.add("an instruction root targets credential or mutable session storage");
      return;
    }

    let canonical: string;
    try {
      canonical = await realpath(path);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        await this.file(path);
        return;
      }

      throw error;
    }
    if (this.protectedStorage(path) || this.protectedStorage(canonical)) {
      this.unresolved.add("an instruction root targets credential or mutable session storage");
      return;
    }

    this.bindings.set(path, canonical);
    if (this.visited.has(canonical)) return;

    this.visited.add(canonical);
    const entry = await stat(path);
    if (entry.isFile()) {
      await this.file(path);
      return;
    }

    if (!entry.isDirectory())
      throw new Error(`Codex instruction input ${path} is not a file or directory`);

    for (const name of (await readdir(path)).sort()) await this.directory(join(path, name));
  }
}
