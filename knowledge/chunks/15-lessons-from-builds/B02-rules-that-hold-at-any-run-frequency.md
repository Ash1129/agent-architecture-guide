---
id: B02
title: Rules written for a batch break when the job runs every minute
topic: lessons-from-builds
sources: [auxocase-2026-build]
last_verified: 2026-11-16
---

## Claims

The same build (see B01) started as commands a person ran and ended as jobs on
timers. Several rules that were right for one large pass were wrong for many
small ones. Each was found in use or in review, fixed, and given a test.

- The jobs run on timers inside the service: the main work every 5 minutes,
  reminders and the outcome sync hourly, the monitor daily, retraining every
  30 days. One thread, no two runs overlapping, one log row per run, a failing
  job never stopping the others, and the work per run capped.
  [auxocase-2026-build 20b61ec]
- A share was rounded per run. The design sent 8% of hand-outs to a random
  sample. Computed fresh on each pass, a pass that filled one place rounded
  8% of one to zero, so in production the sample almost never fired. The fix
  keeps a running credit between passes. [auxocase-2026-build 7e65ba8]
- A cap was counted per run. The queue for a manager was limited to 50 items
  a pass; frequent passes grew it without limit. It is now capped as a whole.
  [auxocase-2026-build 20b61ec]
- An item set aside was decided again on every run. A held item stayed at the
  top of the candidates and was held again each pass, and each hold used up a
  free place: in one replay 622 items took 2,124 hold decisions and half the
  places went empty. Held items are now left out of the candidates.
  [auxocase-2026-build 8a5bf3e]
- A write the other system refused was recorded as written and never tried
  again. The record of a refused write is now removed, so the next run writes
  it. [auxocase-2026-build 7e65ba8]
- A place was counted on the wrong state. The limit counted items "in
  progress", so finished work kept its place. It now counts only untouched
  items. [auxocase-2026-build 20b61ec]
- Work too long for one run was given a time budget. After a model change,
  thousands of stored results had to be redone: a job redoes the most
  important first for up to 45 seconds each minute and clears a flag when
  none are left. Inputs that had not changed reused the last AI reading,
  halving the model calls. [auxocase-2026-build 8ded2f6]
- A person's action could land on a state they had not seen. Every form now
  carries a token for the state shown; if it changed, nothing is applied and
  the page says so. [auxocase-2026-build a47d88a]
- Seven distinct faults of this kind were confirmed by an adversarial review.
  Each fix was checked by putting the fault back in a copy and seeing a test
  fail. [auxocase-2026-build 7e65ba8]

## What this means for the guide

- A design should say, for every job, how often it runs, how long one run may
  take, what happens when two would overlap and what a failure stops.
- Shares, caps and limits should be kept as running totals across runs, never
  recomputed inside one run.
- Anything set aside (held, flagged, sent for review) needs a state that takes
  it out of the next run's candidates.
- The other system's answer decides whether a write happened.
- The test set should include a run that handles a single item, and a rerun
  of the same input.
