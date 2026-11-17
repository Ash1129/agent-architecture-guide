// A brief for a system that reads documents, computes from them and decides
// (with clear cases passing and the rest going to people) was run through the
// guide. What it lacked was general, and is now seven build practices (P17 to
// P23) backed by three researched chunks (V01 to V03). Nothing here is about
// one industry: each practice switches on from a feature of the design.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { practicesFor } from "../src/lib/practices";
import type { Answers } from "../src/lib/questions";
import { RULES, recommend } from "../src/lib/rules";
import { INSTRUCTIONS } from "../server/design";
import { allPaths } from "./paths";

const ids = (a: Answers) => {
  const r = recommend(a);
  return practicesFor(r, buildBlueprint(r, a), a).map((p) => p.id);
};
const NEW = ["P17", "P18", "P19", "P20", "P21", "P22", "P23"];

const filing: Answers = { task: "File supplier invoices", shape: "rules", systems: "none", trigger: "manual", volume: "occasional", risks: ["none"], location: "open", team: "small" };
const reading: Answers = { task: "Check submitted claims", shape: "judgement", kinds: "yes", split: "sections", quality: "clear", knowledge: ["playbook", "reference"], systems: "none", trigger: "event", volume: "high", risks: ["personal", "irreversible", "decides"], location: "open", team: "large" };
const drafting: Answers = { task: "Draft weekly notes", shape: "judgement", kinds: "no", split: "sequential", quality: "partly", knowledge: ["none"], systems: "none", trigger: "manual", volume: "occasional", risks: ["none"], location: "open", team: "small" };

describe("practices for reading, deciding and proving it", () => {
  it("adds none of them to plain filing with no AI, no decision and nothing at stake", () => {
    const got = ids(filing);
    for (const id of NEW) expect(got).not.toContain(id);
  });
  it("adds all of them to a high-volume design that reads documents and decides about people", () => {
    const got = ids(reading);
    for (const id of NEW) expect(got).toContain(id);
  });
  it("asks AI steps for sources and code for the sums wherever AI is used, and for enough cases", () => {
    const got = ids(drafting);
    expect(got).toContain("P17");
    expect(got).toContain("P21");
    expect(got).not.toContain("P20");
    expect(got).not.toContain("P22");
  });
  it("holds each practice to the feature it is about, on every path", () => {
    for (const a of allPaths().slice(0, 400)) {
      const r = recommend(a);
      const bp = buildBlueprint(r, a);
      const got = practicesFor(r, bp, a).map((p) => p.id);
      const decision = bp.nodes.some((n) => n.kind === "decision");
      const stake = !!a.risks?.includes("decides") || !!a.risks?.includes("irreversible");
      expect(got.includes("P17")).toBe(r.models.needed);
      expect(got.includes("P22")).toBe(stake);
      if (got.includes("P18")) expect(decision).toBe(true);
      if (got.includes("P19")) expect(r.models.needed).toBe(true);
      if (got.includes("P20")) expect(a.volume).toBe("high");
      if (got.includes("P23")) expect(got).toContain("P2");
      if (!r.models.needed && !got.includes("P2")) expect(got).not.toContain("P21");
    }
  });
  it("names no industry, document type or product", () => {
    const r = recommend(reading);
    const text = practicesFor(r, buildBlueprint(r, reading), reading)
      .filter((p) => NEW.includes(p.id))
      .map((p) => `${p.title} ${p.build} ${p.test}`)
      .join("\n");
    expect(text).not.toMatch(/loan|lender|underwrit|pay stub|bank statement|fraud|insur|invoice|resume/i);
    expect(text).not.toMatch(/claude|opus|sonnet|haiku|gpt|n8n|langgraph/i);
    expect(text).not.toMatch(/[–—]/);
  });
});

