import { describe, expect, it } from "vitest";
import { type Blueprint, OK_EVERY_ACTION, buildBlueprint } from "../src/lib/blueprint";
import { type DesignDraft, asDraft, checkDesign } from "../src/lib/design";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";
import { sampledPaths } from "./paths";

const chunks = [
  { id: "P01", title: "The five workflow patterns" },
  { id: "A02", title: "When a person must step in" },
];
const emails: Answers = { task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" };
const invoices: Answers = { task: "Send overdue invoice reminders", shape: "rules", systems: "act", trigger: "schedule", volume: "daily", risks: ["none"], location: "open", team: "small" };

/** The rules' own design, as a draft that cites the knowledge base. */
function draftOf(a: Answers) {
  const r = recommend(a);
  const baseline = buildBlueprint(r, a);
  const d = asDraft(baseline);
  d.steps.forEach((s) => (s.kb = ["P01"]));
  return { r, baseline, d, ctx: { r, a, baseline, chunks } };
}
const problems = (d: DesignDraft, a: Answers) => checkDesign(d, draftOf(a).ctx).problems.join("\n");

describe("AI design hard limits", () => {
  it("are consistent with the rules: the rules' own design always passes and still builds a working kit", () => {
    for (const a of [emails, invoices, ...sampledPaths(300)]) {
      const { r, baseline, d, ctx } = draftOf(a);
      const { blueprint, problems } = checkDesign(d, ctx);
      expect(problems).toEqual([]);
      expect(blueprint!.nodes).toHaveLength(baseline.nodes.length);
      expect(blueprint!.stages).toBe(baseline.stages);
      // n8n merges parallel branches using the "same time" captions, so those must match exactly.
      const sameTime = (bp: Blueprint) => Object.entries(bp.captions).filter(([, t]) => /same time/i.test(t)).map(([s]) => s);
      expect(sameTime(blueprint!)).toEqual(sameTime(baseline));
      expect(() => buildStarterKit(r, blueprint!, a)).not.toThrow();
    }
  });

  it("read underscores in step ids as hyphens, so a tidy-but-snake_case draft isn't thrown away", () => {
    const { d, ctx } = draftOf(emails);
    const step = d.steps.find((x) => x.kind === "ai")!;
    const old = step.id;
    step.id = `${old}_step`;
    d.edges.forEach((e) => {
      if (e.from === old) e.from = `${old}_step`;
      if (e.to === old) e.to = `${old}_step`;
    });
    const { blueprint, problems } = checkDesign(d, ctx);
    expect(problems).toEqual([]);
    expect(blueprint!.nodes.some((n) => n.id === `${old}-step`)).toBe(true);
  });

  it("let the model rename, rewrite and add steps, and cite the knowledge base", () => {
    const { d, ctx } = draftOf(emails);
    const agent = d.steps.find((s) => s.id === "agent")!;
    agent.name = "Work the customer's case";
    d.steps.push({ id: "log", kind: "fixed", name: "Log the reply", label: "Help desk", method: "scripted", what: "Records the sent reply.", why: "Keeps a history.", passes: "A log entry.", kb: ["P01"] });
    d.edges = d.edges.map((e) => (e.from === "approve" ? { ...e, to: "log" } : e));
    d.edges.push({ from: "log", to: "end", style: "flow" });
    const { blueprint, problems } = checkDesign(d, ctx);
    expect(problems).toEqual([]);
    expect(blueprint!.nodes.map((n) => n.name)).toContain("Work the customer's case");
    expect(blueprint!.nodes.find((n) => n.id === "log")).toMatchObject({ engine: { kind: "algorithm", name: "Scripted action" }, kb: [{ id: "P01", title: "The five workflow patterns" }] });
    // Steps are renumbered in drawing order.
    expect(blueprint!.nodes.map((n) => n.step)).toEqual(blueprint!.nodes.map((_, i) => i + 1));
  });

  it("choose the model from the step's role, never from the draft", () => {
    const { d, ctx } = draftOf(emails);
    (d.steps.find((s) => s.id === "agent") as Record<string, unknown>).model = "opus";
    const agent = checkDesign(d, ctx).blueprint!.nodes.find((n) => n.id === "agent")!;
    expect(agent.engine).toMatchObject({ kind: "model", role: "agent", model: "sonnet" });
  });

  it("refuse to drop a safeguard or a person's approval", () => {
    const { d } = draftOf(emails);
    d.steps.find((s) => s.id === "tools")!.gates = [];
    d.steps = d.steps.filter((s) => s.id !== "approve");
    d.edges = d.edges.filter((e) => e.from !== "approve" && e.to !== "approve").concat([{ from: "agent", to: "end", style: "flow" }, { from: "routine", to: "end", style: "flow" }]);
    const p = problems(d, emails);
    expect(p).toMatch(new RegExp(`Keep the safeguard "${OK_EVERY_ACTION}"`));
    expect(p).toMatch(/Keep at least 1 person \(human\) step/);
  });

  it("keep the approach: no AI in a no-AI design, one agent in a one-agent design", () => {
    const { d: noAi } = draftOf(invoices);
    noAi.steps.find((s) => s.id === "actA")!.kind = "ai";
    noAi.steps.find((s) => s.id === "actA")!.role = "worker";
    expect(problems(noAi, invoices)).toMatch(/can't be an AI step: this design needs no AI/);

    const { d: two } = draftOf(emails);
    two.steps.find((s) => s.id === "routine")!.kind = "ai";
    two.steps.find((s) => s.id === "routine")!.role = "agent";
    expect(problems(two, emails)).toMatch(/exactly one step must have the role "agent" \(found 2\)/);
  });

  it("keep how the work starts, from the owner's trigger answer", () => {
    const { d } = draftOf(emails);
    d.steps.find((s) => s.id === "start")!.id = "inbox";
    d.edges.forEach((e) => e.from === "start" && (e.from = "inbox"));
    expect(problems(d, emails)).toMatch(/Keep exactly the start steps given \(ids: start\)/);
  });

  it("accept only knowledge-base chunks the model was given, and require them on AI and person steps", () => {
    const { d } = draftOf(emails);
    d.steps.find((s) => s.id === "agent")!.kb = ["Z99"];
    d.steps.find((s) => s.id === "approve")!.kb = [];
    const p = problems(d, emails);
    expect(p).toMatch(/Step "agent" cites Z99, which isn't a chunk you were given/);
    expect(p).toMatch(/Step "approve" must cite at least one KNOWLEDGE chunk/);
  });

  it("keep tool steps as things an AI step uses, not steps in the main flow", () => {
    // In n8n a tool hangs off the AI step that calls it, so a tool in the main flow would cut the workflow in two.
    const { d } = draftOf(emails);
    d.edges = d.edges.filter((e) => e.from !== "start");
    d.edges.push({ from: "start", to: "tools", style: "flow" }, { from: "tools", to: "router", style: "flow" });
    const p = problems(d, emails);
    expect(p).toMatch(/Tool step "tools" must be used by an AI step/);
    expect(p).toMatch(/may only loop back to the AI step that uses it; tools -> router doesn't/);
  });

  it("require a well-formed graph", () => {
    const { d } = draftOf(emails);
    d.edges.push({ from: "approve", to: "router", style: "flow" });
    expect(problems(d, emails)).toMatch(/form a cycle/);

    const { d: island } = draftOf(emails);
    island.steps.push({ id: "orphan", kind: "fixed", name: "Orphan", label: "x", method: "scripted", what: "x", why: "x", passes: "x" });
    island.edges.push({ from: "orphan", to: "end", style: "flow" });
    expect(problems(island, emails)).toMatch(/Step "orphan" can't be reached/);

    const { d: badLoop } = draftOf(emails);
    badLoop.edges.push({ from: "router", to: "approve", style: "loop" });
    expect(problems(badLoop, emails)).toMatch(/doesn't go back to an earlier step/);

    expect(checkDesign({ steps: "no" }, draftOf(emails).ctx).problems).toEqual(['The design must be an object with "steps" and "edges" arrays.']);
  });
});

describe("knowledge retrieval for the design", () => {
  it("picks at most eight real chunks, always including the workflow patterns, the same way every time", async () => {
    const { loadChunks, selectChunks, MAX_CHUNKS } = await import("../server/knowledge");
    const all = loadChunks();
    for (const a of [emails, invoices]) {
      const r = recommend(a);
      const picked = selectChunks(r, buildBlueprint(r, a));
      expect(picked.length).toBeLessThanOrEqual(MAX_CHUNKS);
      expect(picked[0].id).toBe("P01");
      for (const c of picked) expect(all.get(c.id)?.text.length).toBeGreaterThan(200);
      expect(selectChunks(r, buildBlueprint(r, a)).map((c) => c.id)).toEqual(picked.map((c) => c.id));
    }
  });
});

describe("design endpoint", () => {
  const env = { apiKey: "test-key", model: "gpt-6-luna" };
  /** A draft the model might return: the rules' design, made specific, citing the chunks it was given. */
  async function goodDraft(a: Answers) {
    const { selectChunks } = await import("../server/knowledge");
    const r = recommend(a);
    const baseline = buildBlueprint(r, a);
    const cite = selectChunks(r, baseline)[0].id;
    const d = asDraft(baseline);
    d.steps.forEach((s) => (s.kb = [cite]));
    d.steps.find((s) => s.kind === "ai")!.name = "Work the customer's case";
    return d;
  }
  const fake = (...replies: string[]) => {
    const calls: string[] = [];
    return { calls, complete: async (_i: string, input: string) => (calls.push(input), replies[Math.min(calls.length - 1, replies.length - 1)]) };
  };

  it("refuses without a key or complete answers, without calling anything", async () => {
    const { handleDesign } = await import("../server/design");
    const f = fake("{}");
    expect((await handleDesign({ answers: emails }, {}, f.complete)).status).toBe(503);
    expect((await handleDesign({ answers: { task: "x" } }, env, f.complete)).status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it("gives the model the limits, the rules' design and the knowledge, and caches the checked design", async () => {
    const { handleDesign } = await import("../server/design");
    const { memoryCache } = await import("../server/cache");
    const cache = memoryCache();
    const f = fake(JSON.stringify(await goodDraft(emails)));
    const out = await handleDesign({ answers: emails }, { ...env, cache }, f.complete);
    expect(out.status).toBe(200);
    expect(out.body.source).toBe("ai");
    expect((out.body.blueprint as Blueprint).nodes.map((n) => n.name)).toContain("Work the customer's case");
    expect(f.calls[0]).toMatch(/LIMITS FOR THIS DESIGN/);
    expect(f.calls[0]).toContain(`"${OK_EVERY_ACTION}" (human) on a tool step`);
    expect(f.calls[0]).toMatch(/STARTING DESIGN/);
    expect(f.calls[0]).toMatch(/KNOWLEDGE:\n\n### P01: /);

    const again = await handleDesign({ answers: emails }, { ...env, cache }, f.complete);
    expect(again.body.source).toBe("cache");
    expect(f.calls).toHaveLength(1);
  });

  it("asks once for a repair with the exact problems, then falls back to the rules' design", async () => {
    const { handleDesign } = await import("../server/design");
    const broken = await goodDraft(emails);
    broken.steps.find((s) => s.id === "tools")!.gates = [];
    const f = fake(JSON.stringify(broken), JSON.stringify(await goodDraft(emails)));
    expect((await handleDesign({ answers: emails }, env, f.complete)).status).toBe(200);
    expect(f.calls[1]).toMatch(/YOUR PREVIOUS DESIGN FAILED THESE CHECKS[\s\S]*Keep the safeguard "You OK every action"/);

    const g = fake(JSON.stringify(broken));
    const out = await handleDesign({ answers: emails }, env, g.complete);
    expect(out.status).toBe(502);
    expect(out.body.error).toMatch(/rules' design is shown/);
    expect(g.calls).toHaveLength(2);
  });

  it("is what tailoring builds on once it exists", async () => {
    const { handleDesign } = await import("../server/design");
    const { handleTailor } = await import("../server/tailor");
    const { memoryCache } = await import("../server/cache");
    const cache = memoryCache();
    await handleDesign({ answers: emails }, { ...env, cache }, fake(JSON.stringify(await goodDraft(emails))).complete);
    const t = fake("not json");
    await handleTailor({ answers: emails }, { ...env, cache }, t.complete);
    expect(t.calls[0]).toContain("Work the customer's case");
  });
});

describe("single flight", () => {
  it("makes one model call when the same design is asked for twice at once", async () => {
    const { handleDesign } = await import("../server/design");
    const { memoryCache } = await import("../server/cache");
    const { selectChunks } = await import("../server/knowledge");
    const r = recommend(emails);
    const baseline = buildBlueprint(r, emails);
    const d = asDraft(baseline);
    d.steps.forEach((s) => (s.kb = [selectChunks(r, baseline)[0].id]));
    let calls = 0;
    const slow = async () => {
      calls++;
      await new Promise((ok) => setTimeout(ok, 20));
      return JSON.stringify(d);
    };
    const env = { apiKey: "k", model: "m", cache: memoryCache() };
    const [x, y] = await Promise.all([handleDesign({ answers: emails }, env, slow), handleDesign({ answers: emails }, env, slow)]);
    expect(calls).toBe(1);
    expect(x.body.blueprint).toEqual(y.body.blueprint);
  });
});
