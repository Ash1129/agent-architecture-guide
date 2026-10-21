// The model call and reply parsing shared by every AI endpoint.

import Anthropic from "@anthropic-ai/sdk";
import { meteringTag } from "./metering";
import { type Attempt, type ModelChoice, modelFor } from "./models";

export type { Attempt } from "./models";

/**
 * Sends instructions and input to a model and returns its text. `attempt` picks
 * the model (see server/models.ts): the first try, or the retry after a failed check.
 * Swappable for tests.
 */
export type Complete = (instructions: string, input: string, attempt?: Attempt) => Promise<string>;

// A long call (tailoring a workflow) takes about 2.5 to 3 minutes. A retry after
// a timeout would only double the wait, so a call gets one long window and is not retried.
export const CALL_TIMEOUT_MS = 360_000;

/** Room for the longest reply (a tailored n8n workflow) and the model's thinking before it. */
export const MAX_TOKENS = 32_000;

/** How hard the model thinks before answering. */
export type Effort = "low" | "medium" | "high";

/** The message a reply that ran past the output limit throws, so its retry can be told why. */
export const OUTPUT_LIMIT = "The reply ran past the output limit.";

/** Added to the retry after a reply ran past the output limit, so the retry isn't the same request again. */
export const RUNAWAY_NOTE =
  "YOUR PREVIOUS REPLY RAN PAST THE OUTPUT LIMIT AND WAS CUT OFF. Think briefly, then return only the JSON object: no explanation before or after it, and keep every text field as short as the instructions allow.";

type ClaudeEnv = ModelChoice & { apiKey: string; workspaceId?: string; task?: string; effort?: Effort };

/** The request for one try: its model, effort and output room, the cached instructions, and the Revenium tag. */
export function messageParams(env: ClaudeEnv, instructions: string, input: string, attempt: Attempt = "first") {
  return {
    model: modelFor(env, attempt),
    max_tokens: MAX_TOKENS,
    output_config: { effort: env.effort ?? "medium" },
    // Each endpoint's instructions are the same on every call, so they are cached between calls.
    system: [{ type: "text" as const, text: instructions, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: input }],
    ...meteringTag(env.task ?? "complete", attempt),
  };
}

/** One line for the server log when a reply runs past the output limit: where its tokens went, and how it ended. */
export function runawayReport(task: string, message: Pick<Anthropic.Message, "model" | "usage" | "content">): string {
  const usage = message.usage as Anthropic.Usage & { output_tokens_details?: { thinking_tokens?: number } };
  const thinking = usage.output_tokens_details?.thinking_tokens;
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  const tail = text.slice(-200).replace(/\s+/g, " ");
  return (
    `[${task}] ${message.model} ran past the ${MAX_TOKENS}-token output limit: ${usage.output_tokens} output tokens, ` +
    `${thinking ?? "unknown"} of them thinking, ${text.length} characters of reply. Reply ends: "${tail}"`
  );
}

/**
 * `task` names the endpoint, so Revenium (when metering is on) can show cost per step.
 * `effort` sets how hard the model thinks; most steps use medium.
 * `workspaceId` is needed when the API key isn't scoped to a workspace: it's sent
 * as the anthropic-workspace-id header on every request.
 */
export function claudeComplete(env: ClaudeEnv): Complete {
  const client = new Anthropic(clientOptions(env));
  return async (instructions, input, attempt = "first") => {
    // Streamed, so a long reply never runs into an HTTP timeout.
    const message = await client.messages.stream(messageParams(env, instructions, input, attempt)).finalMessage();
    if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (message.stop_reason === "max_tokens") {
      console.warn(runawayReport(env.task ?? "complete", message));
      throw new Error(OUTPUT_LIMIT);
    }
    return message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  };
}

/** The client settings: one long timeout, no SDK retries, and the workspace header when a workspace is set. */
export function clientOptions(env: { apiKey: string; workspaceId?: string }): ConstructorParameters<typeof Anthropic>[0] {
  const workspaceId = env.workspaceId?.trim();
  return {
    apiKey: env.apiKey,
    timeout: CALL_TIMEOUT_MS,
    maxRetries: 0,
    ...(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}),
  };
}

/** An error from the API itself (bad key, unknown model, timeout, outage): a retry on another model won't fix it. */
export function isApiFailure(e: unknown): boolean {
  return e instanceof Anthropic.APIError || typeof (e as { status?: unknown })?.status === "number";
}

/**
 * For a step that makes one call: tries the first model, and if its answer is
 * unusable (no JSON, or a failed check thrown by `tryAt`), tries once more on
 * the escalation model. API errors are not retried.
 */
export async function withEscalation<T>(step: string, tryAt: (attempt: Attempt) => Promise<T>): Promise<{ value: T; attempt: Attempt }> {
  try {
    return { value: await tryAt("first"), attempt: "first" };
  } catch (e) {
    if (isApiFailure(e)) throw e;
    console.warn(`[${step}] first answer rejected, retrying on the escalation model: ${(e as Error).message}`);
    return { value: await tryAt("retry"), attempt: "retry" };
  }
}

/**
 * The first try for a step with a correction round. A reply that never finished
 * (it ran past the output limit, or the model declined) counts as a failed draft,
 * so the step's retry goes to the escalation model. API errors still throw.
 */
export async function firstDraft(step: string, run: Complete, instructions: string, input: string): Promise<{ text: string; failure?: string }> {
  try {
    return { text: await run(instructions, input, "first") };
  } catch (e) {
    if (isApiFailure(e)) throw e;
    console.warn(`[${step}] first answer didn't finish, retrying on the escalation model: ${(e as Error).message}`);
    return { text: "", failure: (e as Error).message };
  }
}

/** Pull the JSON object out of a reply, tolerating stray fences or prose. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The reply did not contain a JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}
