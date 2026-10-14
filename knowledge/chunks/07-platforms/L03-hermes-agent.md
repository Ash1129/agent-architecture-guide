---
id: L03
title: Hermes Agent - an open-source personal agent that learns
topic: platforms
sources: [hermes-2026-repo, kumar-hermes-kb, pabani-2026-openclaw-hermes-cowork, team-2026-assignment4, anthropic-help-cowork, anthropic-docs-claude-code-overview]
last_verified: 2026-10-05
---

## Claims

- Hermes Agent is Nous Research's agent, released under the **MIT licence**
  (a permissive open-source licence). [hermes-2026-repo LICENSE]
- **Any model.** It works with Nous Portal, OpenRouter, OpenAI, a company's
  own endpoint and other providers; switching is one command, which the
  README pitches as "no lock-in". [hermes-2026-repo README intro]
- **Runs anywhere.** Seven terminal backends: local, Docker, SSH,
  Singularity, Modal, Daytona and Vercel Sandbox. The README says it can run
  on "a $5 VPS" or a GPU cluster, and that serverless backends cost
  "nearly nothing" when idle. Users talk to it through a terminal UI or
  through Telegram, Discord, Slack, WhatsApp, Signal or email.
  [hermes-2026-repo README feature list; §CLI vs Messaging]
- **Learning loop.** It writes and improves its own Skills after complex
  tasks, keeps curated memory, and searches past conversations. Its Skills
  follow the agentskills.io open standard. [hermes-2026-repo README feature list]
- **Memory is small and deliberate**: two files, about 800 tokens of agent
  notes (2,200 characters) and about 500 tokens of user profile (1,375
  characters), loaded at the start of each session. When full, the agent must
  consolidate entries itself. [hermes-2026-repo docs §Persistent Memory, How It Works]
- **Self-written Skills land without review by default.** The agent saves a
  Skill when it works out a repeatable workflow, hits dead ends, or is
  corrected. A `write_approval` setting stages every Skill change for a
  person to approve; the docs suggest it for small models, secure
  environments, or "wanting eyes on the self-improvement loop".
  [hermes-2026-repo docs §Skills System, Agent-Managed Skills; Gating agent skill writes]
- **Command approval.** Dangerous shell commands are checked against a list.
  The default "smart" mode has a second model judge risk: low-risk commands
  run, clearly dangerous ones are refused, uncertain ones go to the user.
  "Manual" always asks; "off" (YOLO) never asks. Scheduled and unattended
  runs deny dangerous commands by default.
  [hermes-2026-repo docs §Security, Approval Modes]
- The security model has eight layers, including user allowlists for chat
  platforms, container isolation, credential filtering for MCP servers and
  prompt-injection scanning of project files. [hermes-2026-repo docs §Security, Overview]
- **Scheduling** is built in: recurring or one-off jobs in plain language,
  with Skills attached, results delivered to a chat, and optional
  webhook triggers. Jobs are run by the gateway process, which checks
  every 60 seconds, so that process has to be running.
  [hermes-2026-repo docs §Scheduled Tasks (Cron), What cron can do now; How it works]
- Pabani (April 2026) also describes Hermes as open-source and
  model-agnostic. [pabani-2026-openclaw-hermes-cowork §What each one actually is]
- **Kumar's summary** (page dated 2026-07-17) [kumar-hermes-kb]:
  - Hermes launched in February 2026 as a self-improving personal agent
    that runs unattended across messaging apps. (§Overview)
  - It creates Skills from experience after complex tasks and refines them
    during later use. It recalls past sessions through full-text search
    with summaries, and models the user with Honcho.
    (§Key Capabilities, Self-Improvement and Learning Loop)
  - It has 40 or more built-in tools, MCP support and the agentskills.io
    Skills standard. It runs anywhere from a $5 VPS to GPU clusters.
    (§Tool Use and MCP Integration; §Architecture)
- **Kumar on security** (§Security Considerations; §Limitations):
  - Hermes carries the "toxic flow trifecta": private data, untrusted
    content and the ability to act outside (G02's lethal trifecta).
  - Suggested mitigations: run it sandboxed in Docker or Daytona, enable
    only the tools needed, give it a dedicated messaging account, and
    review Skills before enabling them.
  - Limitations: it needs broad permissions, Windows support is early beta,
    and third-party Skills carry supply-chain risk.
- **Team notes** [team-2026-assignment4 §Hermes, p. 2]:
  - memory is "persistent everywhere"; in Claude the notes say that needs a
    shared Project or Skills
  - Hermes acts like Cowork but isn't restricted to Anthropic's models
  - it is built to learn and get better at tasks, "which Claude is not"
  - it learns by recognising when to create or edit a Skill (citing Kumar)

## Where sources disagree

- Kumar calls Hermes the "direct successor to OpenClaw". The Hermes README
  offers a migration from OpenClaw, importing settings, memories and Skills,
  but does not call itself a successor. Treat Hermes and OpenClaw as
  separate projects. [kumar-hermes-kb §Overview; hermes-2026-repo README §Migrating from OpenClaw]
- Kumar's comparison table says Claude Code has no cross-session memory.
  L05 records CLAUDE.md and Claude Code's memory of learnings, so the table
  undersells it. [kumar-hermes-kb §Comparison with Related Agents]
- **Memory.** The notes call Hermes' memory "persistent everywhere". The
  repo describes it as persistent but deliberately small (about 1,300
  tokens across two files), with search over past sessions for the rest.
  [team-2026-assignment4 §Hermes, p. 2; hermes-2026-repo docs §Persistent Memory]
- **Claude's memory and learning.** The notes say Claude keeps memory only
  through Projects or Skills and doesn't learn. Anthropic's current docs
  disagree on both:
  - Cowork cloud sessions share memory with chat (L04)
  - Claude Code keeps automatic memory of learnings (L05)

  [team-2026-assignment4 §Hermes, p. 2; anthropic-help-cowork §Key capabilities; anthropic-docs-claude-code-overview §What you can do]

## Not verified

- The Nous Research website (nous-hermes-site) was still blocked on
  2026-10-05. Its landing page is not in the hermes-agent repository, which
  holds only the /docs/ site, so it remains unread.
- Kumar's page was read from its source in the GitHub repository
  ankurkumarz/agentic-ai-knowledge-base (docs/AgentPlatforms/hermes-agent.md,
  last changed 2026-09-13), because agentic-ai.readthedocs.io was blocked.

## What this means for the guide

- Hermes fits a business that wants an always-on agent it controls, on any
  model (including open-weight ones, M03), reachable from chat apps.
- Its trade-off is ownership: someone must host it, update it and keep the
  gateway running (site gotcha G14 is consistent with the sources).
- The guide should tell users to turn on `write_approval` for Skills in
  business use, and to keep approvals on "manual" or "smart", never "off".
  This matches the staged-autonomy advice in A04.
- Kumar's mitigations match the guide's advice: a sandbox, only the tools
  needed, and Skill review (G14). Add "a dedicated account for chat apps"
  when Hermes is connected to messaging.
