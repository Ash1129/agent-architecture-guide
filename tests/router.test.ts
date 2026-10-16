import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../src/lib/questions";
import { href, parseHash } from "../src/lib/router";

describe("router", () => {
  it("reaches every question by its own URL", () => {
    // The guide's fixed pages (details, review, the jobs page) live under #/guide/ too,
    // so a question id must never be taken by one of them. A collision hides the question
    // behind a page that may have nothing to show (the jobs page without a proposal was blank).
    for (const q of QUESTIONS) {
      expect(parseHash(href({ name: "guide", q: q.id }))).toEqual({ name: "guide", q: q.id });
    }
  });

  it("keeps the fixed guide pages apart from the questions", () => {
    for (const route of [{ name: "details" }, { name: "review" }, { name: "split" }] as const) {
      expect(parseHash(href(route))).toEqual(route);
    }
  });
});
