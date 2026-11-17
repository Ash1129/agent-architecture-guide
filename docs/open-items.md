# Open items

What's still open in the Blueprint app (the Agent Architecture Guide). Kept up
to date as work lands: items move to **Done** with their commit, and new gaps
are added as they're found.

Last updated: 2026-11-17, after merging the published main into the metering branch: its items keep 40 to 53, and the items from the two build comparisons and the document-reading brief follow as 54 to 75. Latest work: a brief for a system that reads documents, computes from them and decides, run through the guide as three jobs (items 68 to 75), with seven more build practices, three researched knowledge chunks and two design-prompt lines. Items are renumbered as they close; the Done section keeps the record.

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
14. **Saved kit text loses sections when re-checked.** The telemetry page's
    first run showed the example's cached kit dropping its `route`, `tailor` and
    `check` briefs ("not an agent in this design") and its build notes on read.
    Find out whether the kit was cached for a different design or the checks
    changed since, and whether the cache key should include the design.
15. **No evaluation suite for the AI steps.** `npm run eval:guide` measures the
    rules only; telemetry shows pass rates in use but not whether a passing
    answer is good. A fixed set of tasks with graded AI decisions, designs and
    kit text is still needed.

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
    *Partly done:* the interview now asks them (Done, "Lessons from a
    built system"). Still open: the design's quality checklist carrying
    the stated win as its first measure.

Seen again: the stuck "reading" overlay after an interview retry (item 24;
reload recovered it), and the requirements options in engineering jargon
(item 3). What held up: routing by the CRM's own source fields; a bounded AI
adjustment with quoted evidence checked by code; idempotent writes keyed by
record and version; the warning that a write can re-fire the trigger;
compare-and-set before assigning; an assignment counts only when owner and
alert both exist; a held queue that is someone's named job; a control chart
with a minimum group before a weight moves; one approver per team, one
version at a time, no batch approval; no individual named in a proposal.

## From the final form of the lead-scoring build (2026-11-16)

The system built from the three-job result (items 30 to 39) was reworked into
its final form over 77 commits. Read end to end, the changes fall into five
groups, none of them about sales: the people's time is the capacity and most
of the building went into the work after the hand-off; rules written for one
large run broke when jobs ran every minute; approvals turned into rule-based
recommendations in the approver's words, then into an automatic sign-off with
an off switch; several reported numbers did not survive a second look; and
every generated text got a code check, a template fallback and a label. Those
are now knowledge chunks B01 to B05, four gotchas (G34 to G37), an approval
checkpoint (AU15) and new guidance for the interview's extra questions (see
Done). What the guide still doesn't do with them:

