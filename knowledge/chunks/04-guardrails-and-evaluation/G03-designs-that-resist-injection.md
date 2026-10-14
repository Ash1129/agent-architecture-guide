---
id: G03
title: Designs that resist prompt injection
topic: guardrails
sources: [beurer-kellner-2025-design-patterns, owasp-2025-llm06-excessive-agency, willison-2025-lethal-trifecta]
last_verified: 2026-10-05
---

## Claims

- Beurer-Kellner et al. (authors from Invariant Labs, IBM, EPFL, ETH Zurich,
  Google and others) propose design patterns that make agents resistant to
  prompt injection by **deliberately limiting what they can do**.
  [beurer-kellner-2025-design-patterns §3]
- Their guiding principle: once an agent has read untrusted input, it must be
  constrained so that input cannot trigger any consequential action, meaning
  an action with harmful side effects, including leaking data through its
  output. [beurer-kellner-2025-design-patterns §3]
- The six patterns [beurer-kellner-2025-design-patterns §3.1]:
  1. **Action-selector:** the LLM only translates a request into one of a
     fixed set of predefined actions, and sees no results back. In effect it
     is a smart switch statement.
  2. **Plan-then-execute:** the agent fixes its plan *before* touching
     untrusted data, so that data can't change which actions it takes. It can
     still influence their inputs.
  3. **LLM map-reduce:** isolated sub-agents each process one piece of
     untrusted data and return constrained results to the main agent.
  4. **Dual LLM:** a privileged LLM plans and uses tools; a quarantined LLM,
     with no tools, handles untrusted text, and its output is constrained.
  5. **Code-then-execute:** the agent writes a program that calls tools and
     hands untrusted text to unprivileged LLMs.
  6. **Context-minimisation:** remove unnecessary content, including the
     user's original prompt where possible, from the context before later
     steps.
- They illustrate the patterns with ten case studies, including an email and
  calendar assistant, a customer-service chatbot, a booking assistant and a
  resume-screening assistant. [beurer-kellner-2025-design-patterns §4]
- The trade-off is utility: each pattern stops the agent doing some things a
  free agent could. [beurer-kellner-2025-design-patterns abstract; §3]
- OWASP's complementary advice: keep tools minimal and narrow, and enforce
  authorisation outside the LLM.
  [owasp-2025-llm06-excessive-agency §Prevention and Mitigation Strategies]
- Willison points to these patterns as help for **builders**. They do not help
  end users who mix tools themselves; for them, the advice is to avoid the
  lethal trifecta. [willison-2025-lethal-trifecta]

## What this means for the guide

- Several patterns line up with designs the guide already favours:
  - **workflow with an AI step** ≈ action-selector or plan-then-execute; the
    workflow fixes the actions
  - **router + fixed branches** ≈ action-selector
  - **specialists that read documents and return structured fields** ≈
    map-reduce or dual LLM
- So the guide can honestly say: where a task touches untrusted content
  (customer emails, uploaded files, web pages), the **more workflow-like
  design is also the more secure one**. This is another reason to choose a
  workflow over a free agent, alongside cost and predictability.
- When an agent must read untrusted content, recommend that its output be
  **structured fields** (category, amount, date) checked by code, not free
  text passed straight into actions.
