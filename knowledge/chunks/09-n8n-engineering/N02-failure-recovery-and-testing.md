---
id: N02
title: n8n failure recovery, API limits and realistic testing
topic: n8n-engineering
sources: [n8n-2026-errors, n8n-2026-error-trigger, n8n-2026-rate-limits, n8n-2026-http-request, n8n-2026-pinning, n8n-2026-execution-data]
last_verified: 2026-10-10
---

## Claims

- An error workflow starts with Error Trigger and is assigned in the calling
  workflow's settings. Stop And Error can deliberately fail an execution.
  Trigger failures may lack an execution ID or URL.
  [n8n-2026-errors §How do I set up an error workflow?; §What data does an error workflow receive?; §How do I make a workflow fail on purpose with the Stop and Error node?]
- Error Trigger responds to failures of automatic executions; manual runs do
  not test this mechanism. [n8n-2026-error-trigger §Usage]
- Retry On Fail pauses between attempts. Loop Over Items with Wait can pace
  batches; limits must come from the destination API's documentation.
  [n8n-2026-rate-limits §Handle rate limits for integrations]
- HTTP Request supports batching, pagination and response status/headers.
  Never Error treats non-2xx responses as successful node output. Its Timeout
  limits waiting for initial response headers and the start of the body, not
  necessarily the full download. [n8n-2026-http-request §Batching; §Response; §Pagination; §Timeout]
- Pinned and mocked data support repeatable development tests. Production
  executions do not use pinned data. [n8n-2026-pinning §For development only; §Data pinning]
- Execution storage is configurable; pruning removes eligible finished
  executions and their data. Waiting, running and annotated executions have
  exceptions. [n8n-2026-execution-data §Reduce saved data; §Enable executions pruning]

## What this means for the guide

- Give every failure an owner and a path: reject invalid inputs, investigate
  authentication/configuration failures, and use bounded retries for failures
  the destination says are retryable. Set an attempt limit and waiting policy;
  do not add an unbounded loop. Before retrying writes, apply N03's replay-safety
  analysis. A retry setting alone does not prevent duplicate actions.
- If using Never Error to inspect responses, branch on status and validate the
  body before declaring success. Escalate terminal failures explicitly. Do not
  mistake a green HTTP node for a completed business operation.
- Configure pagination from the real API contract, including its end condition.
  Test multiple pages and rate limits. Choose batch size and delay from that
  service's limits; an arbitrary fixed batch size is not a universal safeguard.
- Build a shared error handler that records workflow, failing step and available
  execution reference, tolerates absent fields, and alerts the responsible owner.
  Keep only the diagnostic data needed; choose retention deliberately.
- Use synthetic fixtures for empty input, malformed records, 429 responses,
  timeouts and partial results. Then force a controlled failure through an
  automatic trigger in an isolated test workflow and verify the alert arrives.
  A manual canvas run cannot establish that the error workflow works.
- Verify the final external result as well as execution status. Record which
  tests used mocks and which exercised the actual integration. These are proposed
  acceptance checks; neither the knowledge base nor the exported scaffold is
  evidence that a live n8n workflow passed them.

## Source links

- [n8n-2026-errors](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully.md)
- [n8n-2026-error-trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger)
- [n8n-2026-rate-limits](https://docs.n8n.io/integrations/builtin/handle-rate-limits.md)
- [n8n-2026-http-request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest)
- [n8n-2026-pinning](https://docs.n8n.io/build/work-with-data/pin-and-mock-data.md)
- [n8n-2026-execution-data](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/manage-execution-data.md)
