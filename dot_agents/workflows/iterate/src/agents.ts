import { z } from "zod";
import { definedFields } from "./defined-fields.ts";
import { Exit } from "./exit.ts";
import {
  adapterFor,
  type ProviderName,
  providerNames,
  validateAgentSelection,
} from "./provider.ts";

export const stages = ["shape", "debug", "verify", "build", "review"] as const;
export type Stage = (typeof stages)[number];
export const roles = ["screener", "advisor", "reviewer"] as const;
export type Role = (typeof roles)[number];

const field = z.string().min(1).regex(/^\S+$/);
type Providers = readonly [string, ...string[]];

function selectionOver<const P extends Providers>(providers: P) {
  return z
    .object({
      provider: z.enum(providers),
      model: field.optional(),
      effort: field.optional(),
    })
    .strict();
}

/** A supervised plan whose selections may name only the given providers. */
export function planSchemaOver<const P extends Providers>(providers: P) {
  const selection = selectionOver(providers);
  return z
    .object({
      defaults: selection,
      stages: z.record(z.enum(stages), selection),
      roles: z.partialRecord(
        z.enum(roles),
        z
          .object({
            agent: selection.optional(),
            model: field.optional(),
            effort: field.optional(),
          })
          .strict(),
      ),
      originalRequest: z.array(z.string()),
    })
    .strict();
}

const selectionSchema = selectionOver(providerNames);
export type AgentSelection<P extends string = ProviderName> = {
  readonly provider: P;
  readonly model?: string | undefined;
  readonly effort?: string | undefined;
};
export const agentSchema = selectionSchema.extend({
  provider: z.enum(providerNames),
});
export type StageAgent = Readonly<z.infer<typeof agentSchema>>;
type AgentOverride<P extends string = ProviderName> = {
  readonly agent?: AgentSelection<P> | undefined;
  readonly model?: string | undefined;
  readonly effort?: string | undefined;
};
export const supervisedPlanSchema = planSchemaOver(providerNames);
export type SupervisedPlan<P extends string = ProviderName> = {
  readonly defaults: AgentSelection<P>;
  readonly stages: Readonly<Record<Stage, AgentSelection<P>>>;
  readonly roles: Readonly<Partial<Record<Role, AgentOverride<P>>>>;
  readonly originalRequest: readonly string[];
};
export type AgentPlan =
  | { readonly direct: StageAgent; readonly supervised?: never }
  | { readonly supervised: SupervisedPlan; readonly direct?: never };

export const defaultAgent: StageAgent = { provider: "claude" };

export function agentPlanFromArgs(args: readonly string[]): AgentPlan {
  const defaults: { provider: AgentSelection["provider"]; model?: string; effort?: string } = {
    provider: defaultAgent.provider,
  };
  const stageOverrides: Partial<Record<Stage, AgentOverride>> = {};
  const roleOverrides: Partial<Record<Role, AgentOverride>> = {};
  const direct: string[] = [];
  const seen = new Set<string>();
  let supervised = false;

  for (const [flag, value] of optionPairs(args)) {
    if (["--provider", "--model", "--effort"].includes(flag)) {
      direct.push(flag, value);
      continue;
    }

    supervised = true;
    if (flag === "--default-provider") {
      once(seen, flag);
      defaults.provider = providerFrom(value);
      continue;
    }

    const defaultField = ["model", "effort"].find((name) => flag === `--default-${name}`);
    if (defaultField === "model" || defaultField === "effort") {
      once(seen, flag);
      defaults[defaultField] = value;
      continue;
    }

    const stage = stages.find((name) => flag.startsWith(`--${name}-`));
    const roleField = ["agent", "model", "effort"].find((name) => flag === `--role-${name}`);
    if (stage) {
      const name = flag.slice(`--${stage}-`.length);
      once(seen, flag);
      stageOverrides[stage] = withOverride(stageOverrides[stage], name, value, flag);
    } else if (roleField) {
      const [role, assignment, ...rest] = value.split("=");
      const parsedRole = z.enum(roles).safeParse(role);
      if (!(parsedRole.success && assignment) || rest.length > 0) {
        throw new Exit(1, `${flag} must assign screener, advisor or reviewer with ROLE=VALUE`);
      }

      once(seen, `${flag} ${parsedRole.data}`);
      roleOverrides[parsedRole.data] = withOverride(
        roleOverrides[parsedRole.data],
        roleField,
        assignment,
        flag,
      );
    } else {
      throw new Exit(1, `unknown option ${flag}; see iterate --help`);
    }
  }

  if (!supervised) return { direct: agentFromArgs(direct) };

  if (direct.length > 0) {
    throw new Exit(1, "direct agent options cannot be combined with supervised agent options");
  }

  return {
    supervised: supervisedPlanSchema.parse({
      defaults,
      stages: Object.fromEntries(
        stages.map((stage) => [stage, applyOverride(defaults, stageOverrides[stage])]),
      ),
      roles: roleOverrides,
      originalRequest: [...args],
    }),
  };
}

export function selectionForStage(plan: AgentPlan, stage: Stage): AgentSelection {
  return plan.direct ?? plan.supervised.stages[stage];
}

export function selectionForRole(input: {
  readonly plan: AgentPlan;
  readonly stage: Stage;
  readonly role: Role;
  readonly assignedEffort?: string;
}): AgentSelection {
  const inherited = selectionForStage(input.plan, input.stage);
  const base =
    input.assignedEffort === undefined ? inherited : { ...inherited, effort: input.assignedEffort };
  return applyOverride(base, input.plan.supervised?.roles[input.role]);
}