40. **"People act on the output" isn't an answer the guide has.** G34
    (people's minutes are the capacity) fires only when a person reviews the
    output (level 3 or below). A job that hands work to people and runs at
    level 4, as the routing job did, doesn't get it. Either add the question
    to the bank, or let a detail answer about who acts on the output reach
    the rules.
41. **The split stops at the decision.** The brief's jobs ended at the
    hand-off; drafting, following up, answering and booking came later and
    became most of the system. When a job hands work to people, the split
    could ask whether their follow-on work should be a job of its own.
42. **Capacity isn't in the cost section.** `src/lib/cost.ts` estimates the
    running cost of the system. It says nothing about the people's time, the
    capacity arithmetic (people × hours ÷ minutes per item), or the minutes
    each AI step returns, which is how the build ended up judging every step.
43. **No operations table.** G35 warns that rules depend on run frequency.
    The design and the kit still don't lay out, per job, how often it runs,
    how long one run may take, what happens on overlap and what a failure
    stops.
44. **Who steps in, by role.** The system map counts the points where people
    step in. The build needed, for each point, which role it is, what that
    role sees and decides, and its words for it; five roles became three once
    that was written down.
    *Partly done:* the kit's screens brief names a reviewer and an owner and
    what each sees and decides, in the task's words when the AI kit step
    supplies them (Done, "The screens people use"). Still open: more than
    two roles, and showing them on the system map.
45. **No demo mode in the kit.** Showing the build to its stakeholders needed
    a stand-in for the system of record with buttons for what the other
    system would do, a clock that could be moved to today, demo accounts per
    role and a script for each. The kit's first steps don't mention any of it.
46. **What unlocks the next level isn't generated.** F3 asks the owner to
    decide what earns more autonomy. The build's concrete form was a switch
    that is off by default, the count of checked outcomes that unlocks it, a
    comparison group left alone, and the name of whoever throws it. AU15
    covers approvals; the general line per design isn't written.
47. **The cost estimate is never compared with the meter.** The build
    metered every model call and reported cost per result; its first figures
    were assumptions. The result's monthly range could be shown beside the
    metered cost once the telemetry page lands.

The learned-model gap (item 30) stands, and the build's evaluation fixes
(one role per period, no refit, ranges over seeds) are what that method's
kit section should say when it is added.

## From adding the screens people use (2026-11-17)

Of the 77 commits that took the lead-scoring build from its first version to
its final one, 47 were about pages, layout and wording, and the kit had said
nothing about any of it. The kit now carries a screens brief and a short
prompt each for Lovable and Claude Design (see Done). Checked against the
build's final pages, the brief produces its queue, lead page, held queue,
overview and decisions page. What it does not do:

48. **One brief per job, not per system.** The build ended as one app for
    three roles across all three jobs. A system split into jobs gets a
    screens brief in each job's kit; nothing combines them into one app with
    the roles from every job.
49. **The screens are only in the kit.** The result page shows the two copy
    buttons under "what to build" but never shows the screens themselves.
    A short "who steps in and what they see" section belongs beside the
    design.
50. **No "Open in Lovable" link.** Lovable's docs describe a link that opens
    it with a prompt filled in (it never starts the build). The kit copies
    the prompt instead; the link's exact form was not read.
51. **Two lists in the queue.** The build split the queue into items waiting
    for the person and items the person had acted on and was waiting to hear
    back about. The brief has one list.
52. **"Changed since you looked" rests on one build.** No source read covers
    an item changing while someone reviews it; the rule comes from the build
    record (B02). It needs its own evidence.
53. **A03 says more than the experiments support.** A03 advises having the
    person form a view before seeing the AI's on important decisions. The
    experiments in U02 support that for a few high-stakes items only: it
    catches more AI errors, but people also discard correct advice and like
    the tool less. The brief applies it only where a mistake cannot be undone
    or the task decides about a person; A03 and AU13 should be reworded to
    match. Two of U02's layout points (the verdict beside the buttons,
    confidence in frequency words) follow the authors' warnings, not tested
    layouts.

The demo mode (item 45) is still open: the Lovable prompt starts on sample
data, which covers the screens but not a stand-in for the other system.

## From comparing a first build with the team's final system (2026-11-16)

The system built from the guide's kit for the long, prescriptive brief (items
23 to 29) was then worked on by a team for three weeks. Comparing the two
showed what the kit had left as warnings or prompt rules and the team had to
turn into structure. The general parts are now twelve build practices in
BUILD.md (`src/lib/practices.ts`, see Done). What that comparison leaves open,
kept general:

54. **No question for "people talk to it directly".** The conversation
    practice (P8) is switched on by "customers or partners will see the
    output" or "decides about a person", which is only a proxy. A question
    such as "who types into it: staff, or the people the work is about?"
    would switch it on exactly, and would let the design show an intake step
    (item 26).
55. **Practices are in the kit only.** The result page and "How it decides"
    don't show them, and the design diagram has no place for roles, the
    correction path or a routing table. Show the list on the Build view, and
    consider drawing who may act at each person step.
