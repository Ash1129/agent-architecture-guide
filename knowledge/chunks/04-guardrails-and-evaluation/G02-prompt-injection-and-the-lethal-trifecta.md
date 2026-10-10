---
id: G02
title: Prompt injection and the lethal trifecta
topic: guardrails
sources: [greshake-2023-indirect-injection, owasp-2025-llm01-prompt-injection, willison-2025-lethal-trifecta, debenedetti-2024-agentdojo]
last_verified: 2026-10-05
---

## Claims

- **Indirect prompt injection (Greshake et al., ACM AISec 2023).** Apps that
  feed an LLM retrieved content blur the line between data and instructions.
  An attacker who never talks to the system can plant instructions in content
  it is likely to read, such as a web page or document. The authors showed
  this against real systems, including Bing's GPT-4 chat. Effects included
  data theft and manipulating which APIs the app calls; processing a
  retrieved prompt could act like running arbitrary code.
  [greshake-2023-indirect-injection abstract]
- OWASP ranks prompt injection first in its 2025 Top 10 for LLM apps. It
  distinguishes direct injection (from the user's own input) from indirect
  injection (from websites, files and other external content). Because of how
  models work, it is "unclear" whether fool-proof prevention exists; OWASP
  offers mitigations, not a cure.
  [owasp-2025-llm01-prompt-injection §Direct/Indirect Prompt Injections; §Prevention and Mitigation Strategies]
- OWASP's mitigations [owasp-2025-llm01-prompt-injection §Prevention and Mitigation Strategies]:
  - constrain the model's role in the system prompt
  - give the app, not the model, its API tokens
  - least privilege
  - human approval for high-risk actions
  - mark untrusted external content clearly
  - regular adversarial testing
- **The lethal trifecta (Willison).** An agent that combines all three of the
  following can be tricked into stealing data:
  1. access to private data
  2. exposure to untrusted content
  3. a way to communicate externally

  An attacker can simply email an assistant that reads email and tell it what
  to do. Willison lists many reported attacks of this kind on production
  products, and notes that any tool able to make a web request, load an image
  or show a link can leak data. [willison-2025-lethal-trifecta]
- Willison: mixing tools from different sources, which MCP encourages, makes
  the trifecta easy to assemble by accident. He is sceptical of guardrail
  products claiming to catch "95% of attacks", because in security 95% is a
  failing grade. For end users mixing tools, the only safe course is to avoid
  the full combination. [willison-2025-lethal-trifecta]
- **AgentDojo (NeurIPS 2024).** A benchmark of 97 realistic agent tasks,
  covering email, e-banking and travel booking, with 629 security test
  cases. State-of-the-art models failed many tasks even without attacks, and
  existing attacks broke some security properties but not all.
  [debenedetti-2024-agentdojo abstract]

## What this means for the guide

- For every design, the guide should check the trifecta. If one agent can
  **read private data**, **read outside content** (email, web, uploaded files)
  **and send anything out** (email, web requests, posting), flag it as the
  top gotcha and break the combination:
  - remove one leg
  - split the work so no single agent holds all three
  - put a person before any outbound action
- Email-reading assistants are the classic case. "Answer customer emails"
  designs need approval on outbound replies at first, and should never let the
  same agent both read inbound mail and send data to arbitrary addresses.
- Do not present a guardrail product or a prompt instruction as a full fix for
  injection; the sources agree none exists today.
