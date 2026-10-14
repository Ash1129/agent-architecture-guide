---
id: H03
title: Hermes unattended operation and failure recovery
topic: hermes-engineering
sources: [hermes-2026-cron, hermes-2026-configuration, hermes-2026-recovery]
last_verified: 2026-10-10
---

## Claims

- The gateway executes cron jobs in fresh agent sessions. Execution history
  records attempts and states including failed and unknown; unknown attempts
  are not automatically rerun. Recurring missed runs can catch up once rather
  than replay every missed occurrence. [hermes-2026-cron §How It Works; §Execution history; §Missed runs]
- A positive `agent.max_turns` bounds iterations; zero and minus one mean
  unlimited, and the default is unlimited. A finite limit allows a final grace
  call. API retry and automatic recovery settings are separate controls.
  [hermes-2026-configuration §Agent settings]
- Session state uses SQLite with WAL and shared-memory sidecars. Recovery
  guidance says to stop all writers on the affected profile and use doctor to
  identify remaining holders. Do not delete sidecars or copy only `state.db`;
  use supported backup/recovery commands.
  [hermes-2026-recovery §The fix in three steps; §Do not]

## What this means for the guide

A saved schedule proves configuration, not successful execution. These operating
rules are recommendations to validate in the target deployment, with its actual
Hermes release, model, tools and gateway service.

- Give unattended jobs finite iteration, elapsed-time and provider-spend budgets.
  A turn cap is not a dollar cap or a strict API-call count. Bound connector
  retries and reconcile partial effects before recovery. Keep an operator
  escalation route when completion would exceed the budget or require consent.
- Separate gateway health, job execution, business output and notification
  delivery in monitoring. Track operation ID, attempt, timestamps, skill
  revision, output location and failure reason without logging secrets. Check
  the expected artifact or destination record, not just the agent's summary.
- Define the missed-run policy deliberately. A current-state report may tolerate
  one catch-up; accounting for each historical period needs an explicit interval
  ledger. Pass stable period identifiers to downstream n8n or Airflow workflows
  and give one scheduler ownership of each recurrence.
- For failed or unknown attempts, inspect durable execution evidence and remote
  effects before restarting. Make writes replay-safe through destination-side
  deduplication or a transactional operation ledger. Do not claim exactly-once
  business processing from a scheduler's attempt status.
- Back up before maintenance and rehearse restore in an isolated profile. Stop
  every writer before repairing the session store; do not attempt repairs from
  the agent session that depends on it. After recovery, reconcile external
  effects separately because restoring local state cannot undo a sent message
  or committed transaction.
- Acceptance cases: stopped gateway, provider outage, budget exhaustion, missed
  schedule, unwritable state, interrupted execution and failed delivery. Run
  against safe fixtures first, then test the deployed gateway with restricted
  service accounts. Preserve logs and expected-versus-observed results. Static
  checks and generated starter files do not constitute a live Hermes smoke test.

## Source links

- [hermes-2026-cron](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron/)
- [hermes-2026-configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration/)
- [hermes-2026-recovery](https://hermes-agent.nousresearch.com/docs/user-guide/session-storage-recovery/)
