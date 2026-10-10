// AI tailoring for the n8n workflow. Runs only on the server, so the API key
// never reaches the browser. The endpoint accepts the guide's answers and
// nothing else: it rebuilds the design from the published rules, asks the
// model to tailor the generated workflow, and checks the result before
// returning it. It cannot be used as a general-purpose chat proxy.

import { APIConnectionTimeoutError } from "openai";
import { type Blueprint, OK_EVERY_ACTION, buildBlueprint, outgoing } from "../src/lib/blueprint";
import { detailLines } from "../src/lib/interview";
import { type Answers, QUESTIONS, isComplete, said } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { decodeAnswers, encodeAnswers, resultCode } from "../src/lib/share";
import { MODEL_API_ID, buildStarterKit } from "../src/lib/starter";
import { fingerprint } from "../src/lib/tailored";
import { CALL_TIMEOUT_MS, type Complete, extractJson, openAIComplete } from "./ai";
import { type Cache, singleFlight } from "./cache";
import { cachedDesign } from "./design";
import { cachedKitText } from "./kit";

export { type Complete, extractJson, openAIComplete } from "./ai";

export type TailorEnv = { apiKey?: string; model?: string; cache?: Cache };
export type TailorResult = { status: number; body: Record<string, unknown> };
const MAX_BODY_CHARS = 20_000;

// ------------------------------------------------------------------ prompt

export const INSTRUCTIONS = `You are a senior n8n workflow engineer. You turn a business owner's architecture into a production-quality n8n workflow they can paste straight onto the n8n canvas.

You are given the owner's task, their answers, the architecture as numbered steps, and a generated starting workflow. Improve the starting workflow so it is specific to this business task. Follow every rule:

1. Keep every numbered step from the architecture, in the same order, with the same branches, approvals and loops. Do not add or remove AI steps or agents.
2. Every node that represents a step must have a name starting with its step number and a full stop, for example "4. Draft the reply". Helper nodes (IF, Switch, Merge, Set, model, tool) also start with the number of the step they belong to.
3. Give each step a specific, plain-English name for this task, and write a concrete prompt for every AI step: what to read, what to produce, the exact output format, and what to do when unsure.
4. Routing must be exact: ask the classifying AI step to reply with only one label from a fixed list, then route with a Switch (or IF) node that compares the trimmed, lower-cased reply for exact equality. Anything that matches no label goes to a person, never to a default branch.
5. A checker that says the work needs fixing must loop back to the AI step that produced the work, with the checker's feedback, and must stop after 3 rounds (track the round count in a Set or Code node) and send the item to a person.
6. Keep the model on each AI step exactly as given (node type and model id). Attach model and tool sub-nodes with ai_languageModel and ai_tool connections.
7. Use only built-in node types (n8n-nodes-base.* or @n8n/n8n-nodes-langchain.*). Where the owner's real app is unknown, keep a clearly named placeholder and put "REPLACE" in its notes.
8. Never put secrets, API keys or real personal data in the workflow.
9. Put a short, useful note on every node explaining what it does.
10. Enforce every safeguard with nodes, never only with a note. Where a step says "${OK_EVERY_ACTION}", the agent must not hold any tool that can reach the owner's systems (no MCP client, HTTP request or app tool attached to it). Instead the agent returns a proposed action; a Wait node (or a send-and-wait approval) pauses for a named person; an IF continues only on an explicit approval; a separate node then performs exactly the approved action and its result goes back to the agent step. Name these nodes with that step's number.

Return only the workflow as a single JSON object with the keys "name", "nodes", "connections" and "settings". No prose, no code fences.`;

function brief(bp: Blueprint) {
  return bp.nodes.map((n) => ({
    step: n.step,
    name: n.name,
    kind: n.kind,
    worksWith: n.engine ? (n.engine.kind === "model" ? { model: MODEL_API_ID[n.engine.model] } : { method: n.engine.name }) : n.label,
    whatHappens: n.what,
    safeguards: n.gates.map((g) => g.text),
    next: outgoing(bp, n.id).map(({ edge, node }) => ({ step: node.step, when: edge.label ?? null, loop: edge.style === "loop" })),
  }));
}

