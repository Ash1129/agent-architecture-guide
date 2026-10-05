import {
  Cpu,
  FlagCheckered,
  Function as FunctionIcon,
  GearSix,
  GitFork,
  HandPalm,
  Play,
  Plug,
  Sparkle,
  UserCheck,
  type Icon,
} from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { type BEdge, type BNode, type Blueprint, KIND_LABEL, type NodeKind } from "../lib/blueprint";
import type { Engine } from "../lib/models";

// Draws a blueprint as real, focusable step buttons laid out on a CSS grid
// (stages by tracks), with connections measured from the rendered layout.
// It runs left to right when there's room, and top to bottom when there isn't.

export const KIND_ICON: Record<NodeKind, Icon> = {
  start: Play,
  ai: Sparkle,
  fixed: GearSix,
  decision: GitFork,
  human: UserCheck,
  tool: Plug,
  end: FlagCheckered,
};

export const NODE_STYLE: Record<NodeKind, string> = {
  start: "bg-surface-2 border border-line-strong/50",
  end: "bg-surface-2 border border-line-strong/50",
  ai: "bg-accent-soft border border-accent/55",
  fixed: "bg-surface border border-line-strong/70",
  decision: "bg-surface border border-line-strong",
  human: "bg-surface border-[1.5px] border-dashed border-ink/60",
  tool: "bg-surface-2 border border-line-strong/70",
};

export const COL_MIN = 116;
export const COL_GAP = 62;
export const PAD_X = 6;
const PAD_Y = 54;
const V_ROW_GAP = 46;
const V_COL_GAP = 10;
const V_PAD_RIGHT = 30;

type Rect = { x: number; y: number; w: number; h: number };

export function GateBadge({ kind, text, compact = false }: { kind: "human" | "stop"; text: string; compact?: boolean }) {
  const Icon = kind === "human" ? UserCheck : HandPalm;
  return (
    <span
      title={text}
      className={`inline-flex max-w-full items-center gap-1 rounded-full text-left leading-tight ${
        kind === "human" ? "bg-ink text-bg" : "bg-surface-2 text-ink ring-1 ring-line-strong/60"
      } ${compact ? "h-5 w-5 justify-center" : "px-2 py-[3px] text-[11.5px] font-medium"}`}
    >
      <Icon size={compact ? 11 : 12} weight="bold" aria-hidden className="shrink-0" />
      {compact ? <span className="sr-only">{text}</span> : <span className="min-w-0">{text}</span>}
    </span>
  );
}

