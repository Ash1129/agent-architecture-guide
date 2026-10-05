// The guide's questions, in order. A question only appears when `appliesWhen`
// says the earlier answers make it relevant, so a rules-based task skips
// everything about AI behaviour.

export type Shape = "rules" | "judgement" | "varies";
export type Kinds = "yes" | "no";
export type Split = "sections" | "voting" | "sequential";
export type Roles = "one" | "specialists" | "material" | "both";
export type Quality = "clear" | "partly" | "no";
export type Knowledge = "playbook" | "reference" | "memory" | "none";
export type Systems = "none" | "read" | "act";
export type Trigger = "manual" | "schedule" | "event" | "data";
export type Volume = "occasional" | "daily" | "high";
export type Risk = "visible" | "personal" | "irreversible" | "none";
export type Location = "open" | "residency" | "restricted" | "independence";
export type Team = "small" | "mid" | "large";

export type Answers = {
  task?: string;
  shape?: Shape;
  kinds?: Kinds;
  split?: Split;
  roles?: Roles;
  quality?: Quality;
  knowledge?: Knowledge[];
  systems?: Systems;
  trigger?: Trigger;
  volume?: Volume;
  risks?: Risk[];
  location?: Location;
  team?: Team;
};

export type QuestionId = keyof Answers;

export type Option = {
  value: string;
  label: string;
  hint?: string;
  /** Short phrase used when the result explains itself ("because you said ..."). */
  short: string;
};

export type Question = {
  id: QuestionId;
  kind: "text" | "single" | "multi";
  title: string;
  help?: string;
  /** Plain-English reason for asking, shown on demand. */
  why: string;
  options?: Option[];
  /** For multi-select: choosing this value clears the others. */
  exclusive?: string;
  appliesWhen?: (a: Answers) => boolean;
};

const usesAI = (a: Answers) => a.shape === "judgement" || a.shape === "varies";

export const TASK_EXAMPLES = [
  "Answer routine customer emails",
  "Send overdue invoice reminders",
  "Tailor resumes to job descriptions",
  "Research competitors every week",
  "Prepare the Monday sales report",
];

