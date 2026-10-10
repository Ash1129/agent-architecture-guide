---
id: J02
title: LangGraph persistence and replay boundaries
topic: langgraph-engineering
sources: [langgraph-2026-persistence, langgraph-2026-interrupts]
last_verified: 2026-10-10
---

## Claims

- Checkpointers persist state for one thread; stores hold application-defined
  information across threads. These are distinct persistence mechanisms.
  [langgraph-2026-persistence §Checkpointer vs. store]
- A thread ID selects the checkpoint context. In-memory savers lose checkpoints
  when the process restarts; durable storage is needed for restart recovery.
  [langgraph-2026-persistence §Quickstart; §MemorySaver does not persist between restarts]
- Resuming an interrupted node starts that node again from its beginning. Code
  before the interrupt runs again. [langgraph-2026-interrupts §Resuming interrupts]

## What this means for the guide

Treat recovery as a data and side-effect contract. Saving graph state does not
prove that a remote transaction happened once, and restoring a checkpoint does
not undo actions already accepted by another service.

- Assign a stable case identifier and map it to an authorized thread. Keep tenant
  ownership in the application, not in an unvalidated identifier supplied by a
  caller. A new case gets new state; a retry refers to the existing case.
- Choose a persistent checkpointer for deployed work and test recovery in a new
  process. The starter's in-memory demonstration is suitable for a local
  mechanics test only. Do not describe same-process resume as crash recovery.
- Record operation IDs and intended destinations before calling external
  services. Make write adapters idempotent where the destination supports it.
  On a timeout after submission, reconcile with the destination before retrying.
  Classify unresolved outcomes explicitly and route them to an operator.
- Keep pre-interrupt work repeatable. Perform writes in separate nodes after
  review, and still account for retries of those nodes. A read can also have
  costs or side effects, so inspect each adapter's behavior rather than relying
  on its name.
- Version graph code, state schemas and prompts together. Exercise pending
  threads against a proposed release before migration, and retain a rollback
  procedure. Do not silently change the meaning of a saved approval or field.
- Define checkpoint retention and access controls alongside recovery. Store
  references to large or sensitive artifacts where possible, with explicit
  authorization when resolving them. Separate shared memory from case-specific
  evidence so unrelated users cannot inherit each other's context.
- Acceptance cases: process restart, reused thread ID, interrupted network write,
  duplicate delivery and a schema change with pending work. Inspect checkpoint
  state, destination records and the returned outcome together. Failure recovery
  is only demonstrated for the configurations and failure modes actually run.

## Source links

- [langgraph-2026-persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [langgraph-2026-interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