export function agentForRole(input: Parameters<typeof selectionForRole>[0]): StageAgent {
  return executableSelection(selectionForRole(input), input.plan.supervised?.originalRequest);
}

export function agentForStage(plan: AgentPlan, stage: Stage): StageAgent {
  return executableSelection(selectionForStage(plan, stage), plan.supervised?.originalRequest);
}

function executableSelection(
  selected: AgentSelection,
  originalRequest?: readonly string[],
): StageAgent {
  try {
    validateSelection(selected);
  } catch (error) {
    if (!(error instanceof Exit && originalRequest?.length)) throw error;

    throw new Exit(error.code, `${error.message}; requested options: ${originalRequest.join(" ")}`);
  }

  return agentSchema.parse(selected);
}

export function agentFromArgs(args: readonly string[]): StageAgent {
  let selected: AgentSelection = defaultAgent;
  const seen = new Set<string>();
  for (const [flag, value] of optionPairs(args)) {
    once(seen, flag);
    if (flag === "--provider") selected = { ...selected, provider: providerFrom(value) };
    else if (flag === "--model") selected = { ...selected, model: value };
    else if (flag === "--effort") selected = { ...selected, effort: value };
    else throw new Exit(1, `unknown option ${flag}; see iterate --help`);
  }
  return executableSelection(selected, args);
}

export function resolveInvocation(input: {
  readonly args: readonly string[];
  readonly invocation: "step" | "resume";
  readonly savedPlan?: unknown;
}): {
  readonly plan: AgentPlan;
  readonly action: "direct" | "create" | "reuse" | "replace";
  readonly previous?: SupervisedPlan;
} {
  const saved = input.savedPlan === undefined ? undefined : reusablePlan(input.savedPlan);
  if (saved && input.args.length === 0) return { plan: { supervised: saved }, action: "reuse" };

  const plan = agentPlanFromArgs(input.args);
  if (plan.direct) {
    if (saved)
      throw new Exit(
        1,
        "direct options cannot replace a saved supervised plan; use supervised overrides",
      );

    return { plan, action: "direct" };
  }

  if (saved && equivalentPlans(saved, plan.supervised))
    return { plan: { supervised: saved }, action: "reuse" };

  if (input.invocation === "resume" || (saved && !input.args.includes("--default-provider"))) {
    throw new Exit(
      1,
      "selection changes require a fresh step with --default-provider and the complete supervised options",
    );
  }

  return saved ? { plan, action: "replace", previous: saved } : { plan, action: "create" };
}

function equivalentPlans(left: SupervisedPlan, right: SupervisedPlan): boolean {
  return JSON.stringify(comparablePlan(left)) === JSON.stringify(comparablePlan(right));
}

function comparablePlan(plan: SupervisedPlan) {
  return [
    selectionFields(plan.defaults),
    stages.map((stage) => selectionFields(plan.stages[stage])),
    roles.map((role) => {
      const override = plan.roles[role];
      return [
        override?.agent && selectionFields(override.agent),
        override?.model,
        override?.effort,
      ];
    }),
  ];
}

function selectionFields(selection: AgentSelection) {
  return [selection.provider, selection.model, selection.effort];
}

function validateSelection(selection: AgentSelection): void {
  const adapter = adapterFor(selection.provider);
  validateAgentSelection(selection, adapter.capabilities);
}

function applyOverride(base: AgentSelection, override?: AgentOverride): AgentSelection {
  return Object.assign(
    {},
    override?.agent ?? base,
    definedFields({ model: override?.model, effort: override?.effort }),
  );
}

function withOverride(
  previous: AgentOverride | undefined,
  name: string,
  value: string,
  flag: string,
): AgentOverride {
  if (name === "agent") return { ...previous, agent: tupleFrom(value, flag) };

  if (name === "model" || name === "effort") return { ...previous, [name]: value };

  throw new Exit(1, `unknown option ${flag}; see iterate --help`);
}

function tupleFrom(value: string, flag: string): AgentSelection {
  const [provider, model, effort, ...rest] = value.split(":");
  if (!(provider && model) || effort === "" || rest.length > 0)
    throw new Exit(1, `${flag} must be provider:model[:effort]`);

  return selectionSchema.parse(definedFields({ provider: providerFrom(provider), model, effort }));
}

function providerFrom(value: string): AgentSelection["provider"] {
  const parsed = selectionSchema.shape.provider.safeParse(value);
  if (!parsed.success)
    throw new Exit(1, `unknown provider ${value}; providers are ${providerNames.join(", ")}`);

  return parsed.data;
}

function reusablePlan(saved: unknown): SupervisedPlan {
  const parsed = supervisedPlanSchema.safeParse(saved);
  if (!parsed.success)
    throw new Exit(
      1,
      `the saved supervised plan cannot be reused: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}; providers are ${providerNames.join(", ")}`,
    );

  return parsed.data;
}

function once(seen: Set<string>, key: string): void {
  if (seen.has(key)) throw new Exit(1, `${key} was supplied more than once`);

  seen.add(key);
}

function optionPairs(args: readonly string[]): readonly (readonly [string, string])[] {
  const pairs: [string, string][] = [];
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (
      !(flag?.startsWith("--") && value) ||
      value.startsWith("--") ||
      !field.safeParse(value).success
    ) {
      throw new Exit(1, "agent options need a value without whitespace; see iterate --help");
    }

    pairs.push([flag, value]);
  }
  return pairs;
}
