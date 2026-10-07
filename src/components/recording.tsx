import { ArrowClockwise, Gear, Globe, NotePencil, Pause, Play, PlayCircle, Smiley, TerminalWindow } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { btn } from "./ui";

// Shared pieces for the scripted "screen recordings" in the starter kit
// guides: a video-style player, and a desktop with a cursor, clicks, key
// badges and a dock. Every frame is a pure function of the playhead `t`, so a
// recording can be paused and scrubbed like a real video.

// The stage is drawn at a fixed size and scaled to fit, like a real recording.
export const W = 960;
export const H = 540;

export const ACCENT = "#1c6650";
export const MONO = "'Geist Mono Variable', ui-monospace, monospace";

// ------------------------------------------------------------------ timeline helpers

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Progress from 0 to 1 between two times. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Text typed out evenly between two times. */
export const typed = (text: string, t: number, a: number, b: number) => text.slice(0, Math.round(text.length * seg(t, a, b)));

export type Point = readonly [number, number];
/** Cursor keyframes: [time, place]. The cursor eases between them and waits where two match. */
export type Path = readonly (readonly [number, Point])[];
/** [time, place] of each click. */
export type Clicks = readonly (readonly [number, Point])[];
/** [time, label] of each key press shown on screen. */
export type Keys = readonly (readonly [number, string])[];
export type Section = { until: number; caption: string };

function cursorAt(path: Path, t: number): Point {
  for (let i = 1; i < path.length; i++) {
    const [t0, a] = path[i - 1];
    const [t1, b] = path[i];
    if (t <= t1) {
      const p = ease(seg(t, t0, t1));
      return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
    }
  }
  return path[path.length - 1][1];
}

const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

// ------------------------------------------------------------------ player

export function VideoPlayer({
  seconds,
  sections,
  onSection,
  description,
  children,
}: {
  seconds: number;
  sections: Section[];
  onSection?: (i: number) => void;
  /** What happens in the recording, for screen readers. */
  description: string;
  children: (t: number) => ReactNode;
}) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [scale, setScale] = useState(1);
  const tRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      tRef.current = Math.min(seconds, tRef.current + (now - last) / 1000);
      last = now;
      setT(tRef.current);
      if (tRef.current >= seconds) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, seconds]);

  const section = sections.findIndex((s) => t < s.until);
  useEffect(() => onSection?.(section), [section]); // eslint-disable-line react-hooks/exhaustive-deps -- only when the section changes

  const seek = (to: number) => {
    tRef.current = to;
    setT(to);
  };
  const toggle = () => {
    if (!playing && tRef.current >= seconds) seek(0);
    setPlaying((p) => !p);
  };
  const ended = t >= seconds;

  return (
    <figure className="mx-auto w-full max-w-[860px]">
      <div
        ref={boxRef}
        onClick={toggle}
        aria-hidden
        className="relative aspect-video w-full cursor-pointer select-none overflow-hidden rounded-xl border border-line bg-[#0f3d30] shadow-sm"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          {children(t)}
          {!playing && (t === 0 || ended) && (
            <div className="absolute inset-0 grid place-items-center bg-black/25">
              <span className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-[17px] font-medium text-[#13201b] shadow-lg">
                {ended ? <ArrowClockwise size={20} weight="bold" /> : <PlayCircle size={22} weight="fill" color={ACCENT} />}
                {ended ? "Watch again" : "Play the walkthrough"}
              </span>
            </div>
          )}
        </div>
      </div>
      <figcaption className="sr-only">{description}</figcaption>

      <div className="mt-2.5 flex items-center gap-2">
        <button type="button" className={`${btn.quiet} px-2.5`} onClick={toggle} aria-label={playing ? "Pause" : ended ? "Replay" : "Play"}>
          {playing ? <Pause size={16} weight="fill" aria-hidden /> : ended ? <ArrowClockwise size={16} aria-hidden /> : <Play size={16} weight="fill" aria-hidden />}
        </button>
        <input
          type="range"
          min={0}
          max={seconds}
          step={0.05}
          value={t}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Position in the walkthrough"
          aria-valuetext={`${Math.floor(t)} of ${Math.ceil(seconds)} seconds`}
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-accent"
        />
        <span className="shrink-0 whitespace-nowrap text-right font-mono text-[12px] tabular-nums text-muted">
          {clock(t)} / {clock(seconds)}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        <span className="font-medium text-ink">Step {section + 1}.</span> {sections[section].caption}
      </p>
    </figure>
  );
}

// ------------------------------------------------------------------ desktop

export function Lights() {
  return (
    <span className="flex gap-[6px]">
      <span className="size-3 rounded-full bg-[#ec6a5e]" />
      <span className="size-3 rounded-full bg-[#f4bf4f]" />
      <span className="size-3 rounded-full bg-[#61c554]" />
    </span>
  );
}

/** Dock icon centres, for cursor paths. */
export const DOCK = { finder: [384, 499], browser: [432, 499], terminal: [480, 499] } as const;