export const QUESTIONS: Question[] = [
  {
    id: "task",
    kind: "text",
    title: "What business task do you want to improve?",
    help: "One sentence is plenty. Describe the work, not the technology.",
    why: "Everything else in the guide is about this one task. Your words are only used to label your result; the recommendation comes from the questions that follow.",
  },
  {
    id: "shape",
    kind: "single",
    title: "Which sounds most like how this work gets done today?",
    why: "This is the biggest decision in the guide. Work that follows fixed rules can be automated without AI. Work that needs reading and judgement benefits from AI steps. Only work where the next step has to be figured out each time needs an agent.",
    options: [
      {
        value: "rules",
        label: "The same steps and rules every time",
        hint: "A clear checklist could do it. Given the same input, the right result is always the same.",
        short: "the work follows the same steps and rules every time",
      },
      {
        value: "judgement",
        label: "The same steps, but some need reading or judgement",
        hint: "For example, summarising a document, drafting a reply, or deciding how urgent a request is.",
        short: "the steps are fixed but some need reading or judgement",
      },
      {
        value: "varies",
        label: "Each case is different",
        hint: "Someone has to work out the next step as they go, and may need several attempts to get there.",
        short: "each case is different and the next step has to be worked out",
      },
    ],
  },
  {
    id: "kinds",
    kind: "single",
    title: "Does the work arrive in a few distinct types that need different handling?",
    help: "For example, customer messages that are either refund requests, technical questions or general enquiries.",
    why: "If requests fall into clear types, the system can sort them first and send each type down its own simpler path. That is easier to test than one process that tries to handle everything.",
    appliesWhen: usesAI,
    options: [
      { value: "yes", label: "Yes, a few clear types", short: "the work arrives in a few distinct types" },
      { value: "no", label: "No, it's essentially one kind of work", short: "it is essentially one kind of work" },
    ],
  },
  {
    id: "split",
    kind: "single",
    title: "How do the parts of the work relate to each other?",
    why: "Independent parts can be handled side by side and combined, which is faster. Steps that build on each other need to run in order, with a check between them.",
    appliesWhen: (a) => a.shape === "judgement",
    options: [
      {
        value: "sequential",
        label: "Each step builds on the last",
        hint: "Draft, then translate, then summarise.",
        short: "each step builds on the last",
      },
      {
        value: "sections",
        label: "Separate parts can be done side by side",
        hint: "One person checks the numbers while another checks the wording.",
        short: "separate parts can be done side by side",
      },
      {
        value: "voting",
        label: "It helps to get several independent opinions",
        hint: "Like asking three reviewers and going with the majority.",
        short: "several independent opinions would help",
      },
    ],
  },
  {
    id: "roles",
    kind: "single",
    title: "If you hired people for this, what would the team look like?",
    why: "Like hiring, one capable generalist is simpler and cheaper, but can get overwhelmed. Several specialists each own an area but have to coordinate. The same trade-off decides between one AI agent and several.",
    appliesWhen: (a) => a.shape === "varies",
    options: [
      {
        value: "one",
        label: "One capable person could handle it",
        short: "one capable person could handle it",
      },
      {
        value: "specialists",
        label: "A few distinct specialists",
        hint: "For example, a researcher, a writer and a reviewer.",
        short: "it needs a few distinct specialists",
      },
      {
        value: "material",
        label: "One role, but far too much material for one person to keep track of",
        short: "there is too much material for one person to keep track of",
      },
      {
        value: "both",
        label: "Several specialists, and a lot of material",
        short: "it needs several specialists and involves a lot of material",
      },
    ],
  },
  {
    id: "quality",
    kind: "single",
    title: "Could you write down what a good result looks like?",
    why: "If good can be described, the system can check its own work against that description, and you can measure whether a cheaper setup is good enough. If it can't, a person has to judge each result.",
    appliesWhen: usesAI,
    options: [
      {
        value: "clear",
        label: "Yes, as a clear checklist",
        hint: "Facts match the source, required fields are filled, tone follows the guide.",
        short: "a good result can be described as a clear checklist",
      },
      {
        value: "partly",
        label: "Partly. Some of it is a matter of taste",
        short: "a good result is partly a matter of taste",
      },
      {
        value: "no",
        label: "Not really. We know it when we see it",
        short: "a good result is hard to describe in advance",
      },
    ],
  },
  {
    id: "knowledge",
    kind: "multi",
    title: "What should it draw on every time? Choose any that apply.",
    why: "Standing instructions, reference documents and memory are each handled by a different building block. Knowing which you need decides which pieces to set up.",
    appliesWhen: usesAI,
    exclusive: "none",
    options: [
      {
        value: "playbook",
        label: "Our house rules, templates or step-by-step playbook",
        short: "it should follow your house rules or playbook",
      },
      {
        value: "reference",
        label: "Reference material",
        hint: "Policies, price lists, product details, past examples, a master resume.",
        short: "it should draw on reference material",
      },
      {
        value: "memory",
        label: "Memory of past work, so it improves over time",
        short: "it should remember past work and improve",
      },
      { value: "none", label: "Nothing special. General knowledge is enough", short: "general knowledge is enough" },
    ],
  },
  {
    id: "systems",
    kind: "single",
    title: "Does it need to work inside your other software?",
    why: "Reading from a system is low risk. Changing things in a system (sending, updating, ordering) is where most of the risk lives, so it changes how much freedom the setup should have.",
    options: [
      {
        value: "none",
        label: "No. Text or files in, text or files out",
        short: "it only needs text or files in and out",
      },
      {
        value: "read",
        label: "It needs to look things up",
        hint: "In your CRM, inbox, shared drive or database.",
        short: "it needs to look things up in your systems",
      },
      {
        value: "act",
        label: "It needs to take actions",
        hint: "Update records, send messages, place orders.",
        short: "it needs to take actions in your systems",
      },
    ],
  },
  {
    id: "trigger",
    kind: "single",
    title: "How should the work get started?",
    why: "Something you start yourself can live in an app you already use. Work that runs while you're away, or that reacts to events, needs a tool that runs on its own.",
    options: [
      { value: "manual", label: "I'll start it myself when I need it", short: "you'll start it yourself" },
      {
        value: "schedule",
        label: "On a schedule, while I'm away from my desk",
        short: "it should run on a schedule while you're away",
      },
      {
        value: "event",
        label: "Automatically, when something happens",
        hint: "A new email, form submission or file arrives.",
        short: "it should start automatically when something happens",
      },
      {
        value: "data",
        label: "When other data jobs have finished",
        hint: "Overnight imports, or reports that feed other reports.",
        short: "it depends on other data jobs finishing first",
      },
    ],
  },
  {
    id: "volume",
    kind: "single",
    title: "Roughly how often will it run?",
    why: "Volume drives cost. At high volume, the price per run matters more than the price of setup, and nobody can review every result by hand.",
    options: [
      { value: "occasional", label: "A few times a week", short: "it runs a few times a week" },
      { value: "daily", label: "Dozens of times a day", short: "it runs dozens of times a day" },
      { value: "high", label: "Hundreds of times a day or more", short: "it runs hundreds of times a day" },
    ],
  },
  {
    id: "risks",
    kind: "multi",
    title: "Which of these are true? Choose any that apply.",
    why: "These decide how much the system may do without a person signing off, and which safety checks it needs.",
    exclusive: "none",
    options: [
      {
        value: "visible",
        label: "Customers or partners will see the output",
        short: "customers or partners will see the output",
      },
      {
        value: "personal",
        label: "It handles personal or confidential information",
        short: "it handles personal or confidential information",
      },
      {
        value: "irreversible",
        label: "A mistake could cost money or be hard to undo",
        hint: "Payments, legal commitments, deleting data.",
        short: "a mistake could cost money or be hard to undo",
      },
      { value: "none", label: "None of these", short: "mistakes would be internal and easy to fix" },
    ],
  },
  {
    id: "location",
    kind: "single",
    title: "Are there limits on where this can run, or which AI providers you can use?",
    help: "Think about where the system will operate, not just where you are based.",
    why: "AI providers are not available everywhere, and some data has to stay in a particular country. These limits rule some tools in and others out.",
    options: [
      { value: "open", label: "No special limits", short: "there are no special limits on providers" },
      {
        value: "residency",
        label: "Data must stay in our region or on our own servers",
        short: "data must stay in your region or on your own servers",
      },
      {
        value: "restricted",
        label: "Some major AI providers aren't available or approved where we operate",
        hint: "For example, Anthropic's Claude models are not offered in mainland China.",
        short: "some major AI providers aren't available where you operate",
      },
      {
        value: "independence",
        label: "We'd rather not depend on a single AI company",
        short: "you'd rather not depend on a single AI company",
      },
    ],
  },
  {
    id: "team",
    kind: "single",
    title: "Which best describes your organisation?",
    why: "Budget and in-house skills decide what is realistic to run. Small teams usually do better paying per use; large ones can justify their own infrastructure.",
    options: [
      {
        value: "small",
        label: "A small team without developers, keeping monthly costs low",
        short: "you're a small team without developers",
      },
      {
        value: "mid",
        label: "A growing business with someone comfortable in no-code tools",
        short: "you have someone comfortable with no-code tools",
      },
      {
        value: "large",
        label: "A larger organisation with developers or an IT team",
        short: "you have developers or an IT team",
      },
    ],
  },
];

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<QuestionId, Question>;

