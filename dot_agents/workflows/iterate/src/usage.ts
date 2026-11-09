import { z } from "zod";

const nonnegative = z.number().finite().nonnegative();
const temporalBasis = z.enum(["invocation", "sessionCumulative"]);
const tokensSchema = z.object({
  input: nonnegative.optional(),
  cacheRead: nonnegative.optional(),
  cacheWrite: nonnegative.optional(),
  output: nonnegative.optional(),
  reasoning: nonnegative.optional(),
});
const modelUsageSchema = z.looseObject({
  model: z.string(),
  resolvedModel: z.string().exactOptional(),
  provider: z.string().exactOptional(),
  costUsd: nonnegative.exactOptional(),
  costBasis: z.string().exactOptional(),
  tokens: tokensSchema,
});
export const usageSchema = z.object({
  parent: tokensSchema.optional(),
  aggregateIncludingChildren: tokensSchema.optional(),
  parentBasis: temporalBasis.exactOptional(),
  aggregateBasis: temporalBasis.exactOptional(),
  modelsBasis: temporalBasis.exactOptional(),
  models: z.array(modelUsageSchema).readonly().exactOptional(),
  raw: z.array(z.unknown()).readonly().exactOptional(),
});
export const costSchema = z.object({
  usd: nonnegative,
  scope: z.enum(["parent", "aggregateIncludingChildren"]),
  basis: temporalBasis,
});

export type TemporalBasis = z.infer<typeof temporalBasis>;
export type TokenUsage = Readonly<z.infer<typeof tokensSchema>>;
export type ModelUsage = Readonly<z.infer<typeof modelUsageSchema>>;
export type UsageReport = Readonly<z.infer<typeof usageSchema>>;
export type SessionCost = Readonly<z.infer<typeof costSchema>>;

export function addTokens(left: TokenUsage | undefined, right: TokenUsage): TokenUsage {
  if (left === undefined) return right;

  return {
    ...add("input", left, right),
    ...add("cacheRead", left, right),
    ...add("cacheWrite", left, right),
    ...add("output", left, right),
    ...add("reasoning", left, right),
  };
}

function add(
  field: keyof TokenUsage,
  left: TokenUsage | undefined,
  right: TokenUsage,
): Partial<TokenUsage> {
  const first = left?.[field];
  const second = right[field];
  if (first === undefined || second === undefined) return {};

  return { [field]: first + second };
}

export function tokenDelta(current: TokenUsage, previous: TokenUsage | undefined): TokenUsage {
  const delta: {
    input?: number;
    cacheRead?: number;
    cacheWrite?: number;
    output?: number;
    reasoning?: number;
  } = {};
  for (const key of ["input", "cacheRead", "cacheWrite", "output", "reasoning"] as const) {
    const value = current[key];
    const before = previous?.[key];
    if (
      value !== undefined &&
      (previous === undefined || before !== undefined) &&
      value >= (before ?? 0)
    ) {
      delta[key] = value - (before ?? 0);
    }
  }

  return delta;
}
