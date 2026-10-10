# Index

Start here. Find the chunk whose summary matches the question, then open only
that chunk. Format and rules: README.md. Sources: sources.md.

## 01 Foundations: what an agent is, and when to use one

| ID | Chunk | Summary |
| --- | --- | --- |
| F01 | [What counts as an agent](chunks/01-foundations/F01-what-counts-as-an-agent.md) | Workflow vs agent definitions (Anthropic, OpenAI, Databricks); what is not an agent; "who decides the next step?" test. |
| F02 | [Most real systems combine workflows and agents](chunks/01-foundations/F02-workflows-and-agents-combine.md) | Production systems mix both; predictability vs agency trade-off; hybrid n8n + agent. |
| F03 | [When an agent is worth it](chunks/01-foundations/F03-when-to-use-an-agent.md) | Deterministic-function test; simplest solution first; OpenAI's three signals; open-ended goals. |
| F04 | [The parts of an agent, and the harness](chunks/01-foundations/F04-anatomy-of-an-agent.md) | Model, tools, instructions; data/action/orchestration tools; harness building blocks; survey and CoALA modules. |
| F05 | [Start simple, and the evidence](chunks/01-foundations/F05-start-simple-the-evidence.md) | Anthropic's principles; simple baselines matched complex agents at far lower cost (Kapoor et al.); frameworks debate. |
| F06 | [The agent loop and stopping](chunks/01-foundations/F06-the-agent-loop-and-stopping.md) | ReAct results and error analysis; ground truth each step; stop conditions; hand back to a person. |
| F07 | [Context and common failures](chunks/01-foundations/F07-context-and-common-failures.md) | Context is the hard part; seven production failure modes; tool design advice. |

## 02 Patterns and multi-agent systems

| ID | Chunk | Summary |
| --- | --- | --- |
| P01 | [The five workflow patterns and the single-agent loop](chunks/02-patterns-and-multi-agent/P01-the-workflow-patterns.md) | Chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer with when-to-use; run loop exit conditions. |
| P02 | [Voting, checking and self-correction](chunks/02-patterns-and-multi-agent/P02-voting-checking-and-self-correction.md) | Self-consistency, Self-Refine and debate gains vs Huang et al.: self-checks without outside feedback are unreliable; checks need something real to check against. |
| P03 | [One agent or several](chunks/02-patterns-and-multi-agent/P03-one-agent-or-several.md) | Maximise one agent first; OpenAI's split signals; roles and context (team notes); 15× token cost; independence of subtasks decides. |
| P04 | [How several agents are arranged](chunks/02-patterns-and-multi-agent/P04-multi-agent-architectures.md) | Manager vs handoffs vs orchestrator-workers; central validation cuts error amplification from 17.2× to 4.4×. |
| P05 | [When several agents help or hurt](chunks/02-patterns-and-multi-agent/P05-when-multi-agent-helps-or-hurts.md) | +80.8% to −70% depending on task fit; 45% capability ceiling; tool-heavy and sequential tasks suffer; parallel research gains. |
| P06 | [How multi-agent systems fail](chunks/02-patterns-and-multi-agent/P06-how-multi-agent-systems-fail.md) | MAST: 14 failure modes in 3 categories with shares; fixes help but organisational design matters most. |

## 03 Autonomy and human oversight

| ID | Chunk | Summary |
| --- | --- | --- |
| A01 | [Autonomy is a design choice](chunks/03-autonomy-and-oversight/A01-autonomy-is-a-design-choice.md) | Five user-role levels (Feng et al.) mapped to the guide's four; risk rises with autonomy (Mitchell et al.); approve before high-stakes actions. |
| A02 | [When a person must step in](chunks/03-autonomy-and-oversight/A02-when-a-person-must-step-in.md) | Failure thresholds and high-risk actions; tool risk ratings; EU AI Act Art. 14 oversight and stop button; in-the-loop vs on-the-loop. |
| A03 | [The approval trap](chunks/03-autonomy-and-oversight/A03-the-approval-trap.md) | Automation bias: people follow wrong advice (RR 1.26); workload and trust make it worse; accountability, confidence display and training reduce it. |
| A04 | [Earning more autonomy over time](chunks/03-autonomy-and-oversight/A04-earning-more-autonomy.md) | Staged rollout: shadow, approve, widen per action type, recheck after changes; start with ~20 real cases. |

## 04 Guardrails and evaluation

| ID | Chunk | Summary |
| --- | --- | --- |
| G01 | [Guardrails come in layers](chunks/04-guardrails-and-evaluation/G01-layered-guardrails.md) | OpenAI's guardrail types and build order; tool risk ratings; OWASP excessive agency; least privilege enforced outside the LLM. |
| G02 | [Prompt injection and the lethal trifecta](chunks/04-guardrails-and-evaluation/G02-prompt-injection-and-the-lethal-trifecta.md) | Indirect injection (Greshake); OWASP LLM01 has no fool-proof fix; private data + untrusted content + outbound = data theft; AgentDojo. |
| G03 | [Designs that resist prompt injection](chunks/04-guardrails-and-evaluation/G03-designs-that-resist-injection.md) | Six patterns (action-selector, plan-then-execute, map-reduce, dual LLM, code-then-execute, context-minimisation); workflow-like designs are also more secure. |
| G04 | [Testing an agent before and after launch](chunks/04-guardrails-and-evaluation/G04-evaluating-agents.md) | 20–50 real tasks; code, model and human graders; capability vs regression; pass@k vs pass^k; LLM-judge 80% agreement and biases. |

