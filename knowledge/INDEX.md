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

## 06 Tools, MCP and skills

| ID | Chunk | Summary |
| --- | --- | --- |
| T01 | [How an agent uses tools, and what tools cost](chunks/06-tools-mcp-and-skills/T01-how-agents-use-tools.md) | Client vs server tools; the model decides when to call; guessing missing values; tools cost tokens even unused. |
| T02 | [Designing tools an agent can use well](chunks/06-tools-mcp-and-skills/T02-designing-good-tools.md) | Fewer, consolidated tools; clear names; readable, short outputs; descriptions as onboarding notes; accuracy drops past 30–50 tools. |
| T03 | [What MCP is, and when it is the right connector](chunks/06-tools-mcp-and-skills/T03-what-mcp-is.md) | Host, client, server; tools vs resources vs prompts; 2026-07-28 spec changes; token cost at scale and code execution (150k to 2k). |
| T04 | [Connecting tools safely](chunks/06-tools-mcp-and-skills/T04-mcp-permissions-and-security.md) | MCP consent principles; person able to deny tool calls; annotations untrusted; local servers are installed software; least-privilege scopes. |
| T05 | [Skills - reusable playbooks loaded only when needed](chunks/06-tools-mcp-and-skills/T05-skills.md) | Progressive disclosure and token costs; where Skills work and how they're shared; security; authoring advice; site gotcha G9 overstated. |
| T06 | [System prompts and managing what the agent sees](chunks/06-tools-mcp-and-skills/T06-system-prompts-and-context.md) | Role, clarity, reasons, examples; the "right altitude"; confirm risky actions; context rot; compaction, notes, sub-agents. |

## Planned topics

| Topic | Covers |
| --- | --- |
| 07 Platforms | n8n, Apache Airflow, Hermes Agent, Claude Cowork, Claude Code, hybrids. |
| 08 Deployment and data | Local vs cloud; privacy; company size and budget; regional availability. |
