import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { kitProblems } from "../src/lib/kitcheck";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";

// A decision about a person, in three different businesses: none of these rules is about one of them.
const loans: Answers = { task: "Pre-screen small loan applications", shape: "judgement", kinds: "yes", split: "sequential", quality: "partly", knowledge: ["playbook", "reference"], systems: "act", trigger: "event", volume: "daily", risks: ["decides", "personal"], location: "open", team: "mid" };
const tenants: Answers = { task: "Screen tenant applications", shape: "varies", kinds: "yes", roles: "one", quality: "clear", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "occasional", risks: ["decides", "personal"], location: "open", team: "small" };
const admissions: Answers = { task: "Rank course applications", shape: "judgement", kinds: "no", split: "sections", quality: "clear", knowledge: ["reference"], systems: "read", trigger: "schedule", volume: "high", risks: ["decides"], location: "restricted", team: "large" };
const emails: Answers = { task: "Answer customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "clear", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["none"], location: "open", team: "mid" };

describe("decisions about people", () => {
  it("cap autonomy at 2, confirm every adverse outcome, offer a human review, and warn about regulation", () => {
    for (const a of [loans, tenants, admissions]) {
      const r = recommend(a);
      expect(r.fired).toEqual(expect.arrayContaining(["AU12", "AU13", "G33", "F4"]));
      expect(r.autonomy.level).toBe(2);
      expect(r.autonomy.cap).toBe(2);
      const checks = r.autonomy.checkpoints.join(" ");
      expect(checks).toMatch(/confirms every adverse outcome/);
      expect(checks).toMatch(/ask for a review by a person/);
      const guards = r.autonomy.guardrails.join(" ");
      expect(guards).toMatch(/Compare outcomes across groups/);
      expect(guards).toMatch(/Pin the model, prompt and rubric versions/);
      expect(r.gotchas.find((g) => g.id === "G33")?.priority).toBe(1);
      expect(r.firstSteps).toHaveLength(4);
    }
    expect(recommend(emails).fired).not.toContain("AU12");
  });

  it("put a fixed evidence-packet step before any AI step: a mechanism, not an instruction", () => {
    for (const a of [loans, tenants, admissions]) {
      const bp = buildBlueprint(recommend(a), a);
      const packet = bp.nodes.find((n) => n.id === "evidence")!;
      expect(packet.kind).toBe("fixed");
      expect(packet.engine?.kind === "algorithm" && packet.engine.name).toBe("Scripted action");
      expect(packet.gates.map((g) => g.text)).toEqual(["Identity stripped first", "Human review on request"]);
      for (const n of bp.nodes.filter((x) => x.engine?.kind === "model")) expect(packet.stage).toBeLessThan(n.stage);
    }
    expect(buildBlueprint(recommend(emails), emails).nodes.some((n) => n.id === "evidence")).toBe(false);
  });

  it("design the review rather than place it, for every design where a person approves each result", () => {
    const r = recommend(loans);
    const approve = buildBlueprint(r, loans).nodes.find((n) => n.id === "approve")!;
    expect(approve.what).toMatch(/one case at a time/);
    expect(approve.what).toMatch(/No batch approval/);
    expect(approve.gates.map((g) => g.text)).toContain("Adverse outcomes confirmed");
    const checks = r.autonomy.checkpoints.join(" ");
    expect(checks).toMatch(/override rate/);
    expect(checks).toMatch(/Seed known-wrong cases/);
    // Not only decisions about people: any level-2 design.
    const level2 = recommend({ ...emails, quality: "partly", risks: ["visible"] });
    expect(level2.autonomy.level).toBe(2);
    expect(level2.fired).toContain("AU13");
    // And not a level-3 one.
    const level3 = recommend({ task: "Draft replies", shape: "judgement", kinds: "no", split: "sequential", quality: "clear", knowledge: ["playbook"], systems: "read", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" });
    expect(level3.autonomy.level).toBe(3);
    expect(level3.fired).not.toContain("AU13");
  });

  it("enforce approval with credentials when AI acts in the owner's systems", () => {
    const r = recommend(loans);
    expect(r.fired).toContain("AU14");
    expect(r.autonomy.guardrails.join(" ")).toMatch(/cannot perform the approved action/);
    expect(recommend({ ...emails, systems: "read" }).fired).not.toContain("AU14");
  });

  it("make the checker independent: fixed checks first, then a different model when the stakes are high", () => {
    for (const a of [{ ...loans, kinds: "no", quality: "clear" } as Answers, tenants]) {
      const bp = buildBlueprint(recommend(a), a);
      const check = bp.nodes.find((n) => n.id === "check")!;
      expect(check.gates.map((g) => g.text)).toContain("Quotes must match source");
      const producer = bp.nodes.find((n) => n.engine?.kind === "model" && (n.engine.role === "worker" || n.engine.role === "agent"))!;
      expect(check.engine?.kind === "model" && check.engine.model).not.toBe(producer.engine?.kind === "model" && producer.engine.model);
    }
  });

  it("pin versions instead of stepping models down, and keep a decision record, in the kit", () => {
    for (const a of [loans, admissions]) {
      const r = recommend(a);
      const bp = buildBlueprint(r, a);
      const kit = buildStarterKit(r, bp, a);
      const brief = kit.files.find((f) => f.path === "BUILD.md")!.content;
      expect(brief).toMatch(/pin the model, prompt and rubric versions/i);
      expect(brief).not.toMatch(/keep the switch only if quality still meets/);
      expect(brief).toMatch(/## Decision record/);
      expect(brief).toMatch(/hash of the input/);
      expect(kitProblems(r, bp, a, kit)).toEqual([]);
    }
    expect(buildStarterKit(recommend(loans), buildBlueprint(recommend(loans), loans), loans).files.find((f) => f.path === "BUILD.md")!.content).toMatch(/\*\*Credentials\*\*/);
  });
});
