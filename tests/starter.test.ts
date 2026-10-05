import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { MODEL_API_ID, buildStarterKit, slugify } from "../src/lib/starter";
import { allPaths, sampledPaths } from "./paths";

const kit = (a: Answers) => {
  const r = recommend(a);
  const bp = buildBlueprint(r, a);
  const k = buildStarterKit(r, bp, a);
  return { r, bp, files: k.files, tools: k.tools };
};
const file = (files: { path: string; content: string }[], p: string | RegExp) =>
  files.find((f) => (typeof p === "string" ? f.path === p : p.test(f.path)));

const base = { location: "open", team: "mid", volume: "daily" } as const;
const support: Answers = { ...base, task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook", "reference"], systems: "act", trigger: "event", risks: ["visible", "personal"] };
const reminders: Answers = { ...base, task: "Send overdue invoice reminders", shape: "rules", systems: "act", trigger: "schedule", risks: ["none"], team: "small" };
const sections: Answers = { ...base, task: "Tailor resumes", shape: "judgement", kinds: "no", split: "sections", quality: "clear", knowledge: ["playbook"], systems: "none", trigger: "event", risks: ["none"] };
const dataJobs: Answers = { ...base, task: "Build the margin report", shape: "judgement", kinds: "no", split: "sequential", quality: "partly", knowledge: ["none"], systems: "read", trigger: "data", risks: ["none"], team: "large" };
const restricted: Answers = { ...support, location: "restricted" };

/** Everything a kit must satisfy, whatever the design. */
function problems(a: Answers): string[] {
  const { r, bp, files, tools } = kit(a);
  const p: string[] = [];
  for (const t of tools) {
    const ok = t.action.kind === "zip" ? files.some((f) => f.path.startsWith((t.action as { prefix: string }).prefix)) : files.some((f) => f.path === (t.action as { path: string }).path);
    if (!ok) p.push(`tool ${t.id} points at missing files`);
  }
  const brief = files[0];
  if (brief.path !== "BUILD.md") p.push("BUILD.md not first");
  for (const f of files.slice(1)) if (!brief.content.includes(f.content.trim())) p.push(`BUILD.md missing ${f.path}`);
  for (const n of bp.nodes) if (!brief.content.includes(n.name)) p.push(`BUILD.md missing step ${n.name}`);
  const used = [...new Set(bp.nodes.flatMap((n) => (n.engine?.kind === "model" ? [MODEL_API_ID[n.engine.model]] : [])))];
  for (const id of used) if (!brief.content.includes(id)) p.push(`BUILD.md missing model ${id}`);
  if (!r.models.needed && files.some((f) => /claude-(opus|sonnet|haiku)|qwen3/.test(f.content))) p.push("model named in a no-AI design");
  if (!r.models.needed && file(files, "system-prompt.md")) p.push("system prompt in a no-AI design");
  if (a.location === "restricted" && files.some((f) => /claude-(opus|sonnet|haiku)/.test(f.content))) p.push("Claude model where it isn't available");
  for (const f of files) {
    if (!f.content.trim()) p.push(`${f.path} empty`);
    if (/[–—]/.test(f.content)) p.push(`${f.path} has an em or en dash`);
    if (f.lang === "json") {
      try {
        JSON.parse(f.content);
      } catch {
        p.push(`${f.path} is not valid JSON`);
      }
    }
  }
  for (const skill of files.filter((f) => /SKILL\.md$/.test(f.path))) {
    if (!/^---\nname: [a-z0-9-]{1,64}\ndescription: (>\n  .+|.+)\n[\s\S]*?\n---\n/.test(skill.content)) p.push(`${skill.path} frontmatter malformed`);
  }
  const manifest = file(files, "claude-plugin/.claude-plugin/plugin.json");
  if (manifest && !/^[a-z0-9-]+$/.test(JSON.parse(manifest.content).name)) p.push("plugin name not kebab-case");

  const wf = file(files, "n8n/workflow.json");
  if (wf) {
    const w = JSON.parse(wf.content) as { nodes: { name: string; type: string }[]; connections: Record<string, Record<string, { node: string }[][]>> };
    const names = new Set(w.nodes.map((x) => x.name));
    if (names.size !== w.nodes.length) p.push("n8n duplicate node names");
    for (const [from, types] of Object.entries(w.connections)) {
      if (!names.has(from)) p.push(`n8n connection from unknown ${from}`);
      for (const outs of Object.values(types)) for (const o of outs) for (const l of o) if (!names.has(l.node)) p.push(`n8n connection to unknown ${l.node}`);
    }
    // A full workflow carries every step; a hand-off to Hermes only catches the event and passes it on.
    const handoff = /hand-off to Hermes/.test((JSON.parse(wf.content) as { name: string }).name);
    if (!handoff) for (const n of bp.nodes) if (!names.has(`${n.step}. ${n.name}`)) p.push(`n8n missing step ${n.name}`);
    const llm = w.nodes.filter((x) => /chainLlm|langchain\.agent/.test(x.type)).map((x) => x.name);
    for (const name of llm) {
      const feeds = Object.values(w.connections).flatMap((t) => (t.ai_languageModel ?? []).flat()).filter((l) => l.node === name);
      if (feeds.length !== 1) p.push(`n8n ${name} has ${feeds.length} model nodes`);
    }
    // Every working node is reachable from the trigger.
    const reach = new Set<string>([...names].filter((x) => /^1\. /.test(x) || /^\d+\. (First|Second) data job/.test(x)));
    let grew = true;
    while (grew) {
      grew = false;
      for (const [from, t] of Object.entries(w.connections)) if (reach.has(from)) for (const l of (t.main ?? []).flat()) if (!reach.has(l.node)) (reach.add(l.node), (grew = true));
    }
    const mainNodes = w.nodes.filter((x) => !/stickyNote|lmChat|mcpClientTool/.test(x.type));
    for (const x of mainNodes) if (!reach.has(x.name)) p.push(`n8n ${x.name} unreachable`);
  }
  return p;
}

describe("starter kit for named designs", () => {
  it("customer support: a paste-ready n8n workflow with the brief built in", () => {
    const { files, tools } = kit(support);
    // MCP lives inside the workflow as a tool node; the playbook lives in the agent's instructions.
    expect(files.map((f) => f.path)).toEqual(["BUILD.md", "system-prompt.md", "n8n/workflow.json", "evals/examples.csv"]);
    expect(tools.map((t) => [t.id, t.action.label])).toEqual([["n8n", "Copy for n8n"]]);
    const agent = JSON.parse(file(files, "n8n/workflow.json")!.content).nodes.find((n: { type: string }) => n.type === "@n8n/n8n-nodes-langchain.agent");
    expect(agent.parameters.options.systemMessage).toBe(file(files, "system-prompt.md")!.content);
    const wf = JSON.parse(file(files, "n8n/workflow.json")!.content);
    expect(wf.nodes.some((n: { type: string }) => n.type === "@n8n/n8n-nodes-langchain.agent")).toBe(true);
    const tool = wf.nodes.find((n: { type: string }) => n.type === "@n8n/n8n-nodes-langchain.mcpClientTool");
    expect(wf.connections[tool.name].ai_tool[0][0].node).toBe("4. Agent works the case");
    expect(wf.nodes.some((n: { type: string }) => n.type === "n8n-nodes-base.wait")).toBe(true);
    expect(file(files, "BUILD.md")!.content).toMatch(/claude-sonnet-5-5/);
  });

  it("a Claude-based design gets an installable plugin", () => {
    const manual: Answers = { ...sections, trigger: "manual", task: "Tailor resumes to job descriptions" };
    const { files, tools } = kit(manual);
    expect(tools).toEqual([expect.objectContaining({ id: "claude-plugin", action: { kind: "zip", label: "Download .plugin", prefix: "claude-plugin/", filename: "tailor-resumes-to-job-descriptions.plugin" } })]);
    expect(JSON.parse(file(files, "claude-plugin/.claude-plugin/plugin.json")!.content).name).toBe("tailor-resumes-to-job-descriptions");
    expect(file(files, "claude-plugin/skills/tailor-resumes-to-job-descriptions/SKILL.md")?.content).toMatch(/^---\nname: tailor-resumes-to-job-descriptions\ndescription: >\n  This skill should be used when/);
  });

  it("a multi-agent Claude design gets one subagent per role, each on its model", () => {
    const team: Answers = { ...base, task: "Research competitors every week", shape: "varies", kinds: "no", roles: "specialists", quality: "partly", knowledge: ["none"], systems: "read", trigger: "schedule", risks: ["none"] };
    const { files } = kit(team);
    const agents = files.filter((f) => f.path.startsWith("claude-plugin/agents/"));
    expect(agents).toHaveLength(4);
    expect(agents[0].content).toMatch(/\nmodel: opus\n/);
    expect(agents[1].content).toMatch(/\nmodel: sonnet\n/);
    expect(file(files, "claude-plugin/README.md")!.content).toMatch(/Every weekday at 7am/);
  });

  it("a Hermes design gets settings, persona, skill and a working setup script", () => {
    const { files, tools } = kit(restricted);
    expect(tools.map((t) => t.id)).toEqual(["n8n", "hermes"]);
    expect(file(files, "hermes/config.yaml")!.content).toMatch(/^model: REPLACE-provider\/qwen3-235b/m);
    expect(file(files, "hermes/SOUL.md")!.content).toBe(file(files, "system-prompt.md")!.content);
    expect(file(files, "hermes/skills/business/answer-routine-customer-emails/SKILL.md")!.content).toMatch(/\n  hermes:\n    category: business\n/);
    const setup = file(files, "hermes/setup.sh")!.content;
    expect(setup).toMatch(/SOUL\.md\.bak/);
    const dir = mkdtempSync(join(tmpdir(), "aag-"));
    writeFileSync(join(dir, "setup.sh"), setup);
    execFileSync("sh", ["-n", join(dir, "setup.sh")]);
    const handoff = JSON.parse(file(files, "n8n/workflow.json")!.content);
    expect(handoff.nodes.map((n: { type: string }) => n.type)).toEqual(["n8n-nodes-base.webhook", "n8n-nodes-base.httpRequest"]);
  });

  it("rules-only automation: no model, decision table, n8n with IF branches", () => {
    const { files } = kit(reminders);
    expect(files.map((f) => f.path)).toEqual(["BUILD.md", "n8n/workflow.json", "rules/decision-table.csv", "evals/examples.csv"]);
    const wf = JSON.parse(file(files, "n8n/workflow.json")!.content);
    expect(wf.nodes.filter((n: { type: string }) => n.type === "n8n-nodes-base.if")).toHaveLength(1);
    expect(file(files, "BUILD.md")!.content).toMatch(/No AI model/);
  });

  it("parallel sections meet in a Merge node", () => {
    const wf = JSON.parse(file(kit(sections).files, "n8n/workflow.json")!.content);
    const merge = wf.nodes.find((n: { type: string }) => n.type === "n8n-nodes-base.merge");
    expect(merge.parameters.numberInputs).toBe(3);
  });

  it("model notes in n8n don't tell a step to switch to the model it is already on", () => {
    const wf = JSON.parse(file(kit({ ...support, roles: "both" }).files, "n8n/workflow.json")!.content);
    const models = wf.nodes.filter((n: { type: string }) => /lmChat/.test(n.type));
    expect(models.some((m: { name: string }) => /Opus 5\.5$/.test(m.name))).toBe(true);
    for (const m of models) {
      if (/Opus 5\.5$/.test(m.name)) expect(m.notes).toMatch(/keep it there/);
      expect(m.notes).not.toMatch(/switch to this one/);
    }
  });

  it("restricted regions get open-weight models in n8n", () => {
    const wf = JSON.parse(file(kit({ ...support, location: "residency", team: "large" }).files, "n8n/workflow.json")!.content);
    expect(wf.nodes.some((n: { type: string }) => /lmChat/.test(n.type))).toBe(true);
    const models = wf.nodes.filter((n: { type: string }) => /lmChat/.test(n.type));
    for (const m of models) expect(m.type).toBe("@n8n/n8n-nodes-langchain.lmChatOllama");
  });

  it("dependent data jobs get an Airflow DAG that is valid Python", () => {
    const dag = file(kit(dataJobs).files, /^airflow\/dags\/.+\.py$/);
    expect(dag).toBeDefined();
    expect(dag!.content).toMatch(/ExternalTaskSensor/);
    let python = "";
    try {
      python = execFileSync("python3", ["--version"]).toString();
    } catch {
      /* no python available: skip the compile check */
    }
    if (python) {
      const dir = mkdtempSync(join(tmpdir(), "aag-"));
      const path = join(dir, "dag.py");
      writeFileSync(path, dag!.content);
      execFileSync("python3", ["-m", "py_compile", path]);
    }
  });

  it("makes safe slugs", () => {
    expect(slugify("Answer routine customer emails!")).toBe("answer-routine-customer-emails");
    expect(slugify("")).toBe("agent-system");
    expect(slugify("为客户回复")).toBe("agent-system");
  });
});

describe("starter kit on every kind of path", () => {
  const paths = [...allPaths().filter((_, i) => i % 9 === 0), ...sampledPaths(600)].map((a) => ({ ...a, task: "Answer routine customer emails" }));

  it("is complete, consistent and well formed", () => {
    const failures: string[] = [];
    for (const a of paths) {
      const p = problems(a);
      if (p.length && failures.length < 6) failures.push(`${p.slice(0, 3).join("; ")} <= ${JSON.stringify(a)}`);
    }
    expect(failures).toEqual([]);
  }, 180_000);
});
