---
id: L02
title: Apache Airflow - scheduled data pipelines as code
topic: platforms
sources: [airflow-docs-overview, airflow-docs-asset-scheduling, airflow-docs-installation, n8n-docs-self-hosting]
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
- **Running it yourself.** The docs recommend at least 4 GB of memory, but
  say actual needs depend on the deployment. They also say no minimum can
  be given for production. [airflow-docs-installation, Prerequisites; Installation §Notes about minimum requirements]
- For the Docker quick-start, the docs ask for at least 4 GB of memory for
  Docker, ideally 8 GB. They say that setup is not for production;
  Kubernetes with the official Helm chart is. [airflow-docs-installation, Running Airflow in Docker]
- In production, Airflow is a complex system to be monitored and tuned
  continuously. The docs say managed Airflow services make many of these
  choices for you. [airflow-docs-installation, Installation §Notes about minimum requirements]

## Where sources disagree

- **Memory.** Gotcha G12 said Airflow needs more memory than n8n. The
  official docs ask for a similar floor for both: Airflow 4 GB (ideally
  8 GB in Docker), and n8n's Docker Compose setup 4 GB with 2 vCPUs
  (L01). The difference the docs do show is in running it: Python for every
  workflow, and continuous tuning in production.

## Not verified

- The selfhosting.sh comparison (dev.to) and airflow.apache.org were still
  blocked on 2026-10-05. These docs were read from the Airflow GitHub
  repository's main branch.

## What this means for the guide

- Recommend Airflow when the work is a chain of data jobs, each of which
  should start only when the data it depends on is ready, and the business
  has someone who writes Python. That matches the site's catalog text.
- Recommend n8n instead when the team wants a visual builder.
- **Site gotcha G12** ("needs more memory, more setup and Python skills"):
  Python and the setup burden are confirmed by Airflow's own docs. The
  memory comparison is not, so the gotcha now leaves it out.
