// Turns a recommendation into an architecture graph that can be drawn: steps
// arranged in stages (left to right) and tracks (parallel lanes), with
// decision points, human approvals, stop rules and feedback loops made explicit.
// It reads the rules engine's output and never changes the recommendation.

import { type Answers, effectiveAnswers, said } from "./questions";
import { TOOLS, type ToolId } from "./catalog";
import { type AlgorithmId, type Engine, algorithm, pickModel } from "./models";
import type { Recommendation, Why } from "./rules";

export type NodeKind = "start" | "ai" | "fixed" | "decision" | "human" | "tool" | "end";
export type Gate = { kind: "human" | "stop"; text: string };

/** The tool gate that means a person approves every change the agent makes. */
export const OK_EVERY_ACTION = "You OK every action";

export type BNode = {
  id: string;
  step: number;
  stage: number;
  /** Inclusive track range the node occupies. */
  tracks: [number, number];
  kind: NodeKind;
  name: string;
  /** Short role or tool label shown under the name. */
  label: string;
  gates: Gate[];
  /** The model or the non-AI method that does the work at this step. */
  engine?: Engine;
  what: string;
  why: string;
  passes: string;
  rules: string[];
  /** Knowledge-base chunks an AI-drafted step cites (see src/lib/design.ts). */
  kb?: { id: string; title: string }[];
};

export type EdgeStyle = "flow" | "loop" | "assign";
export type BEdge = { from: string; to: string; label?: string; style: EdgeStyle };

export type Blueprint = {
  variant: "recommended" | "simpler";
  title: string;
  /** The main tool this version runs in, for comparisons. */
  tool: string;
  summary: string;
  stages: number;
  tracks: number;
  nodes: BNode[];
  edges: BEdge[];
  captions: Record<number, string>;
};

export const KIND_LABEL: Record<NodeKind, string> = {
  start: "Start",
  ai: "AI step",
  fixed: "Fixed step",
  decision: "Decision",
  human: "Person",
  tool: "Your tools",
  end: "Finish",
};

const TOOL_SHORT: Record<string, string> = {
  n8n: "n8n",
  airflow: "Airflow",
  cowork: "Claude",
  claude: "Claude",
  hermes: "Hermes Agent",
  langgraph: "LangGraph",
  "n8n-agent": "n8n",
};

// ------------------------------------------------------------------ builder

type Draft = Omit<BNode, "step" | "tracks" | "gates" | "rules" | "stage"> & {
  stage: number;
  track?: number | [number, number];
  gates?: Gate[];
  rules?: string[];
};

class Graph {
  nodes: Draft[] = [];
  edges: BEdge[] = [];
  captions: Record<number, string> = {};
  stage = 0;
  minTracks = 1;

  add(n: Omit<Draft, "stage"> & { stage?: number }): Draft {
    const node: Draft = { ...n, stage: n.stage ?? this.stage };
    this.nodes.push(node);
    return node;
  }
  link(from: Draft | Draft[], to: Draft | Draft[], label?: string, style: EdgeStyle = "flow") {
    for (const f of Array.isArray(from) ? from : [from])
      for (const t of Array.isArray(to) ? to : [to]) this.edges.push({ from: f.id, to: t.id, label, style });
  }
  next() {
    this.stage += 1;
  }

  finish(variant: Blueprint["variant"], title: string, summary: string, tool: string): Blueprint {
    const tracks = Math.max(
      this.minTracks,
      ...this.nodes.map((n) => (n.track === undefined ? 1 : Array.isArray(n.track) ? n.track[1] + 1 : n.track + 1)),
    );
    const placed = this.nodes.map((n) => ({
      ...n,
      tracks: (n.track === undefined ? [0, tracks - 1] : Array.isArray(n.track) ? n.track : [n.track, n.track]) as [number, number],
      gates: n.gates ?? [],
      rules: n.rules ?? [],
    }));
    placed.sort((a, b) => a.stage - b.stage || a.tracks[0] - b.tracks[0]);
    const nodes: BNode[] = placed.map(({ track: _track, ...n }, i) => ({ ...n, step: i + 1 }));
    return {
      variant,
      title,
      tool,
      summary,
      stages: Math.max(...nodes.map((n) => n.stage)) + 1,
      tracks,
      nodes,
      edges: this.edges,
      captions: this.captions,
    };
  }
}

function whyOf(r: Recommendation, ruleId: string): Why | undefined {
  const all: Why[] = [
    ...r.approach.why,
    ...r.topology.why,
    ...r.tools.flatMap((t) => t.why),
    r.hosting.why,
    ...(r.hosting.also ?? []),
    ...r.autonomy.why,
    r.simpler.why,
  ];
  return all.find((w) => w.ruleId === ruleId);
}

