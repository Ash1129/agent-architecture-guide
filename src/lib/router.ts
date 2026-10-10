// A tiny hash router. Hash URLs work on any static host with no server rules,
// which keeps publishing simple.

import { useEffect, useState } from "react";
import { QUESTION_BY_ID, type QuestionId } from "./questions";

/** The three views of a result: what's recommended, what to build, and how it works. */
export type ResultView = "solution" | "build" | "workflow";
const VIEWS: ResultView[] = ["solution", "build", "workflow"];

export type Route =
  | { name: "home" }
  | { name: "guide"; q: QuestionId }
  | { name: "details" }
  /** The answers at a glance, after a problem was described on the start page. */
  | { name: "review" }
  /** A described problem read as several jobs, for the owner to confirm. */
  | { name: "split" }
  /** Several jobs designed as one process, joined by their handoffs. */
  | { name: "process"; code?: string }
  | { name: "result"; code?: string; view?: ResultView }
  | { name: "how"; section?: string }
  | { name: "history" };

export function parseHash(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "guide" && parts[1] === "details") return { name: "details" };
  if (parts[0] === "guide" && parts[1] === "review") return { name: "review" };
  if (parts[0] === "guide" && parts[1] === "split") return { name: "split" };
  if (parts[0] === "guide" && parts[1] && parts[1] in QUESTION_BY_ID) {
    return { name: "guide", q: parts[1] as QuestionId };
  }
  if (parts[0] === "guide") return { name: "guide", q: "task" };
  if (parts[0] === "result") {
    const params = new URLSearchParams(query);
    const code = params.get("a") ?? undefined;
    const v = params.get("v") as ResultView | null;
    return { name: "result", code, ...(v && VIEWS.includes(v) && v !== "solution" ? { view: v } : {}) };
  }
  if (parts[0] === "process") return { name: "process", code: new URLSearchParams(query).get("p") ?? undefined };
  if (parts[0] === "how") return { name: "how", section: parts[1] };
  if (parts[0] === "history") return { name: "history" };
  return { name: "home" };
}

export function href(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "guide":
      return `#/guide/${route.q}`;
    case "details":
      return "#/guide/details";
    case "review":
      return "#/guide/review";
    case "split":
      return "#/guide/split";
    case "process":
      return route.code ? `#/process?p=${route.code}` : "#/process";
    case "result": {
      const q = [route.code && `a=${route.code}`, route.view && route.view !== "solution" && `v=${route.view}`].filter(Boolean).join("&");
      return q ? `#/result?${q}` : "#/result";
    }
    case "how":
      return route.section ? `#/how/${route.section}` : "#/how";
    case "history":
      return "#/history";
  }
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

/** Update the address bar without adding a history entry or re-rendering. */
export function replaceHash(route: Route) {
  const url = new URL(window.location.href);
  url.hash = href(route);
  window.history.replaceState(null, "", url);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
