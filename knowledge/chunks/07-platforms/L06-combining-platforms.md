---
id: L06
title: Combining platforms, and choosing between them
topic: platforms
sources: [n8n-docs-mcp-nodes, anthropic-help-cowork, anthropic-help-cowork-scheduled, anthropic-help-cowork-team, anthropic-docs-claude-code-overview, hermes-2026-repo, anthropic-2025-agent-skills, mcp-2026-docs]
last_verified: 2026-10-05
---

## Claims

- **MCP is the common joint.** Claude, ChatGPT, VS Code, Cursor and others
  support MCP, so one connector can serve several platforms.
  [mcp-2026-docs §Broad ecosystem support]
- Each platform in the guide speaks MCP:
  - n8n can call outside MCP servers (MCP Client Tool) and can itself be an
    MCP server, exposing whole workflows as tools to outside agents
    [n8n-docs-mcp-nodes]
  - Claude Code connects to MCP servers [anthropic-docs-claude-code-overview §What you can do]
  - Cowork lets users choose which MCP connectors Claude uses and how often
    they ask permission [anthropic-help-cowork §Permissions and security]
  - Hermes can connect any MCP server [hermes-2026-repo README, Documentation table]
- **Skills travel too.** Anthropic published Agent Skills as an open
  standard (2025-12-18), and Hermes' Skills follow it (agentskills.io).
  [anthropic-2025-agent-skills update note; hermes-2026-repo README feature list]
- **Plugins bundle the pieces.** A Cowork plugin packages Skills, connectors
  and sub-agents; a plugin added to an account works in chat, Cowork and
  Claude Code. Team and Enterprise owners can make plugins required,
  default, optional or hidden for their organisation.
  [anthropic-help-cowork §Claude Cowork plugins; anthropic-help-cowork-team §Manage plugins for your organization]
- **Where scheduled work runs** differs by platform:

  | Platform | Runs scheduled work | Source |
  | --- | --- | --- |
  | Cowork | in Anthropic's cloud; local only if it needs local files or apps | [anthropic-help-cowork-scheduled §How scheduled tasks work] |
  | Claude Code | Routines in the cloud, or desktop tasks on the machine | [anthropic-docs-claude-code-overview §What you can do] |
  | Hermes | in its gateway process, wherever it is hosted | [hermes-2026-repo docs §Scheduled Tasks (Cron), How it works] |
  | n8n, Airflow | on the server running them (L01, L02) | |

## What this means for the guide

- A common hybrid: n8n (or Airflow) handles the dependable, fixed steps and
  triggers; an agent (Claude, Cowork or Hermes) handles the judgement step;
  MCP connects them. n8n's MCP Server Trigger lets the agent call a tested
  n8n workflow as one tool, which keeps the risky actions in fixed code.
- Because MCP connectors and Skills are portable, the guide can present the
  choice of agent platform as reversible to a degree. The model, memory and
  scheduling setup are what tie a business to one platform.
- How to choose, in short (synthesis of L01–L05):
  - fixed steps, visual builder → n8n
  - data pipelines, Python team → Airflow
  - documents, research, briefings, no setup → Cowork
  - code, or a custom-built agent → Claude Code / Agent SDK
  - self-hosted, any model, always-on in chat apps → Hermes
