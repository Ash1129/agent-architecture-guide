---
id: P03
title: One agent or several - when to split
topic: multi-agent
sources: [openai-2025-practical-guide, team-2026-assignment4, anthropic-2025-multi-agent-research, cognition-2025-dont-build-multi-agents]
last_verified: 2026-10-05
---

## Claims

- OpenAI's general recommendation is to **get as much as possible out of a
  single agent first**. More agents give a tidy separation of concerns but add
  complexity and overhead, and one agent with tools is often enough.
  [openai-2025-practical-guide p. 16]
- OpenAI's signals that it is time to split:
  - **Complex logic:** prompts full of if-then-else branches, with templates
    becoming hard to scale.
  - **Tool overload:** the problem is tools that are *similar or overlapping*,
    not the raw count. Some systems handle more than 15 distinct tools while
    others struggle with fewer than 10 overlapping ones. Split only if clearer
    tool names, parameters and descriptions don't fix it.
  - **Failure to follow instructions:** the agent repeatedly ignores
    complicated instructions or picks the wrong tool.

  [openai-2025-practical-guide p. 16]
- The team's notes give two reasons for several agents: **many distinct
  roles**, each of which can then have its own system prompt, and **context
  overload**, where one model would have to track too much. The notes compare
  this to hiring. One employee is simpler and cheaper but may get
  overwhelmed, forget tasks or take longer. Several each own an area but may
  have to wait for one another. [team-2026-assignment4 §One or multiple]
- Anthropic reports the cost side: in its data, agents use about **4× the
  tokens** of a chat, and multi-agent systems about **15×**. Multi-agent is
  economical only when the task is valuable enough to pay for the extra
  performance. [anthropic-2025-multi-agent-research §Benefits of a multi-agent system]
- Anthropic: domains where all agents must share the same context, or where
  agents depend heavily on one another, are a poor fit for multi-agent
  systems today. Most coding tasks, for example, have fewer truly parallel
  parts than research does. [anthropic-2025-multi-agent-research §Benefits of a multi-agent system]
- Cognition argues the opposite default: build a **single-threaded agent**,
  because parallel subagents cannot see each other's work and make
  conflicting assumptions. For long tasks, it suggests compressing history
  rather than splitting the work. [cognition-2025-dont-build-multi-agents]

## Where sources disagree

- **Anthropic** found multi-agent worth it for broad research with parallel
  directions, and reports a large gain (see P05). **Cognition** says don't,
  for now, at least for building software where every decision depends on
  every other. Both agree on the deciding factor: **how independent the
  subtasks are**. Independent parts favour several agents; interdependent
  parts favour one.

## What this means for the guide

Recommend several agents only when **all** of these hold:

1. a single agent was tried, or is clearly overloaded by roles, branches or
   overlapping tools
2. the work splits into parts that need little shared context
3. the task is valuable enough to justify roughly 15× chat-level token cost

Otherwise recommend one agent, possibly inside a workflow. The guide's hiring
analogy (one employee vs a team) is a good plain-English explanation and
matches the evidence.
