---
id: A01
title: Autonomy is a design choice, and risk rises with it
topic: autonomy
sources: [feng-2025-levels-of-autonomy, mitchell-2025-fully-autonomous, anthropic-2025-trustworthy-agents]
last_verified: 2026-10-05
---

## Claims

- Feng, McDonald and Zhang (University of Washington) argue that an agent's
  autonomy is a **deliberate design decision**, separate from how capable it
  is. A highly capable agent can still be built to check with its user
  before every action. [feng-2025-levels-of-autonomy abstract; §1]
- They define five levels by the role the user plays
  [feng-2025-levels-of-autonomy Figure 1; §3.1–3.5]:
  1. **Operator:** the user directs and decides; the agent acts.
  2. **Collaborator:** user and agent plan, delegate and execute together.
  3. **Consultant:** the agent leads but consults the user for expertise and
     preferences.
  4. **Approver:** the agent involves the user only for blockers it cannot
     resolve, such as a failure, credentials it wasn't given, or signing off
     consequential actions. The user can say up front which actions need
     approval.
  5. **Observer:** the agent runs fully on its own. The user can only watch
     activity logs and use an emergency off-switch.
- Their summary: more autonomy does not simply mean a better agent; each step
  trades off utility, efficiency, accountability and cost.
  [feng-2025-levels-of-autonomy §3.6]
- Mitchell et al. (Hugging Face) argue that **risks to people rise with
  autonomy**: the more control a user hands over, the more can go wrong.
  They argue fully autonomous agents should not be built, and that
  semi-autonomous systems which keep some human control have a better
  balance of risk and benefit. Among the risks they highlight are safety,
  privacy, security and misplaced trust. [mitchell-2025-fully-autonomous abstract; §1]
- Anthropic names the central tension: an agent's value comes from working
  independently, yet people should keep control over how goals are pursued,
  especially before high-stakes decisions. Its example is an
  expense-management agent that finds overspending on software, which should
  get approval before cancelling subscriptions.
  [anthropic-2025-trustworthy-agents §Keeping humans in control while enabling agent autonomy]
- Anthropic's own product follows this. Claude Code can read and analyse
  freely, but asks before changing code or systems. Users can stop it at any
  time, and can grant standing permission for routine tasks they trust it
  with. [anthropic-2025-trustworthy-agents §Keeping humans in control while enabling agent autonomy]

## How the guide's four levels map

| Guide level | Closest Feng et al. level | Note |
| --- | --- | --- |
| 1 Assist | L1 Operator / L2 Collaborator | The person does the work; the AI drafts. |
| 2 Approve every output | between L3 Consultant and L4 Approver | Every result is a sign-off point. |
| 3 Approve the risky ones | L4 Approver | Matches Feng's "specify which actions require approval". |
| 4 Runs within guardrails | between L4 and L5 | Unlike L5, the guide keeps sampling, exceptions and a stop. |

The guide deliberately has no equivalent of L5 (observer only), consistent
with Mitchell et al.

## What this means for the guide

- Present autonomy as **the owner's choice, made per action type**, not as a
  property of the AI. "How much can it do without asking?" is a design
  setting.
- Never recommend full autonomy with no means to intervene. Every level the
  guide offers keeps at least a stop control and review of exceptions.
