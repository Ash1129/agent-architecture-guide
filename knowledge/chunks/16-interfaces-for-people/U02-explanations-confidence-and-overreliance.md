---
id: U02
title: Explanations, confidence and over-reliance - what the experiments show
topic: interfaces
sources: [vaccaro-2024-human-ai-combinations, bansal-2021-whole-exceed-parts, bucinca-2021-cognitive-forcing, zhang-2020-confidence-explanation, vasconcelos-2023-explanations-overreliance, fogliato-2022-who-goes-first, poursabzi-sangdeh-2021-interpretability]
last_verified: 2026-11-16
---

## Claims

- **Over-reliance** is accepting the AI's output when it is wrong.
  [vasconcelos-2023-explanations-overreliance §1; Fig. 1]
- A meta-analysis of 106 experiments found people with AI did better than
  people alone (g = 0.64) but worse than the better of person or AI alone
  (g = −0.23). The pairing gained where people alone beat the AI and lost
  where the AI was better. Neither explanations nor confidence displays
  changed this significantly. [vaccaro-2024-human-ai-combinations Results;
  Discussion, Surprisingly insignificant moderators]
- Bansal et al. (1,626 participants; AI accuracy matched to people's) found
  the AI's answer with its confidence beat person and AI alone. Explanations
  added no significant gain: they raised accuracy when the AI was right and
  lowered it when it was wrong. [bansal-2021-whole-exceed-parts §1; §5.1]
- They warn that an answer and justification shown up front, on the item,
  make independent reasoning nearly impossible; showing the AI later may
  help but costs speed. [bansal-2021-whole-exceed-parts §6.3]
- Buçinca et al. (199 participants; simulated AI 75% accurate) tested three
  **cognitive forcing** designs: see the AI only on request, decide first then
  revise, or wait 30 seconds. Against an explanation shown at once, overall
  performance did not differ, but on items the AI got wrong forcing produced
  significantly more correct decisions; still fewer than with no AI.
  [bucinca-2021-cognitive-forcing §3.2; §4.1; §6]
- The cost: forcing designs were rated more complex, and when the AI was
  wrong people did best with the designs they trusted and preferred least.
  The authors suggest forcing only where it is predicted to help.
  [bucinca-2021-cognitive-forcing §4.2; §4.3; §6]
- Zhang et al. (72 participants; AI 75% accurate, people 65%) had people
  answer first, then see the AI. Confidence, worded as "correct N times out
  of 10" on similar cases, made people follow the AI more when it was
  confident, but accuracy did not improve. The authors' suggested reason:
  cases the AI was unsure of were also hard for people, who knew nothing the
  AI did not.
  [zhang-2020-confidence-explanation §3.1; §3.2; §5.2]
- With 9 further participants, a chart of feature contributions did not
  change reliance. Shown confidence is useful only if it matches real
  accuracy. [zhang-2020-confidence-explanation §4; §6]
- Vasconcelos et al. (731 participants, a maze task) found explanations made
  no difference to over-reliance on an easy task and reduced it on a hard
  one. Highlights, which were easier to check, reduced it more than written
  explanations. The explanations were always correct and the task a
  low-stakes game.
  [vasconcelos-2023-explanations-overreliance §1; Table 7; §10.4]
- Fogliato et al. had 19 veterinary radiologists read X-rays with the AI
  shown at the start or after a provisional diagnosis. Shown at the start,
  agreement with the AI was higher even when it was wrong, with marginal
  performance gains. Those who committed first rarely revised, rated the AI
  less useful and took no longer.
  [fogliato-2022-who-goes-first Abstract; §1; §6]
- Poursabzi-Sangdeh et al. (N = 3,800) found that exposing a model's full
  workings made people worse at spotting its large mistakes, apparently from
  information overload; they suggest hiding detail until asked for.
  [poursabzi-sangdeh-2021-interpretability Abstract; §8]

## Where sources disagree

- **Do explanations reduce over-reliance?** Bansal: no, they raise acceptance
  whether the AI is right or wrong. Buçinca: only if people are made to
  engage. Zhang: no change in reliance. Vaccaro: no significant effect on
  performance. Vasconcelos: yes, when checking the explanation is much
  cheaper than doing the task; they attribute the null results to
  explanations as costly to check as the task (§10.2).
- **Should the reviewer commit first?** Buçinca: more correct decisions when
  the AI is wrong. Fogliato: less agreement whether or not the AI was right,
  and the AI rated less useful.
- **Does confidence help?** Bansal: answer plus confidence was enough to beat
  both. Zhang: it changed reliance, not accuracy. Vaccaro: no significant
  effect.
- All seven sources are peer-reviewed, but most used crowd workers on
  low-stakes tasks; only Fogliato studied professionals (19).

## What this means for the guide

- **An explanation must make checking faster than redoing the work.** Put the
  source evidence beside the AI's answer, highlighted, so the check is a
  glance; drop explanations that take as long to read as the task.
- **Keep detail collapsed by default**, opened on request.
- **Keep the AI's verdict off the item itself.** Evidence comes first in
  reading order; the verdict sits apart, beside the decision buttons
  (Bansal's warning; untested as a layout).
- **A confidence figure needs** a check that it matches real accuracy and
  frequency wording ("right about 8 in 10 on cases like this"); U01 adds a
  named action per level. Alone, do not expect it to improve decisions.
- **Name what the reviewer knows that the AI does not.** If the brief
  cannot, the review is unlikely to catch errors.
- **Use commit-before-reveal only on the few items where it is likely to
  matter, such as those the AI is unsure of:** it catches more AI errors, but
  reviewers like it less and may discard correct advice.
- **Judge the screen by errors caught, not by reviewer preference**; in
  Buçinca the two ran in opposite directions.
