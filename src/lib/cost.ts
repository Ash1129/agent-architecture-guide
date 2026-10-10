// What a design costs to run and to build, as ranges. Running cost is
// calculated from the design itself: each AI step's model at its listed price
// (knowledge chunk M04), agents at about 4× the tokens of a single call (M02),
// and the volume answer turned into runs a month. Platform plans come from M04,
// own hardware from D03. Build effort and review time are the guide's own
// estimates: no research measures them, and the page says so. Every
// assumption is a named constant here, and the "How it decides" page lists them.

import type { Blueprint, BNode } from "./blueprint";
import type { ChunkId } from "./knowledge";
import type { ModelId, Role } from "./models";
import type { Answers } from "./questions";
import type { Recommendation } from "./rules";

export type Range = [number, number];

/** When the prices below were read (M04). */
export const PRICES_CHECKED = "October 10, 2026";

/** Runs a month for each volume answer. */
export const RUNS_PER_MONTH: Record<NonNullable<Answers["volume"]>, Range> = {
  occasional: [10, 40],
  daily: [300, 1500],
  high: [3000, 30000],
};

/** Tokens one AI call reads and writes: instructions, the item and its context in; the answer out. */
export const TOKENS_PER_CALL = { input: [2000, 5000] as Range, output: [300, 1000] as Range };

/** An agent takes several turns per run: about 4× the tokens of a single call (M02). Multi-agent adds up across its agents. */
export const ROLE_MULTIPLIER: Record<Role, number> = { router: 1, worker: 1, attempt: 1, checker: 1, agent: 4, coordinator: 4, specialist: 4 };

/** US dollars per million tokens, input and output (M04). The open-weight tiers are priced from their makers' own APIs. */
export const MODEL_PRICES: Record<ModelId, { input: Range; output: Range; source: string }> = {
  opus: { input: [4, 4], output: [20, 20], source: "Claude Opus 5.5" },
  sonnet: { input: [2, 2], output: [10, 10], source: "Claude Sonnet 5.5" },
  haiku: { input: [1, 1], output: [5, 5], source: "Claude Haiku 4.5" },
  openLarge: { input: [0.66, 1.32], output: [2, 4], source: "DeepSeek V4-Pro and Kimi K2.6, off-peak to peak" },
  openSmall: { input: [0.15, 0.3], output: [0.6, 1.2], source: "DeepSeek V4.1-Flash, off-peak to peak" },
};

/** The low end assumes these savings where they apply; the high end assumes none (M02, M04). */
export const SAVINGS = {
  /** Share of each call's input that repeats (instructions, playbook) and can be cached. */
  cachedShare: 0.5,
  /** A cached token costs about this share of the normal input price. */
  cachePrice: 0.1,
  /** Batch processing, for work that needn't be instant (Claude models). */
  batch: 0.5,
};

/** The share of runs a person reviews at each autonomy level, and minutes per review (the guide's estimate). */
export const REVIEW = {
  share: { 1: [1, 1], 2: [1, 1], 3: [0.1, 0.3], 4: [0.02, 0.05] } as Record<1 | 2 | 3 | 4, Range>,
  minutes: [1, 3] as Range,
};

/** A working week, past which review needs more than one person. */
export const FULL_TIME_HOURS = 40;

/** Weeks to build a first version, by approach, and what adds to it (the guide's estimate). */
export const BUILD_WEEKS: Record<Recommendation["approach"]["id"], Range> = {
  automation: [0.5, 1],
  workflow: [1, 3],
  agent: [2, 6],
  multi: [4, 12],
};
export const BUILD_EXTRA = {
  /** Acting inside your systems: credentials, permissions, testing on real data. */
  act: [0.5, 1.5] as Range,
  /** Reading from your systems. */
  read: [0, 0.5] as Range,
  /** Building a test set when results can't simply be checked against a list. */
  tests: [0.5, 1] as Range,
};

/** Euros to dollars, for plans priced in euros (n8n). */
export const EUR_TO_USD = 1.1;

/** Own hardware, upfront (D03): one GPU for small models; a server for large ones. */
export const HARDWARE: { small: Range; large: Range } = { small: [2000, 2000], large: [60000, 240000] };

