// The model call and reply parsing shared by every AI endpoint.

import OpenAI from "openai";

/** Sends instructions and input to a model and returns its text. Swappable for tests. */
export type Complete = (instructions: string, input: string) => Promise<string>;

// A long call (tailoring a workflow) takes about 2.5 to 3 minutes. A retry after
// a timeout would only double the wait, so a call gets one long window and is not retried.
export const CALL_TIMEOUT_MS = 360_000;

export function openAIComplete(env: { apiKey: string; model: string }): Complete {
  const client = new OpenAI({ apiKey: env.apiKey, timeout: CALL_TIMEOUT_MS, maxRetries: 0 });
  return async (instructions, input) => {
    const response = await client.responses.create({ model: env.model, instructions, input, max_output_tokens: 32_000 });
    return response.output_text;
  };
}

/** Pull the JSON object out of a reply, tolerating stray fences or prose. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The reply did not contain a JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}
