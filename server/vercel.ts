import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sharedCache } from "./cache";
import { handleDecide } from "./decide";
import { handleDesign } from "./design";
import { handleInterview } from "./interview";
import { handleKit } from "./kit";
import { configureMetering } from "./metering";
import { resolveModels } from "./models";
import { handleSplit } from "./split";
import { handleTailor } from "./tailor";

/**
 * The AI endpoints as a Vercel function, for the online copy of the site.
 * scripts/build-vercel.mjs bundles this file into each /api/<step> function.
 *
 * The handlers are the dev server's (vite.config.ts), with the key read from
 * Vercel's environment instead of .env. A public address also needs limits the
 * dev server doesn't: request bodies are capped, and each visitor's address and
 * each running instance get a number of AI requests per hour. The limits live in
 * memory, per instance, so they slow casual abuse but are not a budget. The
 * budget is the spend limit on the Anthropic workspace the key belongs to.
 */

const MAX_BODY = 50_000;
const HOUR = 60 * 60 * 1000;
// A three-job run from description to kits makes about 16 AI requests.
const PER_ADDRESS_PER_HOUR = Number(process.env.AI_LIMIT_PER_ADDRESS_HOUR) || 60;
const PER_INSTANCE_PER_HOUR = Number(process.env.AI_LIMIT_PER_HOUR) || 600;

const env = process.env;
const models = resolveModels({ model: env.ANTHROPIC_MODEL, escalationModel: env.ANTHROPIC_ESCALATION_MODEL });
const claude = { apiKey: env.ANTHROPIC_API_KEY ?? "", workspaceId: env.ANTHROPIC_WORKSPACE_ID || undefined, ...models };
// Only /tmp is writable in a function; the cache lasts as long as the instance does.
const cache = sharedCache(join(tmpdir(), "blueprint-ai-cache", "cache.json"));
const metering = Promise.resolve()
  .then(() => configureMetering({ apiKey: env.REVENIUM_METERING_API_KEY, baseUrl: env.REVENIUM_METERING_BASE_URL, email: env.REVENIUM_SUBSCRIBER_EMAIL }))
  .catch((e) => console.warn(`Revenium metering is off: ${(e as Error).message}`));

type Result = { status: number; body: unknown };
const routes: Record<string, (body: unknown) => Promise<Result>> = {
  split: (body) => handleSplit(body, { ...claude, cache }),
  interview: (body) =>
    handleInterview(body, {
      ...claude,
      embeddingApiKey: env.OPENAI_API_KEY,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      cache,
    }),
  decide: (body) => handleDecide(body, { ...claude, cache }),
  design: (body) => handleDesign(body, { ...claude, cache }),
  kit: (body) => handleKit(body, { ...claude, cache }),
  tailor: (body) => handleTailor(body, { ...claude, cache }),
};

/** Counts requests per key in a sliding hour. Returns the minutes until the next one is allowed, or 0. */
export function rateLimiter(limit: number, windowMs = HOUR) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): number => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 60_000));
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) hits.delete(hits.keys().next().value as string);
    return 0;
  };
}

const perAddress = rateLimiter(PER_ADDRESS_PER_HOUR);
const perInstance = rateLimiter(PER_INSTANCE_PER_HOUR);

function address(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY) {
        resolve(null);
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const step = (req.url ?? "").split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  const handle = routes[step];
  if (!handle) return send(res, 404, { error: "No such AI step." });
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  if (!claude.apiKey) return send(res, 503, { error: "The AI steps aren't set up on this copy of the site." });

  const wait = perAddress(address(req)) || perInstance("all");
  if (wait) return send(res, 429, { error: `Too many AI requests for now. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` });

  const raw = await readBody(req).catch(() => null);
  if (raw === null) return send(res, 413, { error: "That request is too large." });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    /* handled as a bad request by the handler */
  }
  try {
    await metering;
    const out = await handle(body);
    send(res, out.status, out.body);
  } catch (e) {
    console.error(`[${step}] ${(e as Error).message}`);
    if (!res.headersSent && !res.writableEnded) send(res, 500, { error: "The AI service hit an error. Try again." });
  }
}
