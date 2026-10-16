---
id: Q02
title: Process capability, Cp and Cpk, once the process is stable
topic: quality-and-reliability
sources: [sysen-2026-5300-notes]
last_verified: 2026-10-16
---

## Claims

- Capability asks whether a stable process meets its specification. Stability
  comes first: capability indices mean nothing for an unstable process, so a
  control chart is checked before any index is read. [sysen-2026-5300-notes §8]
- Cp = (USL − LSL) / 6σ_short asks whether the process could fit inside the
  specification if it were centred. Cpk = min(USL − μ, μ − LSL) / 3σ_short asks
  whether it fits on the tighter side as it actually sits. Pp and Ppk use the
  same formulas with the total standard deviation, so they report actual
  performance including drift. The standard deviation is used, never the
  variance. [sysen-2026-5300-notes §8]
- Cpk is at most Cp, and equals it only when the mean sits at the midpoint of
  a two-sided specification. Pp is at most Cp. A large gap between Cp and Cpk
  means the process is off-centre; a large gap between Cp and Pp means it is
  unstable. [sysen-2026-5300-notes §8]
- Reading Cpk for the nearer limit: 1.0 means about 0.135% out of
  specification on that side; 0.7 about 1.8%; 0.2 about 27%; 0 means the mean
  sits on the limit, so half the output is out; negative means most output is
  out. [sysen-2026-5300-notes §8]
- Six Sigma targets: Cp above 2 at design, Cpk above 1.5 in production, which
  corresponds to 3.4 defects per million. A Cp of 1.33 is a common minimum
  for an existing process. [sysen-2026-5300-notes §8]
- The order of fixes follows the gap. An off-centre but stable process (Cp
  high, Cpk low, P close to C) is fixed cheaply by re-centring the mean (a
  setpoint, offset or calibration). A process that drifts between runs (P well
  below C) needs the drift removed first, because drift is a special cause,
  cheaper to remove, and until it is gone the indices do not predict; only
  then is the short-term spread tightened, which needs a process change.
  [sysen-2026-5300-notes §8]
- An index from a sample is an estimate. A 95% confidence interval for Cp is
  about Cp ± 1.96 × Cp × √(1/2v) with v the degrees of freedom; if the
  interval crosses 1, the process cannot be claimed capable. Bootstrapping
  (resample the rows with replacement, recompute the index about a thousand
  times, take the 2.5th and 97.5th percentiles) gives an interval for any
  statistic without a formula or a normality assumption.
  [sysen-2026-5300-notes §8]

## What this means for the guide

- Where a task compares a measured quantity with a limit that someone else
  set (a rating, a tolerance, a service level), the right method is a
  capability index against that limit, computed only once the control chart
  shows stability, and reported with its confidence interval so a borderline
  result is not read as a pass.
- The index tells the owner which fix to try first: re-centre when Cpk is far
  below Cp, remove drift when Pp is far below Cp, and change the process only
  when the short-term spread itself is too wide.
- A one-sided limit (a maximum load, a minimum strength) uses the one-sided
  Cpk term alone; the design should say which side the specification has.