export const COST_KB: ChunkId[] = ["M04", "M02", "M01", "D03", "L01", "L03", "L04"];

export type CostLine = { label: string; perMonth: Range | null; note: string };

export type CostEstimate = {
  runsPerMonth: Range;
  /** AI model charges; null when no step uses a model. */
  models: { perThousand: Range; perMonth: Range; savings: string[]; includedInPlan: boolean } | null;
  platform: CostLine;
  /** Own hardware, when the hosting advice includes it. */
  hardware?: { upfront: Range; when: string };
  /** A person's time reviewing results; null when nobody reviews routinely. */
  review: { hoursPerWeek: Range; note: string } | null;
  /** `what`: the kind of system; `drivers`: what adds time beyond it. */
  build: { weeks: Range; what: string; who: string; drivers: string[] };
  /** Running cost a month in dollars: models plus platform (plans priced per person count one person). */
  monthly: Range;
};

const add = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Range, k: number | Range): Range => (typeof k === "number" ? [a[0] * k, a[1] * k] : [a[0] * k[0], a[1] * k[1]]);

/** Cost of one run of one AI step, low and high. */
function stepCost(n: BNode, cheap: { cache: boolean; batch: boolean }): Range {
  if (n.engine?.kind !== "model") return [0, 0];
  const p = MODEL_PRICES[n.engine.model];
  const k = ROLE_MULTIPLIER[n.engine.role];
  const claude = ["opus", "sonnet", "haiku"].includes(n.engine.model);
  const inLow = TOKENS_PER_CALL.input[0] * (cheap.cache ? 1 - SAVINGS.cachedShare + SAVINGS.cachedShare * SAVINGS.cachePrice : 1);
  const low = (k * (inLow * p.input[0] + TOKENS_PER_CALL.output[0] * p.output[0])) / 1e6;
  const high = (k * (TOKENS_PER_CALL.input[1] * p.input[1] + TOKENS_PER_CALL.output[1] * p.output[1])) / 1e6;
  return [low * (cheap.batch && claude ? SAVINGS.batch : 1), high];
}

/**
 * Cost of one run of the whole design. Steps that run side by side all count;
 * steps that are alternative paths (one path per type) count once: the
 * cheapest for the low end, the dearest for the high end.
 */
export function perRun(bp: Blueprint, cheap: { cache: boolean; batch: boolean }): Range {
  const byStage = new Map<number, BNode[]>();
  for (const n of bp.nodes) if (n.engine?.kind === "model") byStage.set(n.stage, [...(byStage.get(n.stage) ?? []), n]);
  let total: Range = [0, 0];
  for (const [stage, nodes] of byStage) {
    const costs = nodes.map((n) => stepCost(n, cheap));
    const together = nodes.length === 1 || /same time/i.test(bp.captions[stage] ?? "");
    total = add(total, together ? costs.reduce(add, [0, 0]) : [Math.min(...costs.map((c) => c[0])), Math.max(...costs.map((c) => c[1]))]);
  }
  return total;
}

/** The plan for the main tool, sized to the runs a month. */
function platformLine(r: Recommendation, a: Answers, runs: Range): CostLine {
  const core = r.tools.find((t) => t.core)!.tool;
  const selfHosted = r.fired.includes("H2");
  if (core === "n8n" || core === "n8n-agent") {
    if (selfHosted) return { label: "n8n, self-hosted", perMonth: null, note: "The community edition is free for your own internal use (n8n's licence). You pay for the server it runs on." };
    const plan = (n: number) => (n <= 2500 ? 20 : n <= 10000 ? 50 : 667);
    const name = (n: number) => (n <= 2500 ? "Starter" : n <= 10000 ? "Pro" : "Business");
    const [lo, hi] = [plan(runs[0]), plan(runs[1])];
    return {
      label: lo === hi ? `n8n Cloud ${name(runs[0])}` : `n8n Cloud ${name(runs[0])} to ${name(runs[1])}`,
      perMonth: [lo * EUR_TO_USD, hi * EUR_TO_USD],
      note: `€${lo}${lo === hi ? "" : ` to €${hi}`} a month, billed annually, sized to your runs (Starter covers 2,500 a month, Pro 10,000, Business 40,000 and is self-hosted). Or self-host the free community edition for your own internal use.`,
    };
  }
  if (core === "claude" || core === "cowork") {
    return a.team === "small"
      ? { label: "Claude Pro", perMonth: [20, 20], note: "$20 a month per person ($17 billed annually). Heavy use may need Max, from $100." }
      : { label: "Claude Team", perMonth: [25, 25], note: "$25 a seat a month ($20 billed annually), for each person who uses it." };
  }
  if (core === "langgraph") return { label: "LangGraph service", perMonth: null, note: "Budget separately for the application server, checkpoint database, model calls, observability and evaluation runs. No managed hosting price is assumed." };
  if (core === "hermes") return { label: "Hermes Agent", perMonth: [5, 5], note: "Free, open-source software (MIT licence). Its makers say it runs on anything from a $5-a-month server upwards." };
  return { label: "Airflow", perMonth: null, note: "Free, open-source software. You pay for the server, or for a managed Airflow service priced by its provider." };
}

