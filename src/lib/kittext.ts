// The AI-written parts of the starter kit. The kit's structure stays
// deterministic (src/lib/starter.ts): the step table, models, safeguards,
// embedded files, n8n wiring and Skill frontmatter all come from the design
// and the rules. The model writes the task-specific text that was placeholders
// or generic before: the business context, rules and output format in the
// system prompt, specialist briefs, notes for the builder, pitfalls grounded
// in the knowledge base, illustrative test cases, and the Skill's trigger.
//
// checkKitText checks each section on its own and drops any that doesn't fit,
// so the kit falls back to the template for that section only.

import type { Blueprint } from "./blueprint";
import type { KbChunk } from "./design";
import type { Recommendation } from "./rules";

export type KitText = {
  /** One or two sentences on the business and the work, for the system prompt. */
  context?: string;
  /** Task-specific rules, added to the system prompt's fixed safety rules. */
  rules?: string[];
  /** The exact output format, with one short example. */
  output?: string;
  /** Briefs for the agents in a multi-agent design, by step id. */
  briefs?: Record<string, string>;
  /** A short overview for BUILD.md. */
  overview?: string;
  /** Task-specific notes for whoever builds it. */
  buildNotes?: string[];
  /** Extra things to ask the owner for. */
  ownerAsks?: string[];
  /** Task-specific pitfalls, each grounded in knowledge-base chunks. */
  watchOut?: { title: string; body: string; kb: string[] }[];
  /** Illustrative test cases, to be replaced by real ones. */
  examples?: { input: string; good: string; notes?: string }[];
  /** When the Skill should be used, in one line. */
  skillDescription?: string;
};

export type KitResponse = { text: KitText; design: "ai" | "rules"; source: "ai" | "cache"; model?: string; dropped: string[] };

// Hard limits sit a little above what the model is asked for (server/kit.ts), so a
// near miss isn't thrown away.
const L = { context: 500, rule: 240, output: 2000, brief: 800, overview: 800, note: 300, ask: 240, title: 100, body: 400, cell: 360, skill: 300 };
const MAX = { rules: 8, notes: 6, asks: 5, watch: 4, examplesMin: 3, examplesMax: 8 };

/** Things the AI may never write: model names (the rules pick models), links, or anything like a key. */
const FORBIDDEN: [RegExp, string][] = [
  [/\b(claude|gpt-?\d|openai|opus|sonnet|haiku|gemini|llama|qwen|mistral|deepseek|kimi|glm)\b/i, "names a model or AI company; the guide's rules choose the models"],
  [/https?:\/\/|www\./i, "contains a link"],
  [/\bsk-[A-Za-z0-9_-]{8,}/, "contains something that looks like a key"],
];

/** The kit avoids long dashes; replace them rather than reject good text ("20\u201350" becomes "20 to 50"). */
const tidy = (s: string) =>
  s
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/\r/g, "");

function clean(v: unknown, max: number, multiline = false): string | undefined {
  if (typeof v !== "string") return undefined;
  let t = tidy(v).trim();
  if (!multiline) t = t.replace(/\s+/g, " ");
  return t && t.length <= max ? t : undefined;
}

export type KitContext = { r: Recommendation; bp: Blueprint; chunks: KbChunk[]; briefIds: string[] };

