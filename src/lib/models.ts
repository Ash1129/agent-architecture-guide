// Which model (or which non-AI algorithm) runs each step. Picks follow the
// assignment's model framework: build the first version on the most capable
// model, then step each part down to the smallest model that still matches
// your test baseline. The role-to-model table below is this guide's starting
// suggestion; model names are examples as of the review date (knowledge base
// chunks M01 and M03, checked October 5, 2026).

import { LAST_REVIEWED } from "./catalog";
import type { Answers } from "./questions";
import type { ChunkId } from "./knowledge";
import type { Basis } from "./rules";

export type ModelId = "opus" | "sonnet" | "haiku" | "openLarge" | "openSmall";

export const MODELS: Record<ModelId, { name: string; short: string; size: string; examples?: string }> = {
  opus: { name: "Claude Opus 5.5", short: "Opus 5.5", size: "Default starting point" },
  sonnet: { name: "Claude Sonnet 5.5", short: "Sonnet 5.5", size: "Balanced" },
  haiku: { name: "Claude Haiku 4.5", short: "Haiku 4.5", size: "Fast, low cost; may retire from October 15, 2026" },
  openLarge: {
    name: "Large open-weight model",
    short: "Open-weight, large",
    size: "Most capable you can host",
    examples: "for example Kimi K2.6, GLM-5 or DeepSeek-V3.2 (leading open-weight models in October 2026)",
  },
  openSmall: {
    name: "Small open-weight model",
    short: "Open-weight, small",
    size: "Fast, low cost",
    examples: "for example a smaller model from the same open families, chosen by testing",
  },
};

/** The step up when Opus 5.5 still falls short on demanding reasoning or long agent sessions (M01). */
export const TOP_MODEL = { name: "Claude Fable 5.1", note: "it requires Anthropic to keep data for 30 days, so it is unavailable under zero data retention" };

/**
 * Haiku 4.5 may be retired from October 15, 2026 (M01), so no step defaults to
 * it. Sonnet 5.5 takes the small-model roles; Haiku stays an option to test
 * while it remains available.
 */
export const HAIKU_NOTE = "Claude Haiku 4.5 is cheaper for simple steps but may be retired from October 15, 2026, so it isn't the default.";

export type Engine =
  | { kind: "model"; model: ModelId; name: string; short: string; prototype: string; why: string; alternative?: string }
  | { kind: "algorithm"; name: string; short: string; how: string };

export type Role = "router" | "worker" | "attempt" | "checker" | "agent" | "coordinator" | "specialist";

type ModelRule = {
  role: Role;
  step: string;
  pick: ModelId;
  open: ModelId;
  adjust?: string;
  why: string;
  basis: Basis;
  /** Knowledge-base chunks that support this pick (see src/lib/knowledge.ts). */
  kb: ChunkId[];
};

/** Starting picks per kind of step. Published on the "How it decides" page. */
export const MODEL_RULES: ModelRule[] = [
  {
    role: "router",
    step: "Sorting requests by type",
    pick: "sonnet",
    open: "openSmall",
    why: "Sorting is a simple classification. A fast, balanced model is enough; a smaller one can be tested later.",
    basis: { kind: "source", sources: ["openai"] },
    kb: ["P01", "M02", "M01"],
  },
  {
    role: "worker",
    step: "Reading, drafting or judging inside a workflow",
    pick: "sonnet",
    open: "openLarge",
    why: "A balanced model handles most judgement steps well at a reasonable cost per run.",
    basis: { kind: "design" },
    kb: ["M01", "M02"],
  },
  {
    role: "attempt",
    step: "Independent attempts that are voted on",
    pick: "sonnet",
    open: "openSmall",
    why: "Several independent attempts compared by vote often beat one attempt by a bigger model.",
    basis: { kind: "design" },
    kb: ["P02", "M02"],
  },
  {
    role: "checker",
    step: "Checking work against a checklist",
    pick: "sonnet",
    open: "openSmall",
    adjust: "Opus 5.5 when output reaches customers, is irreversible or involves personal data",
    why: "Checking against a clear checklist is narrower than producing the work.",
    basis: { kind: "design" },
    kb: ["P02", "G04"],
  },
  {
    role: "agent",
    step: "An agent working a case with tools",
    pick: "sonnet",
    open: "openLarge",
    why: "Agents need dependable tool use and multi-step reasoning, run after run.",
    basis: { kind: "source", sources: ["openai", "databricks"] },
    kb: ["T01", "F06", "M01"],
  },
  {
    role: "coordinator",
    step: "A coordinator planning and combining work",
    pick: "opus",
    open: "openLarge",
    why: "Planning across several specialists is the hardest reasoning in the system.",
    basis: { kind: "design" },
    kb: ["P04", "M01"],
  },
  {
    role: "specialist",
    step: "A specialist agent with one role",
    pick: "sonnet",
    open: "openLarge",
    why: "Each specialist has a narrow brief, so a balanced model is usually enough.",
    basis: { kind: "design" },
    kb: ["P03", "M01"],
  },
];

