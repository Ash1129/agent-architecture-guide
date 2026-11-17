---
id: U01
title: Screens where a person checks, corrects or approves AI output
topic: interfaces
sources: [amershi-2019-human-ai-guidelines, horvitz-1999-mixed-initiative, kocielnik-2019-imperfect-ai, google-pair-guidebook, apple-2026-hig-machine-learning]
last_verified: 2026-11-16
---

## Claims

- Amershi et al. (CHI 2019, peer-reviewed) reduced 168 candidate
  recommendations to **18 guidelines**, grouped by when they apply: initially
  (G1–G2), during interaction (G3–G6), when wrong (G7–G11) and over time
  (G12–G18). 49 design practitioners tested them on 20 AI products and found
  an example of every guideline in every product category.
  [amershi-2019-human-ai-guidelines §3; Table 1; §5 Results]
- The guidelines that bear on a review screen
  [amershi-2019-human-ai-guidelines Table 1]:
  - **G1** make clear what the system can do
  - **G2** make clear how well: how often it "may make mistakes"
  - **G8** make unwanted output easy to dismiss or ignore
  - **G9** make wrong output easy to edit, refine or recover from
  - **G10** when unsure of the user's goal, ask or do less
  - **G11** let people see why the system did what it did
  - **G15** let people give feedback during normal use
  - **G16** show how the person's action will change future behaviour
- G2 and G11 were more often violated than applied. For G11, participants
  found no explanation or one too thin to use. The authors add that high-risk
  or regulated areas may need specialised guidance.
  [amershi-2019-human-ai-guidelines §5 Results, Relevance; §7]
- Eight of the 18 trace to Horvitz's 1999 principles, including natural
  gestures for rejecting a poor guess, "doing less" but correctly under
  uncertainty, and assuming people will refine the result.
  [amershi-2019-human-ai-guidelines §2; horvitz-1999-mixed-initiative
  §Principles for Mixed-Initiative UI (7)–(9)]
- Kocielnik et al. (CHI 2019, peer-reviewed; 150 and 400 participants) tested
  an email assistant that was right half the time. A stated accuracy figure,
  an example-based explanation and a control slider each shifted expectations
  as intended, and together raised acceptance of the version that had
  disappointed users. Task accuracy and time did not change.
  [kocielnik-2019-imperfect-ai §1; Results; Summary of results]
- At equal accuracy, users accepted the version that flagged too much over
  the one that missed things. The authors' reading: a wrong flag is easily
  ignored, a miss means doing the work by hand, so the right balance depends
  on the cost of recovery; in critical systems, severity matters more.
  [kocielnik-2019-imperfect-ai §Discussion]
- Google's guidebook (vendor guidance) aims for calibrated trust, not maximum
  trust; says a high-stakes result needs the "why" as well as the "what"; and
  recommends a partial explanation of what affects the decision, with more on
  request. [google-pair-guidebook Explainability + Trust §➀; §➂]
- On confidence, it says to leave it out when it would not change what the
  person does or could mislead; calls bare percentages "risky"; wants each
  category (high, medium, low) to name an action; and suggests showing
  several candidate answers at low confidence.
  [google-pair-guidebook Explainability + Trust §➃]
- A person taking over from a failed AI step needs the situation, the next
  step and how to do it. [google-pair-guidebook Errors + Graceful Failure
  §➂ Return control to the user]
- Apple's guidelines (vendor guidance) say to convey confidence only once it
  is verified to track result quality, and then as familiar categories or a
  suggested action. [apple-2026-hig-machine-learning §Confidence]
- On corrections: use familiar controls; apply and keep the fix at once;
  prefer picking from suggested alternatives over free-form entry; people
  abandon a feature that is more work to fix than to do by hand.
  [apple-2026-hig-machine-learning §Corrections]
- Stated reasons should be factual and free of statistical jargon; a wrong
  reason magnifies the original mistake.
  [apple-2026-hig-machine-learning §Attribution; §Mistakes]

## Where sources disagree

- G11 asks for an explanation to be available. Google says some screens need
  none and most need only a partial one; Apple says a wrong one makes things
  worse.
- Kocielnik's accuracy figure was a one-off, system-level message before use.
  Google and Apple caution against bare percentages on individual results.
- The examples are mostly consumer products, not staff review queues. Only
  Kocielnik measured task accuracy (no change); U02 covers decision quality.

## What this means for the guide

A screens brief for a review point should pass these checks:

- **States the job and its limits:** what the AI step did, what it cannot do,
  and how often it is wrong on this kind of item (G1, G2).
- **Every AI-filled field is editable in place** with controls staff already
  use; a correction applies at once and is kept (G9).
- **Reject is as quick as approve** (G8).
- **The reason is on the screen or one click away**, without statistics
  (G11).
- **Confidence appears only if checked against real results**, as a category
  that names what to do, not a bare percentage.
- **When the AI is unsure it shows options or asks** (G10).
- **A by-hand path always exists** and carries the case details with it.
- **After a correction, the screen says what happens to it** (G15, G16).
- **Where consequences are minor, prefer the mistake that is cheap to
  dismiss:** over-flagging beats missing.
