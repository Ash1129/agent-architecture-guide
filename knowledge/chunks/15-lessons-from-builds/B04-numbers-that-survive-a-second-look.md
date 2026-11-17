---
id: B04
title: Reported numbers have to survive a second look
topic: lessons-from-builds
sources: [auxocase-2026-build]
last_verified: 2026-11-16
---

## Claims

The first report from the build in B01 was written by the same session that
built the system. Later reviews found several of its numbers were wrong or
could not be reproduced. G04 covers testing an agent; these are about any
figure a design promises to report.

- The headline accuracy was partly measured on data the model had learned
  from. One window of months chose the model, fitted its calibration and
  supplied the reported metrics; the model was then refitted on every month,
  those included; and a comparison table scored months it had trained on.
  [auxocase-2026-build a7ce563]
- The fix gives every month one role: fit on the oldest, choose and calibrate
  on the next, test once on the newest. There is no refit, so the version
  that goes live is the version that was tested. A test checks that no month
  has two roles and that the live version reproduces its reported figure.
  [auxocase-2026-build a7ce563]
- Held out, the same model scored 0.444 against 0.369 for the old ranking,
  where the in-sample table had said 0.668 against 0.456. The gain it reported
  for the whole system moved from +69% to +64%.
  [auxocase-2026-build a7ce563]
- Simulated figures had come from single runs. A command now replays each
  setup over several seeds, and the documents quote its averages and ranges
  "instead of single-run figures nobody could reproduce".
  [auxocase-2026-build 20b61ec]
- Fixing a fault changed the headline again (283 to 274 a month), so the
  report is regenerated from scratch after each fix, not edited.
  [auxocase-2026-build 7e65ba8]
- A rate labelled "this period" had no date filter. It now covers a stated
  30 days and keeps two populations apart that had been mixed.
  [auxocase-2026-build 0c1ec4a]
- A monitor led with the month still under way, whose outcomes were not in
  yet. It now leads with the last complete month and lists the current one as
  "so far". [auxocase-2026-build abcd858]
- Running cost was first assumed. It is now metered per model call and
  reported per result, beside the people's hours, with the point at which an
  automated step stops paying for itself. [auxocase-2026-build 3c9abde]
  [auxocase-2026-build 40b4ace]
- The slides for leadership were checked line by line against the system's
  numbers and code before use. [auxocase-2026-build 6bb0b28]

## What this means for the guide

- Where a design learns from past outcomes, its evaluation should name a
  held-out period, give each period one role, and test the version that will
  run, not a refit of it.
- Any figure in a report should come from a command someone else can rerun,
  and simulated or sampled figures should be quoted as a range.
- Rates need a stated window and a stated population, and a period that is
  not finished should be labelled as such.
- Cost should be metered from the first run, not carried forward from the
  estimate.
- A report written by whoever built the system needs a second reader before
  anyone decides on it.
