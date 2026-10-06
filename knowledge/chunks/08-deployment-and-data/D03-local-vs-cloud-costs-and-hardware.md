---
id: D03
title: Local vs cloud - what each costs, and when your own hardware pays off
topic: deployment
sources: [pan-2025-onprem-breakeven, patil-2026-concurrency-cost, anthropic-docs-rate-limits, anthropic-docs-messages-api, team-2026-assignment4]
last_verified: 2026-10-05
---

## Claims

- **Two cost shapes.** A commercial API charges per token processed, input
  and output, so cost follows use. Running models yourself is mostly
  upfront [pan-2025-onprem-breakeven §IV; §V]:
  - capital costs: GPUs, servers, storage, setup, networking
  - running costs: electricity, cooling, maintenance, staff, software licences
  - scaling costs: more hardware as use grows
- On-premise deployment gives full control over privacy, because no outside
  cloud provider is involved. [pan-2025-onprem-breakeven §V]
- **Hardware, mid-2025 prices** [pan-2025-onprem-breakeven Table II; Table III]:
  - a workstation GPU (RTX 5090, 32 GB) at about $2,000 runs one
    24-32B-parameter open model
  - a data-centre GPU (A100, 80 GB) costs about $15,000; 70-120B models need
    one or two ($15k-$30k)
  - the largest open models (235B to 1T parameters) need 4 to 16 A100s
    ($60k-$240k)
- **Break-even in Pan et al.** Across 9 open models compared with
  commercial APIs, months until owning hardware costs less than paying per
  token [pan-2025-onprem-breakeven Table IV, "Range" column]:
  - small models (one $2k GPU): 0.3 to 3.0 months
  - medium models: 2.3 to 34.0 months
  - large models: 4.3 to 69.3 months

  Payback is fastest against expensive APIs (Claude-4 Opus at the time) and
  slowest against cheap ones (GPT-5, Gemini 2.5 Pro). The abstract concludes
  that owning hardware makes sense mainly at very high volume
  (≥50M tokens a month) or under strict data-residency rules.
- **What that model leaves out.** Local cost is GPUs plus electricity only
  ($0.15/kWh, 8 hours a day, 20 days a month). The API comparison assumes the
  hardware's full token capacity is used (one-third input, two-thirds output
  tokens). Staffing and maintenance are named as future work.
  [pan-2025-onprem-breakeven §VI.B-C, Eq. 1-5; §VII Future Work]
- **Utilisation decides the real cost.** Patil measured self-hosted models
  on rented H100 GPUs at different request rates
  [patil-2026-concurrency-cost Abstract; §1]:
  - effective cost ranged from $0.21 to $15.25 per million output tokens
  - the same hardware and model varied 17.5 to 36.3 times between near-idle
    and saturation
  - at 1 request a second, one setup cost more per token than Claude
    Sonnet 4.6's list price; at 25 requests a second it cost $0.87
- Calculators that assume full use understate cost by 1/utilisation, which
  is "most severely over-selling it for low-traffic workloads". Patil names
  Pan et al. as assuming full use for 160 hours a month.
  [patil-2026-concurrency-cost Abstract; §2.1]
- Patil's API comparison ignores prompt caching, batch discounts (about 50%)
  and volume contracts, so it already favours self-hosting.
  [patil-2026-concurrency-cost §5.6, caveat]
- Patil's limits: synthetic fixed-length requests, three model
  architectures, one serving engine for the headline numbers, and GPU
  prices that change often. [patil-2026-concurrency-cost §6.9]
- **Capping cloud spend on Anthropic's API.**
  - Each usage tier has a monthly spend cap: Start $500, Build $1,000,
    Scale $200,000; Custom has none. [anthropic-docs-rate-limits §Spend limits]
  - An organisation can set its own lower monthly limit, including per
    workspace. Once it is reached, requests are refused until the limit
    resets or is raised. [anthropic-docs-rate-limits §Setting your own spend limit]
  - Each request's `max_tokens` sets "the absolute maximum" length of the
    reply. [anthropic-docs-messages-api, max_tokens]
- **Team notes** (citing the unread MindStudio article) [team-2026-assignment4 §Local vs Cloud, p. 2]:
  - local runs on your own hardware; the notes call it "more secure and
    generally cheaper once it's running", with setup and hardware as the cost
  - cloud needs little hardware, but you pay per token, which the notes say
    "you cannot fully control (input but not output)"
  - so a small business might prefer cloud, to avoid fixed costs dominating;
    a large one might build its own hardware, to avoid variable costs
    dominating

## Where sources disagree

- **Pan et al. vs Patil.** Pan finds small models pay back within months.
  Patil argues that this assumes the hardware is always busy, and that at
  realistic low traffic most of the saving disappears. Both are preprints
  (tier B); Patil's measurements are newer (June 2026) and more direct.
- **Pan et al. disagrees with itself:**
  - the abstract gives "2 years" for medium and "5 years" for large models;
    the conclusion gives 6-24 months and "often beyond 2 years"
  - the text gives medium 3.8-34 months, large 3.5-69.3 months and
    $40k-$190k hardware; Tables III-IV give 2.3-34.0, 4.3-69.3 and $60k-$240k
  - it counts "six commercial APIs", but its tables list five

  The claims above use the tables.
- **mindstudio-2026-local-cloud** (the team's source on this topic) has not
  been read, so whether it agrees is unknown.
- **Team notes vs the cost papers.** The notes call local "generally
  cheaper once it's running". Pan et al. agree only when the hardware runs at
  full use. Patil finds that at low traffic most of the saving disappears,
  and idle hardware can cost more per token than an API.
- **"Cannot fully control" output.** The notes say you can't control how
  much the model writes. Anthropic's API caps each reply (`max_tokens`) and
  total monthly spend (spend limits). What can't be fixed in advance is how
  many requests a busy system will make. [team-2026-assignment4 §Local vs Cloud, p. 2; anthropic-docs-messages-api; anthropic-docs-rate-limits]
- **Company size.** The notes tie the choice to company size. Pan et al.
  tie it to monthly token volume and model size; for small companies, a
  small open model breaks even fastest (0.3-3 months), assuming full use and
  no staff costs. [pan-2025-onprem-breakeven §VI.F]

## What this means for the guide

- The team notes' size rule (small → cloud, large → local) is only a rough
  proxy. Steady volume decides, and so does
  having staff to run the hardware. A large company with occasional use
  still pays for idle hardware.
- Local hardware pays off only through **high, steady use**. Occasional or
  uncertain volume favours paying per use. This supports rules H4, H5 and
  G20.
- Published break-even figures are a best case: they assume the hardware is
  always busy and leave out staff. A business without IT staff should not
  count on them (rule H3).
- Self-hosting keeps data under your control. Whether it is "cheaper per
  task" depends on keeping the hardware busy, so rule H2 should not promise
  it unconditionally.
- Cloud bills grow with use, but they can be capped: set a spend limit and
  a reply-length limit. Rule G6's "can't fully cap the bill" overstated
  this. A hard limit stops the system when reached, so it also needs an
  alert well before the limit.
- Prices and GPUs date quickly. Re-check figures before quoting them.
