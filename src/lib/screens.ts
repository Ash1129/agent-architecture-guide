// The screens people use: who steps in, what each screen shows, the one
// decision made there, and the states it has besides the full one. Derived
// from the recommendation and the answers, so it works without an AI call;
// the AI kit step can supply the task's own words (src/lib/kittext.ts).
//
// Two short prompts are made from the brief, one for Lovable (a working app)
// and one for Claude Design (the visual design). The evidence behind the
// rules is in knowledge chunks U01 to U06 and B01, B03, B05; the prompts
// carry the decisions, not the research, and are capped in length.

import type { Answers } from "./questions";
import type { Recommendation } from "./rules";

/** The task's own words for the things on screen. */
export type ScreenWords = { item: string; items: string; reviewer: string; owner: string };

export type Screen = {
  id: "start" | "result" | "queue" | "item" | "attention" | "status" | "record";
  name: string;
  /** Who uses it. */
  who: string;
  /** The one thing it is for. */
  purpose: string;
  /** What leads the page, in a few words. */
  lead: string;
  shows: string[];
  /** What the person can do here; the first is the main action. */
  actions: string[];
  /** What it shows when it is not full of data. */
  states: string[];
};

/** `rules` is the full list for the brief; `short` is the same decisions in a line each, for the prompts. */
export type ScreensBrief = { words: ScreenWords; screens: Screen[]; rules: string[]; short: string[]; leaveOut: string[] };

/** Prompts stay short enough to read before pasting: about 380 words at most, and near 300 for a typical task. */
export const PROMPT_LIMIT = 2400;

