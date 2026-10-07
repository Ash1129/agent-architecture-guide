// The AI design endpoint. Takes a finished set of answers and returns an
// architecture drafted by the model for this task (see src/lib/design.ts).
// The rules' own design for the same answers is the model's starting point,
// the source of the hard limits, and the fallback: if the draft can't pass the
// checks after one repair round, the guide keeps showing the rules' design.

import { type Blueprint, buildBlueprint } from "../src/lib/blueprint";
import { DECISION_METHODS, DECISION_ROLES, type DesignResponse, FIXED_METHODS, MAX_STEPS, ROLES_FOR, asDraft, checkDesign } from "../src/lib/design";
import { detailLines } from "../src/lib/interview";
import { ALGORITHMS } from "../src/lib/models";
import { type Answers, QUESTIONS, isComplete, said } from "../src/lib/questions";
import { type Recommendation, recommend } from "../src/lib/rules";
import { decodeAnswers, encodeAnswers, resultCode } from "../src/lib/share";
import { fingerprint } from "../src/lib/tailored";
import { type Cache, singleFlight } from "./cache";
import { type Chunk, selectChunks } from "./knowledge";
import { type Complete, extractJson, openAIComplete } from "./ai";

export type DesignEnv = { apiKey?: string; model?: string; cache?: Cache };
type ReadyEnv = DesignEnv & { apiKey: string; model: string };
export type DesignResult = { status: number; body: Record<string, unknown> };

export const INSTRUCTIONS = `You design the architecture of an AI or automation system for one business task. The owner is a busy businessperson, not an engineer.

You get the task, the owner's answers, a starting design built by fixed rules (valid, but generic), the limits this design must keep, and KNOWLEDGE: research chunks to ground your choices.

Make the design specific to this task: concrete step names, labels that name the owner's real tools where they are known, and plain-English "what", "why" and "passes" for each step. You may rename, rewrite, split, merge, add or remove steps when that makes the design fit the task better, as long as every limit holds. Prefer the simplest design that does the job well, and let the knowledge chunks guide that.

Return one JSON object:
{"title": string, "summary": string, "steps": [{"id", "kind", "name", "label", "role", "method", "what", "why", "passes", "gates": [{"kind", "text"}], "kb": [chunk ids]}], "edges": [{"from", "to", "label", "style"}]}

- kind: "start", "ai", "fixed", "decision", "human", "tool" or "end".
- role: required on "ai" steps, and on a "decision" made by AI. It says what kind of AI step it is; the model is chosen from it by the guide's rules, so never name a model.
- method: required on "fixed" steps and on a "decision" made without AI.
- gates: safeguards on a step. "human" means a person steps in; "stop" is a stop rule.
- kb: the ids of the KNOWLEDGE chunks that support the step. Every "ai", "decision" and "human" step must cite at least one. Cite only the chunks given, and make "why" reflect what the chunk says.
- edges: "flow" for the normal path, "assign" for a coordinator handing work to specialists, "loop" only for going back to an earlier step. Label the branches out of a decision.
- The forward connections (flow and assign) must not form a cycle. Every step must be reachable from a start step, every step except an end must lead somewhere, and end steps lead nowhere.
- name up to 48 characters, label up to 40, what and why up to 320, passes up to 220, gate text up to 60, edge label up to 24. At most ${MAX_STEPS} steps.
Return only the JSON object. No prose, no code fences.`;

/** Changes whenever the instructions change, so old designs aren't reused. */
export const DESIGN_VERSION = fingerprint(INSTRUCTIONS);

export const designKey = (answers: Answers, model: string) => `${DESIGN_VERSION}:${model}:${resultCode(answers)}`;

/** What the checks need: the rules' design for these answers and the chunks the model was given. */
function contextFor(answers: Answers) {
  const r = recommend(answers);
  const baseline = buildBlueprint(r, answers);
  const chunks = selectChunks(r, baseline);
  return { r, baseline, chunks, ctx: { r, a: answers, baseline, chunks: chunks.map(({ id, title }) => ({ id, title })) } };
}

/**
 * The AI design already made for these answers, if there is one. The cache
 * keeps the model's draft, not the drawing: it is checked and laid out again
 * on every read, so fixes to the checks or the layout apply to old designs
 * too, and a draft that no longer passes is simply not used.
 */
export function cachedDesign(answers: Answers, env: DesignEnv): Blueprint | undefined {
  const draft = env.model ? env.cache?.get<unknown>("design", designKey(answers, env.model))?.value : undefined;
  return draft === undefined ? undefined : checkDesign(draft, contextFor(answers).ctx).blueprint;
}

