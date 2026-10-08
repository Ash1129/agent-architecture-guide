// AI-drafted architecture. The model drafts the steps and connections for the
// owner's task, in the task's own terms, citing the knowledge base. The rules
// stay in charge: checkDesign holds the draft to hard limits taken from the
// rules' own design for the same answers, and only a draft that passes every
// check becomes the blueprint the guide draws and builds from.
//
// What the model decides: the steps, their names and explanations, how they
// connect, which kind of AI step each one is, and which non-AI method a fixed
// step uses. What the rules decide: the model behind each AI step (from its
// role), how the work starts (from the trigger answer), the approach's limits
// on agents, every safeguard and person-in-the-loop step, and the layout.

import { type BEdge, type BNode, type Blueprint, type EdgeStyle, type Gate, type NodeKind, outgoing } from "./blueprint";
import { type AlgorithmId, ALGORITHMS, type Role, algorithm, pickModel } from "./models";
import { kitProblems } from "./kitcheck";
import type { Answers } from "./questions";
import type { Approach, Recommendation } from "./rules";
import { buildStarterKit } from "./starter";

export type DraftStep = {
  id: string;
  kind: NodeKind;
  name: string;
  label: string;
  role?: Role;
  method?: AlgorithmId;
  what: string;
  why: string;
  passes: string;
  gates?: Gate[];
  kb?: string[];
};
export type DesignDraft = { title?: string; summary: string; steps: DraftStep[]; edges: { from: string; to: string; label?: string; style: EdgeStyle }[] };

export type DesignResponse = { blueprint: Blueprint; source: "ai" | "cache"; model?: string };

/** A knowledge-base chunk the model was given in full, and so may cite. */
export type KbChunk = { id: string; title: string };

export const MAX_STEPS = 16;
const KINDS: NodeKind[] = ["start", "ai", "fixed", "decision", "human", "tool", "end"];
const STYLES: EdgeStyle[] = ["flow", "loop", "assign"];

/** The kinds of AI step each approach allows. The model behind each comes from the rules (pickModel). */
export const ROLES_FOR: Record<Approach, Role[]> = {
  automation: [],
  workflow: ["router", "worker", "attempt", "checker"],
  agent: ["router", "worker", "checker", "agent"],
  multi: ["router", "worker", "checker", "coordinator", "specialist"],
};
/** AI steps that end in a choice of path: sorting work, or judging it against a checklist. */
export const DECISION_ROLES: Role[] = ["router", "checker"];
export const DECISION_METHODS: AlgorithmId[] = ["table", "keyword", "vote", "validate"];
export const FIXED_METHODS: AlgorithmId[] = ["scripted", "merge", "validate", "table", "keyword", "dag"];
const LIMITS = { id: 24, name: 48, label: 40, what: 320, why: 320, passes: 220, gate: 60, edgeLabel: 24, title: 80, summary: 320 };

const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t && t.length <= max ? t : undefined;
};

export type DesignContext = { r: Recommendation; a: Answers; baseline: Blueprint; chunks: KbChunk[] };

/** A step id as written, tidied: models often use underscores or spaces, which read the same as hyphens. */
const tidyId = (v: unknown) => (typeof v === "string" ? v.trim().replace(/[_\s]+/g, "-") : v);

/**
 * Checks a draft against the hard limits and, if it passes, turns it into a
 * blueprint. Returns every problem found, worded so the model can fix them.
 */