function coreTool(r: Recommendation): ToolId {
  return r.tools.find((t) => t.core)!.tool;
}

const has = (r: Recommendation, t: ToolId) => r.tools.some((x) => x.tool === t);

// ------------------------------------------------------------------ shared pieces

function triggerEngine(a: Answers): Engine {
  const map: Record<string, AlgorithmId> = { manual: "manual", schedule: "cron", event: "event", data: "sensor" };
  return algorithm(map[a.trigger ?? "manual"]);
}

function startNode(g: Graph, r: Recommendation, a: Answers, home: string): Draft {
  const t = a.trigger;
  // When Hermes runs the agent, n8n is what watches for events (rule TL9).
  const customGraph = coreTool(r) === "langgraph";
  const watcher = coreTool(r) === "hermes" && has(r, "n8n") ? "n8n" : home;
  return g.add({
    id: "start",
    kind: "start",
    engine: triggerEngine(a),
    name: t === "manual" ? "You start it" : t === "schedule" ? "Scheduled start" : t === "event" ? "Something arrives" : "Data jobs finish",
    label:
      t === "manual"
        ? `In ${home}`
        : t === "schedule"
          ? customGraph ? "Application scheduler" : `${home} schedule`
          : t === "event"
            ? customGraph ? "Authenticated event endpoint" : `${watcher} trigger`
            : coreTool(r) === "airflow" || has(r, "airflow")
              ? "Airflow dependency"
              : "Timed after imports",
    what:
      t === "manual"
        ? "You hand the task over when you need it. Nothing runs on its own."
        : t === "schedule"
          ? "The system starts itself at set times, with nobody at the desk."
          : t === "event"
            ? "A new email, form or file starts a run automatically."
            : "The run waits until the data jobs it depends on have finished.",
    why: `You said ${said(a, "trigger")}.`,
    passes: "The new item, plus any context the next step needs.",
    rules: [r.tools.find((x) => x.core)!.why[0].ruleId],
  });
}

function endNode(g: Graph, r: Recommendation, a: Answers): Draft {
  const level = r.autonomy.level;
  const gates: Gate[] = [];
  if (level === 4 && r.models.needed) gates.push({ kind: "human", text: "Spot checks by a person" });
  return g.add({
    id: "end",
    kind: "end",
    name: a.systems === "act" ? "Action is taken" : a.trigger === "manual" ? "Result is ready" : "Result goes out",
    label: a.systems === "act" ? "In your systems" : "Delivered output",
    gates,
    what:
      a.systems === "act"
        ? "The finished work is applied in your systems: a record updated, a message sent, an order placed."
        : "The finished result is delivered to whoever needs it.",
    why: "This is the outcome the task exists to produce. Every run, and every failure, should be logged so you can review it.",
    passes: "Nothing further. Logged results become new test examples over time.",
    rules: ["AU9"],
  });
}

/** Adds the approval stage implied by the autonomy level, then the finish. */
function approvalAndEnd(g: Graph, r: Recommendation, a: Answers, frontier: Draft[], skips: Draft[] = []) {
  const level = r.autonomy.level;
  const approvalWhy = r.autonomy.why[r.autonomy.why.length - 1]?.text ?? "";
  const gated = r.approach.id === "agent" || r.approach.id === "multi";

  if (level <= 2) {
    g.next();
    // Keep the approval step clear of lanes that bypass it (items a person already handled).
    const bypass = skips.filter((s) => s.kind === "human" && typeof s.track === "number").map((s) => s.track as number);
    const human = g.add({
      id: "approve",
      kind: "human",
      track: bypass.length ? [0, Math.min(...bypass) - 1] : undefined,
      name: "You approve each result",
      label: level === 1 ? "A person does the work" : "Before anything goes out",
      what: "A named person reviews every result before it leaves the system, and either approves it or sends it back.",
      why: `Autonomy starts at level ${level}. ${approvalWhy}`,
      passes: "Approved results only. Rejected ones go back with a note, and become test examples.",
      rules: r.autonomy.why.map((w) => w.ruleId),
    });
    // Everything the system produced needs approval; items a person already
    // handled go straight to the finish.
    g.link([...frontier, ...skips.filter((s) => s.kind !== "human")], human);
    g.next();
    const end = endNode(g, r, a);
    g.link(human, end, "approved");
    g.link(skips.filter((s) => s.kind === "human"), end);
    return;
  }

  if (level === 3 && !gated && frontier.length === 1) {
    g.minTracks = Math.max(g.minTracks, 2);
    g.next();
    const human = g.add({
      id: "approve",
      kind: "human",
      track: 0,
      name: "Sign-off for risky items",
      label: "Person approves",
      what: "Only items that cross an agreed line (an amount, a type of action, a sensitive customer) stop here for a person's sign-off.",
      why: `Autonomy starts at level 3: routine items go through on their own. ${approvalWhy}`,
      passes: "Approved high-risk items. Anything rejected goes back to a person to handle.",
      rules: r.autonomy.why.map((w) => w.ruleId),
    });
    g.link(frontier, human, "high-risk");
    g.next();
    const end = endNode(g, r, a);
    g.link(frontier, end, "routine");
    g.link(human, end, "approved");
    g.link(skips, end);
    return;
  }

  if (level === 3 && gated && !g.nodes.some((n) => n.gates?.some((x) => x.kind === "human"))) {
    const lead = g.nodes.find((n) => n.id === "agent" || n.id === "coord")!;
    lead.gates = [...(lead.gates ?? []), { kind: "human", text: "Stuck cases go to a person" }];
  }
  if (level === 3 && !gated) {
    for (const f of frontier) f.gates = [...(f.gates ?? []), { kind: "human", text: "Risky items need sign-off" }];
  }
  g.next();
  const end = endNode(g, r, a);
  g.link(frontier, end);
  g.link(skips, end);
}