## 05 Models and cost

| ID | Chunk | Summary |
| --- | --- | --- |
| M01 | [Choosing a model, and the current Claude lineup](chunks/05-models-and-cost/M01-choosing-a-model.md) | Capable-first then step down; efficiency-first vs capability-first; effort setting; lineup and prices as of 2026-10-05 (Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 4.5). |
| M02 | [Cutting cost without losing quality](chunks/05-models-and-cost/M02-cutting-cost.md) | Cascades (FrugalGPT, up to 98%), routing (RouteLLM, >2×), escalation; batch 50% off; prompt caching; agents use 4–15× tokens. |
| M03 | [Open-weight models](chunks/05-models-and-cost/M03-open-weight-models.md) | Open models ~4 months behind closed (Epoch); leading open models as of 2026-10-05; Hermes is model-agnostic; site examples are dated. |
| M04 | [What plans and models cost](chunks/05-models-and-cost/M04-plan-and-token-prices.md) | Claude plans and API prices (Haiku 5.5 now $0.10/$0.50); n8n Cloud plans by executions; DeepSeek and Kimi API prices; Hermes free (MIT). Read 2026-10-10. |

## 06 Tools, MCP and skills

| ID | Chunk | Summary |
| --- | --- | --- |
| T01 | [How an agent uses tools, and what tools cost](chunks/06-tools-mcp-and-skills/T01-how-agents-use-tools.md) | Client vs server tools; the model decides when to call; guessing missing values; tools cost tokens even unused. |
| T02 | [Designing tools an agent can use well](chunks/06-tools-mcp-and-skills/T02-designing-good-tools.md) | Fewer, consolidated tools; clear names; readable, short outputs; descriptions as onboarding notes; accuracy drops past 30–50 tools. |
| T03 | [What MCP is, and when it is the right connector](chunks/06-tools-mcp-and-skills/T03-what-mcp-is.md) | Host, client, server; tools vs resources vs prompts; 2026-07-28 spec changes; token cost at scale and code execution (150k to 2k). |
| T04 | [Connecting tools safely](chunks/06-tools-mcp-and-skills/T04-mcp-permissions-and-security.md) | MCP consent principles; person able to deny tool calls; annotations untrusted; local servers are installed software; least-privilege scopes. |
| T05 | [Skills - reusable playbooks loaded only when needed](chunks/06-tools-mcp-and-skills/T05-skills.md) | Progressive disclosure and token costs; where Skills work and how they're shared; security; authoring advice; site gotcha G9 overstated. |
| T06 | [System prompts and managing what the agent sees](chunks/06-tools-mcp-and-skills/T06-system-prompts-and-context.md) | Role, clarity, reasons, examples; the "right altitude"; confirm risky actions; context rot; compaction, notes, sub-agents. |

## 07 Platforms

| ID | Chunk | Summary |
| --- | --- | --- |
| L01 | [n8n](chunks/07-platforms/L01-n8n.md) | AI Agent node (Tools Agent); MCP client and server nodes; Wait node resumes on time, callback or form, not on data; 4 GB RAM for Docker Compose; Sustainable Use License is internal-use, not open source. |
| L02 | [Apache Airflow](chunks/07-platforms/L02-airflow.md) | Python workflows with a clear start and end; not for "clicking over coding"; asset-aware scheduling; 4 GB memory floor, production needs continuous tuning. |
| L03 | [Hermes Agent](chunks/07-platforms/L03-hermes-agent.md) | MIT, any model, seven backends; small memory; self-written Skills unreviewed by default; command approval modes; cron needs the gateway; Kumar's security advice and the "successor to OpenClaw" claim. |
| L04 | [Claude Cowork](chunks/07-platforms/L04-claude-cowork.md) | Now merged into one Claude app; runs in the cloud; scheduled tasks no longer need the computer on; memory shared with chat; Manual/Auto/Skip; admin and HIPAA limits; Pabani outdated. |
| L05 | [Claude Code](chunks/07-platforms/L05-claude-code.md) | Surfaces; CLAUDE.md, Skills, hooks, MCP, sub-agents; Routines vs desktop tasks; Agent SDK. |
| L06 | [Combining platforms](chunks/07-platforms/L06-combining-platforms.md) | MCP and Skills as portable joints; plugins; where scheduled work runs; n8n + agent hybrid; short chooser. |

## 08 Deployment and data

