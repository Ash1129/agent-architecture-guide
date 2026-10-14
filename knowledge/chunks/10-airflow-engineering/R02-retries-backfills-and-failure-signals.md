---
id: R02
title: Airflow safe retries, backfills and failure signals
topic: airflow-engineering
sources: [airflow-2026-best-practices, airflow-2026-tasks, airflow-2026-backfill, airflow-2026-dag-runs, airflow-2026-callbacks]
last_verified: 2026-10-10
---

## Claims

- Tasks should publish complete results and produce the same outcome on rerun.
  Airflow recommends partition-specific reads/writes and UPSERT instead of
  duplicate-producing INSERT operations. [airflow-2026-best-practices §Creating a task]
- `execution_timeout` bounds each task execution. For rescheduling sensors,
  `timeout` bounds the overall wait; retries do not reset it. AirflowFailException
  can fail without using remaining retries.
  [airflow-2026-tasks §Timeouts; §Special Exceptions]
- Backfill creates historical runs for time-based schedules. Reprocessing policy
  distinguishes missing, failed and completed runs. Backfill concurrency is
  controlled independently of the DAG's active-run limit. A dry run previews
  candidate dates, not task outputs. [airflow-2026-backfill §Control over data reprocessing; §Concurrency control; §Dry run]
- Catchup schedules missed intervals when enabled. DAG-run status depends on
  leaf tasks: a successful `all_done` leaf can hide an earlier failure.
  [airflow-2026-dag-runs §Catchup; §Dag Run Status]
- Callbacks respond to worker-driven state changes, not manual UI/CLI status
  changes. Callback failures appear in DAG-processor logs in the reviewed
  version. [airflow-2026-callbacks §Callbacks]

## What this means for the guide

These recommendations interpret the Airflow 3.3.2 docs. They are not a promise
of exactly-once delivery or automatic rollback across external systems.

- Give retryable work a finite attempt count and delay, and distinguish temporary
  service failures from invalid input or credentials. Specify both execution and
  dependency-wait limits; exhausting the wait must have an owner and recovery path.
- Design writes so replaying a partition does not duplicate its business effect.
  For messages, purchases or agent handoffs, verify the receiving service's replay
  contract before retrying. Airflow retry configuration cannot supply a guarantee
  the destination does not provide. Investigate ambiguous outcomes before resend.
- Keep catchup an explicit choice. Before a backfill, review its date range,
  reprocessing policy, resource limits and external actions. Start with a small
  historical interval and compare results before widening the run. The preview
  does not prove that historical inputs still exist or that replay is safe.
- Test failure propagation through branches and cleanup tasks. Decide which
  terminal states indicate a usable result; do not let housekeeping success stand
  in for successful data processing.
- Alerts should identify the DAG, run, task, attempt and relevant partition while
  avoiding sensitive payloads. Test by causing a controlled worker failure, not
  by manually marking a task failed. Verify delivery and inspect callback logs
  when the task fails without an alert.
- Acceptance cases: retry after a partial write, exhausted retries, missing
  upstream data, a repeated historical interval, an earlier failure followed by
  successful cleanup, and an alert-service outage. Check destination records and
  final run state. These tests still need execution in an isolated deployment.

## Source links

- [airflow-2026-best-practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [airflow-2026-tasks](https://airflow.apache.org/docs/apache-airflow/3.3.2/core-concepts/tasks.html)
- [airflow-2026-backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html)
- [airflow-2026-dag-runs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html)
- [airflow-2026-callbacks](https://airflow.apache.org/docs/apache-airflow/3.3.2/administration-and-deployment/logging-monitoring/callbacks.html)
