import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage } from "node:http";

/**
 * Serves the AI endpoints during local development, reading the OpenAI key
 * from .env on the server side only:
 *   POST /api/interview  adapts the guide's questions to a task
 *   POST /api/design     drafts the architecture for a finished set of answers
 *   POST /api/kit        writes the task-specific text of the starter kit
 *   POST /api/tailor     tailors the n8n workflow to a finished design
 * Both share one cache of earlier results in ai-cache.nosync/.
 */
function aiApi(): Plugin {
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
        if (data.length > 50_000) req.destroy();
      });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  return {
    name: "ai-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const cachePath = `${process.cwd()}/ai-cache.nosync/cache.json`;
      const routes: Record<string, (body: unknown) => Promise<{ status: number; body: unknown }>> = {
        "/api/tailor": async (body) => {
          const [{ handleTailor }, { sharedCache }] = await Promise.all([server.ssrLoadModule("/server/tailor.ts"), server.ssrLoadModule("/server/cache.ts")]);
          return handleTailor(body, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL, cache: sharedCache(cachePath) });
        },
        "/api/design": async (body) => {
          const [{ handleDesign }, { sharedCache }] = await Promise.all([server.ssrLoadModule("/server/design.ts"), server.ssrLoadModule("/server/cache.ts")]);
          return handleDesign(body, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL, cache: sharedCache(cachePath) });
        },
        "/api/kit": async (body) => {
          const [{ handleKit }, { sharedCache }] = await Promise.all([server.ssrLoadModule("/server/kit.ts"), server.ssrLoadModule("/server/cache.ts")]);
          return handleKit(body, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL, cache: sharedCache(cachePath) });
        },
        "/api/interview": async (body) => {
          const [{ handleInterview }, { sharedCache }] = await Promise.all([server.ssrLoadModule("/server/interview.ts"), server.ssrLoadModule("/server/cache.ts")]);
          return handleInterview(body, {
            apiKey: env.OPENAI_API_KEY,
            // Adapting questions is a small job: use the faster model when one is set.
            model: env.OPENAI_FAST_MODEL || env.OPENAI_MODEL,
            embeddingModel: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
            cache: sharedCache(cachePath),
          });
        },
      };
      for (const [path, handle] of Object.entries(routes)) {
        server.middlewares.use(path, async (req, res) => {
          res.setHeader("Content-Type", "application/json");
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Use POST." }));
            return;
          }
          let body: unknown = null;
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            /* handled as a bad request by the handler */
          }
          // A failure here (for example the server restarting mid-request) must
          // answer the browser, not crash the dev server with an unhandled rejection.
          try {
            const out = await handle(body);
            res.statusCode = out.status;
            res.end(JSON.stringify(out.body));
          } catch (e) {
            server.config.logger.error(`[${path}] ${(e as Error).message}`);
            if (res.headersSent || res.writableEnded) return;
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "The AI service hit an error. Try again." }));
          }
        });
      }
    },
  };
}

// base "./" keeps the build portable: it works from a domain root, a sub-path
// (GitHub Pages) or a static file host without changes.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), aiApi()],
  // node_modules may be a link to node_modules.nosync (kept out of iCloud sync).
  // Keeping the linked path lets Vite still treat packages as dependencies.
  resolve: { preserveSymlinks: true },
  // Honour PORT when a tool assigns one (for example, a preview runner); otherwise use Vite's default.
  // The AI cache is written while the server runs; it must never trigger a reload.
  server: { watch: { ignored: ["**/ai-cache.nosync/**"] }, ...(process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {}) },
});
