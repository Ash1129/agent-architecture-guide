---
id: T02
title: Designing tools an agent can use well
topic: tools
sources: [anthropic-2025-writing-tools, anthropic-2025-context-engineering, anthropic-docs-tool-search]
last_verified: 2026-10-05
---

## Claims

- **More tools are not better.** A common mistake is wrapping every existing
  API endpoint as a tool. Build a few tools for high-impact workflows that
  match real tasks, then scale up.
  [anthropic-2025-writing-tools §Choosing the right tools for agents]
- **Consolidate.** One tool can do several steps behind the scenes. Examples
  from Anthropic [anthropic-2025-writing-tools §Choosing the right tools for agents]:
  - a `schedule_event` tool instead of separate list-users, list-events and
    create-event tools
  - a `search_logs` tool instead of `read_logs`
  - a `get_customer_context` tool instead of three separate customer lookups
- **Clear, non-overlapping purposes.** Anthropic calls bloated tool sets one of
  the most common failures: if a human engineer can't say which tool fits a
  situation, the agent can't either.
  [anthropic-2025-context-engineering §The anatomy of effective context]
- **Group related tools by name** (for example `asana_search`, `jira_search`)
  so agents can tell them apart; prefix vs suffix naming had measurable,
  model-dependent effects in Anthropic's tests.
  [anthropic-2025-writing-tools §Namespacing your tools]
- **Return what matters, in words.** Return names and readable fields rather
  than internal IDs. Replacing random IDs with meaningful names
  "significantly" improved Claude's precision in retrieval tasks. A
  "concise" response mode used about a third of the tokens of a "detailed"
  one in Anthropic's Slack example (72 vs 206 tokens).
  [anthropic-2025-writing-tools §Returning meaningful context from your tools]
- **Limit output size.** Use pagination, filtering or truncation with sensible
  defaults; Claude Code caps tool responses at 25,000 tokens by default.
  Error messages should say what to fix, not show raw codes.
  [anthropic-2025-writing-tools §Optimizing tool responses for token efficiency]
- **Write descriptions like onboarding notes for a new hire**, with
  unambiguous parameter names (`user_id`, not `user`). Small description
  changes produced large gains; Anthropic credits precise description fixes
  for a state-of-the-art SWE-bench Verified result.
  [anthropic-2025-writing-tools §Prompt-engineering your tool descriptions]
- **Test with realistic tasks.** Strong test tasks need several tool calls
  and mirror real work; track accuracy, tool calls, tokens and errors, and
  keep a held-out test set to avoid overfitting.
  [anthropic-2025-writing-tools §Running an evaluation; §Collaborating with agents]
- **Large tool libraries.** Anthropic's docs say Claude's tool selection
  degrades once more than 30–50 tools are available, and a typical
  five-server setup can use about 55,000 tokens in definitions. Loading tools
  on demand ("tool search") typically cuts that by over 85%, loading 3–5
  tools per request. [anthropic-docs-tool-search intro]

## Where sources disagree

- None between sources. Note that all figures here are Anthropic's own
  measurements on its own models and tools (tier C), not independent
  results.

## What this means for the guide

- Recommend a small number of task-shaped tools (for example "look up
  customer", "draft reply") rather than "connect everything".
- If a design would expose more than about 30 tools to one agent, the guide
  should suggest splitting the tools, loading them on demand, or splitting
  the work across agents (see P03).
- Testing tools belongs in the first steps, using the same 20–50 real tasks
  recommended in G04.
