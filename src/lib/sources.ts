// Every source the rules cite. Most come from AI Assignment 4's bibliography;
// the rest were added while building the guide and its knowledge base
// (knowledge/sources.md). Rules reference these by id so the "How this works"
// page can show exactly which guidance backs which decision.

export type SourceId =
  | "anthropic"
  | "openai"
  | "databricks"
  | "mindstudio"
  | "selfhosting"
  | "nous"
  | "kumar"
  | "pabani"
  | "enmgt"
  | "notes"
  | "anthropicDocs"
  | "mcp"
  | "n8nDocs"
  | "airflowDocs"
  | "hermesDocs"
  | "epoch"
  | "costResearch";

export type Source = {
  id: SourceId;
  short: string;
  citation: string;
  url?: string;
  usedFor: string;
  /** "assignment": in AI Assignment 4's bibliography. "added": added for this guide. */
  origin: "assignment" | "added";
};

export const SOURCES: Record<SourceId, Source> = {
  anthropic: {
    id: "anthropic",
    origin: "added",
    short: "Anthropic, Building effective agents",
    citation: "Anthropic. Building effective agents.",
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    usedFor:
      "Workflow versus agent distinction, the topology patterns (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, agents) and the advice to start simple.",
  },
  openai: {
    id: "openai",
    origin: "added",
    short: "OpenAI, A practical guide to building agents",
    citation: "OpenAI. A practical guide to building agents.",
    url: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
    usedFor:
      "Model selection by evaluation, layered guardrails, human intervention triggers, and maximizing a single agent before splitting into several.",
  },
  databricks: {
    id: "databricks",
    origin: "assignment",
    short: "Databricks, What is an AI agent harness?",
    citation: "Databricks. (2026, June 17). What is an AI agent harness?",
    url: "https://www.databricks.com/blog/ai-harness",
    usedFor: "What makes something an agent: a reasoning model attached to a harness that loops through steps.",
  },
  mindstudio: {
    id: "mindstudio",
    origin: "assignment",
    short: "MindStudio, Local AI vs cloud AI in 2026",
    citation:
      "Chavez-Mattos, L. (2026, May 27). Local AI vs cloud AI in 2026: When to run models on your own hardware. MindStudio.",
    url: "https://www.mindstudio.ai/blog/local-ai-vs-cloud-ai-2026",
    usedFor: "Local versus cloud hosting, fixed versus variable costs, and the effect of company size.",
  },
  selfhosting: {
    id: "selfhosting",
    origin: "assignment",
    short: "selfhosting.sh, Airflow vs n8n",
    citation: "selfhosting.sh. (2026, February 21). Airflow vs n8n: Which should you self-host? DEV Community.",
    url: "https://dev.to/selfhostingsh/airflow-vs-n8n-which-should-you-self-host-gpg",
    usedFor: "When n8n is enough and when dependent data jobs call for Apache Airflow.",
  },
  nous: {
    id: "nous",
    origin: "assignment",
    short: "Nous Research, Hermes Agent",
    citation: "Nous Research. (n.d.). Hermes Agent: The agent that grows with you. Retrieved October 4, 2026.",
    url: "https://hermes-agent.nousresearch.com/",
    usedFor: "Hermes Agent's persistent memory and model flexibility.",
  },
  kumar: {
    id: "kumar",
    origin: "assignment",
    short: "Kumar, Hermes agent (Agentic AI Knowledge Base)",
    citation: "Kumar, A. (n.d.). Hermes agent (Nous Research). Agentic AI Knowledge Base.",
    url: "https://agentic-ai.readthedocs.io/en/latest/AgentPlatforms/hermes-agent/",
    usedFor: "How Hermes learns by recognizing when to create or edit a skill.",
  },
  pabani: {
    id: "pabani",
    origin: "assignment",
    short: "Pabani, OpenClaw vs Hermes vs Cowork",
    citation: "Pabani, R. (2026, April 9). OpenClaw vs Hermes vs Cowork: Honest comparison. Dreams AI.",
    url: "https://dreamsaicanbuy.com/blog/openclaw-vs-hermes-vs-cowork",
    usedFor: "How Hermes compares with Claude Cowork, including access to models beyond Anthropic's.",
  },
  enmgt: {
    id: "enmgt",
    origin: "assignment",
    short: "ENMGT 5405 lecture slides",
    citation: "ENMGT 5405. (n.d.). Lecture slides, Canvas course materials. (Swart, D.), Cornell University, 2026.",
    usedFor: "Course definitions of skills, MCP, system prompts and Claude Cowork, as summarised in the team's research notes.",
  },
  notes: {
    id: "notes",
    origin: "assignment",
    short: "AI Assignment 4 research notes",
    citation: "AI Assignment 4, team research notes (Master Document, Sasha and Ashwin tabs).",
    usedFor:
      "The problem statement and the team's synthesis: deterministic versus flexible work, location, company size and budget, one versus many agents.",
  },
  anthropicDocs: {
    id: "anthropicDocs",
    origin: "added",
    short: "Anthropic documentation",
    citation:
      "Anthropic. (n.d.). Claude Platform documentation and Claude Help Center: models overview, Agent Skills, data residency, API and data retention, rate and spend limits, the Messages API, and Claude Cowork articles. Retrieved October 5, 2026.",
    url: "https://platform.claude.com/docs",
    usedFor: "The current Claude models, what Skills can and can't do, where Claude processes and keeps data, how to cap API spend, and how Cowork runs, schedules and remembers.",
  },
  mcp: {
    id: "mcp",
    origin: "added",
    short: "Model Context Protocol specification",
    citation: "Model Context Protocol. (2026, July 28). Specification and documentation, version 2026-07-28.",
    url: "https://modelcontextprotocol.io",
    usedFor: "What MCP connectors are, and the consent and least-privilege rules for connecting tools.",
  },
  n8nDocs: {
    id: "n8nDocs",
    origin: "added",
    short: "n8n documentation and licence",
    citation: "n8n. (n.d.). AI Agent, MCP Client Tool, MCP Server Trigger and Wait node documentation; Docker install guides; Sustainable Use License. Retrieved October 5, 2026.",
    url: "https://github.com/n8n-io/n8n/blob/master/LICENSE.md",
    usedFor: "n8n's AI agent step, its MCP nodes, how a workflow waits, what self-hosting needs, and the licence terms for internal and commercial use.",
  },
  airflowDocs: {
    id: "airflowDocs",
    origin: "added",
    short: "Apache Airflow documentation",
    citation: "Apache Software Foundation. (n.d.). What is Airflow?; Asset-aware scheduling; Installation and Running Airflow in Docker. Apache Airflow documentation. Retrieved October 5, 2026.",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/",
    usedFor: "Airflow as Python workflows that start when the data they depend on is ready, and what running it yourself takes.",
  },
  hermesDocs: {
    id: "hermesDocs",
    origin: "added",
    short: "Hermes Agent documentation",
    citation: "Nous Research. (2026). hermes-agent repository: README and documentation (Security, Memory, Skills, Scheduled Tasks). Retrieved October 5, 2026.",
    url: "https://github.com/NousResearch/hermes-agent",
    usedFor: "How Hermes approves commands, writes its own skills and runs scheduled jobs.",
  },
  epoch: {
    id: "epoch",
    origin: "added",
    short: "Epoch AI, open vs closed models",
    citation: "Edwards, J., & Emberson, L. (2026, May 29). Open models lag state-of-the-art closed models by 4 months. Epoch AI.",
    url: "https://epoch.ai/data-insights/open-closed-eci-gap",
    usedFor: "How far open-weight models trail the best closed models, and which open models lead.",
  },
  costResearch: {
    id: "costResearch",
    origin: "added",
    short: "Pan et al. (2025) and Patil (2026), on-premise vs API costs",
    citation:
      "Pan, G., Chodnekar, V., Roy, A., & Wang, H. (2025). A cost-benefit analysis of on-premise large language model deployment: Breaking even with commercial LLM services. arXiv:2509.18101. Patil, C. (2026). Beyond per-token pricing: A concurrency-aware methodology for LLM infrastructure cost estimation. arXiv:2606.11690.",
    url: "https://arxiv.org/abs/2509.18101",
    usedFor: "When owning hardware pays back against per-token APIs, and why it only does so when the hardware stays busy.",
  },
};

// Listed in the assignment's bibliography; credited here for completeness but
// not used to justify any rule.
export const ALSO_CREDITED =
  "Anthropic. (2026). Claude Sonnet 5.5 [Large language model]. https://claude.ai (listed in the assignment as an AI tool used while researching).";
