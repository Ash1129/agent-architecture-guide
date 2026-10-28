# Open items

What's still open in the Blueprint app (the Agent Architecture Guide). Kept up
to date as work lands: items move to **Done** with their commit, and new gaps
are added as they're found.

Last updated: 2026-10-28, after running a third brief (a B2B lead-scoring and routing system in a CRM) through the guide as three jobs, building the system from its output, and folding in the owner's answers to follow-up questions (items 30 to 39). Items are renumbered as they close; the Done section names what each commit covered.

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

4. **The rules' own designs can't pick a statistical method.** Only the AI
   design can choose a control chart, capability index, reliability model or
   risk ranking (`FIXED_METHODS` in `src/lib/design.ts`), because the rules
   read answers, not the task's words. A rule that reads the task text the
   way retrieval does (`statisticalTask` in `server/knowledge.ts`) could put a
   control-chart decision in the rules' baseline for monitoring tasks, so the
   published site (no AI) gets it too.
5. **Automation decisions repaired every time.** On both transformer-load
   runs the first AI decision was rejected with "Plain automation started
   this way uses 'pipeline'" and fixed in the repair round. Say in the
   decision prompt (`server/decide.ts`) that automation always takes the
   pipeline shape, so the repair round and its wait are not needed.
6. **Faster decisions.** Each decision reads about 28,000 tokens, mostly 22
   knowledge-base chunks (`DECIDE_CHUNKS` in `server/decide.ts`). Fewer, better
   chosen chunks would cut the wait, at the cost of less research per decision.
7. **Kit sections dropped for one long item.** A "build notes" section was
   dropped because one item was too long; shorten over-long items instead, as
   design labels now are (`checkKitText` in `src/lib/kittext.ts`).
8. **Scale the delivery contract to the design.** It asks for a browser app by
   default even for plain automation or a manual playbook, and its one example
   is resume tailoring (`src/lib/delivery.ts`).
9. **Budget question.** Cost and effort estimates exist; a budget answer could
   then flag an estimate over budget and suggest cheaper choices.
10. **Harder benchmark cases.** The n8n/Airflow and n8n/LangGraph pilots tie
   because every case is easy. Add a crash mid-run, an approval that waits
   overnight, and the same event delivered twice; then show scoped benchmark
   evidence in the app.
11. **Audit other rule overlaps.** H1/H4 lost advice by "first match wins"
    (fixed with H6). Check the agent main-tool rules (TL5 to TL7) and others for
    the same problem.

## Checks not yet done

12. **Phone width** for the split page and the system map.
13. **"How the guide decides" draw.io diagram** predates H6 and AI decisions;
    regenerate it if it's still needed.

## Larger, later

14. **Sharing.** The published site has no AI and there is no hosted backend;
    History is per browser; a system link runs to 3,000+ characters.
15. **Multi-job systems.** Jobs connect only by handoffs (no shared component
    such as one approved-vendor gateway); at most four jobs; going back from a
    later job restarts the split from job 1.
16. **Model and product names** are updated by hand (`LAST_REVIEWED`, M01, M04)
    and need re-checking before each release.

## Parked by the owner

