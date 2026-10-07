import { useEffect, useRef, useState } from "react";

// The blueprint logo: a serif B with the green dot in its lower bowl, traced
// from the logo artwork. BrandMark is the small mark for headers. BrandIntro
// plays once on a visitor's first open: the logo fades in, settles into the
// word, and the dot hops across "lueprint" (each letter fading in as it lands)
// until it becomes the full stop; then the word glides onto the start page's
// heading, which is BrandWord, the same drawing.

/** The B, in the logo's own units: 397 wide, 462 tall, baseline at the bottom. */
const B_PATH =
  "M0.9 461.8C-0.4 461.3 -1 460.1 -1 458C-1 454.5 -1.3 454.6 10.3 453.1C25.1 451.1 33.7 447.9 40.6 441.6C49.7 433.4 53.2 424.8 54.8 407C55.2 402.3 55.3 319.1 55 222L54.5 45.5L52.1 38.9C46.1 22 34.6 14.1 10.6 10.5C5.1 9.7 0.2 8.6 -0.3 8.1C-0.8 7.6 -1 6 -0.8 4.4L-0.5 1.5L20 1C31.3 0.7 76.3 0.4 120 0.2C217 -0.1 233.8 0.9 264.5 8.7C289.7 15.2 308.5 24.9 323.9 39.5C338.4 53.3 346.6 68.4 351.2 89.5C353.2 99.2 352.7 120 350.1 129.5C342.2 158.9 320.3 181.7 286 196.2C274.3 201.1 269.8 202.6 260.5 204.6C256.1 205.5 252.1 206.6 251.7 207C251.3 207.4 256.9 208.5 264.2 209.4C279.1 211.4 301.2 216.7 313.4 221.1C357.5 237.4 385.6 268.1 394.6 310C397.1 321.8 397.2 347.6 394.7 357.8C389.1 381 379.5 397.8 362.5 413.9C340.7 434.4 312.5 447.7 273 455.9C244.5 461.8 237.2 462.1 114.2 462.3C53 462.4 2 462.2 0.9 461.8ZM225.5 448.2C236.1 445.9 250.5 440.2 260.8 434.2C270.2 428.6 285.8 413.7 292.1 404.1C306.1 382.8 312 362.3 312 334.7C312 300.9 302.5 273.3 283.4 252.1C272.6 240.1 253.7 228.8 235.6 223.6C219.1 218.8 209.1 217.8 169.2 217.3L132 216.8L132 313.1C132.1 415.9 132.2 419.7 137 428.9C141.8 438.3 152 445.7 164.2 448.5C174.1 450.7 176.3 450.8 197 450.5C211.5 450.2 218.8 449.6 225.5 448.2ZM187.8 203.4C231.5 197 258.3 170.6 265.6 126.8C267.9 112.7 267.1 92.3 263.7 78.9C258.1 57.3 247.4 40.8 231.6 29.1C203.7 8.5 154.6 6.5 138.5 25.3C131.9 33 132 31.6 132 122.6C132 167.8 132.3 205 132.8 205.4C133.9 206.7 176.3 205.1 187.8 203.4Z";
const B_W = 397;
const B_H = 462;
const DOT = { cx: 220, cy: 339, r: 63.5 };

