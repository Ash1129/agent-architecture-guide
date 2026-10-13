// AI decisions. With AI on, a model makes the guide's main choices for a task
// (the approach, the shape of the work, the tools, where it runs, how much it
// does on its own, the model for each kind of AI step, and a shortlist),
// weighing output quality, cost and efficiency against the knowledge base,
// with the rules' recommendation as one input (server/decide.ts).
//
// The model chooses freely within hard limits, which checkDecision enforces:
// only systems the guide can build, only providers available where the owner
// operates, data kept where it must stay, and never more autonomy than the
// answers' risks allow (the rules' caps). A decision that breaks a limit is
// sent back once with the problems, then the rules' recommendation is used.

import { type AutonomyLevel, TOOLS, TOPOLOGIES, type ToolId, type TopologyId } from "./catalog";
import { ROLES_FOR } from "./design";
import { MODELS, type ModelId, type Role, usesOpenWeight } from "./models";
import { type Answers, effectiveAnswers } from "./questions";
import { type Approach, type Recommendation, recommend } from "./rules";

export type HostingId = "cloud" | "in-region" | "self-hosted" | "available" | "cloud-then-local" | "available-own-hardware";
export type DecisionField = "approach" | "topology" | "tools" | "hosting" | "autonomy" | "models" | "shortlist";
/** `kb`: the knowledge-base chunks the reason draws on. */
export type DecisionReason = { text: string; kb: { id: string; title: string }[] };

export type Decision = {
  /** The decision in one or two plain sentences. */
  summary: string;
  approach: Approach;
  topology: { primary: TopologyId; addOns: TopologyId[] };
  /** The main tool first, then supporting pieces, each with its part in this system. */
  tools: { tool: ToolId; role: string }[];
  hosting: HostingId;
  autonomy: AutonomyLevel;
  /** The model for each kind of AI step the approach uses. */
  models: Partial<Record<Role, ModelId>>;
  /** The main tool, plus at most one alternative worth weighing. */
  shortlist: { tool: ToolId; reason: string; tradeoff: string }[];
  reasons: Record<DecisionField, DecisionReason>;
};

export type DecisionResponse = { decision: Decision; source: "ai" | "cache"; model?: string };

// ---------------------------------------------------------------- what the guide can build

export const APPROACHES: Approach[] = ["automation", "workflow", "agent", "multi"];

/** The main tools each approach can be built in. */
export const APPROACH_TOOLS: Record<Approach, ToolId[]> = {
  automation: ["n8n", "airflow"],
  workflow: ["n8n", "airflow", "claude", "hermes"],
  agent: ["n8n-agent", "langgraph", "hermes", "cowork"],
  multi: ["n8n-agent", "langgraph", "hermes", "cowork"],
};

/** The shapes each approach can take, and what can be added to them. */
export const APPROACH_SHAPES: Record<Approach, { primary: TopologyId[]; addOns: TopologyId[] }> = {
  automation: { primary: ["pipeline", "dag"], addOns: [] },
  workflow: { primary: ["routing", "chain", "parallel-sections", "parallel-voting"], addOns: ["parallel-sections", "parallel-voting", "evaluator"] },
  agent: { primary: ["agent-loop"], addOns: ["routing", "evaluator"] },
  multi: { primary: ["orchestrator"], addOns: ["routing", "evaluator"] },
};

/** The supporting pieces that work with each main tool. */
export const SUPPORTING: Partial<Record<ToolId, ToolId[]>> = {
  n8n: ["integrations", "system-prompt", "resources", "promptfoo", "langfuse"],
  airflow: ["integrations", "system-prompt", "resources", "promptfoo", "langfuse"],
  claude: ["system-prompt", "skill", "mcp", "resources", "project", "promptfoo", "langfuse"],
  cowork: ["system-prompt", "skill", "mcp", "resources", "project", "promptfoo", "langfuse"],
  hermes: ["system-prompt", "skill", "mcp", "resources", "n8n", "airflow", "promptfoo", "langfuse"],
  "n8n-agent": ["system-prompt", "mcp", "resources", "airflow", "promptfoo", "langfuse"],
  langgraph: ["system-prompt", "mcp", "resources", "airflow", "promptfoo", "langfuse"],
};

