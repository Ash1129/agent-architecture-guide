---
id: U04
title: Accessibility thresholds, the states of a screen, and tables for decisions
topic: interfaces
sources: [w3c-2023-wcag22, ibm-2026-carbon-empty-states, ibm-2026-carbon-loading, aws-2026-cloudscape-loading-refreshing, sarikaya-2018-dashboards, govuk-2026-table, laubheimer-2022-data-tables]
last_verified: 2026-11-16
---

## Claims

- These level A and AA criteria of WCAG 2.2, a W3C Recommendation, can be
  measured on a design [w3c-2023-wcag22, by criterion number]:
  - **1.4.3 Contrast (AA):** text at least 4.5:1 against its background;
    3:1 for large text (18 pt, or 14 pt bold).
  - **1.4.11 Non-text contrast (AA):** 3:1 against adjacent colours for
    what identifies a control or its state, and for meaningful graphics.
  - **1.4.1 Use of colour (A):** colour is never the only way information
    or an action is shown.
  - **1.4.10 Reflow (AA):** no loss of content or function, and no
    two-way scrolling, at 320 CSS pixels wide. Data tables are a named
    exception.
  - **2.1.1 Keyboard (A):** every function works from the keyboard.
  - **2.4.7 Focus visible (AA):** the keyboard focus indicator is visible.
  - **2.4.11 Focus not obscured (AA):** the focused control is
    not entirely hidden by content the author placed.
  - **2.5.8 Target size (AA):** pointer targets at least 24 by 24 CSS
    pixels. Smaller ones pass if 24-pixel circles centred on each do not
    overlap, or if the target is a link in a sentence.
  - **3.3.2 Labels (A):** every input has a label or instruction.
  - **3.3.1 Error identification (A):** a detected input error names the
    item and describes the error in text.
  - **4.1.3 Status messages (AA):** assistive technology can announce a
    status message without it taking focus.
  - **2.2.2 Pause, stop, hide (A):** information that updates by itself
    beside other content can be paused, stopped or hidden, unless the
    updating is essential.
- States, from design-system guidance (tier C):
  - **Empty** replaces the element that would normally show, table headers
    included. It says what will appear and gives one next action. First
    use, "nothing matched" and error are different empty states.
    [ibm-2026-carbon-empty-states types; placement; writing guidance]
  - **Loading** uses skeleton placeholders for tables and cards, not
    buttons or inputs, for a few seconds only; longer work gets a progress
    indicator. [ibm-2026-carbon-loading §Skeleton states; §Loading indicators]
  - Skeleton rows are preferred to a spinner for tables because they keep
    the column layout. [aws-2026-cloudscape-loading-refreshing §Loading]
  - **Partial:** slow pages such as dashboards load in batches, structure
    and labels first, data after. [ibm-2026-carbon-loading §Progressive loading]
  - **Error:** a partial or total failure gets a warning that explains what
    failed and offers an action such as retry.
    [aws-2026-cloudscape-loading-refreshing §Refresh issues]
  - **Changed:** data stays visible and usable during a refresh; afterwards
    a "Last updated" time is shown and announced to screen readers. Edits
    in progress are not covered.
    [aws-2026-cloudscape-loading-refreshing §Manual refresh; accessibility guidelines]
- Sarikaya et al. coded 83 dashboards and reviewed studies of dashboards in
  use. "Dashboard" covers several practices, so design principles for one
  kind may not transfer to another.
  [sarikaya-2018-dashboards §3.1; §6.1]
- Two of their seven clusters serve decisions: strategic and operational.
  Over three-quarters of these carried benchmarks (targets, thresholds,
  status lights). An operational designer may put the most critical
  information where it is most prominent.
  [sarikaya-2018-dashboards §4; §3.5; §6.1]
- In the studies they reviewed, even filters were often too complex for
  casual users, constant detail led to overload and worse decisions, and
  stating the data's source and certainty was seen as important for trust.
  [sarikaya-2018-dashboards §5.2.2; §5.3.1]
- They consulted no users and call their sample unrepresentative.
  [sarikaya-2018-dashboards §7]
- GOV.UK: a table is for comparing information in rows and columns, never
  for layout. It has a caption and marked headers, right-aligns compared
  numbers, and holds as little data as possible.
  [govuk-2026-table whole page]
- NN/g (tier D, its own test observations, no sample sizes): work tables
  serve four tasks: finding records, comparing them, viewing or editing one
  row, and acting on records. It advises a human-readable first column,
  frozen headers, a visible sign that filters are active, checkboxes for
  batch actions, and editing in a side panel, not a modal that hides
  neighbouring rows.
  [laubheimer-2022-data-tables task sections]

## What this means for the guide

- Test every generated screen for:
  - text contrast 4.5:1; large text, control outlines and icons 3:1
  - every status shown by text or icon as well as colour
  - targets 24 by 24 CSS pixels or spaced to match
  - every action reachable by keyboard, with visible, uncovered focus
  - no sideways scrolling at 320 pixels, tables excepted
  - a label on every input; errors in text that name the field
- The brief names five states per screen: empty, loading, partial, error,
  changed. A refreshing queue shows "last updated" and can be paused.
- A manager's page gives each number a target or threshold, puts the most
  critical first, states the data's source, and needs no filter.
- A table starts with a human-readable name, right-aligns numbers, keeps
  headers in view, and edits a row in a side panel.
- No source here covers an item changing while someone reviews it; that
  rule needs its own evidence.
