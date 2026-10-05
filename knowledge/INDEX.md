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

## Planned topics

| Topic | Covers |
| --- | --- |
| 04 Guardrails and evaluation | Layered guardrails; evals; testing before launch; monitoring. |
| 05 Models and cost | Choosing models by evaluation; small vs large; open-weight; cost and latency. |
| 06 Tools, MCP and skills | Model Context Protocol; skills; system prompts; tool design. |
| 07 Platforms | n8n, Apache Airflow, Hermes Agent, Claude Cowork, Claude Code, hybrids. |
| 08 Deployment and data | Local vs cloud; privacy; company size and budget; regional availability. |
