import { describe, expect, it } from "vitest";
import { pageOf, routeOnly } from "../src/lib/analytics";
import { QUESTIONS } from "../src/lib/questions";
import { parseHash, type Route } from "../src/lib/router";

describe("analytics", () => {
  it("counts each route as a page of its own, with nothing after the path", () => {
    const routes: Route[] = [
      { name: "home" },
      { name: "details" },
      { name: "review" },
      { name: "split" },
      { name: "process", code: "secret-answers" },
      { name: "result", code: "secret-answers", view: "build" },
      { name: "how", section: "sources" },
      { name: "history" },
    ];
    const paths = routes.map((r) => pageOf(r).path);
    expect(paths).toEqual(["/", "/guide/details", "/guide/review", "/guide/jobs", "/process", "/result", "/how", "/history"]);
    for (const r of routes) {
      const page = pageOf(r);
      expect(page.path).not.toMatch(/[?#]|secret/);
      expect(page.route).not.toMatch(/[?#]|secret/);
    }
  });

  it("reports each question under one route", () => {
    for (const q of QUESTIONS) {
      expect(pageOf({ name: "guide", q: q.id })).toEqual({ route: "/guide/[q]", path: `/guide/${q.id}` });
    }
  });

  it("never sends the answers carried in a shared link", () => {
    // What the script would report for a result link opened from a share, with the path already applied.
    for (const hash of ["#/result?a=THE-ANSWERS&v=build", "#/process?p=THE-ANSWERS", "#/"]) {
      expect(parseHash(hash).name).toBeDefined();
      const sent = routeOnly({ type: "pageview", url: `https://www.blueprintstudio.me/result${hash}` });
      expect(sent).toEqual({ type: "pageview", url: "https://www.blueprintstudio.me/result" });
    }
    expect(routeOnly({ type: "event", url: "https://www.blueprintstudio.me/?utm=x#/result?a=THE-ANSWERS" }).url).toBe("https://www.blueprintstudio.me/");
  });
});
