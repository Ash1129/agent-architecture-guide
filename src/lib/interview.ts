// The adaptive interview. An AI model reads the task and adapts the guide's
// questions to it: plainer wording in the task's own terms, a suggested answer
// where the task makes one likely, and up to three task-specific questions.
//
// The question bank stays the backbone. Every adapted question keeps its id
// and its exact set of answer values, in the original order, so the rules,
// share links and history work unchanged. validatePlan is the layer that
// enforces this: anything the model returns that doesn't fit falls back,
// question by question, to the standard wording.

import { type Answers, type Question, type QuestionId, QUESTIONS, effectiveAnswers } from "./questions";

export type AdaptedOption = { value: string; label: string; hint?: string };

export type AdaptedQuestion = {
  id: QuestionId;
  title: string;
  help?: string;
  options: AdaptedOption[];
  /** The model's likely answer, pre-selected but always changeable. */
  suggested?: string | string[];
  /** Why the model suggests it, in the task's terms. */
  reason?: string;
};

export type DetailQuestion = {
  id: string;
  title: string;
  help?: string;
  kind: "single" | "multi" | "text";
  options?: string[];
};

export type InterviewPlan = {
  /** The task as the model understood it, in one sentence. */
  summary: string;
  questions: Partial<Record<QuestionId, AdaptedQuestion>>;
  details: DetailQuestion[];
};

/** Where a plan came from, so the guide can say so. */
export type PlanSource = "ai" | "cache" | "similar";

export type InterviewResponse = { plan: InterviewPlan; source: PlanSource; similarTo?: string; model?: string };

/** One answered task-specific question. Travels with the answers. */
export type Detail = { q: string; a: string };

export const MAX_DETAILS = 3;
const LIMITS = { title: 160, help: 240, label: 120, hint: 200, reason: 200, summary: 200, detailOption: 80, detailAnswer: 300 };

const str = (v: unknown, max: number, min = 1): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length >= min && t.length <= max ? t : undefined;
};

/** The questions a plan may adapt: every choice question in the bank. */
export const ADAPTABLE = QUESTIONS.filter((q) => q.kind !== "text");

function validateQuestion(q: Question, raw: unknown): AdaptedQuestion | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const values = q.options!.map((o) => o.value);

  // Options must be exactly the bank's values. Wording is checked per option;
  // the order is always the bank's, so number keys stay predictable.
  let options: AdaptedOption[] = q.options!.map((o) => ({ value: o.value, label: o.label, ...(o.hint ? { hint: o.hint } : {}) }));
  if (Array.isArray(r.options)) {
    const byValue = new Map<string, Record<string, unknown>>();
    for (const o of r.options) if (o && typeof o === "object" && typeof (o as { value?: unknown }).value === "string") byValue.set((o as { value: string }).value, o as Record<string, unknown>);
    const sameSet = byValue.size === values.length && values.every((v) => byValue.has(v)) && r.options.length === values.length;
    if (sameSet) {
      options = options.map((o) => {
        const a = byValue.get(o.value)!;
        const label = str(a.label, LIMITS.label, 2);
        const hint = str(a.hint, LIMITS.hint);
        return label ? { value: o.value, label, ...(hint ? { hint } : {}) } : o;
      });
    }
  }

  let suggested: string | string[] | undefined;
  if (q.kind === "single" && typeof r.suggested === "string" && values.includes(r.suggested)) suggested = r.suggested;
  if (q.kind === "multi" && Array.isArray(r.suggested)) {
    const picked = [...new Set(r.suggested.filter((x): x is string => typeof x === "string" && values.includes(x)))];
    if (picked.length) suggested = q.exclusive && picked.includes(q.exclusive) ? [q.exclusive] : picked;
  }

  const help = str(r.help, LIMITS.help);
  const reason = suggested ? str(r.reason, LIMITS.reason) : undefined;
  return {
    id: q.id,
    title: str(r.title, LIMITS.title, 5) ?? q.title,
    ...(help ? { help } : q.help ? { help: q.help } : {}),
    options,
    ...(suggested ? { suggested } : {}),
    ...(reason ? { reason } : {}),
  };
}

