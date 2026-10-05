import { ArrowCounterClockwise, CaretLeft, CaretRight, Cpu, Function as FunctionIcon, Pause, Play, X } from "@phosphor-icons/react";
import { AnimatePresence, animate, m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type BNode, type Blueprint, KIND_LABEL, outgoing } from "../lib/blueprint";
import { ArchitectureMap, EngineChip, GateBadge, KIND_ICON, NODE_STYLE } from "./ArchitectureMap";

// A full-screen, self-running tour of the architecture. For each step the
// camera zooms onto it and the step opens in place, flipping over to show
// everything about it. Neighbouring steps slide outward to make room and their
// connections stretch to meet the open card, so nothing is covered.
// Ten seconds per step, with pause, back, next and exit always available.

export const STEP_SECONDS = 10;

type Camera = { x: number; y: number; scale: number; fw: number; fh: number; maxH: number };

export function Walkthrough({ bp, onClose, startAt = 0 }: { bp: Blueprint; onClose: () => void; startAt?: number }) {
  const reduce = useReducedMotion();
  const total = bp.nodes.length;
  const [index, setIndex] = useState(startAt);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const [cam, setCam] = useState<Camera | null>(null);
  const [stageW, setStageW] = useState(0);
  // The step currently opened in the diagram, its open size, and how open it is (0 to 1).
  const [cardSize, setCardSize] = useState<{ id: string; w: number; h: number } | null>(null);
  const [openFor, setOpenFor] = useState<{ id: string; w: number; h: number } | null>(null);
  const [openT, setOpenT] = useState(0);
  const openTRef = useRef(0);
  openTRef.current = openT;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);
  const pauseRef = useRef<HTMLButtonElement>(null);
  const elapsed = useRef(0);
  const enteredFullscreen = useRef(false);
  const node = bp.nodes[index];

  const go = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(total - 1, i));
      elapsed.current = 0;
      setDone(false);
      setIndex(next);
    },
    [total],
  );
  // Relative moves read the latest step, so quick repeated taps all count.
  const move = useCallback(
    (delta: number) => {
      elapsed.current = 0;
      setDone(false);
      setIndex((i) => Math.max(0, Math.min(total - 1, i + delta)));
    },
    [total],
  );

  // ---------------------------------------------------------------- timer
  useEffect(() => {
    elapsed.current = 0;
  }, [index]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (playing && !done) {
        elapsed.current += dt;
        if (elapsed.current >= STEP_SECONDS * 1000) {
          if (index < total - 1) {
            elapsed.current = 0;
            setIndex((i) => i + 1);
          } else {
            elapsed.current = STEP_SECONDS * 1000;
            setDone(true);
            setPlaying(false);
          }
        }
      }
      const f = Math.min(1, elapsed.current / (STEP_SECONDS * 1000));
      if (barRef.current) barRef.current.style.transform = `scaleX(${f})`;
      if (secondsRef.current) secondsRef.current.textContent = `${Math.ceil(STEP_SECONDS * (1 - f))}s`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, done, index, total]);

  // ---------------------------------------------------------------- camera
  const aim = useCallback(() => {
    const area = stageRef.current;
    const world = worldRef.current;
    if (!area || !world) return;
    const el = world.querySelector<HTMLElement>(`[data-node="${node.id}"]`);
    const grid = world.querySelector<HTMLElement>("[data-layout]");
    if (!el || !grid) return;
    const w = area.clientWidth;
    const h = area.clientHeight;
    const scale = w >= 1000 ? 1.3 : w >= 640 ? 1.15 : 1;
    const cx = grid.offsetLeft + el.offsetLeft + el.offsetWidth / 2;
    const cy = grid.offsetTop + el.offsetTop + el.offsetHeight / 2;
    setCam({ x: w / 2 - cx * scale, y: h / 2 - cy * scale, scale, fw: el.offsetWidth * scale, fh: el.offsetHeight * scale, maxH: h - 32 });
  }, [node.id]);

  const reportSize = useCallback(
    (size: { w: number; h: number }) =>
      setCardSize((prev) =>
        prev && prev.id === node.id && Math.abs(prev.w - size.w) < 1 && Math.abs(prev.h - size.h) < 1 ? prev : { id: node.id, ...size },
      ),
    [node.id],
  );

  // One animation at a time drives how open the current step is.
  const openAnim = useRef<{ stop: () => void } | null>(null);
  useEffect(() => () => openAnim.current?.stop(), []);

  // Moving on: close the open step smoothly (neighbours slide back) while the camera travels.
  useEffect(() => {
    openAnim.current?.stop();
    if (reduce || openTRef.current === 0) {
      setOpenT(0);
      setOpenFor(null);
      return;
    }
    openAnim.current = animate(openTRef.current, 0, {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: setOpenT,
      onComplete: () => setOpenFor(null),
    });
  }, [index, reduce]);

  // Once closed and the new card has its size: open it in place, in step with its flip.
  useEffect(() => {
    if (!cardSize || cardSize.id !== node.id) return;
    if (openFor?.id === node.id) {
      // Already open: just follow size changes (for example, a resized window).
      if (openFor.w !== cardSize.w || openFor.h !== cardSize.h) setOpenFor(cardSize);
      return;
    }
    if (openFor) return; // still closing the previous step
    setOpenFor(cardSize);
    if (reduce) {
      setOpenT(1);
      return;
    }
    openAnim.current?.stop();
    openAnim.current = animate(0, 1, { delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1], onUpdate: setOpenT });
  }, [cardSize, node.id, openFor, reduce]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setStageW(el.clientWidth);
      aim();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aim]);

  useEffect(() => aim(), [aim, index]);

  // ---------------------------------------------------------------- page behaviour
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    pauseRef.current?.focus();
    // Real full screen where the browser allows it; the overlay already fills the window otherwise.
    const root = rootRef.current;
    if (root?.requestFullscreen && !document.fullscreenElement) {
      root
        .requestFullscreen()
        .then(() => (enteredFullscreen.current = true))
        .catch(() => {});
    }
    const onFs = () => {
      if (enteredFullscreen.current && !document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      opener?.focus?.();
    };
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight") move(1);
    else if (e.key === "ArrowLeft") move(-1);
    else if ((e.key === " " || e.key === "k") && tag !== "BUTTON") setPlaying((p) => !p);
    else if (e.key === "Tab") {
      // Keep focus inside the walkthrough.
      const f = [...(rootRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex='0']") ?? [])];
      if (!f.length) return;
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) lastEl.focus();
      else if (!e.shiftKey && document.activeElement === lastEl) first.focus();
      else return;
    } else return;
    e.preventDefault();
  };

  const replay = () => {
    go(0);
    setPlaying(true);
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Walkthrough: ${bp.title}`}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[70] flex flex-col bg-bg"
    >
      {/* ------------------------------------------------ controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-muted">Walkthrough</p>
          <p className="truncate text-[15px] font-semibold text-ink">{bp.title}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 font-mono text-[13px] text-muted" aria-live="polite">
            {index + 1}/{total}
          </span>
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label="Previous step"
            className="inline-flex h-10 items-center gap-1 rounded-full border border-line-strong px-3.5 text-[14px] font-medium text-ink hover:bg-surface-2 disabled:opacity-40"
          >
            <CaretLeft size={16} weight="bold" aria-hidden />
            Previous
          </button>
          {done ? (
            <button
              ref={pauseRef}
              type="button"
              onClick={replay}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-[14px] font-medium text-accent-ink"
            >
              <ArrowCounterClockwise size={17} weight="bold" aria-hidden />
              Replay
            </button>
          ) : (
            <button
              ref={pauseRef}
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause the walkthrough" : "Play the walkthrough"}
              className="inline-flex h-10 min-w-[6.5rem] items-center justify-center gap-2 rounded-full bg-accent px-4 text-[14px] font-medium text-accent-ink"
            >
              {playing ? <Pause size={17} weight="fill" aria-hidden /> : <Play size={17} weight="fill" aria-hidden />}
              {playing ? "Pause" : "Play"}
              <span ref={secondsRef} aria-hidden className="font-mono text-[12.5px] opacity-80" />
            </button>
          )}
          <button
            type="button"
            onClick={() => move(1)}
            disabled={index === total - 1}
            aria-label="Next step"
            className="inline-flex h-10 items-center gap-1 rounded-full border border-line-strong px-3.5 text-[14px] font-medium text-ink hover:bg-surface-2 disabled:opacity-40"
          >
            Next
            <CaretRight size={16} weight="bold" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit the walkthrough"
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={19} aria-hidden />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ timer: one segment per step */}
      <div className="flex gap-1 px-4 pt-2 sm:px-6" aria-hidden>
        {bp.nodes.map((n, i) => (
          <span key={n.id} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            {i < index && <span className="absolute inset-0 bg-accent" />}
            {i === index && <span ref={barRef} className="absolute inset-0 origin-left bg-accent" style={{ transform: "scaleX(0)" }} />}
          </span>
        ))}
      </div>

      {/* ------------------------------------------------ the zooming diagram and the step opening in place */}
      <div ref={stageRef} className="relative flex-1 overflow-hidden" style={{ perspective: 1600 }}>
        <div
          ref={worldRef}
          aria-hidden
          inert
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: stageW || undefined,
            transform: cam ? `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})` : undefined,
            transition: reduce ? undefined : "transform 650ms cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: cam ? 1 : 0,
          }}
        >
          <div className="opacity-50">
            <ArchitectureMap
              bp={bp}
              selected={node.id}
              onSelect={() => {}}
              panelId="walkthrough-card"
              ghost={node.id}
              expand={cam && openFor ? { id: openFor.id, w: openFor.w / cam.scale, h: openFor.h / cam.scale, t: openT } : null}
              onLayout={aim}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {cam && (
              <FlipCard
                key={node.id}
                node={node}
                bp={bp}
                cam={cam}
                onSize={reportSize}
                onJump={(id) => go(bp.nodes.findIndex((n) => n.id === id))}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {`Step ${node.step} of ${total}: ${node.name}. ${node.what}`}
      </p>
      <p className="hidden px-6 pb-3 text-center text-[12.5px] text-muted sm:block [@media(max-height:560px)]:hidden">
        Space pauses. Arrow keys move between steps. Esc exits.
      </p>
    </div>
  );
}

const CARD_W = "min(560px, calc(100vw - 2rem))";

function FlipCard({
  node,
  bp,
  cam,
  onSize,
  onJump,
}: {
  node: BNode;
  bp: Blueprint;
  cam: Camera;
  onSize: (s: { w: number; h: number }) => void;
  onJump: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const Icon = KIND_ICON[node.kind];
  const next = outgoing(bp, node.id);
  const backRef = useRef<HTMLDivElement>(null);

  // The open size decides how far the neighbouring steps move.
  useLayoutEffect(() => {
    const el = backRef.current;
    if (!el) return;
    const report = () => onSize({ w: el.offsetWidth, h: Math.min(el.offsetHeight, cam.maxH) });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSize, cam.maxH]);

  // The front looks exactly like the step in the diagram it opens out of.
  const front = (
    <div
      className={`absolute inset-0 flex flex-col items-start gap-1.5 rounded-2xl px-3.5 py-3 text-left ${NODE_STYLE[node.kind]}`}
      style={{ backfaceVisibility: "hidden" }}
    >
      <span className="flex items-center gap-1.5">
        <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[11.5px] font-semibold text-accent-ink">
          {node.step}
        </span>
        <Icon size={14} aria-hidden className="text-muted" />
      </span>
      <span className="text-[14.5px] font-semibold leading-snug text-ink">{node.name}</span>
      {node.engine && node.kind !== "start" ? <EngineChip engine={node.engine} /> : <span className="text-[12.5px] text-muted">{node.label}</span>}
    </div>
  );

  const back = (
    <div
      ref={backRef}
      className="shadow-soft rounded-2xl border border-line bg-surface text-left"
      style={{ width: CARD_W, transform: reduce ? undefined : "rotateY(180deg)", backfaceVisibility: "hidden" }}
    >
      <div className="overflow-y-auto p-5 sm:p-6" style={{ maxHeight: cam.maxH }}>
        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          <span className="font-medium text-ink">
            Step {node.step} of {bp.nodes.length}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink">
            <Icon size={12} aria-hidden />
            {KIND_LABEL[node.kind]}
          </span>
        </p>
        <h2 className="mt-1.5 text-[1.375rem] font-semibold leading-tight tracking-tight text-ink">{node.name}</h2>
        <p className="mt-0.5 text-[13.5px] text-muted">{node.label}</p>

        {node.engine && (
          <div className="mt-4 rounded-xl bg-surface-2 p-3.5">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              {node.engine.kind === "model" ? <Cpu size={13} aria-hidden /> : <FunctionIcon size={13} aria-hidden />}
              {node.kind === "start" ? "How it starts" : node.engine.kind === "model" ? "Model" : "Method, no AI"}
            </p>
            <p className="mt-0.5 text-[15.5px] font-semibold text-ink">
              {node.engine.kind === "model" ? node.engine.name.split(",")[0] : node.engine.name}
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{node.engine.kind === "model" ? node.engine.why : node.engine.how}</p>
            {node.engine.kind === "model" && <p className="mt-1 text-[13px] leading-relaxed text-muted">{node.engine.prototype}</p>}
          </div>
        )}

        <dl className="mt-4 grid gap-3 text-[14px] leading-relaxed">
          <div>
            <dt className="text-[12.5px] font-semibold text-ink">What happens</dt>
            <dd className="text-ink">{node.what}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-semibold text-ink">Why it's here</dt>
            <dd className="text-ink">{node.why}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-semibold text-ink">What it passes on</dt>
            <dd className="text-ink">{node.passes}</dd>
          </div>
        </dl>

        {next.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {next.map(({ edge, node: n }) => (
              <button
                key={`${edge.to}-${edge.label}`}
                type="button"
                onClick={() => onJump(n.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong/60 px-2.5 py-1 text-[12.5px] text-ink hover:border-accent hover:bg-accent-soft"
              >
                <CaretRight size={11} aria-hidden className="text-muted" />
                {edge.label && <span className="text-muted">{edge.label}:</span>}
                Step {n.step}, {n.name}
              </button>
            ))}
          </div>
        )}

        {(node.gates.length > 0 || node.rules.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <div className="flex flex-wrap gap-1.5">
              {node.gates.map((g) => (
                <GateBadge key={g.text} kind={g.kind} text={g.text} />
              ))}
            </div>
            {node.rules.length > 0 && (
              <span className="text-[12px] text-muted">
                Rules <span className="font-mono">{[...new Set(node.rules)].join(", ")}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (reduce) {
    return (
      <m.div className="pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {back}
      </m.div>
    );
  }

  // Starts exactly on top of the step, then flips over and grows in place.
  return (
    <m.div
      className="pointer-events-auto relative overflow-visible"
      initial={{ rotateY: 0, width: cam.fw, height: cam.fh, opacity: 1 }}
      animate={{ rotateY: 180, width: CARD_W, height: "auto" }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {front}
      {back}
    </m.div>
  );
}
