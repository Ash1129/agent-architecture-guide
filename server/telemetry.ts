// Local telemetry for the AI steps: what each request to /api/* cost and how
// it ended, so output quality can be watched over time instead of read off
// the dev server's console.
//
// One record per request: the step, how it ended (passed on the first try,
// needed the Sonnet retry, failed its checks so the rules' version was shown,
// an API error, served from the cache), every model call it made with its
// tokens and time, and the checks that failed along the way. No prompts,
// descriptions, answers or replies are recorded, and nothing leaves this
// machine: records go to ai-cache.nosync/telemetry.jsonl (git-ignored) and the
// dev server serves a summary at GET /api/telemetry for the telemetry page.
//
// Calls are tied to their request with AsyncLocalStorage. The store and the
// records live on globalThis, because vite.config.ts imports this file
// directly while the AI steps load it through Vite: two module instances, one
// set of records.

import { AsyncLocalStorage } from "node:async_hooks";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type CallRecord = {
  model: string;
  attempt: "first" | "retry";
  ms: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** Why the model stopped, or "error" when the call itself failed. */
  stop: string;
};

/**
 * How a request ended, from the owner's side:
 * first-try   an AI answer passed every check on the first model
 * retry       the first answer failed a check; the escalation model's passed
 * fallback    no AI answer passed, so the rules' version (or an error) was shown
 * error       the API failed (bad key, timeout, outage) before any check could run
 * cache       served from the shared cache, no model call
 * reused      a near-duplicate task's earlier questions were reused, no model call
 * rejected    the request itself was malformed (incomplete answers, too large)
 * no-key      no Anthropic key was set up
 */
export type Outcome = "first-try" | "retry" | "fallback" | "error" | "cache" | "reused" | "rejected" | "no-key";
export const OUTCOMES: Outcome[] = ["first-try", "retry", "fallback", "error", "cache", "reused", "rejected", "no-key"];

export type RequestRecord = { at: number; step: string; outcome: Outcome; status: number; ms: number; calls: CallRecord[]; problems: string[]; error?: string };

/** Prices in US dollars per million tokens, from the guide's own table (src/lib/cost.ts, M04). */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};
/** Anthropic bills cache writes at 1.25× and cache reads at 0.1× the input price. */
const CACHE_WRITE = 1.25;
const CACHE_READ = 0.1;

/** Records kept in memory and on disk; the oldest go first. */
export const KEEP = 5000;
/** Most problems kept per request, each cut to this many characters. */
const MAX_PROBLEMS = 12;
const PROBLEM_CHARS = 240;

type Live = { calls: CallRecord[]; problems: string[] };
type State = { als: AsyncLocalStorage<Live>; records: RequestRecord[]; path?: string };

const KEY = Symbol.for("blueprint.telemetry");
const state: State = ((globalThis as Record<symbol, unknown>)[KEY] ??= { als: new AsyncLocalStorage<Live>(), records: [] }) as State;

/** Starts recording to a JSONL file, loading what is already there. Safe to call again with the same path. */
export function configureTelemetry(path: string) {
  if (state.path === path) return;
  state.path = path;
  try {
    const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
    const loaded = lines.flatMap((line) => {
      try {
        const r = JSON.parse(line) as RequestRecord;
        return r && typeof r.step === "string" && typeof r.at === "number" ? [r] : [];
      } catch {
        return [];
      }
    });
    state.records = loaded.slice(-KEEP);
    // Keep the file from growing without end.
    if (lines.length > KEEP * 2) writeFileSync(path, state.records.map((r) => JSON.stringify(r)).join("\n") + "\n");
  } catch {
    state.records = [];
  }
}

/** One model call, from server/ai.ts. Outside a tracked request (a test, a script), it is ignored. */
export function recordCall(call: CallRecord) {
  state.als.getStore()?.calls.push(call);
}

/** Checks an answer failed, from the steps. Outside a tracked request, ignored. */
export function noteProblems(problems: string[]) {
  const live = state.als.getStore();
  if (!live) return;
  for (const p of problems) if (live.problems.length < MAX_PROBLEMS) live.problems.push(p.replace(/\s+/g, " ").trim().slice(0, PROBLEM_CHARS));
}

/** How a request ended, from its response and the calls it made. */
export function classify(status: number, body: unknown, calls: CallRecord[], problems: string[]): Outcome {
  const b = (body && typeof body === "object" ? body : {}) as { source?: unknown; cached?: unknown; problems?: unknown };
  if (status === 503) return "no-key";
  if (status >= 400 && status < 500) return "rejected";
  if (status >= 500) return problems.length || Array.isArray(b.problems) ? "fallback" : "error";
  if (b.source === "similar") return "reused";
  if (!calls.length) return "cache";
  return calls.some((c) => c.attempt === "retry") ? "retry" : "first-try";
}

/**
 * Runs one request's handler with its calls and problems collected, then
 * records how it ended. A handler that throws is recorded as an error and the
 * error is passed on.
 */
