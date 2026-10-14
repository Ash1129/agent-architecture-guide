# LangGraph starter smoke test

Run on 2026-10-10 against LangGraph 1.2.14 in an isolated temporary uv environment.
The tested source is the same Python template embedded in exported starters.

## Reproduce

```sh
uv run --with 'langgraph==1.2.14' python scripts/smoke/langgraph_smoke.py
```

## Results

Six tests passed: approved simulation, rejected simulation, stale proposal
rejection, rejection of string-valued approval, independent thread state,
and recursion-budget exhaustion. Parallel fixture findings arrived before
review; approval/resume did not duplicate them. Invalid approvals produced
no completion outcome.

No model provider credentials, live business data, network adapters or external
actions were used. The checkpointer was InMemorySaver. This does not test
process-restart persistence, production authentication, model quality, MCP,
Promptfoo execution or Langfuse ingestion. Those are deployment acceptance steps
in the exported engineering guides.

Application validation: 197 tests, TypeScript checks and production build passed.

Browser verification: the result displayed LangGraph as the main tool and the
Build view offered Download Python starter. The downloaded ZIP contained the
six expected files; graph.py matched the tested source exactly and requirements.txt
pinned LangGraph 1.2.14. The temporary preview was used only for this check.
