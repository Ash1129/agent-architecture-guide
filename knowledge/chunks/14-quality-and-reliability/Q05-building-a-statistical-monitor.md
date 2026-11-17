---
id: Q05
title: What building a statistical monitor from a design had to fix
topic: quality-and-reliability
sources: [splitsync-2026-capacity-monitor]
last_verified: 2026-11-16
---

## Claims

All from one team's build on synthetic data. It is evidence of what goes
wrong between a design and a working tool, not field validation.

- The design named an individuals and moving-range chart, a one-sided Cpk
  with a confidence interval, a demand projection and a decision table. An
  independent technical review of the first working version found five
  faults, none of them the subject of the kit's six behaviour cases.
  Forecast demand in kW was added
  to peaks in kVA. Capability was reported with no check of independence or
  normality. The interval used n − 1 degrees of freedom although sigma came
  from the moving range; a simulation found it covered the true value 88% of
  the time where 95% was claimed, and an effective 0.62 × (n − 1) restored
  about 95%. Constant readings, a single point and non-numeric readings were
  unhandled. Thresholds were written in both the decision table and the
  settings file. [splitsync-2026-capacity-monitor DELIVERY-REPORT, Technical review fixes]
- A later methods review found the baseline was shorter than documented (54
  days, not 60: the lookback was counted from the end of the review period,
  not its start), and that a run of eight on one side that began before the
  review period was dropped although it continued into it.
  [splitsync-2026-capacity-monitor METHODS, Individual-chart corrections]
- The team put p, u and X-bar/S limits on county-wide charts, then removed
  them after review: equipment of mixed sizes under shared weather does not
  meet those charts' assumptions, and overlapping rule detections are not a
  Poisson count. Daily percentages, counts and quartiles with no alarm limits
  replaced them. [splitsync-2026-capacity-monitor METHODS, Descriptive dashboard trends]
- The design's decision flagged a low or uncertain index, a forecast near the
  rating or a missing result. The build put a plainer rule first, a reading
  at or above the rating itself, and split flagged cases into "inspect now"
  and "review needed"; one run on 500 units put 22 and 97 in those tiers.
  [splitsync-2026-capacity-monitor rules/decision-table.csv rows 1 to 4; DELIVERY-REPORT, Current snapshot]
- Each statistic has a known-answer test worked by hand, each run rule has a
  test that plants it, degenerate inputs have their own tests, and the data
  generator checks every labelled case against the real functions.
  [splitsync-2026-capacity-monitor SPEC §4, Known-answer check; README-DEVELOPER, Synthetic data]
- With no failure records there was no lifetime model. A thermal ageing
  estimate from load and outside temperature is shown marked MODELED and
  enters no decision rule. [splitsync-2026-capacity-monitor METHODS, Modeled thermal cutaway]
- Recording a disposition was not the end of a case. A follow-up plan (next
  action, owner, due date, status) was added, kept apart from the sign-off of
  the period's report. [splitsync-2026-capacity-monitor README, Follow-up and queue filters]
- A full run on 500 units took about 3 seconds. The scheduler from the design
  stayed local and optional; the hosted copy ran the same analysis from a
  button. [splitsync-2026-capacity-monitor DELIVERY-REPORT, Synthetic dataset scaled; DEPLOY]

## What this means for the guide

- Behaviour cases do not test a calculation. A kit for a design with a
  statistical step asks for a known-answer test for each formula, tests for
  degenerate input, a check of every unit conversion, and a review of the
  methods by someone other than the builder.
- The direct comparison with the limit stays in the decision as its own
  first rule. A chart or an index adds early warning; it does not replace it.
- Thresholds live in one place that the rules, the schedule and the
  documents all read.
- A decision that queues cases for a person grades them by urgency and names
  the rule that put each one there, and the design says what happens to a
  case after its disposition.
- The method follows the data that exists. Without failure records there is
  no lifetime model; a physical or assumed model may inform a reader, clearly
  marked, and never decide.
- An orchestrator is sized to the job. A run that finishes in seconds may
  need only a timer and a button.
