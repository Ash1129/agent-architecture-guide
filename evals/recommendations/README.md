# Evaluate the recommendation guide

Run `npm run eval:guide` from the repository root. It writes a readable report
and machine-readable per-check results to `outputs/guide-eval/latest.md` and
`latest.json`. The command exits nonzero if the provisional gate fails.
`npm run check` also tests the same gate and the grader's negative controls.
No credentials, model calls, service accounts or running web server are needed.

## What this measures

The deterministic recommendation and its blueprint, after the user's answers
are known. It does not measure the AI interview's interpretation of the original
problem, an AI-drafted architecture, generated business logic, execution quality,
current vendor pricing or live platform performance. Those need separate suites.

The 24 synthetic scenarios in `cases.json` cover automation, AI workflows,
agents, specialists, upstream data, memory, provider restrictions, privacy and
human review. Each contains a business brief, explicit answers, acceptable
approaches/platforms, complexity ceilings and a rationale. Multiple acceptable
platforms are permitted. Expected results are authored in the dataset, never
produced by calling the recommendation rules or checking which rule IDs fired.

All cases are assistant-authored and provisional. The author had access to the
implementation, so this is an initial regression baseline, not a blinded or
independent validation. None is a held-out test set or a real customer benchmark.
No recommendation rules were changed to improve this first score.

## Test plan

| Area | Check type | Initial coverage target |
| --- | --- | --- |
| Approach | Scenario outcome | Fixed rules, bounded judgement, one agent and several roles |
| Tool suitability | Allowed alternatives, required/excluded tools, caveat presence | Current core platforms, data dependencies and developer availability |
| Safeguards | Model constraints, autonomy ceilings, graph traversal and tool gates | Restricted models, irreversible actions, review bypass and in-loop action approval |
| Complexity | Tool/specialist counts and no-AI requirements | Simple tasks must stay simple; developer availability alone must not force specialists |
| Grader reliability | Deliberately mutated outputs | Wrong platform, unnecessary AI/tools, missing gates, bypass paths and unsupported review status must fail |
| Risk consistency | Metamorphic test | Adding irreversible risk must never increase autonomy |

A caveat check only verifies disclosure, not that the proposed dependency
implementation is reliable. Graph checks verify represented review boundaries,
not an authenticated production approval system. Tool-count ceilings are an
initial complexity proxy; they do not estimate integration or maintenance work.

## Initial gate

- At least 90% of cases pass all applicable checks.
- At least 90% of checks pass within each dimension.
- Zero critical safeguard failures or recommendation-generation failures.

The thresholds are project policy, not confidence intervals or proven accuracy.
Results include source and dataset fingerprints, expected/observed values and
review status. The Git commit identifies the starting revision; the source hash
identifies evaluated working-tree code, which may contain uncommitted changes.
Passing software tests and passing this provisional rubric are distinct claims.

## Review and expand

1. Read each brief and confirm its encoded answers describe the same situation.
2. Approve or revise acceptable approaches and platforms with a domain reviewer.
   Record their name in `reviewer` and set `reviewStatus` to `reviewed` only after
   actual review. Do not relabel a failure just to make the suite pass.
3. Add sanitized real examples, particularly counterexamples and missing
   constraints. Keep a separate held-out set before tuning decisions to them.
4. Inspect individual failures and compare old/new reports when changing rules.
   Freeze dataset versions when comparing scores; changing expectations changes
   the benchmark. Preserve prior reports if a historical comparison is needed.
5. Add end-to-end AI interview/design evaluations only after defining stable
   expected outcomes and budgets. Measure actual business effects separately.

The outcome-based approach follows [Anthropic's agent evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).
This small deterministic suite uses the existing test tools; Promptfoo can later
exercise model-backed paths using the shared [evaluation guidance](../../knowledge/chunks/13-testing-and-observability/O01-evaluations-and-release-gates.md).

## Published business cases

Run `npm run eval:guide:external` for the separate seven-case source-backed
exploratory evaluation. Read [the findings](external-findings.md) and
[`external-cases.json`](external-cases.json) for direct source links, section
locators, reported facts, scoped tasks and provenance for every encoded answer.
All seven links were opened during the 2026-10-10 research pass. This command
runs offline and does not refresh link availability or verify customer claims.

Cases cover Bordr, Oversee, Adyen, Adobe, Remote, Kensho and Discord. User
acceptance of the source shortlist does not constitute independent review of
our input encodings or expected outcomes. Source-backed problems still require
assistant-authored adaptations; missing deployment, frequency and acceptance
criteria are explicitly marked as assumptions. Company-selected technology is
context only, never a correct-answer label. These are not held-out cases.

The report is written separately to `outputs/guide-eval/external/latest.md`
and `.json`; the latter includes full recommendations and blueprints for review.
Only broad approach, absence of unnecessary AI and the specified human review
boundary are machine-checked. Every case remains `REVIEW_REQUIRED`, including
those passing structural checks. Fourteen case-specific criteria need further
review/testing; they are not counted as passed. An exit code of zero means only
that structural checks pass, not that all case requirements are satisfied.
Failed structural checks return a nonzero exit code and remain in the report.

`npm run check` tests provenance validation and grader negative controls. It
does not require these exploratory cases to match the current implementation.
The original 24-case synthetic regression gate remains separate. No production
recommendation rules have been changed to fit the external cases.

### Assumption evidence and uncertainty

[Assumption evidence](assumption-evidence.md) and its JSON ledger account for all
37 fields originally marked as assumptions. The source registry records direct
links, section locators, access dates and scope. Dataset v2 corrects six values
and promotes seven supported mappings; the other 24 remain explicitly uncertain.
Privacy/hosting policy evidence is not an authorization to move data. Historical
case evidence does not automatically describe the company's current system.

The external runner records 44 one-field uncertainty probes separately from the
seven cases. Changes are compared across approach, main platform, selected tools,
autonomy and hosting; other output differences are not counted. The probes do
not change the scored checks or evaluate interactions among unknown fields.
The previous dataset/report is retained in `outputs/guide-eval/external/baseline-v1/`.

Dataset v3 adds explicit requirements for three published cases after the
questionnaire gained that capability. See the Step 2 section of the findings.
The guide's new constraints are development-set improvements, not independent
validation. Existing shared answers without requirements remain supported.
