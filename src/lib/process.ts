// A process: several jobs that belong to one piece of work, such as screening
// applications and then scheduling interviews. Each job is designed on its own,
// by the same questions and rules as any other task, because jobs with
// different shapes need different systems. What the process adds is the
// handoffs between them: which job's result starts which, and through what.
//
// A described problem is split into jobs by the AI (server/split.ts); the split
// is checked here, shown for the owner to confirm, and each job then goes
// through the usual questions. The finished process travels in its own link.

import { MAX_DESCRIPTION } from "./interview";
import { type Answers, effectiveAnswers, isComplete } from "./questions";
import { fromBase64Url, resultCode, toBase64Url, validateAnswers } from "./share";

/** The most jobs one process is split into. */
export const MAX_JOBS = 4;
/** The longest description the start page reads for a split. */
export const MAX_PROCESS_DESCRIPTION = 12_000;
/** A job's own description, as the questions read it (the same as any described problem). */
export const MAX_JOB_DESCRIPTION = MAX_DESCRIPTION;

const LIMITS = { title: 120, processTitle: 80, via: 60, when: 160 };

/** One job of a process, as the split proposes it. */
export type Job = { title: string; description: string };
/** One job's result starting or feeding another. Jobs are numbered from 0. */
export type Handoff = { from: number; to: number; via: string; when: string };
export type Split = { title: string; jobs: Job[]; handoffs: Handoff[] };
export type SplitResponse = { split: Split; source: "ai" | "cache"; model?: string };

/** A finished process: every job's answers, and the handoffs between them. */
export type Process = { title: string; parts: Answers[]; handoffs: Handoff[] };

const str = (v: unknown, max: number, min = 1): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length >= min ? (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t) : undefined;
};

/** Keeps the handoffs that join two different, existing jobs, once per pair. */
function validateHandoffs(raw: unknown, count: number, base: 0 | 1): Handoff[] {
  if (!Array.isArray(raw)) return [];
  const out: Handoff[] = [];
  for (const h of raw) {
    if (!h || typeof h !== "object") continue;
    const r = h as Record<string, unknown>;
    const from = Number(r.from) - base;
    const to = Number(r.to) - base;
    const via = str(r.via, LIMITS.via);
    const when = str(r.when, LIMITS.when, 3);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= count || to >= count) continue;
    if (!via || !when || out.some((x) => x.from === from && x.to === to)) continue;
    out.push({ from, to, via, when });
  }
  return out;
}

/**
 * Checks the AI's split. Never throws: anything unusable comes back as a single
 * job (the whole description), which carries on exactly as before.
 * The model numbers jobs from 1; the split numbers them from 0.
 */
export function validateSplit(raw: unknown, description: string): Split {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = description.replace(/\s+/g, " ").trim();
  const jobs: Job[] = [];
  if (Array.isArray(r.jobs)) {
    for (const j of r.jobs) {
      if (jobs.length === MAX_JOBS || !j || typeof j !== "object") continue;
      const title = str((j as Job).title, LIMITS.title, 3);
      const desc = str((j as Job).description, MAX_JOB_DESCRIPTION, 10);
      if (title && desc && !jobs.some((x) => x.title.toLowerCase() === title.toLowerCase())) jobs.push({ title, description: desc });
    }
  }
  const title = str(r.title, LIMITS.processTitle, 3) ?? jobs[0]?.title ?? str(text, LIMITS.processTitle, 1) ?? "Your process";
  if (!jobs.length) return { title, jobs: [{ title: str(text, LIMITS.title, 1) ?? "Your task", description: text.slice(0, MAX_JOB_DESCRIPTION) }], handoffs: [] };
  return { title, jobs, handoffs: jobs.length > 1 ? validateHandoffs(r.handoffs, jobs.length, 1) : [] };
}

/** Whether a split found more than one job worth designing separately. */
export const isSplit = (s: Split) => s.jobs.length > 1;

/** Drops a job, renumbering the handoffs around it. */
export function removeJob(s: Split, index: number): Split {
  return {
    ...s,
    jobs: s.jobs.filter((_, i) => i !== index),
    handoffs: s.handoffs
      .filter((h) => h.from !== index && h.to !== index)
      .map((h) => ({ ...h, from: h.from > index ? h.from - 1 : h.from, to: h.to > index ? h.to - 1 : h.to })),
  };
}

// ------------------------------------------------------------------ links

/** Only the answers that apply, as in a result's own link. */
const tidy = (p: Process): Process => ({ title: p.title, parts: p.parts.map(effectiveAnswers), handoffs: p.handoffs });

