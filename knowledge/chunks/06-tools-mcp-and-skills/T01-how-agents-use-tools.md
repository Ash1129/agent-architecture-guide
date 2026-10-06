---
id: T01
title: How an agent uses tools, and what tools cost
topic: tools
sources: [anthropic-docs-tool-use, anthropic-2025-writing-tools, anthropic-2025-context-engineering, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- A **tool** is something the model can ask to have run: a lookup, a
  calculation, an action in another system. Anthropic sorts Claude's tools by
  where the code runs [anthropic-docs-tool-use §How tool use works]:
  - **client tools** run in your own application. The model replies with a
    request to call the tool; your code runs it and sends back the result.
    This includes tools you define yourself and tools whose format Anthropic
    publishes (bash, text editor, memory, computer use, browser use).
  - **server tools** run on Anthropic's side (web search, web fetch, code
    execution, tool search, the MCP connector), so no handler code is needed.
- By default the model decides each turn whether to call a tool or answer
  directly. It calls one when the request matches a tool's described purpose
  and the answer isn't already in context. This boundary can be steered with
  the system prompt, or a tool call can be forced with the `tool_choice`
  setting. [anthropic-docs-tool-use §When Claude uses tools]
- When a required detail is missing, more capable models are more likely to
  ask for it; Sonnet "might also infer a reasonable value", i.e. guess.
  [anthropic-docs-tool-use §When Claude uses tools, "When required parameters are missing"]
- Tools cost tokens even when unused. Every request pays for the tool names,
  descriptions and schemas, plus the tool calls and results, plus a fixed tool
  system prompt (286 tokens for Opus 5.5 and Sonnet 5.5 with automatic tool
  choice). Some server tools add usage charges, such as per web search.
  [anthropic-docs-tool-use §Pricing]
- Anthropic describes tools as a contract between deterministic software and
  a non-deterministic agent: given the same question, an agent may call the
  tool, answer from memory, ask a clarifying question, or misuse the tool.
  Tools should therefore be designed for agents, not written the way one
  would write an API for other programs.
  [anthropic-2025-writing-tools §What is a tool?]
- Anthropic now defines an agent simply as an LLM "autonomously using tools in
  a loop". [anthropic-2025-context-engineering §Context retrieval and agentic search]
- **Team notes.** In Claude's chat app, the model itself decides whether
  to use tools or just answer. Its tool steps show up as "ran a command" and
  "thinking about how to" before the final reply. [team-2026-assignment4 §Do they need an agent?, p. 3]

## What this means for the guide

- In plain words for the user: a tool is one specific thing the AI is allowed
  to do in your systems. Without tools, an AI can only talk about your
  systems.
- Each tool is also a cost and a choice point. The guide should recommend the
  fewest tools that cover the task (see T02) and name which ones only read
  and which ones change things (see G01 for risk ratings).
- Where a missing detail would cause a wrong action (an amount, a recipient),
  the design should require the AI to ask rather than guess. Pick a more
  capable model or force a confirmation step for those actions.
- The team notes back site gotcha G8 (check what it actually did): look for
  tool steps in the reply before assuming Claude checked anything.
