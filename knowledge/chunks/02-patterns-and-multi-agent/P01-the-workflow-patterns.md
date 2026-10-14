---
id: P01
title: The five workflow patterns and the single-agent loop
topic: patterns
sources: [anthropic-2024-effective-agents, openai-2025-practical-guide]
last_verified: 2026-10-05
---

## Claims

Anthropic describes five workflow patterns, in rising order of flexibility
[anthropic-2024-effective-agents §Building blocks, workflows, and agents]:

| Pattern | What it does | Use when | Anthropic's examples |
| --- | --- | --- | --- |
| Prompt chaining | A fixed sequence of LLM calls, each working on the last one's output; checks can sit between steps | The task splits cleanly into fixed subtasks; trades latency for accuracy | Write marketing copy, then translate it; outline, check the outline, then write |
| Routing | Classify the input, then send it to a specialised follow-up | Distinct categories are better handled separately, and classification is accurate | Customer queries to different processes; easy questions to a small model, hard ones to a capable model |
| Parallelization | Several LLM calls run at once and results are combined in code. **Sectioning** splits into independent parts; **voting** runs the same task several times | Subtasks can run in parallel for speed, or several perspectives raise confidence | One model answers while another screens for inappropriate content; several prompts review code for vulnerabilities |
| Orchestrator-workers | A central LLM breaks the task down on the fly, delegates to workers and combines their results | Subtasks cannot be predicted in advance (unlike parallelization, they are not predefined) | Coding changes across many files |
| Evaluator-optimizer | One LLM generates, another evaluates and gives feedback, in a loop | Clear evaluation criteria exist and refinement adds measurable value | Literary translation with a critic; multi-round search |

- These patterns are building blocks to shape and combine for a use case,
  not prescriptions. [anthropic-2024-effective-agents §Combining and customizing these patterns]
- OpenAI divides orchestration into **single-agent systems** (one model with
  tools and instructions running in a loop) and **multi-agent systems**
  (execution spread across coordinated agents). It advises an incremental
  approach over starting with a complex autonomous design.
  [openai-2025-practical-guide p. 13]
- Every agent needs a "run": a loop that continues until an exit condition.
  Common exits are calling a final-output tool, returning a structured
  output, an error, or reaching a maximum number of turns.
  [openai-2025-practical-guide pp. 14–15]
- A single agent can take on more work by adding tools one at a time, which
  keeps evaluation and maintenance simple. One flexible prompt template with
  variables (such as customer name or complaint categories) can replace many
  separate prompts. [openai-2025-practical-guide pp. 14–15]

## What this means for the guide

- Map the owner's answers to a pattern before considering any agent:
  - **known steps in order:** prompt chaining
  - **distinct kinds of input:** routing
  - **independent parts, or a high-stakes judgement worth a second
    opinion:** parallelization
  - **can't predict the parts:** orchestrator-workers
  - **clear quality bar:** evaluator-optimizer
- Routing is also a cost lever: send easy cases to a small model and hard
  ones to a capable model. Anthropic gives this as a routing example.
- Every loop the guide draws needs a visible exit: done, structured output,
  error, or turn limit.
