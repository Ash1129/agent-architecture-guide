import { describe, expect, it } from "vitest";
import {
  type Answers,
  QUESTIONS,
  activeQuestions,
  effectiveAnswers,
  isComplete,
} from "../src/lib/questions";
import { RULES, recommend } from "../src/lib/rules";
import { SOURCES } from "../src/lib/sources";
import { TOOLS, TOPOLOGIES } from "../src/lib/catalog";
import { ALGORITHMS, MODELS, MODEL_RULES } from "../src/lib/models";
import { decodeAnswers, encodeAnswers, resultAsText, resultCode } from "../src/lib/share";
import { allPaths, sampledPaths } from "./paths";

const tools = (a: Answers) => recommend(a).tools.map((t) => t.tool);
const coreTool = (a: Answers) => recommend(a).tools.find((t) => t.core)?.tool;

const invoiceReminders: Answers = {
  task: "Send overdue invoice reminders",
  shape: "rules",
  systems: "act",
  trigger: "schedule",
  volume: "daily",
  risks: ["none"],
  location: "open",
  team: "small",
};

const resumeOptimizer: Answers = {
  task: "Tailor resumes to job descriptions",
  shape: "judgement",
  kinds: "no",
  split: "sections",
  quality: "clear",
  knowledge: ["playbook", "reference"],
  systems: "none",
  trigger: "manual",
  volume: "occasional",
  risks: ["none"],
  location: "open",
  team: "small",
};

const customerSupport: Answers = {
  task: "Answer routine customer emails",
  shape: "varies",
  kinds: "yes",
  roles: "one",
  quality: "partly",
  knowledge: ["playbook", "reference"],
  systems: "act",
  trigger: "event",
  volume: "daily",
  risks: ["visible", "personal"],
  location: "open",
  team: "mid",
};

const marketResearch: Answers = {
  task: "Research competitors every week",
  shape: "varies",
  kinds: "no",
  roles: "both",
  quality: "partly",
  knowledge: ["memory"],
  systems: "read",
  trigger: "schedule",
  volume: "occasional",
  risks: ["none"],
  location: "restricted",
  team: "large",
};

describe("question flow", () => {
  it("asks only eight questions for rules-based work", () => {
    expect(activeQuestions({ shape: "rules" }).map((q) => q.id)).toEqual([
      "task", "shape", "systems", "trigger", "volume", "risks", "location", "team",
    ]);
  });

  it("asks about parts for judgement work and about roles for open-ended work", () => {
    const j = activeQuestions({ shape: "judgement" }).map((q) => q.id);
    const v = activeQuestions({ shape: "varies" }).map((q) => q.id);
    expect(j).toContain("split");
    expect(j).not.toContain("roles");
    expect(v).toContain("roles");
    expect(v).not.toContain("split");
    expect(j).toHaveLength(12);
    expect(v).toHaveLength(12);
  });

  it("ignores stale answers when an earlier answer changes", () => {
    const changed = { ...marketResearch, shape: "rules" as const };
    const eff = effectiveAnswers(changed);
    expect(eff.roles).toBeUndefined();
    expect(eff.knowledge).toBeUndefined();
    expect(recommend(changed).approach.id).toBe("automation");
  });

  it("reports incomplete answers and refuses to recommend", () => {
    expect(isComplete({ task: "x", shape: "rules" })).toBe(false);
    expect(() => recommend({ task: "x", shape: "rules" })).toThrow();
  });
});

