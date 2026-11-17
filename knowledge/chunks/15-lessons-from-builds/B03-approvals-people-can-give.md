---
id: B03
title: An approval works when the approver can judge it, in their own terms
topic: lessons-from-builds
sources: [auxocase-2026-build]
last_verified: 2026-11-16
---

## Claims

The guide's result for the build in B01 put a person's approval on two things:
individual hand-offs, and every new version of the scoring. A03 explains why
people over-accept automated output. This is what the approvals turned into.

- Approver names were first typed into a form. The final system has a login
  with roles; every form takes its name from the login, and each role sees
  only its own pages. Five roles became three once it was clear who decided
  what. [auxocase-2026-build a47d88a] [auxocase-2026-build b4d25e0]
  [auxocase-2026-build b3b9a45]
- Every human call is kept in one place with what the person saw at the time:
  the score and rank beside each accepted, skipped or rejected item, and the
  approver and note beside each version. [auxocase-2026-build f6f47d1]
- Approving a new version meant reading model metrics. The approvers were
  marketing and sales managers. A one-line verdict from fixed rules was put
  under each candidate: send back when its predictions are more than a point
  further off, approve when its picks beat the old list and it learned from at
  least as much. [auxocase-2026-build f6ff06e]
- The verdict was then reworded for the approver. The facts are plain
  quantities (percent more results than the old list, what really happens
  when it says N percent), and code drops any sentence with a modelling word
  or a figure the facts do not hold. [auxocase-2026-build b3dc579]
- The sign-off then became automatic. The same rules promote the best
  candidate, signed "Automatic sign-off (the rules)" with the sentence as its
  note, and send the rest back. A named person can switch it off, and the
  switch is recorded. [auxocase-2026-build 9664841]
- Riskier capabilities shipped switched off. Each switch refuses until a
  stated number of checked outcomes exist (100 in one case, 200 in another)
  unless forced, keeps a comparison group that is left alone, and records who
  threw it. [auxocase-2026-build 7e65ba8] [auxocase-2026-build 3c9abde]
  [auxocase-2026-build 7d19e30]
- A second look was added where a wrong number costs something. A reader
  raises a flag from a fixed list, each with words from the record that code
  checks before it is shown. A flag never changes a score, and flagged and
  unflagged items are compared once their outcomes are in.
  [auxocase-2026-build b4d25e0]

## What this means for the guide

- For every approval in a design, name who approves and ask whether that
  person can judge the evidence in the terms they use. If not, the step is
  the approval trap in A03 with a signature on it.
- Put a recommendation from fixed rules beside the approval, worded for the
  approver, and record how often they overrule it.
- When the approver always follows the rule, let the rule decide, keep the
  record, and leave a named person an off switch. That is a higher autonomy
  level reached with evidence (A04), and the design should say so.
- Identity comes from a login, never a typed name, and the record keeps what
  the person saw.
- A capability that is not yet trusted ships switched off with the count of
  checked outcomes that unlocks it written down.
