---
id: M03
title: Open-weight models - how far behind, and which lead
topic: models
sources: [epoch-2026-open-closed-gap, team-2026-assignment4, pabani-2026-openclaw-hermes-cowork]
last_verified: 2026-10-05
---

## Claims

- Epoch AI: since January 2026, the most capable **open-weight** models
  (weights published so anyone can run them) have trailed the best closed
  models by about **four months** on Epoch's Capabilities Index. The average
  gap was 8 index points, similar to the gap between GPT-5 and GPT-5.5.
  [epoch-2026-open-closed-gap]
- Among open-weight models released without usage restrictions, the highest
  scores in Epoch's data on 2026-10-05 included:
  - Moonshot's **Kimi K2.6** (April 2026) and Kimi K2.5
  - **MiniMax-M2.5**
  - Z.ai's **GLM-5**
  - **DeepSeek-V3.2**

  All are from Chinese developers. Alibaba's **Qwen3-235B** (July 2025)
  scored a step lower. [epoch-2026-open-closed-gap]
- The team's notes give the business reasons to want models beyond one vendor
  [team-2026-assignment4 §Hermes]:
  - a business operating where Anthropic's models are unavailable, the
    example being China
  - a business where they cost too much
  - avoiding the "ecosystem trap"

  The notes cite Hermes as an agent platform not restricted to Anthropic
  models.
- Pabani describes Hermes Agent as open-source and **model-agnostic**: it runs
  on whatever model provider the user chooses, and locally, in Docker or on
  remote backends. [pabani-2026-openclaw-hermes-cowork §What each one actually is; §The strategic difference]

## Where sources disagree

- None on the gap itself. The ranking of individual open models changes
  monthly and differs by benchmark. Treat the list above as a dated snapshot,
  not a recommendation of one model.

## What this means for the guide

- An open-weight model is a reasonable choice when control, data location or
  vendor independence matter more than having the very best model. Expect
  capability roughly a few months behind the frontier.
- **Discrepancy in the site:** `src/lib/models.ts` gives "Qwen3 235B, Llama 4
  Maverick or Hermes 4" as example open-weight models. These are dated; Qwen3
  is now a step behind the leaders, and Llama 4 Maverick and Hermes 4 do not
  appear among the top open models. Update the examples, with a date, or
  name the category without specific models.
- The leading open models come from Chinese developers. Running their weights
  on your own hardware keeps data local, but some businesses have procurement
  rules about model origin. The deployment topic should cover this.
- The cost and hardware side of running these models is covered in the
  deployment topic (local vs cloud).
