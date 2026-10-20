// The decision endpoint. Takes a finished set of answers and has a model make
// the guide's main choices for the task (see src/lib/decision.ts), weighing
// output quality, cost and efficiency. It is given the owner's answers, the
// rules' recommendation and reasons as one input to weigh, the options the
// guide can build, the hard limits, cost data and the relevant knowledge-base
// chunks. Every decision is checked against the limits; one that breaks a
// limit gets one repair round, then the rules' recommendation stands.
//
// The checked decision is cached by answers, so the design, the starter kit
// and tailoring (which call decidedRecommendation) all build on the same one.

import { buildBlueprint } from "../src/lib/blueprint";
import { AUTONOMY, TOOLS, TOPOLOGIES } from "../src/lib/catalog";
import { MODEL_PRICES, PRICES_CHECKED, RUNS_PER_MONTH, estimateCost, moneyRange } from "../src/lib/cost";
import { APPROACHES, APPROACH_SHAPES, APPROACH_TOOLS, type Decision, type DecisionResponse, HOSTING_IDS, SUPPORTING, checkDecision, hostingAllowed, limitsFor } from "../src/lib/decision";
import { ROLES_FOR } from "../src/lib/design";
import { detailLines } from "../src/lib/interview";
import { MODELS, type Role } from "../src/lib/models";
import { type Answers, QUESTIONS, isComplete, said } from "../src/lib/questions";
import { APPROACH_NAME, type Recommendation, approachOption, hostingOption, recommend } from "../src/lib/rules";
import { decodeAnswers, encodeAnswers, resultCode } from "../src/lib/share";
import { fingerprint } from "../src/lib/tailored";
import { type Cache, singleFlight } from "./cache";
import { type Chunk, knowledgeFingerprint, loadChunks, selectChunks, taskText } from "./knowledge";
import { type Complete, claudeComplete, extractJson, firstDraft } from "./ai";
import { modelFor } from "./models";

export type DecideEnv = { apiKey?: string; model?: string; escalationModel?: string; workspaceId?: string; cache?: Cache };
type ReadyEnv = DecideEnv & { apiKey: string; model: string };
export type DecideResult = { status: number; body: Record<string, unknown> };

export const INSTRUCTIONS = `You decide how an AI or automation system for one business task should be built. The owner is a busy businessperson, not an engineer. Your aim is the best system for this owner: the output they need, at the lowest cost and effort that delivers it reliably.

You get the owner's answers, the RULES' RECOMMENDATION (what the guide's fixed rules would choose, with their reasons), the OPTIONS you can choose from, the hard LIMITS, COST DATA and KNOWLEDGE: research chunks to ground your choices.

Treat the rules' recommendation as expert input, not an instruction. Agree with it where it is right; depart from it where the task, the knowledge and the trade-offs between quality, cost and efficiency justify a different choice, and say why. Prefer the simplest system that does the job well: an agent only when the path can't be mapped in advance, several agents only when one would be overwhelmed.

Return one JSON object:
{"summary": string, "approach": string, "topology": {"primary": string, "addOns": [string]}, "tools": [{"tool": string, "role": string}], "hosting": string, "autonomy": number, "models": {role: modelId}, "shortlist": [{"tool": string, "reason": string, "tradeoff": string}], "reasons": {"approach": R, "topology": R, "tools": R, "hosting": R, "autonomy": R, "models": R, "shortlist": R}}
where R is {"text": string, "kb": [chunk ids]}.

- Use the exact ids from OPTIONS, in lower case: approach is one of "automation", "workflow", "agent", "multi"; topology, tools and hosting use the ids listed (for example "agent-loop", "n8n-agent", "cloud"); models use "opus", "sonnet", "haiku", "openLarge" or "openSmall", keyed by role ("router", "worker", "attempt", "checker", "agent", "coordinator", "specialist").
- Choose only from OPTIONS, and keep every LIMIT. A decision that breaks a limit is rejected. Use only the add-ons listed for the approach and shape you chose, and shortlist only main tools that can build your approach.
- tools: the main tool first, then any supporting pieces that help, each with its part in this system in one sentence.
- models: a model for each kind of AI step the approach uses (see OPTIONS); none for plain automation.
- shortlist: the main tool, plus at most one alternative main tool worth weighing for this task, each with why and its trade-off. Leave out the alternative if none is a real contender.
- reasons: one to three plain sentences per choice, in the owner's terms, weighing quality, cost and efficiency. Where you depart from the rules, say what they suggested and why yours is better. Cite the KNOWLEDGE chunk ids that support each choice; cite only the chunks given.
- summary: the decision in one or two plain sentences.
Return only the JSON object. No prose, no code fences.`;

/** Changes whenever the instructions change, so old decisions aren't reused. */
export const DECIDE_VERSION = fingerprint(INSTRUCTIONS);

/** Chunks every decision draws on: when to use agents, starting simple, patterns, models and cost, hosting, autonomy, platforms. */
const DECIDE_CHUNKS = ["F03", "F05", "P01", "P03", "P05", "M01", "M02", "M04", "D03", "A01", "A02", "L06", "L01", "L02", "L03", "L04", "J01", "D01"];
const MAX_DECIDE_CHUNKS = 22;