function validateDetails(raw: unknown): DetailQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: DetailQuestion[] = [];
  for (const d of raw) {
    if (out.length === MAX_DETAILS || !d || typeof d !== "object") continue;
    const r = d as Record<string, unknown>;
    const title = str(r.title, LIMITS.title, 5);
    const kind = r.kind === "single" || r.kind === "multi" || r.kind === "text" ? r.kind : undefined;
    if (!title || !kind) continue;
    const options = Array.isArray(r.options) ? [...new Set(r.options.map((o) => str(o, LIMITS.detailOption)).filter((o): o is string => !!o))].slice(0, 6) : [];
    if (kind !== "text" && options.length < 2) continue;
    const help = str(r.help, LIMITS.help);
    out.push({ id: `d${out.length + 1}`, title, kind, ...(help ? { help } : {}), ...(kind !== "text" ? { options } : {}) });
  }
  return out;
}

/**
 * Checks a model's plan against the question bank and keeps only what fits.
 * Never throws: an unusable plan comes back as the standard questions.
 */
export function validatePlan(raw: unknown): InterviewPlan {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawQuestions = Array.isArray(r.questions)
    ? Object.fromEntries(r.questions.filter((q) => q && typeof q === "object").map((q) => [(q as { id?: unknown }).id, q]))
    : r.questions && typeof r.questions === "object"
      ? (r.questions as Record<string, unknown>)
      : {};
  const questions: InterviewPlan["questions"] = {};
  for (const q of ADAPTABLE) {
    const v = validateQuestion(q, rawQuestions[q.id]);
    if (v) questions[q.id] = v;
  }
  return { summary: str(r.summary, LIMITS.summary) ?? "", questions, details: validateDetails(r.details) };
}

/** The question as the guide should show it: adapted wording if the plan has it, the bank's otherwise. */
export function adaptQuestion(q: Question, plan?: InterviewPlan): Question & { suggested?: string | string[]; reason?: string } {
  const a = plan?.questions[q.id];
  if (!a || !q.options) return q;
  const bank = new Map(q.options.map((o) => [o.value, o]));
  return {
    ...q,
    title: a.title,
    help: a.help,
    options: a.options.map((o) => ({ ...bank.get(o.value)!, label: o.label, hint: o.hint })),
    suggested: a.suggested,
    reason: a.reason,
  };
}


/** Validates details carried in answers or links. */
export function validateDetailAnswers(v: unknown): Detail[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: Detail[] = [];
  for (const d of v.slice(0, MAX_DETAILS)) {
    const q = str((d as Detail)?.q, LIMITS.title, 5);
    const a = str((d as Detail)?.a, LIMITS.detailAnswer);
    if (q && a) out.push({ q, a });
  }
  return out;
}

/** The longest problem description the start page sends to be read (the survey's task stays a short title). */
export const MAX_DESCRIPTION = 600;
/** The longest task title, as carried in answers and share links. */
export const MAX_TASK_TITLE = 200;

/**
 * The task title for a description: the description itself when it's short
 * enough, otherwise the AI's one-sentence summary of it.
 */
export function taskTitle(description: string, plan?: InterviewPlan): string {
  const text = description.replace(/\s+/g, " ").trim();
  if (text.length <= MAX_TASK_TITLE) return text;
  return plan?.summary?.trim() || `${text.slice(0, MAX_TASK_TITLE - 1).trimEnd()}…`;
}

/**
 * Answers every question the plan's suggestions settle, for a problem the owner
 * described in their own words. Suggestions are only made where the description
 * makes the answer clearly likely (see the interview instructions), so the rest
 * stay open to be asked. Answers to questions that don't apply are dropped.
 */
export function fillFromPlan(task: string, plan: InterviewPlan): { answers: Answers; filled: QuestionId[] } {
  const all: Answers = { task };
  for (const q of ADAPTABLE) {
    const s = plan.questions[q.id]?.suggested;
    if (s !== undefined && (!Array.isArray(s) || s.length > 0)) (all as Record<string, unknown>)[q.id] = s;
  }
  const answers = { ...effectiveAnswers(all), task };
  const filled = (Object.keys(answers) as QuestionId[]).filter((id) => id !== "task" && (id as string) !== "details");
  return { answers, filled };
}

/** The task as a cache key: case, spacing and punctuation don't make a new task. */
export function normaliseTask(task: string): string {
  return task
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text lines for the details, for prompts and exports. */
export function detailLines(a: Answers): string[] {
  return (a.details ?? []).map((d) => `- ${d.q} ${d.a}`);
}
