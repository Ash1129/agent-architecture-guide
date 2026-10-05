---
id: G04
title: Testing an agent before and after launch
topic: evaluation
sources: [anthropic-2026-agent-evals, zheng-2023-llm-as-judge, openai-2025-practical-guide, kapoor-2024-agents-that-matter]
last_verified: 2026-10-05
---

## Claims

- Anthropic: teams get far with manual testing early on, but once an agent is
  in production and changing, building without evals means "flying blind".
  Complaints become the test suite, and real regressions can't be told apart
  from noise. Early on, writing evals also forces the team to define what
  success means. [anthropic-2026-agent-evals §Why build evaluations?]
- **Start small and early:** 20–50 simple tasks drawn from real failures is a
  good start. Early changes have large effects, so small samples are enough,
  and evals get harder to build the longer you wait. Begin with the checks
  you already do by hand, and turn bug reports and support tickets into test
  cases. [anthropic-2026-agent-evals §Going from zero to one]
- **Write unambiguous tasks:** two domain experts should independently reach
  the same pass/fail verdict. Everything the grader checks should be clear
  from the task description. A 0% pass rate across many tries usually means
  a broken task, not an incapable agent.
  [anthropic-2026-agent-evals §Going from zero to one]
- Three kinds of grader [anthropic-2026-agent-evals §Types of graders for agents]:
  - **code-based:** exact or pattern match, tests, checking the outcome or
    tool calls; fast, cheap, objective, but brittle to valid variations
  - **model-based:** rubrics, pairwise comparison, reference answers; flexible
    and nuanced, but not deterministic, and needs calibrating against people
  - **human:** expert review, spot checks, A/B tests; the gold standard, but
    slow and expensive
- Prefer deterministic graders where possible, LLM graders where necessary,
  and people for validation. **Grade the outcome, not the exact path**:
  agents often find valid routes the designer didn't anticipate. Give
  partial credit for multi-part tasks. Let an LLM grader answer "Unknown".
  [anthropic-2026-agent-evals §Design the eval harness and graders]
- **Capability vs regression:**
  - capability evals start with a low pass rate, giving the team something
    to climb
  - regression evals should pass at nearly 100%, to catch backsliding
  - once a capability is mastered, its evals graduate into the regression
    suite

  [anthropic-2026-agent-evals §Capability vs. regression evals]
- **Reliability needs repeated trials.** pass@k is the chance of at least one
  success in k tries; pass^k is the chance that all k succeed. An agent that
  succeeds 75% of the time passes three runs in a row only about 42% of the
  time. For customer-facing agents, consistency (pass^k) is what matters.
  [anthropic-2026-agent-evals §How to think about non-determinism in evaluations for agents]
- **LLM-as-judge works, with known biases (Zheng et al., NeurIPS 2023).**
  Strong LLM judges agreed with human preferences over 80% of the time, about
  as often as humans agree with each other. They are biased toward the answer
  shown first, longer answers and their own outputs, and their reasoning is
  limited. [zheng-2023-llm-as-judge abstract]
- Evals are one tool among several. Production monitoring, user feedback,
  A/B tests and reading transcripts catch what evals miss; evals can give
  false confidence if they don't match real use.
  [anthropic-2026-agent-evals §How evals fit with other methods for a holistic understanding of agents]
- OpenAI also bases model choice on evals: set a baseline, then swap in
  smaller models while results stay acceptable.
  [openai-2025-practical-guide p. 8]
- Kapoor et al.: report cost alongside accuracy, since agents with similar
  accuracy can differ in cost by almost two orders of magnitude.
  [kapoor-2024-agents-that-matter §2]

## What this means for the guide

- Every design's "first step" should include building a small test set:
  **20–50 real past cases with the right answer written down**. The same set
  serves the shadow stage in A04.
- Recommend graders in this order:
  1. code checks (fields present, totals match, rules followed)
  2. an LLM judge with a written rubric
  3. a person on a sample
- For customer-facing work, measure **consistency**: run each test case a few
  times. A 75% success rate means frequent visible failures.
- When suggesting an LLM checker step inside the workflow itself, note the
  same biases and give it a rubric and an "unsure" option.
