import { describe, expect, it } from "vitest";
import { memoryCache } from "../server/cache";
import { decidedRecommendation, handleDecide } from "../server/decide";
import { buildBlueprint } from "../src/lib/blueprint";
import { type Decision, checkDecision } from "../src/lib/decision";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";

/** Rules: one agent in n8n, autonomy capped at 2 (customers see the output, and quality is only partly checkable). */
const support: Answers = {
  task: "Answer customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"],
  systems: "act", trigger: "event", volume: "daily", risks: ["visible", "personal"], location: "open", team: "mid",
};
const chunks = [{ id: "F05", title: "Start simple: the evidence" }, { id: "M02", title: "Cutting cost" }];
const reason = (text: string) => ({ text, kb: ["F05", "M02", "NOT-A-CHUNK"] });

/** The AI disagrees: a workflow with AI steps is enough. */
function aiDecision(over: Record<string, unknown> = {}) {
  return {
    summary: "A workflow that sorts emails and drafts replies for approval: predictable, cheaper than an agent, and enough for these cases.",
    approach: "workflow",
    topology: { primary: "routing", addOns: ["evaluator"] },
    tools: [
      { tool: "n8n", role: "Runs the workflow and connects the inbox." },
      { tool: "system-prompt", role: "The standing brief for every AI step." },
      { tool: "skill", role: "Not something n8n uses." },
    ],
    hosting: "cloud",
    autonomy: 2,
    models: { router: "haiku", worker: "sonnet", checker: "opus" },
    shortlist: [
      { tool: "airflow", reason: "Code-first alternative.", tradeoff: "Needs developers." },
      { tool: "n8n", reason: "Visual and quick to build.", tradeoff: "Less control over recovery." },
    ],
    reasons: {
      approach: reason("Most emails follow a few patterns, so fixed steps with AI inside are cheaper and easier to test than an agent."),
      topology: reason("Sorting first lets each type get simple instructions; a checker catches bad drafts."),
      tools: reason("n8n connects the inbox and runs the steps visually."),
      hosting: reason("Pay as you go suits an uncertain volume."),
      autonomy: reason("Customers see every reply, so a person approves each one."),
      models: reason("Sorting is simple, so the cheapest model does it; drafting needs a balanced one."),
      shortlist: reason("Airflow is worth weighing only if developers will own it."),
    },
    ...over,
  };
}

