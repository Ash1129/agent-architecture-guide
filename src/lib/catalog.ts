// Plain-language descriptions of every building block the guide can recommend.
// Product names are examples current as of the review date and may need updating.

import type { SourceId } from "./sources";

export const LAST_REVIEWED = "October 2026";

export type ToolId =
  | "n8n"
  | "airflow"
  | "cowork"
  | "claude"
  | "hermes"
  | "n8n-agent"
  | "skill"
  | "mcp"
  | "system-prompt"
  | "resources"
  | "project"
  | "integrations";

export type Tool = {
  id: ToolId;
  name: string;
  /** What it is, in one sentence a non-specialist can follow. */
  plain: string;
  /** Whether it is a specific product (may change) or a general building block. */
  product: boolean;
  link?: string;
};

export const TOOLS: Record<ToolId, Tool> = {
  n8n: {
    id: "n8n",
    name: "n8n",
    plain:
      "A visual workflow builder. You connect your apps with drag-and-drop steps, and it runs on a schedule or when something happens. Steps can include AI.",
    product: true,
    link: "https://n8n.io",
  },
  airflow: {
    id: "airflow",
    name: "Apache Airflow",
    plain:
      "A code-based scheduler for chains of data jobs. It knows which jobs depend on which, and starts each one only when the data it needs is ready.",
    product: true,
    link: "https://airflow.apache.org",
  },
  cowork: {
    id: "cowork",
    name: "Claude Cowork",
    plain:
      "Claude working as an agent, in the desktop app, on the web or on mobile. It can take a multi-step task, work through it on its own, and run scheduled tasks in the cloud while your computer is off.",
    product: true,
    link: "https://claude.com",
  },
  claude: {
    id: "claude",
    name: "Claude (chat or desktop app)",
    plain: "The everyday Claude app. You start each task with a request, and it works on that request.",
    product: true,
    link: "https://claude.ai",
  },
  hermes: {
    id: "hermes",
    name: "Hermes Agent",
    plain:
      "An open-source personal agent from Nous Research. It works with many AI providers, keeps a persistent memory, and writes or edits its own skills as it learns.",
    product: true,
    link: "https://hermes-agent.nousresearch.com/",
  },
  "n8n-agent": {
    id: "n8n-agent",
    name: "n8n with an AI agent step",
    plain:
      "An n8n workflow that hands one step to an AI agent. The workflow handles triggers and routine steps; the agent decides what to do for the open-ended part.",
    product: true,
    link: "https://n8n.io",
  },
  skill: {
    id: "skill",
    name: "A Skill",
    plain:
      "A saved playbook the AI loads whenever this task comes up: your steps, templates and house rules, plus which tools to use. Think of it as a workflow without the boxes and arrows.",
    product: false,
  },
  mcp: {
    id: "mcp",
    name: "MCP connectors",
    plain:
      "The standard plug that lets an AI see and use another program, such as your CRM, inbox or design software. Without a connector, the AI can only talk about your systems, not use them.",
    product: false,
  },
  "system-prompt": {
    id: "system-prompt",
    name: "A system prompt",
    plain:
      "The standing brief the AI reads before every task: who it is working for, the tone to use, and rules that always apply.",
    product: false,
  },
  resources: {
    id: "resources",
    name: "A reference library",
    plain:
      "The documents and data the AI should rely on rather than guess: policies, price lists, past examples. For a resume optimizer, the master resume with everything you've done.",
    product: false,
  },
  project: {
    id: "project",
    name: "A Claude Project",
    plain: "A shared workspace where files and past conversations stay available, so Claude keeps context between tasks.",
    product: true,
    link: "https://claude.ai",
  },
  integrations: {
    id: "integrations",
    name: "Built-in app connections",
    plain:
      "The ready-made connections inside your workflow tool (Gmail, Slack, your accounting system and so on). No AI is involved.",
    product: false,
  },
};

export type TopologyId =
  | "pipeline"
  | "dag"
  | "chain"
  | "routing"
  | "parallel-sections"
  | "parallel-voting"
  | "evaluator"
  | "orchestrator"
  | "agent-loop";

export type Topology = {
  id: TopologyId;
  name: string;
  plain: string;
  goodFor: string;
  example: string;
  sources: SourceId[];
};

