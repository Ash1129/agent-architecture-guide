---
id: Q01
title: Control charts tell noise from a real change
topic: quality-and-reliability
sources: [sysen-2026-5300-notes]
last_verified: 2026-10-16
---

## Claims

- A control chart separates common-cause noise (the normal wobble of a stable
  process) from special-cause signals (something changed). Its limits come
  from the process's own variation, never from the specification.
  [sysen-2026-5300-notes §6]
- For measurements taken in subgroups (for example five items per run), the
  X-bar chart plots each subgroup's mean against limits at the grand mean plus
  or minus three standard errors: x̿ ± 3σ_short/√n, where σ_short is the
  within-subgroup standard deviation and n the subgroup size. The spread
  within runs goes on a companion S chart (or R chart). [sysen-2026-5300-notes §6]
- σ_short must be the short-term, within-subgroup spread (from s̄/c₄, R̄/d₂ or
  a pooled s). Using the total standard deviation hides drift inside the
  limits. [sysen-2026-5300-notes §6]
- Three standard errors hold 99.73% of stable means, so a false alarm comes
  about once in 370 points. Tighter limits cause constant false alarms and
  over-adjustment; wider ones miss real shifts. [sysen-2026-5300-notes §6]
- Which chart depends on the data: measurements in subgroups take X-bar with S
  or R; one value per period takes an individuals chart with a moving range
  (limits x̄ ± 2.66 m̄R); pass/fail counts with a fixed sample size take an np
  chart and with a varying size a p chart; counts of defects per fixed unit
  take a c chart and per varying unit a u chart. [sysen-2026-5300-notes §6]
- Pass/fail data is binomial (np chart centre np̄, limits np̄ ± 3√[np̄(1 − p̄)]);
  defect counts are Poisson, where the mean equals the variance (u chart
  limits ū ± 3√(ū/nᵢ), floored at zero). When the sample size varies, the
  limits move: small samples get a wide band. [sysen-2026-5300-notes §6]
- Individual items are never compared with X-bar limits, and control limits
  are never used as specification limits. [sysen-2026-5300-notes §6]
- Run rules catch changes that stay inside the limits. Each rule picks a
  pattern that pure noise produces about as rarely as a point beyond three
  sigma: two of three points beyond two sigma on the same side; eight in a
  row on one side of the centre line (chance 1 in 256); six in a row steadily
  rising or falling (a trend such as tool wear); fifteen in a row hugging the
  centre (a faulty gauge or wrong limits); fourteen alternating up and down
  (two sources taking turns). Six on one side is not yet a signal.
  [sysen-2026-5300-notes §7]
- The two costly mistakes are treating noise as a signal (over-adjusting) and
  missing a real signal. [sysen-2026-5300-notes §6]

## What this means for the guide

- When a task watches a measured quantity, a pass/fail rate or a defect count
  over time (loads, temperatures, response times, misplaced items, faults),
  the deciding step is a control chart with run rules, not a generic
  threshold: it is a fixed, explainable method with no AI, and it tells the
  owner whether a change is real before anyone acts on it.
- A design that uses it should name the chart from the data (X-bar and S,
  individuals and moving range, p or np, c or u), compute limits from the
  process's own recent, stable history, and send only signals (a point beyond
  the limits or a run-rule pattern) to the person who reviews them.
- Limits are recomputed deliberately, after a known process change, not on
  every run; otherwise a drift becomes the new normal.