export function checkDesign(raw: unknown, ctx: DesignContext): { blueprint?: Blueprint; problems: string[] } {
  const p: string[] = [];
  const d = raw as Partial<DesignDraft> | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.steps) || !Array.isArray(d.edges)) {
    return { problems: ['The design must be an object with "steps" and "edges" arrays.'] };
  }
  const { r, baseline } = ctx;
  const allowedKb = new Map(ctx.chunks.map((c) => [c.id, c]));
  const roles = ROLES_FOR[r.approach.id];

  // ---- steps
  const steps: DraftStep[] = [];
  const ids = new Set<string>();
  if (d.steps.length > MAX_STEPS) p.push(`Use at most ${MAX_STEPS} steps; there are ${d.steps.length}.`);
  for (const [i, s] of d.steps.entries()) {
    const raw = (s ?? {}) as Record<string, unknown>;
    const rawId = tidyId(raw.id);
    const id = typeof rawId === "string" && /^[A-Za-z][A-Za-z0-9-]{0,23}$/.test(rawId) ? rawId : undefined;
    const where = id ? `Step "${id}"` : `Step ${i + 1}`;
    if (!id) p.push(`${where} needs an id of letters, digits and hyphens, starting with a letter.`);
    else if (ids.has(id)) p.push(`${where} is a duplicate id.`);
    const kind = KINDS.includes(raw.kind as NodeKind) ? (raw.kind as NodeKind) : undefined;
    if (!kind) p.push(`${where} has an unknown kind.`);
    const name = text(raw.name, LIMITS.name);
    const label = text(raw.label, LIMITS.label);
    const what = text(raw.what, LIMITS.what);
    const why = text(raw.why, LIMITS.why);
    const passes = text(raw.passes, LIMITS.passes) ?? (kind === "end" ? "Nothing; the run is finished." : undefined);
    if (!name || !label || !what || !why || !passes) p.push(`${where} needs a name (up to ${LIMITS.name} characters), label (up to ${LIMITS.label}), what, why and passes.`);

    let role: Role | undefined;
    let method: AlgorithmId | undefined;
    if (kind === "ai" || (kind === "decision" && raw.role !== undefined)) {
      if (!roles.includes(raw.role as Role)) {
        p.push(
          roles.length
            ? `${where} needs a role from: ${(kind === "decision" ? roles.filter((x) => DECISION_ROLES.includes(x)) : roles).join(", ") || "none (use a method instead)"}.`
            : `${where} can't be an AI step: this design needs no AI, so use fixed steps and rule-based decisions.`,
        );
      } else if (kind === "decision" && !DECISION_ROLES.includes(raw.role as Role)) p.push(`${where} is an AI decision, so its role must be "router" (sorting) or "checker" (judging against a checklist).`);
      else role = raw.role as Role;
    }
    if (kind === "fixed" || (kind === "decision" && raw.role === undefined)) {
      const allowed = kind === "fixed" ? FIXED_METHODS : DECISION_METHODS;
      if (!allowed.includes(raw.method as AlgorithmId)) p.push(`${where} needs a method from: ${allowed.join(", ")}.`);
      else method = raw.method as AlgorithmId;
    }

    const gates: Gate[] = [];
    for (const g of Array.isArray(raw.gates) ? raw.gates : []) {
      const gt = text((g as Gate)?.text, LIMITS.gate);
      if ((g as Gate)?.kind === "human" || (g as Gate)?.kind === "stop") {
        if (gt) gates.push({ kind: (g as Gate).kind, text: gt });
        else p.push(`${where} has a safeguard without a short text (up to ${LIMITS.gate} characters).`);
      }
    }
    const kb = Array.isArray(raw.kb) ? [...new Set(raw.kb.filter((x): x is string => typeof x === "string"))] : [];
    const unknown = kb.filter((x) => !allowedKb.has(x));
    if (unknown.length) p.push(`${where} cites ${unknown.join(", ")}, which ${unknown.length > 1 ? "aren't chunks" : "isn't a chunk"} you were given. Cite only the KNOWLEDGE chunks above.`);
    if ((kind === "ai" || kind === "human" || kind === "decision") && !kb.some((x) => allowedKb.has(x))) p.push(`${where} must cite at least one KNOWLEDGE chunk that supports it.`);

    if (id && kind) {
      ids.add(id);
      steps.push({ id, kind, name: name ?? "", label: label ?? "", role, method, what: what ?? "", why: why ?? "", passes: passes ?? "", gates, kb: kb.filter((x) => allowedKb.has(x)) });
    }
  }

  // ---- what the rules fix in place
  const baseStarts = baseline.nodes.filter((n) => n.kind === "start");
  const starts = steps.filter((s) => s.kind === "start");
  const startIds = new Set(baseStarts.map((n) => n.id));
  if (starts.length !== baseStarts.length || starts.some((s) => !startIds.has(s.id))) {
    p.push(`Keep exactly the start steps given (ids: ${[...startIds].join(", ")}); they come from how the owner said the work starts.`);
  }
  if (!steps.some((s) => s.kind === "end")) p.push("The design needs at least one end step.");

  const used = steps.map((s) => s.role).filter(Boolean) as Role[];
  const count = (x: Role) => used.filter((u) => u === x).length;
  if (r.approach.id === "agent" && count("agent") !== 1) p.push(`This design is one AI agent, so exactly one step must have the role "agent" (found ${count("agent")}).`);
  if (r.approach.id === "multi" && count("coordinator") < 1) p.push('This design needs a coordinator agent: at least one step with the role "coordinator".');
  if (r.approach.id === "multi" && count("specialist") < 2) p.push('This design needs specialist agents: at least two steps with the role "specialist".');

  for (const kind of ["human", "tool"] as const) {
    const need = baseline.nodes.filter((n) => n.kind === kind).length;
    const have = steps.filter((s) => s.kind === kind).length;
    if (have < need) p.push(`Keep at least ${need} ${kind === "human" ? "person (human)" : "tool"} step${need > 1 ? "s" : ""}; the rules require ${need === 1 ? "it" : "them"} for these answers.`);
  }
  for (const n of baseline.nodes) {
    for (const g of n.gates) {
      if (!steps.some((s) => s.kind === n.kind && s.gates?.some((x) => x.kind === g.kind && x.text === g.text))) {
        p.push(`Keep the safeguard "${g.text}" (${g.kind === "human" ? "a person steps in" : "a stop rule"}) on a ${n.kind} step, word for word.`);
      }
    }
  }

  // ---- edges and the shape of the graph
  const edges: BEdge[] = [];
  const seen = new Set<string>();
  for (const e of d.edges) {
    const from = tidyId((e as BEdge)?.from) as string;
    const to = tidyId((e as BEdge)?.to) as string;
    const style = STYLES.includes((e as BEdge)?.style) ? (e as BEdge).style : undefined;
    if (!ids.has(from) || !ids.has(to)) {
      p.push(`A connection goes from "${from}" to "${to}", but both ends must be step ids.`);
      continue;
    }
    if (!style) p.push(`The connection ${from} -> ${to} needs a style: flow, loop or assign.`);
    if (from === to) p.push(`The connection ${from} -> ${to} goes nowhere.`);
    if (seen.has(`${from}>${to}`)) continue;
    seen.add(`${from}>${to}`);
    const label = (e as BEdge).label === undefined || (e as BEdge).label === null ? undefined : text((e as BEdge).label, LIMITS.edgeLabel);
    if ((e as BEdge).label && !label) p.push(`The label on ${from} -> ${to} must be up to ${LIMITS.edgeLabel} characters.`);
    edges.push({ from, to, ...(label ? { label } : {}), style: style ?? "flow" });
  }
  if (p.length) return { problems: p };

  const forward = edges.filter((e) => e.style !== "loop");
  const outs = (id: string, list = forward) => list.filter((e) => e.from === id).map((e) => e.to);
  // Forward connections must never form a cycle; going back is what "loop" is for.
  const order: string[] = [];
  const state = new Map<string, number>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 1) return false;
    if (state.get(id) === 2) return true;
    state.set(id, 1);
    for (const t of outs(id)) if (!visit(t)) return false;
    state.set(id, 2);
    order.unshift(id);
    return true;
  };
  for (const s of steps) if (!visit(s.id)) {
    p.push('The forward connections form a cycle. Mark connections that go back to an earlier step with style "loop".');
    break;
  }
  const reach = new Set(starts.map((s) => s.id));
  for (const id of order) if (reach.has(id)) for (const t of outs(id)) reach.add(t);
  for (const s of steps) {
    if (!reach.has(s.id)) p.push(`Step "${s.id}" can't be reached from the start by forward connections.`);
    const anyOut = edges.some((e) => e.from === s.id);
    if (s.kind === "end" && anyOut) p.push(`End step "${s.id}" can't lead anywhere.`);
    if (s.kind !== "end" && !anyOut) p.push(`Step "${s.id}" leads nowhere; connect it onward or make it an end step.`);
    if (s.kind === "start" && edges.some((e) => e.to === s.id)) p.push(`Start step "${s.id}" can't have connections into it.`);
  }
  // A tool step is something an AI step uses (in n8n it hangs off that step),
  // so it is called from an AI step and only loops back to it.
  for (const t of steps.filter((s) => s.kind === "tool")) {
    const callers = edges.filter((e) => e.to === t.id);
    if (!callers.length || callers.some((e) => steps.find((s) => s.id === e.from)?.kind !== "ai")) {
      p.push(`Tool step "${t.id}" must be used by an AI step: connect it only from "ai" steps. To fetch or update data as part of the flow, use a "fixed" step with method "scripted".`);
    }
    for (const e of edges.filter((x) => x.from === t.id)) {
      if (e.style !== "loop" || !callers.some((c) => c.from === e.to)) p.push(`Tool step "${t.id}" may only loop back to the AI step that uses it; ${e.from} -> ${e.to} doesn't.`);
    }
  }
  for (const e of edges.filter((x) => x.style === "loop")) {
    // A loop must go back to a step that leads, by forward connections, to where it starts.
    const back = new Set([e.to]);
    for (const id of order) if (back.has(id)) for (const t of outs(id)) back.add(t);
    if (!back.has(e.from)) p.push(`The loop ${e.from} -> ${e.to} doesn't go back to an earlier step; use "flow" instead.`);
  }
  if (p.length) return { problems: p };

  // Last, the design must build into a working starter kit, checked exactly as the tests check every kit.
  const blueprint = toBlueprint(d as DesignDraft, steps, edges, order, ctx);
  const kit = kitProblems(ctx.r, blueprint, ctx.a, buildStarterKit(ctx.r, blueprint, ctx.a));
  if (kit.length) return { problems: kit.slice(0, 6).map((x) => `The design doesn't build into a working starter kit: ${x}.`) };
  return { blueprint, problems: [] };
}

