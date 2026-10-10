// Structural checks for a starter kit (see kitProblems).

import type { Blueprint } from "./blueprint";
import type { Answers } from "./questions";
import type { Recommendation } from "./rules";
import { type Kit, MODEL_API_ID } from "./starter";

/**
 * Everything a starter kit must satisfy, whatever the design and whoever wrote
 * its text. The tests run it on every kind of path; the AI kit step runs it on
 * every kit with AI-written text before anyone sees it.
 */
export function kitProblems(r: Recommendation, bp: Blueprint, a: Answers, { files, tools }: Kit): string[] {
  const file = (p: string) => files.find((f) => f.path === p);
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
  if (!r.models.needed && files.some((f) => /claude-(opus|sonnet|haiku)|qwen3|kimi-k2/.test(f.content))) p.push("model named in a no-AI design");
  if (!r.models.needed && file("system-prompt.md")) p.push("system prompt in a no-AI design");
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
  const manifest = file("claude-plugin/.claude-plugin/plugin.json");
  if (manifest && !/^[a-z0-9-]+$/.test(JSON.parse(manifest.content).name)) p.push("plugin name not kebab-case");

  const wf = file("n8n/workflow.json");
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