const DEFAULT_WORDS: ScreenWords = { item: "item", items: "items", reviewer: "reviewer", owner: "owner" };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const a_ = (noun: string) => `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
const risk = (a: Answers, r: string) => !!a.risks?.includes(r as never);

/** The five states a list has besides the full one (U04); "changed" comes from a built system's stale-form fix (B02). */
const LIST_STATES = (w: ScreenWords) => [
  `Empty: "No ${w.items} waiting", with when it was last updated.`,
  "Loading: the layout with placeholders, not a blank page.",
  "Partial: show what loaded and say what is missing.",
  "Failed: what went wrong in plain words and a Try again button.",
  `Changed since it loaded: "3 new ${w.items}", shown without moving what the person is reading; updates can be paused.`,
];

export function buildScreens(r: Recommendation, a: Answers, words: Partial<ScreenWords> = {}): ScreensBrief {
  const w: ScreenWords = { ...DEFAULT_WORDS, ...Object.fromEntries(Object.entries(words).filter(([, v]) => v)) };
  const level = r.autonomy.level;
  const ai = r.models.needed;
  const acts = a.systems === "act";
  const unattended = a.trigger !== "manual";
  const reviews = level <= 3;
  const sample = level === 4 && ai;
  const screens: Screen[] = [];

  // Checking has to be quicker than redoing the work, and the system's answer must not sit on top of the evidence (U02).
  const evidence = ai
    ? [
        `The source the system worked from comes first, with the passages it relied on highlighted, so the ${w.reviewer} checks at a glance and never opens another tool.`,
        "The system's result sits apart from the source, beside the decision buttons.",
        "Why, in one sentence, on the page or one click away. No statistics.",
        "A label on any text the AI wrote. Where it was unsure, it shows the options or asks.",
      ]
    : [`The ${w.item} and the rule that applied to it, side by side.`];
  const consequence = acts ? ["What will happen in your other systems when this is approved."] : [];
  // Rejecting is as quick as approving, AI-filled fields are edited in place, and a by-hand path always exists (U01).
  const decide =
    level === 1
      ? ["Use it", "Edit it in place", "Discard it", "Do it by hand, with the details carried over"]
      : ["Approve", "Change it in place, then approve", "Reject in one click, with a reason from a short list", "Do it by hand, with the details carried over"];
  const extras = [
    ...(ai && level <= 2 && (risk(a, "irreversible") || risk(a, "decides"))
      ? [`On the few high-stakes ${w.items}, the ${w.reviewer} records their own answer before the system's is shown.`]
      : []),
    ...(risk(a, "irreversible") ? ["Before anything that can't be undone, a confirmation that names exactly what will change."] : []),
    ...(risk(a, "visible") ? ["Preview it as the customer will see it."] : []),
    ...(risk(a, "decides") ? ["Confirm an adverse outcome only with the evidence and reasons shown; the person affected can ask for a review."] : []),
  ];

  if (!unattended) {
    screens.push({
      id: "start",
      name: "Start",
      who: `The ${w.reviewer}`,
      purpose: `Give the system one ${w.item} to work on and see that it is working.`,
      lead: "the inputs, then the progress",
      shows: ["Only the inputs the task needs, each with a label above it.", "After Start: what step it is on, and a way to stop it."],
      actions: ["Start", "Stop"],
      states: ["Nothing entered yet: Start is off, with a line saying what is missing.", "Working: progress by step, since it takes longer than a moment.", "Failed: what went wrong in plain words, with the inputs kept."],
    });
    screens.push({
      id: "result",
      name: "Result",
      who: `The ${w.reviewer}`,
      purpose: "Check the result against what went in, then use it or send it back.",
      lead: "what went in, with the result beside the buttons",
      shows: [...evidence, ...consequence],
      actions: [...(level === 1 ? decide : ["Approve and save", "Ask for changes, in your own words", "Discard"]), ...extras],
      states: ["Changed while open: nothing is applied, and the page says so.", "Saved: where it went, and a link back to Start."],
    });
  } else {
    if (reviews || sample) {
      screens.push({
        id: "queue",
        name: sample ? `${cap(w.items)} to spot-check` : level === 3 ? `${cap(w.items)} that need a decision` : `${cap(w.items)} to ${level === 1 ? "work on" : "approve"}`,
        who: `The ${w.reviewer}`,
        purpose: sample ? `A small random sample of what ran on its own, to check it is still right.` : `The ${w.items} waiting for a person, most urgent first.`,
        lead: `the waiting ${w.items}, one row each`,
        shows: [
          `One row per ${w.item}: what it is, the result in a line, ${level === 3 ? "why it was held back" : "how long it has waited"}.`,
          "A count of what is waiting, and how many are past their time.",
        ],
        actions: [`Open one ${w.item}`, ...(level <= 2 ? [] : [])],
        states: LIST_STATES(w),
      });
      screens.push({
        id: "item",
        name: `One ${w.item}`,
        who: `The ${w.reviewer}`,
        purpose: sample ? "Say whether the system got this one right." : "Decide this one, with everything needed on the page.",
        lead: ai ? "the source it worked from, with the result beside the buttons" : `the ${w.item} and the rule that applied`,
        shows: [...evidence, ...consequence],
        actions: sample ? ["It was right", "It was wrong, with what was wrong"] : [...decide, ...extras],
        states: [
          "Changed since it was opened: nothing is applied, and the page says what changed.",
          ...(ai ? ["After a change: the page says what the system will do with the correction."] : []),
          `After a decision: the next ${w.item} opens, with a line naming the one just decided.`,
        ],
      });
    }
    screens.push({
      id: "attention",
      name: "Needs attention",
      who: `The ${w.owner}`,
      purpose: `Everything the system could not finish by itself.`,
      lead: "what failed or is stuck, and what to do about it",
      shows: [
        `Runs that failed and ${w.items} that are stuck or late, each with what happened in plain words.`,
        "What to do about each one.",
      ],
      actions: ["Try again", `Hand it to a person`, "Close it, with a reason"],
      states: ['Empty: "Nothing needs you", with when it last checked.', "Failed to load: say so; never show an empty list that might be wrong."],
    });
    screens.push({
      id: "status",
      name: "How it is running",
      who: `The ${w.owner}`,
      purpose: "Whether it is working, how much it did, and what it cost.",
      lead: "whether it is running, and the last run",
      shows: [
        "On or off, the last run and whether it succeeded, most urgent first.",
        `${cap(w.items)} handled this week${reviews ? ", and how many were approved, changed or rejected" : ""}, each number beside its target.`,
        ...(ai ? ["Spend so far this month against the limit."] : []),
        ...(reviews ? [`How long ${w.items} wait for a person, against the people's time available.`] : []),
      ],
      actions: [
        "Pause it",
        // The people's time is the capacity (B01), and a step that runs on its own is switched on by a named person (B03).
        ...(reviews ? ["Set how many people review, their hours and the minutes one takes"] : []),
        ...(ai ? ["Switch an automatic step on or off, recorded with your name"] : []),
      ],
      states: ["Paused: say who paused it and when.", "A period that is not finished is labelled \"so far\"."],
    });
  }
  if (reviews || risk(a, "decides") || risk(a, "irreversible")) {
    screens.push({
      id: "record",
      name: "Decisions",
      who: `The ${w.owner}`,
      purpose: "Every decision a person made, with what they saw when they made it.",
      lead: "who decided what, and when",
      shows: [`Who decided, when, on which ${w.item}, what the system had suggested, and the reason given.`],
      actions: ["Filter by person, decision or date"],
      states: ['Empty: "No decisions yet".'],
    });
  }

  const rules = [
    // U03: the first view holds what the decision needs; the rest is one labelled step away.
    "One screen, one decision. The first view holds only what that decision needs; the main action is the only filled button.",
    "Anything else is one labelled step away, behind an \"i\" beside what it explains. Two levels at most.",
    "Evidence sits beside the decision, never on another page.",
    `Use the ${w.reviewer}'s words, one term for each thing. No scores, model names or field names in text a person reads.`,
    // U01, U02: a bare percentage does not improve decisions.
    ...(ai ? ["Show confidence only if it has been checked against real results, in words (\"right about 8 in 10 on cases like this\"), with what to do when it is low. Otherwise leave it out."] : []),
    "Answer every click within a second. One to ten seconds shows a busy sign; longer shows progress, when it should finish, and lets the person carry on.",
    "Every change can be undone or cancelled. Ask for confirmation only before a risky one.",
    "An error says what happened and what to do next, sits beside the field, and keeps what was typed.",
    ...(level <= 2 && unattended ? ["No approve-all button: one at a time."] : []),
    "Lists start with a name a person recognises, right-align numbers and keep their headings in view.",
    // U04: WCAG 2.2 level AA, the criteria generated screens most often break.
    "Accessible to WCAG 2.2 AA: text contrast 4.5:1 (3:1 for large text, outlines and icons), targets at least 24 by 24 pixels, every action usable from the keyboard with a visible focus, a label on every input, and status shown by text or icon as well as colour.",
    "No sideways scrolling at 320 pixels wide, tables excepted.",
    ...(reviews ? ["Judge the screens by the errors people catch on them, not by whether people like them."] : []),
  ];
  const short = [
    "One decision per screen, one filled button; the rest is one labelled step away.",
    "The evidence sits beside the decision, never on another page.",
    `Plain words a ${w.reviewer} uses. No scores, model names or field names.`,
    ...(ai ? ["Label any text the AI wrote. No bare confidence percentages."] : []),
    "Errors say what happened and what to do next, and keep what was typed.",
    "Every click answers within a second; slower work shows progress.",
    "WCAG 2.2 AA: 4.5:1 text contrast, 24 pixel targets, keyboard use, never colour alone.",
  ];
  const leaveOut = [
    "The automation itself. This is the surface over it: it reads and writes the records, and does not redo the work.",
    "Dashboards of charts nobody decides from.",
    ...(reviews ? [] : ["Approval controls: nothing here waits for a person."]),
    "Settings pages beyond what the status screen holds.",
  ];
  return { words: w, screens, rules, short, leaveOut };
}