56. **The AI-written kit text doesn't know about the practices.** `server/kit.ts`
    could be given the list so its build notes and test cases point at them
    (awkward-user scripts for P8, a stand-in model that obeys injected text
    for P4) instead of repeating or missing them.
57. **Required output form is asked in the kit, not the interview.** P12 tells
    the builder to ask. The design's last step still assumes a destination
    ("writes to your software") that the owner never named. Ask in the
    interview and let the last step follow the answer.
58. **Alarms need both kinds of test case.** A trigger that fired on a harmless
    phrase stalled every case of one kind, and one that was too narrow missed
    the real thing. The kit's test set (`evals/examples.csv`) could carry
    must-trigger and must-not-trigger rows for every stop condition (item 27).

Items 26, 27 and 28 are partly covered by P8, P2 and P7: the kit now asks for
them, but the design itself still doesn't draw them.

## From comparing the transformer-monitoring kit with the system built from it (2026-11-16)

The no-AI kit for "log transformer loads and monitor capacity against limits"
(a scheduled pipeline with a control chart, a capability index, a projection
and a decision table) was built into a working tool by a team of four in a
24-hour sprint, then reviewed twice for its statistics. The repository keeps
the kit's BUILD.md beside the finished code, so the two can be compared line
by line. What the team had to add or change is now in the knowledge base
(Q04, Q05), four build practices (P13 to P16) and three fixes (see Done).
What that leaves open, kept general; none of it is a rule about utilities:

59. **A fixed stack, host or hand-in list never reaches the kit.** The brief
    required a named stack, a named host, two or three test datasets, a
    codebook and a public repository, each of them marked. The guide was
    given the task in one line, asked nothing about it, and the builder
    chose a different web framework; the team later wrote a spec, a task
    ledger and an audit of deviations by hand. Same family as items 25 and
    57. The interview could ask "is anything about how it is built or handed
    in already fixed for you?" and the kit could carry the answers as
    acceptance checks.
60. **Nothing lighter than an orchestrator.** The kit named an orchestrator
    as the main tool. A full run on 500 units took about 3 seconds; the
    scheduler stayed local and optional, and the hosted copy ran the same
    analysis from a button. For a small fixed pipeline the catalog offers a
    workflow tool or an orchestrator and nothing like "a script on a timer
    inside the app". Add that option, with the rule for when dependencies
    between data jobs justify more (`src/lib/catalog.ts`, the TL rules), and
    let the delivery contract's scheduler requirement accept it.
61. **Hosting is asked as a region, not a place.** The team had to publish to
    one managed host that serves a web app and runs no scheduler or
    long-lived job. The hosting question covers where data may be processed
    only. Ask whether a host is already chosen and what it can run.
62. **Words-only AI on a fixed-rules design has no name.** The kit said "Do
    not add AI to this system". The owner then asked for plain-language
    summaries, and the team added an optional rewrite of alerts and case
    summaries: off by default, rule-based text always shown, cached,
    guard-checked, never read by a decision. A re-run of the same task on
    2026-11-16 produced that shape as the AI's own decision ("the AI never
    decides the path or the threshold checks"). "Plain automation" forbids it
    and "a workflow with AI steps" overstates it. Owner's call: a named
    variant with its own short safeguard list, or leave the rule strict.
63. **The three new design limits are instructions, not checks.** The design
    prompt now asks a statistical step to name its assumption checks, the
    decision to keep the direct comparison with the limit first, and the
    queue to be graded (`limitsFor`, `server/design.ts`). One live run
    followed all three. `checkDesign` does not verify them, and there is no
    graded set of tasks to say how often they hold (item 15).
64. **Review time is still sized from runs.** The estimate now says it counts
    one result a run (`src/lib/cost.ts`). The kit for this task said "under
    an hour a week"; one run put 119 of 500 units in the queue. A question
    ("how many items does one run check?") would let the estimate and the
    queue practice (P15) use a number.