/** The logo mark: the B in the ink colour, the dot in the accent. Size it with a height class. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`-1 0 ${B_W + 2} ${B_H + 1}`} className={`brand-mark ${className}`} aria-hidden>
      <path d={B_PATH} fill="currentColor" />
      <circle cx={DOT.cx} cy={DOT.cy} r={DOT.r} className="brand-dot" />
    </svg>
  );
}

// ---- the word and its hops ----------------------------------------------------

// Layout in Instrument Serif's units (1000 per em, cap height 720), baseline at y = 0.
const CAP = 720;
const S = CAP / B_H; // the B at cap height
const R = DOT.r * S;
const END_SIZE = 0.8; // the full stop is a little smaller than the dot in the logo
// [letter, advance, ink left, ink right, ink top] from the font's metrics.
const GLYPHS: [string, number, number, number, number][] = [
  ["l", 220, 8, 210, 740],
  ["u", 454, 11, 439, 510],
  ["e", 355, 23, 330, 516],
  ["p", 444, 12, 414, 516],
  ["r", 318, 15, 318, 516],
  ["i", 223, 15, 212, 710],
  ["n", 470, 15, 459, 516],
  ["t", 259, 10, 245, 651],
];
const LETTER_X: number[] = [];
let cursor = B_W * S + 0.03 * CAP;
for (const g of GLYPHS) {
  LETTER_X.push(cursor);
  cursor += g[1];
}
const PERIOD = { x: cursor + 0.06 * CAP + R * END_SIZE, y: -R };
const WORD_W = PERIOD.x + R * END_SIZE;
const BOWL = { x: DOT.cx * S, y: -CAP + DOT.cy * S }; // the dot's place in the B, in the word

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number) => ((t = clamp(t)), t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;

type Point = { x: number; y: number };
type Hop = { start: number; dur: number; from: Point; to: Point; height: number };
type DotState = { x: number; y: number; sx: number; sy: number };

/** A hop from the bowl onto each letter and into the full stop, the first one starting at `t0` seconds. */
function makeHops(t0: number): Hop[] {
  const targets = GLYPHS.map(([, , left, right, top], i) => ({ x: LETTER_X[i] + (left + right) / 2, y: -top - R })).concat(PERIOD);
  let from: Point = BOWL;
  let t = t0;
  return targets.map((to, i) => {
    const last = i === targets.length - 1;
    const dur = i === 0 ? 0.46 : last ? 0.42 : 0.27;
    const hop = { start: t, dur, from, to, height: i === 0 ? 0.9 * CAP : 0.55 * CAP + Math.max(0, from.y - to.y) * 0.4 };
    t += dur + 0.05; // a short sit on each letter
    from = to;
    return hop;
  });
}
const landed = (hops: Hop[]) => hops[hops.length - 1].start + hops[hops.length - 1].dur;

/** How far the dot has crouched (0 to 1) just before its first jump. */
const crouch = (time: number, hops: Hop[]) => Math.sin((clamp((time - (hops[0].start - 0.18)) / 0.18) * Math.PI) / 2);

/** The dot in the bowl, crouching before the first jump. */
function bowlState(time: number, hops: Hop[]): DotState {
  const pre = crouch(time, hops);
  const sy = 1 - 0.16 * pre;
  return { x: BOWL.x, y: BOWL.y + R * (1 - sy), sx: 1 + 0.16 * pre, sy };
}

/** The dot's centre and radius scales once it has left the bowl. */
function hopState(time: number, hops: Hop[]): DotState {
  for (let i = 0; i < hops.length; i++) {
    const { start, dur, from, to, height } = hops[i];
    const next = i + 1 < hops.length ? hops[i + 1].start : Infinity;
    const last = i === hops.length - 1;
    if (time < start + dur) {
      const u = clamp((time - start) / dur);
      const stretch = 0.1 * Math.sin(u * Math.PI);
      const size = last ? 1 - (1 - END_SIZE) * easeInOut(u) : 1;
      const y = from.y + (to.y - from.y) * u - height * 4 * u * (1 - u) + (last ? R * (1 - size) : 0);
      return { x: from.x + (to.x - from.x) * u, y, sx: (1 - stretch) * size, sy: (1 + stretch) * size };
    }
    if (time < next) {
      // Landed: squash, then recover (and crouch before the next jump).
      const since = time - (start + dur);
      let squash = (last ? 0.3 : 0.22) * Math.exp(-since / (last ? 0.16 : 0.09)) * Math.cos(since * (last ? 28 : 40));
      if (!last) squash += 0.12 * clamp(1 - (next - time) / 0.05);
      const size = last ? END_SIZE : 1;
      const sy = (1 - squash) * size;
      return { x: to.x, y: to.y + R * (1 - sy), sx: (1 + squash) * size, sy };
    }
  }
  throw new Error("unreachable");
}

/** Each letter fades in, rising a little, as the dot lands on it. */
function drawLetters(letters: (SVGTextElement | null)[], time: number, hops: Hop[]) {
  letters.forEach((el, i) => {
    if (!el) return;
    const k = easeOut((time - (hops[i].start + hops[i].dur * 0.35)) / 0.42);
    el.setAttribute("opacity", String(k));
    el.setAttribute("transform", `translate(0 ${(1 - k) * 0.07 * CAP})`);
  });
}

