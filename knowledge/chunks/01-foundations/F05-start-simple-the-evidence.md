---
id: F05
title: Start simple, and why the evidence backs it
topic: foundations
sources: [anthropic-2024-effective-agents, kapoor-2024-agents-that-matter, openai-2025-practical-guide, langchain-2025-agent-frameworks]
last_verified: 2026-10-05
---

## Claims

- Anthropic's summary: success means building the right system for the need,
  not the most sophisticated one. Start with simple prompts, improve them with
  thorough evaluation, and add multi-step agentic systems only when simpler
  approaches fall short. [anthropic-2024-effective-agents §Summary]
- Anthropic's three principles for building agents:
  1. keep the design simple
  2. make the agent's planning steps visible
  3. document and test the tools the agent uses

  [anthropic-2024-effective-agents §Summary]
- **Measured evidence (Kapoor et al.; preprint).** On the HumanEval
  coding benchmark, three simple strategies were compared with published
  complex agents:
  - **retry:** call the model up to five times if tests fail
  - **warming:** retry while gradually raising the temperature
  - **escalation:** start with a cheap model and move to an expensive one on
    failure

  Results: warming reached 93.2% accuracy at about $2.45. Reflexion reached
  87.8% at $3.90. LATS reached 88% at $134.50, more than 50 times the cost.
  The authors conclude that the state-of-the-art agent designs they tested did
  not beat these simple baselines, and that the extra planning, reflection
  and debugging machinery was not what produced the accuracy.
  [kapoor-2024-agents-that-matter §2]
- Kapoor et al. argue agents should be judged on **cost and accuracy
  together** (a Pareto frontier). Agents with similar accuracy differed in
  cost by almost two orders of magnitude. Businesses choosing a system care
  about dollar cost relative to accuracy, not proxies such as parameter count.
  [kapoor-2024-agents-that-matter §2; §4]
- Anthropic on frameworks: they can speed up a start, but they add layers
  that hide the underlying prompts and responses, which makes debugging
  harder. Start by calling model APIs directly, since many patterns take only
  a few lines of code. [anthropic-2024-effective-agents §When and how to use frameworks]
- OpenAI's model advice takes the same incremental route: build the
  prototype on the most capable model to set a baseline, then swap in smaller
  models where results stay acceptable. [openai-2025-practical-guide p. 8]
- LangChain counters that a good framework provides valuable infrastructure
  whether you build workflows or agents: memory, human-in-the-loop,
  durable execution, streaming and step-by-step debugging.
  [langchain-2025-agent-frameworks §What is the value of a framework?]

## Where sources disagree

- **Frameworks.** Anthropic leans toward building directly on the API first;
  LangChain, which makes a framework, argues frameworks pay for themselves
  through infrastructure. Both agree the danger is abstractions that hide
  what the model actually sees.

## What this means for the guide

- The guide should always show a **simpler option** next to its
  recommendation, and say what the extra complexity buys. That feature is
  directly supported here.
- Escalation (cheap model first, stronger model on failure) has measured
  support and is a cheap first design to suggest where outputs can be
  checked automatically.
- The guide should prefer platforms that keep prompts visible and editable,
  such as n8n nodes, skills and plain files, over opaque abstractions, in
  line with Anthropic's transparency principle.
