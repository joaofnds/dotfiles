# Claude telemetry

Stores Claude Code's OpenTelemetry events in ClickHouse and charts them in
Grafana, so token spend can be broken down by model, subagent, skill, MCP
server, repository, session, prompt, and tool. Claude Code exports to it through
the `OTEL_*` entries in `~/.claude/settings.json`.

Start it once after `chezmoi apply`; the containers restart with OrbStack after
that:

    docker compose -f ~/.config/claude-telemetry/compose.yaml up -d

Rerun it with `--force-recreate` after editing any file here. The services read
their files only when they start, `up -d` alone leaves a running container as
it is, and the `schema` service reapplies `schema.sql` on every start.

`clickhouse.xml` turns off ClickHouse's own system log tables, which otherwise
double its idle CPU and memory. It lists the log sections
of the pinned image's `config.xml`, so recheck it when bumping the image.

- Dashboard: http://localhost:3030
- SQL: `docker compose -f ~/.config/claude-telemetry/compose.yaml exec clickhouse clickhouse-client -u otel --password otel -d otel`

`schema.sql` defines the views to query (`api_requests`, `prompts`,
`tool_results`, `session_first_prompts`) and keeps 90 days of events.
`api_requests` splits each request's cost into input, cache reads, cache
writes and output using the per-model prices in `model_prices`. A request
whose model is missing from that list, or that ran at a speed other than
normal, shows all its spend as "Other" on the dashboard.

ClickHouse publishes no port to the host, because its HTTP interface answers
any web page; reach it through Grafana or `docker compose exec`. Grafana
connects as the `grafana` user from `clickhouse-users.xml`, which may only
select from the `otel` database. A Grafana link runs its query when opened, so
that user must not gain writes or `url()`, `file()`, `remote()` or `s3()`
access. Anonymous visitors are Viewers, so a link can neither open Explore nor
add a datasource that logs in as `otel`; run ad hoc queries with the SQL
command above.

The collector listens on 4327 rather than 4317 so it does not collide with an
application's own OpenTelemetry collector.