/** Open-weight models when Claude isn't available or approved, or data must stay on your servers. */
export function usesOpenWeight(a: Answers): boolean {
  return a.location === "restricted" || a.location === "independence" || (a.location === "residency" && a.team === "large");
}

export function pickModel(role: Role, a: Answers): Engine {
  const rule = MODEL_RULES.find((x) => x.role === role)!;
  const open = usesOpenWeight(a);
  const sensitive = !!a.risks?.some((x) => x === "visible" || x === "irreversible" || x === "personal");
  let id: ModelId = open ? rule.open : rule.pick;

  if (role === "checker" && sensitive) id = open ? "openLarge" : "opus";

  const m = MODELS[id];
  const top = open ? MODELS.openLarge : MODELS.opus;
  const inRegion = a.location === "residency" && !open;
  const why =
    rule.why +
    (role === "checker" && sensitive ? " Mistakes here would be visible or costly, so the checker gets a stronger model." : "") +
    (!open && a.volume === "high" && (role === "router" || role === "attempt" || role === "worker" || role === "specialist") ? ` ${HAIKU_NOTE}` : "") +
    (open ? " You need models you can host or buy from several providers." : "") +
    (inRegion
      ? " Anthropic's own API processes data only in the US or worldwide, so use Claude through a cloud provider's regional service (such as Amazon Bedrock or Google Cloud) to keep data in your region."
      : "");

  return {
    kind: "model",
    model: id,
    name: m.name + (m.examples ? `, ${m.examples}` : ""),
    short: m.short,
    prototype:
      `Build the first version on ${top.name}${top.examples ? ` (${top.examples})` : ""}. Switch to ${m.name.split(",")[0]} once it matches that baseline on your test examples.` +
      (open ? "" : ` If ${top.name} itself falls short on the hardest steps, try ${TOP_MODEL.name}; ${TOP_MODEL.note}.`),
    why,
    alternative: open ? undefined : `Open-weight alternative: ${rule.open === "openSmall" ? MODELS.openSmall.examples : MODELS.openLarge.examples}.`,
  };
}

// Non-AI steps still need a named method. These are the standard techniques.
export const ALGORITHMS = {
  manual: { name: "Manual start", how: "Runs only when a person starts it." },
  cron: { name: "Cron schedule", how: "A timetable (for example, every weekday at 7am) starts each run." },
  event: { name: "Event trigger", how: "A webhook or inbox watcher starts a run the moment a new item arrives." },
  sensor: { name: "Data-aware sensor", how: "Checks that upstream data has landed before starting, instead of guessing the time." },
  table: { name: "Decision table", how: "Each rule is a row of conditions and an action. The first row that matches decides." },
  scripted: { name: "Scripted action", how: "A fixed sequence of API calls with set inputs. Same input, same result." },
  dag: { name: "Dependency scheduler (DAG)", how: "Runs each job only once every job it depends on has finished, in dependency order." },
  merge: { name: "Deterministic merge", how: "Joins the parts in a fixed order and removes duplicates. No judgement involved." },
  vote: { name: "Majority vote", how: "Compares the attempts; the answer most attempts agree on wins, and ties go to a person." },
  validate: { name: "Validation rules", how: "Schema, required-field and pattern (regex) checks on the output." },
  keyword: { name: "Keyword and field rules", how: "Simple matches on fields or words decide the path." },
} as const;

export type AlgorithmId = keyof typeof ALGORITHMS;

export function algorithm(id: AlgorithmId): Engine {
  const x = ALGORITHMS[id];
  return { kind: "algorithm", name: x.name, short: x.name, how: x.how };
}

export const MODELS_REVIEWED = LAST_REVIEWED;
