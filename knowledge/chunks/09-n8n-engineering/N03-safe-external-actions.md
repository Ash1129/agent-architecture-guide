---
id: N03
title: n8n safe external actions, approval and duplicate prevention
topic: n8n-engineering
sources: [n8n-2026-webhook, n8n-2026-human-review, n8n-2026-credentials, stripe-2026-idempotency]
last_verified: 2026-10-10
---

## Claims

- Webhook has separate test and production URLs. Supported authentication
  includes Basic, Header and JWT; None is also available. An IP allowlist is
  optional. An immediate response acknowledges workflow start, while other
  response modes can wait for results. [n8n-2026-webhook §Webhook URLs;
  §Supported authentication methods; §Respond; §Node options]
- Human review can gate individual AI Agent tools. A reviewer sees the proposed
  tool and parameters; approval permits execution and denial cancels the action.
  The system prompt should explain the review setup and how to handle denial.
  [n8n-2026-human-review §How it works; §Using expressions in human review tools; §System prompt best practices]
- n8n credentials store authentication information used by integrations with
  external services. [n8n-2026-credentials §Create and edit credentials]
- Stripe demonstrates destination-enforced idempotency: callers reuse a key to
  retry an operation safely. API v1 retains the original response, including
  failures after execution starts; parameter changes can be rejected, and keys
  can expire. API v2 has different retry semantics. These are Stripe guarantees,
  not generic n8n guarantees. [stripe-2026-idempotency §Idempotent requests]

## What this means for the guide

- Separate preparing a proposed action from executing it. Validate the target,
  record identifier and payload using deterministic checks; let an agent make
  judgments only where needed. Gate consequential tools with the chosen approval
  policy before execution, not merely approval of the agent's final response.
- Show the reviewer the actual recipient, action and meaningful parameters.
  A denial must not fall through to an alternative ungated write. Test both
  approval and denial. A generic Wait node in a scaffold is not proof that this
  authorization boundary has been implemented.
- Require suitable webhook authentication and use credential references rather
  than embedding secrets in workflow JSON, prompts or sample records. Distinguish
  receipt of an event from completion of its requested action; report completion
  only when there is evidence from the destination.
- Before enabling retries on sends, purchases or record creation, document the
  destination's duplicate-prevention contract. If it supports idempotency keys,
  persist one for the logical action and reuse it for retries with the same
  payload. Keep different actions distinct. A new execution ID on each replay
  does not identify the same business operation.
- If the destination has no documented replay guarantee, investigate an ambiguous
  timeout before repeating the action. Do not claim that a preliminary lookup
  followed by a write provides exactly-once behavior; that stronger guarantee
  requires a verified concurrency mechanism beyond these sources. Route unresolved
  outcomes to reconciliation or a person.
- Acceptance examples: duplicate event, replay after a lost response, concurrent
  submissions, changed payload, approval denied and invalid webhook credentials.
  Check the destination for duplicate effects. These are design tests to implement,
  not capabilities automatically added by reading this chapter.

## Source links

- [n8n-2026-webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook)
- [n8n-2026-human-review](https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools.md)
- [n8n-2026-credentials](https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials.md)
- [stripe-2026-idempotency](https://docs.stripe.com/api/idempotent_requests)
