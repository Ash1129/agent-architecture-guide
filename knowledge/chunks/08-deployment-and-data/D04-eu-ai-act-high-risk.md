---
id: D04
title: EU AI Act - which uses are high-risk, and from when
topic: deployment
sources: [eu-2024-ai-act-high-risk, eu-2026-digital-omnibus-ai]
last_verified: 2026-10-05
---

## Claims

- **Two routes to "high-risk"** [eu-2024-ai-act-high-risk Art. 6(1)-(2)]:
  - **Products (Annex I):** the AI is a safety component of a product, or is
    itself a product, covered by the EU product laws in Annex I, and the
    product needs a third-party conformity assessment.
  - **Uses (Annex III):** any AI system listed in Annex III.
- **Annex III areas**, with the items most likely to matter to a business
  [eu-2024-ai-act-high-risk Annex III]:
  1. Biometrics: remote biometric identification, categorisation by
     sensitive traits, and emotion recognition.
  2. Critical infrastructure: safety components in digital
     infrastructure, road traffic, or the supply of water, gas, heating or
     electricity.
  3. Education: admission decisions, grading learning outcomes, deciding
     what level of education someone can access, and proctoring tests.
  4. **Employment:** recruiting, including targeted job ads, filtering
     applications and evaluating candidates. Also decisions on promotion or
     termination, allocating tasks by behaviour or personal traits, and
     monitoring staff performance.
  5. **Essential services:** eligibility for public benefits, credit
     scoring of individuals (fraud detection excepted), life and health
     insurance risk assessment and pricing, and emergency-call triage.
  6. Law enforcement.
  7. Migration, asylum and border control.
  8. Justice and democratic processes, including AI used to influence
     elections.
- **Way out for minor roles.** An Annex III system is not high-risk if it
  poses no significant risk and does not materially influence decisions.
  It must meet one of four conditions [eu-2024-ai-act-high-risk Art. 6(3)]:
  - it performs a narrow procedural task
  - it improves the result of work a person has already completed
  - it detects patterns in past decisions without replacing human review
  - it does a preparatory task for an Annex III assessment

  A system that **profiles people** is always high-risk.
- A provider relying on that exemption must document its assessment before
  launch and still register the system. [eu-2024-ai-act-high-risk Art. 6(4)]
- The Commission was to publish guidelines with practical examples of
  high-risk and non-high-risk uses by 2 February 2026.
  [eu-2024-ai-act-high-risk Art. 6(5)]
- **Timeline as published in 2024** [eu-2024-ai-act-high-risk Art. 113]:
  - prohibited practices and general provisions (Chapters I-II): 2 February 2025
  - general application: 2 August 2026
  - Art. 6(1) product-route systems: 2 August 2027
- **Timeline as amended by the Digital Omnibus on AI**, Regulation (EU)
  2026/1744. The rules for high-risk systems (Chapter III, Sections 1-3,
  except Art. 6(5)) now apply from [eu-2026-digital-omnibus-ai Art. 1(40), amending Art. 113]:
  - **2 December 2027** for Annex III uses
  - **2 August 2028** for Annex I products
- The Omnibus also adds new prohibitions from 2 December 2026. It says AI
  used only for convenience, efficiency or non-safety quality control is not
  a safety component, unless its failure would endanger health or safety. [eu-2026-digital-omnibus-ai Art. 1(40)(a); Art. 1(8), inserting Art. 6(1a)-(1c)]
- The copy read gives the Omnibus as published on 24 July 2026 and in force
  from 27 July 2026. [eu-2026-digital-omnibus-ai, copy's SOURCE.json and README]

## Where sources disagree

- **Proposal vs adopted text.** A second copy, last updated May 2026, still
  lists the Omnibus as a proposal (COM(2025) 836). That copy has the same
  fallback dates, 2 December 2027 and 2 August 2028. It also ties the start
  date to a Commission decision on whether compliance support is ready. The
  adopted text, as read, gives fixed dates. The 2024 wording of Art. 6,
  Art. 113 and Annex III matches in both copies.
- **Unofficial copies.** EUR-Lex and every other EU host were blocked from
  this environment. Both texts were read from community copies on GitHub
  (see sources.md). The copy's notice says only the Official Journal text
  is authentic. Check dates on EUR-Lex before relying on them.

## What this means for the guide

- Most uses the guide designs for are not in Annex III. Examples:
  - drafting customer replies
  - internal research
  - routing documents
  - scheduling reports
- Some common business ideas are high-risk when used in the EU:
  - screening job applicants or ranking candidates
  - monitoring staff performance
  - scoring credit
  - pricing life or health insurance

  The guide should flag these, recommend legal advice, and require a
  person to make the decision (A02's Art. 14 oversight applies to them).
- "Assistive" is not an automatic exemption. A tool that only prepares or
  checks a person's work may fall outside Annex III, but a tool that
  profiles people never does.
- The rules for Annex III systems apply from 2 December 2027 under the
  amended text. A system built now will be live by then, so design
  oversight in from the start.
- This is a summary for design decisions, not legal advice.
