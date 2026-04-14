#!/Users/joaofnds/.local/share/mise/shims/bun

const BAR_WIDTH = 10;

const colors = {
  reset: "\x1b[0m",
  muted: "\x1b[92m",   // solarized base01
  safe: "\x1b[32m",    // green
  notice: "\x1b[33m",  // yellow
  warning: "\x1b[91m", // solarized orange
  danger: "\x1b[31m",  // red
};

const thresholds = [
  { minPercent: 80, color: colors.danger, prefix: "💀 " },
  { minPercent: 65, color: colors.warning, prefix: "" },
  { minPercent: 50, color: colors.notice, prefix: "" },
  { minPercent: 0, color: colors.safe, prefix: "" },
];

function formatTokens(count) {
  if (count >= 1_000_000) {
    const millions = count / 1_000_000;
    return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (count >= 1000) return `${Math.floor(count / 1000)}k`;
  return `${count}`;
}

function formatCost(usd) {
  return `$${usd.toFixed(2)}`;
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m`;
}

function pickThreshold(percentUsed) {
  return thresholds.find((t) => percentUsed >= t.minPercent);
}

function buildContextBar({ usedTokens, totalTokens }) {
  if (totalTokens <= 0) return "";

  const percentUsed = (usedTokens * 100) / totalTokens;
  const { color, prefix } = pickThreshold(percentUsed);

  const filledCount = Math.min(
    BAR_WIDTH,
    Math.floor((usedTokens * BAR_WIDTH) / totalTokens),
  );
  const filled = "█".repeat(filledCount);
  const empty = "░".repeat(BAR_WIDTH - filledCount);
  const label = `(${formatTokens(usedTokens)}/${formatTokens(totalTokens)})`;

  return `${prefix}${color}${filled}${colors.muted}${empty} ${color}${label}${colors.reset}`;
}

function buildMetaLine({
  costUsd,
  durationMs,
  modelName,
  tokensIn,
  tokensOut,
  tokensCached,
  tokensTotal,
}) {
  const parts = [];
  if (costUsd != null) parts.push(`💸 ${formatCost(costUsd)}`);
  if (durationMs != null) parts.push(`⏱️ ${formatDuration(durationMs)}`);
  if (modelName) parts.push(`🤖 ${modelName}`);
  if (tokensIn != null) parts.push(`📥 ${formatTokens(tokensIn)}`);
  if (tokensOut != null) parts.push(`📤 ${formatTokens(tokensOut)}`);
  if (tokensCached != null) parts.push(`♻️ ${formatTokens(tokensCached)}`);
  if (tokensTotal != null) parts.push(`∑ ${formatTokens(tokensTotal)}`);
  if (parts.length === 0) return "";

  return `${colors.muted}${parts.join(" ")}${colors.reset}`;
}

function nonNegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function parseSession(rawJson) {
  const input = JSON.parse(rawJson);
  const contextWindow = input.context_window ?? {};
  const usage = contextWindow.current_usage ?? {};

  const inputTokens = nonNegative(usage.input_tokens) ?? 0;
  const outputTokens = nonNegative(usage.output_tokens) ?? 0;
  const cacheCreation = nonNegative(usage.cache_creation_input_tokens) ?? 0;
  const cacheRead = nonNegative(usage.cache_read_input_tokens) ?? 0;

  const tokensCached = cacheCreation + cacheRead;
  const currentUsageTotal =
    inputTokens + outputTokens + cacheCreation + cacheRead;

  const tokensIn = nonNegative(contextWindow.total_input_tokens);
  const tokensOut = nonNegative(contextWindow.total_output_tokens);

  const tokensTotal =
    currentUsageTotal > 0
      ? currentUsageTotal
      : tokensIn != null && tokensOut != null
        ? tokensIn + tokensOut
        : null;

  return {
    usedTokens: inputTokens + cacheCreation + cacheRead,
    totalTokens: contextWindow.context_window_size ?? 0,
    costUsd: input.cost?.total_cost_usd,
    durationMs: input.cost?.total_duration_ms,
    modelName: input.model?.display_name ?? "",
    tokensIn,
    tokensOut,
    tokensCached: tokensCached > 0 ? tokensCached : null,
    tokensTotal,
  };
}

const session = parseSession(await Bun.stdin.text());
const statusLine = [buildContextBar(session), buildMetaLine(session)]
  .filter(Boolean)
  .join(" ");

process.stdout.write(statusLine);