export function activeQuestions(a: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.appliesWhen || q.appliesWhen(a));
}

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id];
  if (q.kind === "text") return typeof v === "string" && v.trim().length > 0;
  if (q.kind === "multi") return Array.isArray(v) && v.length > 0;
  return typeof v === "string" && v.length > 0;
}

export function firstUnanswered(a: Answers): Question | undefined {
  return activeQuestions(a).find((q) => !isAnswered(q, a));
}

export function isComplete(a: Answers): boolean {
  return firstUnanswered(a) === undefined;
}

/** Drops answers to questions that no longer apply, so stale choices never leak into the result. */
export function effectiveAnswers(a: Answers): Answers {
  const out: Answers = {};
  for (const q of activeQuestions(a)) {
    if (a[q.id] !== undefined) (out as Record<string, unknown>)[q.id] = a[q.id];
  }
  return out;
}

/** The short phrase for an answer, used in explanations. */
export function said(a: Answers, id: QuestionId): string {
  const q = QUESTION_BY_ID[id];
  const v = a[id];
  if (!q.options || v === undefined) return "";
  const values = Array.isArray(v) ? v : [v];
  const parts = values.map((x) => q.options!.find((o) => o.value === x)?.short).filter(Boolean) as string[];
  if (parts.length <= 1) return parts[0] ?? "";
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

/** The short phrase for one specific option, when only that choice matters. */
export function saidOption(id: QuestionId, value: string): string {
  return QUESTION_BY_ID[id].options?.find((o) => o.value === value)?.short ?? "";
}

export function optionLabel(id: QuestionId, value: string): string {
  return QUESTION_BY_ID[id].options?.find((o) => o.value === value)?.label ?? value;
}
