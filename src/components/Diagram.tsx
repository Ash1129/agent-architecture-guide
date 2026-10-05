import type { TopologyId } from "../lib/catalog";

// Flow diagrams for each topology, drawn from simple node/edge data so they
// stay legible in both themes and print cleanly.

type Kind = "io" | "ai" | "rule" | "human" | "tool";
type Node = { id: string; x: number; y: number; label: string; kind: Kind; w?: number };
type Edge = { from: string; to: string; label?: string; back?: boolean; dashed?: boolean };
type Layout = { nodes: Node[]; edges: Edge[] };

const H = 44;
const W = 112;

const fan = (prefix: string, x: number, labels: string[], kind: Kind): Node[] =>
  labels.map((label, i) => ({ id: `${prefix}${i}`, x, y: 20 + i * 70, label, kind }));

const LAYOUTS: Record<TopologyId, Layout> = {
  pipeline: {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Trigger", kind: "io", w: 92 },
      { id: "r", x: 140, y: 90, label: "Check the rules", kind: "rule", w: 132 },
      { id: "a", x: 320, y: 40, label: "Action A", kind: "rule" },
      { id: "b", x: 320, y: 140, label: "Action B", kind: "rule" },
    ],
    edges: [
      { from: "in", to: "r" },
      { from: "r", to: "a", label: "if" },
      { from: "r", to: "b", label: "else" },
    ],
  },
  dag: {
    nodes: [
      { id: "a", x: 0, y: 40, label: "Import sales", kind: "rule" },
      { id: "b", x: 0, y: 140, label: "Import stock", kind: "rule" },
      { id: "c", x: 170, y: 90, label: "Build report", kind: "rule" },
      { id: "d", x: 340, y: 90, label: "Publish", kind: "io", w: 92 },
    ],
    edges: [
      { from: "a", to: "c" },
      { from: "b", to: "c" },
      { from: "c", to: "d" },
    ],
  },
  chain: {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Input", kind: "io", w: 80 },
      { id: "s1", x: 120, y: 90, label: "AI step 1", kind: "ai" },
      { id: "g", x: 272, y: 90, label: "Check", kind: "rule", w: 80 },
      { id: "s2", x: 392, y: 90, label: "AI step 2", kind: "ai" },
      { id: "out", x: 544, y: 90, label: "Output", kind: "io", w: 84 },
    ],
    edges: [
      { from: "in", to: "s1" },
      { from: "s1", to: "g" },
      { from: "g", to: "s2", label: "pass" },
      { from: "s2", to: "out" },
    ],
  },
  routing: {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Input", kind: "io", w: 80 },
      { id: "r", x: 120, y: 90, label: "Sort by type", kind: "ai", w: 124 },
      ...fan("h", 300, ["Type A path", "Type B path", "Type C path"], "ai"),
      { id: "out", x: 470, y: 90, label: "Output", kind: "io", w: 84 },
    ],
    edges: [
      { from: "in", to: "r" },
      { from: "r", to: "h0" },
      { from: "r", to: "h1" },
      { from: "r", to: "h2" },
      { from: "h0", to: "out" },
      { from: "h1", to: "out" },
      { from: "h2", to: "out" },
    ],
  },
  "parallel-sections": {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Input", kind: "io", w: 80 },
      ...fan("p", 130, ["Part 1", "Part 2", "Part 3"], "ai"),
      { id: "c", x: 300, y: 90, label: "Combine", kind: "rule", w: 100 },
      { id: "out", x: 450, y: 90, label: "Output", kind: "io", w: 84 },
    ],
    edges: [
      { from: "in", to: "p0" },
      { from: "in", to: "p1" },
      { from: "in", to: "p2" },
      { from: "p0", to: "c" },
      { from: "p1", to: "c" },
      { from: "p2", to: "c" },
      { from: "c", to: "out" },
    ],
  },
  "parallel-voting": {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Input", kind: "io", w: 80 },
      ...fan("p", 130, ["Attempt 1", "Attempt 2", "Attempt 3"], "ai"),
      { id: "c", x: 300, y: 90, label: "Compare", kind: "rule", w: 100 },
      { id: "out", x: 450, y: 90, label: "Output", kind: "io", w: 84 },
    ],
    edges: [
      { from: "in", to: "p0" },
      { from: "in", to: "p1" },
      { from: "in", to: "p2" },
      { from: "p0", to: "c" },
      { from: "p1", to: "c" },
      { from: "p2", to: "c" },
      { from: "c", to: "out" },
    ],
  },
  evaluator: {
    nodes: [
      { id: "in", x: 0, y: 110, label: "Input", kind: "io", w: 80 },
      { id: "g", x: 130, y: 110, label: "Produce", kind: "ai" },
      { id: "c", x: 300, y: 110, label: "Check", kind: "ai" },
      { id: "out", x: 470, y: 110, label: "Accepted", kind: "io", w: 96 },
    ],
    edges: [
      { from: "in", to: "g" },
      { from: "g", to: "c" },
      { from: "c", to: "g", label: "feedback", back: true },
      { from: "c", to: "out", label: "passes" },
    ],
  },
  orchestrator: {
    nodes: [
      { id: "in", x: 0, y: 90, label: "Input", kind: "io", w: 80 },
      { id: "o", x: 120, y: 90, label: "Coordinator", kind: "ai", w: 120 },
      ...fan("w", 290, ["Specialist 1", "Specialist 2", "Specialist 3"], "ai"),
      { id: "c", x: 460, y: 90, label: "Combine", kind: "ai", w: 100 },
      { id: "out", x: 600, y: 90, label: "Output", kind: "io", w: 84 },
    ],
    edges: [
      { from: "in", to: "o" },
      { from: "o", to: "w0", dashed: true },
      { from: "o", to: "w1", dashed: true },
      { from: "o", to: "w2", dashed: true },
      { from: "w0", to: "c" },
      { from: "w1", to: "c" },
      { from: "w2", to: "c" },
      { from: "c", to: "out" },
    ],
  },
  "agent-loop": {
    nodes: [
      { id: "in", x: 0, y: 110, label: "Goal", kind: "io", w: 80 },
      { id: "a", x: 130, y: 110, label: "Agent", kind: "ai", w: 100 },
      { id: "t", x: 290, y: 50, label: "Your tools", kind: "tool" },
      { id: "h", x: 290, y: 170, label: "Ask a person", kind: "human", w: 124 },
      { id: "out", x: 470, y: 110, label: "Done or stopped", kind: "io", w: 140 },
    ],
    edges: [
      { from: "in", to: "a" },
      { from: "a", to: "t", label: "act" },
      { from: "t", to: "a", label: "result", back: true },
      { from: "a", to: "h", dashed: true },
      { from: "a", to: "out" },
    ],
  },
};

