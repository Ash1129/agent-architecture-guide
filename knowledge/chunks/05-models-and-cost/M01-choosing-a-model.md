---
id: M01
title: Choosing a model, and the current Claude lineup
topic: models
sources: [openai-2025-practical-guide, anthropic-docs-choosing-a-model, anthropic-docs-models-overview]
last_verified: 2026-10-05
---

## Claims

- OpenAI: models trade off task complexity, latency and cost, and different
  steps of one workflow can use different models. A simple retrieval or intent
  classification may suit a small, fast model, while a judgement like whether
  to approve a refund may need a more capable one.
  [openai-2025-practical-guide p. 8]
- OpenAI's method:
  1. set up evals to get a baseline
  2. hit the accuracy target with the best models available
  3. swap in smaller models where results stay acceptable, to cut cost and
     latency

  [openai-2025-practical-guide p. 8]
- Anthropic offers two starting strategies
  [anthropic-docs-choosing-a-model §Choose the best model to start with]:
  - **Efficiency-first:** start with the fast, cheap model (Haiku 4.5) and
    upgrade only where tests show a gap. Best for prototypes, tight latency,
    tight budgets and high-volume simple tasks.
  - **Capability-first:** start with Opus 5.5, then lower effort or downgrade
    as the workflow matures. If evals still fall short on demanding reasoning
    or long agentic work, move up to Fable 5.1. Best for complex reasoning,
    nuanced understanding, accuracy over cost, and high-autonomy agents.
- Anthropic says most workloads should start with Opus 5.5. Its "effort"
  setting trades intelligence for speed and cost within one model, and tuning
  it is often a better lever than switching models.
  [anthropic-docs-choosing-a-model §Establish key criteria; §Model selection matrix]
- **The Claude lineup as listed on 2026-10-05**
  [anthropic-docs-models-overview §Compare models]:

| Model | Anthropic's positioning | Price in / out per million tokens | Context | Earliest retirement |
| --- | --- | --- | --- | --- |
| Claude Fable 5.1 | Most capable; demanding reasoning and long-horizon agentic work | $10 / $50 | 1M | Sep 1, 2027 |
| Claude Opus 5.5 | Long-running agentic coding and knowledge work; default starting point | $4 / $20 | 1M | Sep 22, 2027 |
| Claude Sonnet 5.5 | Best combination of speed and intelligence | $2 / $10 | 1M | Sep 28, 2027 |
| Claude Haiku 4.5 | Fastest; near-frontier intelligence; sub-agent and high-volume tasks | $1 / $5 | 200K | Oct 15, 2026 |

- Anthropic's selection matrix [anthropic-docs-choosing-a-model §Model selection matrix]:
  - **Fable 5.1:** hours-long agent sessions and deep research
  - **Opus 5.5:** complex agentic coding and enterprise work
  - **Sonnet 5.5:** everyday coding, analysis, content and tool use
  - **Haiku 4.5:** real-time, high-volume, cost-sensitive work and sub-agent
    tasks

## What this means for the guide

- The guide's method of building on a capable model and stepping each part
  down after testing is supported by both OpenAI and Anthropic.
- **Discrepancies in the site's model table (`src/lib/models.ts`)**, all
  fixed on 2026-10-05:
  1. It has no Fable 5.1, and treats Opus 5.5 as "most capable", which is
     no longer true.
  2. Haiku 4.5's earliest retirement is Oct 15, 2026, so designs that rely on
     it for routing need a stated fallback, Sonnet 5.5.
  3. "Try lower effort before a smaller model" should become a stated step.
- Model names and prices change fast. Every model claim in the guide should
  carry the date it was checked, and this chunk must be re-verified before
  each release.
