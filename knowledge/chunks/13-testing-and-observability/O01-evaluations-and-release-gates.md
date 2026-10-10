---
id: O01
title: Repeatable AI evaluations with Promptfoo
topic: testing-and-observability
sources: [promptfoo-2026-intro, promptfoo-2026-assertions]
last_verified: 2026-10-10
---

## Claims

- Promptfoo supplies a CLI and library for evaluating and red-teaming AI
  applications, supports multiple model providers, and can run in CI.
  [promptfoo-2026-intro §Intro]
- Assertions can use deterministic checks, JavaScript or Python logic and
  model-based grading. Test fixtures can carry expected results, including
  assertions in a CSV `__expected` column.
  [promptfoo-2026-assertions §Load assertions from external file; §Load assertions from CSV]

## What this means for the guide

Use evaluation to decide whether a change improves the real task. The guide
recommends Promptfoo for developer teams; smaller teams can begin with the same
acceptance cases and a manual scorecard. A passing framework test suite does not
measure the factual quality of an AI-generated answer.

- Build a versioned dataset from representative, sanitized cases. Include common
  tasks, rare failures, incomplete inputs and hostile source instructions. Keep
  a held-out set separate from examples used to tune prompts. Obtain expected
  results from the business owner rather than treating current model output as
  the answer key.
- Define what must never happen and what quality means. Use deterministic checks
  for required fields, allowed destinations, data leakage and schema validity.
  Use human-calibrated rubrics for judgement. Record the evaluator model and
  rubric version, and investigate disagreement instead of treating a judge's
  score as ground truth.
- Evaluate the complete application path as well as isolated prompts. A tool
  response, retrieval failure or review bypass may be invisible in a model-only
  test. Verify remote effects using fixtures or an isolated destination; do not
  send real customer messages from an evaluation dataset.
- Set release thresholds before examining results: critical policy violations,
  per-case quality, latency and cost. Compare the candidate with an approved
  baseline and report regressions by category rather than only an average.
  Repeat uncertain cases to observe variability.
- Keep provider credentials out of configuration committed to source control.
  Set evaluation concurrency and spending limits; model and judge calls may
  incur charges. Restrict adversarial tests to systems you own or are authorized
  to test. Record whether responses were cached so the comparison is interpretable.
- Acceptance evidence should identify dataset revision, application revision,
  model configuration, failures and reviewed exceptions. A fixture-only harness
  checks the evaluation plumbing, not model quality. Use sanitized production
  failures to expand the dataset after an incident, then rerun the relevant
  cases before promoting the fix.

## Source links

- [promptfoo-2026-intro](https://www.promptfoo.dev/docs/intro/)
- [promptfoo-2026-assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/)
