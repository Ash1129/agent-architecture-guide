// The split endpoint. Takes a problem described on the start page and says
// whether it is one job or several separate jobs, each of which should be
// designed as its own system (see src/lib/process.ts). Most descriptions are
// one job, and come back as one. The same description asked again comes from
// the cache. Every split is validated before it's returned or cached.

import { MAX_JOBS, MAX_JOB_DESCRIPTION, MAX_PROCESS_DESCRIPTION, type SplitResponse, validateSplit } from "../src/lib/process";
import { normaliseTask } from "../src/lib/interview";
import { fingerprint } from "../src/lib/tailored";
import { type Cache, singleFlight } from "./cache";
import { type Complete, extractJson, openAIComplete } from "./ai";

export type SplitEnv = { apiKey?: string; model?: string; cache?: Cache };
export type SplitResult = { status: number; body: Record<string, unknown> };

export const INSTRUCTIONS = `You read a business owner's description of a problem and decide whether it is one job or several separate jobs. Each job you return will be designed as its own system (an automation, an AI workflow or an AI agent), so split only where separate systems make sense.

Return one JSON object:
{"title": string, "jobs": [{"title": string, "description": string}], "handoffs": [{"from": number, "to": number, "via": string, "when": string}]}

Rules:
1. A job is business work a system would do day to day, such as screening job applications or scheduling interviews. Analysing, designing, reporting on or presenting a solution is never a job. When the description is a brief, case study or assignment, find the business work inside it: the pain points, the manual work people are buried in.
2. Split only when that work clearly contains jobs that differ in what starts them, what they work on, or who is involved. Example: "screen job applications" and "schedule interviews" are two jobs. The steps of one job (read, decide, reply, file) are not separate jobs. When in doubt, return one job.
3. At most ${MAX_JOBS} jobs, in the order the work flows through them. Include only jobs the owner wants solved: leave out anything they say stays manual, is out of scope, or is only background.
4. Each job's "title": the task as an instruction, under 120 characters, in the owner's terms. Example: "Screen job applications in Greenhouse against each role's requirements".
5. Each job's "description": self-contained, at most ${MAX_JOB_DESCRIPTION} characters (count them; stay well under). Carry over every fact from the description that matters to that job: systems, volumes, people, rules, legal constraints, what must happen before anything goes out. A constraint that applies to several jobs is repeated in each.
6. "handoffs": where one job's result starts or feeds another. "from" and "to" are job numbers starting at 1. "via": the system or channel that carries it, under 60 characters (for example "Greenhouse"). "when": the moment it hands over, under 160 characters (for example "A recruiter approves a phone screen"). Use an empty list for a single job.
7. "title" at the top: a short name for the whole process, under 80 characters.
Return only the JSON object. No prose, no code fences.`;

/** Changes whenever the instructions change, so old splits aren't reused. */
export const SPLIT_VERSION = fingerprint(INSTRUCTIONS);

export async function handleSplit(body: unknown, env: SplitEnv, deps: { complete?: Complete } = {}): Promise<SplitResult> {
  if (!env.apiKey || !env.model) return { status: 503, body: { error: "AI isn't set up. Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart." } };
  const raw = (body as { description?: unknown })?.description;
  const description = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, MAX_PROCESS_DESCRIPTION) : "";
  if (description.length < 3) return { status: 400, body: { error: "Send the description as a few sentences." } };

  const ns = "split";
  const key = `${SPLIT_VERSION}:${normaliseTask(description)}`;
  const hit = env.cache?.get<SplitResponse>(ns, key);
  if (hit) return { status: 200, body: { ...hit.value, source: "cache" } };

  return singleFlight(`split:${key}`, async () => {
    const run = deps.complete ?? openAIComplete({ apiKey: env.apiKey!, model: env.model! });
    try {
      const split = validateSplit(extractJson(await run(INSTRUCTIONS, `DESCRIPTION:\n${description}`)), description);
      const out: SplitResponse = { split, source: "ai", model: env.model };
      env.cache?.put(ns, { key, label: description.slice(0, 200), value: out });
      return { status: 200, body: out };
    } catch (e) {
      const err = e as { status?: number };
      const message = err.status === 401 ? "OpenAI rejected the API key." : err.status === 404 ? `OpenAI doesn't recognise the model "${env.model}".` : "The AI couldn't read the description into jobs.";
      return { status: 502, body: { error: message } };
    }
  });
}
