// Optional Revenium metering for the AI endpoints. When REVENIUM_METERING_API_KEY
// is set in .env, every model and embedding call reports its model, tokens,
// duration and task (split, interview, decide, design, kit, tailor) to Revenium.
// Only usage numbers are sent: prompt capture is switched off, so no task
// descriptions, answers or replies leave this machine for Revenium.
// Without the key, calls go straight to Anthropic and OpenAI exactly as before.
//
// Claude calls are metered by Revenium's patch of the Anthropic SDK, which reads
// each call's tags from a `usageMetadata` field it strips before sending.
// Embedding calls (OpenAI) go through Revenium's wrapper around Blueprint's own
// client, so they keep their timeout and retry settings. Reporting is
// fire-and-forget: a metering failure is logged and never fails a request.

import type OpenAI from "openai";
import { getConfig, setConfig, validateConfig } from "@revenium/middleware";
import { configure as meterAnthropic, isAnthropicPatched } from "@revenium/middleware/anthropic";
import { EmbeddingsInterface, Provider } from "@revenium/middleware/openai";
import type { UsageMetadata } from "@revenium/middleware/openai";

export type MeteringEnv = { apiKey?: string; baseUrl?: string; email?: string };

const PRODUCT = "Blueprint";
const OPENAI_PROVIDER = { provider: Provider.OPENAI, isAzure: false };

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
  meterAnthropic(config);
  subscriberEmail = env.email || undefined;
  return true;
}

export function meteringEnabled(): boolean {
  return !!getConfig()?.reveniumApiKey;
}

/** What Revenium groups this call's cost by. A retry after a failed check is marked, so escalations can be counted. */
export function usageMetadata(task: string, attempt: "first" | "retry" = "first"): UsageMetadata {
  return {
    productName: PRODUCT,
    taskType: task,
    agent: `blueprint-${task}`,
    retryNumber: attempt === "retry" ? 1 : 0,
    ...(subscriberEmail ? { subscriber: { email: subscriberEmail } } : {}),
  };
}

/**
 * The tag to spread into a Claude request. Empty unless Revenium's patch is
 * active: the API would reject `usageMetadata` if it ever reached Anthropic.
 */
export function meteringTag(task: string, attempt: "first" | "retry" = "first"): { usageMetadata?: UsageMetadata } {
  return meteringEnabled() && isAnthropicPatched() ? { usageMetadata: usageMetadata(task, attempt) } : {};
}

type CreateEmbedding = (params: OpenAI.EmbeddingCreateParams) => Promise<OpenAI.CreateEmbeddingResponse>;

/** `client.embeddings.create`, reported to Revenium when metering is on. */
export function meteredEmbeddings(client: OpenAI, task: string): CreateEmbedding {
  const config = getConfig();
  if (!config?.reveniumApiKey) return (params) => client.embeddings.create(params);
  const wrapped = new EmbeddingsInterface(client, config, OPENAI_PROVIDER);
  return (params) => wrapped.create(params, usageMetadata(task));
}
