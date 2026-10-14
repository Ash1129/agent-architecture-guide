import { buildBlueprint, type Blueprint } from "../../src/lib/blueprint";
import { recommend, type Approach, type Recommendation } from "../../src/lib/rules";
import { isComplete, type Answers } from "../../src/lib/questions";
import { TOOLS, type ToolId } from "../../src/lib/catalog";

export type Dimension = "approach" | "tool-fit" | "safeguards" | "complexity";
export type Scenario = {
  id: string; category: string; brief: string; answers: Answers; rationale: string;
  reviewStatus: "provisional" | "reviewed"; reviewer: string | null;
  expected: {
    approaches: Approach[]; cores: ToolId[]; maxTools: number; maxSpecialists: number;
    noAI?: boolean; requiredTools?: ToolId[]; forbiddenTools?: ToolId[];
    maxAutonomy?: number; humanReview?: boolean; openModelsOnly?: boolean;
    requiredCaveat?: string;
  };
};
export type Check = { name: string; dimension: Dimension; pass: boolean; critical: boolean; expected: unknown; actual: unknown };
export type CaseResult = { id: string; category: string; reviewStatus: string; rationale: string; pass: boolean; checks: Check[] };

export function validateScenarios(cases: Scenario[]) {
  if (!Array.isArray(cases) || !cases.length) throw new Error("Evaluation dataset must not be empty");
  const ids = new Set<string>();
  for (const c of cases) {
    if (!c.id || ids.has(c.id)) throw new Error(`Missing or duplicate case ID: ${c.id}`);
    ids.add(c.id);
    if (!isComplete(c.answers)) throw new Error(`${c.id}: incomplete answers`);
    if (!c.brief || !c.rationale || !c.category) throw new Error(`${c.id}: missing rationale or brief`);
    if (!["provisional", "reviewed"].includes(c.reviewStatus) || (c.reviewStatus === "reviewed" && !c.reviewer?.trim())) throw new Error(`${c.id}: missing review provenance`);
    const e = c.expected;
    if (!e.cores?.length || !e.approaches?.length || !Number.isInteger(e.maxTools) || e.maxTools < 1 || !Number.isInteger(e.maxSpecialists) || e.maxSpecialists < 0) throw new Error(`${c.id}: invalid expectations`);
    if (e.approaches.some((x) => !["automation", "workflow", "agent", "multi"].includes(x))) throw new Error(`${c.id}: unknown approach`);
    for (const t of [...e.cores, ...e.requiredTools ?? [], ...e.forbiddenTools ?? []]) if (!(t in TOOLS)) throw new Error(`${c.id}: unknown tool ${t}`);
    if (e.maxAutonomy !== undefined && (![1, 2, 3, 4].includes(e.maxAutonomy))) throw new Error(`${c.id}: invalid autonomy ceiling`);
    if (e.requiredCaveat) new RegExp(e.requiredCaveat, "i");
  }
}

/** Is any completion reachable from a start without going through a person? */
function unreviewedCompletion(bp: Blueprint): boolean {
  const byId = new Map(bp.nodes.map((n) => [n.id, n]));
  const pending = bp.nodes.filter((n) => n.kind === "start").map((n) => n.id);
  const seen = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = byId.get(id);
    if (!n || n.kind === "human") continue;
    if (n.kind === "end") return true;
    pending.push(...bp.edges.filter((e) => e.from === id).map((e) => e.to));
  }
  return false;
}

