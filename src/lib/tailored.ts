// AI-tailored n8n workflows, kept only in this browser so reopening a result
// doesn't need another multi-minute call. Each one is stored under the
// result's code and a fingerprint of the generated workflow it improved: if
// the rules later generate a different workflow, the old tailoring is dropped.

import type { Answers } from "./questions";
import { resultCode } from "./share";

export type SavedTailoring = {
  /** The tailored workflow JSON, as shown and copied. */
  content: string;
  model: string;
  /** Fingerprint of the generated workflow this was tailored from. */
  base: string;
  savedAt: number;
};

const KEY = "aag:tailored";
/** Workflows are about 30 KB each; keep the newest few well inside storage limits. */
export const TAILORED_LIMIT = 20;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(): Store | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** A short, stable fingerprint of a text (FNV-1a). Not for security. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function readAll(s: Store | null): Record<string, SavedTailoring> {
  try {
    const raw = s?.getItem(KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all && typeof all === "object" && !Array.isArray(all) ? all : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, SavedTailoring>, s: Store | null) {
  try {
    s?.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable: the tailoring just isn't kept this visit */
  }
}

/** The saved tailoring for these answers, if it was made from this generated workflow. */
export function loadTailored(a: Answers, generated: string, s: Store | null = store()): SavedTailoring | undefined {
  const t = readAll(s)[resultCode(a)];
  if (!t || typeof t.content !== "string" || t.base !== fingerprint(generated)) return undefined;
  return t;
}

export function saveTailored(
  a: Answers,
  generated: string,
  t: { content: string; model: string },
  s: Store | null = store(),
  now = Date.now(),
) {
  const all = readAll(s);
  all[resultCode(a)] = { ...t, base: fingerprint(generated), savedAt: now };
  const newest = Object.entries(all)
    .sort(([, x], [, y]) => y.savedAt - x.savedAt)
    .slice(0, TAILORED_LIMIT);
  writeAll(Object.fromEntries(newest), s);
}

/** Remove and return the tailoring saved under a result code (for deleting with Undo). */
export function takeTailored(code: string, s: Store | null = store()): SavedTailoring | undefined {
  const all = readAll(s);
  const t = all[code];
  if (!t) return undefined;
  delete all[code];
  writeAll(all, s);
  return t;
}

/** Put back a tailoring removed by takeTailored. */
export function putTailored(code: string, t: SavedTailoring, s: Store | null = store()) {
  writeAll({ ...readAll(s), [code]: t }, s);
}

export function clearTailored(s: Store | null = store()) {
  try {
    s?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
