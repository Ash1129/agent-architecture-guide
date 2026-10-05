import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage } from "node:http";

/**
 * Serves POST /api/tailor during local development, reading the OpenAI key
 * from .env on the server side only. When deployed, api/tailor.ts does the
 * same job as a serverless function.
 */
function tailorApi(): Plugin {
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
    name: "tailor-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use("/api/tailor", async (req, res) => {
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
          /* handled as a bad request below */
        }
        const { handleTailor } = await server.ssrLoadModule("/server/tailor.ts");
        const out = await handleTailor(body, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
        res.statusCode = out.status;
        res.end(JSON.stringify(out.body));
      });
    },
  };
}

// base "./" keeps the build portable: it works from a domain root, a sub-path
// (GitHub Pages) or a static file host without changes.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), tailorApi()],
  // node_modules may be a link to node_modules.nosync (kept out of iCloud sync).
  // Keeping the linked path lets Vite still treat packages as dependencies.
  resolve: { preserveSymlinks: true },
  // Honour PORT when a tool assigns one (for example, a preview runner); otherwise use Vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
});
