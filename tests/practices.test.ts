import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { kitProblems } from "../src/lib/kitcheck";
import { practiceLines, practicesFor } from "../src/lib/practices";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";
import { allPaths } from "./paths";

// Build practices are written into BUILD.md only where the design has the
// feature they are about, and never change the recommendation itself.

const ids = (a: Answers) => {
  const r = recommend(a);
  return practicesFor(r, buildBlueprint(r, a), a).map((p) => p.id);
};

const fixed: Answers = { task: "File supplier invoices", shape: "rules", systems: "none", trigger: "manual", volume: "occasional", risks: ["none"], location: "open", team: "small" };
const emails: Answers = { task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible", "personal"], location: "open", team: "mid" };
const team: Answers = { ...emails, task: "Prepare client reports", roles: "specialists", risks: ["none"] };

describe("which practices apply", () => {
  it("asks only for the output form when nothing else in the design calls for more", () => {
    const got = ids(fixed);
    expect(got).toContain("P12");
    for (const id of ["P4", "P6", "P8", "P9", "P10", "P11"]) expect(got).not.toContain(id);
  });
  it("adds the AI, personal-data and conversation practices when the answers call for them", () => {
    const got = ids(emails);
    for (const id of ["P1", "P4", "P5", "P8", "P9", "P10", "P11", "P12"]) expect(got).toContain(id);
  });
  it("adds agent contracts only for a team of agents", () => {
    expect(ids(emails)).not.toContain("P6");
    const r = recommend(team);
    if (r.approach.id === "multi") expect(ids(team)).toContain("P6");
  });
  it("adds the approval and correction practices wherever a person steps in", () => {
    const got = ids({ ...emails, requirements: ["approval"] });
    expect(got).toContain("P2");
    expect(got).toContain("P3");
  });
  it("keeps a fixed order and gives every practice a test", () => {
    for (const a of allPaths().slice(0, 200)) {
      const r = recommend(a);
      const list = practicesFor(r, buildBlueprint(r, a), a);
      const nums = list.map((p) => Number(p.id.slice(1)));
      expect(nums).toEqual([...nums].sort((x, y) => x - y));
      for (const p of list) expect(p.test.length).toBeGreaterThan(20);
      if (!r.models.needed) for (const id of ["P4", "P8", "P10", "P11"]) expect(list.map((p) => p.id)).not.toContain(id);
      if (list.some((p) => p.id === "P6")) expect(r.approach.id).toBe("multi");
    }
  });
});

describe("in the kit", () => {
  it("writes the section into BUILD.md with each practice and its test, and the kit still passes its checks", () => {
    const r = recommend(emails);
    const bp = buildBlueprint(r, emails);
    const kit = buildStarterKit(r, bp, emails);
    const brief = kit.files[0].content;
    expect(brief).toContain("## Build these in from the first version");
    for (const line of practiceLines(r, bp, emails)) expect(brief).toContain(line);
    expect(brief.indexOf("## Safeguards to build in")).toBeLessThan(brief.indexOf("## Build these in from the first version"));
    expect(brief.indexOf("## Build these in from the first version")).toBeLessThan(brief.indexOf("## Build plan"));
    expect(kitProblems(r, bp, emails, kit)).toEqual([]);
  });
  it("never names a model, a product or a long dash", () => {
    const r = recommend(emails);
    const text = practiceLines(r, buildBlueprint(r, emails), { ...emails, requirements: ["approval"] }).join("\n");
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/claude|opus|sonnet|haiku|gpt|n8n|langgraph/i);
  });
  it("does not change the recommendation", () => {
    const before = JSON.stringify(recommend(emails));
    const r = recommend(emails);
    practicesFor(r, buildBlueprint(r, emails), emails);
    expect(JSON.stringify(r)).toBe(before);
  });
});