describe("decision paths", () => {
  it("rules-based work gets plain automation, no model, no MCP", () => {
    const r = recommend(invoiceReminders);
    expect(r.approach.id).toBe("automation");
    expect(r.approach.agents).toBe("No agent");
    expect(r.topology.primary).toBe("pipeline");
    expect(r.models.needed).toBe(false);
    expect(coreTool(invoiceReminders)).toBe("n8n");
    expect(tools(invoiceReminders)).toContain("integrations");
    expect(tools(invoiceReminders)).not.toContain("mcp");
    expect(r.autonomy.level).toBe(4);
    expect(r.gotchas.map((g) => g.id)).toContain("G1");
  });

  it("irreversible automation keeps a human checkpoint", () => {
    const r = recommend({ ...invoiceReminders, risks: ["irreversible"] });
    expect(r.autonomy.level).toBe(3);
  });

  it("dependent data jobs go to Airflow when there are developers, n8n otherwise", () => {
    const base: Answers = { ...invoiceReminders, trigger: "data", systems: "none" };
    expect(coreTool({ ...base, team: "large" })).toBe("airflow");
    expect(recommend({ ...base, team: "large" }).topology.primary).toBe("dag");
    expect(coreTool({ ...base, team: "small" })).toBe("n8n");
    expect(recommend({ ...base, team: "small" }).gotchas.map((g) => g.id)).toContain("G11");
  });

  it("resume optimizer is a workflow in Claude with a Skill and parallel checks", () => {
    const r = recommend(resumeOptimizer);
    expect(r.approach.id).toBe("workflow");
    expect(coreTool(resumeOptimizer)).toBe("claude");
    expect(tools(resumeOptimizer)).toEqual(expect.arrayContaining(["skill", "resources", "system-prompt"]));
    expect(tools(resumeOptimizer)).not.toContain("mcp");
    expect(r.topology.primary).toBe("parallel-sections");
    expect(r.topology.addOns).toContain("evaluator");
    expect(r.autonomy.level).toBe(4);
  });

  it("customer support is one agent in n8n, routed, supervised closely", () => {
    const r = recommend(customerSupport);
    expect(r.approach.id).toBe("agent");
    expect(coreTool(customerSupport)).toBe("n8n-agent");
    expect(tools(customerSupport)).toContain("mcp");
    expect(r.topology.primary).toBe("agent-loop");
    expect(r.topology.addOns).toContain("routing");
    expect(r.autonomy.level).toBe(2);
    expect(r.hybrid.length).toBeGreaterThan(0);
    const g = r.gotchas.map((x) => x.id);
    expect(g).toEqual(expect.arrayContaining(["G2", "G3", "G4", "G5"]));
    expect(r.autonomy.guardrails.join(" ")).toMatch(/personal-data filter/);
  });

  it("restricted-region research is a Hermes orchestrator with open-weight models", () => {
    const r = recommend(marketResearch);
    expect(r.approach.id).toBe("multi");
    expect(coreTool(marketResearch)).toBe("hermes");
    expect(r.topology.primary).toBe("orchestrator");
    expect(r.hosting.title).toMatch(/available where you operate/);
    expect(r.models.capabilities.map((c) => c.title)).toContain("Open-weight availability");
    expect(r.simpler.title).toBe("One agent first");
  });

  it("scheduled agent without restrictions uses Claude Cowork", () => {
    const a: Answers = { ...marketResearch, location: "open", knowledge: ["none"], roles: "one" };
    expect(coreTool(a)).toBe("cowork");
    expect(recommend(a).gotchas.map((g) => g.id)).toContain("G7");
  });

  it("memory need in Cowork adds a Project and a forgetting warning", () => {
    const a: Answers = { ...marketResearch, location: "open", roles: "one", team: "small" };
    expect(coreTool(a)).toBe("cowork");
    expect(tools(a)).toContain("project");
    expect(recommend(a).gotchas.map((g) => g.id)).toContain("G13");
  });

  it("a fixed workflow in n8n doesn't need tool use from the model; the workflow tool does it", () => {
    const a: Answers = { ...customerSupport, shape: "judgement", split: "sequential" };
    expect(coreTool(a)).toBe("n8n");
    expect(tools(a)).toContain("integrations");
    expect(tools(a)).not.toContain("mcp");
    expect(recommend(a).models.capabilities.map((c) => c.title)).not.toContain("Reliable tool use");
  });

  it("hard-to-describe quality caps autonomy at approve-every-output", () => {
    expect(recommend({ ...resumeOptimizer, quality: "no" }).autonomy.level).toBe(2);
  });

  it("high-volume irreversible work uses thresholds rather than approving everything", () => {
    const a: Answers = { ...resumeOptimizer, trigger: "event", volume: "high", risks: ["irreversible"], quality: "clear" };
    expect(recommend(a).autonomy.level).toBe(3);
  });
});