function limitsFor(r: Recommendation, baseline: Blueprint): string[] {
  const roles = ROLES_FOR[r.approach.id];
  const starts = baseline.nodes.filter((n) => n.kind === "start").map((n) => n.id);
  const count = (k: string) => baseline.nodes.filter((n) => n.kind === k).length;
  const gates = baseline.nodes.flatMap((n) => n.gates.map((g) => `- "${g.text}" (${g.kind}) on a ${n.kind} step`));
  return [
    `- The approach is "${r.approach.title}" (${r.approach.agents}).`,
    roles.length
      ? `- Allowed AI roles: ${roles.join(", ")}. An AI decision uses ${DECISION_ROLES.filter((x) => roles.includes(x)).join(" or ")}.${r.approach.id === "agent" ? ' Exactly one step has the role "agent".' : ""}${r.approach.id === "multi" ? ' At least one "coordinator" and at least two "specialist" steps.' : ""}`
      : "- This design needs no AI: no \"ai\" steps and no roles. Use fixed steps and decisions with a method.",
    `- Methods for fixed steps: ${FIXED_METHODS.map((m) => `${m} (${ALGORITHMS[m].name})`).join(", ")}.`,
    `- Methods for decisions without AI: ${DECISION_METHODS.map((m) => `${m} (${ALGORITHMS[m].name})`).join(", ")}.`,
    `- Keep exactly these start steps, by id: ${starts.join(", ")}. They come from how the owner said the work starts; you may rename and reword them.`,
    ...(count("human") ? [`- Keep at least ${count("human")} "human" step${count("human") > 1 ? "s" : ""}.`] : []),
    ...(count("tool") ? [`- Keep at least ${count("tool")} "tool" step${count("tool") > 1 ? "s" : ""}.`] : []),
    ...(gates.length ? ["- Keep these safeguards word for word, each on a step of the same kind:", ...gates] : []),
  ];
}

export function buildDesignInput(a: Answers, r: Recommendation, baseline: Blueprint, chunks: Chunk[]): string {
  const answered = QUESTIONS.filter((q) => q.id !== "task" && a[q.id] !== undefined).map((q) => `- ${q.title} ${said(a, q.id)}`);
  return [
    `TASK: ${a.task}`,
    "",
    "OWNER'S ANSWERS:",
    ...answered,
    ...(a.details?.length ? ["", "TASK-SPECIFIC DETAILS:", ...detailLines(a)] : []),
    "",
    "LIMITS FOR THIS DESIGN (checked automatically; a design that breaks one is rejected):",
    ...limitsFor(r, baseline),
    "",
    "STARTING DESIGN (built by the rules; improve it for this task):",
    JSON.stringify(asDraft(baseline), null, 1),
    "",
    "KNOWLEDGE:",
    ...chunks.flatMap((c) => ["", `### ${c.id}: ${c.title}`, c.text]),
  ].join("\n");
}

export async function handleDesign(body: unknown, env: DesignEnv, complete?: Complete): Promise<DesignResult> {
  if (!env.apiKey || !env.model) return { status: 503, body: { error: "AI design isn't set up. Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart." } };
  const raw = (body as { answers?: unknown })?.answers;
  const answers = raw && typeof raw === "object" ? decodeAnswers(encodeAnswers(raw as Answers)) : null;
  if (!answers || !isComplete(answers)) return { status: 400, body: { error: "Send a complete set of answers from the guide." } };

  const respond = (r: DesignResponse): DesignResult => ({ status: 200, body: r });
  const hit = cachedDesign(answers, env);
  if (hit) return respond({ blueprint: hit, source: "cache", model: env.model });

  return singleFlight(`design:${designKey(answers, env.model)}`, () => draftDesign(answers, env as ReadyEnv, complete));
}

async function draftDesign(answers: Answers, env: ReadyEnv, complete?: Complete): Promise<DesignResult> {
  const respond = (r: DesignResponse): DesignResult => ({ status: 200, body: r });
  const { r, baseline, chunks, ctx } = contextFor(answers);
  const run = complete ?? openAIComplete({ apiKey: env.apiKey, model: env.model });
  const input = buildDesignInput(answers, r, baseline, chunks);
  try {
    let text = await run(INSTRUCTIONS, input);
    for (let attempt = 0; attempt < 2; attempt++) {
      let problems: string[];
      let blueprint: Blueprint | undefined;
      let draft: unknown;
      try {
        draft = extractJson(text);
        ({ blueprint, problems } = checkDesign(draft, ctx));
      } catch (e) {
        problems = [(e as Error).message];
      }
      if (blueprint) {
        env.cache?.put("design", { key: designKey(answers, env.model), label: answers.task, value: draft });
        return respond({ blueprint, source: "ai", model: env.model });
      }
      // Rejections are logged on the dev server so failures can be diagnosed.
      console.warn(`[design] "${answers.task}" draft ${attempt + 1} rejected:\n${problems.map((x) => `  - ${x}`).join("\n")}`);
      if (attempt === 1) return { status: 502, body: { error: "The AI's design didn't pass the guide's checks, so the rules' design is shown.", problems: problems.slice(0, 8) } };
      text = await run(
        INSTRUCTIONS,
        `${input}\n\nYOUR PREVIOUS DESIGN FAILED THESE CHECKS. Fix every one and return the complete corrected design JSON only:\n${problems.map((x) => `- ${x}`).join("\n")}\n\nPREVIOUS DESIGN:\n${text.slice(0, 40_000)}`,
      );
    }
    return { status: 500, body: { error: "Unexpected design state." } };
  } catch (e) {
    const err = e as { status?: number };
    const message = err.status === 401 ? "OpenAI rejected the API key." : err.status === 404 ? `OpenAI doesn't recognise the model "${env.model}".` : "The AI couldn't draft a design, so the rules' design is shown.";
    return { status: 502, body: { error: message } };
  }
}
