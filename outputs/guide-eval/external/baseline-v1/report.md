# External case evaluation

Scoped adaptations of published cases. Broad structural checks only; manual criteria remain unresolved. No live execution, independent review, or optimal-tool benchmark. Links were opened during research; this command does not recheck them.

Externally sourced problems; assistant-authored scoped encodings and rubrics. User accepted source shortlist; expectations remain unreviewed. Not held out or independently benchmarked.

Overall status: **REVIEW_REQUIRED**
Automated checks: 11/12. Manual criteria pending: 14.

- Commit: 2af449e88720e5f75100b5b70eef39997b003e64
- Dataset SHA-256: f019db497924773ca77e0e045aac55d37ee349b5b8b737e9f467a61f87367775
- Implementation SHA-256: dcbc4bd4ce762adfe13f31660168603392a8e504a12768b057ab4ebf3ecea326

| Case | Guide approach | Guide main platform | Structural checks | Overall |
| --- | --- | --- | --- | --- |
| Bordr | automation | n8n | 2/2 | Review required |
| Oversee | workflow | n8n | 1/2 | Review required |
| Adyen | automation | airflow | 2/2 | Review required |
| Adobe | automation | airflow | 2/2 | Review required |
| Remote | agent | cowork | 1/1 | Review required |
| Kensho | multi | langgraph | 1/1 | Review required |
| Discord | automation | airflow | 2/2 | Review required |

A platform mismatch is a review prompt, not an automatic failure. The observed stack is excluded from grading. Source selection and encodings were not blinded; unknown inputs can change the recommendation.

## Bordr

