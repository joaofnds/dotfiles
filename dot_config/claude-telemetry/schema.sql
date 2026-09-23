ALTER TABLE otel.otel_logs MODIFY TTL toDateTime(Timestamp) + INTERVAL 90 DAY;

CREATE OR REPLACE VIEW otel.api_requests AS
SELECT
  Timestamp AS ts,
  LogAttributes['session.id'] AS session_id,
  LogAttributes['prompt.id'] AS prompt_id,
  LogAttributes['vcs.repository.name'] AS repo,
  LogAttributes['model'] AS model,
  LogAttributes['query_source'] AS query_source,
  LogAttributes['agent.name'] AS agent,
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
WHERE LogAttributes['event.name'] = 'api_request';

CREATE OR REPLACE VIEW otel.prompts AS
SELECT
  Timestamp AS ts,
  LogAttributes['session.id'] AS session_id,
  LogAttributes['prompt.id'] AS prompt_id,
  LogAttributes['vcs.repository.name'] AS repo,
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
  LogAttributes['vcs.repository.name'] AS repo,
  LogAttributes['tool_name'] AS tool,
  LogAttributes['tool_parameters'] AS parameters,
  JSONExtractString(parameters, 'mcp_server_name') AS mcp_server,
  LogAttributes['success'] = 'true' AS success,
  toUInt64OrZero(LogAttributes['duration_ms']) AS duration_ms,
  toUInt64OrZero(LogAttributes['tool_result_size_bytes']) AS result_bytes
FROM otel.otel_logs
WHERE LogAttributes['event.name'] = 'tool_result';
