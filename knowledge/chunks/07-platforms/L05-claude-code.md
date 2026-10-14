---
id: L05
title: Claude Code - the agent harness for software work
topic: platforms
sources: [anthropic-docs-claude-code-overview, anthropic-help-cowork]
last_verified: 2026-10-05
---

## Claims

- Claude Code is Anthropic's agentic coding tool: it reads a codebase,
  edits files, runs commands and works with development tools. It runs in
  the terminal, VS Code and JetBrains IDEs, a desktop app, and the browser.
  Most surfaces need a Claude subscription or an Anthropic Console account;
  the terminal and IDE versions also work with third-party model providers.
  [anthropic-docs-claude-code-overview intro; §Get started]
- What it can be given [anthropic-docs-claude-code-overview §What you can do]:
  - **CLAUDE.md**: a project file of standing instructions read at the
    start of every session (it can also read `AGENTS.md`); plus automatic
    memory of learnings
  - **Skills** for repeatable team workflows
  - **Hooks**: shell commands that run before or after its actions, such as
    formatting or linting
  - **MCP servers** for outside tools (Google Drive, Jira, Slack, custom)
  - **sub-agents** coordinated by a lead agent, and parallel background
    sessions
- **Scheduling** [anthropic-docs-claude-code-overview §What you can do]:
  - **Routines** run in the cloud, even with the computer off, and can be
    triggered by API calls or GitHub events
  - **Desktop scheduled tasks** run on the user's machine with access to
    local files
- It can run in CI (GitHub Actions, GitLab CI/CD) for code review and issue
  triage, and the **Agent SDK** lets developers build their own agents on
  Claude Code's tools with full control of orchestration, tool access and
  permissions. [anthropic-docs-claude-code-overview §What you can do; §Use Claude Code everywhere]
- Cowork is built on the same agentic architecture, for non-coding work.
  [anthropic-help-cowork §What is Claude Cowork?]

## What this means for the guide

- Recommend Claude Code when the work produces or changes code, or when a
  technical team wants to build a custom agent (via the Agent SDK) rather
  than use a finished app.
- For non-technical users with the same need for an agent, Cowork is the
  closer fit.
- CLAUDE.md, Skills, hooks and MCP map onto the guide's parts: standing
  instructions (T06), playbooks (T05), hard rules enforced outside the model
  (G01), and connectors (T03).