const bullets = (lines: string[]) => lines.map((l) => `- ${l}`);

/** The full brief, for the builder and for whoever checks the finished screens. */
export function screensMarkdown(b: ScreensBrief, task: string): string {
  return [
    "# Screens",
    "",
    `The screens people use for: ${task}. One screen per decision; the rules at the end apply to all of them. Hand ui/lovable-prompt.md to Lovable for a working app, or ui/claude-design-prompt.md to Claude Design for the visual design.`,
    "",
    ...(b.screens.some((s) => s.id === "queue" || s.id === "result")
      ? [`Before building, write down what the ${b.words.reviewer} knows that the system does not. If the answer is nothing, a review screen will not catch the system's errors, however it is designed.`, ""]
      : []),
    ...b.screens.flatMap((s, i) => [
      `## ${i + 1}. ${s.name}`,
      "",
      `**For:** ${s.who}. **Purpose:** ${s.purpose}`,
      "",
      "**Shows**",
      ...bullets(s.shows),
      "",
      "**The person can**",
      ...bullets(s.actions),
      "",
      "**When it isn't full**",
      ...bullets(s.states),
      "",
    ]),
    "## Rules for every screen",
    "",
    ...bullets(b.rules),
    "",
    "## Leave out",
    "",
    ...bullets(b.leaveOut),
    "",
  ].join("\n");
}

const who = (s: Screen) => s.who.replace(/^The /, "");
const users = (b: ScreensBrief) => {
  const w = b.words;
  return b.screens.some((s) => s.who.includes(w.owner)) && w.owner !== w.reviewer ? `${a_(w.reviewer)} and ${a_(w.owner)}` : a_(w.reviewer);
};

/** A line's first clause: enough for a prompt, which carries the decision and not its reasons. */
const clause = (line: string) => line.split(/[,:;] | so | with /)[0].replace(/\.$/, "");
/** The screen where the decision is made: the one to build or draw first. */
const firstScreen = (b: ScreensBrief) => b.screens.find((s) => s.id === "item" || s.id === "result") ?? b.screens[0];
const LOOK = "calm, plain and dense, a work tool and not a marketing page; one accent colour, one reading typeface, hairline rules in place of boxes";

/**
 * Lovable's own advice (U05): the first prompt is one screen told as a story,
 * on sample data with no login, with its other states, a line on the look and
 * a request to ask questions. Everything else follows one prompt at a time
 * (lovableFollowUps).
 */
