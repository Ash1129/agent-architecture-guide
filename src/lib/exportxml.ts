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

type Box = { x: number; y: number; w: number; h: number };

/**
 * One design's steps and connections, placed with its top-left at (ox, oy).
 * Cell ids start with `id`, so several designs can share a page.
 */
function drawSteps(bp: Blueprint, id: string, parent: string, ox: number, oy: number): { cells: string[]; at: Map<string, Box>; box: Box } {
  const cells: string[] = [];
  const at = new Map<string, Box>();
  for (const n of bp.nodes) {
    const s = size(n.kind);
    const span = n.tracks[1] - n.tracks[0] + 1;
    const x = ox + n.stage * (COL_W + GAP_X) + (COL_W - s.w) / 2;
    const laneTop = oy + n.tracks[0] * (ROW_H + GAP_Y);
    const laneH = span * ROW_H + (span - 1) * GAP_Y;
    const y = laneTop + (laneH - s.h) / 2;
    at.set(n.id, { x, y, ...s });
    const d = details(n, bp);
    const tooltip = [`What happens: ${n.what}`, `Why it's here: ${n.why}`, `Passes on: ${n.passes}`].join("\n\n");
    cells.push(
      `<UserObject${attrs({ id: `${id}-${n.id}`, label: label(n), tooltip, ...d })}>` +
        `<mxCell${attrs({ style: STYLE[n.kind], vertex: 1, parent })}><mxGeometry${attrs({ x, y, width: s.w, height: s.h, as: "geometry" })}/></mxCell>` +
        `</UserObject>`,
    );
  }
  const byId = new Map(bp.nodes.map((n) => [n.id, n]));
  let low = Math.max(...[...at.values()].map((r) => r.y + r.h));
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
    // An arrow to the next column but another lane leaves to the right and
    // enters from the left, so it turns in the gap, not through a step.
    if (!loop && to.stage - from.stage === 1 && Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)) > 1) {
      const mid = (a.x + a.w + b.x) / 2;
      points = `<Array as="points"><mxPoint x="${mid}" y="${a.y + a.h / 2}"/><mxPoint x="${mid}" y="${b.y + b.h / 2}"/></Array>`;
      ends = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";
    }
    if (!loop && to.stage - from.stage > 1) {
      const between = bp.nodes.filter((n) => n.stage > from.stage && n.stage < to.stage).map((n) => at.get(n.id)!);
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      const blocked = between.some((r) => r.y < Math.max(y1, y2) + 10 && r.y + r.h > Math.min(y1, y2) - 10);
      if (blocked) {
        const above = from.tracks[0] === 0 && to.tracks[0] === 0;
        const y = above ? Math.min(a.y, b.y, ...between.map((r) => r.y)) - 30 : Math.max(a.y + a.h, b.y + b.h, ...between.map((r) => r.y + r.h)) + 30;
        if (!above) low = Math.max(low, y);
        points = `<Array as="points"><mxPoint x="${a.x + a.w + 20}" y="${y}"/><mxPoint x="${b.x - 20}" y="${y}"/></Array>`;
        ends = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";
      }
    }
    const style =
      "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;fontFamily=Helvetica;fontSize=10;fontColor=#4d5b55;strokeColor=#7f8d87;endArrow=block;endFill=1;labelBackgroundColor=#ffffff;" +
      ends +
      (loop ? "dashed=1;curved=1;" : "");
    cells.push(
      `<mxCell${attrs({ id: `${id}-e${i}`, value: e.label, style, edge: 1, parent, source: `${id}-${e.from}`, target: `${id}-${e.to}` })}><mxGeometry relative="1" as="geometry">${points}</mxGeometry></mxCell>`,
    );
  });
  // Stage captions ("At the same time") above their column.
  for (const [stage, text] of Object.entries(bp.captions)) {
    const inStage = bp.nodes.filter((n) => n.stage === Number(stage));
    if (!inStage.length) continue;
    const x = ox + Number(stage) * (COL_W + GAP_X);
    const top = Math.min(...inStage.map((n) => at.get(n.id)!.y));
    cells.push(
      `<mxCell${attrs({ id: `${id}-c${stage}`, value: text.toUpperCase(), style: "text;html=1;align=center;fontSize=10;fontColor=#7f8d87;fontFamily=Helvetica;", vertex: 1, parent })}><mxGeometry${attrs({ x, y: top - 28, width: COL_W, height: 20, as: "geometry" })}/></mxCell>`,
    );
  }
  const right = Math.max(...[...at.values()].map((r) => r.x + r.w));
  return { cells, at, box: { x: ox, y: oy, w: right - ox, h: low - oy } };
}

