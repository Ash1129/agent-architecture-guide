// Saved results, kept only in this browser. Each entry is one task: editing a
// result's answers updates its entry, starting a new task makes a new one.
// The answers themselves are stored (as the same code a share link uses), so
// reopening always runs the current rules rather than a stale snapshot.

import { MODELS } from "./models";
import { buildBlueprint, modelPlan } from "./blueprint";
import { TOOLS } from "./catalog";
import { type Answers, isComplete } from "./questions";
import { recommend } from "./rules";
import { decodeAnswers, resultCode } from "./share";

export type HistoryEntry = {
  id: string;
  code: string;
  task: string;
  approach: "automation" | "workflow" | "agent" | "multi";
  /** Short facts for the list; recomputed whenever the entry is saved. */
  models: string;
  tool: string;
  autonomy: number;
  steps: number;
  createdAt: number;
  updatedAt: number;
};

const KEY = "aag:history";
const SESSION_KEY = "aag:session";
export const HISTORY_LIMIT = 50;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(): Store | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadHistory(s: Store | null = store()): HistoryEntry[] {
  try {
    const raw = s?.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    // Keep only entries whose answers still decode into a complete result.
    return Array.isArray(list) ? list.filter((e) => e && typeof e.id === "string" && decodeAnswers(e.code) && isComplete(decodeAnswers(e.code)!)) : [];
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[], s: Store | null) {
  try {
    s?.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or unavailable: history simply isn't kept this visit */
  }
}

export function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadSessionId(s: Store | null = store()): string {
  try {
    const id = s?.getItem(SESSION_KEY);
    if (id) return id;
  } catch {
    /* ignore */
  }
  const id = newSessionId();
  saveSessionId(id, s);
  return id;
}

export function saveSessionId(id: string, s: Store | null = store()) {
  try {
    s?.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

export function summarise(a: Answers): Omit<HistoryEntry, "id" | "createdAt" | "updatedAt"> {
  const r = recommend(a);
  const bp = buildBlueprint(r, a);
  const plan = modelPlan(bp);
  return {
    code: resultCode(a),
    task: r.task || "Untitled task",
    approach: r.approach.id,
    models: plan.models.length
      ? plan.models.map((g) => (g.engine.kind === "model" ? MODELS[g.engine.model].short : g.engine.short)).join(" + ")
      : `No AI: ${(plan.methods.find((g) => g.engine.short !== "Scripted action") ?? plan.methods[0])?.engine.short ?? "fixed rules"}`,
    tool: TOOLS[r.tools.find((t) => t.core)!.tool].name,
    autonomy: r.autonomy.level,
    steps: bp.nodes.length,
  };
}

/** Save or update the entry for this session. Most recent first. */
export function upsertHistory(id: string, a: Answers, s: Store | null = store(), now = Date.now()): HistoryEntry[] {
  if (!isComplete(a)) return loadHistory(s);
  const list = loadHistory(s);
  const existing = list.find((e) => e.id === id);
  const summary = summarise(a);
  if (existing && existing.code === summary.code) return list;
  const entry: HistoryEntry = { ...summary, id, createdAt: existing?.createdAt ?? now, updatedAt: now };
  const next = [entry, ...list.filter((e) => e.id !== id)].slice(0, HISTORY_LIMIT);
  write(next, s);
  return next;
}

export function removeHistory(id: string, s: Store | null = store()): HistoryEntry[] {
  const next = loadHistory(s).filter((e) => e.id !== id);
  write(next, s);
  return next;
}

export function clearHistory(s: Store | null = store()) {
  try {
    s?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** The saved entry for a shared link's answers, if this browser has seen them before. */
export function findByCode(code: string, s: Store | null = store()): HistoryEntry | undefined {
  return loadHistory(s).find((e) => e.code === code);
}

/** Put a just-deleted entry back where it was (for Undo). */
export function restoreHistory(entry: HistoryEntry, index: number, s: Store | null = store()): HistoryEntry[] {
  const list = loadHistory(s).filter((e) => e.id !== entry.id);
  list.splice(Math.min(index, list.length), 0, entry);
  const next = list.slice(0, HISTORY_LIMIT);
  write(next, s);
  return next;
}