export function lovablePrompt(b: ScreensBrief, r: Recommendation): string {
  const w = b.words;
  const s = firstScreen(b);
  return [
    `I am building an internal tool for this task: ${r.task || "the task"}.`,
    "An automated system already does the work. This tool is where people check and act on what it produced; it only reads and writes records.",
    "",
    `Build one screen first: "${s.name}". ${cap(a_(who(s).replace(/^the /i, "")))} uses it. ${s.purpose}`,
    "",
    "It shows:",
    ...bullets(s.shows),
    "",
    `The person can: ${s.actions.slice(0, 4).map(clause).join("; ")}.`,
    "",
    `Use 10 realistic sample ${w.items}, marked as sample data. No login and no database yet.`,
    "Also build what this screen shows when it is empty, loading, and when loading failed.",
    "",
    "Rules:",
    ...bullets(b.short),
    "",
    `Look: ${LOOK}.`,
    "",
    "Before you build, ask me anything you need to know.",
  ].join("\n");
}

/**
 * What follows the first Lovable prompt: the standing context, pasted once into
 * the project's instructions, then one short prompt per further screen and one
 * each for stored data, sign-in with roles, and the real system (U05).
 */
export function lovableFollowUps(b: ScreensBrief, r: Recommendation, a: Answers): string {
  const w = b.words;
  const first = firstScreen(b);
  const rest = b.screens.filter((s) => s !== first);
  const tables = [
    `${w.items} (what came in, the result, the reason, status, arrival time)`,
    ...(b.screens.some((s) => s.id === "record") ? ["decisions (who, when, what was suggested, what they chose, why)"] : []),
    ...(a.trigger !== "manual" ? ["runs (when, succeeded or failed, what went wrong)"] : []),
  ];
  const two = w.owner !== w.reviewer && b.screens.some((s) => s.who.includes(w.owner));
  const steps = [
    ...rest.map((s) => `Add a screen, "${s.name}", for ${who(s).toLowerCase()}. ${s.purpose} It shows: ${s.shows.join(" ")} Main action: ${s.actions[0]}. Include its empty, loading and failed states. Leave the existing screens as they are.`),
    `Store the data so it survives a refresh: ${tables.join("; ")}. Keep the sample ${w.items}, still marked as sample data.`,
    two
      ? `Add sign-in with two roles, ${w.reviewer} and ${w.owner}. Each sees only their own screens: hide navigation a role cannot use, and enforce it on the data, not only in the interface. I will test with one account of each.`
      : `Add sign-in. Only signed-in ${w.reviewer}s can open the tool.`,
    `Add one place where the real system delivers ${w.items} and reads decisions back. Until it is connected, keep using the sample data.`,
  ];
  return [
    "# Lovable: after the first prompt",
    "",
    "Lovable works best one change at a time. Check the preview after each prompt before sending the next.",
    ...(risk(a, "personal") || risk(a, "decides") ? ["", "Keep real personal data out of Lovable until you have checked its terms: its standard terms exclude health, payment-card and identity data. Sample data is enough to get the screens right."] : []),
    "",
    "## Paste once into the project's instructions",
    "",
    `This is an internal tool for: ${r.task || "the task"}. It is the screens people use over an automated system; it never does that system's work.`,
    `Users: ${users(b)}.`,
    "Rules for every screen:",
    ...bullets(b.rules),
    "",
    "## Then send these, one at a time",
    "",
    ...steps.map((t, i) => `${i + 1}. ${t}`),
    "",
  ].join("\n");
}

/**
 * Claude Design's own advice (U06): the goal, the audience, the layout and the
 * content, in one prompt for the whole flow, one artboard a screen. It has to
 * be told to make the screens clickable, and takes colour and type from an
 * attached design system, so the prompt gives one line of look only as a fallback.
 */
export function claudeDesignPrompt(b: ScreensBrief, r: Recommendation): string {
  const w = b.words;
  const first = firstScreen(b);
  return [
    `Design a clickable prototype of an internal work tool for this task: ${r.task || "the task"}.`,
    `It is used all day by ${users(b)}, at a desk and sometimes on a phone. An automated system does the work; these screens are where people check it and decide.`,
    "",
    "One artboard for each screen:",
    ...b.screens.map((s, i) => `${i + 1}. ${s.name} (${who(s).toLowerCase()}): ${s.purpose} Leads the page: ${s.lead}.`),
    "",
    `Start with "${first.name}", where the decision is made, and give me two layouts of it. Its buttons: ${first.actions.slice(0, 3).map(clause).join(", ")}. Draw it full, then empty, loading and failed. Fill every screen with five realistic example ${w.items} and real labels, no placeholder text.`,
    "",
    "Rules:",
    ...bullets(b.short),
    "",
    `Use the attached design system. If there is none: ${LOOK}.`,
  ].join("\n");
}
