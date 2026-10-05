// Every source cited in AI Assignment 4. Rules reference these by id so the
// "How this works" page can show exactly which guidance backs which decision.

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
  | "notes";

export type Source = {
  id: SourceId;
  short: string;
  citation: string;
  url?: string;
  usedFor: string;
};

export const SOURCES: Record<SourceId, Source> = {
  anthropic: {
    id: "anthropic",
    short: "Anthropic, Building effective agents",
    citation: "Anthropic. Building effective agents.",
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    usedFor:
      "Workflow versus agent distinction, the topology patterns (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, agents) and the advice to start simple.",
  },
  openai: {
    id: "openai",
    short: "OpenAI, A practical guide to building agents",
    citation: "OpenAI. A practical guide to building agents.",
    url: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
    usedFor:
      "Model selection by evaluation, layered guardrails, human intervention triggers, and maximizing a single agent before splitting into several.",
  },
  databricks: {
    id: "databricks",
    short: "Databricks, What is an AI agent harness?",
    citation: "Databricks. (2026, June 17). What is an AI agent harness?",
    url: "https://www.databricks.com/blog/ai-harness",
    usedFor: "What makes something an agent: a reasoning model attached to a harness that loops through steps.",
  },
  mindstudio: {
    id: "mindstudio",
    short: "MindStudio, Local AI vs cloud AI in 2026",
    citation:
      "Chavez-Mattos, L. (2026, May 27). Local AI vs cloud AI in 2026: When to run models on your own hardware. MindStudio.",
    url: "https://www.mindstudio.ai/blog/local-ai-vs-cloud-ai-2026",
    usedFor: "Local versus cloud hosting, fixed versus variable costs, and the effect of company size.",
  },
  selfhosting: {
    id: "selfhosting",
    short: "selfhosting.sh, Airflow vs n8n",
    citation: "selfhosting.sh. (2026, February 21). Airflow vs n8n: Which should you self-host? DEV Community.",
    url: "https://dev.to/selfhostingsh/airflow-vs-n8n-which-should-you-self-host-gpg",
    usedFor: "When n8n is enough and when dependent data jobs call for Apache Airflow.",
  },
  nous: {
    id: "nous",
    short: "Nous Research, Hermes Agent",
    citation: "Nous Research. (n.d.). Hermes Agent: The agent that grows with you. Retrieved October 4, 2026.",
    url: "https://hermes-agent.nousresearch.com/",
    usedFor: "Hermes Agent's persistent memory and model flexibility.",
  },
  kumar: {
    id: "kumar",
    short: "Kumar, Hermes agent (Agentic AI Knowledge Base)",
    citation: "Kumar, A. (n.d.). Hermes agent (Nous Research). Agentic AI Knowledge Base.",
    url: "https://agentic-ai.readthedocs.io/en/latest/AgentPlatforms/hermes-agent/",
    usedFor: "How Hermes learns by recognizing when to create or edit a skill.",
  },
  pabani: {
    id: "pabani",
    short: "Pabani, OpenClaw vs Hermes vs Cowork",
    citation: "Pabani, R. (2026, April 9). OpenClaw vs Hermes vs Cowork: Honest comparison. Dreams AI.",
    url: "https://dreamsaicanbuy.com/blog/openclaw-vs-hermes-vs-cowork",
    usedFor: "How Hermes compares with Claude Cowork, including access to models beyond Anthropic's.",
  },
  enmgt: {
    id: "enmgt",
    short: "ENMGT 5405 lecture slides",
    citation: "ENMGT 5405. (n.d.). Lecture slides, Canvas course materials. (Swart, D.), Cornell University, 2026.",
    usedFor: "Course definitions of skills, MCP, system prompts, Claude Cowork and the autonomy spectrum.",
  },
  notes: {
    id: "notes",
    short: "AI Assignment 4 research notes",
    citation: "AI Assignment 4, team research notes (Master Document, Sasha and Ashwin tabs).",
    usedFor:
      "The problem statement and the team's synthesis: deterministic versus flexible work, location, company size and budget, one versus many agents.",
  },
};

// Listed in the assignment's bibliography; credited here for completeness but
// not used to justify any rule.
export const ALSO_CREDITED =
  "Anthropic. (2026). Claude Sonnet 5.5 [Large language model]. https://claude.ai (listed in the assignment as an AI tool used while researching).";
