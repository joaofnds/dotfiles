import type { AgentSelection } from "./agents.ts";
import { claudeHarness } from "./claude.ts";
import { codexHarness } from "./codex.ts";
import { executableFor } from "./executable.ts";
import { diagnostic, Exit } from "./exit.ts";
import { hosted } from "./hosted.ts";
import type {
  Harness,
  HarnessAdapter,
  ProviderAdapter,
  RuntimeContract,
} from "./provider-types.ts";
import { versionFor } from "./version-probe.ts";

export type {
  HarnessAdapter,
  ProviderCommand,
  ProviderEvent,
  SessionAdapter,
  SessionInput,
} from "./provider-types.ts";

export const providerNames = ["claude", "codex"] as const;
export type ProviderName = (typeof providerNames)[number];

const harnesses: Readonly<Record<ProviderName, Harness>> = {
  claude: claudeHarness,
  codex: codexHarness,
};
const hostedHarnesses: Readonly<Record<ProviderName, HarnessAdapter>> = {
  claude: hosted(claudeHarness),
  codex: hosted(codexHarness),
};

export const adapters: readonly HarnessAdapter[] = providerNames.map(
  (name) => hostedHarnesses[name],
);

function providerName(provider: string): ProviderName {
  const name = providerNames.find((candidate) => candidate === provider);
  if (!name)
    throw new Exit(1, `${provider} is not implemented; providers are ${providerNames.join(", ")}`);

  return name;
}

export function harnessFor(provider: string): Harness {
  return harnesses[providerName(provider)];
}

export function adapterFor(provider: string): HarnessAdapter {
  return hostedHarnesses[providerName(provider)];
}

// Capabilities come from the selected adapter. An omitted model table means only
// its advertised effort envelope is known, not model-specific live acceptance.
export function validateAgentSelection(
  selection: AgentSelection,
  capabilities: ProviderAdapter["capabilities"],
): void {
  if (selection.model && !capabilities.model) {
    throw new Exit(1, `${selection.provider} does not support model selection`);
  }

  const modelEfforts = capabilities.modelEfforts;
  let efforts = capabilities.efforts;
  if (selection.model && modelEfforts) {
    const declared = modelEfforts[selection.model];
    if (!Object.hasOwn(modelEfforts, selection.model) || declared === undefined) {
      throw new Exit(1, `unknown ${selection.provider} model capabilities for ${selection.model}`);
    }

    efforts = declared;
  }

  if (selection.effort && !efforts.includes(selection.effort)) {
    throw new Exit(
      1,
      `${selection.provider} effort is one of ${efforts.join(", ")}${selection.model ? ` for ${selection.model}` : ""}`,
    );
  }
}

export function budgetFor(input: {
  readonly provider: string;
  readonly capabilities: ProviderAdapter["capabilities"];
  readonly explicitSession?: string;
  readonly runRemaining?: number;
}): string | undefined {
  const explicit = input.explicitSession;
  if (explicit && !(Number.isFinite(Number(explicit)) && Number(explicit) > 0)) {
    throw new Exit(1, `${explicit} is not a session budget in dollars`);
  }

  if ((explicit || input.runRemaining !== undefined) && !input.capabilities.dollarCap) {
    throw new Exit(1, `${input.provider} cannot enforce an explicit dollar cap`);
  }
  if (!input.capabilities.dollarCap) return undefined;

  const limit = explicit ? Number(explicit) : input.capabilities.defaultDollarCap;
  if (limit === undefined && input.runRemaining === undefined) return undefined;

  if (input.capabilities.dollarCapBasis !== "invocation") {
    throw new Exit(
      1,
      `${input.provider} dollar cap semantics are not established for this invocation`,
    );
  }

  return String(
    Math.min(limit ?? Number.POSITIVE_INFINITY, input.runRemaining ?? Number.POSITIVE_INFINITY),
  );
}

export async function runtimeContract({
  provider,
  rolePolicy,
}: {
  readonly provider: string;
  readonly rolePolicy: string;
}): Promise<RuntimeContract> {
  const adapter = adapterFor(provider);
  const executable = executableFor(adapter);
  if (!executable) throw new Exit(1, `${provider} executable is unavailable`);

  let cliVersion: string;
  try {
    cliVersion = await versionFor({ provider, executable });
  } catch (error) {
    if (error instanceof Exit) throw error;

    throw new Exit(1, `${provider} version startup failed: ${diagnostic(error)}`);
  }

  return adapter.runtimeContract({ executable, cliVersion, rolePolicy });
}