/** Weeks to build, who can build it, and what drives the estimate. */
function buildEffort(r: Recommendation, a: Answers, bp: Blueprint): CostEstimate["build"] {
  let weeks = BUILD_WEEKS[r.approach.id];
  const drivers: string[] = [];
  if (a.systems === "act") {
    weeks = add(weeks, BUILD_EXTRA.act);
    drivers.push("it acts inside your systems, so access has to be set up and tested on real data");
  } else if (a.systems === "read") {
    weeks = add(weeks, BUILD_EXTRA.read);
    drivers.push("it reads from your systems");
  }
  if (bp.nodes.some((n) => n.engine?.kind === "model") && a.quality !== "clear") {
    weeks = add(weeks, BUILD_EXTRA.tests);
    drivers.push("good results can't simply be ticked off a list, so a test set has to be built");
  }
  const visual = ["n8n", "claude", "cowork"].includes(r.tools.find((t) => t.core)!.tool);
  const who =
    a.team === "large"
      ? "Your developers or IT team."
      : r.approach.id === "automation" || (r.approach.id === "workflow" && visual)
        ? "You or a colleague comfortable with tools like n8n, with an AI coding assistant working from BUILD.md."
        : "A developer, or someone technical with an AI coding assistant working from BUILD.md.";
  const what = { automation: "plain automation", workflow: "a workflow with AI steps", agent: "one AI agent", multi: "a team of AI agents" }[r.approach.id];
  return { weeks, what, who, drivers };
}

export function estimateCost(r: Recommendation, bp: Blueprint, a: Answers): CostEstimate {
  const runs = RUNS_PER_MONTH[a.volume ?? "daily"];
  const cache = !!a.knowledge?.some((k) => k === "playbook" || k === "reference");
  const batch = a.trigger === "schedule" || a.trigger === "data";
  const run = perRun(bp, { cache, batch });
  const core = r.tools.find((t) => t.core)!.tool;
  const includedInPlan = core === "claude" || core === "cowork";
  const models =
    run[1] > 0
      ? {
          perThousand: scale(run, 1000),
          perMonth: scale(run, runs),
          savings: [
            ...(cache ? ["caching your instructions and playbook, which repeat in every call"] : []),
            ...(batch && bp.nodes.some((n) => n.engine?.kind === "model" && ["opus", "sonnet", "haiku"].includes(n.engine.model)) ? ["batch processing, since the work needn't be instant"] : []),
          ],
          includedInPlan,
        }
      : null;
  const platform = platformLine(r, a, runs);

  const hasLarge = bp.nodes.some((n) => n.engine?.kind === "model" && n.engine.model === "openLarge");
  const ownHardware = ["H2", "H4", "H6"].find((id) => r.fired.includes(id));
  const hardware = ownHardware
    ? { upfront: hasLarge ? HARDWARE.large : HARDWARE.small, when: ownHardware === "H2" ? "Before launch, since it runs on servers you control." : "Later, once the steady work moves onto your own hardware." }
    : undefined;

  const level = r.autonomy.level as 1 | 2 | 3 | 4;
  const share = REVIEW.share[level];
  const hours = scale(scale(scale(runs, 1 / 4.33), share), [REVIEW.minutes[0] / 60, REVIEW.minutes[1] / 60]);
  const who =
    level <= 2
      ? `A person checks every result, at ${REVIEW.minutes[0]} to ${REVIEW.minutes[1]} minutes each.`
      : level === 3
        ? `A person handles the risky ones, assumed to be ${share[0] * 100}% to ${share[1] * 100}% of runs, at ${REVIEW.minutes[0]} to ${REVIEW.minutes[1]} minutes each.`
        : `A person spot-checks ${share[0] * 100}% to ${share[1] * 100}% of results.`;
  // Past a working week, reviewing every result stops being realistic: say so.
  const overloaded = hours[1] > FULL_TIME_HOURS
    ? ` At the top of that range it's more than one person full time, so plan who does it, or let routine results through once testing shows they're reliable and review only the risky ones.`
    : "";
  const review = level <= 3 || bp.nodes.some((n) => n.kind === "human") ? { hoursPerWeek: hours, note: who + overloaded } : null;

  const monthly = add(models && !includedInPlan ? models.perMonth : [0, 0], platform.perMonth ?? [0, 0]);
  return { runsPerMonth: runs, models, platform, hardware, review, build: buildEffort(r, a, bp), monthly };
}

