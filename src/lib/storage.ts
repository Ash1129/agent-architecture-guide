// Browser storage is a convenience only: progress survives a refresh on this
// device. Every access is guarded because storage can be unavailable.

import type { Answers } from "./questions";
import { decodeAnswers, encodeAnswers } from "./share";

const KEY = "aag:answers";

export function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(KEY);
    return (raw && decodeAnswers(raw)) || {};
  } catch {
    return {};
  }
}

export function saveAnswers(a: Answers) {
  try {
    if (Object.keys(a).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, encodeAnswers(a));
  } catch {
    /* storage unavailable: the guide still works for this visit */
  }
}

export type ThemePref = "light" | "dark";

export function loadTheme(): ThemePref {
  try {
    const t = localStorage.getItem("aag:theme");
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(t: ThemePref) {
  try {
    localStorage.setItem("aag:theme", t);
  } catch {
    /* ignore */
  }
}

/**
 * The questions the AI answered from the owner's own description on the start
 * page, until they confirm their answers. Kept so a reload doesn't lose which
 * answers were theirs and which were read from their words.
 */
const DESCRIBED = "aag:described";

export function loadDescribed(): string[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(DESCRIBED) ?? "null");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export function saveDescribed(ids: string[] | null) {
  try {
    if (ids) localStorage.setItem(DESCRIBED, JSON.stringify(ids));
    else localStorage.removeItem(DESCRIBED);
  } catch {
    /* ignore */
  }
}