17. **AI design rejections** (task chip "Reduce AI design rejections by
    checkDesign"). Partly addressed in `8ccbda3`: misused tool steps and long
    labels are now corrected. Missing research citations still send a design
    back for repair.
18. **Independent review** of the 14 deferred manual evaluation checks.

## From reviewer feedback on the Kushim deliverable (2026-10-14)

Most of this landed as general rules (see Done). What remains:

19. **Precondition gates.** A requirement that must hold before processing
    (a notice live for N days per requisition) is a gate on the whole flow,
    not a step that fires and proceeds. Nothing expresses this yet; the
    opt-out branch from the same feedback is done (AU12's "Human review on
    request" gate).
20. **Jurisdictions and regulatory mapping.** The location question is a
    single answer; a business in two jurisdictions (New York and Dublin) can't
    say so, so the design can't say where each region's data is processed.
    Chunk D04 lists what is high-risk but not the deployer obligations
    (Arts 9, 10, 11, 12, 13, 14, 15, 26). Where: `src/lib/questions.ts`,
    `knowledge/chunks/08-deployment-and-data/D04`.
21. **Counterfactual tests and a shadow-mode period in the kit.** AU12 asks
    for outcomes compared across groups; the kit's test set could include
    name-swap and counterfactual pairs and a shadow-mode first phase that
    produces the first comparison data. Where: `evals/examples.csv` in the
    kit (`src/lib/starter.ts`, `server/kit.ts`).
22. **The AI design's checker.** The rules' baseline picks an independent
    checker; an AI-drafted design's checker step is picked without knowing
    the producer, so it can coincide. Pass the producer into `pickModel` in
    `src/lib/design.ts` as `evaluator()` does.

## From running a long, prescriptive brief through the guide (2026-10-25)

A second course brief was run end to end: the guide's result, then a working
system built from it (its run record and both kits are kept with that
project). The brief was 8,500 characters and prescribed its own architecture.
What that showed, kept general; none of it is a rule about that domain:

23. **"Keep it as one job" designs from a 1,000-character slice.** When the
    brief is longer than `MAX_DESCRIPTION` (`src/lib/interview.ts`) and the
    user keeps it as one job, `onKeepOne` (`src/App.tsx`) carries job 1's
    short text, not the brief, so the interview, decision and kit read a
    fraction of what was pasted. A 994-character rewrite of the same brief
    was the workaround. Pass the full text (or a summary made from all of
    it) when the user keeps one job.
24. **Stuck "reading" overlay after keep-as-one.** The interview request
    returned 200 but a duplicate was aborted and the overlay never cleared; a
    reload recovered it. Clear the overlay on the first completed request.
25. **Honour a stated architecture, or say why not.** The brief said in so
    many words that the system must be N separate agents on a named
    framework, with roles that may not be merged. The decision (`server/decide.ts`)
    recommended a workflow tool and no agent, and the rules' version a chat
    app, with no mention of the mandate. When a brief states a framework, a
    topology or a role split as a requirement, the decision should either
    take it as a constraint or name it and explain the deviation. A
    requirements option ("the architecture is prescribed: ...") would carry
    it into the rules too.
26. **Conversations with end users are not designed.** A task where one
    component talks to the public (one question at a time, plain language,
    resumable sessions, tolerance for drift, honest "I don't know") got no
    design for that conversation: no slot for who speaks to the user, what
    they may and may not ask, or how a session resumes. Add an intake/
    conversation section to the design when a job's input is a dialogue.
27. **Scope gates and escalation conditions as first-class output.** The
    brief listed the cases that must stop for a person (out of scope,
    conflicting sources, advice requests, ambiguity, signals of abuse). The
    kit has AU-rule checkpoints but no place that lists *this system's*
    stop conditions with a reason and a citation each. The build needed
    that list on day one; the kit could draft it from the brief and the
    requirements answers.
28. **Bounded cycles and loop guards.** The rulebook says a checker must not
    fix (kept, and it held up in the build), but says nothing about bounding
    a review-then-revise cycle or guarding against two components handing
    work back and forth. The build needed a maximum number of rounds, a
    handoff ceiling, a pattern detector and a test that trips it. Add this
    to the gotchas for any design with a checker that can send work back
    (`src/lib/rules.ts`, G-series) and to the kit's test list.
29. **Measured context strategies.** The kit recommends keeping prompts
    small but does not ask for a measurement. A with/without run over a
    batch of items (tokens per item, both curves) was a one-page document
    and the most convincing evidence in the deliverable. Ask for it in the
    kit's evaluation section when a job processes a sequence of items in one
    thread.

What held up without change: numbers from deterministic tools only, the
provenance record per value, an independent checker on a different model,
and the human gate as an interrupt rather than a waiting step.

## From running a lead-scoring brief through the guide as three jobs (2026-10-27)

A third brief was run end to end: a system that scores incoming sales leads in
a CRM, routes them to a capacity-limited team and learns from outcomes. The
split gave three jobs (score, route, learn), which was right, and the system
was built from the three kits (run record and kits kept with that project).
What it showed, kept general; none of it is a rule about sales or CRMs:

30. **No learned-model method.** When the answers say "memory of past work, so
    it improves over time" and the task is to predict an outcome from
    structured fields, the guide turns the memory into a reference library of
    examples for a prompt and the learning into a hand-tuned rules table. The
    catalog's no-AI methods are control chart, capability index, reliability
    model and risk ranking (`FIXED_METHODS`, `src/lib/design.ts`); there is no
    "trained statistical model" (logistic regression, gradient boosting) with
    calibration, a time-ordered validation split and retraining. For a
    prediction task the result is a better-governed version of the points
    model the owner already has. Add the method to the catalog and let the
    decision and design reach it when the task is a prediction with outcome
    labels; a gotcha that an LLM rubric cannot learn from outcomes.
31. **"Likelihood" is a probability, not points.** A task that asks for a
    likelihood, a probability or one number two teams share needs a
    calibrated probability; a 0-100 points total can't be compared with the
    observed rate. The kit should say so where the output format is defined.
32. **Capacity cut-offs in the brief should reach the design.** "We can only
    work N of M" is the quantity that decides what good looks like (precision
    in the top N) and where the review band sits. The result's rank was "a
    saved view sorted by score" and no metric was named. When a brief states
    a capacity, carry it into the quality checklist, the metric in the
    evaluation section, and the routing step.
33. **Selection bias in feedback loops.** When outcomes exist only for the
    items a person chose to act on, a model trained on them learns the
    person's past preferences. The design and kit had no holdout, exploration
    slice or "not acted on is unlabelled, not negative". Add a gotcha for any
    design with a learning loop where a human selects what gets an outcome.
34. **Label delay.** A scheduled learning job compared this period's early
    outcome (a booking, days) and late outcome (a close, months) as one feed.
    Where outcomes mature at different speeds, the design should name the
    maturity window per label and exclude immature items rather than count
    them as failures.
35. **Invented required fields.** The AI design for the routing job required a
    "territory or region" value and flagged leads without one, although the
    answers said "round-robin only" and the brief said no geographic
    restriction; every record would have been flagged incomplete. `checkDesign`
    could compare a validation step's required fields against the answers and
    the task text, or the design prompt could forbid requiring fields the
    task doesn't mention.
36. **Numbers drift in the split.** The split rewrote "12 reps work about 500
    a month" as "each rep can work about 500 a month" and the error travelled
    into the routing job's description and reasoning. The split could be
    told to copy figures verbatim, and the jobs page could show the brief's
    numbers beside each job for the owner to check.
37. **"About a person" not ticked for a ranking of people.** The adaptive
    interview did not tick "decides or recommends something about a person"
    for a system that ranks identifiable contacts for a sales call (seen
    before on the tax brief). The interview prompt could ask the question
    whenever the subject of the task is a person, and let the owner untick.
38. **Kit copied mid-tailoring, and advice that doesn't fit a numeric task.**
    BUILD.md copied before tailoring finished embedded "n8n/workflow.json:
    not included yet" without saying so at the top; the "first steps" told
    the owner to "run the playbook in Claude on your examples", which fits a
    reading task, not a scoring model. Block or label the copy while a
    section is pending, and vary the first steps by the kind of work (F-series).

39. **Questions the interview never asked.** After the build, the owner was
    asked nine questions by email, and four answers changed the design: how
    complete each source's records are (~40% missing a key field,
    concentrated in the best sources), how fast work is picked up today (a
    3-day median, with a 2x effect inside a day), how long an outcome takes
    to arrive (a 30-day cycle), and what a win looks like at the review date
    (more output, faster, same headcount). None of them is specific to
    sales. Any task that ranks or routes work and learns from outcomes
    depends on them. The interview could ask them whenever "memory of past
    work" or a capacity limit is in the answers, and the design's quality
    checklist could carry the stated win as its first measure.

