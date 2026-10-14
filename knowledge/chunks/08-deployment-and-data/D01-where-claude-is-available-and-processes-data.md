---
id: D01
title: Where Claude can be used, and where it processes data
topic: deployment
sources: [anthropic-docs-supported-regions, anthropic-help-where-to-access, anthropic-docs-data-residency, anthropic-docs-data-retention, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- **Country availability.** Anthropic's API supports access from 175
  listed countries and territories. Ukraine is listed except Crimea, Donetsk
  and Luhansk. [anthropic-docs-supported-regions]
- Among the places **not** on that list (checked 2026-10-05): mainland
  China, Hong Kong, Macau, Russia, Belarus, Iran, North Korea, Cuba,
  Venezuela, Afghanistan, Myanmar and Syria. [anthropic-docs-supported-regions]
- The help centre's list for the Claude apps (updated 2026-03-16) covers
  essentially the same places. [anthropic-help-where-to-access]
- **Where processing happens on Anthropic's own API** [anthropic-docs-data-residency]:
  - two separate settings: *inference geo* (where the model runs, chosen
    per request or as a workspace default) and *workspace geo* (where data is
    stored at rest)
  - inference geo options are only `"global"` (the default; any
    geography) or `"us"` (US only). Workspace geo is US only and cannot be
    changed after a workspace is created. (§Current limitations)
  - US-only processing costs **1.1×** the standard price on Claude 4.6 and
    later models (§Pricing)
  - it isn't supported on Opus 4.5, Sonnet 4.5, **Haiku 4.5** or earlier
    models; requests that set it fail (§Model availability)
  - admins can restrict which geos a workspace may use
    (§Workspace-level restrictions)
- **Through cloud partners**, the region is set by the partner: on Amazon
  Bedrock and Google Cloud it is the endpoint or inference profile chosen;
  on Microsoft Foundry a US data-zone option exists.
  [anthropic-docs-data-residency §Model availability, note]
- On Bedrock and Google Cloud, the cloud provider (not Anthropic) is the
  data processor, and its own retention and compliance documents apply.
  [anthropic-docs-data-retention intro]
- **Team notes.** Where the business is located, and where the agent will
  be operated, limits which tools and models can be used. The example given
  is a business in China that can't access Anthropic's models.
  [team-2026-assignment4 opening questions, p. 1; §Hermes, p. 2]

## Where sources disagree

- Minor: the API list excludes three Ukrainian regions; the app list just
  says "Ukraine". Treat the narrower API list as authoritative.

## What this means for the guide

- The site's "restricted" location answer is supported: a business
  operating from mainland China, Hong Kong, Russia and other unlisted
  places can't use Claude directly. Open-weight models (M03) or other
  providers are the route; the site's hint text (China) is accurate.
- **Data residency:** Anthropic's own API offers no EU-only processing
  today, only US-only or global. A business that needs data kept in the EU
  (or another region) should use Claude through a cloud partner with a
  regional endpoint, or another model it can host in-region. The site's
  rule H3 ("cloud services that guarantee in-region processing") should
  say this plainly.
- If US-only processing is required, budget for the 1.1× price, and note
  that Haiku 4.5 can't be pinned to the US on the first-party API.
- The team notes frame location as an opening question. The supported-countries
  list above is what turns that question into a yes or no for Claude.