export function processCode(p: Process): string {
  return toBase64Url(JSON.stringify(tidy(p)));
}

/** Reads a process link, validating every job's answers like a result link. Null unless every job is complete. */
export function decodeProcess(code: string): Process | null {
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.parts) || r.parts.length < 2 || r.parts.length > MAX_JOBS) return null;
  const parts = r.parts.map(validateAnswers);
  if (parts.some((a) => !a || !isComplete(a))) return null;
  return { title: str(r.title, LIMITS.processTitle, 1) ?? "Your process", parts: parts as Answers[], handoffs: validateHandoffs(r.handoffs, parts.length, 0) };
}

/** The process a job's answers belong to, and which job they are. */
export function partOf(p: Process | null | undefined, code: string): number {
  if (!p) return -1;
  return p.parts.findIndex((a) => resultCode(a) === code);
}

// ------------------------------------------------------------------ in progress

/**
 * A split being worked through: the confirmed jobs, which one is being
 * answered, and the answers finished so far. Kept so a reload carries on.
 */
export type ProcessDraft = { title: string; jobs: Job[]; handoffs: Handoff[]; current: number; done: Answers[] };

const DRAFT = "aag:process-draft";

export function loadDraft(): ProcessDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? "null") as ProcessDraft | null;
    if (!d || !Array.isArray(d.jobs) || d.jobs.length < 2 || !Array.isArray(d.done) || typeof d.current !== "number") return null;
    return d;
  } catch {
    return null;
  }
}

export function saveDraft(d: ProcessDraft | null) {
  try {
    if (d) localStorage.setItem(DRAFT, JSON.stringify(d));
    else localStorage.removeItem(DRAFT);
  } catch {
    /* storage unavailable: the draft lasts for this visit */
  }
}

// ------------------------------------------------------------------ saved processes

export type SavedProcess = { id: string; code: string; title: string; jobs: string[]; createdAt: number; updatedAt: number };

const SAVED = "aag:processes";
export const PROCESS_LIMIT = 20;

export function loadProcesses(): SavedProcess[] {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED) ?? "[]") as SavedProcess[];
    return Array.isArray(list) ? list.filter((e) => e && typeof e.id === "string" && decodeProcess(e.code)) : [];
  } catch {
    return [];
  }
}

function writeProcesses(list: SavedProcess[]) {
  try {
    localStorage.setItem(SAVED, JSON.stringify(list));
  } catch {
    /* storage full or unavailable */
  }
}

/** Saves a process, or updates the one saved under the same id. Most recent first. */
export function upsertProcess(id: string, p: Process, now = Date.now()): SavedProcess[] {
  const list = loadProcesses();
  const existing = list.find((e) => e.id === id);
  const code = processCode(p);
  if (existing?.code === code) return list;
  const entry: SavedProcess = { id, code, title: p.title, jobs: p.parts.map((a) => a.task ?? "Untitled job"), createdAt: existing?.createdAt ?? now, updatedAt: now };
  const next = [entry, ...list.filter((e) => e.id !== id)].slice(0, PROCESS_LIMIT);
  writeProcesses(next);
  return next;
}

export function clearProcesses() {
  try {
    localStorage.removeItem(SAVED);
  } catch {
    /* ignore */
  }
}

export function removeProcess(id: string): SavedProcess[] {
  const next = loadProcesses().filter((e) => e.id !== id);
  writeProcesses(next);
  return next;
}

/** Asks the local AI server to split a description into jobs. Throws with a readable message on failure. */
export async function fetchSplit(description: string, signal?: AbortSignal): Promise<SplitResponse> {
  const res = await fetch("./api/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<SplitResponse> & { error?: string };
  if (!res.ok || !data.split) throw new Error(res.status === 404 ? "Splitting isn't available on this copy of the site." : data.error ?? "The description couldn't be split.");
  return data as SplitResponse;
}

// ------------------------------------------------------------------ the process being looked at

const SYSTEM = "aag:system";

/** The process last opened, so its jobs' results show their place in it after a reload. */
export function loadSystem(): { id: string; code: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(SYSTEM) ?? "null") as { id?: unknown; code?: unknown } | null;
    return v && typeof v.id === "string" && typeof v.code === "string" && decodeProcess(v.code) ? { id: v.id, code: v.code } : null;
  } catch {
    return null;
  }
}

export function saveSystem(v: { id: string; code: string } | null) {
  try {
    if (v) localStorage.setItem(SYSTEM, JSON.stringify(v));
    else localStorage.removeItem(SYSTEM);
  } catch {
    /* ignore */
  }
}
