// Build practices: what a team ends up adding once a design meets real users,
// stated up front so the first version has them.
//
// The rules decide the architecture and its safeguards. These practices sit one
// level below: how to build each safeguard so it holds in code and not only in
// a prompt. They come from comparing systems built from the guide's kits with
// what those systems looked like after weeks of team work, keeping only what
// applies to any business. Each one applies when the design has the feature it
// is about (a person who approves, several agents, a loop, personal data, a
// step that computes a statistic, a decision), and each names a test that would
// fail without it. P1 to P12 came from a multi-agent system that talks to the
// public; P13 to P16 from a scheduled monitor with no AI in its decisions;
// P17 to P23 from a brief for a system that reads documents and decides, and
// the research on it (knowledge chunks V01 to V03).
//
// They are written into BUILD.md (src/lib/starter.ts) and nowhere else: they
// do not change the recommendation, the design or the rules that fired.

import type { Blueprint } from "./blueprint";
import { ALGORITHMS } from "./models";
import type { Answers } from "./questions";
import type { Recommendation } from "./rules";

export type Practice = {
  id: string;
  title: string;
  /** What to build. */
  build: string;
  /** The test that would fail without it. */
  test: string;
};

type Ctx = { r: Recommendation; bp: Blueprint; a: Answers };

const risk = (a: Answers, x: NonNullable<Answers["risks"]>[number]) => !!a.risks?.includes(x);

/** A person approves, corrects or is handed work somewhere in the design. */
export function hasPersonStep({ r, bp, a }: Ctx): boolean {
  return r.autonomy.level <= 2 || !!a.requirements?.includes("approval") || bp.nodes.some((n) => n.kind === "human" || n.gates.some((g) => g.kind === "human"));
}

/** Work can be sent back or repeated somewhere in the design. */
export function hasLoop({ bp }: Ctx): boolean {
  return bp.edges.some((e) => e.style === "loop");
}

/** A step computes a statistic (a chart, an index, a lifetime model, a risk ranking). */
export function hasCalculation({ bp }: Ctx): boolean {
  const names: string[] = [ALGORITHMS.spc.name, ALGORITHMS.capability.name, ALGORITHMS.reliability.name, ALGORITHMS.rpn.name];
  return bp.nodes.some((n) => n.engine?.kind === "algorithm" && names.includes(n.engine.name));
}

/** The design has a step that chooses between outcomes or paths. */
export function hasDecision({ bp }: Ctx): boolean {
  return bp.nodes.some((n) => n.kind === "decision");
}

