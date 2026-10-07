import { Brain, ChartBar, Envelope, FileText, GearSix, GitFork, Lightbulb, MagnifyingGlass, PencilSimple, Plug, TrayArrowDown, TreeStructure, UserCheck, type Icon } from "@phosphor-icons/react";
import type { BNode, Blueprint } from "../lib/blueprint";

// The hub-and-spoke picture on the Solution view: the step that leads the work
// in the middle, where the work comes in on the left, where it ends on the
// right, and up to three key steps underneath. Drawn from the design itself, so
// it always matches the workflow; the full diagram lives in the Workflow view.

const role = (n: BNode) => (n.engine?.kind === "model" ? n.engine.role : undefined);

/** The step that leads: a coordinator or agent, else the first AI step, else the first working step. */
export function leadStep(bp: Blueprint): BNode | undefined {
  return (
    bp.nodes.find((n) => role(n) === "coordinator" || role(n) === "agent") ??
    bp.nodes.find((n) => n.kind === "ai") ??
    bp.nodes.find((n) => n.kind === "decision" || n.kind === "fixed")
  );
}

/** Up to three steps worth showing under the lead: AI work first, then people, decisions, tools and fixed steps. */
export function keySteps(bp: Blueprint, lead = leadStep(bp), max = 3): BNode[] {
  const rank = (n: BNode) => (n.kind === "ai" ? 0 : n.kind === "human" ? 1 : n.kind === "decision" ? 2 : n.kind === "tool" ? 3 : 4);
  return bp.nodes
    .filter((n) => n !== lead && n.kind !== "start" && n.kind !== "end")
    .sort((a, b) => rank(a) - rank(b) || a.step - b.step)
    .slice(0, max)
    .sort((a, b) => a.step - b.step);
}

// What a step does, read from its name, picks its picture; its kind is the fallback.
const BY_WORD: [RegExp, Icon][] = [
  [/check|verif|review|valid|audit|screen|research|search|find|look ?up|evidence/i, MagnifyingGlass],
  [/draft|write|tailor|summar|reply|compose|edit|rewrite/i, PencilSimple],
  [/map|plan|sort|route|classif|triage|split|assign/i, GitFork],
  [/report|analy|score|measure|forecast/i, ChartBar],
  [/send|email|notify|message|deliver/i, Envelope],
];

function iconFor(n: BNode): Icon {
  if (n.kind === "human") return UserCheck;
  const word = BY_WORD.find(([re]) => re.test(n.name));
  if (word) return word[1];
  if (role(n) === "checker") return MagnifyingGlass;
  if (n.kind === "ai") return Lightbulb;
  if (n.kind === "decision") return GitFork;
  if (n.kind === "tool") return Plug;
  return GearSix;
}

const W = 1200;
const H = 750;
const R = 78;
const LEAD_R = 98;
const TOP = 270;
const BOTTOM = 575;

export function ArchitectureArt({ bp }: { bp: Blueprint }) {
  const lead = leadStep(bp);
  const start = bp.nodes.find((n) => n.kind === "start");
  const end = [...bp.nodes].reverse().find((n) => n.kind === "end");
  const below = keySteps(bp, lead);
  const xs = below.length === 1 ? [600] : below.length === 2 ? [430, 770] : [345, 600, 855];
  const LeadIcon = lead?.kind === "ai" || lead?.engine?.kind === "model" ? Brain : TreeStructure;
  const described = [
    start && `It starts with ${start.name.toLowerCase()}`,
    lead && `${lead.name} leads the work`,
    below.length && `with ${below.map((n) => n.name.toLowerCase()).join(", ")}`,
    end && `and ends with ${end.name.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(", ");

  const Spoke = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
    // Lines run between the circles' edges, with a small dot where each meets a circle.
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    // Spokes start from the lead (the larger circle, at x = 600) or end at it.
    const r1 = x1 === 600 && y1 === TOP ? LEAD_R : R;
    const r2 = x2 === 600 && y2 === TOP ? LEAD_R : R;
    const a = [x1 + ux * (r1 + 8), y1 + uy * (r1 + 8)];
    const b = [x2 - ux * (r2 + 8), y2 - uy * (r2 + 8)];
    return (
      <g className="stroke-accent fill-accent">
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={3} />
        <circle cx={a[0]} cy={a[1]} r={7} stroke="none" />
        <circle cx={b[0]} cy={b[1]} r={7} stroke="none" />
      </g>
    );
  };

  const Circle = ({ x, y, node, Glyph, filled = false }: { x: number; y: number; node?: BNode; Glyph: Icon; filled?: boolean }) => {
    // The lead step is drawn larger, as the hub everything connects to.
    const r = filled ? LEAD_R : R;
    const size = filled ? 84 : 68;
    return (
      <g>
        {node && <title>{`Step ${node.step}: ${node.name}`}</title>}
        <circle cx={x} cy={y} r={r} className={filled ? "fill-accent" : "fill-accent-soft stroke-ink"} strokeWidth={filled ? 0 : 3} />
        <Glyph x={x - size / 2} y={y - size / 2} size={size} weight="light" className={filled ? "text-accent-ink" : "text-ink"} />
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The architecture: ${described}.`} className="architecture-art">
      {start && <Spoke x1={170} y1={TOP} x2={600} y2={TOP} />}
      {end && <Spoke x1={600} y1={TOP} x2={1030} y2={TOP} />}
      {below.map((n, i) => (
        <Spoke key={n.id} x1={600} y1={TOP} x2={xs[i]} y2={BOTTOM} />
      ))}
      {start && <Circle x={170} y={TOP} node={start} Glyph={TrayArrowDown} />}
      {end && <Circle x={1030} y={TOP} node={end} Glyph={FileText} />}
      {below.map((n, i) => (
        <Circle key={n.id} x={xs[i]} y={BOTTOM} node={n} Glyph={iconFor(n)} />
      ))}
      <Circle x={600} y={TOP} node={lead} Glyph={LeadIcon} filled />
    </svg>
  );
}
