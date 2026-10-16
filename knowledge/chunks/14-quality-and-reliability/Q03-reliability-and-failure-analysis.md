---
id: Q03
title: Reliability models, system structure and failure ranking
topic: quality-and-reliability
sources: [sysen-2026-5300-notes]
last_verified: 2026-10-16
---

## Claims

- Reliability describes a unit's random lifetime T with four linked functions:
  F(t), the share failed by time t; R(t) = 1 − F(t), the share still working;
  f(t) = −dR/dt, how fast units are failing now out of all units; and the
  hazard h(t) = f(t)/R(t), the risk in the next moment for a unit that is still
  alive. Knowing one gives the rest. [sysen-2026-5300-notes §3]
- The probability of failing in a window is a difference of two values,
  F(b) − F(a) = R(a) − R(b); no integration is needed. The probability of
  failing in the next short interval, given survival so far, is about
  h(t) × Δt. [sysen-2026-5300-notes §3]
- With a constant hazard λ the lifetime is exponential: R = e^(−λt) and the
  mean time to failure MTTF = 1/λ. Only about 37% of units survive to the
  MTTF, and the distribution is memoryless: an old part is as risky as a new
  one. [sysen-2026-5300-notes §3]
- Wear-out breaks that assumption: a part whose risk rises with age needs a
  Weibull model with shape above 1 (shape 1 is the exponential; below 1 is
  infant mortality). The exponential is too pessimistic when the part is new
  and dangerously optimistic when it is old. [sysen-2026-5300-notes §3]
- The bathtub curve has three phases: early failures with a falling hazard,
  a useful life with a flat hazard where random shocks dominate and the
  exponential fits, and wear-out with a rising hazard. [sysen-2026-5300-notes §3]
- A system of parts is modelled inside out. Parts in series all have to work:
  R = R₁ × R₂ × …, weaker than the weakest part. Parts in parallel need any
  one to work: R = 1 − (1 − R₁)(1 − R₂)…, stronger than the strongest.
  [sysen-2026-5300-notes §4]
- Parallel redundancy assumes independent failures. A shared tank, power
  strip, rack or cold morning is a common cause that fails both branches
  together; it is modelled as a block in series with the redundant pair, and
  the real fix is to separate the shared part. Redundancy cannot beat a single
  point of failure. [sysen-2026-5300-notes §4]
- FMEA ranks failure modes by a Risk Priority Number, RPN = severity ×
  occurrence × detection, each scored 1 to 10, where detection runs backwards
  (10 means almost impossible to catch). The RPN is ordinal: it orders what to
  fix first and predicts no probability; 200 is not twice as risky as 100.
  A high severity matters even at a low RPN, so severity of 9 or more is
  flagged on its own. Adding a sensor lowers the detection score.
  [sysen-2026-5300-notes §5]

## What this means for the guide

- When a task predicts or prevents equipment failure, the method is a fitted
  lifetime model (exponential during useful life, Weibull once wear-out is
  plausible) that turns the asset's age and recorded failures into a
  probability of failure in the next period and a mean time to failure; a
  rising hazard is what justifies earlier replacement.
- A fleet or network is scored by its structure: which parts are in series,
  where redundancy is real, and which shared parts are common causes. That
  structure, not the average part, says where a failure would take the whole
  service down.
- Where there is no lifetime data yet, an FMEA risk ranking is the honest
  first step: it orders the failure modes for attention and names the
  detection gaps a monitoring system should close, without pretending to
  give a probability.
