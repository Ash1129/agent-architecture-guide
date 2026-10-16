// Which model (or which non-AI algorithm) runs each step. Picks follow the
// assignment's model framework: build the first version on the most capable
// model, then step each part down to the smallest model that still matches
// your test baseline. The role-to-model table below is this guide's starting
// suggestion; model names are examples as of the review date (knowledge base
// chunks M01 and M03, checked October 12, 2026).

import { LAST_REVIEWED } from "./catalog";
import type { Answers } from "./questions";
import type { ChunkId } from "./knowledge";
import type { Basis } from "./rules";

export type ModelId = "opus" | "sonnet" | "haiku" | "openLarge" | "openSmall";

/** Leading open-weight models as of the review date (M03), shown as examples of the large open-weight tier. */
export const OPEN_LARGE_PICKS = ["Kimi K2.6", "GLM-5", "DeepSeek-V4-Pro"];

export const MODELS: Record<ModelId, { name: string; short: string; size: string; examples?: string }> = {
  opus: { name: "Claude Opus 5.5", short: "Opus 5.5", size: "Default starting point" },
  sonnet: { name: "Claude Sonnet 5.5", short: "Sonnet 5.5", size: "Balanced" },
  haiku: { name: "Claude Haiku 5.5", short: "Haiku 5.5", size: "Fastest, lowest cost; for sorting, extraction and high volume" },
  openLarge: {
    name: "Large open-weight model",
    short: "Open-weight, large",
    size: "Most capable you can host",
    examples: `for example ${OPEN_LARGE_PICKS.slice(0, -1).join(", ")} or ${OPEN_LARGE_PICKS.at(-1)} (leading open-weight models in ${LAST_REVIEWED})`,
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
 * Haiku 5.5 is Anthropic's model for high-volume sorting and extraction, at a
 * twentieth of Sonnet 5.5's price (M01, M04). The guide's method still starts
 * these steps on Sonnet and steps down once tests show the smaller model
 * matches, so Haiku is the step down to test, not the starting pick.
 */
export const HAIKU_NOTE = "At this volume, test Claude Haiku 5.5 here once Sonnet's results are your baseline: it costs a twentieth as much and is built for sorting and extraction.";

export type Engine =
  | { kind: "model"; model: ModelId; role: Role; name: string; short: string; prototype: string; why: string; alternative?: string }
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
    adjust: "Opus 5.5 when output reaches customers, is irreversible, involves personal data or decides about a person, and always a different model from the one whose work it checks",
    why: "Checking against a clear checklist is narrower than producing the work. Fixed checks (quotes match the source, every item addressed) run first.",
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

/**
 * The model for a kind of AI step. `picks`: the AI's choices, when it made the
 * decision (already checked against what's available); otherwise the guide's
 * starting picks.
 */
/** Whether a design's mistakes would reach people, be hard to undo, touch personal data or decide about a person. */
export const highStakes = (a: Answers) => !!a.risks?.some((x) => x === "visible" || x === "irreversible" || x === "personal" || x === "decides");

/**
 * The model for a kind of AI step. `picks`: the AI's choices, when it made the
 * decision (already checked against what's available); otherwise the guide's
 * starting picks. `checks`: for a checker, the model whose work it checks:
 * when the stakes are high the checker is a different model, so the two don't
 * share blind spots.
 */
export function pickModel(role: Role, a: Answers, picks?: Partial<Record<Role, ModelId>>, checks?: ModelId): Engine {
  const rule = MODEL_RULES.find((x) => x.role === role)!;
  const open = usesOpenWeight(a);
  const sensitive = highStakes(a);
  let id: ModelId = open ? rule.open : rule.pick;

  if (role === "checker" && sensitive) id = open ? "openLarge" : "opus";
  const ruled = id;
  if (picks?.[role]) id = picks[role]!;
  const independent = role === "checker" && sensitive && checks !== undefined;
  // The same Claude model would share its blind spots; open-weight tiers hold several models, so a different one is chosen within the tier.
  if (independent && checks === id && !open) id = id === "opus" ? "sonnet" : "opus";

  const m = MODELS[id];
  const top = open ? MODELS.openLarge : MODELS.opus;
  const inRegion = a.location === "residency" && !open;
  const why =
    (id !== ruled && !(independent && checks === ruled) ? `Chosen by AI for this step, weighing quality, cost and speed (the guide's starting pick is ${MODELS[ruled].name.split(",")[0]}). ` : "") +
    rule.why +
    (independent ? (open ? " Use a different model from this tier than the one that did the work, so the two don't share blind spots." : " It is a different model from the one that did the work, so the two don't share blind spots.") : "") +
    (role === "checker" && sensitive ? " Mistakes here would be visible or costly, so the checker gets a stronger model." : "") +
    (!open && a.volume === "high" && (role === "router" || role === "attempt" || role === "worker" || role === "specialist") ? ` ${HAIKU_NOTE}` : "") +
    (open ? " You need models you can host or buy from several providers." : "") +
    (inRegion
      ? " Anthropic's own API processes data only in the US or worldwide, so use Claude through a cloud provider's regional service (such as Amazon Bedrock or Google Cloud) to keep data in your region."
      : "");

  return {
    kind: "model",
    model: id,
    role,
    name: m.name + (m.examples ? `, ${m.examples}` : ""),
    short: m.short,
    prototype:
      (id === (open ? "openLarge" : "opus")
        ? `Build on ${top.name}${top.examples ? ` (${top.examples})` : ""} and keep it there: this step needs the strongest model in the design.`
        : `Build the first version on ${top.name}${top.examples ? ` (${top.examples})` : ""}. Switch to ${m.name.split(",")[0]} once it matches that baseline on your test examples.`) +
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
  spc: { name: "Control chart", how: "Plots each period's measurement, rate or count against limits set from the process's own stable variation (centre plus or minus three standard errors) and applies the run rules. A point outside the limits or a run pattern is a real change; everything else is noise. The chart follows the data: X-bar and S for measurements in subgroups, individuals and moving range for one value a period, p or np for pass/fail, c or u for defect counts." },
  capability: { name: "Capability index", how: "Compares a stable process with its specification or rating: Cp for whether the spread fits, Cpk for the nearer limit as the process actually sits, Pp and Ppk with the total spread including drift. Reported with a confidence interval; read only once the control chart shows stability." },
  reliability: { name: "Reliability model", how: "Fits a lifetime distribution to failure and survival records (exponential while the hazard is flat, Weibull once wear-out is plausible) to give each unit's probability of failing in the next period and its mean time to failure, and combines units in series or parallel, with shared parts as common causes, for a system." },
  rpn: { name: "Risk ranking (FMEA)", how: "Scores each failure mode for severity, occurrence and detection, 1 to 10 each, and orders them by the product (the risk priority number) with high severity flagged on its own. An ordering of what to fix first, not a probability." },
} as const;

export type AlgorithmId = keyof typeof ALGORITHMS;

export function algorithm(id: AlgorithmId): Engine {
  const x = ALGORITHMS[id];
  return { kind: "algorithm", name: x.name, short: x.name, how: x.how };
}

export const MODELS_REVIEWED = LAST_REVIEWED;
