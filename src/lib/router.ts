// A tiny hash router. Hash URLs work on any static host with no server rules,
// which keeps publishing simple.

import { useEffect, useState } from "react";
import { QUESTION_BY_ID, type QuestionId } from "./questions";

export type Route =
  | { name: "home" }
  | { name: "guide"; q: QuestionId }
  | { name: "result"; code?: string }
  | { name: "how"; section?: string }
  | { name: "history" };

export function parseHash(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "guide" && parts[1] && parts[1] in QUESTION_BY_ID) {
    return { name: "guide", q: parts[1] as QuestionId };
  }
  if (parts[0] === "guide") return { name: "guide", q: "task" };
  if (parts[0] === "result") {
    const code = new URLSearchParams(query).get("a") ?? undefined;
    return { name: "result", code };
  }
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
    case "result":
      return route.code ? `#/result?a=${route.code}` : "#/result";
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
