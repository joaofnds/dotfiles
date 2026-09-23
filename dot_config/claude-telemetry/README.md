# Claude telemetry

Stores Claude Code's OpenTelemetry events in ClickHouse and charts them in
Grafana, so token spend can be broken down by model, subagent, skill, MCP
server, repository, session, prompt, and tool. Claude Code exports to it through
the `OTEL_*` entries in `~/.claude/settings.json`.

Start it once after `chezmoi apply`; the containers restart with OrbStack after
that:

    docker compose -f ~/.config/claude-telemetry/compose.yaml up -d

Rerun the same command after editing any file here, since the `schema` service
reapplies `schema.sql` on every start.

- Dashboard: http://localhost:3030
- SQL: `docker compose -f ~/.config/claude-telemetry/compose.yaml exec clickhouse clickhouse-client -u otel --password otel -d otel`

`schema.sql` defines the views to query (`api_requests`, `prompts`,
`tool_results`) and keeps 90 days of events. ClickHouse publishes no port to the
host, because its HTTP interface answers any web page; reach it through Grafana
or `docker compose exec`. The collector listens on 4327 rather than 4317 so it
does not collide with an application's own OpenTelemetry collector.
