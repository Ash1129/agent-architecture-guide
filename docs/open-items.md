# Open items

What's still open in the Blueprint app (the Agent Architecture Guide). Kept up
to date as work lands: items move to **Done** with their commit, and new gaps
are added as they're found.

Last updated: 2026-10-16, after the decided-approach fix (`e7f0fac`). Items are renumbered as they close; the Done section names what each commit covered.

## Next up

1. **Designs must keep the decided shape.** The AI design can drop part of the
   shape the decision chose; for customer emails, the decision said "sort
   first, then the agent" and the design left out the sorting step. Require it
   in the design limits (`server/design.ts`, `checkDesign` in
   `src/lib/design.ts`), now that designs pass first time far more often.
2. **AI-decision mode for the evaluation.** `npm run eval:guide` still scores
   the rules. Add a mode that scores the AI's decisions on the 24 synthetic and
   7 source-backed cases, so the two can be compared.
3. **Requirements question in plain English.** Options such as "AI-generated
   code must run in an isolated, restricted environment" and "partition-aware
   backfills" don't fit a business owner, and appeared even for a dental
   clinic. Reword or narrow them (`src/lib/questions.ts`, `requirements`).

## Improvements

4. **Automation decisions repaired every time.** On both transformer-load
   runs the first AI decision was rejected with "Plain automation started
   this way uses 'pipeline'" and fixed in the repair round. Say in the
   decision prompt (`server/decide.ts`) that automation always takes the
   pipeline shape, so the repair round and its wait are not needed.
5. **Faster decisions.** Each decision reads about 28,000 tokens, mostly 22
   knowledge-base chunks (`DECIDE_CHUNKS` in `server/decide.ts`). Fewer, better
   chosen chunks would cut the wait, at the cost of less research per decision.
6. **Kit sections dropped for one long item.** A "build notes" section was
   dropped because one item was too long; shorten over-long items instead, as
   design labels now are (`checkKitText` in `src/lib/kittext.ts`).
7. **Scale the delivery contract to the design.** It asks for a browser app by
   default even for plain automation or a manual playbook, and its one example
   is resume tailoring (`src/lib/delivery.ts`).
8. **Budget question.** Cost and effort estimates exist; a budget answer could
   then flag an estimate over budget and suggest cheaper choices.
9. **Harder benchmark cases.** The n8n/Airflow and n8n/LangGraph pilots tie
   because every case is easy. Add a crash mid-run, an approval that waits
   overnight, and the same event delivered twice; then show scoped benchmark
   evidence in the app.
10. **Audit other rule overlaps.** H1/H4 lost advice by "first match wins"
    (fixed with H6). Check the agent main-tool rules (TL5 to TL7) and others for
    the same problem.

## Checks not yet done

11. **Phone width** for the split page and the system map.
12. **"How the guide decides" draw.io diagram** predates H6 and AI decisions;
    regenerate it if it's still needed.

## Larger, later

13. **Sharing.** The published site has no AI and there is no hosted backend;
    History is per browser; a system link runs to 3,000+ characters.
14. **Multi-job systems.** Jobs connect only by handoffs (no shared component
    such as one approved-vendor gateway); at most four jobs; going back from a
    later job restarts the split from job 1.
15. **Model and product names** are updated by hand (`LAST_REVIEWED`, M01, M04)
    and need re-checking before each release.

## Parked by the owner

