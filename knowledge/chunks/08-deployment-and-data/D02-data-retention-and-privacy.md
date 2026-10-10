---
id: D02
title: What Anthropic keeps, and the privacy arrangements available
topic: deployment
sources: [anthropic-docs-data-retention, anthropic-docs-agent-skills, anthropic-help-cowork-team]
last_verified: 2026-10-05
---

## Claims

- Anthropic's stated commitments for the API [anthropic-docs-data-retention §How Anthropic approaches data retention]:
  - retained data is never used for training "without your express
    permission"
  - prompts and outputs are not kept by default, except for "Covered
    Models", which require 30-day retention
- **Retention periods** [anthropic-docs-data-retention §How Anthropic approaches data retention]:
  - claude.ai chats, files and projects: kept per the organisation's own
    retention setting, unless the user deletes them sooner
  - Cowork cloud session transcripts: kept 6 years unless the user deletes
    the session
  - local Cowork and Claude Code transcripts: kept 6 years by default for
    the Compliance API, or the organisation's shorter setting
  - the admin activity feed: kept 6 years
- **Zero data retention (ZDR)**: nothing stored after the response is
  returned. It is arranged through Anthropic sales, per organisation, and
  covers the Messages API (for eligible features) and Claude Code with
  commercial API keys. [anthropic-docs-data-retention §Zero data retention (ZDR); §What ZDR covers]
- ZDR does **not** cover [anthropic-docs-data-retention §What ZDR does not cover]:
  - the Free, Pro and Max plans
  - the Team and Enterprise apps (except a separate Claude Code offering
    on Enterprise)
  - the Console, Managed Agents, Claude for Excel, and third-party tools
    connected to Claude
  - Claude Fable 5.1, Mythos 5.1, Fable 5 and Mythos 5, which require
    30-day retention unless Anthropic expressly authorises otherwise
- Agent Skills are also outside ZDR. [anthropic-docs-agent-skills §Data retention]
- **HIPAA.** The API supports HIPAA-ready use for health data with a signed
  BAA; it covers eligible API features only, not consumer plans, the
  Console, Claude Code, beta features or connected third-party tools.
  [anthropic-docs-data-retention §HIPAA readiness]
  In Cowork, a HIPAA configuration covers local sessions on the desktop app,
  and disables cloud sessions. [anthropic-help-cowork-team §Security, compliance, and monitoring]
- **Regardless of arrangement**, data may be kept where the law requires,
  and flagged chats or sessions may be kept for up to 2 years.
  [anthropic-docs-data-retention §Retention regardless of arrangement]

## What this means for the guide

- Choosing a platform is also choosing a data policy. For sensitive work:
  - use a Team or Enterprise plan or the API, not a personal Pro or Max plan
  - for the strictest needs (nothing stored), ZDR via the API, which rules
    out the apps, Skills and Fable 5.1
  - for health data, HIPAA readiness via the API, or Cowork's local mode
- **Model choice and privacy interact:** the most capable model, Fable 5.1
  (M01), requires 30-day retention. A business needing ZDR should
  recommend Opus 5.5 or another model instead.
- Every connector adds another company's data policy (third-party tools are
  outside Anthropic's arrangements). The guide should ask users to check
  each connected service.
