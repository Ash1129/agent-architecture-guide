import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { FULL_TIME_HOURS, RUNS_PER_MONTH, estimateCost, hoursRange, moneyRange, perRun, weeksRange } from "../src/lib/cost";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";
import { sampledPaths } from "./paths";

const support: Answers = {
  task: "Answer customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"],
  systems: "act", trigger: "event", volume: "daily", risks: ["visible", "personal"], location: "open", team: "mid",
};
const reminders: Answers = { task: "Send invoice reminders", shape: "rules", systems: "act", trigger: "schedule", volume: "daily", risks: ["visible"], location: "open", team: "small" };

const estimate = (a: Answers) => {
  const r = recommend(a);
  const bp = buildBlueprint(r, a);
  return { r, bp, c: estimateCost(r, bp, a) };
};
const ordered = ([lo, hi]: [number, number]) => Number.isFinite(lo) && Number.isFinite(hi) && lo >= 0 && lo <= hi;

describe("cost and effort estimates", () => {
  it("gives finite, ordered ranges for every kind of design", () => {
    for (const a of [support, reminders, ...sampledPaths(120)]) {
      const { c } = estimate(a);
      expect(ordered(c.monthly)).toBe(true);
      expect(ordered(c.build.weeks)).toBe(true);
      expect(c.build.weeks[0]).toBeGreaterThan(0);
      if (c.models) expect(ordered(c.models.perThousand) && ordered(c.models.perMonth)).toBe(true);
      if (c.review) expect(ordered(c.review.hoursPerWeek)).toBe(true);
    }
  });

  it("charges nothing for AI when no step uses a model", () => {
    const { c } = estimate(reminders);
    expect(c.models).toBeNull();
    expect(c.monthly[1]).toBeGreaterThan(0); // the platform still costs something
  });

  it("scales with volume", () => {
    const low = estimate({ ...support, volume: "occasional" }).c;
    const high = estimate({ ...support, volume: "high" }).c;
    expect(high.models!.perMonth[1]).toBeGreaterThan(low.models!.perMonth[1] * 100);
    expect(high.runsPerMonth).toEqual(RUNS_PER_MONTH.high);
  });

  it("costs more per run for an agent than for a fixed workflow on the same models", () => {
    const agent = estimate(support).c.models!.perThousand;
    const workflow = estimate({ ...support, shape: "judgement", split: "sequential", roles: undefined }).c.models!.perThousand;
    expect(agent[1]).toBeGreaterThan(workflow[1]);
  });

  it("lowers only the low end for caching and batching, never the high end", () => {
    const { r, bp } = estimate(support);
    const plain = perRun(bp, { cache: false, batch: false });
    const cheap = perRun(bp, { cache: true, batch: true });
    expect(cheap[0]).toBeLessThan(plain[0]);
    expect(cheap[1]).toBe(plain[1]);
    expect(r.models.needed).toBe(true);
  });

  it("counts alternative paths once and side-by-side steps all together", () => {
    const { bp } = estimate(support);
    const one = bp.nodes.find((n) => n.engine?.kind === "model")!;
    const twin = { ...one, id: `${one.id}-twin`, tracks: [one.tracks[1] + 1, one.tracks[1] + 1] as [number, number] };
    const alone = perRun({ ...bp, nodes: [one], captions: {} }, { cache: false, batch: false });
    const alternatives = perRun({ ...bp, nodes: [one, twin], captions: {} }, { cache: false, batch: false });
    const together = perRun({ ...bp, nodes: [one, twin], captions: { [one.stage]: "At the same time" } }, { cache: false, batch: false });
    expect(alternatives).toEqual(alone);
    expect(together[1]).toBeCloseTo(alone[1] * 2);
  });

  it("says when reviewing every result needs more than one person", () => {
    const { c } = estimate({ ...support, volume: "high" });
    expect(c.review!.hoursPerWeek[1]).toBeGreaterThan(FULL_TIME_HOURS);
    expect(c.review!.note).toMatch(/more than one person full time/);
    expect(estimate(support).c.review!.note).not.toMatch(/full time/);
  });

  it("sizes the n8n plan to the runs, and counts Claude plans per person", () => {
    expect(estimate(reminders).c.platform.label).toBe("n8n Cloud Starter");
    const busy = estimate({ ...reminders, volume: "high" }).c.platform;
    expect(busy.label).toMatch(/n8n Cloud Pro to Business/);
    const claude = estimate({ ...support, location: "open", knowledge: ["none"], trigger: "schedule", team: "small" });
    if (claude.r.tools.find((t) => t.core)!.tool === "cowork") {
      expect(claude.c.platform.label).toBe("Claude Pro");
      expect(claude.c.models?.includedInPlan).toBe(true);
    }
  });

  it("adds own hardware only when the hosting advice includes it", () => {
    expect(estimate(support).c.hardware).toBeUndefined();
    const china = estimate({ ...support, shape: "judgement", split: "sequential", roles: undefined, location: "restricted", team: "large", volume: "high" });
    expect(china.r.fired).toContain("H6");
    expect(china.c.hardware?.upfront[0]).toBeGreaterThan(0);
  });

  it("puts the estimate in BUILD.md", () => {
    const { r, bp } = estimate(support);
    const brief = buildStarterKit(r, bp, support).files.find((f) => f.path === "BUILD.md")!.content;
    expect(brief).toMatch(/What it should cost/);
    expect(brief).toMatch(/Running cost: about \$\d+ to \$\d+ a month \(300 to 1,500 runs\)/);
    expect(brief).toMatch(/Build: .* for a first version/);
  });

  it("words figures plainly", () => {
    expect(moneyRange([0.2, 0.4])).toBe("under $1");
    expect(moneyRange([0.5, 38.4])).toBe("up to $38");
    expect(moneyRange([1234, 56789])).toBe("$1,200–$56,800");
    expect(weeksRange([0.5, 1])).toBe("3–5 working days");
    expect(weeksRange([2, 6])).toBe("2–6 weeks");
    expect(hoursRange([0.1, 0.4])).toBe("under an hour");
    expect(hoursRange([0.2, 5])).toBe("up to 5 hours");
  });
});
