# Knowledge base

The single source of truth for the Agent Architecture Guide. Every rule,
model pick and tool recommendation in the site should trace back to a chunk
here, and every chunk traces back to sources that were actually read.

## How it is organised

```
knowledge/
  README.md        this file: format and rules
  INDEX.md         one line per chunk: start every lookup here
  sources.md       every source, with a stable ID and an evidence tier
  chunks/
    01-foundations/   what an agent is; workflows vs agents; when to use one
    ...               one folder per topic
```

Retrieval works like RAG: read `INDEX.md`, pick the chunks whose summary
matches the question, and open only those. Never load the whole folder.

## Chunk format

Each chunk is one self-contained idea, roughly 300 to 800 words, readable
without any other chunk.

```markdown
---
id: F01                      # topic letter + number; never reused or renumbered
title: What counts as an agent
topic: foundations
sources: [anthropic-2024-effective-agents, openai-2025-practical-guide]
last_verified: 2026-10-05    # when the sources were last re-read
---

## Claims
- One claim per bullet, each ending with its source and location,
  e.g. [anthropic-2024-effective-agents §What are agents?].

## Where sources disagree      (only when they do)

## What this means for the guide
- How the claims turn into decisions. This is synthesis, not a source:
  anything here must follow from the claims above.
```

## Rules

1. **Read before citing.** A claim is only written from a source that was
   opened and read for this knowledge base. Sources that could not be opened
   are listed in `sources.md` as unread and are never cited.
2. **Paraphrase.** Claims are restated in plain English. Direct quotes are
   short (under 15 words), only where the exact wording matters.
3. **Locate every claim.** Each claim names the section, page or heading it
   comes from, so it can be checked in under a minute.
4. **Weigh the evidence.** `sources.md` gives each source a tier. A peer-reviewed
   result and a vendor's advice are not equal; chunks say which is which.
5. **Keep synthesis separate.** "What this means for the guide" is the only
   place for interpretation, and it must not introduce new facts.
6. **Disagreements are recorded, not resolved silently.**

## Evidence tiers (used in sources.md)

| Tier | Meaning |
| --- | --- |
| A | Peer-reviewed paper or accepted conference/journal paper |
| B | Preprint or technical report with a stated method and data |
| C | Official documentation or guide from the organisation that builds the tool or model |
| D | Practitioner or vendor blog, opinion or comparison |
| E | Course materials and the team's own research notes |
