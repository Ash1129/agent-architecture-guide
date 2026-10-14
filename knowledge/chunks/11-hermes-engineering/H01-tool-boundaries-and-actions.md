---
id: H01
title: Hermes tool boundaries and safe external actions
topic: hermes-engineering
sources: [hermes-2026-security, hermes-2026-mcp, hermes-2026-profiles]
last_verified: 2026-10-10
---

## Claims

- Command approval has smart, manual and off modes. Smart uses an auxiliary
  model to assess risk; manual prompts for dangerous commands, not every action.
  Cron, single-query and other unattended contexts have separate approval
  settings that default to deny. [hermes-2026-security §Dangerous Command Approval]
- MCP servers can be disabled individually. Per-server `tools.include` accepts
  exact names or globs; `tools.exclude` removes matching tools. If both are set,
  include takes precedence. Resource and prompt exposure can also be configured.
  [hermes-2026-mcp §Per-server tool filtering]
- A profile has a separate Hermes home containing configuration, memory, skills,
  sessions and cron state. Cloning can copy tool API keys and curated memory;
  separate profiles do not imply separate downstream accounts.
  [hermes-2026-profiles §What are profiles?; §Clone config only]

## What this means for the guide

These are engineering recommendations derived from the documented controls.
They must be implemented and tested for the deployed Hermes version; a persona
or skill instruction is not proof that an action is technically restricted.

- Define an action contract for each connected system: allowed operations,
  destinations, data fields, approver, maximum scope and evidence of completion.
  Separate reading, preparing a change and committing it. For consequential
  writes, present the exact target and payload before approval and bind approval
  to that version of the request.
- Prefer explicit MCP tool includes over broad wildcards. Give each service
  credential the smallest useful permissions. Inspect the actual registered
  tools and verify that an unlisted mutation cannot be invoked. Do not interpret
  shell-command approval as a universal approval mechanism for MCP writes,
  messaging or API calls; enforce those boundaries at the connector or service.
- Treat retrieved pages, messages and tool output as untrusted input. Validate
  identifiers and destinations against the original task before acting. Do not
  let a document's instructions expand the agent's tool or credential scope.
- Use a dedicated profile and test credentials for validation. Inspect cloned
  configuration before starting it. Choose filesystem and network restrictions
  separately; a profile directory is state organization, not an operating-system
  sandbox. Never put production secrets in exported skills or fixtures.
- Record a stable business operation ID before a write. Where supported, send
  the destination's idempotency key. After a timeout, query the destination for
  the result before replaying. A local conversation record cannot establish
  whether the remote service committed the operation.
- Acceptance cases: unauthorized tool, redirected destination, stale approval,
  expired credential, injected tool output, and a timeout after remote commit.
  Verify both the returned result and the destination's audit record. A denied
  or uncertain action should remain visible as such rather than become a claimed
  success in the final response.

## Source links

- [hermes-2026-security](https://hermes-agent.nousresearch.com/docs/user-guide/security/)
- [hermes-2026-mcp](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp/)
- [hermes-2026-profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles/)
