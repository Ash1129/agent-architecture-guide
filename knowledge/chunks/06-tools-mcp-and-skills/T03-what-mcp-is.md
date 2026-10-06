---
id: T03
title: What MCP is, and when it is the right connector
topic: tools
sources: [mcp-2026-spec, mcp-2026-docs, anthropic-2025-code-execution-mcp, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- The **Model Context Protocol (MCP)** is an open standard for connecting AI
  applications to outside systems: data sources, tools and workflows. Its own
  docs compare it to a USB-C port for AI applications.
  [mcp-2026-docs §What is MCP?]
- It is supported by Claude, ChatGPT, Visual Studio Code, Cursor and others,
  so a connector built once can work in many AI applications.
  [mcp-2026-docs §Broad ecosystem support]
- Three roles [mcp-2026-spec §Overview; §Architecture]:
  - the **host** is the AI application (it holds the conversation and
    enforces consent)
  - a **client** inside the host talks to exactly one server
  - a **server** offers capabilities, and can run on the user's machine or
    as a remote service
- A server offers three kinds of thing, controlled by different parties
  [mcp-2026-docs §Server concepts, table "Core Server Features"]:
  - **tools**: actions the model decides to call (send a message, create an
    event); controlled by the model
  - **resources**: read-only data for context (documents, schemas);
    controlled by the application
  - **prompts**: reusable instruction templates; chosen by the user
- By design, servers should not see the whole conversation or "see into"
  other servers; the host keeps the history and controls what crosses over.
  [mcp-2026-spec §Architecture, Design Principles 3]
- **Current version.** The latest spec is dated 2026-07-28. It made the
  protocol stateless (each request carries its own version and
  capabilities), moved long-running "tasks" into an optional extension, and
  deprecated the Roots, Sampling and Logging features. Optional extensions
  now include Tasks, "Skills over MCP" and MCP Apps (interactive UI in the
  chat). [mcp-2026-spec §Key Changes; §Overview, Extensions]
- **Scale problem.** Anthropic: most MCP clients load every tool definition
  into context up front, and every intermediate result passes through the
  model. With thousands of tools, that means hundreds of thousands of tokens
  before the request is read; a 2-hour meeting transcript copied between two
  tools could add about 50,000 tokens.
  [anthropic-2025-code-execution-mcp §Excessive token consumption]
- Letting the agent write code that calls MCP servers, loading only the
  definitions it needs, cut one example from 150,000 to 2,000 tokens (98.7%).
  Data can also be filtered, or personal details masked, before the model
  sees it. The trade-off: agent-written code needs a sandbox, resource limits
  and monitoring. [anthropic-2025-code-execution-mcp §Code execution with MCP improves context efficiency; §Privacy-preserving operations; §State persistence and skills]
- **Team notes.** MCP is how the client inside a host learns which tools
  exist and how to use them. For Claude to do CAD in Fusion, it must connect
  to Fusion's MCP server. [team-2026-assignment4 §MCP, p. 1]
- The notes list MCP among the tools to choose when a task needs other
  programs run. [team-2026-assignment4 §MCP, p. 1]

## Where sources disagree

- No direct disagreement. Anthropic created MCP, and the spec and both
  Anthropic sources are tier C (from the builders). Adoption claims ("de-facto
  standard", "thousands of servers") come from Anthropic and were not checked
  independently.

## What this means for the guide

- Recommend MCP when **the AI itself chooses which tool to call** (an agent,
  or Claude, Cowork or Hermes used directly) and it needs the business's
  software. When the steps are fixed, the workflow tool's own app
  connections are simpler. This matches the site's TL11 and TL12 rules.
- Explain MCP to users as "the connector that lets the AI see and use one
  program", with the three kinds (actions, read-only data, saved prompts).
  Read-only resources are the safer starting point.
- For designs with many connected systems, warn that each connection adds
  cost and confusion (see T02), and that code-based tool calling needs a
  secure sandbox.
- Spec details change: date any protocol-level statement in the site.
