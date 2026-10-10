---
id: J01
title: LangGraph state contracts and agent boundaries
topic: langgraph-engineering
sources: [langgraph-2026-overview, langgraph-2026-graph-api]
last_verified: 2026-10-10
---

## Claims

- LangGraph is a low-level runtime for stateful agents. It combines fixed code
  paths with model-driven steps and can be used without LangChain.
  [langgraph-2026-overview §LangGraph overview; §Core benefits]
- Graph nodes return state updates. Each state key has its own reducer; without
  an explicit reducer, updates replace the previous value. An append reducer
  accumulates values, so returning an empty list does not clear prior entries.
  [langgraph-2026-graph-api §Reducers; §Resetting a reducer field]
- `recursion_limit` caps graph super-steps and belongs at the top level of the
  runtime configuration, outside `configurable`. Exhaustion raises
  `GraphRecursionError`. [langgraph-2026-graph-api §Recursion limit]

## What this means for the guide

Choose LangGraph when developers need to own agent state and transitions. This
is a guide design choice, not a vendor claim that every multi-agent task needs
this framework. Keep the simpler single-agent pilot until measured failures
justify specialist boundaries. Prefer Hermes when the requirement is a personal
assistant with persistent learning rather than a custom application runtime.

- Define a state contract before adding nodes: case ID, input references,
  findings, proposed action, review status and final outcome. Validate external
  input at entry and validate tool results before placing them in state. A Python
  type annotation alone does not enforce runtime business constraints.
- Give each specialist a narrow input and structured output with source
  references. Keep credentials out of graph state and pass only the context each
  role needs. State persistence makes excessive data sharing harder to undo.
- Specify how concurrent results combine. Prefer stable result identifiers and
  deterministic aggregation over relying on completion order. Decide which
  fields replace earlier values and which accumulate; test retries for duplicate
  findings and stale error flags.
- Separate routing, reasoning, review and external writes. A model may propose a
  route, but code should validate it against the allowed destinations. Treat
  documents and tool responses as evidence, not authority to change the graph.
- Set explicit step, timeout and spending budgets. A graph step cap is not a
  complete token or cost cap. Return a visible incomplete outcome when a limit
  is reached, and preserve enough evidence for the operator to decide what next.
- Acceptance cases: malformed input, conflicting specialist outputs, reordered
  completion, repeated results, unknown route and exhausted budget. Verify the
  graph's final state and the actual business artifact separately. The exported
  fixture scaffold demonstrates mechanics; model adapters and business logic
  still require implementation against the supplied design.

## Source links

- [langgraph-2026-overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [langgraph-2026-graph-api](https://docs.langchain.com/oss/python/langgraph/graph-api)
