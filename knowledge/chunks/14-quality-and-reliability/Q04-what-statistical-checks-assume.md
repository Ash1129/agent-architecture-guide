---
id: Q04
title: What a control chart or capability index assumes before its number is trusted
topic: quality-and-reliability
sources: [nist-2012-ehandbook-pmc]
last_verified: 2026-11-16
---

## Claims

- Capability compares the output of an in-control process with its
  specification limits, and the Cp, Cpk and Cpm statistics assume the values
  are normally distributed. [nist-2012-ehandbook-pmc §6.1.6, What is Process Capability?]
- The indices are valid only with a large enough sample, generally about 50
  independent values. The confidence-limit approximations want at least 25,
  and the handbook says capability studies in general need 100 or more.
  [nist-2012-ehandbook-pmc §6.1.6]
- A one-sided specification has its own index: Cpu = (USL − μ)/3σ for an
  upper limit, Cpl = (μ − LSL)/3σ for a lower one, and Cpk is the smaller of
  the two. A commonly used interval is Cpk ± z√(1/(9n) + Cpk²/(2(n − 1))).
  [nist-2012-ehandbook-pmc §6.1.6, One-sided specifications; Confidence Limits]
- When the values are not normal there are two routes: transform them until
  they are roughly normal (Box-Cox is the usual choice, and is encouraged
  when it works), or use indices built from percentiles of the data in place
  of plus or minus three standard deviations.
  [nist-2012-ehandbook-pmc §6.1.6, What you can do with non-normal data]
- An individuals chart, for one value at a time, measures spread by the
  moving range of successive values: limits are the mean ± 3 × (average
  moving range / 1.128), where 1.128 is d₂ for pairs.
  [nist-2012-ehandbook-pmc §6.3.2.2]
- Control limits compare current performance with past performance;
  specification limits say whether the product will work. Shewhart's guide
  was that stability is not established before about twenty-five in-control
  samples, and limits from little data can behave quite differently from
  what is assumed. [nist-2012-ehandbook-pmc §6.3.2]
- Limits are recalculated only for a valid reason: at least 30 new points
  with no known process change, a major process change, or a known
  preventable event. [nist-2012-ehandbook-pmc §6.3.2]
- With the three-sigma rule alone, a stable process gives a false alarm about
  once in 371 points. Adding the Western Electric run rules raises that to
  about once in 92 points, and the handbook notes that some users treat those
  signals with less urgency. Both figures assume a normal distribution and
  known parameters. [nist-2012-ehandbook-pmc §6.3.2]
- A p chart rests on the binomial distribution: every unit has the same
  probability of not conforming, and successive units are independent.
  [nist-2012-ehandbook-pmc §6.3.3.2]
- A c chart models defect counts as Poisson. The normal approximation is
  adequate when the mean count is at least 5, and three-sigma limits are a
  poor idea for a highly skewed distribution; a transformation or
  probability limits are used instead. [nist-2012-ehandbook-pmc §6.3.3.1]

## What this means for the guide

- A step that reports a capability index names the checks that run first
  (stability, enough history, roughly normal and independent values) and what
  happens when one fails: the case goes to a person, and the number, if shown,
  is marked as not established.
- False alarms scale with what is watched. One chart with run rules signals
  by chance about once in 92 points, so a design that judges 500 units over
  7 points each run should expect about 38 chance signals a run. The decision
  after the chart therefore grades signals (a sustained run above an isolated
  point) and does not send every signal to a person with the same urgency.
- The baseline and the period being judged are separate, stated windows:
  limits come from a fixed stretch of history before the period, and are
  recomputed only after a known change.
- An attribute chart (p, np, c, u) across a whole population is right only
  when the units are alike and independent. Where they are not, a plain
  trend with no alarm limits is the honest summary.
