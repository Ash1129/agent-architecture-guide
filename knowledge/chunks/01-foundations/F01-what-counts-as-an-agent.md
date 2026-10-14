---
id: F01
title: What counts as an agent
topic: foundations
sources: [anthropic-2024-effective-agents, openai-2025-practical-guide, databricks-2026-harness, langchain-2025-agent-frameworks, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- Anthropic uses "agentic systems" as the umbrella term and splits it in two.
  **Workflows** are systems where LLMs and tools are orchestrated through
  predefined code paths. **Agents** are systems where the LLM dynamically
  directs its own process and tool use, keeping control over how the task gets
  done. [anthropic-2024-effective-agents §What are agents?]
- OpenAI defines agents as systems that independently accomplish tasks on the
  user's behalf, carrying out a workflow with a high degree of independence.
  [openai-2025-practical-guide p. 4]
- OpenAI states what is **not** an agent: applications that use an LLM but do
  not let it control how the workflow runs, such as simple chatbots,
  single-turn LLM calls and sentiment classifiers. [openai-2025-practical-guide p. 4]
- OpenAI names two core characteristics of an agent. (1) It uses an LLM to
  manage the workflow and make decisions, recognises when the work is
  complete, corrects its own actions when needed, and on failure can stop and
  hand control back to the user. (2) It has tools for both gathering context
  and taking actions, picks among them based on the current state, and works
  within defined guardrails. [openai-2025-practical-guide p. 4]
- Databricks separates three layers: the **model** reasons and decides; the
  **harness** is the software around it that provides tools, memory, context
  management, guardrails, feedback loops and logging; the **agent** is the
  complete working system of both. [databricks-2026-harness §Agent, model and harness: what's the difference?]
- LangChain argues the workflow/agent split is a spectrum rather than a
  binary, and prefers asking how "agentic" a system is (a framing it credits
  to Andrew Ng). [langchain-2025-agent-frameworks §What is an agent]
- The team's notes observe that in a chat product such as Claude, whether
  agent behaviour happens is decided by the model on each turn: it may simply
  answer, with no tool calls or extra reasoning, which is not acting on its
  own. The agent loop is visible when the interface shows steps such as "ran
  a command" followed by revised thoughts and further actions.
  [team-2026-assignment4 §Do they need an agent?]

## Where sources disagree

- **Bar for "agent".** OpenAI's definition requires the LLM to control
  workflow execution and to know when it is done; Anthropic's requires the LLM
  to direct its own process and tools. These are close. Databricks is looser:
  any model wrapped in a harness that lets it act counts. LangChain rejects a
  hard line altogether.

## What this means for the guide

- Use Anthropic's two-way split as the guide's vocabulary, because it is the
  clearest test for a non-technical reader: **who decides the next step, the
  code or the model?** If the code decides, it is a workflow (possibly with
  AI steps); if the model decides, it is an agent.
- A single LLM call that classifies, drafts or extracts is an **AI step inside
  a workflow**, not an agent (per OpenAI's exclusions).
- Treat the levels as a ladder rather than boxes (per LangChain): plain
  automation, then a workflow with AI steps, then one agent, then several.
  This matches the four approaches the guide already offers.