describe("the knowledge behind them", () => {
  const dir = join(process.cwd(), "knowledge", "chunks", "17-evidence-and-verification");
  const kbOf = (id: string) => RULES.find((x) => x.id === id)!.kb ?? [];
  it("has three chunks, each with claims and what they mean for the guide", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    expect(files.map((f) => f.slice(0, 3)).sort()).toEqual(["V01", "V02", "V03"]);
    for (const f of files) {
      const text = readFileSync(join(dir, f), "utf8");
      expect(text).toContain("## Claims");
      expect(text).toContain("## What this means for the guide");
    }
  });
  it("is linked from the rules it backs, so designs can draw on it", () => {
    expect(kbOf("TL14")).toContain("V01");
    expect(kbOf("AU10")).toContain("V01");
    expect(kbOf("AU9")).toContain("V02");
    expect(kbOf("F1")).toContain("V03");
    expect(kbOf("AU7")).toContain("V03");
  });
  it("tells the design step to check read values in code and to route on checks", () => {
    expect(INSTRUCTIONS).toMatch(/reads values out of documents or messages/);
    expect(INSTRUCTIONS).toMatch(/not on how sure an AI step says it is/);
  });
});

// Three gaps the same brief exposed in the rules themselves, fixed for any business.
describe("what the brief exposed in the rules", () => {
  const big: Answers = { ...reading };
  const fewer: Answers = { ...reading, volume: "daily" };
  const design = (a: Answers) => {
    const r = recommend(a);
    return { r, bp: buildBlueprint(r, a) };
  };

  it("has a person confirm adverse results, not every result, where volume makes approving all of them unrealistic", () => {
    const { r, bp } = design(big);
    expect(r.fired).toEqual(expect.arrayContaining(["AU7", "AU12", "AU13"]));
    expect(r.autonomy.level).toBe(3);
    const checks = r.autonomy.checkpoints.join(" ");
    expect(checks).toMatch(/confirms every adverse outcome/);
    expect(checks).toMatch(/random share of those goes to the same reviewers/);
    expect(checks).toMatch(/No batch approval/);
    const text = bp.nodes.map((n) => `${n.name} ${n.what} ${n.gates.map((g) => g.text).join(" ")}`).join(" ");
    expect(text).toMatch(/adverse/i);
    expect(text).not.toMatch(/reviews every result/);
  });
  it("still has a person approve every result about a person at lower volume", () => {
    const { r, bp } = design(fewer);
    expect(r.autonomy.level).toBe(2);
    expect(r.autonomy.checkpoints.join(" ")).not.toMatch(/random share of those/);
    expect(bp.nodes.some((n) => n.name === "You approve each result")).toBe(true);
  });
  it("lets identifying details be matched in code before they are stripped", () => {
    const { r, bp } = design(big);
    expect(r.autonomy.guardrails.join(" ")).toMatch(/only its result \(match, mismatch or cannot tell\) goes on with the case/);
    expect(bp.nodes.find((n) => n.id === "evidence")!.what).toMatch(/code compares them here and the packet carries only the result/);
    expect(INSTRUCTIONS).toMatch(/compares those details in code before the strip/);
  });
  it("gives a developer on a small budget code-based tools without own hardware", () => {
    const base: Answers = { task: "Research suppliers", shape: "varies", kinds: "no", roles: "one", quality: "partly", knowledge: ["reference"], systems: "read", trigger: "event", volume: "high", risks: ["none"], location: "open", requirements: ["embedded"] };
    const solo = recommend({ ...base, team: "solo" });
    const large = recommend({ ...base, team: "large" });
    const small = recommend({ ...base, team: "small" });
    expect(solo.tools.map((t) => t.tool)).toContain("langgraph");
    expect(small.tools.map((t) => t.tool)).not.toContain("langgraph");
    expect(solo.tools.map((t) => t.tool)).toEqual(expect.arrayContaining(["promptfoo", "langfuse"]));
    for (const id of ["H2", "H4", "H6"]) expect(solo.fired).not.toContain(id);
    expect(large.fired).toContain("H4");
    expect(solo.hosting.title).toBe("Cloud, pay as you go");
  });
});
