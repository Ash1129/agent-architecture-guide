import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CACHE_LIMIT, fileCache, memoryCache } from "../server/cache";
import { INSTRUCTIONS, PLAN_VERSION, REUSE_SIMILARITY, handleInterview, questionBank } from "../server/interview";
import { type Complete, handleTailor } from "../server/tailor";
import { ADAPTABLE, MAX_DETAILS, adaptQuestion, normaliseTask, validatePlan } from "../src/lib/interview";
import { type Answers, QUESTION_BY_ID, effectiveAnswers } from "../src/lib/questions";
import { decodeAnswers, encodeAnswers, resultCode } from "../src/lib/share";

/** A plan the model might return: every question reworded, with suggestions. */
function goodPlan() {
  return {
    summary: "Reply to routine customer emails.",
    questions: ADAPTABLE.map((q) => ({
      id: q.id,
      title: `Adapted: ${q.title}`,
      help: "In your inbox's terms.",
      options: q.options!.map((o) => ({ value: o.value, label: `Adapted ${o.label}`, hint: "An example from your task." })),
      suggested: q.id === "shape" ? "varies" : q.id === "risks" ? ["visible", "none"] : null,
      reason: q.id === "shape" || q.id === "risks" ? "You said routine customer emails." : undefined,
    })),
    details: [
      { title: "Which inbox do the emails arrive in?", kind: "single", options: ["Gmail", "Outlook", "A help desk"] },
      { title: "Which languages do customers write in?", kind: "multi", options: ["English", "Spanish"] },
      { title: "Who signs off replies?", kind: "text" },
      { title: "One too many", kind: "text" },
    ],
  };
}

const fakeModel = (...replies: string[]) => {
  const calls: string[] = [];
  const complete: Complete = async (_i, input) => {
    calls.push(input);
    return replies[Math.min(calls.length - 1, replies.length - 1)];
  };
  return { complete, calls };
};
const env = { apiKey: "test-key", model: "gpt-6-luna" };

describe("plan validation (the rules layer for the AI's questions)", () => {
  it("keeps the model's wording and suggestions when they fit the question bank", () => {
    const p = validatePlan(goodPlan());
    expect(Object.keys(p.questions)).toHaveLength(ADAPTABLE.length);
    expect(p.questions.shape).toMatchObject({ title: `Adapted: ${QUESTION_BY_ID.shape.title}`, suggested: "varies" });
    expect(p.questions.shape!.options.map((o) => o.value)).toEqual(QUESTION_BY_ID.shape.options!.map((o) => o.value));
    expect(p.summary).toBe("Reply to routine customer emails.");
  });

  it("falls back to the standard options when the model adds, drops or renames a value", () => {
    const raw = goodPlan();
    const systems = raw.questions.find((q) => q.id === "systems")!;
    systems.options = systems.options.filter((o) => o.value !== "act");
    const trigger = raw.questions.find((q) => q.id === "trigger")!;
    trigger.options = [...trigger.options, { value: "whenever", label: "Whenever", hint: "" }];
    const p = validatePlan(raw);
    expect(p.questions.systems!.options).toEqual(QUESTION_BY_ID.systems.options!.map((o) => ({ value: o.value, label: o.label, ...(o.hint ? { hint: o.hint } : {}) })));
    expect(p.questions.trigger!.options.map((o) => o.label)).toEqual(QUESTION_BY_ID.trigger.options!.map((o) => o.label));
    // The title survives; only the broken options fall back.
    expect(p.questions.systems!.title).toMatch(/^Adapted/);
  });

  it("always keeps the bank's option order, whatever order the model used", () => {
    const raw = goodPlan();
    raw.questions.find((q) => q.id === "volume")!.options.reverse();
    expect(validatePlan(raw).questions.volume!.options.map((o) => o.value)).toEqual(["occasional", "daily", "high"]);
  });

  it("drops suggestions that aren't real answers, and applies 'none of these' as exclusive", () => {
    const raw = goodPlan();
    raw.questions.find((q) => q.id === "team")!.suggested = "enormous";
    const p = validatePlan(raw);
    expect(p.questions.team!.suggested).toBeUndefined();
    expect(p.questions.risks!.suggested).toEqual(["none"]);
  });

  it("keeps at most three well-formed task-specific questions, renumbered", () => {
    const raw = goodPlan();
    raw.details.unshift({ title: "Pick one", kind: "single", options: ["Only one"] });
    const p = validatePlan(raw);
    expect(p.details).toHaveLength(MAX_DETAILS);
    expect(p.details.map((d) => d.id)).toEqual(["d1", "d2", "d3"]);
    expect(p.details[0].title).toBe("Which inbox do the emails arrive in?");
  });

  it("turns anything unusable into the standard questions without throwing", () => {
    for (const junk of [null, "text", { questions: "no" }, { questions: [{ id: "shape", options: 3 }] }]) {
      const p = validatePlan(junk);
      expect(p.details).toEqual([]);
      for (const q of Object.values(p.questions)) expect(q!.title).toBe(QUESTION_BY_ID[q!.id].title);
    }
  });

  it("shows adapted wording but keeps the bank's meaning for each value", () => {
    const q = adaptQuestion(QUESTION_BY_ID.shape, validatePlan(goodPlan()));
    expect(q.title).toMatch(/^Adapted/);
    expect(q.options!.map((o) => o.short)).toEqual(QUESTION_BY_ID.shape.options!.map((o) => o.short));
    expect(adaptQuestion(QUESTION_BY_ID.shape)).toBe(QUESTION_BY_ID.shape);
  });

  it("treats case, spacing and punctuation as the same task", () => {
    expect(normaliseTask("  Answer routine customer e-mails! ")).toBe(normaliseTask("answer routine customer e mails"));
  });
});

