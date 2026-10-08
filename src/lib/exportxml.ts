// A result's workflow as a draw.io file (mxGraph XML, which draw.io opens
// directly). Every step becomes a shape in the app's colours and shapes, laid
// out as the app's own diagram lays it out (stages across, lanes down), with
// labelled connections and dashed loops. Each shape also carries everything
// the walkthrough's flipped card shows (the model or method, what happens, why
// it's there, what it passes on, safeguards, next steps, rules and knowledge
// base) as shape data: draw.io shows it on hover and under Edit Data.

import { type BNode, type Blueprint, KIND_LABEL, type NodeKind, outgoing } from "./blueprint";
import { LAST_REVIEWED } from "./catalog";
import { OPEN_LARGE_PICKS } from "./models";
import { RULES } from "./rules";

/** Escapes text for an XML attribute. */
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "&#10;");
/** Escapes text placed inside a shape's HTML label. */
const h = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const attrs = (a: Record<string, unknown>) =>
  Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("");

// The app's colours and shapes, as draw.io styles.
const BASE = "whiteSpace=wrap;html=1;fontFamily=Helvetica;fontSize=12;fontColor=#13201b;spacing=8;";
const STYLE: Record<NodeKind, string> = {
  start: `rounded=1;arcSize=50;${BASE}fillColor=#1c6650;strokeColor=#1c6650;fontColor=#ffffff;`,
  end: `rounded=1;arcSize=50;${BASE}fillColor=#1c6650;strokeColor=#1c6650;fontColor=#ffffff;`,
  fixed: `rounded=1;arcSize=8;${BASE}fillColor=#eef2f0;strokeColor=#8aa398;`,
  ai: `rounded=1;arcSize=8;${BASE}fillColor=#fdebd2;strokeColor=#e0802a;strokeWidth=2;`,
  decision: `rhombus;${BASE}fillColor=#fff6d6;strokeColor=#cfa52c;`,
  human: `shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=16;${BASE}fillColor=#fde4e1;strokeColor=#cf4a42;strokeWidth=2;dashed=1;`,
  tool: `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=12;${BASE}fillColor=#e3eefb;strokeColor=#4a7fc1;`,
};
const WHO: Record<NodeKind, string> = { start: "Trigger", end: "Finish", fixed: "System", ai: "AI", decision: "Decision", human: "Person", tool: "Tools" };

// Layout: one column per stage, one lane per track, as the app's diagram does it.
const COL_W = 220;
const GAP_X = 90;
const ROW_H = 130;
const GAP_Y = 40;
const LEFT = 40;
const TOP = 150;

/** A shape's size: decisions need room for their diamond. */
const size = (k: NodeKind) => (k === "decision" ? { w: 220, h: 130 } : { w: 200, h: 110 });

/** The step's flipped-card details, as draw.io shape data. */
function details(n: BNode, bp: Blueprint) {
  const e = n.engine;
  const model =
    e?.kind === "model"
      ? {
          "model-or-method": e.name,
          "why-this-model": e.why,
          "how-to-start": e.prototype,
          alternative: e.alternative,
          ...(e.model.startsWith("open") ? { "leading-open-weight-models": `${OPEN_LARGE_PICKS.join(", ")} (as of ${LAST_REVIEWED})` } : {}),
        }
      : e
        ? { "model-or-method": e.name, "how-it-works": e.how }
        : {};
  const next = outgoing(bp, n.id)
    .map(({ edge, node }) => `${edge.label ? `${edge.label}: ` : ""}step ${node.step}, ${node.name}`)
    .join("\n");
  const rules = [...new Set(n.rules)]
    .map((id) => {
      const r = RULES.find((x) => x.id === id);
      return r ? `${id}: if ${r.if}, then ${r.then}` : id;
    })
    .join("\n");
  return {
    step: n.step,
    kind: KIND_LABEL[n.kind],
    name: n.name,
    "runs-in": n.label,
    ...model,
    "what-happens": n.what,
    "why-its-here": n.why,
    "what-it-passes-on": n.passes,
    safeguards: n.gates.map((g) => `${g.kind === "human" ? "A person steps in" : "Stop rule"}: ${g.text}`).join("\n"),
    next,
    rules,
    knowledge: (n.kb ?? []).map((c) => `${c.id} ${c.title}`).join("\n"),
  };
}

/** The visible label: the step's number and name, who or what does it, and its safeguards. */
function label(n: BNode) {
  const e = n.engine;
  const by = [WHO[n.kind], n.label, e && n.kind !== "start" ? e.short : ""].filter(Boolean).join(" · ");
  const gates = n.gates.map((g) => `<br><font style="font-size:10px">⛔ ${h(g.text)}</font>`).join("");
  return `<b>${n.step}. ${h(n.name)}</b><br><font style="font-size:10px">${h(by)}</font>${gates}`;
}

