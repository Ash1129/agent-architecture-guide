# Agent Architecture Guide

A short, plain-English guide that takes an experienced businessperson from one business task to a sensible starting AI architecture: whether an agent is needed at all, the tools (Skills, MCP, Claude Cowork, Hermes, n8n, Airflow or a hybrid), model capabilities, a level of autonomy, a topology, a simpler starting option, gotchas and a first step.

Built for AI Assignment 4 (ENMGT 5405, Cornell University). Every recommendation comes from fixed, published rules based on the assignment's research. No AI model generates results.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # type check, decision-rule tests, production build
npm run build      # static site in dist/
npm run preview    # serve the production build locally
```

## How it's organised

| Path | What it holds |
| --- | --- |
| `src/lib/questions.ts` | The questions, their options, and when each one is asked. |
| `src/lib/rules.ts` | The decision rules. Each has a plain-English `if`, `then`, and a `basis`: a cited source or a design choice. |
| `src/lib/catalog.ts` | Plain-language descriptions of tools, topologies, autonomy levels and glossary terms. Product names and `LAST_REVIEWED` live here. |
| `src/lib/sources.ts` | The sources cited in Assignment 4. |
| `src/lib/blueprint.ts` | Turns a recommendation into the architecture diagram: steps, parallel lanes, decisions, approvals, stop rules and loops, plus the simpler starting option. It reads the rules engine's output and never changes it. |
| `src/components/ArchitectureMap.tsx` | Draws a blueprint as keyboard-focusable steps with measured connections; left to right when there's room, top to bottom on narrow screens. |
| `src/lib/models.ts` | Which model (or which non-AI method) runs each step, and why. |
| `src/lib/starter.ts` | The starter kit: `BUILD.md` for an AI coding assistant, plus the n8n workflow, Skill, system prompt, MCP config, Airflow DAG and test set that fit the design. |
| `src/lib/share.ts` | Encoding answers into share links, and the plain-text summary. |
| `src/pages/` | Landing, Guide, Result and How-it-decides pages. |
| `tests/rules.test.ts` | Named decision paths, plus every reachable answer path checked for a complete, well-formed result. |
| `tests/starter.test.ts` | Every kit is complete and consistent: valid JSON, n8n connections that point at real nodes, every step and model in `BUILD.md`, valid Python for Airflow. |
| `tests/blueprint.test.ts` | Every answer path checked for a drawable, honest diagram: connected, approvals matching the autonomy level, loops and branches where the topology has them, no connection passing through a step. |

The "How it decides" page renders `RULES` directly, so the published explanation can't drift from the logic.

## iCloud and `node_modules`

This folder sits in `~/Documents`, which iCloud can sync. When the disk is nearly full, iCloud may evict files to the cloud, and the build tools then hang reading them. To prevent that, dependencies live in `node_modules.nosync` (iCloud skips folders ending in `.nosync`) and `node_modules` is a link to it. `vite.config.ts` sets `resolve.preserveSymlinks` so this works. After running `npm ci`, which replaces the link with a real folder, restore the arrangement:

```bash
rm -rf node_modules.nosync && mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
```

## Updating products and models

Recommendations are written around capabilities, so most updates are copy changes:

1. Edit product descriptions or links in `src/lib/catalog.ts`, and model examples in rule `M10` in `src/lib/rules.ts`.
2. Update `LAST_REVIEWED` in `src/lib/catalog.ts`.
3. Run `npm run check`.

To change a decision, edit or add a rule in `src/lib/rules.ts`, give it a `basis`, and add a test for the path it affects.

## AI tailoring (local experiment only)

**Tailor with AI**, on the n8n row of the starter kit, sends the answers to an OpenAI model that tailors the n8n workflow to the task (specific step names, real prompts, exact-match routing). The result is checked before it is shown, and the generated version is kept if the check fails.

It exists only in `npm run dev`, and is never part of the published site:

- `.env.development` holds the switch, `VITE_AI_TAILORING=true`. Vite reads that file only in development, so `npm run build` leaves the button, its request code and its privacy wording out of the bundle.
- `.env` holds `OPENAI_API_KEY` and `OPENAI_MODEL` (set to `gpt-6.1-sol`). They are read only by the dev server (`server/tailor.ts`) and never reach the browser.
- Both files are git-ignored. There is no deployable endpoint, so a published copy cannot spend your OpenAI credit.

To try it: add your key to `.env`, then restart `npm run dev`.

## Publishing

`npm run build` produces the published version (everything except AI tailoring) as a fully static site in `dist/` with relative asset paths and hash-based URLs, so it works on any static host, at a domain root or in a sub-folder, with no server configuration.

- **Vercel**: import the folder or repository; framework preset "Vite", build command `npm run build`, output directory `dist`. Or run `npx vercel` from this folder.
- **Netlify**: drag the `dist/` folder onto app.netlify.com/drop, or connect a repository with build command `npm run build` and publish directory `dist`.
- **GitHub Pages**: push the repository, then publish `dist/` with a GitHub Actions workflow (Settings > Pages > Source: GitHub Actions, using the "Static HTML" starter pointed at `dist`).
- **Anywhere else**: upload the contents of `dist/` to any web server or file host.

## Privacy

There are no accounts, analytics or server calls. Progress is kept in the visitor's browser storage, and a shared result link carries the answers (including the task description) inside the link itself.
