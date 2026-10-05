---
id: L03
title: Hermes Agent - an open-source personal agent that learns
topic: platforms
sources: [hermes-2026-repo, pabani-2026-openclaw-hermes-cowork]
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

## Not verified

- The Nous Research website (nous-hermes-site) and Kumar's knowledge-base
  page were blocked from this environment; the claims above come from the
  project's own GitHub repository, read on 2026-10-05.

## What this means for the guide

- Hermes fits a business that wants an always-on agent it controls, on any
  model (including open-weight ones, M03), reachable from chat apps.
- Its trade-off is ownership: someone must host it, update it and keep the
  gateway running (site gotcha G14 is consistent with the sources).
- The guide should tell users to turn on `write_approval` for Skills in
  business use, and to keep approvals on "manual" or "smart", never "off".
  This matches the staged-autonomy advice in A04.
