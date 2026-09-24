ALTER TABLE otel.otel_logs MODIFY TTL toDateTime(Timestamp) + INTERVAL 90 DAY;

CREATE OR REPLACE VIEW otel.model_prices AS
SELECT *
FROM VALUES(
  'model String, input_usd_per_mtok Float64, cache_read_usd_per_mtok Float64, one_hour_cache_write_usd_per_mtok Float64, output_usd_per_mtok Float64',
  ('claude-opus-5-5', 4, 0.2, 8, 20),
  ('claude-fable-5-1', 10, 0.25, 20, 50),
  ('claude-haiku-4-5-20251001', 1, 0.1, 2, 5)
);

CREATE OR REPLACE VIEW otel.api_requests AS
SELECT
  r.*,
  multiIf(
    query_source = 'compact', 'Compaction',
    agent != '', 'Subagent',
    query_source IN ('sdk', 'repl_main_thread'), 'Main conversation',
    query_source = 'auxiliary', 'Auxiliary',
    query_source
  ) AS activity,
  p.model != '' AS priced,
  if(priced, input_tokens * p.input_usd_per_mtok / 1e6, 0) AS input_cost,
  if(priced, cache_read_tokens * p.cache_read_usd_per_mtok / 1e6, 0) AS cache_read_cost,
  if(priced, output_tokens * p.output_usd_per_mtok / 1e6, 0) AS output_cost,
  if(priced, greatest(0, least(cost_usd - input_cost - cache_read_cost - output_cost, cache_creation_tokens * p.one_hour_cache_write_usd_per_mtok / 1e6)), 0) AS cache_write_cost,
  cost_usd - input_cost - cache_read_cost - output_cost - cache_write_cost AS other_cost
FROM (
  SELECT
    Timestamp AS ts,
    LogAttributes['session.id'] AS session_id,
    LogAttributes['prompt.id'] AS prompt_id,
    if(LogAttributes['vcs.repository.name'] = '', '(no repo)', LogAttributes['vcs.repository.name']) AS repo,
    LogAttributes['model'] AS model,
    LogAttributes['query_source'] AS query_source,
    if(
      LogAttributes['agent.name'] = '' AND startsWith(LogAttributes['query_source'], 'agent:'),
      substring(LogAttributes['query_source'], 7),
      LogAttributes['agent.name']
    ) AS agent,
    LogAttributes['skill.name'] AS skill,
    LogAttributes['plugin.name'] AS plugin,
    LogAttributes['mcp_server.name'] AS mcp_server,
    LogAttributes['mcp_tool.name'] AS mcp_tool,
    LogAttributes['effort'] AS effort,
    LogAttributes['speed'] AS speed,
    toUInt64OrZero(LogAttributes['input_tokens']) AS input_tokens,
    toUInt64OrZero(LogAttributes['cache_read_tokens']) AS cache_read_tokens,
    toUInt64OrZero(LogAttributes['cache_creation_tokens']) AS cache_creation_tokens,
    toUInt64OrZero(LogAttributes['output_tokens']) AS output_tokens,
    input_tokens + cache_read_tokens + cache_creation_tokens AS context_tokens,
    toFloat64OrZero(LogAttributes['cost_usd']) AS cost_usd,
    toUInt64OrZero(LogAttributes['duration_ms']) AS duration_ms
  FROM otel.otel_logs
  WHERE LogAttributes['event.name'] = 'api_request'
) AS r
LEFT JOIN otel.model_prices AS p ON r.model = p.model AND r.speed = 'normal';

CREATE OR REPLACE VIEW otel.prompts AS
SELECT
  Timestamp AS ts,
  LogAttributes['session.id'] AS session_id,
  LogAttributes['prompt.id'] AS prompt_id,
  if(LogAttributes['vcs.repository.name'] = '', '(no repo)', LogAttributes['vcs.repository.name']) AS repo,
  LogAttributes['prompt'] AS prompt,
  toUInt64OrZero(LogAttributes['prompt_length']) AS prompt_length,
  LogAttributes['command_name'] AS command_name
FROM otel.otel_logs
WHERE LogAttributes['event.name'] = 'user_prompt';

CREATE OR REPLACE VIEW otel.tool_results AS
SELECT
  Timestamp AS ts,
  LogAttributes['session.id'] AS session_id,
  LogAttributes['prompt.id'] AS prompt_id,
  if(LogAttributes['vcs.repository.name'] = '', '(no repo)', LogAttributes['vcs.repository.name']) AS repo,
  LogAttributes['tool_name'] AS tool,
  LogAttributes['tool_parameters'] AS parameters,
  JSONExtractString(parameters, 'mcp_server_name') AS mcp_server,
  LogAttributes['success'] = 'true' AS success,
  toUInt64OrZero(LogAttributes['duration_ms']) AS duration_ms,
  toUInt64OrZero(LogAttributes['tool_result_size_bytes']) AS result_bytes
FROM otel.otel_logs
WHERE LogAttributes['event.name'] = 'tool_result';

CREATE OR REPLACE VIEW otel.session_first_prompts AS
SELECT
  session_id,
  if(
    countIf(NOT startsWith(prompt, '<')) > 0,
    argMinIf(prompt, ts, NOT startsWith(prompt, '<')),
    argMin(prompt, ts)
  ) AS first_prompt
FROM otel.prompts
GROUP BY session_id;