/** Lays the checked draft out and fills in what the rules decide. */
function toBlueprint(d: DesignDraft, steps: DraftStep[], edges: BEdge[], order: string[], ctx: DesignContext): Blueprint {
  const { a, baseline } = ctx;
  const kbTitle = new Map(ctx.chunks.map((c) => [c.id, c]));
  const base = new Map(baseline.nodes.map((n) => [n.id, n]));
  const forward = edges.filter((e) => e.style !== "loop");

  // Stages: the longest forward path from a start. A tool the agent calls and
  // gets results back from (it only loops back) sits beside that agent, in the
  // same column, as the rules draw it; a tool step in the main flow gets its own.
  const kindOf = new Map(steps.map((s) => [s.id, s.kind]));
  const sidecar = (id: string) => kindOf.get(id) === "tool" && !forward.some((e) => e.from === id);
  const stage = new Map<string, number>();
  for (const id of order) {
    const preds = forward.filter((e) => e.to === id).map((e) => stage.get(e.from) ?? 0);
    stage.set(id, preds.length ? Math.max(...preds) + (sidecar(id) ? 0 : 1) : 0);
  }
  const stages = Math.max(...stage.values()) + 1;
  const byStage: string[][] = Array.from({ length: stages }, () => []);
  for (const s of steps) byStage[stage.get(s.id)!].push(s.id);
  const tracks = Math.max(...byStage.map((x) => x.length));

  // Lanes: within a stage, keep each step near the steps that feed it.
  const centre = new Map<string, number>();
  const span = new Map<string, [number, number]>();
  for (const ids of byStage) {
    const pull = (id: string) => {
      const c = forward.filter((e) => e.to === id).map((e) => centre.get(e.from) ?? 0);
      return c.length ? c.reduce((x, y) => x + y, 0) / c.length : 0;
    };
    const sorted = [...ids].sort((x, y) => pull(x) - pull(y) || steps.findIndex((s) => s.id === x) - steps.findIndex((s) => s.id === y));
    let next = 0;
    sorted.forEach((id, i) => {
      const size = Math.floor(tracks / sorted.length) + (i < tracks % sorted.length ? 1 : 0);
      span.set(id, [next, next + size - 1]);
      centre.set(id, next + (size - 1) / 2);
      next += size;
    });
  }

  const nodes: BNode[] = steps
    .map((s) => {
      const b = base.get(s.id);
      const engine =
        s.kind === "start" ? b?.engine : s.role ? pickModel(s.role, a) : s.method ? algorithm(s.method) : undefined;
      return {
        id: s.id,
        step: 0,
        stage: stage.get(s.id)!,
        tracks: span.get(s.id)!,
        kind: s.kind,
        name: s.name,
        label: s.label,
        gates: s.gates ?? [],
        ...(engine ? { engine } : {}),
        what: s.what,
        why: s.why,
        passes: s.passes,
        // A step the model kept from the rules' design keeps its rule links.
        rules: b && b.kind === s.kind ? b.rules : [],
        kb: (s.kb ?? []).map((id) => kbTitle.get(id)!).filter(Boolean),
      };
    })
    .sort((x, y) => x.stage - y.stage || x.tracks[0] - y.tracks[0])
    .map((n, i) => ({ ...n, step: i + 1 }));

  const bp: Blueprint = { variant: "recommended", title: text(d.title, LIMITS.title) ?? baseline.title, tool: baseline.tool, summary: text(d.summary, LIMITS.summary) ?? baseline.summary, stages, tracks, nodes, edges, captions: {} };

  // Captions say why a stage has several steps side by side.
  for (const [i, all] of byStage.entries()) {
    const ids = all.filter((id) => !sidecar(id));
    if (ids.length < 2) continue;
    const fromDecision = ids.filter((id) => forward.some((e) => e.to === id && nodes.find((n) => n.id === e.from)?.kind === "decision")).length;
    if (fromDecision >= 2) bp.captions[i] = fromDecision === 2 ? "Two paths" : "One path per type";
    else if (ids.filter((id) => forward.some((e) => e.to === id)).length >= 2 && ids.some((id) => outgoing(bp, id).length)) bp.captions[i] = "At the same time";
  }
  return bp;
}

/** The design as the model sees it: the rules' version, in the draft format. */
export function asDraft(bp: Blueprint): DesignDraft {
  return {
    title: bp.title,
    summary: bp.summary,
    steps: bp.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      name: n.name,
      label: n.label,
      ...(n.engine?.kind === "model" ? { role: n.engine.role } : {}),
      ...(n.engine?.kind === "algorithm" && n.kind !== "start" ? { method: (Object.keys(ALGORITHMS) as AlgorithmId[]).find((k) => ALGORITHMS[k].name === n.engine!.name) } : {}),
      what: n.what,
      why: n.why,
      passes: n.passes,
      gates: n.gates,
    })),
    edges: bp.edges.map((e) => ({ from: e.from, to: e.to, ...(e.label ? { label: e.label } : {}), style: e.style })),
  };
}