/** Grade outcomes against authored expectations; never read rule IDs as the answer key. */
export function gradeScenario(c: Scenario, r: Recommendation, bp: Blueprint): CaseResult {
  const checks: Check[] = [];
  const e = c.expected, tools = r.tools.map((t) => t.tool), cores = r.tools.filter((t) => t.core).map((t) => t.tool);
  const check = (name: string, dimension: Dimension, pass: boolean, expected: unknown, actual: unknown, critical = false) => checks.push({ name, dimension, pass, expected, actual, critical });
  check("Suitable approach", "approach", e.approaches.includes(r.approach.id), e.approaches, r.approach.id);
  check("One suitable main platform", "tool-fit", cores.length === 1 && e.cores.includes(cores[0]), e.cores, cores);
  for (const tool of e.requiredTools ?? []) check(`Required: ${tool}`, "tool-fit", tools.includes(tool), tool, tools);
  for (const tool of e.forbiddenTools ?? []) check(`Exclude: ${tool}`, "tool-fit", !tools.includes(tool), `No ${tool}`, tools);
  check("Tool-count ceiling", "complexity", tools.length <= e.maxTools, e.maxTools, tools.length);
  const specialists = bp.nodes.filter((n) => n.engine?.kind === "model" && n.engine.role === "specialist").length;
  check("Specialist-count ceiling", "complexity", specialists <= e.maxSpecialists, e.maxSpecialists, specialists);
  if (e.noAI) {
    const modelNodes = bp.nodes.filter((n) => n.engine?.kind === "model").length;
    check("No unnecessary AI", "approach", !r.models.needed && modelNodes === 0, "No model calls", { needed: r.models.needed, modelNodes });
  }
  if (e.maxAutonomy !== undefined) check("Autonomy ceiling", "safeguards", r.autonomy.level <= e.maxAutonomy, e.maxAutonomy, r.autonomy.level, true);
  if (e.humanReview) {
    const review = bp.nodes.some((n) => n.kind === "human" || n.gates.some((g) => g.kind === "human"));
    check("Visible human review", "safeguards", review, true, review, true);
    if ((e.maxAutonomy ?? 4) <= 2) {
      const bypass = unreviewedCompletion(bp);
      check("Every completion passes review", "safeguards", !bypass, false, bypass, true);
      if (c.answers.systems === "act") {
        const ungated = bp.nodes.filter((n) => n.kind === "tool" && !n.gates.some((g) => g.kind === "human")).map((n) => n.id);
        check("In-loop actions have review gates", "safeguards", ungated.length === 0, [], ungated, true);
      }
    }
  }
  if (e.openModelsOnly) {
    const incompatible = bp.nodes.filter((n) => n.engine?.kind === "model" && !["openLarge", "openSmall"].includes(n.engine.model)).map((n) => n.id);
    check("Model deployment constraints", "safeguards", incompatible.length === 0, [], incompatible, true);
  }
  if (e.requiredCaveat) {
    const text = r.gotchas.map((g) => `${g.title} ${g.body}`).join("\n");
    check("Disclose feasibility limitation", "tool-fit", new RegExp(e.requiredCaveat, "i").test(text), e.requiredCaveat, text);
  }
  return { id: c.id, category: c.category, reviewStatus: c.reviewStatus, rationale: c.rationale, pass: checks.every((x) => x.pass), checks };
}

export function evaluate(cases: Scenario[]) {
  validateScenarios(cases);
  return cases.map((c) => {
    try {
      const r = recommend(c.answers);
      return gradeScenario(c, r, buildBlueprint(r, c.answers));
    } catch (error) {
      return { id: c.id, category: c.category, reviewStatus: c.reviewStatus, rationale: c.rationale, pass: false, checks: [{ name: "Generate recommendation", dimension: "approach" as const, pass: false, critical: true, expected: "Complete recommendation", actual: String(error) }] };
    }
  });
}

export function summarize(results: CaseResult[]) {
  const all = results.flatMap((r) => r.checks);
  const casePassRate = results.length ? results.filter((r) => r.pass).length / results.length : 0;
  const dimensions = Object.fromEntries((["approach", "tool-fit", "safeguards", "complexity"] as Dimension[]).map((d) => {
    const checks = all.filter((c) => c.dimension === d);
    return [d, { passed: checks.filter((c) => c.pass).length, total: checks.length }];
  }));
  const criticalFailures = all.filter((c) => c.critical && !c.pass).length;
  // Per-dimension floors prevent a strong score in one area hiding regressions in another.
  const gatePassed = results.length > 0 && casePassRate >= 0.9 && criticalFailures === 0 && Object.values(dimensions).every((d) => d.total > 0 && d.passed / d.total >= 0.9);
  return { total: results.length, passed: results.filter((r) => r.pass).length, casePassRate, criticalFailures, dimensions, gatePassed, reviewed: results.filter((r) => r.reviewStatus === "reviewed").length };
}
