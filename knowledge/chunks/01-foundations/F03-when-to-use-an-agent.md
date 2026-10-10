---
id: F03
title: When an agent is worth it, and when plain automation is enough
topic: foundations
sources: [anthropic-2024-effective-agents, openai-2025-practical-guide, langchain-2025-agent-frameworks, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- **The first test is whether AI is needed at all.** The team frames it as:
  can the output be written as a deterministic function of the input, or does
  the work need flexible interpretation? If the former, pure automation
  suffices. If AI is needed, ask which parts can still be automated.
  [team-2026-assignment4 §opening questions]
- Anthropic: find the simplest solution possible and add complexity only when
  needed, which may mean not building an agentic system at all. For many
  applications, a single LLM call with retrieval and in-context examples is
  enough. [anthropic-2024-effective-agents §When (and when not) to use agents]
- Anthropic: agentic systems usually trade latency and cost for better task
  performance, so use them only when that trade is worth it. Workflows suit
  well-defined tasks needing predictability and consistency; agents suit cases
  needing flexibility and model-driven decisions at scale.
  [anthropic-2024-effective-agents §When (and when not) to use agents]
- Anthropic: agents fit open-ended problems where the number of steps cannot
  be predicted and a fixed path cannot be hardcoded.
  [anthropic-2024-effective-agents §Agents]
- OpenAI says agents fit workflows where deterministic, rule-based approaches
  fall short, and gives three signals, each with an example:
  1. **Complex decisions:** nuanced judgement, exceptions, context-sensitive
     calls (refund approval in customer service).
  2. **Rules that are hard to maintain:** rule sets so large and intricate that
     updates are costly or error-prone (vendor security reviews).
  3. **Heavy unstructured data:** interpreting natural language, documents or
     conversations (processing a home insurance claim).
  If a use case does not clearly meet these, a deterministic solution may be
  enough. [openai-2025-practical-guide pp. 5–6]
- OpenAI's illustration: a rules engine for payment fraud works like a
  checklist, while an agent works more like an investigator who weighs context
  and spots suspicious patterns that break no explicit rule.
  [openai-2025-practical-guide pp. 5–6]
- The team's notes add the agent case as: work that needs something to decide
  the next step and start it, because the goal is open-ended and may take
  repeated steps. [team-2026-assignment4 §Do they need an agent?]
- LangChain: workflows are enough when the path is defined and when cost,
  latency and predictability matter; agents are for when flexibility and
  model-driven decisions are needed. [langchain-2025-agent-frameworks §Workflows vs Agents]

## What this means for the guide

The guide's first decisions, in order:

1. **Is the output a fixed function of the input?** Yes means plain automation,
   with no AI.
2. **Does some step need interpretation but the path is known?** Then use a
   workflow with AI steps only where interpretation happens.
3. **Is the path itself unknown, needing the system to choose its next step
   repeatedly?** Then use an agent for that part.
4. **Does the case match one of OpenAI's three signals** (complex judgement,
   unmaintainable rules, unstructured input)? This supports steps 2 and 3. It
   is not on its own a reason to add autonomy.

Each step up costs latency, money and predictability, so the guide should
state which answer pushed the design up a level.
