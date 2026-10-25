// Page views for Vercel Web Analytics on the published site.
//
// The site is hash-routed, so the analytics script on its own would only ever
// see "/". Each route is reported as a path of its own instead, and only the
// route's shape leaves the browser: the result and process links carry the
// owner's answers (including the task description) after the "?" in the hash,
// and that part is never sent.

import type { BeforeSendEvent } from "@vercel/analytics/react";
import type { Route } from "./router";

/** What a route is counted as: `path` is the page, `route` groups the pages that share a shape. */
export type Page = { route: string; path: string };

export function pageOf(route: Route): Page {
  switch (route.name) {
    case "home":
      return { route: "/", path: "/" };
    case "guide":
      // Question ids are a fixed set (parseHash only accepts known ones), so the id is safe to report.
      return { route: "/guide/[q]", path: `/guide/${route.q}` };
    case "details":
      return { route: "/guide/details", path: "/guide/details" };
    case "review":
      return { route: "/guide/review", path: "/guide/review" };
    case "split":
      return { route: "/guide/jobs", path: "/guide/jobs" };
    case "process":
      return { route: "/process", path: "/process" };
    case "result":
      return { route: "/result", path: "/result" };
    case "how":
      // Sections are anchors on one page; the section is not reported.
      return { route: "/how", path: "/how" };
    case "history":
      return { route: "/history", path: "/history" };
  }
}

/**
 * The script reports the page's full URL, hash included, even when given a path.
 * This keeps the origin and path only, so neither the hash query (the answers)
 * nor any search string is ever sent.
 */
export function routeOnly(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.href };
}
