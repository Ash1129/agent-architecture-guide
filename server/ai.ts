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
const MAX_TOKENS = 32_000;

/**
 * `task` names the endpoint, so Revenium (when metering is on) can show cost per step.
 * `workspaceId` is needed when the API key isn't scoped to a workspace: it's sent
 * as the anthropic-workspace-id header on every request.
 */
export function claudeComplete(env: ModelChoice & { apiKey: string; workspaceId?: string; task?: string }): Complete {
  const client = new Anthropic(clientOptions(env));
  return async (instructions, input, attempt = "first") => {
    // Streamed, so a long reply never runs into an HTTP timeout. Each endpoint's
    // instructions are the same on every call, so they are cached between calls.
    const message = await client.messages
      .stream({
        model: modelFor(env, attempt),
        max_tokens: MAX_TOKENS,
        output_config: { effort: "medium" },
        system: [{ type: "text", text: instructions, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: input }],
        ...meteringTag(env.task ?? "complete", attempt),
      })
      .finalMessage();
    if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (message.stop_reason === "max_tokens") throw new Error("The reply ran past the output limit.");
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
