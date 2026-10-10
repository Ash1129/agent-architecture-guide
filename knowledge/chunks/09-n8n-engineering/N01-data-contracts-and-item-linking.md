---
id: N01
title: n8n data contracts, item linking and reusable workflows
topic: n8n-engineering
sources: [n8n-2026-data-structure, n8n-2026-item-linking, n8n-2026-merge, n8n-2026-subworkflows]
last_verified: 2026-10-10
---

## Claims

- Data travels between nodes as an array of items. Structured values belong
  under `json`; files use `binary`. Nodes generally process incoming items
  individually, so two input records can cause two external operations.
  `$json` references the current item's values. [n8n-2026-data-structure
  §Data structure; §How data flows within nodes; §Understand what you're mapping with drag and drop]
- `$('Earlier node').item` follows item provenance. Missing pairing information,
  multiple ancestors, or a different branch can make the reference fail. Code
  that changes items must preserve the appropriate input/output pairing.
  Positional access such as `.first()` requires knowing which position is correct.
  [n8n-2026-item-linking §Item linking errors; §Fix for 'Info for expressions missing from previous node']
- Merge's Append mode outputs the inputs consecutively. Combine by Matching
  Fields joins by values; Position joins by index. Output type determines which
  unmatched records remain. Multiple-match and field-clash settings affect the
  result. [n8n-2026-merge §Append; §Combine; §Combine mode options]
- Sub-workflows can define named, typed inputs or a JSON example. Accept all
  data leaves missing-value and consistency handling to the sub-workflow. The
  final node returns data to the caller, and settings can restrict which workflows
  may call it. [n8n-2026-subworkflows §Create the sub-workflow; §How data passes between workflows]

## What this means for the guide

These are implementation recommendations inferred from the documented behavior,
not claims that importing a generated workflow enforces a schema.

- Describe each boundary: record identifier, required fields, types, optional
  values, binary attachments and expected item count. Validate before sending
  records to an external action. Decide explicitly whether invalid input stops
  the batch or goes to a separate handling path.
- Prefer current-item fields for local transformations. When reshaping, filtering
  or expanding records in Code nodes, preserve provenance and check the mapping
  with multiple distinct records. Never silence a linking error by selecting
  the first item unless that is the intended business rule.
- Join independent datasets by a stable business identifier when order is not
  guaranteed. Choose Append only when concatenation is intended. Specify how
  duplicates, unmatched keys and conflicting fields should behave.
- Extract reusable operations into small sub-workflows with explicit inputs and
  outputs. Validate inputs inside the operation as well as describing their types;
  an input definition is not proof that business rules have been satisfied.
- Acceptance examples: zero items, one item, several customers, missing IDs,
  reordered branches, duplicate join keys and unmatched records. Assert both
  output count and identity: customer A's message must never contain customer B's
  values. These examples are proposed tests, not executed n8n results.

## Source links

- [n8n-2026-data-structure](https://docs.n8n.io/build/work-with-data/understand-n8ns-data-structure.md)
- [n8n-2026-item-linking](https://docs.n8n.io/build/work-with-data/reference-data/link-data-items/item-linking-errors.md)
- [n8n-2026-merge](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge)
- [n8n-2026-subworkflows](https://docs.n8n.io/build/flow-logic/break-workflows-into-smaller-parts.md)
