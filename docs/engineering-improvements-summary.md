# Engineering improvements and evaluation progress

Updated October 12, 2026. This document covers the knowledge-base expansion,
recommendation evaluation, implementation shortlisting, delivery improvements,
and execution benchmarks completed in this workstream. Earlier committed work
is distinguished from the changes being committed with this summary.

## Checklist status

| Improvement | Status | Remaining work |
| --- | --- | --- |
| 1. Evaluate the guide | Evaluation machinery and source research implemented | Independent review remains incomplete; 14 manual checks were deferred by the owner. |
| 2. Shortlist suitable implementations | Implemented | Conservative catalog coverage; candidates are design recommendations, not automatically built alternatives. |
| 3. Benchmark implementations | Two live synthetic pilots completed | Representative user examples, real human effort, total operating cost, and process-crash recovery remain untested. |
| 4. Show evidence and limits | Labels and reports exist | Integrate benchmark evidence into the app without implying that every recommendation has been validated. |

## 1. Source-backed engineering knowledge

Added dedicated engineering sections for:

- **n8n:** data contracts, item linking, retries, failure handling, testing and safe external actions.
- **Apache Airflow:** data intervals, dependencies, retries, backfills, failure signals, security and operation.
- **Hermes:** tool/action boundaries, memory and skill review, unattended operation and recovery.
- **LangGraph:** state boundaries, persistence, replay, human review and deployment.
- **Testing and observability:** evaluation gates, traces, privacy and cost; Promptfoo and Langfuse guidance.

Connected this material to recommendation rules, generated starter-kit engineering
notes and knowledge retrieval. Added or expanded starter scaffolds and associated
checks. Local n8n and LangGraph smoke-test artifacts record their tested scope;
these are not evidence that every generated integration works in production.

Related application work includes multi-job process designs and handoffs,
editable draw.io exports, model/cost guidance and result-page refinements.
See [knowledge index](../knowledge/INDEX.md) and [project README](../README.md).

## 2. Evaluate recommendation quality

- Added 24 provisional synthetic business scenarios and a repeatable evaluation
  command: `npm run eval:guide`.
- Grade approach, platform fit, safeguards and unnecessary complexity. Accept
  suitable alternatives rather than treating one platform brand as the answer.
- Added seven source-backed cases: Bordr, Oversee, Adyen, Adobe, Remote, Kensho
  and Discord, with source links, reported facts, assumptions and provenance.
- Audited 37 original assumptions: 7 supported, 6 corrected, 10 partially
  supported and 14 unresolved. These categories are distinct from the 14 manual
  review checks.
- Added 44 single-field sensitivity probes and preserved earlier baselines.
- Last recorded results: 24/24 synthetic cases and 12/12 external structural
  checks passed. The external evaluation remains REVIEW_REQUIRED; passing the
  automated checks does not complete independent human review.

See [evaluation README](../evals/recommendations/README.md),
[assumption evidence](../evals/recommendations/assumption-evidence.md) and
[external findings](../evals/recommendations/external-findings.md).

## 3. Capture and preserve explicit requirements

Added an optional requirements question covering approval of every result,
embedded services, isolated generated-code execution and advanced data-asset
operations. Existing saved answers remain usable.

Rules now cap autonomy when approval is required, support developer-owned
embedded agents through LangGraph, and disclose sandbox implementation work and
catalog gaps for Dagster/dbt comparisons. Fixed external actions are prepared for
approval where required. A framework recommendation is not a implemented secure
sandbox or a production deployment.

## 4. Shortlist implementations

Added a separate implementation-shortlist section on the result page and a
constraint-filtering module. It produces at most two candidates, explains
tradeoffs and exclusions, and carries forward approval, hosting and safety
obligations. It may return one candidate or flag an unresolved requirement gap.

Supported comparisons include:

- n8n and Airflow for developer-owned scheduled fixed workflows.
- n8n agents and LangGraph for suitable developer-owned agent workflows.
- Claude and n8n agents for manually started or scheduled agents, subject to
  memory, embedded-service, sandbox and other requirement filters.

The primary architecture and starter kit remain the existing rules' design.
The shortlist does not automatically produce a second complete implementation,
execute competitors, or select a benchmark winner. Candidates are labelled
**recommended by rules**.

See [shortlist policy](../evals/recommendations/shortlist.md).

## 5. Require usable product delivery

Pending starter-kit improvements included in this commit strengthen the handoff:

- Generate a fixed DELIVERY.md contract and include it in component archives.
- Require a usable application or connected workflow with intake, progress,
  appropriate review and usable output. Installing a plugin or producing one
  result does not satisfy completion.
- Require a tested launch path, START-HERE.md and DELIVERY-REPORT.md with honest
  READY, DEMO ONLY or BLOCKED status.
