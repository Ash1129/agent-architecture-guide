---
id: H02
title: Hermes memory and skill changes need review
topic: hermes-engineering
sources: [hermes-2026-memory, hermes-2026-skills]
last_verified: 2026-10-10
---

## Claims

- Built-in memory uses `MEMORY.md` and `USER.md`, loaded as a frozen snapshot
  into the session's system context. The memory tool manages durable entries.
  [hermes-2026-memory §How It Works]
- `memory.write_approval` defaults to false. Enabling it gates foreground and
  background-review saves. Interactive CLI foreground writes prompt inline;
  other contexts stage changes for `/memory pending` review.
  [hermes-2026-memory §Controlling memory writes]
- `skills.write_approval: true` stages `skill_manage` writes, including edits,
  deletions and supporting-file changes, for review. Pending changes survive
  restarts. `/skills diff <id>` shows the proposed patch, followed by approval
  or rejection. [hermes-2026-skills §Controlling skill writes]
- `skills.guard_agent_created` is a scanner, not an approval gate. Enabling it
  does not replace `skills.write_approval`.
  [hermes-2026-skills §Controlling skill writes]

## What this means for the guide

Treat durable learning as a change to future behavior, with an owner and a
reviewable record. The rules below are guide recommendations; they do not mean
Hermes automatically validates every saved fact or learned procedure.

- Enable both write-approval settings when introducing self-improvement into a
  business workflow. Review the memory entry or complete skill diff, including
  scripts and supporting files. A notification that learning occurred is not
  evidence that its content was approved or correct.
- Save stable preferences and verified operating facts with provenance and a
  review date. Keep transient task status, credentials, customer records and
  full tool dumps out of general memory. Distinguish observed facts from an
  agent's inference; one successful run does not establish a universal rule.
- Write skills as explicit procedures: prerequisites, input schema, permission
  boundary, steps, output schema, failure handling and completion evidence.
  Describe when the skill should stop and request an operator decision. Do not
  hide authorization changes inside an efficiency improvement.
- Promote a learned skill only after fixture-based evaluation. Include a normal
  case, missing inputs, malicious source content and unavailable dependencies.
  Test that the proposed revision preserves required approval and data limits.
  Compare outputs and actual effects with the previously approved revision.
- Keep approved skills in version control and retain a known-good revision.
  Review deletions as carefully as additions. If a regression appears, disable
  the affected procedure, restore the reviewed version and evaluate again before
  resuming scheduled work. Record which revision produced each business result.
- Test persistence across a fresh session rather than assuming a memory edit
  immediately rewrites the current context. Exercise both interactive and
  background review paths, including rejected and pending changes. Confirm the
  next session sees only the intended durable state and does not acquire an
  unsupported instruction from a retrieved source.

## Source links

- [hermes-2026-memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)
- [hermes-2026-skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/)
