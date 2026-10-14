# External case evaluation

Scoped adaptations of published cases. Broad structural checks only; manual criteria remain unresolved. No live execution, independent review, or optimal-tool benchmark. Links were opened during research; this command does not recheck them.

Externally sourced problems; assistant-authored scoped encodings and rubrics. User accepted source shortlist; expectations remain unreviewed. Not held out or independently benchmarked.

Overall status: **REVIEW_REQUIRED**
Automated checks: 12/12. Manual criteria pending: 14.

- Assumption evidence: [all 37 entries](../../../evals/recommendations/assumption-evidence.md)
- Evidence results: {"partial":10,"unresolved":14,"supported":7,"corrected":6}
- One-field uncertainty variants: 44; changed decisions: 14. These are hypothetical probes, not additional customer cases.
- Commit: 2af449e88720e5f75100b5b70eef39997b003e64
- Dataset SHA-256: c3566e0db5639cb78d4558bf6cc1aeeedb331f507902709d97af9c1aa62dec99
- Implementation SHA-256: c677b20d1b7eed4adfca1cecf41a8517b005c282bea5db69bc1e67b3784785d8

| Case | Guide approach | Guide main platform | Structural checks | Overall |
| --- | --- | --- | --- | --- |
| Bordr | automation | n8n | 2/2 | Review required |
| Oversee | workflow | n8n | 2/2 | Review required |
| Adyen | automation | airflow | 2/2 | Review required |
| Adobe | automation | airflow | 2/2 | Review required |
| Remote | agent | langgraph | 1/1 | Review required |
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
- **trigger = "event"** (assumption): Order and document status changes drive the described business process. The exact trigger mechanism is not stated; events and polling schedules remain plausible. [Bordr original case](https://n8n.io/case-studies/bordr/)
- **volume = "daily"** (assumption): The source reports growing order demand, without executions per day. Revenue is not run volume. The retained daily value means dozens/day and is only hypothetical. [Bordr original case](https://n8n.io/case-studies/bordr/)
- **risks = ["personal","visible"]** (source-interpretation): Identity documents and customer emails support personal and visible flags. This is an engineering interpretation, not an exhaustive risk assessment. [Bordr required documents](https://support.bordr.com/article/27-what-documents-do-i-need-to-apply-for-a-nif) [Bordr original case](https://n8n.io/case-studies/bordr/)
- **location = "open"** (assumption): Reviewed the case and service privacy policy; neither establishes unrestricted workflow deployment. Third-party apps do not establish permission to use arbitrary hosting or model providers. [Bordr original case](https://n8n.io/case-studies/bordr/) [Bordr privacy policy](https://bordr.com/privacy-policy)
- **team = "mid"** (assumption): The founder ran a web design business and built multi-step integrations. This suggests technical comfort; the exact mid-level operator capability is not verified. [Bordr original case](https://n8n.io/case-studies/bordr/)

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check duplicate-order handling, safe email retries and recipient/document matching.
- [ ] Verify whether operator skills and order triggers match the assumed answers.

### One-field sensitivity probes

- trigger: "event" → "schedule". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. The exact trigger mechanism is not stated; events and polling schedules remain plausible.
- trigger: "event" → "manual". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. The exact trigger mechanism is not stated; events and polling schedules remain plausible.
- volume: "daily" → "occasional". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. Revenue is not run volume. The retained daily value means dozens/day and is only hypothetical.
- volume: "daily" → "high". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. Revenue is not run volume. The retained daily value means dozens/day and is only hypothetical.
- location: "open" → "residency". CHANGED: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"In-region cloud","tools":["n8n","integrations"]}. Third-party apps do not establish permission to use arbitrary hosting or model providers.
- location: "open" → "independence". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. Third-party apps do not establish permission to use arbitrary hosting or model providers.
- team: "mid" → "small". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. This suggests technical comfort; the exact mid-level operator capability is not verified.
- team: "mid" → "large". Same decision summary: {"approach":"automation","core":["n8n"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["n8n","integrations"]}. This suggests technical comfort; the exact mid-level operator capability is not verified.

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
- **shape = "judgement"** (source-interpretation): The scoped workflow retrieves context and uses AI to assemble a report for staff. Judgement is a reasonable mapping of that bounded workflow; it is not the entire support process. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **systems = "read"** (source-interpretation): Scoped to information gathering; staff decide subsequent actions.
- **trigger = "event"** (source-interpretation): Workflow starts when a service request comes in.
- **volume = "daily"** (assumption): Day-to-day use is reported, but not the count of investigation runs. Daily use does not prove dozens/day. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **risks = ["personal"]** (source-interpretation): Support records include identity and contact information, supporting the personal flag. Exact fields accessible to the n8n workflow are not documented. [Oversee privacy policy](https://oversee.biz/privacy-policy/) [Oversee original case](https://n8n.io/case-studies/oversee/)
- **location = "open"** (assumption): The service policy covers handling of customer information. It does not specify permissible n8n hosting or model processing locations. [Oversee privacy policy](https://oversee.biz/privacy-policy/) [Oversee original case](https://n8n.io/case-studies/oversee/)
- **team = "large"** (source-interpretation): The source says developers build workflows.
- **kinds = "no"** (assumption): The case describes investigation/reporting without a support request taxonomy. No is an unverified simplification, not proof that routing is unnecessary. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **quality = "partly"** (assumption): Reports assemble case information, but a report acceptance rubric is unpublished. Partly means subjective quality in the UI. Publication silence does not establish subjectivity; retain only as a sensitivity baseline. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **knowledge = ["reference"]** (assumption): The workflow consults a case database and historical context. Reference inputs are supported; reference-only sufficiency and absence of learned memory are not established. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **split = "sequential"** (assumption): Context collection logically precedes delivery of the structured report. The article does not rule out parallel retrieval; sequential is a top-level abstraction. [Oversee original case](https://n8n.io/case-studies/oversee/)
- **requirements = ["approval"]** (source-interpretation): Scope ends at the human decision on the prepared investigation report, as described in the source. Preparation may run automatically; release/action requires approval. [Oversee original case](https://n8n.io/case-studies/oversee/)

### Structural checks

- PASS: Broad approach. Expected ["workflow","agent"]; observed "workflow".
- PASS: Human decision before completion. Expected {"maxAutonomy":2,"bypass":false}; observed {"autonomy":2,"visible":true,"bypass":false}.

### Manual review still required

- [ ] Confirm reports preserve source context and do not send customer replies automatically.

### One-field sensitivity probes

- volume: "daily" → "occasional". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Daily use does not prove dozens/day.
- volume: "daily" → "high". CHANGED: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud now, local for the steady bulk","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Daily use does not prove dozens/day.
- location: "open" → "residency". CHANGED: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Local or self-hosted","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. It does not specify permissible n8n hosting or model processing locations.
- location: "open" → "independence". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. It does not specify permissible n8n hosting or model processing locations.
- kinds: "no" → "yes". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. No is an unverified simplification, not proof that routing is unnecessary.
- quality: "partly" → "clear". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Partly means subjective quality in the UI. Publication silence does not establish subjectivity; retain only as a sensitivity baseline.
- quality: "partly" → "no". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Partly means subjective quality in the UI. Publication silence does not establish subjectivity; retain only as a sensitivity baseline.
- knowledge: ["reference"] → ["reference","playbook"]. Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Reference inputs are supported; reference-only sufficiency and absence of learned memory are not established.
- knowledge: ["reference"] → ["reference","memory"]. Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. Reference inputs are supported; reference-only sufficiency and absence of learned memory are not established.
- split: "sequential" → "sections". Same decision summary: {"approach":"workflow","core":["n8n"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["n8n","integrations","system-prompt","resources","promptfoo","langfuse"]}. The article does not rule out parallel retrieval; sequential is a top-level abstraction.

### Guide output for review

Approach: An automated workflow with AI steps. No agent needed..
Tools: n8n: Holds the workflow, starts it automatically, and calls an AI model for the steps that need judgement.; integrations: Fetches and updates data in your other software as fixed steps.; system-prompt: Sets the AI's role, tone and the rules that always apply.; resources: The documents and data it relies on instead of guessing.; promptfoo: Tests examples and failure cases before changing the AI system.; langfuse: Traces AI runs, with sensitive content filtered before export..
Autonomy: 2.
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
- **systems = "act"** (source-interpretation): Jobs generate data and the custom backfill plugin clears generated data. Act describes writes and deletions, not just reads. [Adyen original case](https://airflow.apache.org/use-cases/adyen/)
- **trigger = "data"** (source-interpretation): Jobs have upstream dependencies.
- **volume = "high"** (source-interpretation): Thousands of regularly executing tasks support high aggregate orchestration volume. This mapping covers the described fleet, not the frequency of any single DAG. [Adyen journey to reliability](https://www.adyen.com/knowledge-hub/apache-airflow-at-adyen)
- **risks = ["personal","visible","irreversible"]** (source-interpretation): Merchant-facing payment reports and destructive custom backfills support visible, confidential-data and costly-error risks. Flags are our interpretation of the scoped fleet; they do not imply every task performs a payment. [Adyen journey to reliability](https://www.adyen.com/knowledge-hub/apache-airflow-at-adyen) [Adyen original case](https://airflow.apache.org/use-cases/adyen/)
- **location = "residency"** (source-interpretation): The platform lineage required on-premise operation; infrastructure policy describes company-managed servers and payment-data locations. Residency is the closest available encoding of controlled deployment. Historical evidence and wider policy do not specify every current Airflow DAG. [Adyen data science platform](https://www.adyen.com/knowledge-hub/building-our-data-science-platform-with-spark-and-jupyter) [Adyen infrastructure](https://www.adyen.com/en_AU/infrastructure)
- **team = "large"** (source-interpretation): Data scientists author DAGs and a platform team maintains extensions.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check interval-aware backfills, retry idempotency and team permissions.
- [ ] Data deletion is part of a custom plugin, not an assumed standard Airflow rollback capability.

### One-field sensitivity probes


### Guide output for review

Approach: Plain automation. No AI needed..
Tools: airflow: Runs each job in the right order, starting it when its data is ready.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 3.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- Airflow is a developer tool: Every workflow is written in Python, compared with n8n's visual builder, and a production setup needs ongoing monitoring and tuning. Budget for someone to own it, or use a managed Airflow service.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.
- Local is cheaper only once it's busy: Your own hardware has a large upfront cost and needs looking after. It pays back through high, steady volume, not occasional use: idle hardware can cost more per task than the cloud.

## Adobe

[Source: Apache Airflow customer account](https://airflow.apache.org/use-cases/adobe/) — section: What was the problem? / What are the results?. Opened 2026-10-10.

- Reported fact: An orchestration service manages hierarchical Spark and non-Spark workflows, using custom operators and the Kubernetes executor.

Scoped task: Run sequential and parallel Spark and non-Spark data jobs with scheduling, monitoring and retries.

Observed stack (context only): airflow.

### Encoded answers and provenance

- **task = "Run sequential and parallel Spark and non-Spark data jobs with scheduling, monitoring and retries."** (source-interpretation): Paraphrases the published orchestration problem.
- **shape = "rules"** (source-interpretation): Scoped to fixed job execution and dependencies.
- **systems = "act"** (source-interpretation): The service creates workflow files, updates metadata and launches jobs. These are write/execute operations. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b)
- **trigger = "data"** (source-interpretation): Data dependencies are one scoped mode; the article also describes schedules and external events.
- **volume = "daily"** (assumption): The engineering account explicitly describes varying frequency and concurrency. Concurrent task capacity does not prove a daily execution count for this scoped workload. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b)
- **risks = ["none"]** (assumption): Authentication, authorization and workload isolation are documented. These controls do not establish that all outputs are internal/easy to fix; none remains an unverified baseline. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b)
- **location = "open"** (assumption): The historical service runs on Azure with separated service clusters. Observed cloud deployment does not prove unrestricted deployment permission. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b)
- **team = "large"** (source-interpretation): Engineering teams built the orchestration service.

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Check sequential/parallel dependencies, workload isolation and retry policy.
- [ ] Repeat with schedule/event triggers before drawing conclusions about all Adobe workloads.

### One-field sensitivity probes

- volume: "daily" → "occasional". Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. Concurrent task capacity does not prove a daily execution count for this scoped workload.
- volume: "daily" → "high". Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. Concurrent task capacity does not prove a daily execution count for this scoped workload.
- risks: ["none"] → ["personal"]. Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. These controls do not establish that all outputs are internal/easy to fix; none remains an unverified baseline.
- risks: ["none"] → ["irreversible"]. CHANGED: {"approach":"automation","core":["airflow"],"autonomy":3,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. These controls do not establish that all outputs are internal/easy to fix; none remains an unverified baseline.
- risks: ["none"] → ["personal","irreversible"]. CHANGED: {"approach":"automation","core":["airflow"],"autonomy":3,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. These controls do not establish that all outputs are internal/easy to fix; none remains an unverified baseline.
- location: "open" → "residency". CHANGED: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Local or self-hosted","tools":["airflow","integrations"]}. Observed cloud deployment does not prove unrestricted deployment permission.
- location: "open" → "independence". Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. Observed cloud deployment does not prove unrestricted deployment permission.

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
- **trigger = "manual"** (assumption): Customers upload files and staff supply them to the migration agent. This does not settle whether execution begins with a manual request or an upload event. [Remote original case](https://www.langchain.com/blog/customers-remote)
- **volume = "daily"** (assumption): Customer and file counts are described without migration executions/day. Thousands of customers is not daily run volume. [Remote original case](https://www.langchain.com/blog/customers-remote)
- **risks = ["personal"]** (source-interpretation): HR and payroll records establish personal-data handling.
- **location = "open"** (assumption): The company describes governed third-party AI use and secure migration storage. Policy does not identify migration-specific locations or permit arbitrary providers. [Remote privacy policy](https://remote.com/policy/privacy-policy) [Remote original case](https://www.langchain.com/blog/customers-remote)
- **team = "large"** (source-interpretation): A staff engineer describes an internally built agent service.
- **kinds = "no"** (assumption): The scoped goal is one migration outcome across CSV, Excel and SQL formats. Different formats may require routed parsing; a single goal does not prove one handling path. [Remote original case](https://www.langchain.com/blog/customers-remote)
- **quality = "clear"** (source-interpretation): An explicit destination schema and validated JSON support checklist-based acceptance. Schema validity alone does not prove semantic correctness; field/value reconciliation still needs testing. [Remote original case](https://www.langchain.com/blog/customers-remote)
- **knowledge = ["reference"]** (assumption): The target onboarding schema supplies concrete reference material. Published details do not establish whether reference alone suffices or additional playbooks are used. [Remote original case](https://www.langchain.com/blog/customers-remote)
- **roles = "one"** (source-interpretation): One Code Execution Agent is described.
- **requirements = ["embedded","sandbox"]** (source-interpretation): The publication describes an agent within an AI service and WebAssembly sandboxed Python execution. [Remote original case](https://www.langchain.com/blog/customers-remote)

### Structural checks

- PASS: Broad approach. Expected ["agent","workflow"]; observed "agent".

### Manual review still required

- [ ] Verify sandbox permissions, schema validation, bounded retries and recoverable state.
- [ ] Sensitive data and generated code still require validation; sandboxing is not proof that hallucinations disappear.
- [ ] Trigger and deployment restrictions are unknown; test alternative encodings before selecting a platform.

### One-field sensitivity probes

- trigger: "manual" → "event". Same decision summary: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. This does not settle whether execution begins with a manual request or an upload event.
- volume: "daily" → "occasional". Same decision summary: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Thousands of customers is not daily run volume.
- volume: "daily" → "high". CHANGED: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud now, local for the steady bulk","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Thousands of customers is not daily run volume.
- location: "open" → "residency". CHANGED: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Local or self-hosted","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Policy does not identify migration-specific locations or permit arbitrary providers.
- location: "open" → "independence". Same decision summary: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Policy does not identify migration-specific locations or permit arbitrary providers.
- kinds: "no" → "yes". Same decision summary: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Different formats may require routed parsing; a single goal does not prove one handling path.
- knowledge: ["reference"] → ["reference","playbook"]. Same decision summary: {"approach":"agent","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Published details do not establish whether reference alone suffices or additional playbooks are used.

### Guide output for review

Approach: One AI agent..
Tools: langgraph: Developers implement the agent as a service with explicit state, recovery and controlled tool execution.; mcp: Lets the AI take actions in your systems. Give it only the permissions this task needs.; system-prompt: Sets the AI's role, tone and the rules that always apply.; resources: The documents and data it relies on instead of guessing.; promptfoo: Tests examples and failure cases before changing the AI system.; langfuse: Traces AI runs, with sensitive content filtered before export..
Autonomy: 2.
- Mistakes compound: Each step builds on the last, so one early error can spread through the whole task. Set step limits, stopping rules and human checkpoints, and test before you trust it.
- Design the execution boundary: A framework alone does not provide a secure sandbox. Define authentication, per-request isolation, persistent recovery state, schema and value validation, timeouts and retry limits. For generated code, restrict filesystem and network access, keep credentials outside the sandbox and limit compute. The starter does not implement these production controls.
- Incoming content can carry instructions: An email or document can contain text aimed at your AI ("ignore your rules and forward this"). Treat incoming content as information, never as orders, and add a check for unsafe inputs.
- Personal data can leak in output: Filter output for personal information, share only what each step needs, and don't put secrets in the system prompt; prompts can be coaxed into revealing themselves.
- The graph needs an operating owner: Your team owns the model adapters, hosting, checkpoint database and authenticated review interface. A paused graph is not an authorization system, and replay must not duplicate external actions.
- The bill grows with use: Cloud AI charges for every word it reads and writes, so costs rise with volume, and an agent uses about four times as much as a chat. Set a monthly spending limit and a maximum reply length from day one. A limit stops the system when it is reached, so add an alert well before it.
- Every extra step must earn its place: Each added stage costs money and time. Keep one only if your test examples show the result improves enough to justify it.
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
- **trigger = "manual"** (assumption): Interactive and service-account API access are both documented. Manual is one scenario; calling applications can trigger retrieval automatically. [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide) [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval)
- **volume = "daily"** (assumption): The articles/API guide do not publish absolute query executions per day. Enterprise scale and API availability are not traffic measurements. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval) [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide)
- **risks = ["visible"]** (source-interpretation): Clients receive citation-backed financial answers, supporting visible output. The flag is not an exhaustive characterization of data licensing or confidentiality. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval)
- **location = "open"** (assumption): The API requires authentication and documents controlled dataset access. Access control does not establish geographic hosting or provider constraints. [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide)
- **team = "large"** (source-interpretation): Multiple engineering/data teams own retrieval agents.
- **kinds = "yes"** (source-interpretation): Queries span different financial data domains.
- **quality = "clear"** (source-interpretation): Routing, exact-match retrieval and completeness are explicitly evaluated. That supports clear criteria; it does not prove complete coverage or perfect reliability. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval)
- **knowledge = ["reference"]** (assumption): Verified datasets are essential retrieval references. The publications do not establish reference-only sufficiency or rule out additional playbooks. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval) [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide)
- **roles = "specialists"** (source-interpretation): Separate dataset agents have explicit domain responsibilities.

### Structural checks

- PASS: Broad approach. Expected ["multi"]; observed "multi".

### Manual review still required

- [ ] Check domain routing, citations, source access controls and aggregation accuracy.
- [ ] Confirm separate ownership warrants the coordination cost; do not equate specialist count with quality.

### One-field sensitivity probes

- trigger: "manual" → "event". Same decision summary: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Manual is one scenario; calling applications can trigger retrieval automatically.
- volume: "daily" → "occasional". Same decision summary: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Enterprise scale and API availability are not traffic measurements.
- volume: "daily" → "high". CHANGED: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Cloud now, local for the steady bulk","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Enterprise scale and API availability are not traffic measurements.
- location: "open" → "residency". CHANGED: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Local or self-hosted","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Access control does not establish geographic hosting or provider constraints.
- location: "open" → "independence". Same decision summary: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. Access control does not establish geographic hosting or provider constraints.
- knowledge: ["reference"] → ["reference","playbook"]. Same decision summary: {"approach":"multi","core":["langgraph"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["langgraph","mcp","system-prompt","resources","promptfoo","langfuse"]}. The publications do not establish reference-only sufficiency or rule out additional playbooks.
- knowledge: ["reference"] → ["reference","memory"]. CHANGED: {"approach":"multi","core":["hermes"],"autonomy":2,"hosting":"Cloud, pay as you go","tools":["hermes","skill","mcp","system-prompt","resources","promptfoo","langfuse"]}. The publications do not establish reference-only sufficiency or rule out additional playbooks.

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
- **systems = "act"** (source-interpretation): Table materializations and production merges write derived data. Act is appropriate for the scoped data operations. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)
- **trigger = "data"** (source-interpretation): Dependencies include hourly-to-daily partitions.
- **volume = "high"** (source-interpretation): The article reports about 4,000 daily materializations. High applies to the described aggregate system, not necessarily one table. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)
- **risks = ["none"]** (assumption): The article describes production merge races and consistency-sensitive backfills. None is not supported. Precise cost/reversibility is unknown, so compare costly-error and confidential-data scenarios. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)
- **location = "open"** (assumption): The system uses Kubernetes, BigQuery and Dagster hybrid cloud. Those choices do not disclose all location restrictions; cloud use is not unrestricted permission. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)
- **team = "large"** (source-interpretation): Data engineers and a platform team build and operate the system.
- **requirements = ["assets"]** (source-interpretation): The source explicitly describes partition backfills, data quality gates and self-service asset operations. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)

### Structural checks

- PASS: Broad approach. Expected ["automation"]; observed "automation".
- PASS: No unnecessary AI. Expected "No model calls"; observed {"needed":false,"modelNodes":0}.

### Manual review still required

- [ ] Compare asset-oriented orchestration, partitions, backfills, quality gates and lineage.
- [ ] Dagster and dbt are outside the current guide catalog. Treat that as a coverage gap, not an automatic Airflow win or failure.

### One-field sensitivity probes

- risks: ["none"] → ["irreversible"]. CHANGED: {"approach":"automation","core":["airflow"],"autonomy":3,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. None is not supported. Precise cost/reversibility is unknown, so compare costly-error and confidential-data scenarios.
- risks: ["none"] → ["personal"]. Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. None is not supported. Precise cost/reversibility is unknown, so compare costly-error and confidential-data scenarios.
- risks: ["none"] → ["personal","irreversible"]. CHANGED: {"approach":"automation","core":["airflow"],"autonomy":3,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. None is not supported. Precise cost/reversibility is unknown, so compare costly-error and confidential-data scenarios.
- location: "open" → "residency". CHANGED: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Local or self-hosted","tools":["airflow","integrations"]}. Those choices do not disclose all location restrictions; cloud use is not unrestricted permission.
- location: "open" → "independence". Same decision summary: {"approach":"automation","core":["airflow"],"autonomy":4,"hosting":"Cloud, pay as you go","tools":["airflow","integrations"]}. Those choices do not disclose all location restrictions; cloud use is not unrestricted permission.

### Guide output for review

Approach: Plain automation. No AI needed..
Tools: airflow: Runs each job in the right order, starting it when its data is ready.; integrations: Fetches and updates data in your other software as fixed steps..
Autonomy: 4.
- Don't add AI just because you can: If the output is a fixed function of the input, AI adds cost and unpredictability. Vendors may pitch an AI agent for this; a plain workflow is the better buy.
- Compare data operations before choosing the platform: This catalog does not evaluate Dagster or dbt. Treat the suggested platform as provisional. Compare partition mappings, backfills, data quality gates, lineage, team permissions and existing infrastructure. Test replay and failure recovery with representative data before selecting an orchestrator.
- Airflow is a developer tool: Every workflow is written in Python, compared with n8n's visual builder, and a production setup needs ongoing monitoring and tuning. Budget for someone to own it, or use a managed Airflow service.
- You don't need MCP here: MCP is how an AI discovers and uses tools. A workflow without AI uses the workflow tool's normal app connections, which are simpler to set up and audit.
