---
id: U05
title: Prompting Lovable - what a first prompt should hold
topic: interfaces
sources: [lovable-2026-idea-to-app, lovable-2026-prompting-docs, lovable-2026-prompt-library, lovable-2026-plan-mode, lovable-2026-instructions, lovable-2026-design-guidance, lovable-2026-project-chat, lovable-2026-cloud, lovable-2026-supabase, lovable-2026-security, lovable-2026-faq, lovable-2026-build-with-url]
last_verified: 2026-11-16
---

## Claims

- **What it makes.** Lovable builds and hosts full-stack web apps from
  plain-language descriptions, internal tools and dashboards included. All
  claims here are the vendor's own advice (tier C), not measured results.
  [lovable-2026-faq §What can I build with Lovable?]
- **First prompt: small, told as a story.** Say who uses it, what they are
  trying to do and how it should feel, not a spec. Keep version one to
  "one user, one action, one outcome".
  [lovable-2026-idea-to-app §Shape the idea]
- Lovable says not to describe the whole app first: start with the one
  screen or flow that matters most, on sample data, with no login.
  [lovable-2026-idea-to-app §FAQ]
- **Then one change per prompt.** Build by component, not whole pages;
  check the preview before going on; split a prompt that keeps saying
  "and". [lovable-2026-prompting-docs §Prompt by component, not page; lovable-2026-idea-to-app §Build in small loops]
- A full feature goes in confirmed stages: the page, the interface on
  sample data, the data connection, then logic and edge cases.
  [lovable-2026-idea-to-app §Build in small loops]
- A change prompt says what to build, where, and what must stay untouched.
  [lovable-2026-prompting-docs §Say what to change and what to leave alone]
- **Questions and plans.** A closing line asking Lovable to ask what it
  needs reduces misunderstanding. Plan mode, advised for anything bigger
  than a tweak, writes a plan to edit and approve and never changes code;
  each message costs one credit plus any research.
  [lovable-2026-prompting-docs §Make Lovable ask clarifying questions; lovable-2026-idea-to-app §Plan before you build; lovable-2026-plan-mode §Overview]
- **Sample data first.** Get screens and flows right on sample data, which
  lives only in the browser. Add the backend when data must survive a
  refresh or be shared between users, and ask for empty, loading and error
  states. [lovable-2026-idea-to-app §Plan before you build; §Add the backend when data needs to survive]
- The built-in backend (database, sign-in, storage, functions) is the
  default, switched on automatically or on approval when a feature needs
  it. A Supabase project you own is the alternative. Nothing migrates
  automatically between the two, so choose early.
  [lovable-2026-cloud §Enabling the built-in backend; lovable-2026-supabase §Supabase or the built-in backend?; §Limitations]
- **Roles.** Say which role a change is for and what the other role must
  not see. The library's roles prompt hides navigation a role can't use and
  enforces access on the data, not only the interface; front-end sign-in
  state may shape the interface but never grant access. Test with two
  users. [lovable-2026-idea-to-app §Build in small loops; lovable-2026-prompt-library §Accounts and access; lovable-2026-security §Authentication security basics]
- An internal tool can use the signed-in workspace member's identity in
  place of a login page. [lovable-2026-prompt-library §Accounts and access]
- **Design direction** belongs in the first prompts, because later screens
  inherit it: specific style words and real text, not placeholder. A prompt
  naming fonts, colours, a brand or a style is built directly. Otherwise
  Lovable may ask design questions first, though not for dashboards, admin
  panels or record-management apps, which get standard defaults.
  [lovable-2026-idea-to-app §Set the design direction early; lovable-2026-prompting-docs §Design with real content; lovable-2026-design-guidance §When Lovable builds directly]
- Attach a screenshot or sketch instead of describing a layout. A message
  takes up to 10 files (images, PDF, Office files), the first prompt
  included. [lovable-2026-idea-to-app §Shape the idea; lovable-2026-project-chat §Attach files as context]
- **Standing context** goes in project instructions (formerly Knowledge),
  sent with every message: product, audience, journeys, roles, design
  guidance. Limit 10,000 characters; "a one-page brief, not a wiki".
  [lovable-2026-instructions §Project instructions; lovable-2026-idea-to-app §Plan before you build]
- **Length and structure.** No word count is given in the pages read. The
  library's template orders a prompt as visual style, interactions,
  structure, responsive behaviour. A link can open Lovable with a prompt
  prefilled (maximum 50,000 characters; it never starts the build), and
  those prompts should be concise and focused.
  [lovable-2026-prompt-library §Write your own prompt; lovable-2026-build-with-url §Parameters; §Best practices]
- **Limits.** Web apps only, no native mobile apps; the framework and
  database can't be chosen. Lovable is not HIPAA-compliant, and health,
  payment-card, government-ID and biometric data are not allowed under
  standard terms. Reverting restores code, not database data. In very long
  conversations instructions may not be followed consistently.
  [lovable-2026-faq §Does Lovable support mobile app development?; §Can I choose a different framework, such as Next.js?; §Can I store health, payment card, or government ID data in my app?; lovable-2026-idea-to-app §Build in small loops; lovable-2026-instructions §Important notes]

## What this means for the guide

- **Shape of a first Lovable prompt**, in order:
  1. who uses the screen, what they decide there, and the outcome
  2. the one screen for this review point, its parts named in interface
     words, with real labels and text
  3. a few realistic sample records, stated as sample data, with no login
     and no database yet
  4. the empty, loading and error states
  5. a line of look: style words, or named colours and a font
  6. a closing request to ask questions before building
- **Left for later prompts**, one each: storing real data, sign-in, roles
  enforced on the data, connections to other systems, further screens.
  Blueprint can list these as follow-ups instead of lengthening the first
  prompt.
- One prompt per review point matches Lovable's one-screen, one-change
  advice.
- Facts that hold across screens (audience, roles, look) belong in project
  instructions, written once.
- Where the task handles health, card or identity data, the prompt should
  carry a warning that Lovable's standard terms exclude it.
- A prefilled link is possible, and the owner still presses send.
