import { describe, expect, it } from "vitest";
import dataset from "../evals/recommendations/cases.json";
import { evaluate, gradeScenario, summarize, validateScenarios, type Scenario } from "../evals/recommendations/evaluate";
import { buildBlueprint } from "../src/lib/blueprint";
import { recommend } from "../src/lib/rules";

const cases = dataset.cases as Scenario[];
function example(id: string) {
  const c = cases.find((s) => s.id === id)!;
  const r = recommend(c.answers);
  const bp = buildBlueprint(r, c.answers);
  return { c, r, bp };
}
const failures = (result: ReturnType<typeof gradeScenario>) => result.checks.filter((c) => !c.pass).map((c) => c.name);

describe("recommendation-quality evaluation", () => {
  it("meets the provisional quality gate across authored business cases", () => {
    const results = evaluate(cases);
    expect(summarize(results).gatePassed, JSON.stringify(results.filter((r) => !r.pass))).toBe(true);
  });

  it("rejects empty datasets, duplicate cases and unsupported review claims", () => {
    expect(() => validateScenarios([])).toThrow(/empty/);
    expect(() => validateScenarios([cases[0], cases[0]])).toThrow(/duplicate/);
    expect(() => validateScenarios([{ ...cases[0], reviewStatus: "reviewed", reviewer: null }])).toThrow(/provenance/);
    expect(summarize([]).gatePassed).toBe(false);
  });

  it("detects unsuitable platforms, extra tools and AI in fixed-rule work", () => {
    const { c, r, bp } = example("csv-normalization");
    r.tools[0].tool = "langgraph";
    r.tools.push({ ...r.tools[0], tool: "hermes", core: false });
    r.models.needed = true;
    expect(failures(gradeScenario(c, r, bp))).toEqual(expect.arrayContaining(["One suitable main platform", "Tool-count ceiling", "No unnecessary AI"]));
  });

  it("detects missing in-loop approval even when final output review remains", () => {
    const { c, r, bp } = example("agent-irreversible");
    const tools = bp.nodes.filter((n) => n.kind === "tool");
    expect(tools.length).toBeGreaterThan(0);
    for (const node of tools) node.gates = [];
    expect(failures(gradeScenario(c, r, bp))).toContain("In-loop actions have review gates");
  });

  it("detects a bypass path even when a human-review node is visible", () => {
    const { c, r, bp } = example("unclear-quality");
    bp.edges.push({ from: bp.nodes.find((n) => n.kind === "start")!.id, to: bp.nodes.find((n) => n.kind === "end")!.id, style: "flow" });
    expect(failures(gradeScenario(c, r, bp))).toContain("Every completion passes review");
  });

  it("detects a provider-incompatible model and unnecessary specialist", () => {
    const { c, r, bp } = example("restricted-support");
    const n = bp.nodes.find((n) => n.engine?.kind === "model")!;
    if (n.engine?.kind === "model") { n.engine.model = "opus"; n.engine.role = "specialist"; }
    expect(failures(gradeScenario(c, r, bp))).toEqual(expect.arrayContaining(["Model deployment constraints", "Specialist-count ceiling"]));
  });

  it("a critical failure blocks release even when overall pass rate stays above 90 percent", () => {
    const results = evaluate(cases);
    const check = results.flatMap((r) => r.checks).find((c) => c.critical)!;
    check.pass = false;
    const result = results.find((r) => r.checks.includes(check))!;
    result.pass = false;
    const summary = summarize(results);
    expect(summary.casePassRate).toBeGreaterThan(0.9);
    expect(summary.criticalFailures).toBe(1);
    expect(summary.gatePassed).toBe(false);
  });

  it("adding irreversible risk never increases autonomy", () => {
    for (const c of cases) {
      const base = recommend(c.answers);
      const risks = [...(c.answers.risks ?? []).filter((r) => r !== "none"), "irreversible" as const];
      expect(recommend({ ...c.answers, risks }).autonomy.level, c.id).toBeLessThanOrEqual(base.autonomy.level);
    }
  });
});
