---
id: O02
title: Tracing, privacy and cost with Langfuse
topic: testing-and-observability
sources: [langfuse-2026-overview, langfuse-2026-masking]
last_verified: 2026-10-10
---

## Claims

- Langfuse provides tracing, prompt management and evaluation, including cost
  and latency analysis. It accepts SDK and OpenTelemetry instrumentation.
  [langfuse-2026-overview §Observability; §Prompts; §Evaluation]
- Masking must be configured before export. Current Python documentation
  distinguishes export-stage `mask_otel_spans` from legacy SDK-attribute `mask`;
  the latter does not inspect raw spans from third-party instrumentation.
  [langfuse-2026-masking §Python SDK; §Legacy mask behavior]
- A Langfuse masking hook does not sanitize a separate telemetry exporter.
  Collector-side masking occurs after telemetry leaves the application.
  [langfuse-2026-masking §mask_otel_spans behavior; §Masking with OpenTelemetry]

## What this means for the guide

Trace enough information to reconstruct a failure while keeping sensitive
content out of telemetry. The guide recommends these controls for Langfuse or
an equivalent observability system; enabling an SDK does not implement this
policy automatically.

- Define a trace contract: case ID, attempt ID, parent operation, node name,
  prompt revision, model, token usage, latency, tool outcome and approval state.
  Separate application success from business correctness and delivery status.
  An HTTP 200 or completed graph can still produce a wrong answer.
- Start with metadata-only instrumentation. Allowlist fields before adding
  inputs and outputs. Use synthetic secrets to test redaction across model calls,
  tool arguments, exceptions and nested metadata. Inspect what actually arrives
  at every configured exporter, not just what appears masked in a local log.
- Choose the deployment region, retention, access controls and deletion process
  before recording customer material. Keep API keys out of prompts, spans and
  generated files. Mask at the application boundary when raw content must not
  leave the process; secure any collector as another data processor.
- Correlate attempts without assuming that a trace ID enforces deduplication.
  Capture uncertain external effects and recovery decisions. Preserve an audit
  trail for consequential actions independently of sampled diagnostic traces.
- Track missing traces, export failures and pending reviews as operational
  signals. Keep telemetry failure from silently changing the action's outcome.
  Define whether a missing required audit record should stop a consequential
  write; make that a tested business policy.
- Compare latency, cost and quality by workflow version and case category.
  Include retries, failed runs and evaluator calls when estimating cost, and
  state gaps in provider usage data. Feed sanitized failures into the evaluation
  dataset rather than optimizing only successful runs. A useful acceptance test
  traces one known failure end to end and proves its sensitive fields never
  reached the collector or service.

## Source links

- [langfuse-2026-overview](https://langfuse.com/docs)
- [langfuse-2026-masking](https://langfuse.com/docs/observability/features/masking)
