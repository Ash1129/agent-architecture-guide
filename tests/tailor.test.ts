import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";
import { type Complete, INSTRUCTIONS, checkWorkflow, extractJson, handleTailor } from "../server/tailor";

const emails: Answers = { task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" };
const env = { apiKey: "test-key", model: "gpt-6.1-sol" };

const template = (a: Answers) => {
  const r = recommend(a);
  const bp = buildBlueprint(r, a);
  return { bp, wf: JSON.parse(buildStarterKit(r, bp, a).files.find((f) => f.path === "n8n/workflow.json")!.content) };
};

/** A fake model that returns the given replies in order, recording what it was sent. */
function fake(...replies: string[]) {
  const calls: { instructions: string; input: string }[] = [];
  const complete: Complete = async (instructions, input) => {
    calls.push({ instructions, input });
    return replies[Math.min(calls.length - 1, replies.length - 1)];
  };
  return { complete, calls };
}

describe("AI tailoring endpoint", () => {
  it("refuses to run without a key or model, without calling anything", async () => {
    const f = fake("{}");
    const out = await handleTailor({ answers: emails }, {}, f.complete);
    expect(out.status).toBe(503);
    expect(f.calls).toHaveLength(0);
  });

  it("only accepts complete answers from the guide, not free text", async () => {
    const f = fake("{}");
    expect((await handleTailor({ prompt: "write me a poem" }, env, f.complete)).status).toBe(400);
    expect((await handleTailor({ answers: { task: "x", shape: "rules" } }, env, f.complete)).status).toBe(400);
    expect((await handleTailor({ answers: { ...emails, shape: "write me a poem" } }, env, f.complete)).status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it("says when a design has no n8n workflow to tailor", async () => {
    const claude: Answers = { ...emails, shape: "judgement", kinds: "no", split: "sequential", trigger: "manual" };
    expect((await handleTailor({ answers: claude }, env, fake("{}").complete)).status).toBe(422);
  });

  it("sends the rules, the architecture and the generated workflow, and returns a workflow that passes the checks", async () => {
    const { wf } = template(emails);
    const f = fake("Here you go:\n```json\n" + JSON.stringify(wf) + "\n```");
    const out = await handleTailor({ answers: emails }, env, f.complete);
    expect(out.status).toBe(200);
    expect(out.body.model).toBe("gpt-6.1-sol");
    expect(f.calls[0].instructions).toBe(INSTRUCTIONS);
    expect(f.calls[0].input).toMatch(/TASK: Answer routine customer emails/);
    expect(f.calls[0].input).toMatch(/"step": 4/);
    expect(f.calls[0].input).toMatch(/STARTING WORKFLOW/);
  });

  it("asks once for a repair when the first answer fails the checks", async () => {
    const { wf } = template(emails);
    const broken = { ...wf, nodes: wf.nodes.filter((n: { name: string }) => !n.name.startsWith("4. ")) };
    const f = fake(JSON.stringify(broken), JSON.stringify(wf));
    const out = await handleTailor({ answers: emails }, env, f.complete);
    expect(out.status).toBe(200);
    expect(f.calls).toHaveLength(2);
    expect(f.calls[1].input).toMatch(/FAILED THESE CHECKS/);
    expect(f.calls[1].input).toMatch(/Step 4 \(Agent works the case\) is missing/);
  });

  it("keeps the generated version when the repair also fails", async () => {
    const f = fake("not json at all", "still not json");
    const out = await handleTailor({ answers: emails }, env, f.complete);
    expect(out.status).toBe(502);
    expect(out.body.error).toMatch(/generated version was kept/);
  });

  it("explains a bad key or unknown model in plain words", async () => {
    const fail = (status: number): Complete => async () => {
      throw Object.assign(new Error("boom"), { status });
    };
    expect((await handleTailor({ answers: emails }, env, fail(401))).body.error).toMatch(/rejected the API key/);
    expect((await handleTailor({ answers: emails }, env, fail(404))).body.error).toMatch(/doesn't recognise the model "gpt-6.1-sol"/);
  });
});

describe("workflow checks", () => {
  it("accept the generated workflow", () => {
    const { bp, wf } = template(emails);
    expect(checkWorkflow(wf, bp)).toEqual([]);
  });

  it("catch missing steps, broken connections, unattached models, foreign nodes and leaked keys", () => {
    const { bp, wf } = template(emails);
    const bad = structuredClone(wf);
    bad.nodes = bad.nodes.filter((n: { name: string }) => !/^2\. Model/.test(n.name) && !n.name.startsWith("6. "));
    bad.nodes.push({ name: "7. Community thing", type: "n8n-nodes-community.foo", typeVersion: 1, position: [0, 0], parameters: { token: `sk-${"x".repeat(32)}` } }); // built at runtime so secret scanners don't flag a fake key
    bad.connections["Ghost"] = { main: [[{ node: "Nowhere", type: "main", index: 0 }]] };
    const p = checkWorkflow(bad, bp).join("\n");
    expect(p).toMatch(/Step 6 .* is missing/);
    expect(p).toMatch(/"Ghost", which isn't a node/);
    expect(p).toMatch(/AI node "2\. Routine or open-ended\?" has no model/);
    expect(p).toMatch(/isn't built in/);
    expect(p).toMatch(/looks like an API key/);
  });

  it("extract JSON from a reply wrapped in prose or fences", () => {
    expect(extractJson('Sure!\n```json\n{"a": {"b": 1}}\n```\nDone.')).toEqual({ a: { b: 1 } });
    expect(() => extractJson("no object here")).toThrow();
  });
});