function problems(a: Answers): string[] {
  const r = recommend(a);
  const p: string[] = [];
  if (r.tools.filter((t) => t.core).length !== 1) p.push("not exactly one main tool");
  if (!TOPOLOGIES[r.topology.primary]) p.push("unknown topology");
  if (r.autonomy.level < 1 || r.autonomy.level > 4) p.push("autonomy out of range");
  if (r.firstSteps.length !== 3) p.push("first steps != 3");
  if (r.gotchas.length === 0) p.push("no gotchas");
  if (r.approach.why.length === 0) p.push("approach unexplained");
  if (r.models.needed !== (a.shape !== "rules")) p.push("model need mismatch");
  if (a.shape === "rules" && r.tools.some((t) => t.tool === "mcp")) p.push("MCP without AI");
  if (r.autonomy.checkpoints.length === 0) p.push("no checkpoints");
  if (r.approach.why.concat(r.topology.why).some((w) => !w.text.trim() || /You said \./.test(w.text))) p.push("empty explanation");
  return p;
}

describe("every path", () => {
  const paths = allPaths();
  const sampled = sampledPaths(4000);

  it("covers tens of thousands of paths", () => {
    expect(paths.length).toBeGreaterThan(30000);
  });

  it("always produces a complete, well-formed recommendation", () => {
    const seen = new Set<string>();
    const failures: string[] = [];
    for (const a of [...paths, ...sampled]) {
      seen.add(recommend(a).approach.id);
      const p = problems(a);
      if (p.length && failures.length < 5) failures.push(`${p.join(", ")}: ${JSON.stringify(a)}`);
    }
    expect(failures).toEqual([]);
    expect([...seen].sort()).toEqual(["agent", "automation", "multi", "workflow"]);
  }, 120_000);

  it("never uses em or en dashes in any generated text", () => {
    for (const a of [...paths.filter((_, i) => i % 11 === 0), ...sampled]) {
      const text = resultAsText(recommend(a), "https://example.com");
      if (/[\u2013\u2014]/.test(text)) throw new Error(`Dash found for ${JSON.stringify(a)}`);
    }
  }, 120_000);
});

describe("rule definitions", () => {
  it("have unique ids, plain-English text and valid sources", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RULES) {
      expect(r.if.length).toBeGreaterThan(3);
      expect(r.then.length).toBeGreaterThan(3);
      if (r.basis.kind === "source") for (const s of r.basis.sources) expect(SOURCES[s]).toBeDefined();
      expect(`${r.if} ${r.then}`).not.toMatch(/[–—]/);
    }
  });

  it("question and catalog copy is free of em and en dashes", () => {
    const copy = JSON.stringify([QUESTIONS.map(({ appliesWhen, ...q }) => q), TOOLS, TOPOLOGIES, SOURCES, MODELS, MODEL_RULES, ALGORITHMS]);
    expect(copy).not.toMatch(/[–—]/);
  });
});

describe("sharing", () => {
  it("round-trips answers through the link", () => {
    expect(decodeAnswers(encodeAnswers(customerSupport))).toEqual(customerSupport);
  });

  it("handles non-Latin task descriptions", () => {
    const a = { ...resumeOptimizer, task: "为客户回复邮件 café" };
    expect(decodeAnswers(encodeAnswers(a))?.task).toBe(a.task);
  });

  it("drops unknown keys and invalid values from hand-edited links", () => {
    const tampered = encodeAnswers({ ...invoiceReminders, shape: "nonsense", evil: "<script>", risks: ["none", "visible", "bogus"] } as unknown as Answers);
    const d = decodeAnswers(tampered)!;
    expect(d.shape).toBeUndefined();
    expect((d as Record<string, unknown>).evil).toBeUndefined();
    expect(d.risks).toEqual(["none"]);
  });

  it("shares only answers that apply, never stale ones", () => {
    const switched: Answers = { ...customerSupport, shape: "judgement", split: "sequential" };
    const shared = decodeAnswers(resultCode(switched))!;
    expect(shared.roles).toBeUndefined();
    expect(shared.split).toBe("sequential");
    expect(recommend(shared)).toEqual(recommend(switched));
  });

  it("returns null for garbage", () => {
    expect(decodeAnswers("%%%not-base64")).toBeNull();
  });
});
