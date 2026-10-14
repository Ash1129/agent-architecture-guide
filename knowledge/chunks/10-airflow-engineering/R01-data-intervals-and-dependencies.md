---
id: R01
title: Airflow data intervals, task contracts and dependencies
topic: airflow-engineering
sources: [airflow-2026-dag-runs, airflow-2026-assets, airflow-2026-external-sensor, airflow-2026-xcoms, airflow-2026-best-practices]
last_verified: 2026-10-10
---

## Claims

- In time-based interval scheduling, the logical date identifies the interval,
  not actual execution time. Runs generally start after the interval ends.
  Manually triggered runs need not derive their interval from the supplied
  logical date. [airflow-2026-dag-runs §Data Interval; §Manual Triggering and Data Intervals]
- A successful producing task can emit an asset update. Failed or skipped
  producers do not emit that update. A list of asset dependencies waits for all
  listed assets to update since the previous consumer run; repeated updates can
  coalesce into one run. [airflow-2026-assets §Schedule Dags with assets; §Multiple assets]
- ExternalTaskSensor waits for an external task at a specific logical date.
  `execution_delta` can align differently timed runs, and allowed/failed states
  define the result. Combining closely related tasks into one DAG may be simpler.
  [airflow-2026-external-sensor §Cross-Dag Dependencies; §ExternalTaskSensor]
- XComs are intended for small serializable messages between task instances.
  Tasks can run on different machines. XCom data from an unsuccessful task is
  cleared on retry and is not durable retry state.
  [airflow-2026-xcoms §XComs; §Object Storage XCom Backend]
- Airflow recommends shared storage for large intermediate data and passing its
  location between tasks, rather than relying on worker-local files.
  [airflow-2026-best-practices §Communication]

## What this means for the guide

The following is guide synthesis for the Airflow 3.3.2 documentation reviewed
here; verify compatibility with the deployed core and provider versions.

- Specify the input partition, expected schema, output location and completeness
  checks for each task. Pass small references and counts between tasks; persist
  bulk results in storage every relevant worker can access.
- Choose an explicit dependency mechanism. Use task edges within a DAG, asset
  scheduling for published data updates, or an external sensor for a particular
  upstream run. A daily timer alone does not establish data readiness.
- Define what "ready" means before publishing an asset event: validation and
  complete output publication should precede it. Asset notification alone does
  not establish matching business partitions; validate the intended partition
  from the event or data contract before consuming it.
- For an external sensor, document upstream DAG/task identity, date alignment,
  success/failure policy and wait limit. Test different upstream cadences rather
  than assuming two daily schedules refer to the same interval.
- For manual runs, declare how the requested business date maps to input data.
  Do not silently substitute the current date when the interval is unclear.
- Acceptance cases: late upstream data, failed or skipped producer, mismatched
  partitions, empty-but-valid input, malformed schema and a downstream task on
  another worker. Assert the exact partition consumed and ensure incomplete
  outputs are not advertised as ready. These are proposed tests, not executed
  Airflow results.

## Source links

- [airflow-2026-dag-runs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html)
- [airflow-2026-assets](https://airflow.apache.org/docs/apache-airflow/3.3.2/authoring-and-scheduling/asset-scheduling.html)
- [airflow-2026-external-sensor](https://airflow.apache.org/docs/apache-airflow-providers-standard/stable/sensors/external_task_sensor.html)
- [airflow-2026-xcoms](https://airflow.apache.org/docs/apache-airflow/3.3.2/core-concepts/xcoms.html)
- [airflow-2026-best-practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