// ------------------------------------------------------------------ wording

/** "$3", "$40", "$1,200", "under $1". */
export function money(n: number): string {
  if (n < 1) return n === 0 ? "$0" : "under $1";
  const rounded = n < 100 ? Math.round(n) : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
  return `$${rounded.toLocaleString("en-US")}`;
}

/** "$3–$40", or one figure when both ends round the same. */
export function moneyRange([lo, hi]: Range): string {
  const a = money(lo);
  const b = money(hi);
  if (a === b) return a;
  if (a === "under $1") return `up to ${b}`;
  return `${a}–${b}`;
}

/** "2–6 weeks", "3–5 days". */
export function weeksRange([lo, hi]: Range): string {
  if (hi <= 1.5) return `${Math.max(1, Math.round(lo * 5))}–${Math.round(hi * 5)} working days`;
  const r = (x: number) => (x < 2 ? Math.round(x * 2) / 2 : Math.round(x));
  return `${r(lo)}–${r(hi)} weeks`;
}

/** "1–4 hours", "under an hour". */
export function hoursRange([lo, hi]: Range): string {
  if (hi < 1) return "under an hour";
  const r = (x: number) => (x < 10 ? Math.round(x * 2) / 2 : Math.round(x));
  return r(lo) < 0.5 ? `up to ${r(hi)} hours` : `${r(lo)}–${r(hi)} hours`;
}

/** Plain-text lines for BUILD.md, the copied summary and prompts. */
export function costLines(c: CostEstimate): string[] {
  const lines = [`- Running cost: about ${moneyRange(c.monthly)} a month (${c.runsPerMonth[0].toLocaleString("en-US")}–${c.runsPerMonth[1].toLocaleString("en-US")} runs).`];
  if (c.models)
    lines.push(
      c.models.includedInPlan
        ? `- AI models: included in the ${c.platform.label} plan within its usage limits; the same work on the API would cost ${moneyRange(c.models.perThousand)} per 1,000 runs.`
        : `- AI models: ${moneyRange(c.models.perThousand)} per 1,000 runs, ${moneyRange(c.models.perMonth)} a month.`,
    );
  lines.push(`- ${c.platform.label}: ${c.platform.perMonth ? `${moneyRange(c.platform.perMonth)} a month. ` : ""}${c.platform.note}`);
  if (c.hardware) lines.push(`- Own hardware: ${moneyRange(c.hardware.upfront)} upfront. ${c.hardware.when}`);
  if (c.review) lines.push(`- Review time: ${hoursRange(c.review.hoursPerWeek)} a week. ${c.review.note}`);
  lines.push(`- Build: ${weeksRange(c.build.weeks)} for a first version. ${c.build.who}`);
  lines.push(`- Estimates, with prices as of ${PRICES_CHECKED}; build and review time are the guide's own estimates.`);
  // Plain text (BUILD.md, the copied summary) writes ranges out in words.
  return lines.map((l) => l.replace(/\s*–\s*/g, " to "));
}
