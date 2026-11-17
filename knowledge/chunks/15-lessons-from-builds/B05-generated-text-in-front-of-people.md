---
id: B05
title: Generated text in front of people needs a checker, a fallback and a label
topic: lessons-from-builds
sources: [auxocase-2026-build]
last_verified: 2026-11-16
---

## Claims

The build in B01 began with one generative step (reading free-text notes) and
ended with eight: reasons, first messages, follow-ups, answers to replies,
call briefs, call write-ups, flags and approval verdicts. All of them follow
one pattern.

- Each generated text has a checker written in code and a template that takes
  over when the check fails. The page says which wrote the text and, when the
  model's draft was set aside, why. [auxocase-2026-build babca79]
  [auxocase-2026-build f31e495]
- The checks are specific. A draft is rejected if it mentions the score, rank
  or model; carries a link or an address; quotes words not in the record;
  uses a number not in the facts; leaves out the person's name; runs long; or
  implies a conversation that no call had. [auxocase-2026-build babca79]
  [auxocase-2026-build f9e5245]
- A fact from the web is kept only if the quoted page, fetched by code, holds
  the quote and the quote carries the fact. Only that one step may search or
  fetch; every other step runs with no tools. [auxocase-2026-build b67b706]
- Latency decided whether a step was used. A draft took 46 seconds with the
  model's extended thinking on by default and gave no sign of progress. With
  thinking off it took 4 to 7 seconds, and the short, checked answers lost
  nothing. [auxocase-2026-build 553a946]
- A prompt and its checker have to be changed together. With thinking off the
  model began offering "a 15-minute call"; the number check rejected every
  such draft until the prompt asked for "a short call".
  [auxocase-2026-build 553a946]
- The model was chosen by who reads the text: a mid-size model for short
  answers that code checks, the strongest for messages a customer reads.
  [auxocase-2026-build 40b4ace]
- Nothing was sent at first: the draft opened in the person's own mail app.
  Sending came later, after an edit-and-preview step, with a mode that sends
  every message to a test address the sender types.
  [auxocase-2026-build babca79] [auxocase-2026-build 14a2df6]
  [auxocase-2026-build cb87119]
- Reading replies uses a fixed list of kinds. Clear refusals close the item;
  an out-of-office note is not an answer and only moves the next step's date;
  anything else goes to the person. [auxocase-2026-build 9b552c2]
- The words on every page were rewritten for the role reading them. "Matured
  labels" became "outcomes" and "control arm" became "left alone"; a sentence
  for an approver is dropped if it uses a modelling word.
  [auxocase-2026-build 06fd6f1] [auxocase-2026-build b3dc579]

## What this means for the guide

- Every step that writes text a person will read or send needs three things
  in the design: a check in code, a fixed fallback, and a visible label
  saying which one produced the text.
- State a time budget for any step a person waits on, and choose the model
  and its thinking setting to meet it.
- Choose the model by reader: the strongest where a customer reads the words,
  a smaller one where code checks a short answer.
- Give each step only the tools it needs; most need none.
- Start with drafts a person sends themselves. Sending for them is a later
  switch (B03).
- Text shown to a role uses that role's words, and a checker can enforce it.
