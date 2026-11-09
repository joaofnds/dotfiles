import { createHash, type Hash } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { z } from "zod";
import { diagnostic, Exit } from "./exit.ts";
import { readOptionalFile } from "./files.ts";
import type { RuntimeContract, RuntimeContractInput } from "./provider-types.ts";

export async function claudeRuntimeContract({
  executable,
  cliVersion,
  rolePolicy,
}: RuntimeContractInput): Promise<RuntimeContract> {
  const configRoot = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const paths = [
    executable,
    join(configRoot, "settings.json"),
    join(configRoot, "settings.local.json"),
    join(configRoot, "CLAUDE.md"),
    "/Library/Application Support/ClaudeCode/managed-settings.json",
  ];
  let directory = process.cwd();
  while (true) {
    paths.push(
      join(directory, ".claude", "settings.json"),
      join(directory, ".claude", "settings.local.json"),
      join(directory, "CLAUDE.md"),
      join(directory, ".claude", "CLAUDE.md"),
      join(directory, "CLAUDE.local.md"),
      join(directory, "AGENTS.md"),
    );
    const parent = dirname(directory);
    if (parent === directory) break;

    directory = parent;
  }
  const hash = createHash("sha256");
  hashRuntimeInput(hash, "iterate:claude-runtime:v2");
  for (const path of paths) {
    hashRuntimeInput(hash, path);
    hashRuntimeInput(hash, await runtimeFile(path));
  }
  const statePath = join(process.env.CLAUDE_CONFIG_DIR || homedir(), ".claude.json");
  hashRuntimeInput(hash, statePath);
  hashRuntimeInput(hash, JSON.stringify(await nativeConfiguration(statePath)));
  const mcpPath = join(process.cwd(), ".mcp.json");
  const mcp = await runtimeFile(mcpPath);
  hashRuntimeInput(hash, mcpPath);
  hashRuntimeInput(hash, mcp);
  if (mcp !== undefined)
    hashRuntimeInput(hash, JSON.stringify(referencedEnvironment(runtimeJson(mcpPath, mcp))));
  const environment = Object.entries(process.env)
    .filter(([key]) => /^(CLAUDE|ANTHROPIC)_/.test(key))
    .sort(([left], [right]) => left.localeCompare(right));
  hashRuntimeInput(hash, JSON.stringify(environment));
  hashRuntimeInput(hash, cliVersion);
  hashRuntimeInput(hash, "permission-mode:auto");

  return { cliVersion, fingerprint: hash.digest("hex"), rolePolicy };
}

function hashRuntimeInput(hash: Hash, value: string | Buffer | undefined): void {
  if (value === undefined) {
    hash.update("absent:");
    return;
  }

  const bytes = typeof value === "string" ? Buffer.from(value) : value;

  hash.update(`present:${bytes.length}:`);
  hash.update(bytes);
}

const projectConfiguration = z.object({
  allowedTools: z.unknown().optional(),
  mcpServers: z.unknown().optional(),
  mcpContextUris: z.unknown().optional(),
  enabledMcpjsonServers: z.unknown().optional(),
  disabledMcpjsonServers: z.unknown().optional(),
  enabledMcpServers: z.unknown().optional(),
  disabledMcpServers: z.unknown().optional(),
  enableAllProjectMcpServers: z.unknown().optional(),
  hasTrustDialogAccepted: z.unknown().optional(),
});
const nativeConfigurationSchema = z.object({
  mcpServers: z.unknown().optional(),
  teammateDefaultModel: z.unknown().optional(),
  autoConnectIde: z.unknown().optional(),
  autoInstallIdeExtension: z.unknown().optional(),
  externalEditorContext: z.unknown().optional(),
  claudeInChromeDefaultEnabled: z.unknown().optional(),
  oauthAccount: z.unknown().optional(),
  projects: z.record(z.string(), z.unknown()).optional(),
});

async function nativeConfiguration(path: string) {
  const bytes = await runtimeFile(path);
  try {
    const { projects, ...configuration } = nativeConfigurationSchema.parse(
      bytes === undefined ? {} : runtimeJson(path, bytes),
    );
    const relevantProjects: { path: string; configuration: unknown }[] = [];
    const projectMcp: unknown[] = [];
    let directory = process.cwd();
    while (true) {
      const entry = projects?.[directory];
      if (entry !== undefined) {
        const parsed = projectConfiguration.parse(entry);
        if (Object.keys(parsed).length > 0)
          relevantProjects.push({ path: directory, configuration: parsed });
        if (parsed.mcpServers !== undefined) projectMcp.push(parsed.mcpServers);
      }
      const parent = dirname(directory);
      if (parent === directory) break;

      directory = parent;
    }

    return {
      ...configuration,
      projects: relevantProjects,
      referencedEnvironment: referencedEnvironment({
        global: configuration.mcpServers,
        projectMcp,
      }),
    };
  } catch (error) {
    if (error instanceof Exit) throw error;

    throw new Exit(1, `reading runtime configuration ${path} failed: ${diagnostic(error)}`);
  }
}

async function runtimeFile(path: string): Promise<Buffer | undefined> {
  return readOptionalFile({ path, description: "runtime configuration" });
}

function runtimeJson(path: string, bytes: Buffer): unknown {
  try {
    return JSON.parse(bytes.toString());
  } catch {
    throw new Exit(1, `runtime configuration ${path} is not valid JSON`);
  }
}

function referencedEnvironment(
  value: unknown,
): readonly { readonly name: string; readonly value: string | undefined }[] {
  const bindings: { readonly name: string; readonly value: string | undefined }[] = [];
  for (const match of (JSON.stringify(value) ?? "").matchAll(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}/g,
  )) {
    const name = match[1];
    if (name === undefined) continue;

    bindings.push({ name, value: Object.hasOwn(process.env, name) ? process.env[name] : match[2] });
  }

  return bindings;
}