/** Wallpaper, menu bar, dock, key badges, click ripples and the pointer, around the app windows. */
export function Desktop({
  t,
  front,
  path,
  clicks,
  keys,
  opened = {},
  children,
}: {
  t: number;
  /** The app named in the menu bar. */
  front: string;
  path: Path;
  clicks: Clicks;
  keys: Keys;
  /** When Finder or Terminal is opened from the dock. */
  opened?: { finder?: number; terminal?: number };
  children: ReactNode;
}) {
  const [cx, cy] = cursorAt(path, t);
  const pressed = clicks.some(([at]) => t >= at && t < at + 0.12);
  const key = keys.find(([at]) => t >= at && t < at + 0.8);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #0f3d30 0%, #1c6650 50%, #79cbab 100%)", fontFamily: "var(--font-sans)" }}>
      <div className="absolute inset-x-0 top-0 flex h-[22px] items-center gap-4 bg-black/30 px-4 text-[12px] text-white/90 backdrop-blur">
        <span className="font-semibold">{front}</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Window</span>
        <span className="ml-auto">9:41</span>
      </div>

      {children}
      <Dock t={t} opened={opened} />

      {/* Keys pressed, as screen recorders show them */}
      {key && (
        <div
          className="absolute left-1/2 top-[428px] -translate-x-1/2 rounded-xl bg-black/75 px-4 py-2 text-[18px] font-medium text-white shadow-lg"
          style={{ opacity: 1 - seg(t, key[0] + 0.55, key[0] + 0.8) }}
        >
          {key[1]}
        </div>
      )}

      {clicks
        .filter(([at]) => t >= at && t < at + 0.45)
        .map(([at, [x, y]]) => {
          const p = seg(t, at, at + 0.45);
          return (
            <span
              key={at}
              className="pointer-events-none absolute rounded-full border-2 border-white"
              style={{ left: x - 18, top: y - 18, width: 36, height: 36, opacity: 1 - p, transform: `scale(${0.3 + p})`, background: "rgba(255,255,255,.25)" }}
            />
          );
        })}

      {/* Pointer, its tip at the cursor position */}
      <svg width="22" height="22" viewBox="0 0 20 20" className="absolute" style={{ left: cx - 3, top: cy - 2, transform: `scale(${pressed ? 0.85 : 1})`, transformOrigin: "3px 2px" }}>
        <path d="M3 2 L3 16 L7 12.5 L9.6 18 L12 17 L9.5 11.6 L14.5 11.6 Z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Dock({ t, opened }: { t: number; opened: { finder?: number; terminal?: number } }) {
  const at = (x?: number) => x ?? Infinity;
  const apps = [
    { name: "Finder", icon: <Smiley size={22} weight="fill" color="#fff" />, bg: "linear-gradient(#5aa9e6,#2f6fde)", click: at(opened.finder) },
    { name: "Browser", icon: <Globe size={22} color="#2f6fde" />, bg: "#fff", click: -Infinity },
    { name: "Terminal", icon: <TerminalWindow size={22} color="#d7e0db" />, bg: "#1f2422", click: at(opened.terminal) },
    { name: "Notes", icon: <NotePencil size={22} color="#7a5b00" />, bg: "#f4d35e", click: Infinity },
    { name: "Settings", icon: <Gear size={22} color="#4d5b55" />, bg: "#dfe4e1", click: Infinity },
  ];
  return (
    <div className="absolute bottom-[8px] left-1/2 flex -translate-x-1/2 gap-3 rounded-2xl border border-white/30 bg-white/25 px-3 pb-2 pt-2 backdrop-blur">
      {apps.map((a) => {
        // A short hop when the app is clicked.
        const hop = Number.isFinite(a.click) ? Math.sin(Math.PI * seg(t, a.click, a.click + 0.5)) * 10 : 0;
        return (
          <span key={a.name} className="flex flex-col items-center">
            <span className="grid size-9 place-items-center rounded-[10px] shadow" style={{ background: a.bg, transform: `translateY(${-hop}px)` }}>
              {a.icon}
            </span>
            <span className={`mt-[3px] size-1 rounded-full ${t >= a.click ? "bg-white" : "bg-transparent"}`} />
          </span>
        );
      })}
    </div>
  );
}

/** A browser window with tabs and an address bar; the page goes in `children`, below y = 66. */
export function BrowserFrame({
  tabs,
  active,
  address,
  toolbar,
  style,
  children,
}: {
  tabs: { title: string; color: string }[];
  active: number;
  address: string;
  /** Extra icons at the right of the address bar. */
  toolbar?: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="absolute overflow-hidden rounded-xl border border-black/20 bg-[#f3f5f4] shadow-2xl" style={{ left: 70, top: 40, width: 820, height: 430, ...style }}>
      <div className="flex h-[34px] items-center gap-4 bg-[#dfe4e1] px-4">
        <Lights />
        <span className="flex gap-1 self-end">
          {tabs.map((tab, i) => (
            <span
              key={tab.title}
              className={`flex h-[26px] w-[230px] items-center gap-2 rounded-t-lg px-3 text-[11.5px] ${i === active ? "bg-white text-[#13201b]" : "text-[#4d5b55]"}`}
            >
              <span className="size-3 shrink-0 rounded-sm" style={{ background: tab.color }} />
              <span className="truncate">{tab.title}</span>
            </span>
          ))}
        </span>
      </div>
      <div className="flex h-[32px] items-center gap-3 border-b border-black/10 bg-white px-4">
        <span className="flex h-[22px] flex-1 items-center gap-1.5 truncate rounded-full bg-[#eef1ef] px-3 text-[11.5px] text-[#4d5b55]">{address}</span>
        {toolbar}
      </div>
      {children}
    </div>
  );
}