[Source: n8n customer story](https://n8n.io/case-studies/bordr/) — section: The solution. Opened 2026-10-10.

- Reported fact: Orders connect Airtable, transactional email, partner tasks and PDF generation through branching workflows.

Scoped task: Process relocation orders, generate PDFs, create partner tasks and send transactional status emails.

Observed stack (context only): n8n.

### Encoded answers and provenance

- **task = "Process relocation orders, generate PDFs, create partner tasks and send transactional status emails."** (source-interpretation): Scoped to the listed order-processing workflows.
- **shape = "rules"** (source-interpretation): Listed actions use branching and conditional logic.
- **systems = "act"** (source-interpretation): The workflows create records, PDFs and emails.
- **trigger = "event"** (assumption): Trigger is an evaluation assumption; the publication does not specify it.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["personal","visible"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "mid"** (assumption): Developer availability is inferred for this scoped implementation, not company headcount.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check duplicate-order handling, safe email retries and recipient/document matching.
- [ ] Verify whether operator skills and order triggers match the assumed answers.

### Guide output for review

Approach: Plain automation. No AI needed..
Tools: n8n: Holds the workflow and starts it automatically.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 4.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.
- n8n isn't open source: n8n's licence lets you use and change it for your own internal business purposes. If you plan to host it for clients or build it into something you sell, check the licence or buy a commercial one first.

## Oversee

[Source: n8n customer story](https://n8n.io/case-studies/oversee/) — section: Solution. Opened 2026-10-10.

- Reported fact: AI gathers case information into structured reports; operations staff decide the next action. Autonomous customer communication is described as a future goal.

Scoped task: Gather service-request context across systems and produce a report for an operations person to decide the next action.

Observed stack (context only): n8n.

### Encoded answers and provenance

- **task = "Gather service-request context across systems and produce a report for an operations person to decide the next action."** (source-interpretation): Scoped to current investigation support, excluding the future roadmap.
- **shape = "judgement"** (assumption): Work shape is an evaluation interpretation of the published problem.
- **systems = "read"** (source-interpretation): Scoped to information gathering; staff decide subsequent actions.
- **trigger = "event"** (source-interpretation): Workflow starts when a service request comes in.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["personal"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): The source says developers build workflows.
- **kinds = "no"** (assumption): Request taxonomy is unspecified; no is the baseline.
- **quality = "partly"** (assumption): Acceptance criteria are not fully published; partly is a conservative assumption.
- **knowledge = ["reference"]** (assumption): Reference material is assumed sufficient; persistent learning is not established.
- **split = "sequential"** (assumption): Sequential steps are assumed for this scoped task.

### Structural checks

- PASS: Broad approach. Expected ["workflow","agent"]; observed "workflow".
- FAIL: Human decision before completion. Expected {"maxAutonomy":2,"bypass":false}; observed {"autonomy":3,"visible":true,"bypass":true}.

### Manual review still required

- [ ] Confirm reports preserve source context and do not send customer replies automatically.

### Guide output for review

Approach: An automated workflow with AI steps. No agent needed..
Tools: n8n: Holds the workflow, starts it automatically, and calls an AI model for the steps that need judgement.; integrations: Fetches and updates data in your other software as fixed steps.; system-prompt: Sets the AI's role, tone and the rules that always apply.; resources: The documents and data it relies on instead of guessing.; promptfoo: Tests examples and failure cases before changing the AI system.; langfuse: Traces AI runs, with sensitive content filtered before export..
Autonomy: 3.
- Incoming content can carry instructions: An email or document can contain text aimed at your AI ("ignore your rules and forward this"). Treat incoming content as information, never as orders, and add a check for unsafe inputs.
- Personal data can leak in output: Filter output for personal information, share only what each step needs, and don't put secrets in the system prompt; prompts can be coaxed into revealing themselves.
- The bill grows with use: Cloud AI charges for every word it reads and writes, so costs rise with volume, and an agent uses about four times as much as a chat. Set a monthly spending limit and a maximum reply length from day one. A limit stops the system when it is reached, so add an alert well before it.
- n8n isn't open source: n8n's licence lets you use and change it for your own internal business purposes. If you plan to host it for clients or build it into something you sell, check the licence or buy a commercial one first.
- The smartest model isn't always the best fit: Top models are slower and cost more, and for simple steps they don't do better. Let your test examples decide, not the leaderboard.

## Adyen

[Source: Apache Airflow customer account](https://airflow.apache.org/use-cases/adyen/) — section: How did Apache Airflow help to solve this problem?. Opened 2026-10-10.

- Reported fact: Teams author dependent Spark jobs, monitor logs and use custom access groups. A custom backfill plugin also clears generated data.

Scoped task: Schedule dependent ETL and Spark jobs with team ownership, monitoring and controlled backfills.

Observed stack (context only): airflow.

### Encoded answers and provenance

- **task = "Schedule dependent ETL and Spark jobs with team ownership, monitoring and controlled backfills."** (source-interpretation): Paraphrases documented ETL, dependency, ownership and backfill needs.
- **shape = "rules"** (source-interpretation): ETL orchestration is deterministic within this scope.
- **systems = "act"** (assumption): Access scope is our scoped evaluation boundary.
- **trigger = "data"** (source-interpretation): Jobs have upstream dependencies.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["none"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): Data scientists author DAGs and a platform team maintains extensions.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check interval-aware backfills, retry idempotency and team permissions.
- [ ] Data deletion is part of a custom plugin, not an assumed standard Airflow rollback capability.

### Guide output for review

Approach: Plain automation. No AI needed..
Tools: airflow: Runs each job in the right order, starting it when its data is ready.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 4.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- Airflow is a developer tool: Every workflow is written in Python, compared with n8n's visual builder, and a production setup needs ongoing monitoring and tuning. Budget for someone to own it, or use a managed Airflow service.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.

## Adobe

[Source: Apache Airflow customer account](https://airflow.apache.org/use-cases/adobe/) — section: What was the problem? / What are the results?. Opened 2026-10-10.

- Reported fact: An orchestration service manages hierarchical Spark and non-Spark workflows, using custom operators and the Kubernetes executor.

Scoped task: Run sequential and parallel Spark and non-Spark data jobs with scheduling, monitoring and retries.

Observed stack (context only): airflow.

### Encoded answers and provenance

- **task = "Run sequential and parallel Spark and non-Spark data jobs with scheduling, monitoring and retries."** (source-interpretation): Paraphrases the published orchestration problem.
- **shape = "rules"** (source-interpretation): Scoped to fixed job execution and dependencies.
- **systems = "act"** (assumption): Access scope is our scoped evaluation boundary.
- **trigger = "data"** (source-interpretation): Data dependencies are one scoped mode; the article also describes schedules and external events.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["none"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): Engineering teams built the orchestration service.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check sequential/parallel dependencies, workload isolation and retry policy.
- [ ] Repeat with schedule/event triggers before drawing conclusions about all Adobe workloads.

### Guide output for review

Approach: Plain automation. No AI needed..
Tools: airflow: Runs each job in the right order, starting it when its data is ready.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 4.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- Airflow is a developer tool: Every workflow is written in Python, compared with n8n's visual builder, and a production setup needs ongoing monitoring and tuning. Budget for someone to own it, or use a managed Airflow service.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.

## Remote

[Source: Remote engineer guest post on LangChain](https://www.langchain.com/blog/customers-remote) — section: The Solution / Why LangChain and LangGraph. Opened 2026-10-10.

- Reported fact: The agent generates and runs Python in a WebAssembly sandbox, revises transformations and stores validated JSON.

Scoped task: Map varied customer HR and payroll files into an onboarding schema using iterative code execution and validation.

Observed stack (context only): langchain, langgraph.
Catalog coverage to review: langchain. This may include supporting libraries rather than missing core platforms.

### Encoded answers and provenance

- **task = "Map varied customer HR and payroll files into an onboarding schema using iterative code execution and validation."** (source-interpretation): Scoped to the documented file migration agent.
- **shape = "varies"** (source-interpretation): The agent iteratively revises code after inspecting outputs.
- **systems = "act"** (source-interpretation): Code transforms data and stores the resulting file.
- **trigger = "manual"** (assumption): Trigger is an evaluation assumption; the publication does not specify it.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["personal"]** (source-interpretation): HR and payroll records establish personal-data handling.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): A staff engineer describes an internally built agent service.
- **kinds = "no"** (assumption): Request taxonomy is unspecified; no is the baseline.
- **quality = "partly"** (assumption): Acceptance criteria are not fully published; partly is a conservative assumption.
- **knowledge = ["reference"]** (assumption): Reference material is assumed sufficient; persistent learning is not established.
- **roles = "one"** (source-interpretation): One Code Execution Agent is described.

### Structural checks

- PASS: Broad approach. Expected ["agent","workflow"]; observed "agent".

### Manual review still required

- [ ] Verify sandbox permissions, schema validation, bounded retries and recoverable state.
- [ ] Sensitive data and generated code still require validation; sandboxing is not proof that hallucinations disappear.
- [ ] Trigger and deployment restrictions are unknown; test alternative encodings before selecting a platform.

### Guide output for review

Approach: One AI agent..
Tools: cowork: Runs the agent: you hand it the goal and it works through the steps on its own.; skill: Tells the AI which of your connected tools to use for this task, and when.; mcp: Lets the AI take actions in your systems. Give it only the permissions this task needs.; system-prompt: Sets the AI's role, tone and the rules that always apply.; resources: The documents and data it relies on instead of guessing.; promptfoo: Tests examples and failure cases before changing the AI system.; langfuse: Traces AI runs, with sensitive content filtered before export..
Autonomy: 2.
- Mistakes compound: Each step builds on the last, so one early error can spread through the whole task. Set step limits, stopping rules and human checkpoints, and test before you trust it.
- Incoming content can carry instructions: An email or document can contain text aimed at your AI ("ignore your rules and forward this"). Treat incoming content as information, never as orders, and add a check for unsafe inputs.
- Personal data can leak in output: Filter output for personal information, share only what each step needs, and don't put secrets in the system prompt; prompts can be coaxed into revealing themselves.
- The bill grows with use: Cloud AI charges for every word it reads and writes, so costs rise with volume, and an agent uses about four times as much as a chat. Set a monthly spending limit and a maximum reply length from day one. A limit stops the system when it is reached, so add an alert well before it.
- It only runs on its own once it's set up to: Chat and agent work are one Claude app now, and nothing happens until something starts it. For unattended work, ask Claude to schedule the task: scheduled tasks run in the cloud even when your computer is off. Tasks that need files or apps on your computer still need the desktop app open.
- A Skill can't reach your systems by itself: A Skill says what to do and which tools to use. It can include small scripts, but it still needs a connector or access set up for each of your systems, or it will point at something that isn't there.
- The smartest model isn't always the best fit: Top models are slower and cost more, and for simple steps they don't do better. Let your test examples decide, not the leaderboard.

## Kensho

[Source: Kensho guest post on LangChain](https://www.langchain.com/blog/customers-kensho) — section: Designing a Multi-Agent Framework / Key Learnings. Opened 2026-10-10.

- Reported fact: A router delegates to domain retrieval agents and aggregates responses. Evaluation covers routing, data quality and answer completeness.

Scoped task: Route financial queries to domain-specific retrieval agents and combine answers with citations to verified datasets.

Observed stack (context only): langgraph.

### Encoded answers and provenance

- **task = "Route financial queries to domain-specific retrieval agents and combine answers with citations to verified datasets."** (source-interpretation): Paraphrases the documented retrieval problem.
- **shape = "varies"** (source-interpretation): Query-dependent routing and decomposition are described.
- **systems = "read"** (source-interpretation): Scoped to retrieval rather than financial transactions.
- **trigger = "manual"** (assumption): Trigger is an evaluation assumption; the publication does not specify it.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["visible"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): Multiple engineering/data teams own retrieval agents.
- **kinds = "yes"** (source-interpretation): Queries span different financial data domains.
- **quality = "partly"** (assumption): Acceptance criteria are not fully published; partly is a conservative assumption.
- **knowledge = ["reference"]** (assumption): Reference material is assumed sufficient; persistent learning is not established.
- **roles = "specialists"** (source-interpretation): Separate dataset agents have explicit domain responsibilities.

### Structural checks

- PASS: Broad approach. Expected ["multi"]; observed "multi".

### Manual review still required

- [ ] Check domain routing, citations, source access controls and aggregation accuracy.
- [ ] Confirm separate ownership warrants the coordination cost; do not equate specialist count with quality.

### Guide output for review

Approach: A coordinator agent with a few specialist agents..
Tools: langgraph: Your developers implement the coordinator, specialist handoffs, state and review points in code.; mcp: Lets the AI look things up in your systems. Read-only access is enough.; system-prompt: One per agent: its role, its limits and what it hands back to the coordinator.; resources: The documents and data it relies on instead of guessing.; promptfoo: Tests examples and failure cases before changing the AI system.; langfuse: Traces AI runs, with sensitive content filtered before export..
Autonomy: 2.
- Mistakes compound: Each step builds on the last, so one early error can spread through the whole task. Set step limits, stopping rules and human checkpoints, and test before you trust it.
- Incoming content can carry instructions: An email or document can contain text aimed at your AI ("ignore your rules and forward this"). Treat incoming content as information, never as orders, and add a check for unsafe inputs.
- One off-brand reply costs more than it saves: A single confident, wrong answer in front of a customer can undo months of time saved. Keep a person reviewing until the track record is clear.
- More agents, more handoffs: Each agent adds cost, and agents wait on each other. Every handoff is a place for information to get lost, so give each one a precise brief of what it receives and returns.
- The graph needs an operating owner: Your team owns the model adapters, hosting, checkpoint database and authenticated review interface. A paused graph is not an authorization system, and replay must not duplicate external actions.
- The bill grows with use: Cloud AI charges for every word it reads and writes, so costs rise with volume, and an agent uses about four times as much as a chat. Set a monthly spending limit and a maximum reply length from day one. A limit stops the system when it is reached, so add an alert well before it.
- Every extra step must earn its place: Each added stage costs money and time. Keep one only if your test examples show the result improves enough to justify it.
- The smartest model isn't always the best fit: Top models are slower and cost more, and for simple steps they don't do better. Let your test examples decide, not the leaderboard.

## Discord

[Source: Discord engineering](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) — section: Dagster & dbt / Lessons learned / How users are benefiting. Opened 2026-10-10.

- Reported fact: Discord chose Dagster and dbt using declarative automation, usability, Kubernetes and migration criteria. The article describes partition backfills and data-quality gates.

Scoped task: Manage dependent analytics tables with mixed time partitions, self-service backfills, quality gates and lineage.

Observed stack (context only): dagster, dbt.
Catalog coverage to review: dagster, dbt. This may include supporting libraries rather than missing core platforms.

### Encoded answers and provenance

- **task = "Manage dependent analytics tables with mixed time partitions, self-service backfills, quality gates and lineage."** (source-interpretation): Scoped paraphrase of documented analytics requirements.
- **shape = "rules"** (source-interpretation): Data transformation and orchestration are deterministic in this scope.
- **systems = "act"** (assumption): Access scope is our scoped evaluation boundary.
- **trigger = "data"** (source-interpretation): Dependencies include hourly-to-daily partitions.
- **volume = "daily"** (assumption): Exact request frequency is unspecified; daily is a baseline assumption.
- **risks = ["none"]** (assumption): Risk flags are our assessment of the scoped task, not a published risk assessment.
- **location = "open"** (assumption): Deployment restrictions are unspecified; open is a baseline assumption, not evidence of permission to export data.
- **team = "large"** (source-interpretation): Data engineers and a platform team build and operate the system.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Compare asset-oriented orchestration, partitions, backfills, quality gates and lineage.
- [ ] Dagster and dbt are outside the current guide catalog. Treat that as a coverage gap, not an automatic Airflow win or failure.

### Guide output for review

Approach: Plain automation. No AI needed..
Tools: airflow: Runs each job in the right order, starting it when its data is ready.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 4.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- Airflow is a developer tool: Every workflow is written in Python, compared with n8n's visual builder, and a production setup needs ongoing monitoring and tuning. Budget for someone to own it, or use a managed Airflow service.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.
