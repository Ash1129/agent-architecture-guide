---
id: M04
title: What plans and models cost (October 2026)
topic: cost
sources: [claude-2026-plans-pricing, n8n-2026-pricing, deepseek-docs-pricing, moonshot-docs-pricing, hermes-2026-repo, n8n-2026-license]
last_verified: 2026-10-10
---

## Claims

- **Claude plans, per user per month** [claude-2026-plans-pricing]:
  - Pro: $20 billed monthly, $17 billed annually. Includes Claude Code.
  - Max: from $100, monthly billing only.
  - Team Standard: $25 a seat billed monthly, $20 annually. Team Premium:
    $125 monthly, $100 annually. Both include Claude Code and Cowork.
  - Enterprise: $20 a seat plus usage at API rates.
  - Cowork was rolling out to Pro and Max when read.
- **Claude API, per million tokens (input / output)** [claude-2026-plans-pricing]:
  Fable 5.1 $10 / $50; Opus 5.5 $4 / $20; Sonnet 5.5 $2 / $10;
  **Haiku 5.5** $0.10 / $0.50 for prompts up to 100K tokens ($0.50 / $2.50
  above). Haiku 4.5 is listed as a legacy model at $1 / $5. Cache reads cost
  about 5% of the input price on these models (for example $0.10 on Sonnet
  5.5), and batch processing saves 50%.
- **n8n Cloud, billed annually** [n8n-2026-pricing]: Starter €20 a month for
  2,500 workflow executions; Pro €50 for 10,000; Business €667 for 40,000
  (self-hosted only); Enterprise by quote. Annual billing saves 17% against
  monthly. A self-hosted community version is on GitHub; the page gives it
  no price.
- n8n's licence allows free use, change and self-hosting for your own
  internal business purposes. [n8n-2026-license §Limitations]
- **Open-weight models through their makers' APIs, per million tokens:**
  - DeepSeek [deepseek-docs-pricing]: V4.1-Flash $0.15 / $0.60 input (cache
    miss) / output off-peak, $0.30 / $1.20 at peak; V4-Pro $0.66 / $1.98
    off-peak, $1.32 / $3.96 at peak. Peak is 01:00-04:00 and 06:00-10:00 UTC
    on weekdays.
  - Moonshot [moonshot-docs-pricing]: Kimi K2.6 ¥6.50 input (cache miss) and
    ¥27 output (about $0.90 / $3.80); Kimi K3 ¥20 / ¥100.
- **Hermes Agent** is MIT-licensed, so free to run; its README says it runs
  anywhere from a $5 VPS to GPU clusters. [hermes-2026-repo README]

## Where sources disagree

- The pricing pages give no date, so they are dated here by when they were
  read. Moonshot and DeepSeek quote "¥" and "$" without naming a currency;
  the dollar figures for Kimi assume about ¥7.1 to the dollar.
- Third-party trackers list Kimi K2.6 at $0.75 to $0.96 input and $3.50 to
  $4.00 output, depending on date and provider.

## What this means for the guide

- Running-cost estimates use these prices with the token multipliers in M02
  (agents about 4× a single call). The large open-weight tier is priced from
  V4-Pro and Kimi K2.6 (about $0.66 to $1.32 input, $2 to $4 output); the
  small tier from V4.1-Flash.
- **Discrepancies in the site (2026-10-10):**
  1. `src/lib/models.ts` still offers Haiku 4.5, now legacy and possibly
     retired from 2026-10-15; Haiku 5.5 is cheaper and current.
  2. `OPEN_LARGE_PICKS` names DeepSeek-V3.2; DeepSeek now serves V4.
- Plan prices and model prices change often: re-read before each release.
