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