16. **AI design rejections** (task chip "Reduce AI design rejections by
    checkDesign"). Partly addressed in `8ccbda3`: misused tool steps and long
    labels are now corrected. Missing research citations still send a design
    back for repair.
17. **Independent review** of the 14 deferred manual evaluation checks.

## From reviewer feedback on the Kushim deliverable (2026-10-14)

Most of this landed as general rules (see Done). What remains:

18. **Precondition gates.** A requirement that must hold before processing
    (a notice live for N days per requisition) is a gate on the whole flow,
    not a step that fires and proceeds. Nothing expresses this yet; the
    opt-out branch from the same feedback is done (AU12's "Human review on
    request" gate).
19. **Jurisdictions and regulatory mapping.** The location question is a
    single answer; a business in two jurisdictions (New York and Dublin) can't
    say so, so the design can't say where each region's data is processed.
    Chunk D04 lists what is high-risk but not the deployer obligations
    (Arts 9, 10, 11, 12, 13, 14, 15, 26). Where: `src/lib/questions.ts`,
    `knowledge/chunks/08-deployment-and-data/D04`.
20. **Counterfactual tests and a shadow-mode period in the kit.** AU12 asks
    for outcomes compared across groups; the kit's test set could include
    name-swap and counterfactual pairs and a shadow-mode first phase that
    produces the first comparison data. Where: `evals/examples.csv` in the
    kit (`src/lib/starter.ts`, `server/kit.ts`).
21. **The AI design's checker.** The rules' baseline picks an independent
    checker; an AI-drafted design's checker step is picked without knowing
    the producer, so it can coincide. Pass the producer into `pickModel` in
    `src/lib/design.ts` as `evaluator()` does.

## Done

- `e7f0fac` **Advice follows the decided approach.** The
  rules after the Approach group (models M1 to M10, checkpoints and guardrails
  AU9, AU10 and AU14, the simpler start S1 to S5, gotchas G1 to G19, first
  steps F1 to F3) read the draft's approach (`approachOf` in
  `src/lib/rules.ts`) instead of the answers' shape, so an AI decision that
  turns a judgement task into plain automation no longer shows AI-only
  gotchas, guardrails or a "run it in Claude with the most capable model"
  step, and a decision that adds AI steps to a rules-shaped task gets them.
  The autonomy start level and caps (AU1 to AU8) still follow the shape: they
  are the limits a decision is checked against. Tested in
  `tests/decision.test.ts`; the rules' own result is unchanged without a
  decision.
- (uncommitted, 2026-10-16) The jobs page moved from `#/guide/split` to
  `#/guide/jobs`: it shared its URL with the `split` question ("how do the
  parts relate"), so every judgement-shaped task hit a blank page at question
  3. `tests/router.test.ts` now checks every question has its own URL.
- (this commit) The rules' version of a result no longer waits for the AI
  version's build, so its kit (often a different main tool) can be opened;
  when the AI's main tool differs from the rules', the shortlist shows the
  rules' tool as the alternative; the switch names where it leads ("See the
  rules' version, built in Hermes Agent").
- `e56d5f3` An AI design's over-long step text is shortened at a word
  boundary instead of failing the design, and a missing field is named.
- `279381b` **Decisions about people, and reviews that
  mean something.** A "decides or recommends something about a person" risk
  answer; AU12 (cap at 2, adverse outcomes confirmed with evidence, human
  review on request, proxy details stripped, outcomes compared across groups,
  versions pinned), G33, F4; the evidence-packet step before any AI step;
  AU13 designed review for every level-2 design; AU14 credential scoping
  wherever AI acts behind an approval; independent checker with fixed checks
  when the stakes are high, as a rule and as an AI-decision limit; BUILD.md
  pins versions and keeps a decision record; the kit notes how to retire the
  practice it replaces. From the reviewer feedback this covers: safeguards as
  mechanisms (redaction step, credential scopes, every output approved),
  designed review, independent checker, version pinning and the decision
  record ("audited" is signalled by the answer), the opt-out branch, and
  retiring what the system replaces. It also closes the earlier "firm limit
  for checking sensitive work" item.

- `8ccbda3` AI makes the decisions within the rules' limits; decision and design
  slips corrected instead of rejected; cogitating animation; growing start box;
  short task titles.
- `9057efb` How it decides page describes what AI does.
- `b79a097` Haiku 4.5 replaced with Haiku 5.5; DeepSeek-V3.2 with V4-Pro.
- `03a0864` Workflow opens on the diagram, walkthrough button in its corner.
- `e4e610f` One-option shortlists hidden; raw benchmark trials kept out of git.
- `8606485` Survey progress-bar spacing restored.
- Earlier in this workstream: multi-job systems and the system map, H6 hosting
  rule, cost and effort estimates, draw.io exports.
