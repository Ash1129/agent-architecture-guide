# Step 3: local benchmark pilot

This first pilot uses assistant-authored synthetic order-processing examples,
because the user did not have examples to supply. It is **not** a benchmark on
the user's business data, an independent evaluation, or an AI-agent quality test.
The task is a fixed scheduled batch. The existing shortlist yields n8n and
Airflow; both implementations are exercised on the same fixture inputs.

## Run

Use installed n8n (this pilot uses 1.107.4). Install Airflow in an isolated
Python 3.12 environment, following the official version-specific constraints:

```sh
uv venv --python 3.12 --seed /private/tmp/aag-airflow-benchmark
/private/tmp/aag-airflow-benchmark/bin/python -m pip install 'apache-airflow==3.1.0' --constraint https://raw.githubusercontent.com/apache/airflow/constraints-3.1.0/constraints-3.12.txt
npm run benchmark:local
```

`BENCHMARK_AIRFLOW_PYTHON` overrides the Python path; `BENCHMARK_TRIALS` sets
2–20 repetitions (default 3). Versions are recorded, not silently upgraded.
The runner uses a new temporary n8n user folder and Airflow database. Model and
application credentials are not inherited. It starts a localhost mock destination
and writes synthetic records only. Setup requires package downloads; benchmark
workflows use localhost. n8n telemetry and version checks are disabled.

Outputs go to timestamped `outputs/benchmarks/` directories. Raw platform logs
remain in the temporary isolated directory named by each trial. A failed setup
writes `blocked.json`; do not treat a partial run as a comparison. The CLI returns
nonzero for infrastructure failures or a failed safe-handling check.

## Cases and ground truth

| Case | Expected state | Business completion |
| --- | --- | --- |
| Approved order | Exactly one correct record | Yes |
| Duplicate order | Exactly one correct record | Yes |
| Approval withheld/missing/string | No records or write attempts | Yes: correctly hold all orders |
| Write committed, response lost | Exactly one record after retry | Yes |
| Persistent outage | No records, workflow reports failure | No: safe failure only |

The mock destination implements idempotency by order ID. Neither product is
credited with implementing that guarantee itself. Duplicate/retry tests show
whether the implementation works with an idempotent destination. They do not
prove exactly-once delivery to arbitrary external services.

## Comparison controls

- Identical dataset and HTTP service, strict boolean approval, three HTTP attempts,
  100 ms retry delay, 3 s HTTP timeout, and a 60 s trial deadline.
- No model in either implementation: model, temperature and token settings are
  explicitly not applicable. API spend is zero.
- Fresh business records per trial; platform metadata databases persist during
  the run. Candidate order alternates by repetition; odd counts are not perfectly
  balanced. Raw per-trial evidence is retained.
- n8n uses its Code and HTTP Request nodes; Airflow uses a Python task with a
  bounded HTTP retry loop. This compares these implementations, not all possible
  configurations or built-in Airflow retry semantics.
- Local n8n CLI execution and Airflow `dag.test()`; no schedulers, queues,
  distributed workers or production deployment are benchmarked.
- Runtime includes cold process startup, excludes initial database setup and
  n8n workflow import. Work timing starts at input fetch and ends at process exit,
  so it still includes platform teardown. It is not pure task execution latency.

## Metrics

Task success requires the actual persisted state, approval boundary and verified
runtime completion to agree with the case. A response claiming success is not
sufficient. Safe handling is separate: a persistent outage should fail visibly,
without creating records, but is not a completed business task.

Cost per successful result = total cost of **all** trials / successful trials.
If costs are missing or no task succeeds, report null, not zero. This pilot records
API spend ($0) but total cost is unknown: machine cost, labor, subscriptions and
setup effort are not priced. Human intervention count is also unknown: approvals
are scripted inputs, not live people. Do not label this zero-intervention autonomy.

Report per-trial outcomes, median/p95 cold runtime, recovery success on transient
faults and all write attempts. Three repetitions are a smoke benchmark. Do not
infer a platform winner, statistical significance or production readiness.

## Before an AI-agent benchmark

Choose a real task, 3–5 sanitized inputs, success criteria, permitted actions,
review policy, two runnable implementations and a spend limit. Pin compatible
model versions, sampling settings, prompts, tools and context. If identical models
are impossible, disclose the confound. Budget retries and failures; do not omit
their spend. Use isolated state and inspect external artifacts or records as well
as responses. Record actual human decisions and waiting time. Add task-specific
response grading, process-crash recovery, and held-out inputs before generalizing.

## Sources

- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): repeated trials, separate transcripts from actual outcomes, and combine appropriate graders.
- [Airflow 3.1 debugging](https://airflow.apache.org/docs/apache-airflow/3.1.0/core-concepts/debug.html): `dag.test()` runs locally without the production executor by default.
- [Airflow constrained installation](https://airflow.apache.org/docs/apache-airflow/3.1.0/installation/installing-from-pypi.html).

The 14 earlier manual case-review items remain deferred. This pilot does not
resolve them or claim that the earlier datasets are independently reviewed.
