---
id: P06
title: How multi-agent systems fail - the MAST taxonomy
topic: multi-agent
sources: [cemri-2025-mast, cognition-2025-dont-build-multi-agents, anthropic-2025-multi-agent-research]
last_verified: 2026-10-05
---

## Claims

- **MAST (Cemri et al., NeurIPS 2025 Datasets and Benchmarks).** Researchers
  annotated 1,642 execution traces from 7 popular multi-agent frameworks,
  with strong agreement between annotators (Cohen's kappa 0.88). They found
  14 failure modes in 3 categories. [cemri-2025-mast abstract; §3]
- The categories, with each mode's share of observed failures
  [cemri-2025-mast Figure 1; §4]:
  - **System design issues (44.2%):**
    - disobeying the task specification, 11.8%
    - disobeying role specification, 1.5%
    - repeating steps, 15.7%
    - losing conversation history, 2.8%
    - not knowing when to stop, 12.4%
  - **Misalignment between agents (32.3%):**
    - conversation reset, 2.2%
    - not asking for clarification, 6.8%
    - drifting off task, 7.4%
    - withholding information, 0.85%
    - ignoring another agent's input, 1.9%
    - reasoning that doesn't match the action taken, 13.2%
  - **Task verification (23.5%):**
    - stopping too early, 6.2%
    - no or incomplete verification, 8.2%
    - incorrect verification, 9.1%
- Systems with explicit verifier roles showed fewer failures overall, but a
  verifier is "not a silver bullet". One generated chess program passed
  superficial checks yet still broke the game's rules.
  [cemri-2025-mast §4, FC3]
- Targeted fixes helped but did not solve the problem. Making sure the "CEO"
  agent had the final say raised task success by 9.4%. Adding a high-level
  check of the task objective raised it by 15.6%. Completion rates stayed
  low, and the authors argue that many failures come from **organisational
  design**, not individual agents. [cemri-2025-mast §1; §5]
- Cognition's two principles: share full context, including the complete
  record of what other agents did and not just their messages; and remember
  that every action carries implicit decisions, so agents deciding in
  parallel will conflict. [cognition-2025-dont-build-multi-agents]
- Anthropic on running agents in production:
  - errors compound, because agents keep state over long runs; minor
    failures need error handling and checkpointing so a run can resume
    rather than restart
  - agents are not deterministic, which makes debugging harder
  - running subagents synchronously creates bottlenecks

  [anthropic-2025-multi-agent-research §Production reliability and engineering challenges]

## What this means for the guide

- The most common failures are not exotic: repeating steps, not knowing when
  to stop, ignoring instructions, and weak verification. The guide's design
  rules answer these directly:
  - a step limit (F06)
  - a clear done-condition
  - a role and output format for each agent
  - a check that compares against the original objective, not just surface
    form (P02)
- The gotchas section for any multi-agent recommendation should name the top
  three risks: repetition, not knowing when to stop, and weak verification,
  each with its fix.
- Treat multi-agent design like designing a team: who decides, who checks,
  and what each member must hand over. This matches the team's hiring
  analogy (P03).
