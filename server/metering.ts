// Optional Revenium metering for the AI endpoints. When REVENIUM_METERING_API_KEY
// is set in .env, every model and embedding call reports its model, tokens,
// duration and task (split, interview, decide, design, kit, tailor) to Revenium.
// Only usage numbers are sent: prompt capture is switched off, so no task
// descriptions, answers or replies leave this machine for Revenium.
// Without the key, calls go straight to OpenAI exactly as before.
//
// The wrappers take Blueprint's own OpenAI client, so each call keeps its
// timeout and retry settings. Reporting is fire-and-forget: a metering failure
// is logged by the middleware and never fails or delays the request.

import type OpenAI from "openai";
import { getConfig, setConfig, validateConfig } from "@revenium/middleware";
import { EmbeddingsInterface, Provider, ResponsesInterface } from "@revenium/middleware/openai";
import type { UsageMetadata } from "@revenium/middleware/openai";

export type MeteringEnv = { apiKey?: string; baseUrl?: string; email?: string };

const PRODUCT = "Blueprint";
const PROVIDER = { provider: Provider.OPENAI, isAzure: false };

let subscriberEmail: string | undefined;

/** Turns metering on when a Revenium key is given. Returns whether it is on. */
export function configureMetering(env: MeteringEnv): boolean {
  if (!env.apiKey) return false;
  const config = {
    reveniumApiKey: env.apiKey,
    reveniumBaseUrl: env.baseUrl || "https://api.revenium.ai",
    capturePrompts: false,
    printSummary: false,
    debug: false,
  };
  validateConfig(config);
  setConfig(config);
  subscriberEmail = env.email || undefined;
  return true;
}

export function meteringEnabled(): boolean {
  return !!getConfig()?.reveniumApiKey;
}

/** What Revenium groups this call's cost by. */
export function usageMetadata(task: string): UsageMetadata {
  return {
    productName: PRODUCT,
    taskType: task,
    agent: `blueprint-${task}`,
    ...(subscriberEmail ? { subscriber: { email: subscriberEmail } } : {}),
  };
}

type CreateResponse = (params: OpenAI.Responses.ResponseCreateParamsNonStreaming) => Promise<OpenAI.Responses.Response>;
type CreateEmbedding = (params: OpenAI.EmbeddingCreateParams) => Promise<OpenAI.CreateEmbeddingResponse>;

/** `client.responses.create`, reported to Revenium when metering is on. */
export function meteredResponses(client: OpenAI, task: string): CreateResponse {
  const config = getConfig();
  if (!config?.reveniumApiKey) return (params) => client.responses.create(params);
  const wrapped = new ResponsesInterface(client, config, PROVIDER);
  // The middleware returns the SDK's own response object; its declared type is just narrower.
  return async (params) => (await wrapped.create({ ...params }, usageMetadata(task))) as unknown as OpenAI.Responses.Response;
}

/** `client.embeddings.create`, reported to Revenium when metering is on. */
export function meteredEmbeddings(client: OpenAI, task: string): CreateEmbedding {
  const config = getConfig();
  if (!config?.reveniumApiKey) return (params) => client.embeddings.create(params);
  const wrapped = new EmbeddingsInterface(client, config, PROVIDER);
  return (params) => wrapped.create(params, usageMetadata(task));
}