export function buildInput(a: Answers, bp: Blueprint, template: string): string {
  const answered = QUESTIONS.filter((q) => q.id !== "task" && a[q.id] !== undefined).map((q) => `- ${q.title} ${said(a, q.id)}`);
  return [
    `TASK: ${a.task}`,
    "",
    "OWNER'S ANSWERS:",
    ...answered,
    ...(a.details?.length ? ["", "TASK-SPECIFIC DETAILS (use them to make step names, prompts and placeholders concrete):", ...detailLines(a)] : []),
    "",
    "ARCHITECTURE (numbered steps):",
    JSON.stringify(brief(bp), null, 2),
    "",
    "STARTING WORKFLOW (improve this):",
    template,
  ].join("\n");
}

// ------------------------------------------------------------------ checks

type N8nNode = { name?: unknown; type?: unknown; typeVersion?: unknown; position?: unknown; parameters?: unknown };
type Workflow = { name?: unknown; nodes?: unknown; connections?: unknown };

/** Tool sub-nodes that can reach outside systems when an agent calls them. */
const SYSTEM_TOOL = /(mcpClientTool|toolHttpRequest|httpRequestTool|toolWorkflow)$|^n8n-nodes-base\.\w+Tool$/;

function isApprovalPause(n: N8nNode): boolean {
  return n.type === "n8n-nodes-base.wait" || (n.parameters as { operation?: unknown } | null)?.operation === "sendAndWait";
}

/** Everything the returned workflow must satisfy before anyone sees it. */
export function checkWorkflow(wf: unknown, bp: Blueprint): string[] {
  const p: string[] = [];
  const w = wf as Workflow;
  if (!w || typeof w !== "object" || !Array.isArray(w.nodes) || typeof w.connections !== "object" || w.connections === null) {
    return ["The workflow must be an object with a nodes array and a connections object."];
  }
  const nodes = w.nodes as N8nNode[];
  const names = new Set<string>();
  for (const n of nodes) {
    if (typeof n?.name !== "string" || !n.name) {
      p.push("Every node needs a name.");
      continue;
    }
    if (names.has(n.name)) p.push(`Duplicate node name "${n.name}".`);
    names.add(n.name);
    if (typeof n.type !== "string" || !/^(n8n-nodes-base|@n8n\/n8n-nodes-langchain)\./.test(n.type)) p.push(`Node "${n.name}" uses a node type that isn't built in.`);
    if (typeof n.typeVersion !== "number") p.push(`Node "${n.name}" has no typeVersion.`);
    if (!Array.isArray(n.position) || n.position.length !== 2) p.push(`Node "${n.name}" has no position.`);
    if (typeof n.parameters !== "object" || n.parameters === null) p.push(`Node "${n.name}" has no parameters object.`);
  }
  const conns = w.connections as Record<string, Record<string, { node?: string }[][]>>;
  const feeds = new Map<string, Set<string>>();
  for (const [from, types] of Object.entries(conns)) {
    if (!names.has(from)) p.push(`A connection starts from "${from}", which isn't a node.`);
    for (const [type, outs] of Object.entries(types ?? {})) {
      for (const out of Array.isArray(outs) ? outs : []) {
        for (const link of Array.isArray(out) ? out : []) {
          if (!link?.node || !names.has(link.node)) p.push(`A connection points to "${link?.node}", which isn't a node.`);
          else if (names.has(from)) {
            // Only connections from real nodes count towards what a node is fed.
            if (!feeds.has(link.node)) feeds.set(link.node, new Set());
            feeds.get(link.node)!.add(type);
          }
        }
      }
    }
  }
  for (const n of nodes) {
    if (typeof n?.type === "string" && /chainLlm|langchain\.agent$/.test(n.type) && !feeds.get(n.name as string)?.has("ai_languageModel")) {
      p.push(`AI node "${n.name}" has no model attached.`);
    }
  }
  for (const step of bp.nodes) {
    if (![...names].some((x) => x.startsWith(`${step.step}. `))) p.push(`Step ${step.step} (${step.name}) is missing.`);
  }
  if (!nodes.some((n) => typeof n?.type === "string" && /trigger|webhook/i.test(n.type))) p.push("The workflow has no trigger node.");
  // A person approving every action has to be part of the workflow, not a note on it.
  for (const step of bp.nodes.filter((s) => s.gates.some((g) => g.text === OK_EVERY_ACTION))) {
    const own = nodes.filter((n) => typeof n?.name === "string" && n.name.startsWith(`${step.step}. `));
    if (!own.some(isApprovalPause)) p.push(`Step ${step.step} (${step.name}) says "${OK_EVERY_ACTION}" but has no Wait or send-and-wait approval node.`);
    for (const n of nodes) {
      if (typeof n?.type === "string" && SYSTEM_TOOL.test(n.type) && [...(conns[n.name as string] ?? {}).ai_tool ?? []].flat().length > 0) {
        p.push(`Tool "${n.name}" is attached straight to an agent, so it can act without the approval step ${step.step} requires.`);
      }
    }
  }
  const raw = JSON.stringify(wf);
  if (/sk-[A-Za-z0-9_-]{16,}/.test(raw)) p.push("The workflow contains something that looks like an API key.");
  return p;
}

