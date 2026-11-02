// Builds the site and its AI endpoints for Vercel, in the Build Output API layout
// (https://vercel.com/docs/build-output-api): static files in .vercel/output/static,
// and one function per AI step in .vercel/output/functions/api/<step>.func.
//
// The functions are bundled by Vite from server/vercel.ts, so the `?raw` and glob
// imports the server code shares with the site resolve the same way they do in
// the dev server. Each function carries the knowledge chunks it reads at run time.
//
// The AI steps are switched on in the site only when ANTHROPIC_API_KEY is set in
// the build's environment; without it the build is the static site as before.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";

const root = process.cwd();
const out = join(root, ".vercel", "output");
const STEPS = ["split", "interview", "decide", "design", "kit", "tailor"];

const aiOn = Boolean(process.env.ANTHROPIC_API_KEY);
if (aiOn && !process.env.VITE_AI_TAILORING) process.env.VITE_AI_TAILORING = "true";
console.log(`AI steps: ${aiOn ? "on" : "off (no ANTHROPIC_API_KEY in the build environment)"}`);

rmSync(out, { recursive: true, force: true });

// The site, exactly as `vite build` makes it.
await build({ root, logLevel: "warn" });
cpSync(join(root, "dist"), join(out, "static"), { recursive: true });

if (aiOn) {
  // The AI endpoints: one self-contained ES module with every dependency inside.
  const bundle = join(root, "node_modules", ".cache", "vercel-functions");
  await build({
    root,
    configFile: false,
    logLevel: "warn",
    resolve: { preserveSymlinks: true },
    ssr: { noExternal: true, target: "node" },
    build: {
      ssr: "server/vercel.ts",
      outDir: bundle,
      emptyOutDir: true,
      target: "node22",
      rolldownOptions: { output: { format: "es", entryFileNames: "index.mjs", codeSplitting: false } },
    },
  });
  for (const step of STEPS) {
    const dir = join(out, "functions", "api", `${step}.func`);
    mkdirSync(dir, { recursive: true });
    cpSync(join(bundle, "index.mjs"), join(dir, "index.mjs"));
    cpSync(join(root, "knowledge", "chunks"), join(dir, "knowledge", "chunks"), { recursive: true });
    writeFileSync(
      join(dir, ".vc-config.json"),
      JSON.stringify({ runtime: "nodejs22.x", handler: "index.mjs", launcherType: "Nodejs", shouldAddHelpers: false, maxDuration: 300 }, null, 2),
    );
  }
}

writeFileSync(join(out, "config.json"), JSON.stringify({ version: 3 }, null, 2));
console.log(`Wrote ${out}${aiOn ? ` with ${STEPS.length} AI functions` : ""}.`);