export const HOSTING_IDS: HostingId[] = ["cloud", "in-region", "self-hosted", "available", "cloud-then-local", "available-own-hardware"];

/** Where the system may run, given where the owner operates and where data must stay. */
export function hostingAllowed(a: Answers): HostingId[] {
  if (a.location === "restricted") return ["available", "available-own-hardware"];
  if (a.location === "residency") return ["in-region", "self-hosted"];
  return ["cloud", "cloud-then-local", "self-hosted", "in-region"];
}

const CLAUDE_TOOLS: ToolId[] = ["claude", "cowork"];
const CLAUDE_MODELS: ModelId[] = ["opus", "sonnet", "haiku"];
const FIELDS: DecisionField[] = ["approach", "topology", "tools", "hosting", "autonomy", "models", "shortlist"];
const LIMITS = { summary: 400, role: 240, reason: 600, tradeoff: 300 };

/** "Work flow", "work_flow" and "Work-Flow" all read as "work-flow". */
const slug = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[\s_]+/g, "-") : "");

/** Reads the approach however the model wrote it: the id, its name, or a phrase. */
export function readApproach(v: unknown): Approach | undefined {
  const t = slug(v);
  if ((APPROACHES as string[]).includes(t)) return t as Approach;
  if (/multi|team|coordinator|specialist|several-agents|agents$/.test(t)) return "multi";
  if (/agent/.test(t)) return "agent";
  if (/workflow|ai-steps/.test(t)) return "workflow";
  if (/automation|no-ai|rules/.test(t)) return "automation";
  return undefined;
}

/** Reads an id from a fixed list, tolerating case, spaces, underscores and the item's display name. */
function readId<T extends string>(v: unknown, ids: readonly T[], names: Partial<Record<T, string>> = {}): T | undefined {
  const t = slug(v);
  return ids.find((id) => slug(id) === t || (names[id] !== undefined && slug(names[id]) === t));
}

const MODEL_IDS = Object.keys(MODELS) as ModelId[];
/** Reads a model however the model wrote it: "haiku", "Claude Haiku 5.5", "claude-haiku-5-5", "open-large". */
function readModel(v: unknown): ModelId | undefined {
  const t = slug(v).replace(/^claude-/, "");
  const direct = MODEL_IDS.find((id) => slug(id) === t || slug(id) === t.replace(/-/g, ""));
  if (direct) return direct;
  if (/^(opus|sonnet|haiku)/.test(t)) return t.match(/^(opus|sonnet|haiku)/)![1] as ModelId;
  if (/open.*large|large.*open/.test(t)) return "openLarge";
  if (/open.*small|small.*open/.test(t)) return "openSmall";
  return undefined;
}

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t) : undefined;
};

/** The limits a decision is held to, in plain words, for the model and for the checks. */
export function limitsFor(a: Answers, rules: Recommendation = recommend(a)): string[] {
  const cap = rules.autonomy.cap ?? 4;
  return [
    `Autonomy: at most level ${cap} of 4 (the owner's risks cap it there).`,
    `Where it runs: one of ${hostingAllowed(a).join(", ")}.`,
    ...(usesOpenWeight(a)
      ? ["Models: open-weight only (openLarge, openSmall). Claude and Claude-based tools (claude, cowork) aren't allowed: major providers aren't available, or the owner must not depend on one AI company."]
      : []),
    "An agent or a team of agents that takes actions in the owner's systems: at most level 3.",
    "Plain automation uses no AI models.",
  ];
}

/**
 * Checks a model's decision against the hard limits and the guide's options.
 * Never throws. Small slips (an unknown chunk id, a supporting piece that
 * doesn't fit) are tidied; anything that breaks a limit is a problem.
 */