// ------------------------------------------------------------------ handler

export async function handleTailor(body: unknown, env: TailorEnv, complete?: Complete): Promise<TailorResult> {
  if (!env.apiKey || !env.model) {
    return { status: 503, body: { error: "AI tailoring isn't set up on this site. Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart." } };
  }
  if (JSON.stringify(body ?? "").length > MAX_BODY_CHARS) return { status: 413, body: { error: "Request too large." } };

  // Only the guide's own answers are accepted, validated against the questions.
  const rawAnswers = (body as { answers?: unknown })?.answers;
  const answers = rawAnswers && typeof rawAnswers === "object" ? decodeAnswers(encodeAnswers(rawAnswers as Answers)) : null;
  if (!answers || !isComplete(answers)) return { status: 400, body: { error: "Send a complete set of answers from the guide." } };

  const r = recommend(answers);
  // Tailor the design the owner is looking at: the AI design when one was made, the rules' otherwise.
  const bp = cachedDesign(answers, env) ?? buildBlueprint(r, answers);
  const template = buildStarterKit(r, bp, answers, cachedKitText(answers, env)).files.find((f) => f.path === "n8n/workflow.json");
  if (!template) return { status: 422, body: { error: "This design doesn't use n8n, so there is no workflow to tailor." } };

  // The same design, starting workflow, instructions and model always give an
  // equivalent workflow, so a repeat is served from the shared cache.
  const key = [fingerprint(INSTRUCTIONS), env.model, fingerprint(template.content), resultCode(answers)].join(":");
  const hit = env.cache?.get<unknown>("tailor", key);
  if (hit) return { status: 200, body: { workflow: hit.value, model: env.model, cached: true } };

  const model = env.model;
  const run = complete ?? openAIComplete({ apiKey: env.apiKey, model });
  const input = buildInput(answers, bp, template.content);
  return singleFlight(`tailor:${key}`, async (): Promise<TailorResult> => {
    try {
      let text = await run(INSTRUCTIONS, input);
      for (let attempt = 0; attempt < 2; attempt++) {
        let problems: string[];
        let wf: unknown = null;
        try {
          wf = extractJson(text);
          problems = checkWorkflow(wf, bp);
        } catch (e) {
          problems = [(e as Error).message];
        }
        if (!problems.length) {
          env.cache?.put("tailor", { key, label: answers.task, value: wf });
          return { status: 200, body: { workflow: wf, model } };
        }
        if (attempt === 1) {
          return { status: 502, body: { error: "The AI's workflow didn't pass the checks. Try again.", problems: problems.slice(0, 8) } };
        }
        // One repair round: show the model exactly what failed.
        text = await run(
          INSTRUCTIONS,
          `${input}\n\nYOUR PREVIOUS ANSWER FAILED THESE CHECKS. Fix every one and return the complete corrected workflow JSON only:\n${problems.map((x) => `- ${x}`).join("\n")}\n\nPREVIOUS ANSWER:\n${text.slice(0, 60_000)}`,
        );
      }
      return { status: 500, body: { error: "Unexpected tailoring state." } };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      // Never echo request details that could include the key; the SDK's messages don't.
      if (e instanceof APIConnectionTimeoutError) {
        return { status: 504, body: { error: `The AI took longer than ${CALL_TIMEOUT_MS / 60_000} minutes. Try again.` } };
      }
      const message = err.status === 401 ? "OpenAI rejected the API key. Check OPENAI_API_KEY in .env." : err.status === 404 ? `OpenAI doesn't recognise the model "${model}". Check OPENAI_MODEL in .env.` : err.message ?? "The AI request failed.";
      return { status: 502, body: { error: message } };
    }
  });
}
