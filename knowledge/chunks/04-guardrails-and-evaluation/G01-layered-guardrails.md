---
id: G01
title: Guardrails come in layers, and each tool gets a risk rating
topic: guardrails
sources: [openai-2025-practical-guide, owasp-2025-llm06-excessive-agency, databricks-2026-harness]
last_verified: 2026-10-05
---

## Claims

- OpenAI: guardrails manage data privacy risks (such as leaking the system
  prompt) and reputational risks (such as off-brand behaviour). They must be
  combined with ordinary security: authentication, authorisation, strict
  access controls and standard software security.
  [openai-2025-practical-guide p. 24]
- OpenAI: think of guardrails as **layered defence**. No single guardrail is
  enough; several specialised ones together make an agent more resilient.
  [openai-2025-practical-guide p. 25]
- OpenAI's types of guardrail [openai-2025-practical-guide pp. 26–27]:
  - **relevance classifier:** flags off-topic requests
  - **safety classifier:** detects jailbreaks and prompt injection
  - **PII filter:** stops unnecessary exposure of personal data in outputs
  - **moderation:** flags harmful or abusive input
  - **tool safeguards:** each tool rated low, medium or high risk by read vs
    write access, reversibility, permissions and financial impact
  - **rules-based protections:** blocklists, input length limits, regex
  - **output validation:** keeps responses in line with brand values
- OpenAI's build order: start with data privacy and content safety, add
  guardrails as real edge cases and failures appear, and keep balancing
  security against user experience. [openai-2025-practical-guide p. 27]
- OpenAI's guardrails can run alongside the agent ("optimistic execution")
  and stop the run when a limit is breached.
  [openai-2025-practical-guide p. 31]
- OWASP's "excessive agency" risk (LLM06) has three root causes: too much
  functionality, too many permissions, and too much autonomy. Its mitigations
  [owasp-2025-llm06-excessive-agency §Prevention and Mitigation Strategies]:
  - give the agent only the extensions it needs, and keep their functions
    narrow
  - run them with the minimum permissions
  - require a person to approve high-impact actions
  - enforce authorisation in the downstream systems ("complete mediation")
    rather than trusting the LLM to decide what is allowed
- Databricks lists missing guardrails as a production failure mode: agents
  taking irreversible actions without enough oversight.
  [databricks-2026-harness §Common failure modes in production AI agent harnesses]

## What this means for the guide

- Guardrails in the guide's designs should be described in **layers**, each
  with a plain purpose: keep it on-topic, protect personal data, block known
  bad inputs, rate and gate risky tools, check the output.
- **Least privilege is the cheapest guardrail.** For each tool the design uses,
  BUILD.md should state the narrowest access it needs, such as read-only
  where possible and one mailbox rather than all of them.
- Permission checks belong in the business system (the CRM, the bank, the
  email server), not in the prompt. A prompt saying "never refund over $500"
  is a guideline; an account limit is a guardrail.
