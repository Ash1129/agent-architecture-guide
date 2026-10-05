---
id: L02
title: Apache Airflow - scheduled data pipelines as code
topic: platforms
sources: [airflow-docs-overview, airflow-docs-asset-scheduling]
last_verified: 2026-10-05
---

## Claims

- Airflow is an open-source platform for building, scheduling and monitoring
  workflows: time-based or event-triggered batch data pipelines, machine
  learning, and agentic or LLM workloads. It can run as one process on a
  laptop or as a large distributed system. [airflow-docs-overview §What is Airflow?]
- Workflows are written **entirely in Python** ("workflows as code"). A
  workflow is a Dag: a set of tasks with dependencies that set their order.
  [airflow-docs-overview §Workflows as code; §Dags]
- Airflow suits workflows with "a clear start and end" that run on a
  schedule. Benefits listed [airflow-docs-overview §Why Airflow?]:
  - version control and team collaboration on the code
  - testing of pipeline logic
  - re-running only failed tasks, and backfilling past runs
- Airflow's own docs say it may not be the best fit "if you prefer clicking
  over coding"; some coding is always required. [airflow-docs-overview §Why not Airflow?]
- **Asset-aware scheduling** (marked as added in version 2.4): a Dag can run
  when another task updates a piece of data, not only on a clock [airflow-docs-asset-scheduling §Quickstart; §Schedule Dags with assets]:
  - the data is marked updated only if the producing task succeeds
  - a Dag waiting on several assets runs once all of them have been updated

## Not verified

- Memory and setup requirements compared with n8n: the selfhosting.sh
  comparison (dev.to) and airflow.apache.org were blocked from this
  environment. These docs were read from the Airflow GitHub repository's
  main branch.

## What this means for the guide

- Recommend Airflow when the work is a chain of data jobs, each of which
  should start only when the data it depends on is ready, and the business
  has someone who writes Python. That matches the site's catalog text.
- Recommend n8n instead when the team wants a visual builder.
- **Site gotcha G12** ("needs more memory, more setup and Python skills"):
  the Python part is confirmed by Airflow's own docs; the memory claim
  rests on the selfhosting.sh article, which is not yet read for this
  knowledge base.
