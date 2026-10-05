---
id: P04
title: How several agents are arranged - manager, handoffs and orchestrator-workers
topic: multi-agent
sources: [openai-2025-practical-guide, anthropic-2025-multi-agent-research, kim-2025-scaling-agent-systems]
last_verified: 2026-10-05
---

## Claims

- OpenAI sees two broadly useful arrangements
  [openai-2025-practical-guide pp. 17–18, 21]:
  - **Manager (agents as tools):** a central manager agent calls specialist
    agents as tools and combines their results. Only the manager controls
    the flow and talks to the user. Example: a manager calls Spanish, French
    and Italian translation agents.
  - **Decentralized (handoffs):** peer agents pass control to one another, and
    the receiving agent takes over the conversation. Useful when no single
    agent needs to keep central control. Example: a triage agent hands a
    delivery question to an order-management agent.
- Both can be drawn as graphs with agents as nodes. In the manager pattern
  the edges are tool calls; in the decentralized pattern they are handoffs.
  [openai-2025-practical-guide p. 17]
- Anthropic's research system uses **orchestrator-workers**. A lead agent
  plans the research and spawns 3 to 5 subagents in parallel, each with its
  own context window, then combines their findings. Running subagents and
  their tool calls in parallel cut research time by up to 90% on complex
  queries. [anthropic-2025-multi-agent-research §Architecture overview for Research; §Prompt engineering and evaluations for research agents]
- Anthropic's lessons for the lead agent:
  - give each subagent a clear objective, output format, tools and
    boundaries, or subagents duplicate work or leave gaps
  - scale the number of agents and calls to how complex the query is

  [anthropic-2025-multi-agent-research §Prompt engineering and evaluations for research agents]
- **Controlled comparison (Kim et al., preprint; Google Research, Google
  DeepMind and MIT).** The study tested one single-agent and four multi-agent
  architectures across 260 configurations, holding tools, prompts and
  compute equal. Errors were amplified 17.2× in **independent** multi-agent
  systems (no central check), against 4.4× under **centralized** coordination,
  where a coordinator validates work before combining it.
  [kim-2025-scaling-agent-systems abstract; §1]

## What this means for the guide

- When the guide recommends several agents, the default arrangement should
  be a **coordinator with specialists** (manager or orchestrator-workers),
  because central validation contains errors far better than independent
  agents (Kim et al.).
- Use **handoffs** (decentralized) for front-door triage, where different
  specialists should each own the conversation once it reaches them.
- The coordinator's instructions must give every specialist a clear objective,
  output format and boundaries. BUILD.md should spell these out per agent.