/** The checker step from the generator-and-checker pattern. */
function evaluator(g: Graph, r: Recommendation, a: Answers, producer: Draft, track?: number | [number, number]): Draft {
  g.next();
  const check = g.add({
    id: "check",
    kind: "decision",
    engine: pickModel("checker", a),
    track,
    name: "Check against your checklist",
    label: "Checker model",
    gates: [{ kind: "stop", text: "3 tries, then a person" }],
    what: "A second AI pass compares the work with your written checklist. If it fails, specific feedback goes back for a fix.",
    why: whyOf(r, "T11")?.text ?? `You said ${said(a, "quality")}.`,
    passes: "Work that passes the checklist. After three failed rounds, the case goes to a person instead.",
    rules: ["T11"],
  });
  g.link(producer, check);
  g.link(check, producer, "fix", "loop");
  return check;
}

// ------------------------------------------------------------------ recommended

export function buildBlueprint(r: Recommendation, raw: Answers): Blueprint {
  const a = effectiveAnswers(raw);
  const g = new Graph();
  const core = coreTool(r);
  const home = TOOL_SHORT[core];
  const addOns = r.topology.addOns;
  const level = r.autonomy.level;
  const start = startNode(g, r, a, home);

  const aiWhere = core === "claude" || core === "hermes" ? (has(r, "skill") ? `${home} with your Skill` : home) : `AI step in ${home}`;
  const playbookNote = has(r, "skill")
    ? " It follows the steps in your Skill."
    : a.knowledge?.includes("playbook")
      ? " Your playbook is part of its instructions."
      : "";
  const refNote = has(r, "resources") ? " It draws on your reference library rather than guessing." : "";

  // ---------------------------------------------------------------- automation
  if (r.approach.id === "automation") {
    if (r.topology.primary === "dag") {
      // Two upstream jobs replace the single start, so the dependency is visible.
      g.nodes = g.nodes.filter((n) => n.id !== "start");
      const job1 = g.add({
        id: "job1",
        kind: "start",
        track: 0,
        name: "First data job lands",
        label: "Upstream import",
        what: "An earlier job, such as an overnight import, finishes and its data is ready.",
        why: `You said ${said(a, "trigger")}.`,
        passes: "Fresh data for your task.",
        rules: ["T2"],
      });
      const job2 = g.add({
        id: "job2",
        kind: "start",
        track: 1,
        name: "Second data job lands",
        label: "Upstream import",
        what: "Another job your task depends on finishes.",
        why: "Your task needs both sets of data, so it must wait for both.",
        passes: "The rest of the data your task needs.",
        rules: ["T2"],
      });
      g.next();
      const run = g.add({
        id: "run",
        kind: "fixed",
        engine: algorithm("dag"),
        name: "Run your task",
        label: home,
        gates: [{ kind: "stop", text: "Failures alert a person" }],
        what: "Your rules run once every input is ready, the same way every time.",
        why: whyOf(r, "T2")?.text ?? "",
        passes: "The finished output.",
        rules: ["T2", core === "airflow" ? "TL1" : "TL2"],
      });
      g.link([job1, job2], run, "both ready");
      approvalAndEnd(g, r, a, [run]);
    } else {
      g.next();
      const rules = g.add({
        id: "rules",
        kind: "decision",
        engine: algorithm("table"),
        name: "Check the rules",
        label: `Rules in ${home}`,
        gates: [{ kind: "stop", text: "Failures alert a person" }],
        what: "The workflow compares the item with your written rules and picks the matching path. No AI is involved.",
        why: whyOf(r, "A1")?.text ?? "",
        passes: "The item, to the action its rules call for.",
        rules: ["A1", "T1", "AU9"],
      });
      g.link(start, rules);
      g.next();
      const via = a.systems === "none" ? "Fixed step" : "Via app connections";
      const actA = g.add({
        id: "actA",
        kind: "fixed",
        engine: algorithm("scripted"),
        track: 0,
        name: "Matching action",
        label: via,
        what: "When a rule matches, the workflow carries out the action that rule specifies.",
        why: "Each rule maps to one clear action, so the outcome is predictable and easy to audit.",
        passes: "The completed action.",
        rules: ["T1", ...(a.systems !== "none" ? ["TL12"] : [])],
      });
      const actB = g.add({
        id: "actB",
        kind: "fixed",
        engine: algorithm("scripted"),
        track: 1,
        name: "Default action",
        label: via,
        what: "Anything no rule matches takes the default path, such as logging it or doing nothing.",
        why: "Every item needs a defined outcome, including the ones that match no rule.",
        passes: "The completed action.",
        rules: ["T1"],
      });
      g.link(rules, actA, "match");
      g.link(rules, actB, "no match");
      approvalAndEnd(g, r, a, [actA, actB]);
    }
    return g.finish("recommended", r.approach.title, summaryOf(r, home), TOOLS[core].name);
  }

  // ---------------------------------------------------------------- AI workflow
  if (r.approach.id === "workflow") {
    let frontier: Draft[];
    const skips: Draft[] = [];
    const hasEval = addOns.includes("evaluator");

    if (r.topology.primary === "routing") {
      g.next();
      const router = g.add({
        id: "router",
        kind: "decision",
        engine: pickModel("router", a),
        name: "Sort by type",
        label: "Small, fast model",
        what: "A quick AI step reads each item and decides which type it is, so it can go down the right path.",
        why: whyOf(r, "T3")?.text ?? "",
        passes: "The item, labelled with its type, to that type's path.",
        rules: ["T3", "M7"],
      });
      g.link(start, router);
      g.next();
      g.captions[g.stage] = "One path per type";
      const parallel = addOns.includes("parallel-sections") || addOns.includes("parallel-voting");
      const routeGates: Gate[] = hasEval ? [{ kind: "stop", text: "Checked against checklist" }] : [];
      const routeLabel = parallel ? "Checks run side by side" : aiWhere;
      const typeA = g.add({
        id: "typeA",
        kind: "ai",
        engine: pickModel("worker", a),
        track: 0,
        name: "Most common type",
        label: routeLabel,
        gates: routeGates,
        what: `This path has its own instructions and tools for the most frequent type of request.${playbookNote}${refNote}`,
        why: "Instructions written for one type are simpler and more reliable than one set that tries to cover everything.",
        passes: "A finished draft for this type.",
        rules: ["T3", ...(parallel ? ["T7"] : []), ...(hasEval ? ["T11"] : [])],
      });
      const typeB = g.add({
        id: "typeB",
        kind: "ai",
        engine: pickModel("worker", a),
        track: 1,
        name: "Other known types",
        label: routeLabel,
        gates: routeGates,
        what: `Each other known type gets its own path like this one, with instructions tuned to it.${refNote}`,
        why: "Separate paths can be tested and improved one at a time.",
        passes: "A finished draft for this type.",
        rules: ["T3"],
      });
      const unclear = g.add({
        id: "unclear",
        kind: "human",
        track: 2,
        name: "Unclear items",
        label: "Sent to a person",
        what: "Anything the sorting step isn't confident about goes straight to a person instead of being guessed.",
        why: "Misrouted items are the most common failure in this pattern. A safe default path prevents it.",
        passes: "The person's answer, straight to the finish.",
        rules: ["T3"],
      });
      g.link(router, typeA);
      g.link(router, typeB);
      g.link(router, unclear, "not sure");
      frontier = [typeA, typeB];
      skips.push(unclear);
    } else if (r.topology.primary === "parallel-sections" || r.topology.primary === "parallel-voting") {
      const voting = r.topology.primary === "parallel-voting";
      g.next();
      g.captions[g.stage] = "At the same time";
      const lanes = ["A", "B", "C"].map((x, i) =>
        g.add({
          id: `part${x}`,
          kind: "ai",
          engine: pickModel(voting ? "attempt" : "worker", a),
          track: i,
          name: voting ? `Independent attempt ${x}` : `Section ${x}`,
          label: aiWhere,
          what: voting
            ? "The same task is done independently, without seeing the other attempts."
            : `One independent part of the work is handled on its own, at the same time as the others.${playbookNote}`,
          why: whyOf(r, voting ? "T5" : "T4")?.text ?? "",
          passes: voting ? "One answer, to be compared with the others." : "Findings for this part, to be combined.",
          rules: [voting ? "T5" : "T4"],
        }),
      );
      g.link(start, lanes);
      g.next();
      const merge = g.add({
        id: "merge",
        kind: voting ? "decision" : "fixed",
        engine: algorithm(voting ? "vote" : "merge"),
        name: voting ? "Compare the answers" : "Combine the results",
        label: voting ? "Majority wins" : "Merge step",
        gates: voting ? [{ kind: "stop", text: "No majority: to a person" }] : [],
        what: voting
          ? "The attempts are compared. If most agree, that answer goes ahead; if they don't, a person decides."
          : "The separate findings are merged into one result.",
        why: voting ? "Several independent opinions make a single bad judgement less likely to slip through." : "Each part was done separately, so something has to put them back together.",
        passes: "One combined result.",
        rules: [voting ? "T5" : "T4"],
      });
      g.link(lanes, merge);
      frontier = [merge];
    } else {
      g.next();
      const step1 = g.add({
        id: "step1",
        kind: "ai",
        engine: pickModel("worker", a),
        name: "First AI step",
        label: aiWhere,
        what: `The first part of the job, for example reading the input and producing a draft.${playbookNote}${refNote}`,
        why: whyOf(r, "T6")?.text ?? "",
        passes: "A draft, to be checked before the next step.",
        rules: ["T6", "A2"],
      });
      g.link(start, step1);
      g.next();
      const gate = g.add({
        id: "gate",
        kind: "decision",
        engine: algorithm("validate"),
        name: "Quality gate",
        label: "Automatic check",
        gates: [{ kind: "stop", text: "3 failures, then a person" }],
        what: "A simple automatic check confirms the draft is complete and in the right format before work continues.",
        why: "Catching a problem between steps is cheaper than fixing it at the end.",
        passes: "Drafts that pass. Failures go back to step one.",
        rules: ["T6", "AU9"],
      });
      g.link(step1, gate);
      g.link(gate, step1, "retry", "loop");
      g.next();
      const step2 = g.add({
        id: "step2",
        kind: "ai",
        engine: pickModel("worker", a),
        name: "Second AI step",
        label: aiWhere,
        what: "The next part of the job builds on the checked draft, for example refining, translating or formatting it.",
        why: "Each step does one thing, which makes each one easier to test and improve.",
        passes: "The finished work.",
        rules: ["T6"],
      });
      g.link(gate, step2, "pass");
      frontier = [step2];
    }

    if (hasEval && frontier.length === 1) frontier = [evaluator(g, r, a, frontier[0])];
    if (!g.nodes.some((n) => n.gates?.some((x) => x.kind === "stop"))) {
      const firstAi = g.nodes.find((n) => n.kind === "ai")!;
      firstAi.gates = [...(firstAi.gates ?? []), { kind: "stop", text: "3 failures, then a person" }];
    }
    approvalAndEnd(g, r, a, frontier, skips);
    return g.finish("recommended", r.approach.title, summaryOf(r, home), TOOLS[core].name);
  }

  // ---------------------------------------------------------------- agents
  const multi = r.approach.id === "multi";
  const routed = addOns.includes("routing");
  const band = (from: number, to: number): [number, number] => [from, to];
  let skips: Draft[] = [];
  let entry: Draft = start;

  if (routed) {
    g.next();
    entry = g.add({
      id: "router",
      kind: "decision",
      engine: pickModel("router", a),
      name: "Routine or open-ended?",
      label: "Small, fast model",
      what: "A quick AI step separates routine requests, which follow a fixed path, from the open-ended ones that need an agent.",
      why: whyOf(r, "T10")?.text ?? "",
      passes: "Routine items to the fixed path; everything else to the agent.",
      rules: ["T10", "M7"],
    });
    g.link(start, entry);
  }

  const toolGate: Gate[] =
    a.systems === "act" && level <= 3
      ? [{ kind: "human", text: level <= 2 ? OK_EVERY_ACTION : "You OK risky actions" }]
      : [];
  const toolNode = (track: number, stage?: number): Draft =>
    g.add({
      id: "tools",
      kind: "tool",
      stage,
      track,
      name: a.systems === "none" ? "Works on the material" : a.systems === "read" ? "Looks things up" : "Uses your systems",
      label: has(r, "mcp") ? "MCP connectors" : "Files and documents",
      gates: toolGate,
      what:
        a.systems === "act"
          ? "The agent acts through connectors: looking up records and making changes, with only the permissions this task needs."
          : a.systems === "read"
            ? "The agent looks up what it needs in your systems through read-only connectors."
            : "The agent reads and writes the documents involved in the task.",
      why: whyOf(r, "TL11")?.text ?? `You said ${said(a, "systems")}.`,
      passes: "The result of each action, back to the agent, which decides what to do next.",
      rules: has(r, "mcp") ? ["TL11", ...(toolGate.length ? ["AU8"] : [])] : ["T8"],
    });

  let producer: Draft;
  g.next();
  if (routed) g.captions[g.stage] = "Two paths";
  const offset = routed ? 1 : 0;

  if (routed) {
    const routine = g.add({
      id: "routine",
      kind: "fixed",
      engine: algorithm("scripted"),
      track: 0,
      name: "Routine: fixed steps",
      label: "Set workflow",
      what: "Predictable requests follow a fixed, tested workflow. No agent is needed for them.",
      why: "Routine types rarely need an agent, so keeping them on a fixed path cuts cost and risk.",
      passes: "The finished routine item, straight to the finish.",
      rules: ["T10"],
    });
    g.link(entry, routine, "routine");
    skips = [routine];
  }

  if (!multi) {
    const agent = g.add({
      id: "agent",
      kind: "ai",
      track: offset,
      engine: pickModel("agent", a),
      name: "Agent works the case",
      label: `Agent in ${home}`,
      gates: [{ kind: "stop", text: "Stops at goal or step limit" }],
      what: `The agent decides the next step, acts, looks at the result and repeats until the goal is met.${playbookNote}${refNote}`,
      why: whyOf(r, "A3")?.text ?? "",
      passes: "A finished case once the goal is met, or a hand-off to a person if it hits its step limit.",
      rules: ["A3", "T8", "AU9"],
    });
    g.link(entry, agent, routed ? "open-ended" : undefined);
    const tools = toolNode(offset + 1);
    g.link(agent, tools, "act");
    g.link(tools, agent, "result", "loop");
    producer = agent;
  } else {
    const coord = g.add({
      id: "coord",
      kind: "ai",
      engine: pickModel("coordinator", a),
      track: band(offset, offset + 2 - (routed ? 1 : 0)),
      name: "Coordinator plans",
      label: `Agent in ${home}`,
      gates: [
        { kind: "stop", text: "Stops after set rounds" },
        ...(toolGate.length ? toolGate : []),
      ],
      what: "A coordinating agent breaks the case into pieces and decides which specialist handles each one.",
      why: whyOf(r, "A4")?.text ?? "",
      passes: "A clear brief for each specialist: what to do and what to hand back.",
      rules: ["A4", "T9", "AU9"],
    });
    g.link(entry, coord, routed ? "open-ended" : undefined);
    g.next();
    g.captions[g.stage] = "Specialists, at the same time";
    const count = routed ? 2 : 3;
    const material = a.roles === "material";
    const specs = ["A", "B", "C"].slice(0, count).map((x, i) =>
      g.add({
        id: `spec${x}`,
        kind: "ai",
        engine: pickModel("specialist", a),
        track: offset + i,
        name: material ? `Covers area ${x}` : `Specialist ${x}`,
        label: material ? "Own slice of material" : "Own brief and tools",
        what: material
          ? "This agent works only on its share of the material, so nothing gets lost in an overloaded context."
          : "This agent has one role, its own instructions and only the tools that role needs.",
        why: material ? `You said ${said(a, "roles")}.` : "Separate roles each get their own brief, like hiring specialists.",
        passes: "Its finished piece, back to the coordinator.",
        rules: ["A4", "T9", "TL13"],
      }),
    );
    g.link(coord, specs, undefined, "assign");
    g.next();
    const combine = g.add({
      id: "combine",
      kind: "ai",
      engine: pickModel("coordinator", a),
      track: band(offset, offset + count - 1),
      name: "Coordinator combines",
      label: `Agent in ${home}`,
      what: "The coordinator assembles the pieces, spots gaps and, if needed, sends work out for another round.",
      why: "One agent stays responsible for the whole result, which keeps a single clear line of accountability.",
      passes: "The combined result, or a new round of assignments if something is missing.",
      rules: ["T9"],
    });
    g.link(specs, combine);
    g.link(combine, coord, "gaps found", "loop");
    producer = combine;
  }

  let frontier: Draft[] = [producer];
  if (addOns.includes("evaluator") && multi && routed) {
    // Keeps the widest design within seven stages: the coordinator runs the check itself.
    producer.gates = [...(producer.gates ?? []), { kind: "stop", text: "Checked against checklist" }];
    producer.rules = [...(producer.rules ?? []), "T11"];
  } else if (addOns.includes("evaluator")) {
    frontier = [evaluator(g, r, a, producer, routed ? band(1, 2) : undefined)];
  }
  approvalAndEnd(g, r, a, frontier, skips);
  return g.finish("recommended", r.approach.title, summaryOf(r, home), TOOLS[core].name);
}

