#!/usr/bin/env bun

const BAR_WIDTH = 10;
const RATE_BAR_WIDTH = 6;

const colors = {
  reset: "\x1b[0m",
  muted: "\x1b[92m",
  safe: "\x1b[32m",
  notice: "\x1b[33m",
  warning: "\x1b[91m",
  danger: "\x1b[31m",
};

const thresholds = [
  { minPercent: 80, color: colors.danger, prefix: "💀" },
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

function formatTimeUntil(epochSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const diff = epochSeconds - now;
  if (diff <= 0) return "now";

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function pickThreshold(percentUsed) {
  return thresholds.find((t) => percentUsed >= t.minPercent);
}

function buildBar(filled, total, color) {
  const filledCount = Math.min(total, Math.floor((filled * total) / 100));
  return `${color}${"█".repeat(filledCount)}${colors.muted}${"░".repeat(total - filledCount)}${colors.reset}`;
}

function buildContextBar({ usedTokens, totalTokens }) {
  if (totalTokens <= 0) return "";

  const percentUsed = (usedTokens * 100) / totalTokens;
  const { color, prefix } = pickThreshold(percentUsed);

  const bar = buildBar(percentUsed, BAR_WIDTH, color);
  const label = `${formatTokens(usedTokens)}/${formatTokens(totalTokens)}`;

  return `${prefix}${bar} ${color}${label}${colors.reset}`;
}

const blockChars = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

function buildRateLimit(label, bucket) {
  if (!bucket || bucket.used_percentage == null) return "";

  const pct = bucket.used_percentage;
  const { color } = pickThreshold(pct);
  const idx = Math.min(8, Math.round((pct / 100) * 8));
  const block = blockChars[idx];
  const reset = bucket.resets_at ? `${formatTimeUntil(bucket.resets_at)} ` : "";

  return `${colors.muted}${reset}${color}${Math.round(pct)}% ${block}${colors.reset}`;
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
  if (costUsd != null) parts.push(formatCost(costUsd));
  if (durationMs != null) parts.push(formatDuration(durationMs));
  if (modelName) parts.push(modelName);
  if (tokensIn != null) parts.push(`↓ ${formatTokens(tokensIn)}`);
  if (tokensOut != null) parts.push(`↑ ${formatTokens(tokensOut)}`);
  if (tokensCached != null) parts.push(`↺ ${formatTokens(tokensCached)}`);
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
    rateLimits: input.rate_limits ?? {},
  };
}

const session = parseSession(await Bun.stdin.text());
const statusLine = [
  buildContextBar(session),
  buildRateLimit("5h", session.rateLimits.five_hour),
  buildRateLimit("7d", session.rateLimits.seven_day),
  buildMetaLine(session),
]
  .filter(Boolean)
  .join("  ");

process.stdout.write(statusLine);
