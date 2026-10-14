---
id: F02
title: Most real systems combine workflows and agents
topic: foundations
sources: [langchain-2025-agent-frameworks, anthropic-2024-effective-agents, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- LangChain reports that nearly all agentic systems it sees in production
  combine workflows and agents, rather than being purely one or the other.
  [langchain-2025-agent-frameworks §What is an agent; §Workflows vs Agents]
- LangChain's reasoning: fixed workflow steps make it easier to ensure the
  model receives the right context at each step, while agent steps add
  flexibility where it is needed. [langchain-2025-agent-frameworks §Workflows vs Agents]
- LangChain frames the choice as a trade-off: the more agentic a system, the
  less predictable it is, and some applications need predictability for user
  trust or regulatory reasons. [langchain-2025-agent-frameworks §Workflows vs Agents]
- Anthropic's catalogue is itself a mix: five workflow patterns (prompt
  chaining, routing, parallelization, orchestrator-workers, evaluator-
  optimizer) plus autonomous agents, and it says the patterns are building
  blocks to shape and combine for a use case rather than prescriptions.
  [anthropic-2024-effective-agents §Building blocks, workflows, and agents; §Combining and customizing these patterns]
- The team's notes describe the same hybrid in tool terms: an n8n workflow
  with an external agent node, where n8n sends a message to Claude (directly
  by API, or through MCP when tools are needed), reads the output and decides
  what to call next. [team-2026-assignment4 §Hybrid; §Do they need an agent? n8n]

## What this means for the guide

- The guide's default for any task that has both routine and open-ended parts
  should be a **workflow that hands only the open-ended part to an agent**,
  not an agent that does everything.
- When the owner signals that predictability matters (regulated work,
  customer-visible output, irreversible actions), push the design toward the
  workflow end of the spectrum and say why.
- In the diagram, routine steps should stay as fixed workflow steps even when
  an agent is present, so the reader can see which part is predictable.
