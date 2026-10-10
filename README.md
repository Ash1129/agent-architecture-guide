# Agent Architecture Guide

A short, plain-English guide that takes an experienced businessperson from one business task to a sensible starting AI architecture: whether an agent is needed at all, the tools (Skills, MCP, Claude as an agent, Hermes, n8n, Airflow or a hybrid), model capabilities, a level of autonomy, a topology, a simpler starting option, gotchas and a first step.

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
| `src/lib/process.ts` | A process of several jobs: checking the AI's split, its link, and saved processes. |
| `src/lib/exportxml.ts` | The draw.io export: one design (recommended and simpler), or a whole process. |
| `src/pages/` | Landing, Guide, Split, Result, Process (the system map), History and How-it-decides pages. |
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

## AI features (local only)

The guide is moving from rules that decide everything to AI that builds the answer, with the rules and the knowledge base as the layer that checks it. Five AI features exist so far, all only in `npm run dev`:

**Adaptive questions.** After you type a task, an OpenAI model (`server/interview.ts`) rewords every question and its options in the task's own terms, pre-selects the answers the task makes likely (with a one-line reason), and adds up to three task-specific questions on an optional last page. The question bank stays the backbone: `validatePlan` in `src/lib/interview.ts` keeps each question's id and exact set of answer values, in the bank's order, and anything that doesn't fit falls back to the standard wording, so the rules, links and history work unchanged. The task-specific answers travel with the other answers as `details` and are used when tailoring.

**Several jobs, one system.** A problem described on the start page (up to a whole case study, 12,000 characters) is first read by `server/split.ts`, which says whether it holds one job or several separate jobs that each need their own system, such as screening job applications and then scheduling interviews, and how they hand work to each other (through which system, and when). Most descriptions are one job and carry on as before. Several jobs are shown for the owner to confirm, rename, remove or keep as one; then each job's own description goes through the adaptive questions and review in turn, and the result is a system map (`src/pages/Process.tsx`): every job's design, the handoffs between them, and every point where a person steps in, with each job's full result a click away and the jobs listed in the sidebar. The map's link carries every job's answers (`src/lib/process.ts`), saved processes are listed in History, and "Export to draw.io" gives the whole system on one page, the jobs joined through the systems that carry each handoff, then a page per job. Each job is still designed and checked exactly like a single task: the split only decides what the jobs are.

**AI-drafted design.** On the result page, an OpenAI model (`server/design.ts`) drafts the architecture for the task: the steps, how they connect, and a plain-English what, why and passes for each, citing knowledge-base chunks. It starts from the rules' design and gets up to seventeen relevant chunks in full (`server/knowledge.ts`, ranked by the `kb` links of the rules that shaped the design). `checkDesign` in `src/lib/design.ts` holds the draft to hard limits taken from the rules' design for the same answers: the approach's limits on AI and agents, how the work starts, every safeguard word for word, every person and tool step, a well-formed graph, and citations only to chunks the model was given. The model only says what kind of AI step each one is; the model behind it comes from the rules (`pickModel`), and the layout is computed, not drawn by the model. A draft that fails gets one repair round with the exact problems; after that the rules' design stays on screen. The rules' design shows while the AI works, and "Compare with the rules' design" switches between them. The starter kit, and tailoring, build on whichever design is shown.

**AI-written starter kit.** Once the design settles, an OpenAI model (`server/kit.ts`) writes the kit's task-specific text for the design on screen: the business context, task rules and exact output format in the system prompt (which also feeds the n8n agent nodes, the Skill and Hermes' persona), briefs for each specialist agent, an overview, build notes, extra things to ask the owner, pitfalls citing knowledge-base chunks, illustrative test cases in `evals/examples.csv`, and the Skill's trigger line. The kit's structure stays deterministic: the step table, models, safeguards, embedded files and n8n wiring come from the design and the rules, and the AI's rules are added to the fixed safety rules, never in place of them. `checkKitText` in `src/lib/kittext.ts` checks each section on its own (no model names, links or keys; citations only to chunks it was given) and drops any that doesn't fit, so that section keeps its template. The assembled kit then goes through `kitProblems` (`src/lib/kitcheck.ts`), the same structural checks `tests/starter.test.ts` runs on every kind of design. AI designs are also required to build into a kit that passes those checks.

**Tailor with AI**, on the n8n row of the starter kit, sends the answers to an OpenAI model that tailors the n8n workflow to the task (specific step names, real prompts, exact-match routing). The result is checked before it is shown: every step, branch and model must still be there, and where a person must OK every action, that approval has to be built into the workflow. With AI on, the rule-generated workflow is only the AI's starting point and is never offered; the n8n workflow (its copy button, `n8n/workflow.json` and its section of `BUILD.md`) appears once it has been tailored, and is saved in the browser so reopening the result doesn't need another call. The published site, which has no AI, still offers the generated workflow.

**Shared cache.** All five check `ai-cache.nosync/cache.json` before calling a model (`server/cache.ts`). The same task, or the same answers, is served from the cache; designs and kit text are stored as the model's draft and re-checked on every read, so changes to the checks apply to old results. Rejected designs and dropped kit sections are logged on the dev server. Requests for the same thing at the same moment share one model call. A near-duplicate task (embedding similarity of 0.92 or more) reuses the earlier questions; a merely similar one (0.6 or more) is shown to the model as a reference. Short task names embed noisily (paraphrases can score 0.6 while "customer" and "supplier" emails score 0.83), which is why reuse needs a near-duplicate. The folder is git-ignored, kept out of iCloud by its `.nosync` name, and ignored by Vite's file watcher.

Setup:

- `.env.development` holds the switch, `VITE_AI_TAILORING=true`. Vite reads that file only in development, so `npm run build` leaves the AI features, their request code and their privacy wording out of the bundle.
- `.env` holds `OPENAI_API_KEY`, `OPENAI_MODEL` (set to `gpt-6-luna`) and optionally `OPENAI_FAST_MODEL` and `OPENAI_EMBEDDING_MODEL` (see `.env.example`). They are read only by the dev server and never reach the browser.
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

## Recommendation-quality evaluation

Run `npm run eval:guide` to grade the deterministic guide against 24 provisional
business scenarios. Reports appear in `outputs/guide-eval/latest.md` and
`latest.json`. The suite checks approach and platform suitability, safeguard
boundaries and unnecessary complexity. It makes no model calls. See
[`evals/recommendations/README.md`](evals/recommendations/README.md) for the rubric,
review process, initial release gate and coverage limits. The cases still need
independent human review; a passing score is not proof of optimal tool selection.

Published-case evaluation: run `npm run eval:guide:external`. See [source-backed findings and limitations](evals/recommendations/external-findings.md). This exploratory report is separate from the synthetic regression gate.
