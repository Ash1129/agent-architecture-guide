// Adapted question plans in the browser: fetched from the local AI server once
// per task, then kept so going back and forth, or reloading, never asks again.

import { type InterviewResponse, normaliseTask } from "./interview";

const KEY = "aag:plans";
const LIMIT = 20;

type Saved = Record<string, InterviewResponse & { savedAt: number }>;

function readAll(): Saved {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return all && typeof all === "object" && !Array.isArray(all) ? all : {};
  } catch {
    return {};
  }
}

export function loadPlan(task: string): InterviewResponse | undefined {
  return readAll()[normaliseTask(task)];
}

export function savePlan(task: string, r: InterviewResponse) {
  try {
    const all = readAll();
    all[normaliseTask(task)] = { ...r, savedAt: Date.now() };
    const newest = Object.entries(all)
      .sort(([, x], [, y]) => y.savedAt - x.savedAt)
      .slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(newest)));
  } catch {
    /* storage unavailable: the plan is just fetched again next time */
  }
}

/** Asks the local AI server to adapt the questions. Throws with a readable message on failure. */
export async function fetchPlan(task: string, signal?: AbortSignal): Promise<InterviewResponse> {
  const res = await fetch("./api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<InterviewResponse> & { error?: string };
  if (!res.ok || !data.plan) throw new Error(res.status === 404 ? "AI questions aren't available on this copy of the site." : data.error ?? "The questions couldn't be adapted.");
  return data as InterviewResponse;
}