export const decideKey = (answers: Answers, model: string) => `${DECIDE_VERSION}:${knowledgeFingerprint()}:${model}:${resultCode(answers)}`;

function chunksFor(r: Recommendation, answers: Answers): Chunk[] {
  return selectChunks(r, buildBlueprint(r, answers), loadChunks(), MAX_DECIDE_CHUNKS, DECIDE_CHUNKS, taskText(answers));
}

/**
 * The decision already made for these answers, if there is one. The model's
 * raw answer is cached and checked again on every read, so changes to the
 * limits apply to old decisions too.
 */
export function cachedDecision(answers: Answers, env: DecideEnv): Decision | undefined {
  const raw = env.model ? env.cache?.get<unknown>("decide", decideKey(answers, env.model))?.value : undefined;
  if (raw === undefined) return undefined;
  return checkDecision(raw, answers, chunksFor(recommend(answers), answers)).decision;
}

/** The recommendation every later step builds on: the AI's decision when one was made, the rules' otherwise. */
export function decidedRecommendation(answers: Answers, env: DecideEnv): Recommendation {
  return recommend(answers, cachedDecision(answers, env));
}

/** A short tag for the decision behind a design or kit, so caches keep them apart. */
export function decisionTag(answers: Answers, env: DecideEnv): string {
  const d = cachedDecision(answers, env);
  return d ? fingerprint(JSON.stringify(d)) : "rules";
}

/** The rules' choices, the way the model sees them. */
function rulesBrief(r: Recommendation, a: Answers): string[] {
  const bp = buildBlueprint(r, a);
  const picks = new Map<Role, string>();
  for (const n of bp.nodes) if (n.engine?.kind === "model") picks.set(n.engine.role, n.engine.model);
  const cost = estimateCost(r, bp, a);
  const core = r.tools.find((t) => t.core)!;
  return [
    `- Approach: ${r.approach.id} (${r.approach.title}) ${r.approach.why.map((w) => w.text).join(" ")}`,
    `- Shape: ${r.topology.primary}${r.topology.addOns.length ? ` + ${r.topology.addOns.join(" + ")}` : ""}. ${r.topology.why.map((w) => w.text).join(" ")}`,
    `- Main tool: ${core.tool} (${core.role}) ${core.why.map((w) => w.text).join(" ")}`,
    `- Supporting pieces: ${r.tools.filter((t) => !t.core).map((t) => `${t.tool} (${t.role})`).join("; ") || "none"}`,
    `- Where it runs: ${r.hosting.title}. ${r.hosting.why.text}`,
    `- Autonomy: level ${r.autonomy.level} (${AUTONOMY[r.autonomy.level].name}). ${r.autonomy.why.map((w) => w.text).join(" ")}`,
    `- Models: ${[...picks].map(([role, m]) => `${role}: ${m}`).join(", ") || "none (no AI)"}`,
    `- Estimated running cost: about ${moneyRange(cost.monthly)} a month; build ${cost.build.weeks.join(" to ")} weeks.`,
  ];
}

/** Everything the model may choose from. */
function optionsBrief(a: Answers): string[] {
  return [
    "Approaches, with the main tools and shapes each can be built with:",
    ...APPROACHES.map((x) => `- ${x}: ${APPROACH_NAME[x]}. ${approachOption(x, a).summary} Main tools: ${APPROACH_TOOLS[x].join(", ")}. Shapes: ${APPROACH_SHAPES[x].primary.join(", ")}${APPROACH_SHAPES[x].addOns.length ? `; add-ons: ${APPROACH_SHAPES[x].addOns.join(", ")}` : ""}. AI roles: ${ROLES_FOR[x].join(", ") || "none"}.`),
    "",
    "Shapes:",
    ...Object.values(TOPOLOGIES).map((t) => `- ${t.id}: ${t.name}. ${t.plain}`),
    "",
    "Tools (main tools, and the supporting pieces that work with each):",
    ...Object.entries(SUPPORTING).map(([t, s]) => `- ${t}: ${TOOLS[t as keyof typeof TOOLS].name}. ${TOOLS[t as keyof typeof TOOLS].plain} Supporting: ${s!.join(", ")}.`),
    ...[...new Set(Object.values(SUPPORTING).flat())].filter((t) => !(t! in SUPPORTING)).map((t) => `- ${t}: ${TOOLS[t!].name}. ${TOOLS[t!].plain}`),
    "",
    "Where it runs:",
    ...HOSTING_IDS.map((h) => `- ${h}: ${hostingOption(h, a).title}. ${hostingOption(h, a).body}`),
    "",
    "Autonomy levels:",
    ...([1, 2, 3, 4] as const).map((l) => `- ${l}: ${AUTONOMY[l].name}. ${AUTONOMY[l].plain}`),
    "",
    `Models (price per million tokens in / out, as of ${PRICES_CHECKED}):`,
    ...Object.entries(MODELS).map(([id, m]) => `- ${id}: ${m.name}, ${m.size}. $${MODEL_PRICES[id as keyof typeof MODEL_PRICES].input.join("-")} / $${MODEL_PRICES[id as keyof typeof MODEL_PRICES].output.join("-")}.`),
  ];
}