export function checkDecision(raw: unknown, rawAnswers: Answers, chunks: { id: string; title: string }[] = []): { decision?: Decision; problems: string[] } {
  const a = effectiveAnswers(rawAnswers);
  const rules = recommend(a);
  const problems: string[] = [];
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const known = new Map(chunks.map((c) => [c.id, c.title]));

  const approach = readApproach(r.approach) as Approach;
  if (!approach) problems.push(`"approach" must be one of ${APPROACHES.join(", ")} (got ${JSON.stringify(r.approach)}).`);

  // The shape of the work.
  const topo = (r.topology && typeof r.topology === "object" ? r.topology : {}) as { primary?: unknown; addOns?: unknown };
  const TOPO_IDS = Object.keys(TOPOLOGIES) as TopologyId[];
  const topoNames = Object.fromEntries(TOPO_IDS.map((t) => [t, TOPOLOGIES[t].name])) as Record<TopologyId, string>;
  const primary = readId(topo.primary, TOPO_IDS, topoNames) as TopologyId;
  const addOnsRead = Array.isArray(topo.addOns) ? [...new Set(topo.addOns.map((x) => readId(x, TOPO_IDS, topoNames)).filter((x): x is TopologyId => !!x))] : [];
  const shapes = APPROACHES.includes(approach) ? APPROACH_SHAPES[approach] : undefined;
  // Add-ons that don't fit are dropped, not fatal: the main shape still stands.
  let addOns: TopologyId[] = [];
  if (shapes) {
    if (!shapes.primary.includes(primary)) problems.push(`"topology.primary" for ${approach} must be one of ${shapes.primary.join(", ")} (got ${JSON.stringify(topo.primary)}).`);
    addOns = addOnsRead.filter((x) => shapes.addOns.includes(x) && x !== primary && (!x.startsWith("parallel") || primary === "routing"));
    addOns = addOns.filter((x, i) => !x.startsWith("parallel") || addOns.findIndex((y) => y.startsWith("parallel")) === i);
    if (approach === "automation" && primary !== (a.trigger === "data" ? "dag" : "pipeline"))
      problems.push(`Plain automation started ${a.trigger === "data" ? "after other data jobs" : "this way"} uses "${a.trigger === "data" ? "dag" : "pipeline"}".`);
  }

  // Tools: the main tool first.
  const rawTools = Array.isArray(r.tools) ? r.tools : [];
  const tools: Decision["tools"] = [];
  const TOOL_IDS = Object.keys(TOOLS) as ToolId[];
  const toolNames = Object.fromEntries(TOOL_IDS.map((t) => [t, TOOLS[t].name])) as Record<ToolId, string>;
  const readTool = (v: unknown) => readId(v, TOOL_IDS, toolNames);
  for (const t of rawTools) {
    const tool = readTool(t && typeof t === "object" ? (t as { tool?: unknown }).tool : t) as ToolId;
    if (!tool || tools.some((x) => x.tool === tool)) continue;
    tools.push({ tool, role: str((t as { role?: unknown })?.role, LIMITS.role) ?? "" });
  }
  const main = tools[0]?.tool;
  if (!main) problems.push(`"tools" must start with the main tool.`);
  else if (shapes && !APPROACH_TOOLS[approach].includes(main)) problems.push(`The main tool for ${approach} must be one of ${APPROACH_TOOLS[approach].join(", ")}.`);
  const fits = main ? (SUPPORTING[main] ?? []) : [];
  const kept = main ? [tools[0], ...tools.slice(1).filter((t) => fits.includes(t.tool))] : [];

  // Hosting.
  const hosting = readId(r.hosting, HOSTING_IDS) as HostingId;
  if (!hosting) problems.push(`"hosting" must be one of ${HOSTING_IDS.join(", ")} (got ${JSON.stringify(r.hosting)}).`);
  else if (!hostingAllowed(a).includes(hosting)) problems.push(`"hosting" must be one of ${hostingAllowed(a).join(", ")} for where this owner operates.`);

  // Autonomy, within the rules' caps.
  const cap = rules.autonomy.cap ?? 4;
  const autonomy = Number(typeof r.autonomy === "string" ? r.autonomy.replace(/\D/g, "") : r.autonomy) as AutonomyLevel;
  if (![1, 2, 3, 4].includes(autonomy)) problems.push(`"autonomy" must be 1, 2, 3 or 4.`);
  else if (autonomy > cap) problems.push(`"autonomy" can be at most ${cap}: the owner's risks cap it there.`);
  else if ((approach === "agent" || approach === "multi") && a.systems === "act" && autonomy > 3) problems.push(`An agent that acts in the owner's systems can be at most level 3.`);

  // Models, one per kind of AI step the approach uses.
  const roles = APPROACHES.includes(approach) ? ROLES_FOR[approach] : [];
  const rawModels = r.models && typeof r.models === "object" ? (r.models as Record<string, unknown>) : {};
  const byRole = new Map(Object.entries(rawModels).map(([k, v]) => [slug(k), v]));
  const models: Decision["models"] = {};
  for (const role of roles) {
    const v = byRole.get(role);
    if (v === undefined || v === null || v === "") continue;
    const m = readModel(v);
    if (!m) problems.push(`"models.${role}" must be one of ${MODEL_IDS.join(", ")} (got ${JSON.stringify(v)}).`);
    else models[role] = m;
  }
  // Models for kinds of step this approach doesn't have are ignored; plain automation has none at all.
  if (approach === "automation" && Object.values(rawModels).some((v) => readModel(v))) problems.push("Plain automation uses no AI models.");

  // Availability: no provider the owner can't use.
  if (usesOpenWeight(a)) {
    if (main && CLAUDE_TOOLS.includes(main)) problems.push(`"${main}" isn't available: use a main tool that works with open-weight models.`);
    for (const [role, m] of Object.entries(models)) if (CLAUDE_MODELS.includes(m)) problems.push(`"models.${role}" must be an open-weight model (openLarge or openSmall).`);
  }

  // The shortlist: the main tool first, at most one alternative, each one buildable and available.
  const rawShort = Array.isArray(r.shortlist) ? r.shortlist : [];
  const shortlist: Decision["shortlist"] = [];
  // An alternative that can't build the approach, or isn't available, is dropped: the decision itself stands.
  for (const c of rawShort) {
    const tool = readTool((c as { tool?: unknown })?.tool) as ToolId;
    if (!tool || shortlist.some((x) => x.tool === tool)) continue;
    if (shapes && !APPROACH_TOOLS[approach].includes(tool)) continue;
    if (usesOpenWeight(a) && CLAUDE_TOOLS.includes(tool)) continue;
    shortlist.push({ tool, reason: str((c as { reason?: unknown }).reason, LIMITS.reason) ?? "", tradeoff: str((c as { tradeoff?: unknown }).tradeoff, LIMITS.tradeoff) ?? "" });
  }
  if (main && !shortlist.some((x) => x.tool === main)) shortlist.unshift({ tool: main, reason: "", tradeoff: "" });
  shortlist.sort((x, y) => Number(y.tool === main) - Number(x.tool === main));

  // A reason for every choice, citing only the chunks given.
  const rawReasons = r.reasons && typeof r.reasons === "object" ? (r.reasons as Record<string, unknown>) : {};
  const reasons = {} as Decision["reasons"];
  for (const f of FIELDS) {
    const x = rawReasons[f] as { text?: unknown; kb?: unknown } | undefined;
    const text = str(x?.text, LIMITS.reason);
    if (!text && f !== "shortlist" && !(f === "models" && !roles.length)) problems.push(`"reasons.${f}.text" is missing.`);
    const ids = Array.isArray(x?.kb) ? [...new Set(x!.kb.filter((k): k is string => typeof k === "string" && known.has(k)))] : [];
    const kb = ids.map((id) => ({ id, title: known.get(id)! }));
    reasons[f] = { text: text ?? "", kb };
  }

  const summary = str(r.summary, LIMITS.summary);
  if (!summary) problems.push(`"summary" is missing.`);
  if (problems.length) return { problems };
  return {
    decision: { summary: summary!, approach, topology: { primary, addOns }, tools: kept, hosting, autonomy, models, shortlist: shortlist.slice(0, 2), reasons },
    problems,
  };
}
