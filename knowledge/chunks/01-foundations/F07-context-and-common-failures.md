---
id: F07
title: Context is the hard part, and the ways agents commonly fail
topic: foundations
sources: [langchain-2025-agent-frameworks, databricks-2026-harness, anthropic-2024-effective-agents, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- LangChain: the hard part of building reliable agentic systems is making sure
  the model has the right context at each step. When agents fail, it is
  usually because the model received too little or poor-quality context, not
  because the model itself was incapable.
  [langchain-2025-agent-frameworks §What is hard about building agents?]
- Databricks lists common failure modes of production agents:
  - **Context rot:** quality degrades as history grows without trimming.
  - **Tool overload:** too many tools at once confuse the model and slow it
    down.
  - **Brittle tool wiring:** small changes to tool descriptions cause wrong
    tool use.
  - **Latency:** many tool calls push response times past what is acceptable.
  - **Irrelevant retrieval:** wrong information from memory or search leads to
    confident wrong answers.
  - **Weak verification:** without checks, unfinished work gets reported as
    done.
  - **Missing guardrails:** agents take irreversible actions without enough
    oversight.

  [databricks-2026-harness §Common failure modes in production AI agent harnesses]
- Databricks: harnesses manage context by keeping what matters active and
  compacting older parts of long conversations.
  [databricks-2026-harness §How do AI harnesses manage memory and context?]
- Anthropic: tool definitions deserve as much care as the main prompt. A good
  definition includes example usage, edge cases, input format and clear
  boundaries from other tools. Test tools with many inputs, and redesign
  arguments so mistakes are harder to make. When building its coding agent,
  Anthropic spent more time on tools than on the overall prompt.
  [anthropic-2024-effective-agents §Appendix 2: Prompt engineering your tools]
- The team's notes give context overload as one reason to split work across
  several agents: one model would otherwise have to keep track of too much.
  [team-2026-assignment4 §One or multiple]

## What this means for the guide

- When the owner's task involves large or many documents, long histories or
  many connected systems, the guide should flag **context** as the main risk.
  The fixes are, in order of simplicity:
  1. retrieve only what is needed
  2. trim or summarise history
  3. split the work so each agent sees less

  The third option is a multi-agent design; see the multi-agent chunks.
- **Tool count is a design input.** An agent with access to many systems
  should be warned about tool overload, which favours narrower specialist
  agents or skills that point to the right tool.
- "Weak verification" and "missing guardrails" correspond to the guide's
  check steps and approval gates. Cite this chunk where the guide explains
  why those gates exist.
