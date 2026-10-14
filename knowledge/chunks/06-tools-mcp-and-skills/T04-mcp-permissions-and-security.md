---
id: T04
title: Connecting tools safely - consent, permissions and untrusted servers
topic: tools
sources: [mcp-2026-spec, mcp-2026-docs]
last_verified: 2026-10-05
---

## Claims

- MCP opens paths to arbitrary data access and code execution. The protocol
  cannot enforce security itself; implementers are expected to build consent,
  access control and data protection. [mcp-2026-spec §Security and Trust & Safety]
- The spec's principles [mcp-2026-spec §Security, Key Principles]:
  - users must explicitly consent to, understand and control what data is
    shared and what actions are taken
  - hosts must get consent before exposing user data to a server, or before
    invoking any tool
  - tools amount to arbitrary code execution
  - tool descriptions and "annotations" (such as a read-only flag) must be
    treated as untrusted unless the server is trusted
- On tools specifically, the spec says there SHOULD always be a person able to
  deny a tool call. Applications should show which tools are exposed, show
  when one is invoked, and ask for confirmation. [mcp-2026-spec §Tools, User Interaction Model]
- The MCP docs list ways to keep that control without approving everything
  [mcp-2026-docs §Server concepts, Tools, User Interaction Model]:
  - turn individual tools on or off per interaction
  - approve individual calls
  - pre-approve certain safe operations
  - keep an activity log of all tool calls and results
- Servers MUST validate inputs, enforce access controls, rate-limit calls and
  sanitise outputs. Clients SHOULD confirm sensitive operations, show tool
  inputs before sending (to catch data leaks), validate results, use timeouts
  and log tool use for audit. [mcp-2026-spec §Tools, Security Considerations]
- **Local servers are installed software.** A server run on the user's
  computer runs with the same privileges as the AI app. A malicious install
  command or server can run any command, steal files such as SSH keys, or
  destroy data. Clients offering one-click setup must show the exact command
  and get approval first; sandboxing and restricted file and network access
  are recommended.
  [mcp-2026-docs §Security Best Practices, Local MCP Server Compromise]
- **Least privilege.** Broad permissions granted up front widen the damage
  from a stolen token, muddy audit trails and lead users to abandon long
  consent screens. Start with low-risk read permissions and ask for more
  only when a privileged action is first attempted. Listed mistakes include
  wildcard or "full-access" scopes.
  [mcp-2026-docs §Security Best Practices, Scope Minimization]

## Where sources disagree

- Within MCP itself: tools are "model-controlled" and pre-approval of safe
  operations is allowed, yet the spec says a person should always be able to
  deny calls. The docs also note that when a server gives no scope hint,
  clients fall back to requesting every scope it lists, which sits uneasily
  with least privilege. In practice the balance is left to each application.

## What this means for the guide

- Every connector recommendation should say whether it is **read-only or can
  act**, and give it only the permissions the task needs. This matches the
  site's wording for TL11 and OWASP's advice in G01.
- Install MCP servers and Skills (T05) only from trusted sources, and treat
  installing them like installing software.
- Combine with G02: a connector that reads untrusted content (email, web)
  plus one that can send data out is the lethal trifecta. Approval and
  logging should sit on the outbound action.