export const TOPOLOGIES: Record<TopologyId, Topology> = {
  pipeline: {
    id: "pipeline",
    name: "Fixed pipeline",
    plain: "A set sequence of steps with simple if-this-then-that branches. No AI makes decisions.",
    goodFor: "Rules-based work where the same input should always give the same result.",
    example: "When an invoice is 14 days overdue, send reminder A. At 30 days, send reminder B and alert the account owner.",
    sources: ["anthropic", "notes"],
  },
  dag: {
    id: "dag",
    name: "Dependency graph",
    plain:
      "Jobs arranged so each one starts only when the jobs it depends on have finished. Engineers call this a DAG.",
    goodFor: "Data work where many jobs feed each other and timing matters.",
    example: "Import sales and inventory overnight, then build the margin report once both imports have landed.",
    sources: ["selfhosting", "airflowDocs"],
  },
  chain: {
    id: "chain",
    name: "Prompt chain",
    plain:
      "The task is broken into steps that run in order. Each step's output becomes the next step's input, with checks in between.",
    goodFor: "Work with a fixed order where each step needs some judgement.",
    example: "Write the marketing copy, then translate it, then summarise it for the sales team.",
    sources: ["anthropic"],
  },
  routing: {
    id: "routing",
    name: "Routing",
    plain: "The first step sorts the incoming work by type and sends each type to its own specialised process.",
    goodFor: "Work that arrives in distinct types needing different handling.",
    example: "Customer messages are sorted into general questions, refund requests and technical support, each with its own instructions and tools.",
    sources: ["anthropic"],
  },
  "parallel-sections": {
    id: "parallel-sections",
    name: "Parallel sections",
    plain: "Independent parts of the work are handled at the same time by separate AI calls, then combined.",
    goodFor: "Work that splits cleanly into parts that don't depend on each other.",
    example: "Resume optimizer: one call checks technical skills, another checks experience, another checks formatting. Findings are combined before editing.",
    sources: ["anthropic", "notes"],
  },
  "parallel-voting": {
    id: "parallel-voting",
    name: "Parallel voting",
    plain: "The same task is attempted several times independently, and the results are compared or voted on.",
    goodFor: "Judgement calls where one opinion is not reliable enough.",
    example: "Three independent reviews of whether a contract clause is unusual; flag it if two agree.",
    sources: ["anthropic"],
  },
  evaluator: {
    id: "evaluator",
    name: "Generator and checker",
    plain:
      "One step produces the work, a second step checks it against clear criteria, and feedback goes back until it passes. Also called evaluator-optimizer.",
    goodFor: "Work where quality can be judged against a clear checklist.",
    example: "Resume optimizer: one step rewrites a bullet, a checker compares it to the original resume for unsupported claims, and sends it back if anything was invented.",
    sources: ["anthropic", "notes"],
  },
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator and workers",
    plain:
      "A coordinating agent decides which pieces of work are needed, hands them to specialist workers, and combines the results.",
    goodFor: "Work where the needed subtasks change from case to case.",
    example: "Resume optimizer: a career change needs a skills comparison and an experience rewrite, while another resume only needs formatting. The orchestrator decides which work to assign.",
    sources: ["anthropic", "openai", "notes"],
  },
  "agent-loop": {
    id: "agent-loop",
    name: "Single agent loop",
    plain:
      "One AI agent works toward a goal: it picks an action, uses a tool, looks at the result and decides the next step, until it is done or hits a limit.",
    goodFor: "Open-ended work where the path can't be mapped out in advance.",
    example: "Resume optimizer: the agent spots missing information and decides what to do next, but asks you before adding any experience that isn't documented.",
    sources: ["anthropic", "databricks", "notes"],
  },
};

export type AutonomyLevel = 1 | 2 | 3 | 4;

export const AUTONOMY: Record<AutonomyLevel, { name: string; plain: string }> = {
  1: { name: "Assist", plain: "The AI drafts or suggests. A person does the work and makes every decision." },
  2: {
    name: "Approve every output",
    plain: "The system prepares the work. A person approves each result before it goes out or anything changes.",
  },
  3: {
    name: "Approve the risky ones",
    plain: "Routine items go through on their own. High-risk actions, and anything that keeps failing, wait for a person.",
  },
  4: {
    name: "Runs within guardrails",
    plain: "The system runs end to end. People review samples and exceptions, and automatic checks catch known problems.",
  },
};

export type Term = { term: string; plain: string };

// Terms are only introduced in the result, next to the recommendation that uses them.
export const GLOSSARY: Record<string, Term> = {
  agent: {
    term: "Agent",
    plain:
      "An AI model attached to a loop that lets it take an action, look at the result and choose the next step by itself. Without that loop, the model just answers once.",
  },
  workflow: {
    term: "Workflow",
    plain: "A process whose steps are decided in advance. AI may do some steps, but it doesn't choose the path.",
  },
  guardrail: {
    term: "Guardrail",
    plain: "An automatic check that stops known problems, such as leaking personal data or going off-topic. Several simple guardrails layered together work better than one clever one.",
  },
  eval: {
    term: "Evaluation (eval)",
    plain: "A fixed set of real examples with known good answers. You run each version of your system on it to see objectively whether it got better or worse.",
  },
  injection: {
    term: "Prompt injection",
    plain: "Text hidden in an email, web page or document that tries to give your AI new instructions. The AI should treat such content as information, never as orders.",
  },
  openweight: {
    term: "Open-weight model",
    plain: "An AI model whose files are published, so you can run it on your own hardware or choose any provider that hosts it.",
  },
  context: {
    term: "Context window",
    plain: "How much text a model can consider at once. Past that limit, it starts to lose track of details.",
  },
};
