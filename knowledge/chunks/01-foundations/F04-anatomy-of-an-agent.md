---
id: F04
title: The parts of an agent, and the harness around the model
topic: foundations
sources: [openai-2025-practical-guide, anthropic-2024-effective-agents, databricks-2026-harness, wang-2024-agent-survey, sumers-2024-coala]
last_verified: 2026-10-05
---

## Claims

- OpenAI: an agent has three core parts: a **model** (the LLM that reasons and
  decides), **tools** (functions or APIs it uses to act) and **instructions**
  (explicit guidelines and guardrails for its behaviour).
  [openai-2025-practical-guide p. 7]
- OpenAI groups tools into three kinds:
  - **Data:** retrieve context, such as querying a CRM, reading PDFs or
    searching the web.
  - **Action:** change things, such as sending email, updating records or
    handing a ticket to a human.
  - **Orchestration:** other agents used as tools.

  For systems with no API, computer-use models can work through the user
  interface as a person would. [openai-2025-practical-guide p. 9]
- Anthropic: the basic building block is an "augmented LLM", meaning a model
  given retrieval, tools and memory, which it can use actively (writing its
  own search queries, choosing tools, deciding what to remember).
  [anthropic-2024-effective-agents §Building block: The augmented LLM]
- Databricks names eight building blocks a production harness needs:
  1. a system prompt
  2. tools
  3. a sandbox for running code safely
  4. a filesystem for work that survives between sessions
  5. memory and context management, including compaction
  6. feedback loops that verify work
  7. guardrails, including human approval
  8. observability: logs, traces, dashboards

  [databricks-2026-harness §Eight building blocks every production harness needs]
- Databricks describes the run loop as **reason, act, observe**: the model
  reads context and picks an action, the harness executes it, the result is
  fed back as new context, and the loop repeats until the task is done.
  [databricks-2026-harness §What is the reason, act, observe loop?]
- The academic framing matches. Wang et al.'s survey (Frontiers of Computer
  Science) builds agents from four modules:
  - **profile:** the role, usually written into the prompt
  - **memory:** short-term in the context window; long-term often in vector
    storage; with read, write and reflection operations
  - **planning:** with or without feedback from the environment, humans or
    models
  - **action:** tools or the model's own knowledge

  [wang-2024-agent-survey §2.1.1–2.1.4]
- CoALA (Sumers et al., TMLR) organises language agents into modular memory,
  an action space covering both internal memory and the external world, and a
  decision-making procedure that chooses actions. [sumers-2024-coala abstract]

## Where sources disagree

- Databricks claims harness quality can matter as much as the model, citing a
  benchmark score that rose from 36.10% to 52.63%. But that comparison also
  changed the model (GPT-5.4 to GPT-5.5), so it does not isolate the harness.
  Treat the claim as plausible but not demonstrated by that number.
  [databricks-2026-harness §How does harness quality affect performance with the same model?]

## What this means for the guide

- Every agent the guide recommends should name its three parts explicitly:
  which model, which tools (split into data and action), and what instructions
  or guardrails. This is what the step detail panel and BUILD.md should show.
- **Action tools are where risk lives.** The guide's approval gates should
  attach to action tools (send, update, pay, delete), not to data tools.
- Memory needs a deliberate answer: is the agent's memory just the current
  conversation, or does it persist? This links to the platform choice (see
  the platform chunks: Hermes keeps persistent memory; Claude needs projects
  or skills).
