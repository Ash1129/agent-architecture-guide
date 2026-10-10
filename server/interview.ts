// The adaptive interview endpoint. Takes a task (a short title from the survey,
// or a few sentences from the start page's box), returns the guide's questions
// adapted to it (see src/lib/interview.ts). Cheapest path first:
//   1. the same task asked before          -> cached plan, no model call
//   2. a near-duplicate task (by meaning)  -> its cached plan, one embedding call
//   3. anything else                       -> the model, with the closest earlier
//                                             plan as a reference when there is one
// Every plan is validated against the question bank before it's returned or cached.

import OpenAI from "openai";
import { ADAPTABLE, type InterviewPlan, type InterviewResponse, MAX_DESCRIPTION, normaliseTask, validatePlan } from "../src/lib/interview";
import { fingerprint } from "../src/lib/tailored";
import { type Cache, singleFlight } from "./cache";
import { type Complete, extractJson, openAIComplete } from "./ai";

export type Embed = (text: string) => Promise<number[]>;
export type InterviewEnv = { apiKey?: string; model?: string; embeddingModel?: string; cache?: Cache };
export type InterviewResult = { status: number; body: Record<string, unknown> };

/** Above this, an earlier task is close enough to reuse its plan as is. */
export const REUSE_SIMILARITY = 0.92;
/** Above this, an earlier plan is shown to the model as a reference. */
export const REFERENCE_SIMILARITY = 0.6;

const WHEN: Partial<Record<string, string>> = {
  kinds: "asked only when shape is judgement or varies",
  quality: "asked only when shape is judgement or varies",
  knowledge: "asked only when shape is judgement or varies",
  split: "asked only when shape is judgement",
  roles: "asked only when shape is varies",
};

/** The question bank as the model sees it. */
export function questionBank() {
  return ADAPTABLE.map((q) => ({
    id: q.id,
    kind: q.kind,
    title: q.title,
    ...(q.help ? { help: q.help } : {}),
    why: q.why,
    ...(WHEN[q.id] ? { when: WHEN[q.id] } : {}),
    ...(q.exclusive ? { exclusive: q.exclusive } : {}),
    options: q.options!.map((o) => ({ value: o.value, label: o.label, ...(o.hint ? { hint: o.hint } : {}), meaning: o.short })),
  }));
}

export const INSTRUCTIONS = `You adapt a short business questionnaire to one specific task. The questionnaire decides how an AI or automation system for that task should be built, so every question's meaning must survive your wording.

You get the owner's task and the question bank. Return one JSON object:
{"summary": string, "questions": [{"id", "title", "help", "options": [{"value", "label", "hint"}], "suggested", "reason"}], "details": [{"title", "help", "kind", "options"}]}

Rules:
1. Include every question in the bank, by id. Reword its title, help, option labels and hints in this owner's terms, using concrete examples from their task. Plain English for a busy business owner; no technical jargon.
2. Return every option value exactly as given, once each, in the given order. Never add, drop, merge or rename values. Each label must keep its option's meaning (given as "meaning").
3. "suggested": the answer the task makes clearly likely, or null if the task doesn't say. Use an array for multi-choice questions. Never guess things the task doesn't imply, such as volume, organisation size or location. "reason": one short sentence that points to the words in the task.
4. "details": up to 3 extra questions the bank doesn't cover but whose answers would change how this particular system is built (for example which inbox or CRM, which languages, who signs off, where the source data lives). "kind" is "single", "multi" or "text"; give 2 to 6 short options for single and multi. Don't repeat the bank's questions.
5. "summary": the task restated in one plain sentence.
Return only the JSON object. No prose, no code fences.`;

/** Changes whenever the instructions or the question bank change, so old plans aren't reused. */
export const PLAN_VERSION = fingerprint(INSTRUCTIONS + JSON.stringify(questionBank()));

export function openAIEmbed(env: { apiKey: string; model: string }): Embed {
  const client = new OpenAI({ apiKey: env.apiKey, timeout: 20_000, maxRetries: 1 });
  return async (text) => (await client.embeddings.create({ model: env.model, input: text })).data[0].embedding;
}

export function buildInterviewInput(task: string, reference?: { task: string; plan: InterviewPlan }): string {
  return [
    `TASK: ${task}`,
    "",
    "QUESTION BANK:",
    JSON.stringify(questionBank(), null, 1),
    ...(reference
      ? [
          "",
          `REFERENCE: a plan made earlier for a similar task ("${reference.task}"). Use it for tone and depth only; adapt everything to THIS task and drop suggestions that don't fit it.`,
          JSON.stringify(reference.plan),
        ]
      : []),
  ].join("\n");
}

export async function handleInterview(
  body: unknown,
  env: InterviewEnv,
  deps: { complete?: Complete; embed?: Embed } = {},
): Promise<InterviewResult> {
  if (!env.apiKey || !env.model) return { status: 503, body: { error: "AI questions aren't set up. Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart." } };
  const raw = (body as { task?: unknown })?.task;
  const task = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION) : "";
  if (task.length < 3) return { status: 400, body: { error: "Send the task as a short sentence." } };

  const ns = "interview";
  const key = `${PLAN_VERSION}:${normaliseTask(task)}`;
  const respond = (r: InterviewResponse): InterviewResult => ({ status: 200, body: r });

  const hit = env.cache?.get<InterviewResponse>(ns, key);
  if (hit) return respond({ ...hit.value, source: "cache" });
  return singleFlight(`interview:${key}`, () => adapt(task, key, env as InterviewEnv & { apiKey: string; model: string }, deps));
}

async function adapt(task: string, key: string, env: InterviewEnv & { apiKey: string; model: string }, deps: { complete?: Complete; embed?: Embed }): Promise<InterviewResult> {
  const ns = "interview";
  const respond = (r: InterviewResponse): InterviewResult => ({ status: 200, body: r });

  // Meaning-based lookup. An embedding failure only means no reuse.
  const embed = deps.embed ?? (env.embeddingModel ? openAIEmbed({ apiKey: env.apiKey, model: env.embeddingModel }) : undefined);
  let embedding: number[] | undefined;
  let near: { entry: { label?: string; value: InterviewResponse }; score: number } | undefined;
  if (env.cache && embed) {
    try {
      embedding = await embed(task);
      near = env.cache.nearest<InterviewResponse>(ns, embedding);
    } catch {
      embedding = undefined;
    }
  }
  if (near && near.score >= REUSE_SIMILARITY && near.entry.label) {
    const reused: InterviewResponse = { plan: near.entry.value.plan, source: "similar", similarTo: near.entry.label, model: near.entry.value.model };
    env.cache!.put(ns, { key, label: task, value: reused, embedding });
    return respond(reused);
  }

  const run = deps.complete ?? openAIComplete({ apiKey: env.apiKey, model: env.model });
  const reference = near && near.score >= REFERENCE_SIMILARITY && near.entry.label ? { task: near.entry.label, plan: near.entry.value.plan } : undefined;
  try {
    const plan = validatePlan(extractJson(await run(INSTRUCTIONS, buildInterviewInput(task, reference))));
    if (!Object.keys(plan.questions).length) return { status: 502, body: { error: "The AI's questions didn't fit the guide, so the standard questions are used." } };
    const out: InterviewResponse = { plan, source: "ai", model: env.model };
    env.cache?.put(ns, { key, label: task, value: out, embedding });
    return respond(out);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    const message = err.status === 401 ? "OpenAI rejected the API key." : err.status === 404 ? `OpenAI doesn't recognise the model "${env.model}".` : "The AI couldn't adapt the questions, so the standard questions are used.";
    return { status: 502, body: { error: message } };
  }
}
