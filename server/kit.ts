// The AI kit step. Writes the task-specific text of the starter kit (see
// src/lib/kittext.ts) for the design the owner is looking at: the AI design
// when one was made, the rules' design otherwise. Each section is checked on
// its own and dropped if it doesn't fit, then the whole kit is assembled and
// put through the same structural checks the tests use (kitProblems). Only a
// kit that passes is used; otherwise the template kit stays.

import { type Blueprint, buildBlueprint } from "../src/lib/blueprint";
import { detailLines } from "../src/lib/interview";
import { kitProblems } from "../src/lib/kitcheck";
import { type KitResponse, type KitText, checkKitText } from "../src/lib/kittext";
import { type Answers, QUESTIONS, isComplete, said } from "../src/lib/questions";
import { type Recommendation, recommend } from "../src/lib/rules";
import { decodeAnswers, encodeAnswers, resultCode } from "../src/lib/share";
import { buildStarterKit } from "../src/lib/starter";
import { fingerprint } from "../src/lib/tailored";
import { type Complete, extractJson, openAIComplete } from "./ai";
import { type Cache, singleFlight } from "./cache";
import { cachedDesign } from "./design";
import { type Chunk, selectChunks } from "./knowledge";

export type KitEnv = { apiKey?: string; model?: string; cache?: Cache };
export type KitResult = { status: number; body: Record<string, unknown> };

/** Chunks about the kit's own subjects: system prompts, testing, and Skills. */
const KIT_CHUNKS = ["T06", "G04", "T05"];

export const INSTRUCTIONS = `You write the task-specific text of a starter kit: the files a business owner hands to an AI coding assistant to build their system. The design (steps, models, safeguards) is already fixed and is given to you; you never change it. Write for a busy business owner and the assistant building for them: plain English, concrete, specific to this task.

Return one JSON object with any of these keys (leave out a key if you have nothing useful for it):
{
 "context": one or two sentences on the business and the work, for the AI's standing brief,
 "rules": up to 8 short rules specific to this task for the AI steps (they are added to fixed safety rules, so don't repeat or weaken those),
 "output": the exact format each result should take, with one short example (markdown, up to 1500 characters),
 "briefs": {step id: a brief for that agent: its area and exactly what it hands back}, only for the agent ids listed,
 "overview": a short paragraph on how the system works for this owner,
 "buildNotes": up to 6 notes for whoever builds it, specific to this task (data to gather, edge cases to test, setup order),
 "ownerAsks": up to 5 more things to ask the owner for, beyond the ones listed,
 "watchOut": up to 4 pitfalls specific to this task: [{"title" (up to 70 characters), "body" (up to 300), "kb": [ids of the KNOWLEDGE chunks that support it]}],
 "examples": 3 to 8 illustrative test cases: [{"input", "good", "notes"}], realistic for this task, short, with no real personal data,
 "skillDescription": one line saying when the Skill should be used
}

Rules:
- Never name an AI model or AI company: the guide's rules choose the models.
- No links, no keys, no real people's details.
- Don't contradict or weaken any safeguard in the design.
- Ground pitfalls in the KNOWLEDGE chunks and cite only those given.
- Use commas instead of long dashes.
Return only the JSON object. No prose, no code fences.`;

/** Changes whenever the instructions change, so old text isn't reused. */
export const KIT_VERSION = fingerprint(INSTRUCTIONS);

/** What the kit is written for: the design shown, the rules, and the chunks given to the model. */
function contextFor(answers: Answers, env: KitEnv) {
  const r = recommend(answers);
  const ai = cachedDesign(answers, env);
  const bp = ai ?? buildBlueprint(r, answers);
  const chunks = selectChunks(r, bp, undefined, 8, KIT_CHUNKS);
  const lead = bp.nodes.find((n) => n.engine?.kind === "model" && n.engine.role === "coordinator");
  const briefIds = r.approach.id === "multi" ? bp.nodes.filter((n) => n === lead || (n.engine?.kind === "model" && n.engine.role === "specialist")).map((n) => n.id) : [];
  return { r, bp, design: (ai ? "ai" : "rules") as KitResponse["design"], chunks, ctx: { r, bp, chunks: chunks.map(({ id, title }) => ({ id, title })), briefIds } };
}

const kitKey = (answers: Answers, bp: Blueprint, model: string) => `${KIT_VERSION}:${model}:${fingerprint(JSON.stringify(bp))}:${resultCode(answers)}`;