65. **The scaffold runs the steps in a line.** The design fanned one start out
    to four loads and branched at two decisions; the generated DAG chains
    every step after the one before it and drops the branches
    (`airflowDag`, `src/lib/starter.ts`). It now names the steps a person
    does and says the chain does not wait for them; following the design's
    edges is still to do, here and for the other scaffolds.
66. **One owner, one assistant.** Four people and several coding assistants
    built at once: a sync overwrote part of the spec, and the team added a
    task ledger with one owner and a runnable "done" check per task.
    BUILD.md is written for one person. The build plan could be split into
    tasks that each own distinct files.
67. **The build estimate does not say how it is built.** The kit said 3 to 8
    working days for a first version; a team with coding assistants had a
    tested first version the same evening and a public copy the next
    morning, then spent longer on review and corrections than on the build.
    State the assumption behind the estimate, and count review of the
    methods as its own line.

Seen again: the rules' own designs cannot pick a statistical method (item 4),
so P13 never applies on the published site; the scaffold's two placeholder
upstream jobs did not exist (the builder wrote a feed-readiness check
instead). What held up without change: limits from history and never from
the rating; no capability index for an unstable pattern; a run that stops
with no partial report when a feed is missing or belongs to another period;
reruns that replace a period's result and keep every attempt; an approval
enforced in the backend, not the page; a disposition that stops counting
when the inputs under it change; seeded known-wrong cases and review
metrics; and the honest DEMO ONLY status in the delivery report. What was
wasted: the kit's AI-only safeguards in a design with no AI (a check for
hidden instructions in meter data, a personal-data filter), which the
builder dutifully built; `e7f0fac` has since stopped those appearing.

## From running a document-reading and decision brief through the guide (2026-11-17)