/** Keeps every section that fits; lists what was dropped and why. */
export function checkKitText(raw: unknown, ctx: KitContext): { text: KitText; dropped: string[] } {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const dropped: string[] = [];
  const text: KitText = {};
  const ok = (field: string, value: string | undefined, why = "is missing, empty or too long") => {
    if (value === undefined) {
      if (r[field] !== undefined) dropped.push(`${field} ${why}`);
      return false;
    }
    const bad = FORBIDDEN.find(([re]) => re.test(value));
    if (bad) dropped.push(`${field} ${bad[1]}`);
    return !bad;
  };
  const list = (field: string, max: number, len: number) => {
    const v = r[field];
    if (v === undefined) return undefined;
    if (!Array.isArray(v)) return void dropped.push(`${field} is not a list`);
    const items = v.slice(0, max).map((x) => clean(x, len));
    if (items.some((x) => x === undefined)) return void dropped.push(`${field} has an empty or too long item`);
    const bad = items.find((x) => FORBIDDEN.some(([re]) => re.test(x!)));
    if (bad) return void dropped.push(`${field} ${FORBIDDEN.find(([re]) => re.test(bad))![1]}`);
    return items.length ? (items as string[]) : undefined;
  };

  // Text for AI steps only makes sense when the design uses AI.
  if (ctx.r.models.needed) {
    const context = clean(r.context, L.context);
    if (ok("context", context)) text.context = context;
    const rules = list("rules", MAX.rules, L.rule);
    if (rules) text.rules = rules;
    const output = clean(r.output, L.output, true);
    if (ok("output", output)) text.output = output;
    if (r.briefs && typeof r.briefs === "object") {
      const briefs: Record<string, string> = {};
      for (const [id, b] of Object.entries(r.briefs as Record<string, unknown>)) {
        if (!ctx.briefIds.includes(id)) {
          dropped.push(`briefs.${id} is not an agent in this design`);
          continue;
        }
        const t = clean(b, L.brief);
        if (ok(`briefs.${id}`, t)) briefs[id] = t!;
      }
      if (Object.keys(briefs).length) text.briefs = briefs;
    }
    const skill = clean(r.skillDescription, L.skill);
    if (ok("skillDescription", skill)) text.skillDescription = skill;
  } else {
    for (const f of ["context", "rules", "output", "briefs", "skillDescription"]) if (r[f] !== undefined) dropped.push(`${f} is for AI steps, and this design has none`);
  }

  const overview = clean(r.overview, L.overview);
  if (ok("overview", overview)) text.overview = overview;
  const notes = list("buildNotes", MAX.notes, L.note);
  if (notes) text.buildNotes = notes;
  const asks = list("ownerAsks", MAX.asks, L.ask);
  if (asks) text.ownerAsks = asks;

  if (Array.isArray(r.watchOut)) {
    const allowed = new Set(ctx.chunks.map((c) => c.id));
    const items: NonNullable<KitText["watchOut"]> = [];
    for (const [i, w] of r.watchOut.slice(0, MAX.watch).entries()) {
      const x = (w ?? {}) as Record<string, unknown>;
      const title = clean(x.title, L.title);
      const body = clean(x.body, L.body);
      const kb = Array.isArray(x.kb) ? x.kb.filter((k): k is string => typeof k === "string" && allowed.has(k)) : [];
      if (!title || !body || !kb.length) {
        dropped.push(`watchOut ${i + 1} ${!title ? `needs a title up to ${L.title} characters` : !body ? `needs a body up to ${L.body} characters` : "must cite a KNOWLEDGE chunk it was given"}`);
        continue;
      }
      if (ok(`watchOut ${i + 1}`, `${title} ${body}`)) items.push({ title, body, kb: [...new Set(kb)] });
    }
    if (items.length) text.watchOut = items;
  }

  if (Array.isArray(r.examples)) {
    // A case needs an input and a good result; a note that doesn't fit is just left off.
    const complete = r.examples.slice(0, MAX.examplesMax).flatMap((e) => {
      const x = (e ?? {}) as Record<string, unknown>;
      const input = clean(x.input, L.cell);
      const good = clean(x.good, L.cell);
      const notes = clean(x.notes, L.cell);
      return input && good ? [{ input, good, ...(notes ? { notes } : {}) }] : [];
    });
    if (complete.length < MAX.examplesMin) dropped.push(`examples needs at least ${MAX.examplesMin} complete cases`);
    else if (ok("examples", complete.map((x) => `${x.input} ${x.good} ${x.notes ?? ""}`).join(" "))) text.examples = complete;
  }
  return { text, dropped };
}

/** A CSV cell, quoted when it needs to be. */
export const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