function page(bp: Blueprint, name: string, title: string, subtitle: string, id: string): string {
  const cells: string[] = [];
  const at = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const n of bp.nodes) {
    const s = size(n.kind);
    const span = n.tracks[1] - n.tracks[0] + 1;
    const x = LEFT + n.stage * (COL_W + GAP_X) + (COL_W - s.w) / 2;
    const laneTop = TOP + n.tracks[0] * (ROW_H + GAP_Y);
    const laneH = span * ROW_H + (span - 1) * GAP_Y;
    const y = laneTop + (laneH - s.h) / 2;
    at.set(n.id, { x, y, ...s });
    const d = details(n, bp);
    const tooltip = [`What happens: ${n.what}`, `Why it's here: ${n.why}`, `Passes on: ${n.passes}`].join("\n\n");
    cells.push(
      `<UserObject${attrs({ id: `${id}-${n.id}`, label: label(n), tooltip, ...d })}>` +
        `<mxCell${attrs({ style: STYLE[n.kind], vertex: 1, parent: `${id}-layer` })}><mxGeometry${attrs({ x, y, width: s.w, height: s.h, as: "geometry" })}/></mxCell>` +
        `</UserObject>`,
    );
  }
  const byId = new Map(bp.nodes.map((n) => [n.id, n]));
  bp.edges.forEach((e, i) => {
    const loop = e.style !== "flow";
    const from = byId.get(e.from)!;
    const to = byId.get(e.to)!;
    const a = at.get(e.from)!;
    const b = at.get(e.to)!;
    // draw.io doesn't route around shapes, so an arrow that skips over steps
    // takes a detour above (top lane) or below the steps in between.
    let points = "";
    let ends = "";
    if (!loop && to.stage - from.stage > 1) {
      const between = bp.nodes.filter((n) => n.stage > from.stage && n.stage < to.stage).map((n) => at.get(n.id)!);
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      const blocked = between.some((r) => r.y < Math.max(y1, y2) + 10 && r.y + r.h > Math.min(y1, y2) - 10);
      if (blocked) {
        const above = from.tracks[0] === 0 && to.tracks[0] === 0;
        const y = above ? Math.min(a.y, b.y, ...between.map((r) => r.y)) - 30 : Math.max(a.y + a.h, b.y + b.h, ...between.map((r) => r.y + r.h)) + 30;
        points = `<Array as="points"><mxPoint x="${a.x + a.w + 20}" y="${y}"/><mxPoint x="${b.x - 20}" y="${y}"/></Array>`;
        ends = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";
      }
    }
    const style =
      "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;fontFamily=Helvetica;fontSize=10;fontColor=#4d5b55;strokeColor=#7f8d87;endArrow=block;endFill=1;labelBackgroundColor=#ffffff;" +
      ends +
      (loop ? "dashed=1;curved=1;" : "");
    cells.push(
      `<mxCell${attrs({ id: `${id}-e${i}`, value: e.label, style, edge: 1, parent: `${id}-layer`, source: `${id}-${e.from}`, target: `${id}-${e.to}` })}><mxGeometry relative="1" as="geometry">${points}</mxGeometry></mxCell>`,
    );
  });
  // Stage captions ("At the same time") above their column.
  for (const [stage, text] of Object.entries(bp.captions)) {
    const inStage = bp.nodes.filter((n) => n.stage === Number(stage));
    if (!inStage.length) continue;
    const x = LEFT + Number(stage) * (COL_W + GAP_X);
    const top = Math.min(...inStage.map((n) => at.get(n.id)!.y));
    cells.push(
      `<mxCell${attrs({ id: `${id}-c${stage}`, value: text.toUpperCase(), style: "text;html=1;align=center;fontSize=10;fontColor=#7f8d87;fontFamily=Helvetica;", vertex: 1, parent: `${id}-layer` })}><mxGeometry${attrs({ x, y: top - 28, width: COL_W, height: 20, as: "geometry" })}/></mxCell>`,
    );
  }
  // Title and key.
  cells.push(
    `<mxCell${attrs({ id: `${id}-title`, value: `<b style="font-size:20px">${h(title)}</b><br><font color="#4d5b55">${h(subtitle)}</font>`, style: "text;html=1;align=left;verticalAlign=top;fontFamily=Helvetica;fontSize=13;fontColor=#13201b;", vertex: 1, parent: `${id}-layer` })}><mxGeometry${attrs({ x: LEFT, y: 20, width: 900, height: 50, as: "geometry" })}/></mxCell>`,
  );
  const kinds = [...new Set(bp.nodes.map((n) => n.kind))].filter((k) => k !== "end");
  kinds.forEach((k, i) => {
    cells.push(
      `<mxCell${attrs({ id: `${id}-key-${k}`, value: k === "start" ? "Start / finish" : KIND_LABEL[k], style: STYLE[k].replace(/strokeWidth=2;/, ""), vertex: 1, parent: `${id}-layer` })}><mxGeometry${attrs({ x: LEFT + i * 150, y: 82, width: 135, height: 34, as: "geometry" })}/></mxCell>`,
    );
  });
  return (
    `<diagram${attrs({ id, name })}><mxGraphModel${attrs({ grid: 1, gridSize: 10, guides: 1, tooltips: 1, connect: 1, arrows: 1, fold: 1, page: 0, pageScale: 1, math: 0, shadow: 0 })}><root>` +
    `<mxCell id="${id}-root"/><mxCell id="${id}-layer" parent="${id}-root"/>` +
    cells.join("") +
    `</root></mxGraphModel></diagram>`
  );
}

/** The recommended design and the simpler start, as a two-page draw.io file. */
export function drawioXml(x: { task: string; design: Blueprint; source: "ai" | "rules"; simpler: Blueprint }): string {
  const by = x.source === "ai" ? "Designed by AI, checked against the guide's rules" : "From the guide's rules";
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<mxfile${attrs({ host: "blueprint studio", modified: new Date().toISOString(), type: "device" })}>` +
      page(x.design, "Recommended design", x.task, `${x.design.title} · ${by}`, "recommended") +
      page(x.simpler, "Simpler start", x.task, `${x.simpler.title} · Simpler start`, "simpler") +
      `</mxfile>`,
  ].join("\n");
}
