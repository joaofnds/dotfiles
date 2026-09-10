import { Exit } from "./exit.ts";

export const stages = ["triage", "shape", "debug", "verify", "build", "review", "reflect"] as const;
export type Stage = (typeof stages)[number];

const claudeEfforts = ["low", "medium", "high", "xhigh", "max"] as const;
const codexEfforts = ["low", "medium", "high", "xhigh", "max"] as const;
type ClaudeEffort = (typeof claudeEfforts)[number];
type CodexEffort = (typeof codexEfforts)[number];

export type StageAgent =
  | { readonly provider: "claude"; readonly model: string; readonly effort?: ClaudeEffort }
  | { readonly provider: "codex"; readonly model: string; readonly effort?: CodexEffort }
  | { readonly provider: "opencode"; readonly model: string; readonly effort?: string };

export const defaultAgent: StageAgent = { provider: "claude", model: "opus" };

export const agentsHelp = `ITERATE_AGENTS names the agent for each stage, separated by commas or spaces, as
stage=provider:model[:effort]. Stages are ${stages.join(", ")}; providers are claude, codex,
and opencode; a stage left out runs on ${defaultAgent.provider}:${defaultAgent.model}. For example
ITERATE_AGENTS=shape=claude:opus:high,build=codex:gpt-6-astra,review=claude:sonnet`;

export function agentsFromSpec(spec: string): Map<Stage, StageAgent> {
  const agents = new Map<Stage, StageAgent>();
  for (const entry of spec.split(/[\s,]+/).filter(Boolean)) {
    const [stage, agent] = entryFrom(entry);
    agents.set(stage, agent);
  }

  return agents;
}

function entryFrom(entry: string): [Stage, StageAgent] {
  const [stage, agent, ...rest] = entry.split("=");
  if (!(oneOf(stages, stage) && agent) || rest.length > 0) {
    throw new Exit(1, `${entry} is not stage=provider:model[:effort]`);
  }

  return [stage, agentFrom(agent, entry)];
}

function oneOf<const T extends readonly string[]>(
  list: T,
  value: string | undefined,
): value is T[number] {
  return list.some((item) => item === value);
}

function agentFrom(text: string, entry: string): StageAgent {
  const [provider, model, effort, ...rest] = text.split(":");
  if (!model || rest.length > 0) throw new Exit(1, `${entry} is not stage=provider:model[:effort]`);

  if (provider === "claude") {
    return effort === undefined
      ? { provider, model }
      : { provider, model, effort: effortIn(claudeEfforts, effort, entry) };
  }

  if (provider === "codex") {
    return effort === undefined
      ? { provider, model }
      : { provider, model, effort: effortIn(codexEfforts, effort, entry) };
  }

  if (provider === "opencode") {
    return effort === undefined ? { provider, model } : { provider, model, effort };
  }

  throw new Exit(1, `${entry}: provider is one of claude, codex, opencode`);
}

function effortIn<const T extends readonly string[]>(
  efforts: T,
  effort: string,
  entry: string,
): T[number] {
  if (!oneOf(efforts, effort)) {
    throw new Exit(1, `${entry}: effort is one of ${efforts.join(", ")}`);
  }

  return effort;
}
