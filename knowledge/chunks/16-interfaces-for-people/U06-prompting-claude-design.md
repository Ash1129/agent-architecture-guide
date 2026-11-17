---
id: U06
title: Prompting Claude Design - briefs for designs and prototypes
topic: interfaces
sources: [anthropic-help-claude-design, anthropic-academy-claude-design-prototypes, anthropic-academy-design-system, anthropic-help-claude-design-system, anthropic-help-claude-design-admin, anthropic-2026-claude-design, anthropic-2026-claude-design-update, anthropic-product-claude-design, anthropic-docs-claude-code-commands]
last_verified: 2026-11-16
---

## Claims

- **Name and place.** The official name is Claude Design. It launched on
  17 April 2026 as an Anthropic Labs research preview and is now a template
  for starting an artifact inside Claude: in any conversation, the
  Artifacts tab, or Claude Code (`/design`). The standalone site,
  claude.ai/design, closes on 14 December 2026. All claims here are the
  vendor's own material (tier C).
  [anthropic-2026-claude-design §Introducing Claude Design by Anthropic Labs; anthropic-help-claude-design intro; §Where you can use Claude Design]
- **Plans.** Free, Pro, Max, Ultra, Team and Enterprise, on by default,
  drawing on the same usage limits as the rest of Claude. Design systems
  are a beta on paid plans only.
  [anthropic-help-claude-design intro; §Usage and pricing; anthropic-academy-design-system §3 Before you start]
- **What it makes.** Designs, interactive prototypes, one-pagers and
  landing pages on a canvas, each screen on its own artboard. Screens are
  clickable only if asked: say you want clickable screens or a working
  prototype. [anthropic-help-claude-design intro; anthropic-academy-claude-design-prototypes §1 Start a design; §If something looks off]
- **Input.** Text, plus screenshots, wireframes, images of other products,
  a deck or document whose style to match, a linked code repository, and
  a design system. [anthropic-help-claude-design §Add context to your project]
- **The brief.** A good prompt covers four things: the goal, the layout,
  the content and the audience. Claude asks clarifying questions when
  something is missing. Anthropic's examples are single sentences naming a
  screen, its sections and how they behave, and some ask for a whole flow
  or three layouts at once.
  [anthropic-help-claude-design §Write effective prompts; anthropic-academy-claude-design-prototypes §2 Prototype the feature]
- Start with core layout and content, then add interactions, edge cases
  and polish. Say which devices it must work on, name the components to
  use, and ask for two or three variations, each on its own artboard.
  [anthropic-help-claude-design §Tips for best results; anthropic-academy-claude-design-prototypes §2 Prototype the feature]
- Claude may not know facts such as real prices and may assume them, so
  check details before sharing.
  [anthropic-academy-claude-design-prototypes §2 Prototype the feature]
- Before a build, design the empty, error and loading states, and plan for
  very little data and far more than expected.
  [anthropic-academy-claude-design-prototypes §6 Continue in Claude Code]
- **Brand** is supplied once as a design system, not in each prompt.
  Claude extracts colours, type, components and layout patterns from a
  code repository, brand files, Figma files, decks or connected apps,
  applies the organisation's default to new work, and checks its output
  against it. Without one, output is functional but generic. A font named
  without its font file cannot be used.
  [anthropic-help-claude-design-system intro; §Create a design system; anthropic-help-claude-design §Create a new project; §Attach or import your design system; anthropic-help-claude-design-admin §The design system: why it comes first; anthropic-academy-design-system §8 Use it day to day]
- Keep the design system's overview short, because Claude reads all of it
  every time; narrow rules go in usage notes.
  [anthropic-academy-design-system §6 How Claude uses it when it builds]
- **Refining.** Chat for structural changes, inline comments for one
  component, direct canvas edits for quick visual changes.
  [anthropic-help-claude-design §When to use chat vs. comments vs. direct editing]
- **Out.** Export as .zip, PDF, PPTX, Google Slides or standalone HTML;
  send to other tools, Lovable among them; or hand off to Claude Code,
  which builds from the design, not a screenshot.
  [anthropic-help-claude-design §Export and share; §Move between Claude Design and Claude Code]
- **Stated limits.** No version history yet. Inline comments can go
  missing, so paste them into chat. Simultaneous editing is basic. Output
  is only as good as the imported design system.
  [anthropic-help-claude-design §Known limitations; §Using inline comments]
- **Not found.** No page read gives a prompt length. None says a design
  stores data, signs users in or enforces permissions.
  [anthropic-help-claude-design, whole article; anthropic-academy-claude-design-prototypes, whole page]

## Where sources disagree

- **Decks and plans.** The April announcement lists slides and pitch decks
  as Claude Design output, for paid plans only. The newer pages say decks
  are a separate artifact type, Claude Slides, and include the Free plan.
  The newer pages are treated as current.
  [anthropic-2026-claude-design §Design with Claude; anthropic-academy-claude-design-prototypes §If something looks off; anthropic-help-claude-design intro]
- **Controls.** The announcement and product page describe sliders Claude
  creates, and the announcement a web capture tool; the help article names
  neither. [anthropic-2026-claude-design §How it works; anthropic-product-claude-design §Fine-grained control]
- **`/design-sync`.** The update post and help article say it brings a
  design system into Claude Design; the commands reference says it uploads
  to the standalone site that is closing. Re-check after 14 December.
  [anthropic-2026-claude-design-update §Move between design and code; anthropic-docs-claude-code-commands `/design-sync` row]

## What this means for the guide

- **Shape of a first Claude Design prompt**, in order:
  1. the goal: what is being designed, and that it should be clickable
  2. the audience: who uses it and what they decide there
  3. the layout: the screens for this review point, one artboard each,
     and the device
  4. the content: real labels, fields and example records
  5. the empty, loading and error states
- **Left out:** colours and fonts when a design system is attached (one
  line of style when not), and any request to store data, sign people in
  or enforce roles.
- **Where the two prompts differ:**
  - Lovable builds a working app, so its prompt is one screen on sample
    data, followed by prompts for data, sign-in and roles. Claude Design
    makes a design to hand on, so one prompt can hold the whole flow, each
    role's view as its own artboard, and alternatives.
  - Look goes in the Lovable prompt or its project instructions; in
    Claude Design it comes from the design system.
  - Claude Design must be told to make screens clickable.
  - The two chain: a design can be sent to Lovable or Claude Code.