| ID | Chunk | Summary |
| --- | --- | --- |
| D01 | [Where Claude can be used, and where it processes data](chunks/08-deployment-and-data/D01-where-claude-is-available-and-processes-data.md) | 175 supported countries (not China, Hong Kong, Russia...); first-party API offers only US or global processing, US at 1.1×; regions via cloud partners. |
| D02 | [What Anthropic keeps, and the privacy arrangements available](chunks/08-deployment-and-data/D02-data-retention-and-privacy.md) | No training without permission; retention periods; ZDR scope (not the apps, Skills or Fable 5.1); HIPAA; flagged data up to 2 years. |
| D03 | [Local vs cloud - what each costs, and when your own hardware pays off](chunks/08-deployment-and-data/D03-local-vs-cloud-costs-and-hardware.md) | Capex vs per-token costs; GPU prices; break-even months by model size (Pan et al.) vs utilisation penalty of 17.5-36.3× (Patil); Anthropic spend limits and max_tokens. |
| D04 | [EU AI Act - which uses are high-risk, and from when](chunks/08-deployment-and-data/D04-eu-ai-act-high-risk.md) | Art. 6 routes and exemptions; Annex III's eight areas (hiring, credit, insurance, education...); Art. 113 dates, moved by the 2026 Digital Omnibus to 2 Dec 2027 (Annex III) and 2 Aug 2028 (Annex I). |

## 09 n8n engineering

Official documentation (tier C), with documented behavior separated from guide recommendations.

| ID | Chunk | Summary |
| --- | --- | --- |
| N01 | [Data contracts and item linking](chunks/09-n8n-engineering/N01-data-contracts-and-item-linking.md) | Item identity, expressions, merge semantics, typed sub-workflows and multi-record acceptance tests. |
| N02 | [Failure recovery and testing](chunks/09-n8n-engineering/N02-failure-recovery-and-testing.md) | Error workflows, bounded retries, API limits, pagination, response validation, realistic tests and execution retention. |
| N03 | [Safe external actions](chunks/09-n8n-engineering/N03-safe-external-actions.md) | Authenticated webhooks, credentials, tool-level approval, destination-specific idempotency and ambiguous outcomes. |

## 10 Apache Airflow engineering

Official documentation (tier C), reviewed against Airflow 3.3.2 and standard provider 1.20.0. Recommendations and acceptance tests are distinguished from documented behavior.

| ID | Chunk | Summary |
| --- | --- | --- |
| R01 | [Data intervals and dependencies](chunks/10-airflow-engineering/R01-data-intervals-and-dependencies.md) | Logical dates, asset updates, external sensors, task contracts, shared storage and XCom limits. |
| R02 | [Retries, backfills and failure signals](chunks/10-airflow-engineering/R02-retries-backfills-and-failure-signals.md) | Replay-safe outputs, bounded waits, catchup, historical reprocessing, failure propagation and callback testing. |
| R03 | [Testing, security and operation](chunks/10-airflow-engineering/R03-testing-security-and-operation.md) | Lightweight DAG parsing, public SDK, test layers, secrets, pools, deferrable operators and production checks. |

## 11 Hermes Agent engineering

Official documentation (tier C), with documented controls separated from engineering recommendations. Settings must be checked against the deployed release.

| ID | Chunk | Summary |
| --- | --- | --- |
| H01 | [Tool boundaries and safe actions](chunks/11-hermes-engineering/H01-tool-boundaries-and-actions.md) | Command approvals, MCP tool filters, profile boundaries, action contracts and ambiguous writes. |
| H02 | [Memory and skill review](chunks/11-hermes-engineering/H02-memory-and-skill-review.md) | Durable learning gates, provenance, staged changes, evaluation and versioned rollback. |
| H03 | [Unattended operation and recovery](chunks/11-hermes-engineering/H03-unattended-operation-and-recovery.md) | Cron health, finite budgets, missed runs, replay safety and session-store recovery. |

## 12 LangGraph engineering

Official documentation (tier C), with guide recommendations distinguished from documented behavior.

| ID | Chunk | Summary |
| --- | --- | --- |
| J01 | [LangGraph state contracts and agent boundaries](chunks/12-langgraph-engineering/J01-state-and-agent-boundaries.md) | Implementation boundaries and acceptance checks. |
| J02 | [LangGraph persistence and replay boundaries](chunks/12-langgraph-engineering/J02-persistence-and-replay.md) | Implementation boundaries and acceptance checks. |
| J03 | [LangGraph human review and deployment checks](chunks/12-langgraph-engineering/J03-human-review-and-deployment.md) | Implementation boundaries and acceptance checks. |

## 13 Testing and observability

Official documentation (tier C), with guide recommendations distinguished from documented behavior.

| ID | Chunk | Summary |
| --- | --- | --- |
| O01 | [Repeatable AI evaluations with Promptfoo](chunks/13-testing-and-observability/O01-evaluations-and-release-gates.md) | Implementation boundaries and acceptance checks. |
| O02 | [Tracing, privacy and cost with Langfuse](chunks/13-testing-and-observability/O02-tracing-privacy-and-cost.md) | Implementation boundaries and acceptance checks. |