- Require a real tested scheduler for scheduled designs and backend enforcement
  of protected actions. Start with labelled synthetic data, then verify live
  processing rather than passing canned output off as real processing.
- Align generated build instructions, AI kit-writing guidance and build-page
  copy. Validate that the delivery contract survives generation and downloads.
- Preserve the resume-app follow-up brief and build-page preview under `docs/`.

## 6. Local workflow benchmark: n8n versus Airflow

Ran five synthetic cases three times on each platform: 30 total executions.
Cases cover normal processing, duplicates, withheld approval, a committed write
whose response is lost, and persistent outage. The grader checks actual records
and write attempts, not just a completion message.

| Metric | n8n 1.107.4 | Airflow 3.1.0 |
| --- | --- | --- |
| Business tasks completed | 12/15 | 12/15 |
| Safe handling | 15/15 | 15/15 |
| Transient recovery | 3/3 | 3/3 |
| Median cold runtime | 0.99 s | 1.50 s |

Persistent outages deliberately remain incomplete business tasks even when
handled safely. No AI model was used. API spend was zero; total operating cost
and actual human intervention were not measured. The mock destination provides
idempotency. Local CLI and dag.test execution does not test production scheduling,
distributed workers, throughput or process-crash recovery.

Run `npm run benchmark:local`. See the [setup and limitations](../evals/benchmarks/README.md)
and [completed report](../outputs/benchmarks/2026-10-12T14-41-10.941Z/report.md).

## 7. Live AI-agent benchmark: n8n versus LangGraph

Ran real model/tool loops on four synthetic support cases, three repetitions per
platform: 24 completed trials. Cases cover eligible and ineligible refund
requests, temporary lookup failure, and a ticket attempting to bypass approval.
The grader checks the final structured response, saved proposal, required
research and attempted prohibited actions. No real refund or message is sent.

Both platforms used **gpt-6-luna**, temperature 0, reasoning effort `none`, a
512-token completion cap and at most eight model calls per trial. Reasoning is
disabled for Chat Completions tool-call compatibility. Initial prompts match;
n8n adds a JSON Schema declaration to the otherwise equivalent tool schema.

| Metric | n8n 1.107.4 | LangGraph 1.2.14 |
| --- | --- | --- |
| Successful trials | 12/12 | 12/12 |
| Transient recovery | 3/3 | 3/3 |
| Approval violations | 0 | 0 |
| Median cold runtime | 5.81 s | 4.32 s |
| API cost upper estimate | $0.00309 | $0.00312 |
| Draft proposals requiring review | 9 | 9 |

The earlier GPT-4.1 mini run was interrupted at the owner's request and excluded
from the Luna comparison. Budget accounting retains approximately $0.01049 in
recorded/estimated usage across all runs and a $0.45 reservation for the interrupted
request whose final usage is unknown. The combined $0.46049 remains below the
owner's $3 authorization. The reservation is a local budget safeguard, not a
confirmed provider charge.

API estimates conservatively price Luna input at the cache-write rate, without
cache-read discounts. They are not invoice-reconciled costs. Human review requests
are measured; real human time and total cost per successful result remain unknown.
The tiny synthetic sample does not establish a general platform winner.

Run `npm run benchmark:agents`. See [setup and budget rules](../evals/benchmarks/agents/README.md)
and the [completed Luna report](../outputs/agent-benchmarks/2026-10-12T18-15-00.281Z/report.md).

## Validation and evidence limits

- Last full application check: **238 tests across 24 files passed**, TypeScript
  checking passed, and the production build passed. The existing bundle-size
  advisory remains.
- The shortlist was browser-checked. Execution benchmarks ran against real local
  runtimes with isolated synthetic state and retained per-trial evidence.
- A post-run correction calculates even-sized median timings from the two middle
  values; recorded trial durations were not changed. The agent runner subsequently
  passed JavaScript syntax validation.
- This summary does not certify live customer connectors, general AI quality,
  deployment readiness, real labor costs or the 14 deferred manual checks.
- Benchmarks and setup failures are retained separately; incomplete runs are not
  included in completed comparison totals.

## Git history and remaining work

Earlier milestones already committed:

- `2af449e`: engineering knowledge, process workflows and associated support.
- `30e7300`: guide evaluation, source-backed evidence and explicit requirements.
- `8606485`: restored survey progress-bar spacing.

This summary accompanies the pending shortlist, usable-delivery and benchmark
work. The unrelated local launcher `kushim-system-link.html` stays outside this
commit. Python bytecode is excluded as a generated runtime artifact.

Next substantive work: expose scoped benchmark evidence in the app, expand to
representative user cases, measure real review effort and total operating cost,
and test restart/process-crash recovery. Resume independent case review when the
owner chooses to revisit the deferred items.
