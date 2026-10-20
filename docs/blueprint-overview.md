# Blueprint

**Tell it what's holding your business back. It designs the AI or automation system that fixes it, and hands you everything needed to build it.**

Blueprint (the Agent Architecture Guide) is for business owners who know their problem but not the technology. You describe the work in your own words, and Blueprint works out whether it needs AI at all, and if so, what kind: a simple automation, a workflow with AI steps, one agent, or a team of agents. It then tells you which tools to use, where to run them, which models to pick, how much the system should do on its own, what it will cost, and how to build it. Every choice comes with its reasons and the research behind them.

> Start with the problem. Not the technology.

---

## The journey

1. **Describe the problem.** Type it into one box, from a sentence to a whole case study. Blueprint reads it, works out whether it's one job or several, and answers what the description already settles.
2. **Answer only what's left.** A short survey, reworded in your terms ("patient appointment emails", not "inputs"), with likely answers suggested and task-specific questions where they matter.
3. **Check your answers.** Every answer is shown, the ones read from your description marked with the words that settled them.
4. **Get your solution.** The AI decides how to build it, drafts the design for your task, writes your starter kit and tailors the workflow, while an animated status shows what it's doing ("Weighing cost against quality…", "Cogitating…").
5. **Build it.** Hand `BUILD.md` to an AI coding assistant, paste the tailored workflow into n8n, or export the design to draw.io.

## What you get

| | |
|---|---|
| **Solution** | The recommendation in plain English: approach, agents, models, main tool, autonomy level, where it runs, and an estimated running cost, with where the AI's choices differ from the guide's rules. |
| **Workflow** | An interactive diagram of every step, with who or what does it, why it's there, what it passes on and its safeguards. Flip any step for its sources. A guided walkthrough explains it end to end. |
| **Build** | A starter kit: `BUILD.md` for Claude Code or Codex, a system prompt, a test set, engineering notes, and an n8n workflow tailored to the task, plus video walkthroughs for n8n, Claude and Hermes. |
| **Cost and effort** | Running cost per month (from real model and plan prices), review time a person will spend, build time, and own-hardware cost where relevant, always as ranges with the assumptions shown. |
| **Shortlist** | When a second option is worth weighing, the alternative and its trade-off. |
| **System map** | When a problem holds several jobs (say, screening applications and scheduling interviews), each gets its own design, joined by the handoffs between them, with every point where a person steps in. |
| **Exports** | Editable draw.io diagrams, with every step's details, for one design or a whole system. |

## How it decides

Blueprint pairs an AI that makes judgement calls with a set of rules that keep it honest.

- **The AI decides.** A model makes the main choices for the task, weighing output quality, cost and efficiency. It works from the owner's answers, up to 22 knowledge-base chunks, real cost data, and what the guide's rules would choose, which it treats as expert input rather than an instruction.
- **The rules set the limits.** 94 rules, each an "if this, then that" with a cited source or a labelled design choice, define what's allowed. The AI can't pick a provider that isn't available where you operate, put data where it mustn't go, give the system more autonomy than your risks allow, or recommend something the guide can't build. A decision that breaks a limit is sent back once; after that, the rules' recommendation stands.
- **Every step is checked.** The AI's design, its starter-kit text and its tailored workflow each pass their own checks: every safeguard kept word for word, a well-formed flow, citations only to research it was given, and a kit that builds. Obvious slips are corrected; anything that weakens the design is rejected.
- **You can see the difference.** The result says where the AI departs from the rules, every reason cites its research, and "Compare with the rules" shows the rules' version in one click.

## The knowledge base

The research behind every choice lives in `knowledge/`: **55 chunks across 13 topics**, from when to use an agent and how multi-agent systems fail, to model choice and cost, autonomy and human oversight, guardrails and prompt injection, data residency, and engineering guides for n8n, Airflow, Hermes and LangGraph. They draw on **124 registered sources**, each graded (peer-reviewed research, preprints, official documentation, practitioner writing, course notes) and dated when read. Rules, model picks and AI reasons all cite chunks, and the tests check that every citation exists.

## Built to be trusted

- **Honest about evidence.** Estimates are ranges with their assumptions; the guide's own judgement calls are labelled as such; benchmark reports say what they don't prove.
- **Safe by default.** Required human approvals, autonomy caps and stop rules are carried through the design, the kit and the workflow, and the delivery contract asks builders for honest READY, DEMO ONLY or BLOCKED reports.
- **Fails gracefully.** If an AI step can't pass its checks, the rules' version is shown instead, and the page says so.
- **Two versions.** The local version uses AI as described above. The published site has no AI at all: it decides by the rules alone, sends nothing anywhere, and keeps answers inside the share link.

## Under the hood

- **Front end:** React 19, Vite, Tailwind CSS 4 and Motion; a hash router, so it runs on any static host.
- **AI layer (local):** Vite middleware serving `/api/split`, `/api/interview`, `/api/decide`, `/api/design`, `/api/kit` and `/api/tailor`, with a shared cache so repeat questions cost nothing.
- **Core logic (`src/lib/`):** the questions, the rules engine, decision and design checks, the blueprint builder, model picks, cost estimates, starter kits, processes and exports.
- **Quality:** 259 tests across 25 files, type checking and a production build on every change, plus `npm run eval:guide` (24 synthetic and 7 source-backed business cases), and local benchmarks comparing n8n with Airflow and n8n with LangGraph.

```bash
npm install
npm run dev
```

AI features need `ANTHROPIC_API_KEY` in `.env`; without it, Blueprint runs on its rules alone. Each step answers first on Claude Haiku 5.5 (tailoring starts on Claude Sonnet 5.5) and retries once on Sonnet when the answer fails its checks. An optional `OPENAI_API_KEY` adds recognising earlier tasks by meaning.

## Where it's going

The live list of what's open is in [open-items.md](open-items.md): a firm rule for checking sensitive work, designs that keep the decided shape, an evaluation mode that scores the AI's decisions against the rules, plainer requirement options, and more.
