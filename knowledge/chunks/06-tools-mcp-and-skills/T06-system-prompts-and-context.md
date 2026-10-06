---
id: T06
title: System prompts and managing what the agent sees
topic: tools
sources: [anthropic-2025-context-engineering, anthropic-docs-prompting-best-practices, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- A **system prompt** is the standing instruction the model reads before
  every task. Setting a role there focuses behaviour and tone; "even a single
  sentence makes a difference". [anthropic-docs-prompting-best-practices §Give Claude a role]
- Write it like a brief for "a brilliant but new employee" who lacks your
  context; if a colleague would be confused by it, the model will be too.
  [anthropic-docs-prompting-best-practices §Be clear and direct]
- Explain **why** a rule exists; the model generalises from the reason.
  [anthropic-docs-prompting-best-practices §Add context to improve performance]
- Use 3–5 relevant, varied examples, marked off from the instructions.
  [anthropic-docs-prompting-best-practices §Use examples effectively]
- **The right altitude.** Anthropic warns against two failure modes
  [anthropic-2025-context-engineering §The anatomy of effective context]:
  - hard-coding brittle if-else logic in the prompt
  - vague guidance that assumes shared context

  Aim for the minimal set of information that fully describes the expected
  behaviour (minimal is not the same as short). Start with a minimal prompt on
  the best model and add instructions as failures appear.
- Don't stuff a "laundry list" of edge cases into the prompt; use a few
  canonical examples instead. [anthropic-2025-context-engineering §The anatomy of effective context]
- The prompting docs give sample text for asking the model to **confirm
  before risky actions**: those that are hard to reverse, affect shared
  systems, are destructive, or are visible to others (such as sending
  messages). [anthropic-docs-prompting-best-practices §Balancing autonomy and safety]
- **Context is finite.** As the amount of text in the context window grows,
  the model's ability to recall information from it decreases ("context
  rot"). This happens in all models, to differing degrees.
  [anthropic-2025-context-engineering §Why context engineering is important]
- Three techniques for long tasks [anthropic-2025-context-engineering §Context engineering for long-horizon tasks]:
  - **compaction:** summarise the conversation and continue from the summary
  - **structured notes:** the agent keeps notes outside the context window
  - **sub-agents:** each works in a clean context and returns a short summary,
    often 1,000–2,000 tokens

  Compaction suits long back-and-forth; notes suit work with clear milestones;
  sub-agents suit research where parallel exploration pays off.
- Agents can look things up "just in time" with tools instead of loading
  everything up front; this is slower but avoids stale or irrelevant
  context. A hybrid (some context up front, the rest on demand) may suit
  less dynamic work such as legal or finance.
  [anthropic-2025-context-engineering §Context retrieval and agentic search]
- **Team notes.** A system prompt sets the context for the model or agents:
  universal truths, not specific to a tool, task or call. With several
  agents, each can have its own system prompt. [team-2026-assignment4 §System Prompts, p. 1; §One or multiple, p. 3]

## Where sources disagree

- Formatting: the prompting docs recommend XML tags to separate parts of a
  prompt [anthropic-docs-prompting-best-practices §Structure prompts with XML tags],
  while the context-engineering post says exact formatting is "likely becoming
  less important" as models improve. Both agree clear sections help.
- Emphasis differs. The team notes keep task-specific instructions out of
  the system prompt (they go in Skills). Anthropic's prompting docs put the
  role, goal and reasons for the expected behaviour there. Both agree the
  prompt is the standing context, and that repeatable task playbooks belong
  in a Skill. [team-2026-assignment4 §System Prompts, p. 1; anthropic-docs-prompting-best-practices §Give Claude a role]

## What this means for the guide

- Every design that uses AI needs a system prompt (the site's TL13 rule). The
  guide's template should cover: who the AI works for, its role, the goal,
  the reasons behind key rules, what to do when unsure, and which actions
  need a person's confirmation.
- With several agents, each gets its own short prompt for its role (P03).
- Memory that must last across sessions belongs in notes, a Project or a
  Skill (T05), not in an ever-growing prompt.
- Secrets never go in a system prompt (site gotcha G4; G02 on injection).
