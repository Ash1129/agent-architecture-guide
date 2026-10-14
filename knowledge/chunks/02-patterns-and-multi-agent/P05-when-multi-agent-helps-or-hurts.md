---
id: P05
title: When several agents help and when they hurt - the evidence
topic: multi-agent
sources: [kim-2025-scaling-agent-systems, anthropic-2025-multi-agent-research, cognition-2025-dont-build-multi-agents]
last_verified: 2026-10-05
---

## Claims

- **Kim et al. (controlled study, preprint).** Across six agent benchmarks and
  three model families, the effect of adding agents ranged from **+80.8%**
  (financial reasoning that splits into parts, under a coordinator) to
  **−70.0%** (step-by-step planning, with independent agents). Matching the
  architecture to the task decided success, not the number of agents.
  [kim-2025-scaling-agent-systems abstract; §1]
- The study found three patterns [kim-2025-scaling-agent-systems §1]:
  1. **Tool-heavy tasks suffer.** In tasks with many tools (for example a
     16-tool business workflow), coordination overhead costs performance,
     because splitting the work also splits each agent's token budget.
  2. **A capability ceiling.** Where a single agent already scores above about
     45%, adding agents gave negative returns: the coordination cost exceeded
     the room left to improve.
  3. **Errors spread without a central check:** 17.2× amplification for
     independent agents, against 4.4× with a coordinator (see P04).
- In the same study, every multi-agent variant performed worse on tasks
  needing sequential constraint satisfaction (planning: −39% to −70%).
  Decentralized agents helped where parallel exploration of a large search
  space paid off (web navigation: +9.2%). [kim-2025-scaling-agent-systems §1]
- **Anthropic (vendor report, internal evaluation).** For broad research
  questions, a lead agent with subagents outperformed a single agent by 90.2%
  on Anthropic's internal research eval. On BrowseComp, three factors
  explained 95% of performance variance, and token usage alone explained 80%.
  Much of the multi-agent benefit is simply that more agents spend more
  tokens on the problem.
  [anthropic-2025-multi-agent-research §Benefits of a multi-agent system]
- Anthropic says multi-agent systems suit work that is **highly
  parallelizable**, has more information than one context window can hold,
  and involves many complex tools. [anthropic-2025-multi-agent-research §Benefits of a multi-agent system]
- Cognition's example of failure: two parallel subagents asked to build parts
  of a Flappy Bird game produced pieces in mismatched styles that the final
  agent could not reconcile. Neither could see the other's choices.
  [cognition-2025-dont-build-multi-agents]

## Where sources disagree

- On **tools**, Anthropic lists "many complex tools" as a reason *for*
  multi-agent, while Kim et al. measure tool-heavy tasks as a cost *against*
  it. The two can be reconciled. Anthropic's benefit comes from giving each
  subagent a separate slice of tools and context for a parallel task. Kim et
  al.'s penalty comes from splitting one tool-heavy task under a fixed budget.
- Anthropic's 90.2% is from its own internal eval of its own product; Kim et
  al. is a controlled multi-vendor study but not yet peer-reviewed. Neither
  is final. Their direction agrees: gains come from **parallel,
  decomposable** work.

## What this means for the guide

- **Favour several agents when:**
  - the task breaks into independent parts that can run in parallel
    (researching several companies, reviewing separate documents)
  - one agent clearly struggles (well below about 45% success on the owner's
    own test cases)
- **Favour one agent when:**
  - steps depend on each other in sequence (planning, multi-step
    transactions, building one coherent artefact)
  - one agent already does reasonably well
  - the task involves many tools in one tightly linked flow
- Always pair a multi-agent recommendation with a coordinator that checks
  work before it is combined.
