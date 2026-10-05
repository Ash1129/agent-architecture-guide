---
id: A02
title: When a person must step in, and how to keep the off-switch
topic: autonomy
sources: [openai-2025-practical-guide, anthropic-2025-trustworthy-agents, eu-2024-ai-act-art14, langchain-2025-agent-frameworks, feng-2025-levels-of-autonomy]
last_verified: 2026-10-05
---

## Claims

- OpenAI names two main triggers for handing over to a person
  [openai-2025-practical-guide p. 31]:
  1. **Failure thresholds:** set limits on retries or actions, and escalate
     when they are exceeded (for example, failing to understand a customer's
     intent after several attempts).
  2. **High-risk actions:** sensitive, irreversible or high-stakes actions
     should get human oversight until confidence in the agent's reliability
     grows. OpenAI's examples are cancelling orders, authorising large
     refunds and making payments.
- OpenAI calls human intervention especially important early in deployment,
  for finding failures and edge cases and building an evaluation cycle. A
  handover means escalating to a human agent in customer service, or handing
  control back to the user for a coding agent. [openai-2025-practical-guide p. 31]
- OpenAI suggests rating every tool low, medium or high risk. The rating is
  based on read-only vs write access, reversibility, the account permissions
  required and financial impact. High-risk tools should trigger a pause for
  checks or escalation to a person. [openai-2025-practical-guide p. 26]
- The EU AI Act requires high-risk AI systems to be designed so that people
  can oversee them effectively while they run. The people overseeing must be
  able to:
  - understand the system's limits
  - stay aware of the tendency to over-rely on its output ("automation bias")
  - interpret its output correctly
  - decide not to use it
  - override or reverse its output
  - interrupt it with a "stop" button or similar, so it halts in a safe state

  [eu-2024-ai-act-art14 §1, §4]
- LangChain distinguishes **human-in-the-loop**, where a person approves a
  tool call or edits its arguments during the run, from
  **human-on-the-loop**, where a person inspects the run afterwards and can
  rewind and re-run from an earlier step.
  [langchain-2025-agent-frameworks §What is the value of a framework?]
- Anthropic: people need visibility into the agent's reasoning. Without it, a
  goal such as "reduce churn" can produce actions that baffle the owner. Claude
  Code, for example, shows a live to-do list.
  [anthropic-2025-trustworthy-agents §Transparency in agent behavior]
- Even at the highest autonomy level, Feng et al. keep an emergency
  off-switch and activity logs. [feng-2025-levels-of-autonomy §3.5]

## What this means for the guide

- Every design gets two escalation rules by default:
  1. **after N failed attempts, go to a person** (with N stated)
  2. **any action that is irreversible, external or above a money threshold
     waits for approval**
- Classify each action tool by OpenAI's four risk factors: write access,
  reversibility, permissions and money. Show the classification in the step
  detail so approval gates are explained, not arbitrary.
- Every design needs a visible **stop** and a **log** the owner can read. For
  EU-based high-risk uses this is a legal requirement, not just good practice.
  The deployment chunks should flag which uses count as high-risk.
- Prefer human-in-the-loop for actions and human-on-the-loop (sampled review
  of logs) for routine outputs once trust is established. This is the
  difference between the guide's levels 2–3 and level 4.
