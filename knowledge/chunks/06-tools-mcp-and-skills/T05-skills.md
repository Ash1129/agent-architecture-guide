---
id: T05
title: Skills - reusable playbooks loaded only when needed
topic: tools
sources: [anthropic-2025-agent-skills, anthropic-docs-agent-skills, anthropic-docs-skill-best-practices, anthropic-2025-code-execution-mcp]
last_verified: 2026-10-05
---

## Claims

- A **Skill** is a folder with a `SKILL.md` file of instructions, plus
  optional scripts and reference files, that an agent loads when a task calls
  for it. Anthropic likens it to an onboarding guide for a new hire.
  Anthropic published Skills as an open standard on 2025-12-18.
  [anthropic-2025-agent-skills intro and update note]
- Unlike a prompt, which is for one conversation, a Skill loads on demand,
  so the same guidance doesn't have to be repeated.
  [anthropic-docs-agent-skills §Why use Skills]
- **Progressive disclosure** is the core design [anthropic-docs-agent-skills §How Skills work, table]:

  | Level | When loaded | Cost |
  | --- | --- | --- |
  | Name and description | Always | about 100 tokens per Skill |
  | SKILL.md instructions | When the task matches | under 5,000 tokens |
  | Extra files and scripts | Only when used | nothing until read; scripts add only their output |

  So many Skills can be installed with little cost, and bundled reference
  material is effectively unlimited.
- The description decides when a Skill is used: it must say what the Skill
  does and when to use it (name up to 64 characters, description up to 1,024).
  [anthropic-docs-agent-skills §Level 1; §Skill structure]
- Skills can include **scripts** the agent runs, which are cheaper than
  generating code and give deterministic, repeatable results.
  [anthropic-2025-agent-skills §Skills and code execution]
- Where they work, and how they are shared [anthropic-docs-agent-skills §Where Skills work; §Limitations and constraints]:
  - **claude.ai:** uploaded per user on Pro, Max, Team and Enterprise
    plans; not shared organisation-wide and not centrally managed by admins
  - **Claude API:** shared across the workspace; runs in a sandbox with no
    network access and no package installs
  - **Claude Code:** files in a personal or project folder, shareable
    through plugins; full network access
  - custom Skills do not sync between these surfaces
- Skills are not covered by zero-data-retention arrangements.
  [anthropic-docs-agent-skills §Data retention]
- **Security.** A malicious Skill can direct the agent to misuse tools, run
  code or leak data. Use Skills only from trusted sources; audit every file,
  especially network calls and external URLs. Treat installing one like
  installing software. [anthropic-docs-agent-skills §Security considerations]
- **Authoring advice** [anthropic-docs-skill-best-practices]:
  - keep it concise; assume the model is already capable (§Concise is key)
  - give exact steps for fragile tasks and freedom for open ones
    (§Set appropriate degrees of freedom)
  - test with every model you plan to use, since a smaller model may need
    more detail (§Test with all models you plan to use)
  - write at least three test scenarios and measure a baseline before writing
    the Skill (§Build evaluations first)
  - keep SKILL.md under 500 lines
- Skills and MCP complement each other: a Skill can teach the workflow that
  uses MCP tools, and an agent can save working code as a Skill for reuse.
  [anthropic-2025-agent-skills §The future of Skills; anthropic-2025-code-execution-mcp §State persistence and skills]

## Where sources disagree

- On trust, the engineering post says to install Skills from "trusted
  sources" and audit others; the docs narrow trusted to Skills you wrote or
  got from Anthropic. The guide should use the stricter version.

## What this means for the guide

- Recommend a Skill when there is a repeatable playbook (steps, templates,
  house rules) or when the AI needs to know which connected tools to use
  for a task.
- **Discrepancy in the site (fixed 2026-10-05):** gotcha G9 said "a Skill can't use tools by
  itself". That is only partly true. A Skill can bundle scripts that run,
  and in Claude Code they have network access. What a Skill can't do is
  reach your business software without access being set up (a connector
  or credentials). Reword to: "A Skill says what to do; it still needs a
  connector or access to your systems to do it."
- For teams on claude.ai, warn that custom Skills are per person and not
  centrally managed, so each person must install and update them.
- Skills from outside the business are a supply-chain risk; vet them.