describe("task-specific details in answers", () => {
  const a: Answers = { task: "Answer routine customer emails", shape: "rules", systems: "read", trigger: "event", volume: "daily", risks: ["none"], location: "open", team: "small", details: [{ q: "Which inbox do the emails arrive in?", a: "Gmail" }] };

  it("survive share links and effective answers", () => {
    expect(decodeAnswers(encodeAnswers(a))?.details).toEqual(a.details);
    expect(effectiveAnswers(a).details).toEqual(a.details);
  });

  it("are validated when decoded from a link", () => {
    const bad = encodeAnswers({ ...a, details: [{ q: "x", a: "too short a question" }, { q: "A fine question?", a: 42 }, "junk"] } as unknown as Answers);
    expect(decodeAnswers(bad)?.details).toBeUndefined();
  });
});

describe("shared cache", () => {
  it("finds entries exactly and by meaning", () => {
    const c = memoryCache();
    c.put("ns", { key: "a", value: 1, embedding: [1, 0] });
    c.put("ns", { key: "b", value: 2, embedding: [0, 1] });
    expect(c.get("ns", "a")?.value).toBe(1);
    expect(c.get("other", "a")).toBeUndefined();
    const near = c.nearest<number>("ns", [0.9, 0.1])!;
    expect(near.entry.value).toBe(1);
    expect(near.score).toBeGreaterThan(0.99);
  });

  it("keeps only the newest entries", () => {
    let t = 0;
    const c = memoryCache({}, undefined, () => t++);
    for (let i = 0; i <= CACHE_LIMIT; i++) c.put("ns", { key: `k${i}`, value: i });
    expect(c.get("ns", "k0")).toBeUndefined();
    expect(c.get("ns", `k${CACHE_LIMIT}`)?.value).toBe(CACHE_LIMIT);
  });

  it("saves to a file and reads it back, starting empty if the file is damaged", () => {
    const dir = mkdtempSync(join(tmpdir(), "aag-cache-"));
    try {
      const path = join(dir, "cache.json");
      fileCache(path).put("ns", { key: "a", value: { ok: true } });
      expect(fileCache(path).get("ns", "a")?.value).toEqual({ ok: true });
      expect(JSON.parse(readFileSync(path, "utf8")).ns.a.value).toEqual({ ok: true });
      fileCache(join(dir, "missing", "cache.json")).put("ns", { key: "b", value: 1 });
      expect(fileCache(join(dir, "missing", "cache.json")).get("ns", "b")?.value).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("interview endpoint", () => {
  it("refuses without a key or a real task, without calling anything", async () => {
    const f = fakeModel("{}");
    expect((await handleInterview({ task: "x" }, {}, { complete: f.complete })).status).toBe(503);
    expect((await handleInterview({ task: " " }, env, { complete: f.complete })).status).toBe(400);
    expect((await handleInterview({ nope: 1 }, env, { complete: f.complete })).status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it("asks the model with the whole question bank, validates the plan and caches it", async () => {
    const cache = memoryCache();
    const f = fakeModel("Sure:\n```json\n" + JSON.stringify(goodPlan()) + "\n```");
    const out = await handleInterview({ task: "Answer routine customer emails" }, { ...env, cache }, { complete: f.complete, embed: async () => [1, 0] });
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ source: "ai", model: "gpt-6-luna" });
    expect(f.calls[0]).toMatch(/TASK: Answer routine customer emails/);
    for (const q of ADAPTABLE) expect(f.calls[0]).toContain(`"id": "${q.id}"`);
    expect(cache.get("interview", `${PLAN_VERSION}:${normaliseTask("Answer routine customer emails")}`)).toBeDefined();
  });

  it("serves a repeat of the same task from the cache, with no model or embedding call", async () => {
    const cache = memoryCache();
    const f = fakeModel(JSON.stringify(goodPlan()));
    let embeds = 0;
    const embed = async () => (embeds++, [1, 0]);
    await handleInterview({ task: "Answer routine customer emails" }, { ...env, cache }, { complete: f.complete, embed });
    const again = await handleInterview({ task: "answer routine customer emails." }, { ...env, cache }, { complete: f.complete, embed });
    expect(again.body.source).toBe("cache");
    expect(f.calls).toHaveLength(1);
    expect(embeds).toBe(1);
  });

  it("reuses a near-duplicate task's plan, and only shows a merely similar one to the model as a reference", async () => {
    const cache = memoryCache();
    const f = fakeModel(JSON.stringify(goodPlan()));
    await handleInterview({ task: "Answer routine customer emails" }, { ...env, cache }, { complete: f.complete, embed: async () => [1, 0] });

    const close = Math.sqrt(1 - REUSE_SIMILARITY ** 2) * 0.5;
    const dup = await handleInterview({ task: "Answer the routine customer emails" }, { ...env, cache }, { complete: f.complete, embed: async () => [1, close] });
    expect(dup.body).toMatchObject({ source: "similar", similarTo: "Answer routine customer emails" });
    expect(f.calls).toHaveLength(1);

    const similar = await handleInterview({ task: "Answer routine supplier emails" }, { ...env, cache }, { complete: f.complete, embed: async () => [0.8, 0.6] });
    expect(similar.body.source).toBe("ai");
    expect(f.calls[1]).toMatch(/REFERENCE: a plan made earlier for a similar task/);

    await handleInterview({ task: "Prepare the Monday sales report" }, { ...env, cache }, { complete: f.complete, embed: async () => [-0.6, 0.8] });
    expect(f.calls[2]).not.toMatch(/REFERENCE/);
  });

  it("still works when embeddings fail", async () => {
    const out = await handleInterview({ task: "Answer routine customer emails" }, { ...env, cache: memoryCache() }, {
      complete: fakeModel(JSON.stringify(goodPlan())).complete,
      embed: async () => {
        throw new Error("down");
      },
    });
    expect(out.body.source).toBe("ai");
  });

  it("reports a plan that doesn't fit, or a failed call, so the guide uses the standard questions", async () => {
    expect((await handleInterview({ task: "Answer emails" }, env, { complete: fakeModel("no json").complete })).status).toBe(502);
    expect((await handleInterview({ task: "Answer emails" }, env, { complete: fakeModel("{}").complete })).status).toBe(502);
  });

  it("tells the model to keep every value and its meaning", () => {
    expect(INSTRUCTIONS).toMatch(/Return every option value exactly as given/);
    expect(questionBank().find((q) => q.id === "split")).toMatchObject({ when: "asked only when shape is judgement" });
  });
});

describe("tailoring with the shared cache", () => {
  const emails: Answers = { task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "read", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" };

  it("serves the same design from the cache, and passes task details to the model", async () => {
    const { buildBlueprint } = await import("../src/lib/blueprint");
    const { recommend } = await import("../src/lib/rules");
    const { buildStarterKit } = await import("../src/lib/starter");
    const r = recommend(emails);
    const wf = buildStarterKit(r, buildBlueprint(r, emails), emails).files.find((f) => f.path === "n8n/workflow.json")!.content;
    const cache = memoryCache();
    const f = fakeModel(wf);
    const withDetails = { ...emails, details: [{ q: "Which inbox do the emails arrive in?", a: "Gmail" }] };

    const first = await handleTailor({ answers: withDetails }, { ...env, cache }, f.complete);
    expect(first.status).toBe(200);
    expect(f.calls[0]).toMatch(/TASK-SPECIFIC DETAILS[\s\S]*Which inbox do the emails arrive in\? Gmail/);

    const again = await handleTailor({ answers: withDetails }, { ...env, cache }, f.complete);
    expect(again.body.cached).toBe(true);
    expect(f.calls).toHaveLength(1);

    // Different details are a different design.
    await handleTailor({ answers: { ...withDetails, details: [{ q: "Which inbox do the emails arrive in?", a: "Outlook" }] } }, { ...env, cache }, f.complete);
    expect(f.calls).toHaveLength(2);
    expect(resultCode(withDetails)).not.toBe(resultCode(emails));
  });
});
