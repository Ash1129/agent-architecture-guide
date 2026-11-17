---
id: B01
title: When people act on the output, their minutes are the capacity
topic: lessons-from-builds
sources: [auxocase-2026-build]
last_verified: 2026-11-16
---

## Claims

One system built from this guide's result ranked incoming items and handed
them to a team that could act on about a third of them. Its history, from the
first working version to the final one, is the evidence here. It is one build
on simulated data, so read these as what happened, not as rates to expect.

- The first version treated the team's monthly capacity as a constant. The
  final one computes it: people × hours each gives the work ÷ minutes one item
  takes, with the minutes and hours as settings a manager can change. Routing,
  the reports and the simulator all read that one number.
  [auxocase-2026-build 02b3d5a]
- Once capacity was arithmetic, every later assisting step was judged by the
  minutes it gave back. Sending the two later messages for the person took 10
  of 30 minutes off an item, which is 750 items a month instead of 500 on the
  same hours. Reading replies first cut a reply from 10 minutes to 4. Writing
  up call notes cut logging from 4 minutes to 1. Booking the meeting cut 8
  minutes to 1. [auxocase-2026-build ee2709c] [auxocase-2026-build 9b552c2]
  [auxocase-2026-build 312778e] [auxocase-2026-build 4587b14]
- Most of the final system is those steps. The brief asked for scoring,
  routing and learning; the work that followed the hand-off (drafting,
  following up, answering, booking) was where the people's time went and
  where most of the later building happened. [auxocase-2026-build f9e5245]
  [auxocase-2026-build ee2709c]
- An assisting step can also cost capacity. Automated messages to items the
  team could not reach brought replies, and each reply took a person's time
  from a ranked item. At 10 minutes a reply the step added results; at 20
  minutes it added none. [auxocase-2026-build 3c9abde]
- The first version waited for a person to click "worked" in its own page.
  People did the work in the tool they already used, so the click never came,
  a finished item kept its place in the person's queue, and nothing new was
  handed out. The final version reads the first outgoing message or call from
  that tool's activity log every minute and frees the place at once.
  [auxocase-2026-build 20b61ec] [auxocase-2026-build f9e5245]
- The minutes an item takes were later read from the people's own recorded
  work once there was enough of it, with a typed figure still winning.
  [auxocase-2026-build 60f0e37]
- A limit per person, tuned in simulation, was made optional. The default
  became a bound on the whole team: it holds no more untouched items than it
  can reach in the planning horizon. [auxocase-2026-build c1ca689]
- People's own skips were counted by trait, and an item with a trait they
  usually skip went to a manager first. A trait had to rest on 20 decisions:
  at 8, nine decisions on one trait had set aside hundreds of items.
  [auxocase-2026-build e6022d7] [auxocase-2026-build 8a5bf3e]

## What this means for the guide

- When people act on what the system produces and cannot act on all of it,
  the design should state capacity as people × hours ÷ minutes per item, not
  as a fixed count taken from the brief. The interview should ask for those
  three numbers.
- Ask what the person does after the hand-off and how long it takes. A design
  that stops at the decision leaves most of the time untouched.
- Price each proposed AI step in minutes returned per item, and in the
  minutes it adds elsewhere.
- Observe what people did from the tool they work in. A step that waits for
  an acknowledgement click will wait, and every count that depends on it will
  be wrong.
- Anything learned from people's choices needs a minimum number of decisions
  before it acts.
