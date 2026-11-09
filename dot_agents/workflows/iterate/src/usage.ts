export type TemporalBasis = "invocation" | "sessionCumulative";

export type TokenUsage = {
  readonly input?: number | undefined;
  readonly cacheRead?: number | undefined;
  readonly cacheWrite?: number | undefined;
  readonly output?: number | undefined;
  readonly reasoning?: number | undefined;
};

export type ModelUsage = {
  readonly model: string;
  readonly resolvedModel?: string;
  readonly provider?: string;
  readonly costUsd?: number;
  readonly costBasis?: string;
  readonly tokens: TokenUsage;
};

export type UsageReport = {
  readonly parent?: TokenUsage | undefined;
  readonly parentBasis?: TemporalBasis;
  readonly aggregateBasis?: TemporalBasis;
  readonly modelsBasis?: TemporalBasis;
  readonly raw?: readonly unknown[];
  readonly aggregateIncludingChildren?: TokenUsage | undefined;
  readonly models?: readonly ModelUsage[];
};

export type SessionCost = {
  readonly usd: number;
  readonly basis: TemporalBasis;
  readonly scope: "parent" | "aggregateIncludingChildren";
};

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