/** Checks a model's text and assembles the kit with it; undefined if the kit fails the structural checks. */
function assemble(raw: unknown, answers: Answers, c: ReturnType<typeof contextFor>): { text: KitText; dropped: string[] } | undefined {
  const { text, dropped } = checkKitText(raw, c.ctx);
  const problems = kitProblems(c.r, c.bp, answers, buildStarterKit(c.r, c.bp, answers, text));
  if (problems.length || dropped.length) console.warn(`[kit] "${answers.task}": ${[...dropped.map((x) => `dropped ${x}`), ...problems].join("; ")}`);
  return problems.length ? undefined : { text, dropped };
}

/** The checked kit text already written for these answers and this design, if any. */
export function cachedKitText(answers: Answers, env: KitEnv): KitText | undefined {
  if (!env.model || !env.cache) return undefined;
  const c = contextFor(answers, env);
  const raw = env.cache.get<unknown>("kit", kitKey(answers, c.bp, env.model))?.value;
  return raw === undefined ? undefined : assemble(raw, answers, c)?.text;
}

export function buildKitInput(a: Answers, r: Recommendation, bp: Blueprint, chunks: Chunk[], briefIds: string[]): string {
  const answered = QUESTIONS.filter((q) => q.id !== "task" && a[q.id] !== undefined).map((q) => `- ${q.title} ${said(a, q.id)}`);
  return [
    `TASK: ${a.task}`,
    "",
    "OWNER'S ANSWERS:",
    ...answered,
    ...(a.details?.length ? ["", "TASK-SPECIFIC DETAILS:", ...detailLines(a)] : []),
    "",
    `DESIGN (fixed): ${bp.title} ${bp.summary}`,
    `Approach: ${r.approach.title}. ${r.models.needed ? "It uses AI steps." : "It uses no AI: leave out context, rules, output, briefs and skillDescription."}`,
    ...bp.nodes.map((n) => `${n.step}. [${n.kind}] ${n.name} (id ${n.id}): ${n.what}${n.gates.length ? ` Safeguards: ${n.gates.map((g) => g.text).join("; ")}.` : ""}`),
    ...(briefIds.length ? ["", `Agents that need a brief, by id: ${briefIds.join(", ")}.`] : []),
    "",
    "ALREADY ASKED OF THE OWNER: real past examples with good results; their playbook or reference material where relevant; software access; a provider account; who reviews results.",
    "",
    "KNOWLEDGE:",
    ...chunks.flatMap((c) => ["", `### ${c.id}: ${c.title}`, c.text]),
  ].join("\n");
}

export async function handleKit(body: unknown, env: KitEnv, complete?: Complete): Promise<KitResult> {
  if (!env.apiKey || !env.model) return { status: 503, body: { error: "AI kit writing isn't set up. Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart." } };
  const raw = (body as { answers?: unknown })?.answers;
  const answers = raw && typeof raw === "object" ? decodeAnswers(encodeAnswers(raw as Answers)) : null;
  if (!answers || !isComplete(answers)) return { status: 400, body: { error: "Send a complete set of answers from the guide." } };

  const c = contextFor(answers, env);
  const key = kitKey(answers, c.bp, env.model);
  const model = env.model;
  const hit = env.cache?.get<unknown>("kit", key)?.value;
  if (hit !== undefined) {
    const done = assemble(hit, answers, c);
    if (done) return { status: 200, body: { ...done, design: c.design, source: "cache", model } satisfies KitResponse };
  }

  const run = complete ?? openAIComplete({ apiKey: env.apiKey, model });
  return singleFlight(`kit:${key}`, async (): Promise<KitResult> => {
    try {
      const draft = extractJson(await run(INSTRUCTIONS, buildKitInput(answers, c.r, c.bp, c.chunks, c.ctx.briefIds)));
      const done = assemble(draft, answers, c);
      if (!done) return { status: 502, body: { error: "The AI's kit text didn't pass the kit checks, so the template kit is used." } };
      env.cache?.put("kit", { key, label: answers.task, value: draft });
      return { status: 200, body: { ...done, design: c.design, source: "ai", model } satisfies KitResponse };
    } catch (e) {
      const err = e as { status?: number };
      const message = err.status === 401 ? "OpenAI rejected the API key." : err.status === 404 ? `OpenAI doesn't recognise the model "${model}".` : "The AI couldn't write the kit text, so the template kit is used.";
      return { status: 502, body: { error: message } };
    }
  });
}