const titleCell = (id: string, parent: string, title: string, subtitle: string, y = 20) =>
  `<mxCell${attrs({ id: `${id}-title`, value: `<b style="font-size:20px">${h(title)}</b><br><font color="#4d5b55">${h(subtitle)}</font>`, style: "text;html=1;align=left;verticalAlign=top;fontFamily=Helvetica;fontSize=13;fontColor=#13201b;", vertex: 1, parent })}><mxGeometry${attrs({ x: LEFT, y, width: 900, height: 50, as: "geometry" })}/></mxCell>`;

/** The key: one sample shape for each kind of step on the page. */
function keyCells(id: string, parent: string, kinds: NodeKind[]): string[] {
  return [...new Set(kinds)]
    .filter((k) => k !== "end")
    .map(
      (k, i) =>
        `<mxCell${attrs({ id: `${id}-key-${k}`, value: k === "start" ? "Start / finish" : KIND_LABEL[k], style: STYLE[k].replace(/strokeWidth=2;/, ""), vertex: 1, parent })}><mxGeometry${attrs({ x: LEFT + i * 150, y: 82, width: 135, height: 34, as: "geometry" })}/></mxCell>`,
    );
}

const diagram = (id: string, name: string, cells: string[]) =>
  `<diagram${attrs({ id, name })}><mxGraphModel${attrs({ grid: 1, gridSize: 10, guides: 1, tooltips: 1, connect: 1, arrows: 1, fold: 1, page: 0, pageScale: 1, math: 0, shadow: 0 })}><root>` +
  `<mxCell id="${id}-root"/><mxCell id="${id}-layer" parent="${id}-root"/>` +
  cells.join("") +
  `</root></mxGraphModel></diagram>`;