export function EngineChip({ engine, compact = false }: { engine: Engine; compact?: boolean }) {
  const model = engine.kind === "model";
  const Icon = model ? Cpu : FunctionIcon;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md font-medium leading-tight ${
        model ? "bg-surface text-ink ring-1 ring-accent/50" : "bg-surface-2 text-ink ring-1 ring-line-strong/50"
      } ${compact ? "px-1.5 py-[2px] text-[11px]" : "px-2 py-[3px] text-[12px]"}`}
    >
      <Icon size={compact ? 11 : 12} weight="bold" aria-hidden className={`shrink-0 ${model ? "text-accent" : "text-muted"}`} />
      <span className="min-w-0">{engine.short}</span>
    </span>
  );
}

export function ArchitectureMap({
  bp,
  selected,
  onSelect,
  panelId,
  ghost = null,
  spotlight = false,
  expand = null,
  onLayout,
}: {
  bp: Blueprint;
  selected: string | null;
  onSelect: (id: string | null) => void;
  panelId: string;
  /** A step hidden in place because it is being shown elsewhere (the walkthrough card). */
  ghost?: string | null;
  /** Soften every step except the selected one (used by the walkthrough). */
  spotlight?: boolean;
  /**
   * Open one step in place to the given size (diagram units). Neighbouring
   * steps slide outward to make room and connections stretch to reach it.
   * `t` runs from 0 (closed) to 1 (fully open).
   */
  expand?: { id: string; w: number; h: number; t: number } | null;
  /** Called after each layout measurement. */
  onLayout?: () => void;
}) {
  const reduce = useReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [width, setWidth] = useState(0);
  const onLayoutRef = useRef(onLayout);
  onLayoutRef.current = onLayout;
  // Measurements are tagged with the layout they belong to, so a new design is
  // never drawn with the previous design's positions.
  const [measured, setMeasured] = useState<{ key: string; rects: Record<string, Rect>; w: number; h: number }>({
    key: "",
    rects: {},
    w: 0,
    h: 0,
  });

  const byId = useMemo(() => new Map(bp.nodes.map((n) => [n.id, n])), [bp]);
  const needed = bp.stages * COL_MIN + (bp.stages - 1) * COL_GAP + PAD_X * 2;
  const vertical = width > 0 && width < needed;
  const compact = vertical && bp.tracks >= 3 && width < 520;
  const layoutKey = `${bp.variant}|${bp.nodes.map((n) => n.id).join(",")}|${bp.edges.length}|${vertical}|${compact}`;
  // Narrow columns show the step type as an icon only.
  const narrow = compact || (!vertical && (width - PAD_X * 2 - (bp.stages - 1) * COL_GAP) / bp.stages < 150);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Offsets ignore transforms, so entrance animations never skew the lines.
  const measure = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const next: Record<string, Rect> = {};
    nodeRefs.current.forEach((el, id) => {
      next[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    });
    setMeasured({ key: grid.dataset.layout ?? "", rects: next, w: grid.offsetWidth, h: grid.offsetHeight });
    onLayoutRef.current?.();
  }, []);

  useLayoutEffect(() => {
    measure();
    const grid = gridRef.current;
    if (!grid) return;
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    nodeRefs.current.forEach((el) => ro.observe(el));
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [layoutKey, measure]);

  const focusStep = (step: number) => {
    const node = bp.nodes.find((n) => n.step === step);
    if (!node) return;
    nodeRefs.current.get(node.id)?.focus();
    onSelect(node.id);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, n: BNode) => {
    const last = bp.nodes.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") focusStep(Math.min(last, n.step + 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") focusStep(Math.max(1, n.step - 1));
    else if (e.key === "Home") focusStep(1);
    else if (e.key === "End") focusStep(last);
    else if (e.key === "Escape") onSelect(null);
    else return;
    e.preventDefault();
  };

  // Reserve room above only for captions and loops that route over the top.
  const longLoops = bp.edges.some((e) => e.style === "loop" && Math.abs(byId.get(e.from)!.stage - byId.get(e.to)!.stage) > 1);
  const padTop = Object.keys(bp.captions).length || longLoops ? PAD_Y : 22;
  const padBottom = longLoops ? 40 : 22;

  const gridStyle = vertical
    ? {
        gridTemplateColumns: `repeat(${bp.tracks}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${bp.stages}, auto)`,
        rowGap: V_ROW_GAP,
        columnGap: V_COL_GAP,
        padding: `30px ${V_PAD_RIGHT}px 8px 0`,
      }
    : {
        gridTemplateColumns: `repeat(${bp.stages}, minmax(${COL_MIN}px, 1fr))`,
        gridTemplateRows: `repeat(${bp.tracks}, auto)`,
        columnGap: COL_GAP,
        rowGap: 18,
        padding: `${padTop}px ${PAD_X}px ${padBottom}px`,
      };

  const baseRects = measured.rects;
  const { rects, offsets } = useMemo(() => {
    const none = { rects: baseRects, offsets: {} as Record<string, { dx: number; dy: number }> };
    const a = expand && baseRects[expand.id];
    const an = expand && byId.get(expand.id);
    if (!expand || !a || !an || expand.t <= 0) return none;
    const t = expand.t;
    const room = 32;
    const ex = Math.max(0, (expand.w - a.w) / 2) + room; // horizontal room on each side
    const ey = Math.max(0, (expand.h - a.h) / 2) + room; // vertical room on each side
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    const out: Record<string, Rect> = {};
    const offs: Record<string, { dx: number; dy: number }> = {};
    for (const n of bp.nodes) {
      const r = baseRects[n.id];
      if (!r) continue;
      if (n.id === expand.id) {
        const w = a.w + (expand.w - a.w) * t;
        const h = a.h + (expand.h - a.h) * t;
        out[n.id] = { x: cx - w / 2, y: cy - h / 2, w, h };
        continue;
      }
      // Earlier stages move back, later ones forward; same-stage lanes move apart.
      const along = n.stage < an.stage ? -1 : n.stage > an.stage ? 1 : 0;
      const across = along !== 0 ? 0 : n.tracks[1] < an.tracks[0] ? -1 : n.tracks[0] > an.tracks[1] ? 1 : 0;
      const dx = (vertical ? across * ex : along * ex) * t;
      const dy = (vertical ? along * ey : across * ey) * t;
      offs[n.id] = { dx, dy };
      out[n.id] = { ...r, x: r.x + dx, y: r.y + dy };
    }
    return { rects: out, offsets: offs };
  }, [baseRects, expand, bp, byId, vertical]);
  const box = { w: measured.w, h: measured.h };
  const ready = measured.key === layoutKey && bp.nodes.every((n) => rects[n.id]);

  return (
    <div ref={outerRef} className="w-full overflow-x-auto">
      <div
        ref={gridRef}
        data-layout={layoutKey}
        role="group"
        aria-label={`${bp.title} Diagram with ${bp.nodes.length} steps. Use the arrow keys to move between steps, and Enter to see details.`}
        className="relative grid"
        style={gridStyle}
      >
        {ready && (
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={box.w}
            height={box.h}
          >
            <defs>
              {(["base", "on"] as const).map((v) => (
                <marker
                  key={v}
                  id={`arrow-${bp.variant}-${v}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6.5"
                  markerHeight="6.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className={v === "on" ? "fill-accent" : "fill-line-strong"} />
                </marker>
              ))}
            </defs>
            {Object.entries(bp.captions).map(([stage, text]) => {
              const inStage = bp.nodes.filter((n) => n.stage === Number(stage)).map((n) => rects[n.id]).filter(Boolean);
              if (!inStage.length) return null;
              const minY = Math.min(...inStage.map((r) => r.y));
              const minX = Math.min(...inStage.map((r) => r.x));
              const maxX = Math.max(...inStage.map((r) => r.x + r.w));
              return (
                <text
                  key={stage}
                  x={vertical ? minX : (minX + maxX) / 2}
                  y={minY - (vertical ? 9 : 12)}
                  textAnchor={vertical ? "start" : "middle"}
                  className="fill-muted stroke-surface"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  style={{ fontSize: 12, fontWeight: 500, paintOrder: "stroke" }}
                >
                  {text}
                </text>
              );
            })}
            {bp.edges.map((e, i) => {
              const g = geometry(e, bp, byId, rects, vertical);
              if (!g) return null;
              const on = selected !== null && (e.from === selected || e.to === selected);
              const dim = selected !== null && !on;
              return (
                <g key={`${e.from}-${e.to}-${i}`} style={{ opacity: dim ? 0.45 : 1, transition: "opacity 200ms" }}>
                  <m.path
                    d={g.d}
                    fill="none"
                    className={on ? "stroke-accent" : "stroke-line-strong"}
                    strokeWidth={on ? 2 : 1.5}
                    strokeDasharray={e.style === "assign" ? "5 4" : e.style === "loop" ? "2 4" : undefined}
                    strokeLinecap="round"
                    markerEnd={`url(#arrow-${bp.variant}-${on ? "on" : "base"})`}
                    initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {e.label && !(vertical && byId.get(e.from)!.stage === byId.get(e.to)!.stage) && (
                    <text
                      x={g.lx}
                      y={g.ly}
                      textAnchor={g.anchor}
                      transform={g.rotate ? `rotate(-90 ${g.lx} ${g.ly})` : undefined}
                      className={`${on ? "fill-accent" : "fill-muted"} stroke-surface`}
                      strokeWidth={5}
                      strokeLinejoin="round"
                      style={{ fontSize: 11, fontWeight: 500, paintOrder: "stroke" }}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {bp.nodes.map((n) => {
          const Icon = KIND_ICON[n.kind];
          const isOn = selected === n.id;
          const span = n.tracks[1] - n.tracks[0] + 1;
          const place = vertical
            ? { gridRow: n.stage + 1, gridColumn: `${n.tracks[0] + 1} / ${n.tracks[1] + 2}` }
            : { gridColumn: n.stage + 1, gridRow: `${n.tracks[0] + 1} / ${n.tracks[1] + 2}` };
          const gateText = n.gates.map((g) => g.text).join(". ");
          return (
            <m.button
              key={n.id}
              type="button"
              data-node={n.id}
              ref={(el: HTMLButtonElement | null) => {
                if (el) nodeRefs.current.set(n.id, el);
                else nodeRefs.current.delete(n.id);
              }}
              onClick={() => onSelect(isOn ? null : n.id)}
              onKeyDown={(e) => onKey(e, n)}
              aria-pressed={isOn}
              aria-controls={panelId}
              aria-label={`Step ${n.step} of ${bp.nodes.length}: ${n.name}. ${KIND_LABEL[n.kind]}, ${n.label}.${
                n.engine && n.kind !== "start" ? ` ${n.engine.kind === "model" ? "Model" : "Method"}: ${n.engine.short}.` : ""
              }${gateText ? ` ${gateText}.` : ""}`}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: ghost === n.id ? 0 : spotlight && selected && selected !== n.id ? 0.42 : 1, y: 0 }}
              transition={{
                duration: ghost === n.id || spotlight ? 0.3 : 0.45,
                delay: ghost || spotlight ? 0 : n.step * 0.045,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                ...place,
                translate: offsets[n.id] ? `${offsets[n.id].dx}px ${offsets[n.id].dy}px` : undefined,
                alignSelf: "center",
                justifySelf: vertical && span > 1 ? "center" : "stretch",
                width: vertical && span > 1 ? "min(100%, 250px)" : undefined,
              }}
              className={`group relative z-10 flex min-w-0 flex-col items-start rounded-2xl text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-soft ${
                compact ? "gap-1 p-2.5" : "gap-1.5 px-3.5 py-3"
              } ${NODE_STYLE[n.kind]} ${isOn ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
            >
              <span className="flex w-full items-center gap-1.5">
                <span
                  className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 font-mono text-[11.5px] font-semibold ${
                    isOn ? "bg-accent text-accent-ink" : "bg-ink/[0.07] text-ink"
                  }`}
                >
                  {n.step}
                </span>
                <Icon size={14} weight={n.kind === "ai" ? "fill" : "regular"} aria-hidden className={n.kind === "ai" ? "text-accent" : "text-muted"} />
                {!narrow && n.kind === "human" && (
                  <span className="rounded-full bg-ink px-1.5 py-px text-[10.5px] font-semibold text-bg">Person</span>
                )}
                {!narrow && n.kind === "decision" && <span className="truncate text-[11.5px] font-medium text-muted">Decision</span>}
              </span>
              <span className={`block font-semibold leading-snug tracking-[-0.01em] text-ink ${compact ? "text-[12.5px]" : "text-[14.5px]"}`}>
                {n.name}
              </span>
              {/* Working steps show what does the work: a named model or method. */}
              {n.engine && n.kind !== "start" ? (
                <EngineChip engine={n.engine} compact={compact} />
              ) : (
                <span className={`block leading-snug text-muted ${compact ? "text-[11px]" : "text-[12.5px]"}`}>{n.label}</span>
              )}
              {n.gates.length > 0 && (
                <span className={`mt-0.5 flex flex-wrap gap-1 ${compact ? "" : "w-full"}`}>
                  {n.gates.map((g) => (
                    <GateBadge key={g.text} kind={g.kind} text={g.text} compact={compact} />
                  ))}
                </span>
              )}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ connection geometry

type Geo = { d: string; lx: number; ly: number; anchor: "start" | "middle" | "end"; rotate?: boolean };

function geometry(
  e: BEdge,
  bp: Blueprint,
  byId: Map<string, BNode>,
  rects: Record<string, Rect>,
  vertical: boolean,
): Geo | null {
  const sn = byId.get(e.from)!;
  const tn = byId.get(e.to)!;
  const s = rects[e.from];
  const t = rects[e.to];
  if (!s || !t) return null;
  const reverse = bp.edges.some((x) => x.from === e.to && x.to === e.from);
  // Two-way connections are drawn as a pair of parallel lines.
  const o = reverse ? (sn.step < tn.step ? -7 : 7) : 0;
  const dStage = tn.stage - sn.stage;

  // Same stage: the agent and its tools, side by side or stacked.
  if (dStage === 0) {
    if (!vertical) {
      const x = (Math.max(s.x, t.x) + Math.min(s.x + s.w, t.x + t.w)) / 2 + o;
      const [y1, y2] = s.y < t.y ? [s.y + s.h, t.y] : [s.y, t.y + t.h];
      return { d: `M ${x} ${y1} L ${x} ${y2}`, lx: x + (o < 0 ? -6 : 6), ly: (y1 + y2) / 2 + 4, anchor: o < 0 ? "end" : "start" };
    }
    const y = (Math.max(s.y, t.y) + Math.min(s.y + s.h, t.y + t.h)) / 2 + o;
    const [x1, x2] = s.x < t.x ? [s.x + s.w, t.x] : [s.x, t.x + t.w];
    return { d: `M ${x1} ${y} L ${x2} ${y}`, lx: (x1 + x2) / 2, ly: y + (o < 0 ? -5 : 13), anchor: "middle" };
  }

  // Forward connections.
  if (dStage > 0) {
    if (!vertical) {
      const x1 = s.x + s.w;
      const y1 = s.y + s.h / 2 + o;
      const x2 = t.x;
      const y2 = t.y + t.h / 2 + o;
      if (dStage === 1) {
        const c = (x2 - x1) / 2;
        return { d: `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 - 6, anchor: "middle" };
      }
      const bend = x2 - COL_GAP;
      return {
        d: `M ${x1} ${y1} L ${bend} ${y1} C ${x2 - COL_GAP / 2} ${y1}, ${x2 - COL_GAP / 2} ${y2}, ${x2} ${y2}`,
        lx: x1 + COL_GAP / 2,
        ly: y1 - 6,
        anchor: "middle",
      };
    }
    const x1 = s.x + s.w / 2 + o;
    const y1 = s.y + s.h;
    const x2 = t.x + t.w / 2 + o;
    const y2 = t.y;
    if (dStage === 1) {
      const c = (y2 - y1) / 2;
      return { d: `M ${x1} ${y1} C ${x1} ${y1 + c}, ${x2} ${y2 - c}, ${x2} ${y2}`, lx: (x1 + x2) / 2 + 6, ly: (y1 + y2) / 2 + 4, anchor: "start" };
    }
    const bend = y2 - V_ROW_GAP;
    return {
      d: `M ${x1} ${y1} L ${x1} ${bend} C ${x1} ${y2 - V_ROW_GAP / 2}, ${x2} ${y2 - V_ROW_GAP / 2}, ${x2} ${y2}`,
      lx: x1 + 6,
      ly: y1 + V_ROW_GAP / 2 + 4,
      anchor: "start",
    };
  }

  // Loops back to an earlier stage.
  if (dStage === -1 && reverse) {
    if (!vertical) {
      const x1 = s.x;
      const y1 = s.y + s.h / 2 + o;
      const x2 = t.x + t.w;
      const y2 = t.y + t.h / 2 + o;
      const c = (x1 - x2) / 2;
      return { d: `M ${x1} ${y1} C ${x1 - c} ${y1}, ${x2 + c} ${y2}, ${x2} ${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 + 15, anchor: "middle" };
    }
    const x1 = s.x + s.w / 2 + o;
    const y1 = s.y;
    const x2 = t.x + t.w / 2 + o;
    const y2 = t.y + t.h;
    const c = (y1 - y2) / 2;
    return { d: `M ${x1} ${y1} C ${x1} ${y1 - c}, ${x2} ${y2 + c}, ${x2} ${y2}`, lx: (x1 + x2) / 2 + 6, ly: (y1 + y2) / 2 + 4, anchor: "start" };
  }

  // Longer loops route around everything in between.
  const span = bp.nodes.filter((n) => n.stage >= tn.stage && n.stage <= sn.stage).map((n) => rects[n.id]).filter(Boolean);
  const r = 10;
  if (!vertical) {
    const sx = s.x + s.w / 2;
    const tx = t.x + t.w / 2;
    // Go underneath if anything sits above either end in its own stage.
    const blockedAbove = [sn, tn].some((end) =>
      bp.nodes.some((n) => n !== end && n.stage === end.stage && n.tracks[1] < end.tracks[0]),
    );
    if (blockedAbove) {
      const bottom = Math.max(...span.map((x) => x.y + x.h)) + 24;
      const sb = s.y + s.h;
      const tb = t.y + t.h;
      return {
        d: `M ${sx} ${sb} L ${sx} ${bottom - r} Q ${sx} ${bottom} ${sx - r} ${bottom} L ${tx + r} ${bottom} Q ${tx} ${bottom} ${tx} ${bottom - r} L ${tx} ${tb}`,
        lx: (sx + tx) / 2,
        ly: bottom + 15,
        anchor: "middle",
      };
    }
    // Clear any stage caption sitting above the nodes this loop passes over.
    const captioned = Object.keys(bp.captions).some((k) => Number(k) >= tn.stage && Number(k) <= sn.stage);
    const top = Math.min(...span.map((x) => x.y)) - (captioned ? 34 : 24);
    return {
      d: `M ${sx} ${s.y} L ${sx} ${top + r} Q ${sx} ${top} ${sx - r} ${top} L ${tx + r} ${top} Q ${tx} ${top} ${tx} ${top + r} L ${tx} ${t.y}`,
      lx: (sx + tx) / 2,
      ly: top - 6,
      anchor: "middle",
    };
  }
  const right = Math.max(...span.map((x) => x.x + x.w)) + 18;
  const sy = s.y + s.h / 2;
  const ty = t.y + t.h / 2;
  return {
    d: `M ${s.x + s.w} ${sy} L ${right - r} ${sy} Q ${right} ${sy} ${right} ${sy - r} L ${right} ${ty + r} Q ${right} ${ty} ${right - r} ${ty} L ${t.x + t.w} ${ty}`,
    lx: right + 4,
    ly: (sy + ty) / 2,
    anchor: "middle",
    rotate: true,
  };
}
