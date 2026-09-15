import { z } from "zod";
import { Exit } from "./exit.ts";

export const stages = ["shape", "debug", "verify", "build", "review"] as const;
export type Stage = (typeof stages)[number];

const efforts = ["low", "medium", "high", "xhigh", "max"] as const;
const effortSchema = z.enum(efforts);
const agentSchema = z.object({
  provider: z.literal("claude"),
  model: z.string().optional(),
  effort: effortSchema.optional(),
});
const stageRequestSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  effort: z.string().min(1).optional(),
});
export type StageAgent = z.infer<typeof agentSchema>;
type StageRequest = z.infer<typeof stageRequestSchema>;

export type AgentPlan = {
  readonly direct?: StageAgent;
  readonly stages: ReadonlyMap<Stage, StageRequest>;
};

export const defaultAgent: StageAgent = { provider: "claude" };

export function agentPlanFromArgs(args: readonly string[]): AgentPlan {
  const direct: string[] = [];
  const selected = new Map<Stage, StageRequest>();

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Exit(
        1,
        "agent options need a value; see iterate --help for direct and stage options",
      );
    }

    const stage = stageFromFlag(flag);
    if (stage === undefined) {
      direct.push(flag, value);
      continue;
    }

    if (selected.has(stage)) throw new Exit(1, `${flag} was supplied more than once`);

    selected.set(stage, stageRequest(value, flag));
  }

  if (direct.length > 0 && selected.size > 0) {
    throw new Exit(1, "direct agent options cannot be combined with stage agent options");
  }

  return {
    ...(direct.length === 0 ? {} : { direct: agentFromArgs(direct) }),
    stages: selected,
  };
}

export function agentForStage(plan: AgentPlan, stage: Stage): StageAgent {
  if (plan.direct) return plan.direct;

  const requested = plan.stages.get(stage);
  if (!requested) return defaultAgent;

  if (requested.provider !== "claude") {
    throw new Exit(1, `${requested.provider} is not implemented; provider is claude`);
  }

  const effort = optionalEffort(requested.effort);
  return agentSchema.parse({
    provider: "claude",
    model: requested.model,
    ...(effort === undefined ? {} : { effort }),
  });
}

export function agentFromArgs(args: readonly string[]): StageAgent {
  let model: string | undefined;
  let effort: z.infer<typeof effortSchema> | undefined;
  const seen = new Set<string>();

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Exit(1, "agent options are --provider VALUE, --model VALUE or --effort VALUE");
    }

    if (seen.has(flag)) throw new Exit(1, `${flag} was supplied more than once`);

    seen.add(flag);

    if (flag === "--provider") {
      if (value !== "claude") throw new Exit(1, `${value} is not implemented; provider is claude`);
    } else if (flag === "--model") {
      model = value;
    } else if (flag === "--effort") {
      const parsed = effortSchema.safeParse(value);
      if (!parsed.success) {
        throw new Exit(1, `effort is one of ${efforts.join(", ")}`);
      }

      effort = parsed.data;
    } else {
      throw new Exit(1, `unknown option ${flag}; see iterate --help`);
    }
  }

  return agentSchema.parse({
    provider: "claude",
    ...(model === undefined ? {} : { model }),
    ...(effort === undefined ? {} : { effort }),
  });
}

function stageFromFlag(flag: string): Stage | undefined {
  return stages.find((stage) => flag === `--${stage}-agent`);
}

function stageRequest(value: string, flag: string): StageRequest {
  const [provider, model, effort, ...rest] = value.split(":");
  const parsed = stageRequestSchema.safeParse({ provider, model, effort });
  if (!parsed.success || rest.length > 0) {
    throw new Exit(1, `${flag} must be provider:model[:effort]`);
  }

  return parsed.data;
}

function optionalEffort(value: string | undefined): z.infer<typeof effortSchema> | undefined {
  if (value === undefined) return undefined;

  const parsed = effortSchema.safeParse(value);
  if (!parsed.success) throw new Exit(1, `effort is one of ${efforts.join(", ")}`);

  return parsed.data;
}
