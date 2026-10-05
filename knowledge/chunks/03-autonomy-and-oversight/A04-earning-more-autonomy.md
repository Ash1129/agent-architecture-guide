---
id: A04
title: Earning more autonomy over time
topic: autonomy
sources: [openai-2025-practical-guide, anthropic-2025-trustworthy-agents, anthropic-2025-multi-agent-research, feng-2025-levels-of-autonomy]
last_verified: 2026-10-05
---

## Claims

- OpenAI frames human oversight of high-risk actions as lasting "until
  confidence in the agent's reliability grows", and calls early deployment the
  time when human intervention matters most. Autonomy is meant to be widened
  as evidence builds. [openai-2025-practical-guide p. 31]
- OpenAI's guardrail heuristic is also incremental. Start with data privacy
  and content safety, add guardrails based on real edge cases and failures as
  they appear, and keep tuning for both security and user experience.
  [openai-2025-practical-guide p. 27]
- Anthropic's Claude Code lets users grant standing permissions for routine
  tasks they trust it with, while other actions still need approval. Trust is
  granted per type of action, not all at once.
  [anthropic-2025-trustworthy-agents §Keeping humans in control while enabling agent autonomy]
- Anthropic's research team started evaluating with about 20 queries
  representing real use. Early on, prompt changes had large effects, from 30%
  to 80% success, so a small test set was enough to see them. People testing
  the agent also found edge cases the automated evals missed.
  [anthropic-2025-multi-agent-research §Effective evaluation of agents]
- Feng et al. propose "autonomy certificates": an agent is certified for a
  level, given its tools and environment, and recertified when those change,
  for example when a new tool is added. [feng-2025-levels-of-autonomy §4.2]

## What this means for the guide

The guide should recommend a **staged rollout**, not a single autonomy
setting:

1. **Shadow:** the system runs on real cases but a person does the real work
   and compares. Start with a small set of about 20 real cases.
2. **Approve:** the system acts, but a person approves the risky actions, or
   all actions if stakes are high.
3. **Widen:** action types with a clean record get standing permission;
   failures and high-risk actions still escalate.
4. **Recheck after any change:** a new tool, model or data source resets
   trust for the affected actions (Feng's recertification idea).

The "first step" the guide gives every owner should be stage 1. That is
cheap, safe, and produces the evidence needed for the later stages.