const NODE_CLASS: Record<Kind, { rect: string; text: string; dash?: string }> = {
  io: { rect: "fill-surface stroke-line-strong", text: "fill-muted" },
  ai: { rect: "fill-accent-soft stroke-accent", text: "fill-ink" },
  rule: { rect: "fill-surface stroke-line-strong", text: "fill-ink" },
  tool: { rect: "fill-surface-2 stroke-line-strong", text: "fill-ink" },
  human: { rect: "fill-surface stroke-line-strong", text: "fill-ink", dash: "5 4" },
};

export function Diagram({ id, title, compact = false }: { id: TopologyId; title: string; compact?: boolean }) {
  const { nodes, edges } = LAYOUTS[id];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const width = (n: Node) => n.w ?? W;
  const pad = 12;
  const maxX = Math.max(...nodes.map((n) => n.x + width(n))) + pad;
  const minY = Math.min(...nodes.map((n) => n.y)) - (edges.some((e) => e.back) ? 46 : pad);
  const maxY = Math.max(...nodes.map((n) => n.y + H)) + pad;
  const markerId = `arrow-${id}`;

  const paths = edges.map((e, i) => {
    const s = byId[e.from];
    const t = byId[e.to];
    if (e.back) {
      const sx = s.x + width(s) / 2;
      const tx = t.x + width(t) / 2;
      const top = Math.min(s.y, t.y) - 34;
      return {
        key: i,
        d: `M ${sx} ${s.y} C ${sx} ${top}, ${tx} ${top}, ${tx} ${t.y - 2}`,
        label: e.label,
        lx: (sx + tx) / 2,
        ly: top + 4,
        dashed: e.dashed,
      };
    }
    const x1 = s.x + width(s);
    const y1 = s.y + H / 2;
    const x2 = t.x - 2;
    const y2 = t.y + H / 2;
    const dx = Math.max(24, (x2 - x1) / 2);
    return {
      key: i,
      d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      label: e.label,
      lx: (x1 + x2) / 2,
      ly: (y1 + y2) / 2 - 7,
      dashed: e.dashed,
    };
  });

  return (
    <figure className="m-0 min-w-0">
      <div className={`diagram-surface overflow-x-auto rounded-2xl border border-line bg-surface ${compact ? "p-3" : "p-4 sm:p-6"}`}>
        <svg
          role="img"
          aria-label={`Diagram: ${title}`}
          viewBox={`${-pad} ${minY} ${maxX + pad} ${maxY - minY}`}
          className={`mx-auto block h-auto w-full ${compact ? "min-w-[420px] max-w-[560px]" : "min-w-[520px] max-w-[720px]"}`}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-line-strong" />
            </marker>
          </defs>
          {paths.map((p) => (
            <g key={p.key}>
              <path
                d={p.d}
                fill="none"
                className="stroke-line-strong"
                strokeWidth={1.5}
                strokeDasharray={p.dashed ? "4 4" : undefined}
                markerEnd={`url(#${markerId})`}
              />
              {p.label && (
                <text
                  x={p.lx}
                  y={p.ly}
                  textAnchor="middle"
                  className="fill-muted stroke-surface"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  style={{ fontSize: 12, paintOrder: "stroke" }}
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
          {nodes.map((n) => {
            const c = NODE_CLASS[n.kind];
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={width(n)}
                  height={H}
                  rx={n.kind === "io" ? H / 2 : 10}
                  className={c.rect}
                  strokeWidth={1.25}
                  strokeDasharray={c.dash}
                />
                <text
                  x={n.x + width(n) / 2}
                  y={n.y + H / 2 + 4.5}
                  textAnchor="middle"
                  className={c.text}
                  style={{ fontSize: 13.5, fontWeight: n.kind === "ai" ? 550 : 450 }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-[12.5px] text-muted sm:hidden">Swipe sideways to see the whole diagram.</p>
      {!compact && (
        <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-3 w-5 rounded-[4px] border border-accent bg-accent-soft" /> AI step
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-3 w-5 rounded-[4px] border border-line-strong bg-surface" /> Fixed step
          </span>
          {LAYOUTS[id].nodes.some((n) => n.kind === "human") && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-3 w-5 rounded-[4px] border border-dashed border-line-strong bg-surface" /> Person
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
