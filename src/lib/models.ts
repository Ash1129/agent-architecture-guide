// Which model (or which non-AI algorithm) runs each step. Picks follow the
// assignment's model framework: build the first version on the most capable
// model, then step each part down to the smallest model that still matches
// your test baseline. The role-to-model table below is this guide's starting
// suggestion; model names are examples as of the review date.

import { LAST_REVIEWED } from "./catalog";
import type { Answers } from "./questions";
import type { Basis } from "./rules";

export type ModelId = "opus" | "sonnet" | "haiku" | "openLarge" | "openSmall";

export const MODELS: Record<ModelId, { name: string; short: string; size: string; examples?: string }> = {
  opus: { name: "Claude Opus 5.5", short: "Opus 5.5", size: "Most capable" },
  sonnet: { name: "Claude Sonnet 5.5", short: "Sonnet 5.5", size: "Balanced" },
  haiku: { name: "Claude Haiku 4.5", short: "Haiku 4.5", size: "Fast, low cost" },
  openLarge: {
    name: "Large open-weight model",
    short: "Open-weight, large",
    size: "Most capable you can host",
    examples: "for example Qwen3 235B, Llama 4 Maverick or Hermes 4",
  },
  openSmall: {
    name: "Small open-weight model",
    short: "Open-weight, small",
    size: "Fast, low cost",
    examples: "for example Qwen3 8B",
  },
};

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
};

/** Starting picks per kind of step. Published on the "How it decides" page. */
export const MODEL_RULES: ModelRule[] = [
  {
    role: "router",
    step: "Sorting requests by type",
    pick: "haiku",
    open: "openSmall",
    why: "Sorting is a simple classification. A small, fast model is usually enough.",
    basis: { kind: "source", sources: ["openai"] },
  },
  {
    role: "worker",
    step: "Reading, drafting or judging inside a workflow",
    pick: "sonnet",
    open: "openLarge",
    adjust: "Haiku 4.5 at hundreds of runs a day, when nothing customer-facing or irreversible is at stake",
    why: "A balanced model handles most judgement steps well at a reasonable cost per run.",
    basis: { kind: "design" },
  },
  {
    role: "attempt",
    step: "Independent attempts that are voted on",
    pick: "haiku",
    open: "openSmall",
    why: "Several cheap attempts compared by vote often beat one expensive attempt.",
    basis: { kind: "design" },
  },
  {
    role: "checker",
    step: "Checking work against a checklist",
    pick: "haiku",
    open: "openSmall",
    adjust: "Sonnet 5.5 when output reaches customers, is irreversible or involves personal data",
    why: "Checking against a clear checklist is narrower than producing the work.",
    basis: { kind: "design" },
  },
  {
    role: "agent",
    step: "An agent working a case with tools",
    pick: "sonnet",
    open: "openLarge",
    why: "Agents need dependable tool use and multi-step reasoning, run after run.",
    basis: { kind: "source", sources: ["openai", "databricks"] },
  },
  {
    role: "coordinator",
    step: "A coordinator planning and combining work",
    pick: "opus",
    open: "openLarge",
    why: "Planning across several specialists is the hardest reasoning in the system.",
    basis: { kind: "design" },
  },
  {
    role: "specialist",
    step: "A specialist agent with one role",
    pick: "sonnet",
    open: "openLarge",
    adjust: "Haiku 4.5 at hundreds of runs a day",
    why: "Each specialist has a narrow brief, so a balanced model is usually enough.",
    basis: { kind: "design" },
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

  if (!open && role === "worker" && a.volume === "high" && !a.risks?.some((x) => x === "visible" || x === "irreversible")) id = "haiku";
  if (!open && role === "specialist" && a.volume === "high") id = "haiku";
  if (role === "checker" && sensitive) id = open ? "openLarge" : "sonnet";

  const m = MODELS[id];
  const top = open ? MODELS.openLarge : MODELS.opus;
  const inRegion = a.location === "residency" && !open;
  const why =
    rule.why +
    (id === "haiku" && role === "worker" ? " At your volume, cost per run matters most." : "") +
    (id === "sonnet" && role === "checker" ? " Mistakes here would be visible or costly, so the checker gets a stronger model." : "") +
    (open ? " You need models you can host or buy from several providers." : "") +
    (inRegion ? " Use it through a cloud provider that processes data in your region." : "");

  return {
    kind: "model",
    model: id,
    name: m.name + (m.examples ? `, ${m.examples}` : ""),
    short: m.short,
    prototype: `Build the first version on ${top.name}${top.examples ? ` (${top.examples})` : ""}. Switch to ${m.name.split(",")[0]} once it matches that baseline on your test examples.`,
    why,
    alternative: open ? undefined : `Open-weight alternative: ${id === "haiku" ? MODELS.openSmall.examples : MODELS.openLarge.examples}.`,
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