const ALL: (Practice & { when: (c: Ctx) => boolean })[] = [
  {
    id: "P1",
    title: "List who uses it and what each may do",
    when: (c) => hasPersonStep(c) || risk(c.a, "personal") || risk(c.a, "visible") || risk(c.a, "decides"),
    build:
      "Before any screen is built, write a table of every kind of user (the people the work is about, each staff role, and automated jobs such as schedulers and clean-up) against every action. Give each kind its own way in. Staff never act as the person the work is about, and whoever may decide something must be able to see what they are deciding. Permissions follow the actions a user sees; the internal steps of an allowed action run as the system.",
    test: "For each role, walk its whole journey and confirm every action outside its row is refused.",
  },
  {
    id: "P2",
    title: "A person's approval is an input, not an override",
    when: hasPersonStep,
    build:
      "List the actions a person can take at each review (approve, change, send back, stop) and what each one re-runs. After a person acts, re-check the design's hard limits in code before anything is released. Tie each approval to the exact version it was given for, so a later change reopens it, and record who approved (from their login, never a typed name), when, and why.",
    test: "Try to approve a result that breaks a hard limit, and one that changed after it was reviewed. Both must be refused.",
  },
  {
    id: "P3",
    title: "One way to correct each value, and everything after it runs again",
    when: hasPersonStep,
    build:
      "When a person corrects something, the correction goes through the step that produced that value, with a reason, a check that they were looking at the current version, and the original kept. Everything computed from the old value is cleared and worked out again. Nobody edits a finished result directly, and a correction offered in the wrong place is refused with a pointer to the right one.",
    test: "Correct an input after a result exists and confirm the old result, its sources and its approval are gone.",
  },
  {
    id: "P4",
    title: "Assume the AI can be talked into anything",
    when: ({ r }) => r.models.needed,
    build:
      "An AI step's reply may only fill named fields of a fixed shape; anything else in the reply is dropped. Every decision about where work goes next, whether to stop for a person, and whether something is approved is made by code after the AI step, and an AI checker can add a concern but never remove one that code raised. Give each step only the tools it needs.",
    test: "Replace the model with a stand-in that obeys instructions hidden in the input, and confirm the damage stops at one wrong field that a later check catches.",
  },
  {
    id: "P5",
    title: "Unknown is its own answer",
    when: ({ r, a }) => r.models.needed || a.systems !== "none",
    build:
      "A value that is missing, unreadable or not yet asked for is stored as unknown, never as zero, no or empty, and unknown stops the steps that depend on it. Check each record against the fields it should have, not the fields that happen to be present. Where two sources describe the same fact (what a person said, a document, a system record), compare them in code and show a person both values with where each came from. Treat two records as duplicates only with proof they are the same source.",
    test: "Feed a record with a required field missing, and two sources that disagree. Neither may reach a result without a person.",
  },
  {
    id: "P6",
    title: "Agree what each part may send, read and change",
    when: ({ r }) => r.approach.id === "multi",
    build:
      "Write down which agent may send what kind of message to which, and which pieces of shared information each may read and change. Enforce both in code: a write outside an agent's list is dropped and logged, and in tests it fails the run. Every handoff expects a reply. Feedback from a checker can go to several agents in one round, and every agent a check can name must be reachable. Limits such as \"the checker never edits\" live here, not in a prompt.",
    test: "Have each agent attempt a write outside its list, and a checker raise findings for two agents at once.",
  },
  {
    id: "P7",
    title: "Every loop has a limit, and routing is one table",
    when: hasLoop,
    build:
      "Keep the choice of the next step in one ordered table of conditions with no side effects, and test each row and the order of the rows. Cap the rounds of every send-back loop, cap the total handoffs in a case, detect the same handoff repeating, and detect a handoff that never got a reply. When any of these trips, or a stop for a person is open, the case goes to a person before any more work is done.",
    test: "Inject a fault that makes a check fail forever and confirm the case stops at the limit and reaches a person.",
  },
  {
    id: "P8",
    title: "Design the conversation, if people talk to it directly",
    when: ({ r, a }) => r.models.needed && (risk(a, "visible") || risk(a, "decides")),
    build:
      "If customers or the people the work is about answer questions themselves, treat that conversation as a step with its own rules: one question at a time in plain words, each unfamiliar term explained once, a correction changes only the answer it names, and \"I don't know\" is accepted and passed to a person. A request outside the task is declined, noted and followed by the same question again. Sensitive details offered unasked are not kept, and the person is told. Only this step talks to them. A session picks up where it stopped, with a short reminder shown when they return. If someone else may be answering for them, or pressing them, decide how the system notices and make that a quiet handover to a person.",
    test: "Script awkward users (drifting, correcting, unsure, asking for advice, answering for someone else) and check each rule. Test every alarm against cases that must trigger it and cases that must not.",
  },
  {
    id: "P9",
    title: "Say what each place may hold",
    when: ({ a }) => risk(a, "personal") || risk(a, "decides"),
    build:
      "List every place information rests (saved sessions, uploads, logs, messages between steps, history shown to reviewers, anything sent to a model) with what personal data it may hold, how it is protected, who can read it and when it is deleted. Add to the list whenever a new store appears. Send a model only what its step needs. Uploaded files are checked by their content, limited in size, cleaned, and never served back or run.",
    test: "Run a case with made-up secrets and search every store and log for them.",
  },
  {
    id: "P10",
    title: "Slow steps get pressed twice",
    when: ({ r }) => r.models.needed,
    build:
      "Any button that starts AI work can be pressed again before the answer arrives. Tie each submission to the question or version it answers, accept it once, and send a repeat back to the current screen without an error. Set a spending limit per case as well as per month, and decide what happens when it is reached: a simpler path or a person, never a silent failure.",
    test: "Submit the same answer twice in quick succession, and run a case past its limit.",
  },
  {
    id: "P11",
    title: "Keys and first run",
    when: ({ r }) => r.models.needed,
    build:
      "Decide for each way the system runs (on one computer, a shared demo, in service) whose model account pays, where that key lives and whether it is ever saved; a visitor's key is held for their session only. Keys that protect stored data are separate, are never replaced silently, and the system refuses to start in service without one. Ship a few made-up cases that run through the real steps, so a fresh copy is not an empty screen.",
    test: "Start a fresh copy with no key, with a wrong key and with a visitor's key, and confirm what each can do.",
  },
  {
    id: "P12",
    title: "Output in the form it must arrive in",
    when: () => true,
    build:
      "Ask the owner what form the finished work must take (an official template, an import file, an entry in a system of record) before building the last step, and check that every field it needs is collected earlier. Mark anything not yet approved as a draft, keep each value's source attached when exporting, leave uncollected fields blank, and say plainly that changes made to an exported copy do not flow back.",
    test: "Produce the output for a complete case and an incomplete one, and compare both with the required form.",
  },
  {
    id: "P13",
    title: "Test each calculation against an answer worked by hand",
    when: hasCalculation,
    build:
      "Example cases show how the system behaves; they do not show that a formula is right. For every number a step computes (a limit, an index, a rate, a projection), keep a small case worked by hand with the number it must give. Check the units of everything that is added or compared, and convert in one named place. Before a number is reported, check what its method assumes: enough history in a stated baseline that ends before the period being judged, a stable pattern, values that are independent and distributed as the method needs. A case that fails a check goes to a person marked as not established. Have someone other than the builder review the methods, and record what they found.",
    test: "Run each hand-worked case and get its number exactly. Feed constant values, a single point and missing or non-numeric values, and get a named status, never a number or a crash. Where an interval is reported, check by simulation that it covers the true value as often as it claims.",
  },
  {
    id: "P14",
    title: "Thresholds in one place, a case for every outcome",
    when: ({ bp }) => bp.nodes.some((n) => n.kind === "decision"),
    build:
      "Keep every threshold, window and timetable in one settings file that the rules, the scheduler and the documents all read; a rule refers to a setting by name and never repeats its value. Where the task compares something with a limit that someone else set, keep that direct comparison as the first rule, whatever a score or statistic adds after it. The last row of every decision is \"otherwise\", so no case leaves without an outcome.",
    test: "Change one setting and confirm the rule, the timetable and the report all follow. For every row of every decision, run a labeled case that reaches it, the last row included.",
  },
  {
    id: "P15",
    title: "A queue a person can work through",
    when: hasPersonStep,
    build:
      "Size the queue from one realistic run, not from the number of runs: a run that checks hundreds of items can send dozens to a person. Grade what waits by urgency and show the worst first, each case with its evidence and the rule or reason that put it there, laid out the way the reviewer looks for it: on a map when the items have locations, on a timeline when timing matters, in a ranked list otherwise. Let them search and filter by reason. Decide what happens after their decision: where work follows, record the next action, its owner and a due date, apart from the sign-off, and keep it visible until it is closed.",
    test: "Run a period that flags a quarter of the items. Confirm the most urgent case is first, each case names its rule, and a case decided earlier with work still open is still in view.",
  },
  {
    id: "P16",
    title: "Say what is measured, modelled or made up",
    when: () => true,
    build:
      "Label every figure a person sees as measured, calculated by a stated rule, modelled from assumptions, or sample data. A modelled or sample figure never feeds a decision. Where the data a method needs does not exist (no failure records for a lifetime model, no outcomes for a prediction), say so and leave the method out. When rules or settings change, a saved result keeps the version it was made with and says so; it is not silently recalculated or shown as current.",
    test: "Search every decision's inputs for a modelled or sample value. Change a setting, reopen a saved result and confirm it names the version it was made under.",
  },
  {
    id: "P17",
    title: "AI reads, code checks and computes",
    when: ({ r }) => r.models.needed,
    build:
      "An AI step reads; it does not calculate and it does not vouch for itself. Every value it takes from a document or message is stored with the document, the place in it and the exact words it was read from. Code then confirms those words are in the source and that the value has the right form: a date is a date, parts add up to their total, a figure agrees with the same figure elsewhere in the document. A value that fails is unknown. Every sum, average, rate or conversion made from those values is done in code from written rules. Measure reading accuracy per field against labeled documents, not as one overall score.",
    test: "Change one figure in a source document and confirm the stored value no longer passes its check. Ask for a value the document does not contain and get unknown. Work one calculation by hand and get the same number from the code.",
  },
  {
    id: "P18",
    title: "The reasons shown are the checks that ran",
    when: (c) => hasDecision(c) && (hasPersonStep(c) || risk(c.a, "decides") || risk(c.a, "irreversible")),
    build:
      "Where a decision has to be explained or audited, build the explanation from the record of the decision: each rule that was evaluated, the values it looked at, where each value came from, and the result. Do not ask a model afterwards why the outcome was what it was; that gives a plausible account, not the actual one. A model may reword the recorded reasons for the reader, and code checks that it added none. Show which checks ran and passed as well as which failed, so that nothing found is not read as checked and cleared.",
    test: "For a sample of decisions, trace every reason shown to a recorded check and its inputs. Change one input, run again and confirm the reason shown changes with it.",
  },
  {
    id: "P19",
    title: "Send work to a person on what code can see",
    when: (c) => c.r.models.needed && hasPersonStep(c),
    build:
      "Decide which cases reach a person with conditions code can evaluate: a required value is unknown, a value failed its check, two sources disagree, two reads of the same material disagree, or the case is of a kind not seen in testing. Do not rely on an AI step saying how sure it is; stated confidence runs high. If a score is used, measure it against labeled cases first, set the cut-off from that measurement and measure again after any change of model or prompt.",
    test: "Feed cases that are wrong but stated with full confidence and confirm the conditions still send them to a person. Before trusting a cut-off, show the score against actual results on labeled cases.",
  },
  {
    id: "P20",
    title: "Say what passes without a person, and sample it",
    when: (c) => hasPersonStep(c) && c.a.volume === "high",
    build:
      "At this volume nobody can look at everything, so write down which results pass without a person. A result with nothing adverse in it may pass only when every check in code passed; anything adverse, unclear or flagged waits for a person. Then send a random share of the passed results to the same reviewers, unmarked, so the error rate of what nobody looks at is measured and corrections come from both sides. Set that share from the reviewers' minutes, and count it as a running total across runs.",
    test: "Run a day's volume and confirm the queue fits the reviewers' time. Plant wrong results among the passed ones and confirm the sample finds them at the expected rate.",
  },
  {
    id: "P21",
    title: "A target needs enough cases to show it",
    when: (c) => c.r.models.needed || hasPersonStep(c),
    build:
      "For each target the owner states (accuracy, a catch rate, time or cost per case), name the test set that will show it, how many cases it holds and how they split by type. Twenty clean cases only show an error rate under about 15%; showing under 5% takes about 60 with no errors, and more once errors occur, so quote every rate with its count and range. Count the two kinds of error separately (wrongly passed, wrongly stopped) and ask the owner which costs more. Keep a set that is never used for tuning. Where the cases are made up, whatever builds them must not share its recipe with the part being tested, every kind of fault is planted in known numbers with some kinds held back until the end, and the results are labeled as coming from made-up cases. Compare time and cost per case with how the work is done today, counting the minutes people still spend.",
    test: "For each stated target, show the cases, the count per type and the range. Run the held-back kinds of fault once, at the end, and report that result as it comes.",
  },
  {
    id: "P22",
    title: "Whoever sends the input may want a particular answer",
    when: ({ a }) => risk(a, "decides") || risk(a, "irreversible"),
    build:
      "Where the person or company supplying the input gains from one outcome, treat what they send as possibly prepared to get it. Check each document against itself (totals, dates, formats), against the other material in the case, and where possible against a source the sender does not control. Compare names, addresses and amounts in code: normalise them first, set how close counts as a match in the settings file, and return match, mismatch or cannot tell. Details that identify a person are used for this matching only; AI steps that judge the case get the result, not the details. A second submission with changed figures is itself a signal. A suspicion is not a finding: it goes to a person with its evidence, never straight to a refusal, and the sender is not told which check caught it.",
    test: "Submit a case with one altered figure, one with a mismatched name, and a resubmission with changes. Each must reach a person with its evidence, and none may be refused automatically.",
  },
  {
    id: "P23",
    title: "Corrections change the rules through a gate",
    when: (c) => hasPersonStep(c) && (c.r.models.needed || hasDecision(c)),
    build:
      "When a reviewer overrules the system, record the reason from a short fixed list plus a note, and keep the case as a labeled example. Nothing changes a rule, threshold or prompt automatically. A proposed change is first run against the saved cases, showing which past outcomes would differ; a named owner of the rules approves it; it gets a version and a start date; and the earlier version can be restored. Wait for a minimum number of corrections before acting on a pattern, and remember that corrections come only from the cases people saw.",
    test: "Propose a rule change and confirm the report lists the past cases whose outcome would change. Confirm a result made before the change still names the version it was made under.",
  },
];

/** The practices that apply to this design, in a fixed order. */
export function practicesFor(r: Recommendation, bp: Blueprint, a: Answers): Practice[] {
  const c = { r, bp, a };
  return ALL.filter((p) => p.when(c)).map(({ when: _when, ...p }) => p);
}

/** The BUILD.md section, or nothing when no practice applies. */
export function practiceLines(r: Recommendation, bp: Blueprint, a: Answers): string[] {
  const list = practicesFor(r, bp, a);
  if (!list.length) return [];
  return [
    "## Build these in from the first version",
    "",
    "Each safeguard above has to hold in code, not only in a prompt. These are the parts teams add later when they are left out, and each comes with the test that proves it is there.",
    "",
    ...list.flatMap((p) => [`- **${p.title}.** ${p.build}`, `  - Test: ${p.test}`]),
    "",
  ];
}
