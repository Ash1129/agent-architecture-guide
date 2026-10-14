# Step 2: implementation shortlist

The result page now derives a bounded shortlist from the original answers and
existing recommendation. It does not change answers, select a runtime winner,
execute tools, or replace the primary architecture or starter kit.

- Developer-owned scheduled fixed workflows: n8n and Airflow.
- Developer-owned event/data-triggered agents without a persistent-memory
  requirement: n8n agent and LangGraph when the primary rules choose n8n agent.
- A single LangGraph agent can be compared with an n8n agent only without an
  explicit embedded-service or sandbox requirement and with an event/data trigger.
- Manually started or scheduled agents whose primary choice is Claude: also
  compare an n8n agent workflow. Preserve memory, sandbox, service and asset
  requirement filters. Scheduling requires publication, timezone configuration
  and available hosting; both implementations need equivalent approval gates.
- Otherwise retain one assessed option. Unsupported requirements can leave zero.

These are conservative guide design policies, not exhaustive capability claims.
In particular, advanced data-asset requirements are unresolved because this
catalog does not evaluate Dagster/dbt. Embedded/sandbox requirements without
an assessed developer-owned agent implementation are also unresolved. The
existing primary diagram remains visible but is not cleared by the shortlist.

Every candidate carries the same autonomy ceiling, approval checkpoints,
guardrails and hosting obligations. They are implementation requirements, not
proof that a generated artifact enforces them. Credentials, approved providers,
connectors, hosting, permission boundaries and recovery still need verification.
Unknown requirements in old saved answers remain unknown.

Each result is labelled **recommended by rules**. Step 3 must build equivalent
implementations and benchmark user examples before making performance claims.
The 14 deferred external-case manual checks remain deferred.

## Capability references

Reviewed October 12, 2026. These support the capabilities; the shortlist policy
and tradeoff judgments are authored for this guide.

- [Airflow overview](https://airflow.apache.org/docs/apache-airflow/stable/index.html):
  Python workflow definitions, scheduled batch orchestration and backfills.
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview):
  stateful orchestration, persistence and human intervention.
- [n8n hosting](https://docs.n8n.io/hosting/): deployment choices and operating responsibility.

## Validation

`tests/shortlist.test.ts` exercises comparison boundaries, unsupported requirements,
provider restrictions, unchanged input, inherited safeguards and the full existing
synthetic/source-backed evaluation corpus. These tests validate selection logic,
not live platform behavior.

Trigger references: [Manual Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger/) and [Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/), checked October 12, 2026.
