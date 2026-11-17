---
id: U03
title: Usability rules for work screens, and how well each is supported
topic: interfaces
sources: [nielsen-1994-ten-heuristics, nielsen-1993-response-times, nielsen-2006-progressive-disclosure, gsa-2026-plain-language-guides, govuk-2026-error-message, proctor-2018-hicks-law, scheibehenne-2010-choice-overload]
last_verified: 2026-11-16
---

## Claims

- Nielsen's ten heuristics are "broad rules of thumb", not specific
  guidelines. He developed them with Rolf Molich in 1990 and refined them in
  1994 from a factor analysis of 249 usability problems. The article reports
  no experiment testing them (tier D).
  [nielsen-1994-ten-heuristics summary; Note from Jakob]
- The ten, as checks [nielsen-1994-ten-heuristics 1–10]:
  1. **System status:** people are told what is going on, promptly
  2. **Real-world match:** the users' words, not internal jargon
  3. **Control:** undo, and a clearly labelled way out
  4. **Consistency:** the same word or action always means the same thing
  5. **Error prevention:** constraints, defaults, confirmation of risky
     actions
  6. **Recognition, not recall:** options are visible, not remembered
  7. **Efficiency:** shortcuts for experienced users
  8. **Minimalism:** nothing irrelevant or rarely needed
  9. **Error recovery:** plain language, no codes, a fix offered
  10. **Help:** best if none is needed; otherwise in context, as steps
- Three response-time limits [nielsen-1993-response-times main section]:
  - **0.1 s** feels instantaneous; showing the result is enough
  - **1 s** keeps the flow of thought; the delay is noticed
  - **10 s** is about the limit of attention; past it people turn to other
    tasks, so the system should say when it expects to finish
- Over 10 seconds, show a percent-done indicator and a way to interrupt. If
  the amount of work is unknown, show items done so far, with a spinner as
  the last resort. For 2 to 10 seconds a lighter busy indicator is enough.
  Waits over 10 seconds are acceptable only at natural breaks in the work.
  [nielsen-1993-response-times main section; Web-Based Application Response Time]
- The page credits the limits to Miller (1968) and Card et al. (1991).
  Neither could be opened here, so the numbers rest on Nielsen's summary
  (tier D). [nielsen-1993-response-times References]
- **Progressive disclosure** shows a few core options first and moves
  advanced or rare ones to a secondary screen. Nielsen argues from examples
  and gives no data. Two conditions: frequently needed items are up front,
  and the way to the second level is obvious. More than two levels
  "typically have low usability".
  [nielsen-2006-progressive-disclosure Benefits; Usability Criteria]
- **Plain language** (US federal guidance, tier C): write for the specific
  audience, in language it is comfortable with.
  [gsa-2026-plain-language-guides Principles §Choose your words carefully]
- Its checkable rules: active voice, so it is clear who must do what; one
  idea per sentence; paragraphs of at most 150 words; everyday words, with
  an unavoidable technical term defined where it is used; one term per
  concept. [gsa-2026-plain-language-guides Writing §Use the active voice;
  Writing: Clear and short; Principles: Avoid jargon; Principles: Short and
  simple]
- **Error messages** (GOV.UK Design System, tier C). A message explains what
  went wrong and how to fix it, reuses the wording of the field's label, and
  is specific: "An error occurred" is not acceptable. It avoids jargon and
  words such as "invalid" and "oops". It appears next to the field and in a
  summary at the top, and nothing the person typed is cleared.
  [govuk-2026-error-message §How to write; placement guidance]
- GOV.UK says users in live services understood such messages and could
  recover, but publishes no data. [govuk-2026-error-message §Research]
- **Hick's law** relates choice reaction time to the number of
  alternatives. A 2018 review calls it widely accepted but lists limits:
  stimulus-response compatibility, practice, very large sets and sequence
  effects. Only the abstract was read.
  [proctor-2018-hicks-law Abstract]
- **Choice overload:** a meta-analysis of 63 conditions from 50 experiments
  (N = 5,036) found the mean effect of more options was "virtually zero",
  with wide variation between studies. Only the abstract was read.
  [scheibehenne-2010-choice-overload Abstract]

## Where sources disagree

- Heuristic 8 and progressive disclosure say to show less; the
  meta-analysis finds no reliable harm from more options. Only the
  meta-analysis is quantitative, and it supports no fixed maximum.

## What this means for the guide

- Check each generated screen, yes or no:
  - the item's status and the system's status are both shown
  - labels use the staff's own words, one term per concept
  - every change can be undone or cancelled; a risky one asks for
    confirmation
  - the first view holds only what the decision needs; the rest is one
    labelled step away, with at most two levels
- Waiting: 1 to 10 seconds needs a busy indicator; over 10 seconds needs
  progress, an expected finish and a way to carry on with other work.
- Text: active voice, one idea per sentence, paragraphs under 150 words.
- Every error message says what happened, in the label's words, and what to
  do next; it sits by the field and keeps what was typed.
- Set no "maximum number of options" rule; remove options only because
  they are rarely needed.
- Present these as a checklist from practice, not as measured findings.