function summaryOf(r: Recommendation, home: string): string {
  const n = r.approach.id;
  return n === "automation"
    ? `A rules-based workflow in ${home}. No AI model is involved.`
    : n === "workflow"
      ? `A fixed workflow in ${home}. AI handles only the steps that need judgement.`
      : n === "agent"
        ? `One AI agent, run in ${home}, works each case in a loop with your tools.`
        : `A coordinator agent in ${home} hands work to specialist agents and combines what they return.`;
}

// ------------------------------------------------------------------ simpler start

export function buildSimplerBlueprint(r: Recommendation, raw: Answers): Blueprint {
  const a = effectiveAnswers(raw);
  const g = new Graph();
  const id = r.simpler.why.ruleId;
  const why = r.simpler.why.text;
  const home = TOOL_SHORT[coreTool(r)];

  const begin = (name: string, label: string) =>
    g.add({
      id: "start",
      kind: "start",
      engine: triggerEngine(a),
      name,
      label,
      what: "Work starts the way it does today.",
      why: `You said ${said(a, "trigger")}.`,
      passes: "The item to work on.",
    });
  const finish = (from: Draft | Draft[], name = "Result is ready") => {
    g.next();
    const end = g.add({
      id: "end",
      kind: "end",
      name,
      label: "Delivered output",
      what: "The result goes out, exactly as it would in the full design.",
      why: "The outcome doesn't change; only how much is automated.",
      passes: "Nothing further. Note what went wrong: it shapes the full design.",
    });
    g.link(from, end);
  };

  if (id === "S1") {
    const s = begin(a.trigger === "manual" ? "You start it" : "Work arrives", "As today");
    g.next();
    const agent = g.add({
      id: "agent",
      kind: "ai",
      track: 0,
      engine: pickModel("agent", a),
      name: "One agent, every role",
      label: `Agent in ${home}`,
      gates: [{ kind: "stop", text: "Stops at goal or step limit" }],
      what: "A single agent takes on each role in turn, guided by one clear brief.",
      why,
      passes: "The finished case.",
      rules: ["S1"],
    });
    const tools = g.add({
      id: "tools",
      kind: "tool",
      track: 1,
      name: "Uses your tools",
      label: has(r, "mcp") ? "MCP connectors" : "Files and documents",
      what: "The same tools the full design would use.",
      why: "Tools don't change; only the number of agents does.",
      passes: "Results back to the agent.",
    });
    g.link(s, agent);
    g.link(agent, tools, "act");
    g.link(tools, agent, "result", "loop");
    g.next();
    const review = g.add({
      id: "approve",
      kind: "human",
      name: "You review each result",
      label: "Person",
      what: "You check every result while you learn where one agent struggles.",
      why: "Those struggles show exactly where specialists would help.",
      passes: "Approved results.",
      rules: ["S1"],
    });
    g.link(agent, review);
    finish(review);
  } else if (id === "S2") {
    const s = begin("Work arrives", "As today");
    g.next();
    const sort = g.add({
      id: "sort",
      kind: "decision",
      engine: algorithm("keyword"),
      name: "Is it the common case?",
      label: "Simple rules",
      what: "A simple rule decides whether the item matches your most frequent case.",
      why,
      passes: "Common cases to the workflow; everything else to a person.",
      rules: ["S2"],
    });
    g.link(s, sort);
    g.next();
    const flow = g.add({
      id: "flow",
      kind: "fixed",
      engine: algorithm("scripted"),
      track: 0,
      name: "Fixed workflow",
      label: "Common case only",
      what: "Your most frequent case follows a fixed, tested set of steps.",
      why: "Most of the volume, with none of an agent's unpredictability.",
      passes: "The finished common case.",
      rules: ["S2"],
    });
    const person = g.add({
      id: "person",
      kind: "human",
      track: 1,
      name: "A person handles the rest",
      label: "As today",
      what: "Unusual cases are handled by a person, the way they are now.",
      why: "These are the cases an agent would have to learn. Logging them tells you if one is worth building.",
      passes: "The finished unusual case.",
      rules: ["S2"],
    });
    g.link(sort, flow, "yes");
    g.link(sort, person, "no");
    finish([flow, person]);
  } else if (id === "S3" || id === "S4") {
    const s = begin("You paste in an example", "Claude, by hand");
    g.next();
    const prompt = g.add({
      id: "prompt",
      kind: "ai",
      engine: pickModel("worker", a),
      name: id === "S3" ? "Claude follows your playbook" : "One well-written prompt",
      label: id === "S3" ? "Claude + written playbook" : "Claude, examples attached",
      what:
        id === "S3"
          ? "You give Claude your written playbook and one real example at a time."
          : "A single prompt with good examples attached does the whole job in one go.",
      why,
      passes: "A draft for you to check.",
      rules: [id],
    });
    g.link(s, prompt);
    g.next();
    const review = g.add({
      id: "approve",
      kind: "human",
      name: "You check the result",
      label: "Person",
      what: "You compare the draft with what good looks like, and note what the instructions need to say.",
      why: "This teaches you what to automate before you pay to automate it.",
      passes: "Approved results.",
      rules: [id],
    });
    g.link(prompt, review);
    finish(review);
  } else {
    const s = begin(a.trigger === "manual" ? "You start it" : "Work arrives", "As today");
    g.next();
    const person = g.add({
      id: "person",
      kind: "human",
      name: "Follow the written checklist",
      label: "One-page checklist",
      what: "A person follows every rule and exception from a single written page.",
      why,
      passes: "The completed task, plus notes on any rule that needed changing.",
      rules: ["S5"],
    });
    g.link(s, person);
    finish(person, "Task is done");
  }

  const tool =
    id === "S1" ? TOOLS[coreTool(r)].name : id === "S2" ? "Your existing tools" : id === "S5" ? "A written checklist" : "Claude, used by hand";
  return g.finish("simpler", r.simpler.title, r.simpler.body, tool);
}