function drawDot(dot: SVGEllipseElement | null, d: DotState, scale = 1, opacity = 1) {
  if (!dot) return;
  dot.setAttribute("cx", String(d.x));
  dot.setAttribute("cy", String(d.y));
  dot.setAttribute("rx", String(R * scale * d.sx));
  dot.setAttribute("ry", String(R * scale * d.sy));
  dot.setAttribute("opacity", String(opacity));
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Runs `draw(seconds)` every frame until `total`, once the serif has loaded. Returns a cancel function. */
function runTimeline(total: number, draw: (time: number) => void, onEnd?: () => void) {
  let frame = 0;
  let begun = 0;
  let cancelled = false;
  const tick = (now: number) => {
    if (cancelled) return;
    if (!begun) begun = now;
    const time = (now - begun) / 1000;
    draw(Math.min(time, total));
    if (time < total) frame = requestAnimationFrame(tick);
    else onEnd?.();
  };
  // Start once the serif has loaded, so the letters don't swap font mid-animation.
  const fontReady = document.fonts?.load(`400 100px "Instrument Serif"`) ?? Promise.resolve();
  Promise.race([fontReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
    if (!cancelled) frame = requestAnimationFrame(tick);
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

function Letters({ refs }: { refs: React.RefObject<(SVGTextElement | null)[]> }) {
  return GLYPHS.map(([ch], i) => (
    <text
      key={i}
      ref={(el) => {
        refs.current[i] = el;
      }}
      x={LETTER_X[i]}
      y={0}
      opacity={0}
      fontFamily='"Instrument Serif", serif'
      fontSize={1000}
      fill="currentColor"
    >
      {ch}
    </text>
  ));
}

// ---- the finished word ------------------------------------------------------------

/** Where the dot rests at the end: the full stop, a little smaller than in the logo, sitting on the baseline. */
const FINAL_DOT: DotState = { x: PERIOD.x, y: -R * END_SIZE, sx: END_SIZE, sy: END_SIZE };
/** The finished word's box: its line box (ascent 0.99 em, descent 0.31 em) and a little room either side. */
const WORD_VIEW = { x: -10, y: -990, w: WORD_W + 20, h: 1300 };

/**
 * "Blueprint." as the intro leaves it: the logo's B, "lueprint" in Instrument
 * Serif and the dot as the full stop. Sized by font-size, so it drops into a
 * heading. The intro ends by landing exactly on this.
 */
export function BrandWord({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`${WORD_VIEW.x} ${WORD_VIEW.y} ${WORD_VIEW.w} ${WORD_VIEW.h}`} className={`brand-word ${className}`} data-intro-target aria-hidden>
      <path d={B_PATH} fill="currentColor" transform={`translate(0 ${-CAP}) scale(${S})`} />
      {GLYPHS.map(([ch], i) => (
        <text key={i} x={LETTER_X[i]} y={0} fontFamily='"Instrument Serif", serif' fontSize={1000} fill="currentColor">
          {ch}
        </text>
      ))}
      <ellipse className="brand-dot" cx={FINAL_DOT.x} cy={FINAL_DOT.y} rx={R * FINAL_DOT.sx} ry={R * FINAL_DOT.sy} />
    </svg>
  );
}

// ---- the first-open intro ---------------------------------------------------------

const SEEN_KEY = "aag:intro-seen";

/** Whether to play the intro: only on a first open, and never with reduced motion. */
export function shouldPlayIntro() {
  try {
    if (localStorage.getItem(SEEN_KEY)) return false;
  } catch {
    return false;
  }
  return !reducedMotion();
}

const T_FADE = [0.15, 1.0]; // the logo appears
const T_MOVE = [1.35, 2.25]; // and settles into the word
const LOGO_CAP = CAP * 1.65; // the logo's size before it settles
const CENTRE = { x: WORD_W / 2, y: -CAP / 2 };
const VIEW = { x: -40, y: CENTRE.y - 1040, w: WORD_W + 80, h: 2080 };
const INTRO_HOPS = makeHops(2.35);
const INTRO_TOTAL = landed(INTRO_HOPS) + 0.8;
const MORPH = 0.9; // the word glides onto the start page's heading
const FADE_OUT = 0.6; // where there's no heading to land on

/** The B's cap height and top-left corner at a time. */
function bGeom(time: number) {
  const k = easeInOut((time - T_MOVE[0]) / (T_MOVE[1] - T_MOVE[0]));
  const h = LOGO_CAP + (CAP - LOGO_CAP) * k;
  const start = { x: CENTRE.x - (B_W * LOGO_CAP) / B_H / 2, y: CENTRE.y - LOGO_CAP / 2 };
  return { h, x: start.x * (1 - k), y: start.y + (-CAP - start.y) * k, w: (B_W * h) / B_H };
}

type Placement = { x: number; y: number; k: number };

/**
 * Where to put the intro's word, in its SVG's units, so it lies exactly on the
 * page's BrandWord (the same drawing, so the hand-over is invisible). Null
 * when the page has none.
 */
function morphTo(svg: SVGSVGElement): Placement | null {
  const target = document.querySelector<SVGSVGElement>("svg[data-intro-target]");
  if (!target) return null;
  const at = target.getBoundingClientRect();
  if (!at.width) return null;
  const box = svg.getBoundingClientRect();
  const unit = box.width / VIEW.w; // screen pixels per unit, here
  const targetUnit = at.width / WORD_VIEW.w; // and there
  // The target word's origin (the B's bottom-left), in this SVG's units.
  const x = (at.left - WORD_VIEW.x * targetUnit - box.left) / unit + VIEW.x;
  const y = (at.top - WORD_VIEW.y * targetUnit - box.top) / unit + VIEW.y;
  return { x, y, k: targetUnit / unit };
}

/** Moves the word to `end` over MORPH seconds, redrawing the vector each frame so it stays sharp throughout. */
function glide(word: SVGGElement, end: Placement, onArrive: () => void) {
  let frame = 0;
  let begun = 0;
  const tick = (now: number) => {
    if (!begun) begun = now;
    const e = easeInOut((now - begun) / 1000 / MORPH);
    word.setAttribute("transform", `translate(${end.x * e} ${end.y * e}) scale(${1 + (end.k - 1) * e})`);
    if (e < 1) frame = requestAnimationFrame(tick);
    else onArrive();
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/**
 * A full-screen intro that plays once. At the end the word glides onto the
 * start page's heading, which is the same drawing, and hands over to it in a
 * single frame. Elsewhere it simply fades away. A click or key press skips to
 * the end.
 */
export function BrandIntro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wordRef = useRef<SVGGElement>(null);
  const bRef = useRef<SVGGElement>(null);
  const dotRef = useRef<SVGEllipseElement>(null);
  const letterRefs = useRef<(SVGTextElement | null)[]>([]);
  const [phase, setPhase] = useState<"play" | "morph" | "fade">("play");
  const finish = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    const draw = (time: number) => {
      const fade = easeOut((time - T_FADE[0]) / (T_FADE[1] - T_FADE[0]));
      const zoom = 0.94 + 0.06 * fade;
      const g = bGeom(time);
      const cx = g.x + g.w / 2;
      const cy = g.y + g.h / 2;
      bRef.current?.setAttribute("transform", `translate(${cx - (g.w * zoom) / 2} ${cy - (g.h * zoom) / 2}) scale(${(g.h / B_H) * zoom})`);
      bRef.current?.setAttribute("opacity", String(fade));
      drawLetters(letterRefs.current, time, INTRO_HOPS);
      if (time >= INTRO_HOPS[0].start) return drawDot(dotRef.current, hopState(time, INTRO_HOPS));
      // In the bowl, moving and scaling with the B.
      const d = bowlState(time, INTRO_HOPS);
      const k = g.h / CAP;
      const x = g.x + (d.x - BOWL.x + DOT.cx * S) * k;
      const y = g.y + (d.y - BOWL.y + DOT.cy * S) * k;
      drawDot(dotRef.current, { ...d, x: cx + (x - cx) * zoom, y: cy + (y - cy) * zoom }, k * zoom, fade);
    };

    const timers: number[] = [];
    let ended = false;
    let cancel = () => {};
    finish.current = () => {
      if (ended) return;
      ended = true;
      cancel();
      // The finished word, exactly as BrandWord draws it.
      draw(INTRO_TOTAL);
      bRef.current?.setAttribute("transform", `translate(0 ${-CAP}) scale(${S})`);
      drawDot(dotRef.current, FINAL_DOT);
      const svg = svgRef.current;
      const word = wordRef.current;
      const end = svg && word && morphTo(svg);
      if (!word || !end) {
        onReveal();
        setPhase("fade");
        timers.push(window.setTimeout(onDone, FADE_OUT * 1000 + 50));
        return;
      }
      setPhase("morph");
      // On arrival, show the heading and remove the intro in the same render: the same drawing in the same place.
      cancel = glide(word, end, () => {
        onReveal();
        onDone();
      });
    };
    draw(0);
    cancel = runTimeline(INTRO_TOTAL, draw, () => finish.current());
    const skip = () => finish.current();
    window.addEventListener("keydown", skip);
    return () => {
      cancel();
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
    };
  }, [onReveal, onDone]);

  return (
    <div className={`brand-intro is-${phase}`} aria-hidden onClick={() => finish.current()}>
      <svg ref={svgRef} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}>
        <g ref={wordRef}>
          <g ref={bRef} opacity={0}>
            <path d={B_PATH} fill="currentColor" />
          </g>
          <Letters refs={letterRefs} />
          <ellipse ref={dotRef} className="brand-dot" opacity={0} />
        </g>
      </svg>
    </div>
  );
}