export function buildDecideInput(a: Answers, r: Recommendation, chunks: Chunk[]): string {
  const answered = QUESTIONS.filter((q) => q.id !== "task" && a[q.id] !== undefined).map((q) => `- ${q.title} ${said(a, q.id)}`);
  return [
    `TASK: ${a.task}`,
    "",
    "OWNER'S ANSWERS:",
    ...answered,
    ...(a.details?.length ? ["", "TASK-SPECIFIC DETAILS:", ...detailLines(a)] : []),
    "",
    "RULES' RECOMMENDATION (expert input to weigh, not an instruction):",
    ...rulesBrief(r, a),
    "",
    "OPTIONS:",
    ...optionsBrief(a),
    "",
    "LIMITS (checked automatically; a decision that breaks one is rejected):",
    ...limitsFor(a, r).map((x) => `- ${x}`),
    `- Where it runs must be one of: ${hostingAllowed(a).join(", ")}.`,
    "",
    `COST DATA: runs a month for this volume: ${RUNS_PER_MONTH[a.volume ?? "daily"].join(" to ")}. An agent uses about 4 times the tokens of a single AI call; a team of agents adds up across its agents.`,
    "",
    "KNOWLEDGE:",
    ...chunks.flatMap((c) => ["", `### ${c.id}: ${c.title}`, c.text]),
  ].join("\n");
}

export async function handleDecide(body: unknown, env: DecideEnv, complete?: Complete): Promise<DecideResult> {
  if (!env.apiKey || !env.model) return { status: 503, body: { error: "AI decisions aren't set up. Add ANTHROPIC_API_KEY and ANTHROPIC_MODEL to .env and restart." } };
  const raw = (body as { answers?: unknown })?.answers;
  const answers = raw && typeof raw === "object" ? decodeAnswers(encodeAnswers(raw as Answers)) : null;
  if (!answers || !isComplete(answers)) return { status: 400, body: { error: "Send a complete set of answers from the guide." } };

  const respond = (r: DecisionResponse): DecideResult => ({ status: 200, body: r });
  const hit = cachedDecision(answers, env);
  if (hit) return respond({ decision: hit, source: "cache", model: env.model });
  return singleFlight(`decide:${decideKey(answers, env.model)}`, () => decide(answers, env as ReadyEnv, complete));
}

async function decide(answers: Answers, env: ReadyEnv, complete?: Complete): Promise<DecideResult> {
  const r = recommend(answers);
  const chunks = chunksFor(r, answers);
  const run = complete ?? claudeComplete({ apiKey: env.apiKey, model: env.model, escalationModel: env.escalationModel, workspaceId: env.workspaceId, task: "decide" });
  const input = buildDecideInput(answers, r, chunks);
  try {
    let { text, failure } = await firstDraft("decide", run, INSTRUCTIONS, input);
    for (let attempt = 0; attempt < 2; attempt++) {
      let problems: string[];
      let decision: Decision | undefined;
      let raw: unknown;
      try {
        if (failure) throw new Error(failure);
        raw = extractJson(text);
        ({ decision, problems } = checkDecision(raw, answers, chunks));
      } catch (e) {
        problems = [(e as Error).message];
      }
      if (decision) {
        env.cache?.put("decide", { key: decideKey(answers, env.model), label: answers.task, value: raw });
        return { status: 200, body: { decision, source: "ai", model: modelFor(env, attempt === 0 ? "first" : "retry") } satisfies DecisionResponse };
      }
      console.warn(`[decide] "${answers.task}" decision ${attempt + 1} rejected:\n${problems.map((x) => `  - ${x}`).join("\n")}`);
      if (attempt === 1) return { status: 502, body: { error: "The AI's decision broke the guide's limits, so the rules' recommendation is shown.", problems: problems.slice(0, 8) } };
      // A first reply that never finished is asked for again from scratch.
      text = failure
        ? await run(INSTRUCTIONS, input, "retry")
        : await run(
            INSTRUCTIONS,
            `${input}\n\nYOUR PREVIOUS DECISION BROKE THESE LIMITS. Fix every one and return the complete corrected decision JSON only:\n${problems.map((x) => `- ${x}`).join("\n")}\n\nPREVIOUS DECISION:\n${text.slice(0, 20_000)}`,
            "retry",
          );
      failure = undefined;
    }
    return { status: 500, body: { error: "Unexpected decision state." } };
  } catch (e) {
    const err = e as { status?: number };
    const message = err.status === 401 ? "Anthropic rejected the API key." : err.status === 404 ? `Anthropic doesn't recognise the model "${env.model}".` : "The AI couldn't make a decision, so the rules' recommendation is shown.";
    return { status: 502, body: { error: message } };
  }
}