function page(bp: Blueprint, name: string, title: string, subtitle: string, id: string): string {
  const layer = `${id}-layer`;
  return diagram(id, name, [...drawSteps(bp, id, layer, LEFT, TOP).cells, titleCell(id, layer, title, subtitle), ...keyCells(id, layer, bp.nodes.map((n) => n.kind))]);
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

// ------------------------------------------------------------------ a whole process

/** One job of a process, with the design its own result shows. */
export type SystemJob = { task: string; design: Blueprint; source: "ai" | "rules" };

const BAND_PAD = 24;
const BAND_HEAD = 64;
const BAND_GAP = 150;
const HANDOFF_STYLE =
  "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;fontFamily=Helvetica;fontSize=11;fontStyle=1;fontColor=#9a3412;strokeColor=#ea580c;strokeWidth=2;dashed=1;endArrow=block;endFill=1;labelBackgroundColor=#ffffff;";

/** Where a job's work ends: its last finish step (the usual outcome, after any early exits). */
const lastFinish = (bp: Blueprint) => [...bp.nodes].reverse().find((n) => n.kind === "end") ?? bp.nodes[bp.nodes.length - 1];

/**
 * A process as one draw.io file. The first page is the whole system: every
 * job's design in its own band, top to bottom in the order work flows, joined
 * by the handoffs (through the system that carries each one). Then each job's
 * design has a page of its own.
 */
export function drawioSystemXml(x: { title: string; jobs: SystemJob[]; handoffs: { from: number; to: number; via: string; when: string }[] }): string {
  const id = "system";
  const layer = `${id}-layer`;
  const cells: string[] = [];
  const bands: { box: Box; start: string; end: string; endBox: Box; startBox: Box }[] = [];
  let top = TOP + 10;
  x.jobs.forEach((job, j) => {
    const jid = `${id}-j${j + 1}`;
    const drawn = drawSteps(job.design, jid, layer, LEFT + BAND_PAD, top + BAND_HEAD);
    const band: Box = { x: LEFT, y: top, w: drawn.box.w + BAND_PAD * 2, h: BAND_HEAD + drawn.box.h + BAND_PAD + 10 };
    const by = job.source === "ai" ? "designed by AI, checked against the rules" : "from the guide's rules";
    // The band goes first so the steps sit on top of it.
    cells.push(
      `<mxCell${attrs({
        id: `${jid}-band`,
        value: `<b style="font-size:15px">Job ${j + 1} · ${h(job.task)}</b><br><font style="font-size:11px" color="#4d5b55">${h(job.design.title)} · ${h(by)}</font>`,
        style: "rounded=1;arcSize=2;html=1;whiteSpace=wrap;fillColor=#f7f9f8;strokeColor=#c9d4cf;verticalAlign=top;align=left;spacingLeft=16;spacingTop=8;fontFamily=Helvetica;fontColor=#13201b;container=0;",
        vertex: 1,
        parent: layer,
      })}><mxGeometry${attrs({ x: band.x, y: band.y, width: band.w, height: band.h, as: "geometry" })}/></mxCell>`,
      ...drawn.cells,
    );
    const end = lastFinish(job.design);
    const start = job.design.nodes[0];
    bands.push({ box: band, start: `${jid}-${start.id}`, end: `${jid}-${end.id}`, startBox: drawn.at.get(start.id)!, endBox: drawn.at.get(end.id)! });
    top += band.h + BAND_GAP;
  });

  // Each handoff passes through the system that carries it, drawn in the gap
  // after the job it leaves. The arrow leaves the job's last finish to the
  // right, outside its band, so it never crosses the job's own connections.
  const right = Math.max(...bands.map((b) => b.box.x + b.box.w));
  x.handoffs.forEach((hf, i) => {
    const a = bands[hf.from];
    const b = bands[hf.to];
    if (!a || !b) return;
    const sid = `${id}-h${i + 1}`;
    const w = 170;
    const hgt = 64;
    const sx = a.box.x + a.box.w - w;
    const sy = a.box.y + a.box.h + (BAND_GAP - hgt) / 2 + i * 6;
    const lane = right + 40 + i * 20;
    const when = `${hf.when.charAt(0).toUpperCase()}${hf.when.slice(1).replace(/\.$/, "")}`;
    cells.push(
      `<UserObject${attrs({ id: sid, label: `<b>${h(hf.via)}</b>`, tooltip: `Hands over when ${hf.when}`, "hands-over-when": hf.when, from: `Job ${hf.from + 1}`, to: `Job ${hf.to + 1}` })}>` +
        `<mxCell${attrs({ style: STYLE.tool, vertex: 1, parent: layer })}><mxGeometry${attrs({ x: sx, y: sy, width: w, height: hgt, as: "geometry" })}/></mxCell></UserObject>`,
      `<mxCell${attrs({ id: `${sid}-when`, value: `<b>Hands over</b> when ${h(when.charAt(0).toLowerCase() + when.slice(1))}`, style: "text;html=1;whiteSpace=wrap;align=right;verticalAlign=middle;fontFamily=Helvetica;fontSize=11;fontColor=#9a3412;", vertex: 1, parent: layer })}><mxGeometry${attrs({ x: sx - 440, y: sy, width: 420, height: hgt, as: "geometry" })}/></mxCell>`,
      `<mxCell${attrs({ id: `${sid}-in`, style: `${HANDOFF_STYLE}exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;`, edge: 1, parent: layer, source: a.end, target: sid })}><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="${lane}" y="${a.endBox.y + a.endBox.h / 2}"/><mxPoint x="${lane}" y="${sy + hgt / 2}"/></Array></mxGeometry></mxCell>`,
      `<mxCell${attrs({ id: `${sid}-out`, value: `starts job ${hf.to + 1}`, style: `${HANDOFF_STYLE}exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;`, edge: 1, parent: layer, source: sid, target: b.start })}><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="${sx + w / 2}" y="${b.box.y - 24}"/><mxPoint x="${b.box.x - 20}" y="${b.box.y - 24}"/><mxPoint x="${b.box.x - 20}" y="${b.startBox.y + b.startBox.h / 2}"/></Array></mxGeometry></mxCell>`,
    );
  });

  const kinds = x.jobs.flatMap((j) => j.design.nodes.map((n) => n.kind));
  const subtitle = `${x.jobs.length} jobs, each designed for how it works, joined where one hands work to the next`;
  const pages = [
    diagram(id, "Whole system", [titleCell(id, layer, x.title, subtitle), ...keyCells(id, layer, [...kinds, "tool"]), ...cells]),
    ...x.jobs.map((job, j) => page(job.design, `Job ${j + 1}`, job.task, `${job.design.title} · ${job.source === "ai" ? "Designed by AI, checked against the guide's rules" : "From the guide's rules"}`, `job${j + 1}`)),
  ];
  return ['<?xml version="1.0" encoding="UTF-8"?>', `<mxfile${attrs({ host: "blueprint studio", modified: new Date().toISOString(), type: "device" })}>` + pages.join("") + `</mxfile>`].join("\n");
}