Seen again: the stuck "reading" overlay after an interview retry (item 24;
reload recovered it), and the requirements options in engineering jargon
(item 3). What held up: routing by the CRM's own source fields; a bounded AI
adjustment with quoted evidence checked by code; idempotent writes keyed by
record and version; the warning that a write can re-fire the trigger;
compare-and-set before assigning; an assignment counts only when owner and
alert both exist; a held queue that is someone's named job; a control chart
with a minimum group before a weight moves; one approver per team, one
version at a time, no batch approval; no individual named in a proposal.

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
- `329f016` **Quality control and reliability methods.** Three
  knowledge chunks from the SYSEN 5300 course notes (Q01 control charts and
  run rules, Q02 capability, Q03 reliability, system structure and FMEA; source
  `sysen-2026-5300-notes`); four no-AI methods in the catalog (control chart,
  capability index, reliability model, risk ranking) allowed on fixed and
  decision steps; retrieval reserves Q01 to Q03 for every design without AI
  and for any task whose words are about measurements, defects or failures
  (`statisticalTask`, `taskText` in `server/knowledge.ts`, used by decide,
  design and kit); the design prompt asks for the chart, index or model by
  name. Vitest no longer runs the desktop app's in-repo worktrees
  (`vite.config.ts`). Tests: `tests/quality-methods.test.ts`.
- `d9b104b` The jobs page moved from `#/guide/split` to
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
