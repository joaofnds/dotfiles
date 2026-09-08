# Production: data stores, queues, running services, and their pipelines

Rules that bind when a task touches a data store, a queue, distributed state, a
running service, or a pipeline that builds and deploys or publishes an artifact. The
general production rules, deadlines, retries, convergence, deploy compatibility, and
related writes, are in `engineering-judgment.md` under "Making It Work in Production"
and apply to every task.

## Data and distributed systems

- **Name the guarantee you rely on and verify the system gives it.** Know the actual
  isolation level and defend against what it does not prevent. *(See:
  transactions-acid, isolation-levels)*
- **Pick replication and conflict strategies deliberately, never by default.** *(See:
  single-leader-replication, multi-leader-replication, leaderless-replication)*
- **Never trust wall clocks for ordering.** A lock or lease held across processes
  carries a fencing token, since the holder can be paused past its expiry. *(See:
  unreliable-clocks, fencing-tokens)*
- **Pay for linearizability only where recency is required.** *(See: linearizability)*
- **Choose storage, partitioning, and processing models by workload and fault
  design, not familiarity.** *(See: oltp-storage-engines, partitioning-sharding)*
- **Change data capture over dual writes for a derived store.** *(See:
  change-data-capture)*
- **Prefer integrity over timeliness when they trade off**, with a compensating
  action over global blocking. *(See: timeliness-vs-integrity)*
- **Define scalability against concrete load parameters and tail percentiles**, never
  against a claim. *(See: scalability)*

## Operations and reliability

- **Set the reliability target by what the business tolerates, and run the service
  to it, never above it.** The failures the target allows are the error budget,
  spent on releases and experiments. Reliability above the target leaves that
  budget unspent, and callers come to depend on what nobody promised. The velocity
  decision the budget governs is in `engineering-judgment.md` under Making It Work
  in Production. *(See: service-level-objectives, embracing-risk)*
- **Page on symptoms, through the four golden signals.** *(See: monitoring-sre)*
- **Stabilize first, then root-cause.** *(See: emergency-response,
  effective-troubleshooting)*
- **Jitter every backoff**, since retries that wake together overload the service
  while it is recovering. *(See: cascading-failures)*
- **A fault injected on purpose starts from a measured steady state, reaches a
  bounded population, and stops the moment its guard rail trips.** Start with a
  cohort whose failure the business would not notice, a share of requests or an
  opt-in segment, and widen only as earlier runs hold, because a run with no
  baseline shows nothing and a run with no bound is an outage. *(See:
  chaos-engineering)*

## Delivery pipeline

- **Build the artifact once and ship that same artifact.** Acceptance, staging,
  production, and the published package all carry the bytes the one build produced,
  because a rebuild between acceptance and the deploy or publish ships bytes no test
  ran. Have the pipeline record the artifact's hash at the build and check it at
  every later stage, so a rebuild cannot slip in. A failing acceptance test stops
  the artifact there. *(See: deployment-pipeline)*