describe("checking an AI decision against the limits", () => {
  it("accepts a decision within the limits, tidying small slips", () => {
    const { decision, problems } = checkDecision(aiDecision(), support, chunks);
    expect(problems).toEqual([]);
    expect(decision!.approach).toBe("workflow");
    // A supporting piece that doesn't work with the main tool is dropped, not fatal.
    expect(decision!.tools.map((t) => t.tool)).toEqual(["n8n", "system-prompt"]);
    // The main tool always heads the shortlist.
    expect(decision!.shortlist.map((c) => c.tool)).toEqual(["n8n", "airflow"]);
    // Only chunks the model was given are kept, with their titles.
    expect(decision!.reasons.approach.kb).toEqual(chunks);
  });

  it("refuses providers that aren't available where the owner operates", () => {
    const restricted = { ...support, location: "restricted" } as Answers;
    const claude = aiDecision({ approach: "agent", topology: { primary: "agent-loop", addOns: [] }, tools: [{ tool: "cowork", role: "x" }], hosting: "available", models: { agent: "opus" } });
    const { problems } = checkDecision(claude, restricted, chunks);
    expect(problems.join(" ")).toMatch(/"cowork" isn't available/);
    expect(problems.join(" ")).toMatch(/models.agent" must be an open-weight model/);
    expect(checkDecision(aiDecision({ models: { router: "openSmall", worker: "openLarge" } }), restricted, chunks).problems.join(" ")).toMatch(/"hosting" must be one of available, available-own-hardware/);
  });

  it("keeps data where it must stay", () => {
    const residency = { ...support, location: "residency" } as Answers;
    expect(checkDecision(aiDecision(), residency, chunks).problems.join(" ")).toMatch(/"hosting" must be one of in-region, self-hosted/);
    expect(checkDecision(aiDecision({ hosting: "in-region" }), residency, chunks).problems).toEqual([]);
  });

  it("never allows more autonomy than the risks do", () => {
    expect(recommend(support).autonomy.cap).toBe(2);
    expect(checkDecision(aiDecision({ autonomy: 3 }), support, chunks).problems.join(" ")).toMatch(/at most 2/);
    // Fixed steps by the rules (no agent cap), but the AI picks an agent that acts in the owner's systems.
    const calm: Answers = { ...support, shape: "judgement", split: "sequential", roles: undefined, risks: ["none"], quality: "clear" };
    expect(recommend(calm).autonomy.cap ?? 4).toBe(4);
    const agent = aiDecision({ approach: "agent", topology: { primary: "agent-loop", addOns: [] }, tools: [{ tool: "n8n-agent", role: "x" }], models: { agent: "sonnet" }, autonomy: 4 });
    expect(checkDecision(agent, calm, chunks).problems.join(" ")).toMatch(/acts in the owner's systems can be at most level 3/);
  });

  it("only allows systems the guide can build", () => {
    expect(checkDecision(aiDecision({ tools: [{ tool: "cowork", role: "x" }] }), support, chunks).problems.join(" ")).toMatch(/main tool for workflow/);
    expect(checkDecision(aiDecision({ topology: { primary: "orchestrator", addOns: [] } }), support, chunks).problems.join(" ")).toMatch(/topology.primary/);
    const automation = aiDecision({ approach: "automation", topology: { primary: "pipeline", addOns: [] } });
    expect(checkDecision(automation, support, chunks).problems.join(" ")).toMatch(/Plain automation uses no AI models/);
    expect(checkDecision({ approach: "magic" }, support, chunks).problems.length).toBeGreaterThan(3);
    expect(checkDecision(null, support).problems.length).toBeGreaterThan(0);
  });
});

describe("reading what the model meant", () => {
  it("accepts names, phrases and different spellings for the ids", () => {
    const loose = aiDecision({
      approach: "A workflow with AI steps",
      topology: { primary: "Routing", addOns: ["Evaluator"] },
      tools: [{ tool: "N8N", role: "Runs it." }, { tool: "system prompt", role: "The brief." }],
      hosting: "Cloud",
      autonomy: "2",
      models: { Router: "Claude Haiku 5.5", worker: "claude-sonnet-5-5", checker: "Claude Opus 5.5" },
    });
    const { decision, problems } = checkDecision(loose, support, chunks);
    expect(problems).toEqual([]);
    expect(decision).toMatchObject({ approach: "workflow", topology: { primary: "routing", addOns: ["evaluator"] }, hosting: "cloud", autonomy: 2, models: { router: "haiku", worker: "sonnet", checker: "opus" } });
    expect(decision!.tools.map((t) => t.tool)).toEqual(["n8n", "system-prompt"]);
  });

  it("drops add-ons and alternatives that don't fit, and keeps the decision", () => {
    const extras = aiDecision({
      topology: { primary: "routing", addOns: ["chain", "evaluator", "parallel-sections", "parallel-voting"] },
      shortlist: [{ tool: "n8n", reason: "a", tradeoff: "b" }, { tool: "cowork", reason: "can't build a workflow", tradeoff: "" }],
    });
    const { decision, problems } = checkDecision(extras, support, chunks);
    expect(problems).toEqual([]);
    expect(decision!.topology.addOns).toEqual(["evaluator", "parallel-sections"]);
    expect(decision!.shortlist.map((c) => c.tool)).toEqual(["n8n"]);
  });

  it("won't let the same model check its own work when the stakes are high", () => {
    const same = aiDecision({ models: { router: "haiku", worker: "sonnet", checker: "sonnet" } });
    expect(checkDecision(same, support, chunks).problems.join(" ")).toMatch(/models.checker" must differ/);
    const calm = { ...support, risks: ["none"] } as Answers;
    expect(checkDecision(same, calm, chunks).problems).toEqual([]);
  });

  it("still refuses what breaks a real limit, and says what it got", () => {
    expect(checkDecision(aiDecision({ approach: "a vibe" }), support, chunks).problems.join(" ")).toMatch(/got "a vibe"/);
    expect(checkDecision(aiDecision({ autonomy: "level 4" }), support, chunks).problems.join(" ")).toMatch(/at most 2/);
  });
});

describe("a recommendation built on an AI decision", () => {
  const decision = checkDecision(aiDecision(), support, chunks).decision as Decision;
  const rules = recommend(support);
  const ai = recommend(support, decision);

  it("takes the AI's choices and says where they depart from the rules", () => {
    expect(rules.approach.id).toBe("agent");
    expect(ai.approach.id).toBe("workflow");
    expect(ai.approach.why[0]).toMatchObject({ ruleId: "AI", differs: "The rules suggested one AI agent." });
    expect(ai.topology).toMatchObject({ primary: "routing", addOns: ["evaluator"] });
    expect(ai.tools.find((t) => t.core)!.tool).toBe("n8n");
    expect(ai.tools[0].why[0].differs).toMatch(/n8n agent|n8n/i);
    expect(ai.hosting.why.ruleId).toBe("AI");
    expect(ai.decided?.shortlist.map((c) => c.tool)).toEqual(["n8n", "airflow"]);
  });

  it("keeps the rules' consequences and limits around the AI's choices", () => {
    // The simpler start follows the AI's approach, not the rules'.
    expect(ai.simpler.title).not.toBe(rules.simpler.title);
    // The autonomy cap's reasons stay with the AI's level.
    expect(ai.autonomy.level).toBe(2);
    expect(ai.autonomy.why.slice(1).every((w) => w.ruleId !== "AI")).toBe(true);
    // Warnings follow the tool actually chosen.
    expect(ai.gotchas.map((g) => g.id)).toContain("G21");
  });

  it("puts the AI's model on each step of the diagram", () => {
    const bp = buildBlueprint(ai, support);
    const router = bp.nodes.find((n) => n.engine?.kind === "model" && n.engine.role === "router")!;
    expect(router.engine!.kind === "model" && router.engine!.model).toBe("haiku");
    expect(router.engine!.kind === "model" && router.engine!.why).toMatch(/Chosen by AI/);
  });

  it("can't exceed the cap even if handed a higher level", () => {
    expect(recommend(support, { ...decision, autonomy: 4 }).autonomy.level).toBe(2);
  });

  it("leaves the rules' own recommendation unchanged without a decision", () => {
    expect(rules.decided).toBeUndefined();
    expect(rules.modelPicks).toBeUndefined();
    expect(rules.approach.why.every((w) => w.ruleId !== "AI")).toBe(true);
  });
});

describe("decision endpoint", () => {
  const env = { apiKey: "test-key", model: "gpt-6-luna" };
  const fake = (...replies: unknown[]) => {
    const calls: string[] = [];
    return { calls, complete: async (_i: string, input: string) => (calls.push(input), JSON.stringify(replies[Math.min(calls.length - 1, replies.length - 1)])) };
  };

  it("refuses without a key or complete answers, without calling anything", async () => {
    const f = fake(aiDecision());
    expect((await handleDecide({ answers: support }, {}, f.complete)).status).toBe(503);
    expect((await handleDecide({ answers: { task: "x" } }, env, f.complete)).status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it("gives the model the rules' recommendation, the options, the limits and the knowledge, and caches the checked decision", async () => {
    const cache = memoryCache();
    const f = fake(aiDecision());
    const out = await handleDecide({ answers: support }, { ...env, cache }, f.complete);
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ source: "ai", decision: { approach: "workflow" } });
    for (const part of ["RULES' RECOMMENDATION", "OPTIONS:", "LIMITS", "KNOWLEDGE:", "Autonomy: at most level 2"]) expect(f.calls[0]).toContain(part);
    const again = await handleDecide({ answers: support }, { ...env, cache }, f.complete);
    expect(again.body.source).toBe("cache");
    expect(f.calls).toHaveLength(1);
    // Every later step builds on it.
    expect(decidedRecommendation(support, { ...env, cache }).approach.id).toBe("workflow");
  });

  it("asks once for a repair with the exact problems, then falls back to the rules", async () => {
    const repaired = fake(aiDecision({ autonomy: 4 }), aiDecision());
    expect((await handleDecide({ answers: support }, { ...env, cache: memoryCache() }, repaired.complete)).status).toBe(200);
    expect(repaired.calls[1]).toMatch(/BROKE THESE LIMITS[\s\S]*at most 2/);

    const cache = memoryCache();
    const stubborn = fake(aiDecision({ autonomy: 4 }));
    expect((await handleDecide({ answers: support }, { ...env, cache }, stubborn.complete)).status).toBe(502);
    expect(stubborn.calls).toHaveLength(2);
    expect(decidedRecommendation(support, { ...env, cache }).approach.id).toBe("agent");
  });
});

describe("advice follows the decided approach, not the answers' shape", () => {
  /** Rules: a workflow with AI steps in n8n; it reads the owner's systems and handles personal data. */
  const readings: Answers = {
    task: "Flag readings over a threshold", shape: "judgement", kinds: "no", split: "sequential", quality: "clear", knowledge: ["playbook"],
    systems: "read", trigger: "event", volume: "daily", risks: ["personal"], location: "open", team: "small",
  };
  /** The AI disagrees: the thresholds are fixed, so plain automation will do. */
  const automation = checkDecision(
    aiDecision({
      summary: "The thresholds are fixed, so a plain workflow checks each reading and alerts; no AI is needed.",
      approach: "automation",
      topology: { primary: "pipeline", addOns: [] },
      tools: [{ tool: "n8n", role: "Runs the checks and sends the alerts." }, { tool: "integrations", role: "Reads the readings." }],
      autonomy: 3,
      models: {},
      shortlist: [{ tool: "n8n", reason: "Visual and quick to build.", tradeoff: "Less control over recovery." }],
      reasons: { ...aiDecision().reasons, approach: reason("Each reading is compared with a fixed threshold: no judgement is involved."), models: reason("No AI steps, so no models.") },
    }),
    readings,
    chunks,
  ).decision as Decision;
  const ids = (r: ReturnType<typeof recommend>) => r.gotchas.map((g) => g.id);

  it("drops the AI-only warnings, steps and guardrails when the AI chooses plain automation", () => {
    const rules = recommend(readings);
    const ai = recommend(readings, automation);
    expect(rules.approach.id).toBe("workflow");
    expect(ids(rules)).toEqual(expect.arrayContaining(["G3", "G4", "G19"]));
    expect(rules.firstSteps[1]).toMatch(/Claude/);
    expect(rules.firstSteps[1]).toMatch(/most capable model/);

    expect(ai.approach.id).toBe("automation");
    for (const g of ["G3", "G4", "G19"]) expect(ids(ai)).not.toContain(g);
    expect(ids(ai)).toEqual(expect.arrayContaining(["G1", "G10"]));
    expect(ai.firstSteps[1]).not.toMatch(/Claude|model/i);
    expect(ai.firstSteps[1]).toMatch(/manual start button/);
    expect(ai.firstSteps[0]).toMatch(/every step, rule and exception/);
    expect(ai.firstSteps[2]).toMatch(/alert when a run fails/);
    expect(ai.models.needed).toBe(false);
    expect(ai.models.capabilities).toEqual([]);
    expect(ai.autonomy.guardrails).toEqual([]);
    expect(ai.autonomy.checkpoints[0]).toMatch(/If a run fails, stop and alert/);
    expect(ai.simpler.title).toBe("A written checklist");
    expect(ai.fired).toContain("S5");
    expect(ai.fired).not.toContain("S3");
  });

  it("adds them when the AI chooses AI steps for rules-shaped answers", () => {
    const fixed: Answers = { task: "Send overdue invoice reminders", shape: "rules", systems: "act", trigger: "schedule", volume: "daily", risks: ["personal"], location: "open", team: "small" };
    const workflow = checkDecision(
      aiDecision({ topology: { primary: "chain", addOns: [] }, tools: [{ tool: "n8n", role: "Runs the workflow." }, { tool: "system-prompt", role: "The brief." }], autonomy: 3, models: { worker: "sonnet" } }),
      fixed,
      chunks,
    ).decision as Decision;
    const rules = recommend(fixed);
    const ai = recommend(fixed, workflow);
    expect(rules.approach.id).toBe("automation");
    expect(ids(rules)).toEqual(expect.arrayContaining(["G1", "G10"]));
    expect(ids(rules)).not.toContain("G19");

    expect(ai.approach.id).toBe("workflow");
    expect(ids(ai)).toEqual(expect.arrayContaining(["G3", "G4", "G19"]));
    for (const g of ["G1", "G10"]) expect(ids(ai)).not.toContain(g);
    expect(ai.firstSteps[1]).toMatch(/playbook/);
    expect(ai.firstSteps[0]).toMatch(/real past examples/);
    expect(ai.models.needed).toBe(true);
    expect(ai.models.capabilities.map((c) => c.title)).toContain("Follows instructions closely");
    expect(ai.autonomy.guardrails.length).toBeGreaterThan(0);
    expect(ai.simpler.title).toBe("Do it by hand with AI first");
  });

  it("leaves the rules' own result unchanged when there is no decision", () => {
    expect(recommend(readings).fired).toEqual(expect.arrayContaining(["A2", "S3", "G3", "G4", "G19", "M10", "AU10"]));
  });
});
