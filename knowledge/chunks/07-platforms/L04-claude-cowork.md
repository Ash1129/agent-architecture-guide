---
id: L04
title: Claude Cowork - Claude as an agent for knowledge work
topic: platforms
sources: [anthropic-help-cowork, anthropic-help-cowork-scheduled, anthropic-help-cowork-team, pabani-2026-openclaw-hermes-cowork, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- Cowork uses the same agentic architecture as Claude Code, without a
  terminal: Claude takes a multi-step task, plans it, can split it among
  sub-agents, and delivers finished files.
  [anthropic-help-cowork §What is Claude Cowork?; §How Claude Cowork runs your tasks]
- **Plans and surfaces.** Paid plans only (Pro, Max, Team, Enterprise), on
  the desktop app for macOS and Windows, and on web and mobile for Pro, Max
  and Team (Enterprise where an admin enables it). [anthropic-help-cowork §Availability]
- **It now runs in the cloud** (beta): work happens in an isolated
  environment on Anthropic's servers and continues when the laptop is
  closed. Local files, the browser and computer use still need the desktop
  app open and connected. From 2026-10-06, new Pro and Max tasks run in the
  cloud and the "only on your computer" option is removed.
  [anthropic-help-cowork §How Claude Cowork runs your tasks; §Requirements; heads-up note]
- Anthropic is merging chat and Cowork into "one Claude" for Pro and Max
  plans; Team and Enterprise keep them separate for now.
  [anthropic-help-cowork note; anthropic-help-cowork-team note]
- **Scheduled tasks run in the cloud**, so they run "even when your computer
  is asleep or the Claude Desktop app is closed". Cadence options are
  hourly, daily, weekly, weekdays or manual. A task that needs local files
  or apps only runs locally. [anthropic-help-cowork-scheduled §How scheduled tasks work; §Set up manually]
- **Memory.** In cloud sessions Claude starts from what it remembers from the
  user's chats, and Cowork tasks feed back into chat memory. Projects add
  their own files, instructions and memory.
  [anthropic-help-cowork §Key capabilities, Shared memory with chat; Projects]
- **Three permission modes** [anthropic-help-cowork §Choose how Claude checks with you]:
  - **Manual:** asks before each action
  - **Auto:** a safety check reviews each action and blocks unsafe ones;
    uses more of the usage limit
  - **Skip:** no checks; only for fully trusted tasks

  Anthropic advises staying close, or using Manual, for work involving
  money, messages sent as you, or important files. Deleting files always
  needs explicit permission. (§What to expect during a task)
- **Admin and compliance (Team and Enterprise)** [anthropic-help-cowork-team]:
  - owners can turn Cowork, cloud sessions, the browser and Auto mode on or
    off; by default, write-capable connector tools need approval per task
    (§Admin controls)
  - activity can be streamed to security tools via OpenTelemetry, and
    sessions are captured in the Compliance API (§Monitoring)
  - local sessions store history on the user's computer, which admins cannot
    centrally manage or delete
  - under the HIPAA configuration, cloud sessions are unavailable
    (§Security, compliance, and monitoring)
  - prompt-injection risk is "non-zero"; users should avoid giving access
    to sensitive files and limit web access to trusted sources (§Prompt injection risks)
- Current limits: sessions can't be shared with others.
  [anthropic-help-cowork §Current limitations]
- **Team notes.** Cowork is for work done without you at the computer, such
  as scheduled tasks. Don't confuse it with the standard desktop chat, where
  everything starts from a prompt. The notes give Cowork as an agent example,
  because it can act and reason repeatedly on its own.
  [team-2026-assignment4 §Claude Cowork, p. 1; §Do they need an agent?, p. 3]

## Where sources disagree

- **Scheduling and memory have changed since Pabani's comparison.** Pabani
  (April 2026) described Cowork's scheduled tasks as running only while the
  computer is awake and the app open, and its memory as project-scoped.
  Anthropic's help centre (read 2026-10-05) says scheduled tasks now run in
  the cloud with no device online, and cloud sessions share memory with
  chat. The help centre is the primary and newer source; Pabani's points
  are out of date. [pabani-2026-openclaw-hermes-cowork, read earlier on 2026-10-05; the site was blocked in the session that wrote this chunk, so its section headings were not re-checked; anthropic-help-cowork-scheduled]

- **Team observation (2026-10-05):** on the team's own account, chat and
  Cowork are still separate. The help centre describes the merge as rolling
  out gradually to Pro and Max, and Team and Enterprise keep them separate,
  so the guide treats them as separate for now.
- The team notes don't say whether the computer must stay on. The help
  centre says cloud scheduled tasks run without it, unless the task needs
  local files or apps. That matches site gotcha G7.
  [team-2026-assignment4 §Claude Cowork, p. 1; anthropic-help-cowork-scheduled]

## What this means for the guide

- Cowork fits a person or small team who wants an agent for documents,
  research and recurring briefings, with no setup beyond a paid plan.
- **Discrepancies in the site** (catalog and G13 fixed 2026-10-05):
  - the catalog says Cowork is "in the desktop app"; it now runs on web and
    mobile too, in the cloud
  - gotcha G7 ("Cowork isn't the regular chat") still holds while chat and
    Cowork are separate; revisit if the merge reaches the team's plan
  - gotcha G13 ("Claude forgets between conversations") is not true for
    Cowork cloud sessions, which share memory with chat
- For business use, recommend Manual mode at first and Auto only after a
  trial period (A04), with Skip never used for tasks that send messages
  or move money.
- Regulated (HIPAA) businesses must use local sessions, and should know that
  local history is outside central control.