export async function track<T extends { status: number; body: unknown }>(step: string, run: () => Promise<T>, now = () => Date.now()): Promise<T> {
  const live: Live = { calls: [], problems: [] };
  const start = now();
  const save = (status: number, body: unknown, error?: string) => {
    const b = (body && typeof body === "object" ? body : {}) as { error?: unknown };
    const record: RequestRecord = {
      at: start,
      step,
      outcome: error ? "error" : classify(status, body, live.calls, live.problems),
      status,
      ms: now() - start,
      calls: live.calls,
      problems: live.problems,
      ...(error ? { error } : typeof b.error === "string" ? { error: b.error.slice(0, PROBLEM_CHARS) } : {}),
    };
    state.records.push(record);
    if (state.records.length > KEEP) state.records.splice(0, state.records.length - KEEP);
    if (state.path) {
      try {
        mkdirSync(dirname(state.path), { recursive: true });
        appendFileSync(state.path, JSON.stringify(record) + "\n");
      } catch {
        /* telemetry that can't be saved is only lost, never a failed request */
      }
    }
  };
  try {
    const out = await state.als.run(live, run);
    save(out.status, out.body);
    return out;
  } catch (e) {
    save(500, null, (e as Error).message.slice(0, PROBLEM_CHARS));
    throw e;
  }
}

export function records(): RequestRecord[] {
  return state.records;
}

/** Forgets every record, in memory and on disk. */
export function clearTelemetry() {
  state.records = [];
  if (state.path) {
    try {
      writeFileSync(state.path, "");
    } catch {
      /* ignore */
    }
  }
}

/** A call's cost in US dollars at the guide's prices; 0 for a model it has no price for. */
export function callCost(c: CallRecord): number {
  const p = PRICES[c.model] ?? Object.entries(PRICES).find(([id]) => c.model.startsWith(id))?.[1];
  if (!p) return 0;
  return (c.input * p.input + c.cacheWrite * p.input * CACHE_WRITE + c.cacheRead * p.input * CACHE_READ + c.output * p.output) / 1_000_000;
}

export type StepSummary = {
  step: string;
  requests: number;
  outcomes: Record<Outcome, number>;
  calls: number;
  input: number;
  output: number;
  cost: number;
  /** Middle and 95th-percentile time of requests that called a model, in milliseconds. */
  medianMs: number | null;
  p95Ms: number | null;
};

export type TelemetrySummary = {
  since: number | null;
  requests: number;
  outcomes: Record<Outcome, number>;
  /** Of the requests a model answered (first try, retry, fallback): the share that passed first time, needed the retry, or failed. */
  answered: number;
  cost: number;
  steps: StepSummary[];
  models: { model: string; calls: number; input: number; output: number; cost: number }[];
  problems: { step: string; problem: string; count: number }[];
  recent: (Omit<RequestRecord, "calls"> & { models: string[]; input: number; output: number; cost: number })[];
};

const zero = (): Record<Outcome, number> => Object.fromEntries(OUTCOMES.map((o) => [o, 0])) as Record<Outcome, number>;

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

/** The page's numbers, from the records. Pure, so it can be tested. */
export function summarize(all: RequestRecord[], recentCount = 30): TelemetrySummary {
  const outcomes = zero();
  const steps = new Map<string, StepSummary & { times: number[] }>();
  const models = new Map<string, { model: string; calls: number; input: number; output: number; cost: number }>();
  const problems = new Map<string, { step: string; problem: string; count: number }>();
  let cost = 0;
  for (const r of all) {
    outcomes[r.outcome]++;
    const s = steps.get(r.step) ?? { step: r.step, requests: 0, outcomes: zero(), calls: 0, input: 0, output: 0, cost: 0, medianMs: null, p95Ms: null, times: [] };
    steps.set(r.step, s);
    s.requests++;
    s.outcomes[r.outcome]++;
    if (r.calls.length) s.times.push(r.ms);
    for (const c of r.calls) {
      const usd = callCost(c);
      const tokensIn = c.input + c.cacheRead + c.cacheWrite;
      s.calls++;
      s.input += tokensIn;
      s.output += c.output;
      s.cost += usd;
      cost += usd;
      const m = models.get(c.model) ?? { model: c.model, calls: 0, input: 0, output: 0, cost: 0 };
      models.set(c.model, m);
      m.calls++;
      m.input += tokensIn;
      m.output += c.output;
      m.cost += usd;
    }
    for (const p of r.problems) {
      const k = `${r.step}\u0000${p}`;
      const e = problems.get(k) ?? { step: r.step, problem: p, count: 0 };
      problems.set(k, e);
      e.count++;
    }
  }
  const order = ["split", "interview", "decide", "design", "kit", "tailor"];
  const rank = (x: string) => (order.includes(x) ? order.indexOf(x) : order.length);
  return {
    since: all.length ? all[0].at : null,
    requests: all.length,
    outcomes,
    answered: outcomes["first-try"] + outcomes.retry + outcomes.fallback,
    cost,
    steps: [...steps.values()]
      .sort((a, b) => rank(a.step) - rank(b.step) || a.step.localeCompare(b.step))
      .map(({ times, ...s }) => {
        const sorted = [...times].sort((a, b) => a - b);
        return { ...s, medianMs: percentile(sorted, 0.5), p95Ms: percentile(sorted, 0.95) };
      }),
    models: [...models.values()].sort((a, b) => b.cost - a.cost),
    problems: [...problems.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    recent: all
      .slice(-recentCount)
      .reverse()
      .map(({ calls, ...r }) => ({
        ...r,
        models: [...new Set(calls.map((c) => c.model))],
        input: calls.reduce((n, c) => n + c.input + c.cacheRead + c.cacheWrite, 0),
        output: calls.reduce((n, c) => n + c.output, 0),
        cost: calls.reduce((n, c) => n + callCost(c), 0),
      })),
  };
}