// ------------------------------------------------------------------ helpers for views

export function outgoing(bp: Blueprint, id: string) {
  return bp.edges.filter((e) => e.from === id).map((e) => ({ edge: e, node: bp.nodes.find((n) => n.id === e.to)! }));
}

export function incoming(bp: Blueprint, id: string) {
  return bp.edges.filter((e) => e.to === id).map((e) => ({ edge: e, node: bp.nodes.find((n) => n.id === e.from)! }));
}

export type Stats = { steps: number; ai: number; people: number; decisions: number; loops: number };

export function stats(bp: Blueprint): Stats {
  return {
    steps: bp.nodes.length,
    ai: bp.nodes.filter((n) => n.engine?.kind === "model").length,
    people: bp.nodes.filter((n) => n.kind === "human").length + bp.nodes.flatMap((n) => n.gates).filter((x) => x.kind === "human").length,
    decisions: bp.nodes.filter((n) => n.kind === "decision").length,
    loops: bp.edges.filter((e) => e.style === "loop").length,
  };
}

/** The flow in words, for copying, printing and screen readers. */
export function flowAsText(bp: Blueprint): string[] {
  return bp.nodes.map((n) => {
    const next = outgoing(bp, n.id)
      .map(({ edge, node }) => `step ${node.step}${edge.label ? ` (${edge.label})` : ""}`)
      .join(", ");
    const gates = n.gates.map((x) => x.text).join("; ");
    const engine = n.engine ? `, ${n.engine.kind === "model" ? "model" : "method"}: ${n.engine.short}` : "";
    return `${n.step}. ${n.name} [${KIND_LABEL[n.kind]}, ${n.label}${engine}]${gates ? `. ${gates}` : ""}${next ? `. Then: ${next}` : ""}.`;
  });
}

/** The models a design uses, with the steps that use each one. */
export function modelPlan(bp: Blueprint) {
  const groups = new Map<string, { engine: Engine; steps: number[]; first: string }>();
  for (const n of bp.nodes) {
    if (!n.engine || n.kind === "start") continue;
    const key = `${n.engine.kind}:${n.engine.short}`;
    const g = groups.get(key);
    if (g) g.steps.push(n.step);
    else groups.set(key, { engine: n.engine, steps: [n.step], first: n.id });
  }
  const all = [...groups.values()];
  // Most capable first: the main model leads, helpers follow.
  const rank: Record<string, number> = { opus: 0, openLarge: 1, sonnet: 2, haiku: 3, openSmall: 4 };
  const models = all
    .filter((x) => x.engine.kind === "model")
    .sort((x, y) => rank[(x.engine as { model: string }).model] - rank[(y.engine as { model: string }).model]);
  return { models, methods: all.filter((x) => x.engine.kind === "algorithm") };
}
