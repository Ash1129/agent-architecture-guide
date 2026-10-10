---
id: P02
title: Voting, checking and self-correction - what the research shows
topic: patterns
sources: [wang-2023-self-consistency, madaan-2023-self-refine, du-2024-multiagent-debate, huang-2024-cannot-self-correct, anthropic-2024-effective-agents]
last_verified: 2026-10-05
---

## Claims

- **Voting works.** Self-consistency samples several reasoning paths and keeps
  the most common answer. On reasoning benchmarks it raised chain-of-thought
  accuracy substantially: GSM8K +17.9 points, SVAMP +11.0, AQuA +12.2,
  StrategyQA +6.4, ARC-challenge +3.9. [wang-2023-self-consistency abstract]
- **Iterative refinement can work.** Self-Refine has the same model generate,
  critique its own output and revise, repeatedly, with no extra training.
  Across 7 tasks, from dialogue to maths, using GPT-3.5 and GPT-4, outputs
  improved by about 20 percentage points on average over single-pass
  generation, as judged by humans and automatic metrics.
  [madaan-2023-self-refine abstract]
- **Debate between agents can work.** Several model instances propose answers
  and critique each other over several rounds before agreeing. This improved
  maths and strategic reasoning and reduced hallucinated facts.
  [du-2024-multiagent-debate abstract]
- **But a model checking itself, with no outside signal, is unreliable.**
  Huang et al. (Google DeepMind) found that models struggle to correct their
  own reasoning without external feedback, and sometimes get worse after
  trying. Earlier reported gains came from using the correct answers ("oracle
  labels") to decide when to stop, and vanished without them.
  [huang-2024-cannot-self-correct abstract; §1; §3]
- The same paper found multi-agent debate **no better than simple voting**
  when both use the same number of model responses. It also found that
  some of Self-Refine's reported gains came from a weak initial prompt.
  [huang-2024-cannot-self-correct §1; Table 1; §4; §5]
- Anthropic recommends the evaluator-optimizer pattern only when there are
  **clear evaluation criteria** and refinement adds measurable value.
  [anthropic-2024-effective-agents §Workflow: Evaluator-optimizer]

## Where sources disagree

- Self-Refine and debate report clear gains. Huang et al. argue that much of
  this disappears under fair comparisons: no answer key, equal compute and a
  strong first prompt. Both sets are peer-reviewed. The most defensible
  reading is that **checking helps when the checker has something real to
  check against**, such as test results, a rubric, source documents or a
  person. A second model rereading the same text without new information
  adds cost but little reliability.

## What this means for the guide

- A "check" step in the diagram should name **what it checks against**:
  - tests that pass or fail
  - required fields, or rules in a playbook
  - the source document
  - a person's judgement

  If nothing external is available, the guide should say the check is weak
  and lean on human approval instead.
- For high-stakes judgements, **voting** (several independent runs, majority
  answer) is the best-supported way to buy confidence with extra compute.
  It is simpler than debate and does at least as well at equal cost.
- Any fix-and-retry loop should be capped. This links to the stop rules in
  F06 and to the repetition failure in P06.