The brief: a business receives tens of thousands of case files a month, each
a packet of documents; people check them by hand; the owner wants each
document sorted and read, a figure worked out by written rules, details
cross-checked between documents, and one of three outcomes with its evidence,
clear cases decided without a person and the rest queued. It gave targets
(time per case, reading accuracy, a catch rate on planted faults, cost against
today's manual work) and said only made-up data may be used. The guide split
it into three jobs. What it lacked that holds for any business is now built
(see Done). What is still open:

68. **"Approve every output" where the volume makes that impossible.** At
    hundreds of runs a day with money at stake, AU7 caps at level 3 ("send
    only the high-risk ones to a person"); a decision about a person makes
    AU12 cap at level 2. Both fired and the lower won, so the headline, the
    last person step ("reviews every result") and the estimate (12 to 346
    review hours a week) all describe approving everything, while AU12's own
    text asks only that adverse outcomes are confirmed. P20 now says in the
    kit what may pass and that it is sampled, and the AI design drew a
    spot-check of cleared cases; the level's name, the rules' person step and
    the estimate should say "adverse and unclear results" when both rules fire.
69. **The owner's own review policy is never read.** The brief said which
    cases the system decides and which go to people. The interview has no
    question for it and the adaptive step read it only as risks. Read a
    stated policy into the design, or say why the guide starts stricter
    (item 25 is the same gap for a stated architecture).
70. **Identity is stripped even where checking identity is the work.** AU12's
    fixed step removes names and addresses before any AI step. A task that
    verifies who someone is, or compares details between sources, needs
    them. P22 says the comparison runs in code and AI steps get only the
    result; the rules' step text and the AI design still say "strip
    identity" without that exception.
71. **No answer for one developer on a small budget.** The team question
    offers a small team without developers or a large one with them. The
    second led to an own-hardware estimate and a hosted workflow tool for a
    brief that named a low-cost web host (items 59 to 61).
72. **Stated targets and "no real data" do not reach the rules' kit.** The
    targets survived in the job descriptions, but a kit built without AI
    carries only the job's title, its "Done when" has no numbers, and its
    build plan still asks for 10 to 20 real past examples. P21 asks for the
    targets in general terms; carry the owner's own numbers into "Done when",
    and let "there is no real data" be an answer that changes the plan.
73. **A learning loop and two screens lost in the split.** The third job was
    read as "the same steps every time", so "corrections improve the rules
    over time" survived only in its title, and the rule owner's work
    (maintaining the rules, watching accuracy on a dashboard) belongs to no
    job. P23 says how corrections become rule changes; the split should keep
    a named user's work inside a job.
74. **The new practices are text, not checks.** P17 to P23 are in BUILD.md
    and two lines of the design prompt. `checkDesign` does not require a
    checking step after an AI step that reads values, or refuse an AI step
    that calculates (item 63 is the same gap).
75. **Three sources read from their abstracts only.** V02 and part of V03
    rest on the abstracts of Turpin et al., Xiong et al. and Eypasch et al.
    Read the full papers, add locations and effect sizes, and check for
    results on current models. U02 (what explanations and confidence
    displays do to reviewers) and V02 (why a model's own reasons and
    confidence are not evidence) now sit side by side and should cite each
    other.

Seen again: the split dropped the brief's monthly volume from the second
job (item 36); the reading overlay stayed over the first question for about
75 seconds (items 6 and 24). What held up without change: sorting before
reading, unclear items to a person, the decision record with versions and a
hash of the input, seeded known-wrong cases, uploads checked and never
served back (P9), and unknown as its own answer (P5).

## Done

- `b7c0c28` **What a brief for reading documents and deciding
  taught.** Knowledge, topic 17, each chunk from sources read on 2026-11-17:
  V01 (values an AI reads carry their source and are checked in code;
  Anthropic's documentation), V02 (a model's stated reasons and confidence
  are not measurements; Turpin et al., Xiong et al.) and V03 (how many cases
  a target needs, and what unreviewed cases hide; Eypasch et al., the NIST
  handbook, Lakkaraju et al.). Rules TL14, AU7, AU9, AU10 and F1 cite them,
  so designs can draw on them; no rule's behaviour changed. Design: the
  prompt asks for a checking step after an AI step that reads values, for
  calculations as fixed steps, and for hand-offs to a person based on what a
  check can see. Kit: seven more build practices in `src/lib/practices.ts`:
  P17 AI reads, code checks and computes; P18 the reasons shown are the
  checks that ran; P19 work goes to a person on what code can see; P20 say
  what passes without a person, and sample it; P21 a target needs enough
  cases to show it; P22 whoever sends the input may want a particular
  answer; P23 corrections change the rules through a gate. Tests:
  `tests/evidence.test.ts`. Re-running the brief's second job gave a design
  with "check each value against its source", a calculation by rules and a
  spot-check of cleared cases, none of which the first run had.

- `fc8d8c6` **What a build of a statistical monitor taught.**
  Knowledge: Q04 (what a control chart or capability index assumes; from the
  NIST e-Handbook, read 2026-11-16) and Q05 (what one team's build had to
  fix; tier E), both reserved in retrieval with Q01 to Q03
  (`QUALITY_METHODS`, `server/knowledge.ts`). Design: three more limits in
  the design prompt (assumption checks named, the direct comparison with a
  limit kept as the first rule, cases for a person graded with the rule that
  placed them) and the catalog's control chart, capability and reliability
  entries say what each needs first (`src/lib/models.ts`). Kit: four more
  build practices in `src/lib/practices.ts`: P13 hand-worked answers,
  degenerate input, units and a methods review for any step that computes a
  statistic; P14 one settings file, the plain limit first and a case for
  every outcome wherever the design decides; P15 a graded queue with
  evidence, a layout that fits the items and follow-up after the decision
  wherever a person steps in; P16 every figure labeled measured, calculated,
  modelled or sample, and saved results that keep their version. The Airflow
  scaffold takes its timetable from how often the owner said it runs
  (`airflowSchedule`), says what to do when the upstream data is not an
  Airflow job, and names the steps a person does. Fixes: when an AI decision
  changes where the system runs, the fired hosting rule follows it, so the
  hardware estimate and the hosting warnings no longer describe the rules'
  pick (the kit had said "in-region cloud" and "$2,000 of own hardware"
  together); the review estimate says it counts one result a run for
  scheduled and data-triggered work. Tests: `tests/field-build.test.ts`,
  one case in `tests/decision.test.ts`. One live run of the same task then
  drafted a design with the rating check first, a stated baseline, the
  index withheld until its checks pass, a graded queue and follow-up.
- `1b7058c` **Build practices in the kit.** BUILD.md gains "Build
  these in from the first version": up to twelve practices, each switched on by
  a feature of the design (a person who approves, several agents, a loop,
  personal data, AI steps) and each with the test that proves it: who may do
  what, approvals re-checked and tied to a version, one correction path,
  AI replies limited to typed fields, unknown as its own answer, agent
  contracts, bounded loops and one routing table, the end-user conversation,
  what each store may hold, repeat submissions and per-case budgets, keys and
  first run, and the output's required form. They don't change the
  recommendation or the rules. Tested in `tests/practices.test.ts`.
- `8ba0bae` **AI telemetry page.** The dev server records each
  AI request's outcome (first try, Sonnet retry, rules fallback, API error,
  cache), its calls' tokens and time, and the checks it failed
  (`server/telemetry.ts`, kept in `ai-cache.nosync/telemetry.jsonl`), and
  `#/telemetry` shows rates, cost, times and the most-failed checks, linked
  from the result page. Tested in `tests/telemetry.test.ts`.
- `4ede738` **The screens people use.** The starter kit now carries
  `ui/SCREENS.md` (each point where a person starts, checks, approves or
  steps in: the screen, who uses it, what it shows, what they can do, and
  its empty, loading, partial, failed and changed states, with the rules
  for all screens), `ui/lovable-prompt.md` with `ui/lovable-follow-ups.md`,
  and `ui/claude-design-prompt.md`, each with a copy button under "what to
  build". `src/lib/screens.ts` derives them from the recommendation and the
  answers without an AI call; the AI kit step supplies the task's own words
  (`screens` in `src/lib/kittext.ts`, checked as one to three plain words).
  The prompts follow each tool's documentation: Lovable gets one screen on
  sample data and is asked to ask, with the rest one prompt at a time;
  Claude Design gets the whole flow as a clickable prototype and takes its
  look from a design system. Both are capped at 2,400 characters and tested
  on every path. Six knowledge chunks back it in
  `knowledge/chunks/16-interfaces-for-people/` (U01 to U06, 47 sources), and
  G38 tells any design where a person reviews AI output that the screen
  decides whether the review works. Checked in the app and, with AI on, on
  a new brief. Tested in `tests/screens.test.ts`.
- `925c4ab` **Lessons from a built system.** The lead-scoring service built
  from the guide's result was read from its first working version to its
  final form (77 commits) and the general lessons built in. Five knowledge
  chunks cite the build record by commit, tier E, in
  `knowledge/chunks/15-lessons-from-builds/`: B01 people's minutes are the
  capacity, B02 rules that hold at any run frequency, B03 approvals the
  approver can judge, B04 numbers that survive a second look, B05 generated
  text with a check, a fallback and a label. Four gotchas use them: G34
  (daily or more, with a person reviewing), G35 (unattended and taking
  actions), G36 (learns from past work) and G37 (AI text customers see, or
  that feeds an action); AU15 adds two checkpoints to approve-every-result
  designs. The interview's extra questions now prefer numbers the design
  depends on (`server/interview.ts`, rule 4): on a new brief it asked how
  many people review and how long one item takes, and what a clear win looks
  like, which last time had to be asked by email (item 39). Tested in
  `tests/rules.test.ts`; the three jobs of the original brief get G34 and
  G36 on scoring, G35 on routing and AU15 on the approval job.
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
