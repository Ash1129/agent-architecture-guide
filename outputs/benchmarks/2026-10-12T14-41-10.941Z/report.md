# Local workflow benchmark

tested on synthetic sample cases

Assistant-authored synthetic fixtures, inspired by the previously researched order-fulfilment case. Not user examples or a reproduction of that company's system.

Versions: n8n 1.107.4; Airflow 3.1.0

| Platform | Task success | Safe handling | Transient recovery | Median cold runtime (ms) | p95 cold runtime (ms) | Total cost / success | Human interventions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n8n | 12/15 | 100.00% | 100.00% | 985.87 | 1297.20 | Not measured | Not measured |
| airflow | 12/15 | 100.00% | 100.00% | 1497.05 | 2169.17 | Not measured | Not measured |

The persistent-outage case counts as an incomplete business task even when handled safely. API spend is $0 because no model or paid service is called. Total cost is unknown.

- Not user examples; not a company system reproduction.
- No AI model, response-quality grading or agent reasoning measured.
- Local CLI / dag.test execution; schedulers, distributed workers and production throughput not tested.
- Latency includes process startup; imports and initial database setup excluded. Work timing runs from input read to process exit.
- Idempotency is supplied by the mock destination; this is not an automatic platform guarantee.
- Approvals are scripted fixture values, not live human decisions; human intervention and total cost are unmeasured.
- HTTP retry behavior only; no process-crash recovery tested.
- Three repetitions by default are a smoke benchmark, not statistical proof of superiority.

No platform winner is inferred from this run. See report.json and trials.json for per-trial state, write attempts and fault evidence.
