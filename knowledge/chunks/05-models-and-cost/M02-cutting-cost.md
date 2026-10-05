---
id: M02
title: Cutting cost without losing quality
topic: cost
sources: [chen-2024-frugalgpt, ong-2025-routellm, kapoor-2024-agents-that-matter, anthropic-2024-effective-agents, anthropic-docs-pricing, anthropic-2025-multi-agent-research]
last_verified: 2026-10-05
---

## Claims

- **Prices vary enormously.** FrugalGPT (TMLR 2024) found that LLM APIs at the
  time differed in price by two orders of magnitude.
  [chen-2024-frugalgpt abstract]
- FrugalGPT names three ways to cut cost [chen-2024-frugalgpt abstract]:
  - adapting the prompt, for example sending less text
  - approximating an expensive model
  - **cascading:** try cheaper models first and escalate only when needed

  Its learned cascade matched GPT-4 with up to 98% lower cost, or beat it by
  4% at the same cost.
- **Routing (RouteLLM, ICLR 2025).** A trained router chooses, per request,
  between a stronger and a weaker model. It cut costs by over 2× in some cases
  without lowering response quality, and kept working when the two models
  were swapped for others. [ong-2025-routellm abstract]
- Kapoor et al.'s simple "escalation" baseline, which starts with a cheap
  model and moves to an expensive one on failure, was among the strategies
  that matched complex agents at far lower cost on a coding benchmark.
  [kapoor-2024-agents-that-matter §2]
- Anthropic gives routing as a cost pattern: easy, common questions to a
  small model and hard, unusual ones to a capable model.
  [anthropic-2024-effective-agents §Workflow: Routing]
- **Billing levers on the Claude API** [anthropic-docs-pricing]:
  - **Batch API:** 50% off input and output for asynchronous bulk work.
  - **Prompt caching:** a cache hit costs 10% of the normal input price
    (5% on Opus 5.5; 2.5% on Fable 5.1). It pays for itself after one cache
    read at 5-minute duration, or two at 1-hour duration.
  - Newer models (Claude 4.7 and later) use a tokenizer that produces about
    30% more tokens for the same text, which raises the effective cost per
    word.
- **Agents multiply token use.** Anthropic measured agents at about 4× and
  multi-agent systems at about 15× the tokens of a chat interaction.
  [anthropic-2025-multi-agent-research §Benefits of a multi-agent system]

## What this means for the guide

The cost advice, in order of impact:

1. **Choose the simplest architecture.** Going from workflow to agent to
   several agents multiplies tokens about 4×, then 15× (F05, P03).
2. **Route or cascade:** a small model handles the common cases and escalates
   the hard ones. The research reports 2× to 50× savings depending on setup.
   The guide's router step should be presented as a cost saver, not only a
   sorter.
3. **Batch** anything that doesn't need an instant answer, such as overnight
   reports or bulk document review, for a flat 50% off.
4. **Cache** the long, repeated parts (instructions, playbooks, reference
   documents) when the same material is sent with every request.

Cost estimates in the guide should be stated per 1,000 items, using the
price table in M01 with its check date.
