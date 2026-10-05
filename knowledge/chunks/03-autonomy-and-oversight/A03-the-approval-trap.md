---
id: A03
title: The approval trap - people over-trust automated output
topic: autonomy
sources: [goddard-2012-automation-bias, eu-2024-ai-act-art14, mitchell-2025-fully-autonomous]
last_verified: 2026-10-05
---

## Claims

- **Automation bias** is the tendency to over-accept computer output in place
  of careful checking. It shows up as two kinds of error:
  - **commission:** following incorrect advice
  - **omission:** failing to act because the system did not prompt you

  [goddard-2012-automation-bias Introduction]
- Goddard et al.'s systematic review in JAMIA screened 13,821 papers and
  included 74. In clinical decision support, one study found clinicians
  overrode their own **correct** decisions in favour of wrong advice in 6% of
  cases. Pooling four healthcare studies, wrong advice raised the risk of an
  incorrect decision by 26% (risk ratio 1.26, 95% CI 1.11–1.44).
  [goddard-2012-automation-bias Abstract; Results]
- Things that made automation bias worse [goddard-2012-automation-bias Results]:
  - inexperience with the task
  - trust that is higher than the system's real reliability
  - high workload
  - task complexity
  - time pressure
- What reduced it [goddard-2012-automation-bias Abstract; Results]:
  - making users **accountable** for decisions
  - **training**
  - design choices: where advice appears on screen, showing an updated
    **confidence level** with each piece of advice, and giving supporting
    information
- The EU AI Act names automation bias explicitly. The people overseeing a
  high-risk system must remain aware of it, particularly when the system
  gives recommendations for people to decide on. [eu-2024-ai-act-art14 §4(b)]
- Mitchell et al. list misplaced trust as a risk that enables a cascade of
  further harms. [mitchell-2025-fully-autonomous abstract]

## Where sources disagree

- The automation bias evidence comes mostly from healthcare decision support,
  not LLM agents. The mechanism (over-trusting a usually-right system under
  workload) is general, but the exact percentages should not be quoted as
  agent statistics.

## What this means for the guide

- **"Approve every output" is not automatically safe.** If a person approves
  dozens of items a day under time pressure, approvals become a rubber stamp.
  The guide should warn about this whenever it recommends level 2 at
  high volume.
- Design approvals to resist rubber-stamping:
  - keep the number of approvals low, so only the risky ones need one
    (level 3)
  - show **why** the agent proposes the action, its sources and its
    confidence
  - name the approver, so someone is accountable
  - for important decisions, have the person form a view before seeing the
    AI's (Goddard notes the position of advice matters)
- This is the evidence-based reason the guide prefers "approve the risky
  ones" over "approve everything" once the system has been tested.
