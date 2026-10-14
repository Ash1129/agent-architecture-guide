---
id: F06
title: The agent loop - reason, act, check reality, and know when to stop
topic: foundations
sources: [yao-2023-react, anthropic-2024-effective-agents, openai-2025-practical-guide, databricks-2026-harness]
last_verified: 2026-10-05
---

## Claims

- **ReAct (Yao et al., ICLR 2023)** is the research basis for the modern
  agent loop: the model alternates between reasoning ("thoughts") and actions
  (such as searching), and uses what the actions return to steer the next
  step. [yao-2023-react abstract]
- Grounding in real results reduces made-up answers. In a manual review of 200
  question-answering cases:
  - reasoning alone (chain-of-thought) had hallucination behind 56% of its
    failures
  - ReAct had none of its failures caused by hallucination

  ReAct's failures came instead from reasoning errors (47%) and unhelpful
  search results (23%), and it sometimes repeated its own earlier steps in a
  loop. [yao-2023-react §3, Table 2]
- The loop helps more on interactive tasks. On ALFWorld, ReAct succeeded 71%
  of the time against 37% for an imitation-learning baseline. On WebShop it
  reached 40% against 28.7%. On pure question answering it was mixed: slightly
  worse than reasoning alone on HotpotQA (27.4 vs 29.4), better on FEVER
  (60.9 vs 56.3). Combining both approaches did best.
  [yao-2023-react §3.3; §4]
- Anthropic: during a run, an agent must get "ground truth" from the
  environment at each step, such as tool results or code output, to judge its
  progress. It can pause for human feedback at checkpoints or when blocked.
  Tasks usually end on completion, but stopping conditions such as a maximum
  number of iterations are common, to keep control.
  [anthropic-2024-effective-agents §Agents]
- Anthropic: autonomy brings higher cost and the risk of **compounding
  errors**, so agents need extensive testing in sandboxed environments and
  appropriate guardrails. [anthropic-2024-effective-agents §Agents]
- OpenAI: an agent should recognise when its work is complete, correct itself
  when needed, and on failure stop and hand control back to the user.
  [openai-2025-practical-guide p. 4]
- Databricks gives the same loop for production systems: reason, act,
  observe, repeat until done. [databricks-2026-harness §What is the reason, act, observe loop?]

## What this means for the guide

- Every agent in a recommended design needs **three explicit exits**:
  1. done: the goal is reached
  2. a step limit: a maximum number of iterations
  3. hand to a person: stuck, blocked, or a risky action needs approval

  The guide's diagram should draw all three. This supports the existing
  "stop rule" and "stuck cases go to a person" gates.
- The agent should act on systems that report back, such as APIs, files or
  test results. That feedback is what keeps it honest, per the ReAct error
  analysis.
- Repetition is a known failure, so the step limit is not optional.
