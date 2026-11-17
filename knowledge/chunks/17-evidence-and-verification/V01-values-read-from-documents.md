---
id: V01
title: Values an AI reads from documents - quote, locate, then check in code
topic: evidence-and-verification
sources: [anthropic-docs-reduce-hallucinations, anthropic-docs-citations]
last_verified: 2026-11-17
---

## Claims

- A language model can produce text that is wrong or inconsistent with the
  material it was given. [anthropic-docs-reduce-hallucinations introduction]
- Giving the model explicit permission to say it does not know reduces false
  information. [anthropic-docs-reduce-hallucinations §Basic hallucination minimization strategies]
- For long documents (over about 20,000 tokens), asking for word-for-word
  quotes first, and then doing the task from those quotes only, grounds the
  answer in the text. [anthropic-docs-reduce-hallucinations §Basic hallucination minimization strategies]
- An answer becomes auditable when each claim cites a quote and its source.
  A second pass can look for a supporting quote for each claim and withdraw
  any claim that has none. [anthropic-docs-reduce-hallucinations §Basic hallucination minimization strategies]
- Running the same prompt several times and comparing the outputs is a check:
  outputs that disagree may indicate a made-up answer.
  [anthropic-docs-reduce-hallucinations §Advanced techniques]
- These techniques reduce the problem and do not remove it; the page says to
  validate critical information, above all for high-stakes decisions.
  [anthropic-docs-reduce-hallucinations §Advanced techniques, note]
- Claude's Citations feature returns, with an answer, the exact passages that
  support each claim and where they sit in the document. Because the API
  extracts the cited text itself, the pointers are guaranteed to refer to the
  documents provided. [anthropic-docs-citations opening section]
- For PDFs the text is extracted and split into sentences, and images in a
  PDF cannot be cited. [anthropic-docs-citations §How citations work]
- Citations cannot be combined with structured outputs: a request that turns
  on both is rejected. [anthropic-docs-citations §Feature compatibility]
- The cited text does not count toward output tokens.
  [anthropic-docs-citations §Token costs]

## What this means for the guide

- When an AI step reads a value that later steps rely on (an amount, a date,
  a name, a clause), the value should travel with the document, the place in
  it and the exact words it was read from. That pointer is the audit trail,
  and it is what a reviewer needs beside the value.
- A valid pointer shows the words are in the source. It does not show the
  value was read correctly from them, so the form of each value (a date is a
  date, parts add up to their total) is checked in code after the AI step.
- "I don't know" has to be a value the design can carry: stored as unknown,
  and stopping the steps that depend on it.
- Scanned pages and photos are images, which the Citations feature cannot
  point into. For those, keep the page reference and confirm the value some
  other way: a second independent read, or a cross-check with another
  document, with disagreements sent to a person.
- A step cannot both cite and return a fixed data shape in one request. Plan
  two moves: read with quotes, then shape the result in code or a second call.
- Two reads that disagree are a cheap signal that a value needs a person.
