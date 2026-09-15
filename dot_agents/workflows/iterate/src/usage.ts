export type TokenUsage = {
  readonly input?: number;
  readonly cacheRead?: number;
  readonly cacheWrite?: number;
  readonly output?: number;
  readonly reasoning?: number;
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
  readonly parent?: TokenUsage;
  readonly aggregateIncludingChildren?: TokenUsage;
  readonly models?: readonly ModelUsage[];
};

export type SessionCost = {
  readonly usd: number;
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
