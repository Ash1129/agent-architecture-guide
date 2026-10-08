import {
  ArrowCounterClockwise,
  ArrowRight,
  ArrowSquareOut,
  CaretDown,
  Check,
  Copy,
  LinkSimple,
  Cloud,
  Cpu,
  Function as FunctionIcon,
  PencilSimple,
  Robot,
  Toolbox,
  UserCheck,
  Printer,
  ShareNetwork,
  Warning,
  CircleNotch,
  Sparkle,
  ArrowUpRight,
  GitBranch,
  ArrowLeft,
  Play,
  X,
  FileCode,
} from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArchitectureMap, GateBadge, KIND_ICON } from "../components/ArchitectureMap";
import { DiagramBoundary } from "../components/DiagramBoundary";
import { Walkthrough } from "../components/Walkthrough";
import { StarterKit, type TailoringState } from "../components/StarterKit";
import { keySteps, leadStep } from "../components/ArchitectureArt";
import { BuildInvite } from "../components/BuildInvite";
import { StudioShell } from "../components/StudioShell";
import { buildStarterKit, slugify } from "../lib/starter";
import { drawioXml } from "../lib/exportxml";
import { AutonomyScale, Ladder } from "../components/Scales";
import { ModelGuidance, StepPanel } from "../components/StepPanel";
import { BasisLabel, Term, WhyList, btn } from "../components/ui";
import {
  type BNode,
  type Blueprint,
  KIND_LABEL,
  type NodeKind,
  buildBlueprint,
  buildSimplerBlueprint,
  flowAsText,
  modelPlan,
  outgoing,
  stats,
} from "../lib/blueprint";
import { AUTONOMY, LAST_REVIEWED, TOOLS, TOPOLOGIES } from "../lib/catalog";
import {
  type Answers,
  type QuestionId,
  activeQuestions,
  firstUnanswered,
  isComplete,
  optionLabel,
} from "../lib/questions";
import { type ResultView, href } from "../lib/router";
import { RULES, recommend, type Recommendation } from "../lib/rules";
import { resultAsText, resultCode, resultUrl } from "../lib/share";
import { SOURCES, type SourceId } from "../lib/sources";
import { type DesignState, type KitTextState, fetchDesign, fetchKitText, rememberedDesign } from "../lib/designs";
import { AI_ENABLED } from "../lib/features";

type Props = {
  answers: Answers;
  /** Whether this result is in the browser's saved history. */
  saved?: boolean;
  onChange: (q: QuestionId) => void;
  onStartOver: () => void;
  invalidLink: boolean;
  /** Which view of the result is showing: the solution, how to build it, or how it works. */
  view: ResultView;
  onView: (view: ResultView) => void;
  historyCount: number;
};

export function Result({ answers, saved = false, onChange, onStartOver, invalidLink, view, onView, historyCount }: Props) {
  if (!isComplete(answers)) return <NotReady answers={answers} invalidLink={invalidLink} onStartOver={onStartOver} />;
  return <Ready answers={answers} saved={saved} onChange={onChange} onStartOver={onStartOver} view={view} onView={onView} historyCount={historyCount} />;
}

// ------------------------------------------------------------------ empty state

function NotReady({ answers, invalidLink, onStartOver }: { answers: Answers; invalidLink: boolean; onStartOver: () => void }) {
  const next = firstUnanswered(answers);
  const started = Object.keys(answers).length > 0;
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        {invalidLink ? "This link doesn't contain a complete result" : started ? "You're part of the way there" : "No result yet"}
      </h1>
      <p className="mt-4 max-w-[55ch] text-[17px] leading-relaxed text-muted">
        {invalidLink
          ? "It may have been cut short when it was copied. You can answer the remaining questions, or start fresh."
          : started
            ? "Answer the remaining questions and your starting architecture will appear here."
            : "Your result appears here once you've answered a short series of questions about one business task."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={href({ name: "guide", q: next?.id ?? "task" })} className={btn.primary}>
          {started ? "Resume the guide" : "Start the guide"}
          <ArrowRight size={17} weight="bold" aria-hidden />
        </a>
        {started && (
          <button type="button" onClick={onStartOver} className={btn.secondary}>
            Start fresh
          </button>
        )}
      </div>
    </main>
  );
}

// ------------------------------------------------------------------ small pieces

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2200);
  };
  return { copied, copy };
}

function Actions({ r, bp, answers, onEdit }: { r: Recommendation; bp: Blueprint; answers: Answers; onEdit: () => void }) {
  const { copied, copy } = useCopy();
  const link = resultUrl(answers);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <div className="no-print">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.small} onClick={onEdit}>
          <PencilSimple size={16} aria-hidden />
          Edit answers
        </button>
        <button type="button" className={btn.small} onClick={() => copy("text", resultAsText(r, link, flowAsText(bp)))}>
          {copied === "text" ? <Check size={16} weight="bold" aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied === "text" ? "Copied" : "Copy summary"}
        </button>
        {canShare ? (
          <button
            type="button"
            className={btn.small}
            onClick={() => navigator.share({ title: "Agent Architecture Guide result", text: r.approach.title, url: link }).catch(() => {})}
          >
            <ShareNetwork size={16} aria-hidden />
            Share
          </button>
        ) : (
          <button type="button" className={btn.small} onClick={() => copy("link", link)}>
            {copied === "link" ? <Check size={16} weight="bold" aria-hidden /> : <LinkSimple size={16} aria-hidden />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
        )}
        <button type="button" className={btn.small} onClick={() => window.print()}>
          <Printer size={16} aria-hidden />
          Print
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied === "text" ? "Summary copied to clipboard" : copied === "link" ? "Link copied to clipboard" : ""}
      </p>
    </div>
  );
}

function AnswerList({ answers, onChange }: { answers: Answers; onChange: (q: QuestionId) => void }) {
  return (
    <dl className="grid gap-x-10 md:grid-cols-2">
      {activeQuestions(answers).map((q) => {
        const v = answers[q.id];
        const shown =
          q.kind === "text" ? String(v) : Array.isArray(v) ? v.map((x) => optionLabel(q.id, x)).join("; ") : optionLabel(q.id, String(v));
        return (
          <div key={q.id} className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-line py-3">
            <dt className="text-[13px] leading-snug text-muted">{q.title}</dt>
            <dd className="row-span-2 self-center">
              <button
                type="button"
                onClick={() => onChange(q.id)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft"
                aria-label={`Change answer: ${q.title}`}
              >
                <PencilSimple size={14} aria-hidden />
                Change
              </button>
            </dd>
            <dd className="mt-1 text-[14.5px] font-medium leading-snug text-ink">{shown}</dd>
          </div>
        );
      })}
      {answers.details?.map((d) => (
        <div key={d.q} className="border-b border-line py-3">
          <dt className="text-[13px] leading-snug text-muted">{d.q}</dt>
          <dd className="mt-1 text-[14.5px] font-medium leading-snug text-ink">{d.a}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Where the design on screen came from, and a way to compare it with the rules' version. */
function DesignNote({ design, showRules, onShowRules, bare = false }: { design: DesignState; showRules: boolean; onShowRules: (v: boolean) => void; bare?: boolean }) {
  const reduce = useReducedMotion();
  if (design.status === "off") return null;
  const toggle = (label: string, value: boolean) => (
    <button type="button" onClick={() => onShowRules(value)} className="font-medium text-accent underline-offset-4 hover:underline">
      {label}
    </button>
  );
  return (
    <p
      role="status"
      aria-live="polite"
      className={
        bare
          ? "no-print text-[13.5px] leading-relaxed text-muted [&>svg]:mr-1.5 [&>svg]:inline [&>svg]:align-[-2px]"
          : "no-print flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-4 py-2.5 text-[13px] leading-snug text-muted sm:px-6"
      }
    >
      {design.status === "loading" ? (
        <>
          <CircleNotch size={14} aria-hidden className={`text-accent ${reduce ? "" : "animate-spin"}`} />
          Drafting a design for your task with AI, grounded in the knowledge base. This is the rules' design until it's ready (about a minute).
        </>
      ) : design.status === "failed" ? (
        <>Showing the rules' design. {design.note}</>
      ) : showRules ? (
        <>Showing the rules' design. {toggle("Back to the AI design", false)}</>
      ) : (
        <>
          <Sparkle size={14} weight="fill" aria-hidden className="text-accent" />
          Designed for your task by AI{design.source === "cache" ? " (saved from an earlier run)" : ""}, checked against the guide's rules and knowledge base. Select a step to see its sources. {toggle("Compare with the rules' design", true)}
        </>
      )}
    </p>
  );
}

function Disclosure({ id, title, meta, children }: { id: string; title: string; meta: string; children: ReactNode }) {
  return (
    <details id={id} className="group print-break scroll-mt-24 rounded-2xl border border-line bg-surface open:shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 hover:bg-surface-2/60 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[16.5px] font-semibold text-ink">{title}</span>
          <span className="mt-0.5 block text-[13.5px] text-muted">{meta}</span>
        </span>
        <CaretDown size={18} aria-hidden className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 py-6 sm:px-6">{children}</div>
    </details>
  );
}

function Legend({ bp }: { bp: Blueprint }) {
  const kinds = [...new Set(bp.nodes.map((n) => n.kind))] as NodeKind[];
  const order: NodeKind[] = ["ai", "fixed", "decision", "human", "tool", "start", "end"];
  const gates = new Set(bp.nodes.flatMap((n) => n.gates.map((g) => g.kind)));
  const loops = bp.edges.some((e) => e.style === "loop");
  const assigns = bp.edges.some((e) => e.style === "assign");
  const line = (dash: string) => (
    <svg aria-hidden width="24" height="6">
      <line x1="1" y1="3" x2="23" y2="3" stroke="var(--studio-caption)" strokeWidth="1.5" strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  );
  return (
    <ul aria-label="Key" className="flow-legend">
      <li>
        <span aria-hidden className="flow-legend-ramp" />
        Step 1 to {bp.nodes.length}
      </li>
      {order
        .filter((k) => kinds.includes(k) && k !== "end")
        .map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <li key={k}>
              <span aria-hidden className={`flow-chip${k === "human" ? " is-dashed" : ""}`}>
                <Icon size={11} weight={k === "ai" ? "fill" : "regular"} />
              </span>
              {k === "start" ? "Start or finish" : KIND_LABEL[k]}
            </li>
          );
        })}
      {bp.nodes.some((n) => n.engine?.kind === "model") && (
        <li>
          <span aria-hidden className="flow-chip">
            <Cpu size={11} weight="bold" />
          </span>
          AI model
        </li>
      )}
      {bp.nodes.some((n) => n.engine?.kind === "algorithm" && n.kind !== "start") && (
        <li>
          <span aria-hidden className="flow-chip">
            <FunctionIcon size={11} weight="bold" />
          </span>
          Method, no AI
        </li>
      )}
      {gates.has("human") && (
        <li>
          <GateBadge kind="human" text="A person steps in" compact /> A person steps in
        </li>
      )}
      {gates.has("stop") && (
        <li>
          <GateBadge kind="stop" text="Stop rule" compact /> Stop rule
        </li>
      )}
      {loops && <li>{line("2 4")} Loops back</li>}
      {assigns && <li>{line("5 4")} Hands out work</li>}
    </ul>
  );
}

/** The same flow as an ordered list: an alternative to the diagram for any reader. */
function StepList({ bp, selected, onSelect, panelId }: { bp: Blueprint; selected: string | null; onSelect: (id: string | null) => void; panelId: string }) {
  return (
    <ol className="grid gap-2 py-5">
      {bp.nodes.map((n) => {
        const Icon = KIND_ICON[n.kind];
        const next = outgoing(bp, n.id);
        const on = selected === n.id;
        return (
          <li key={n.id}>
            <button
              type="button"
              data-node={n.id}
              onClick={() => onSelect(on ? null : n.id)}
              aria-pressed={on}
              aria-controls={panelId}
              className={`grid w-full grid-cols-[auto_1fr] gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                on ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
              }`}
            >
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-ink/[0.07] px-1 font-mono text-[12.5px] font-semibold text-ink">
                {n.step}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[15px] font-semibold text-ink">{n.name}</span>
                  <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                    <Icon size={12} aria-hidden />
                    {KIND_LABEL[n.kind]}, {n.label}
                  </span>
                </span>
                {n.gates.length > 0 && (
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {n.gates.map((g) => (
                      <GateBadge key={g.text} kind={g.kind} text={g.text} />
                    ))}
                  </span>
                )}
                {next.length > 0 && (
                  <span className="mt-1.5 block text-[13px] text-muted">
                    Then{" "}
                    {next.map(({ edge, node }, i) => (
                      <span key={`${edge.to}-${i}`}>
                        {i > 0 && (i === next.length - 1 ? " or " : ", ")}
                        step {node.step}
                        {edge.label ? ` (${edge.label})` : ""}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Compare({ r, full, simple }: { r: Recommendation; full: Blueprint; simple: Blueprint }) {
  const a = stats(full);
  const b = stats(simple);
  const rows: [string, string | number, string | number][] = [
    ["Steps", a.steps, b.steps],
    ["AI steps", a.ai, b.ai],
    ["Places a person steps in", a.people, b.people],
    ["Loops that repeat work", a.loops, b.loops],
    ["Main tool", full.tool, simple.tool],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
      <div>
        <h3 className="text-[15.5px] font-semibold text-ink">Why start here</h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">{r.simpler.why.text}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Move to the full design once results on your test examples are consistently good, and you can point to where the simpler
          version falls short.
        </p>
        <p className="mt-3 text-[12.5px]">
          <span className="font-mono text-muted">Rule {r.simpler.why.ruleId}</span>
          <span className="text-muted"> / </span>
          <BasisLabel basis={r.simpler.why.basis} />
        </p>
      </div>
      <table className="w-full self-start text-[14px]">
        <caption className="sr-only">Recommended design compared with the simpler start</caption>
        <thead>
          <tr className="border-b border-line text-left text-[12.5px] text-muted">
            <th scope="col" className="py-2 pr-3 font-medium">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">Recommended</th>
            <th scope="col" className="py-2 font-medium">Simpler start</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, x, y]) => (
            <tr key={label} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-normal text-muted">{label}</th>
              <td className="py-2.5 pr-3 font-medium text-ink">{x}</td>
              <td className="py-2.5 font-medium text-ink">{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Which model or method runs where, at a glance. Each chip jumps to its first step. */
function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((c) => (
        <li key={c} className="grid grid-cols-[auto_1fr] gap-3 text-[15px] leading-relaxed text-ink">
          <Check size={16} weight="bold" className="mt-1 text-accent" aria-hidden />
          {c}
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ the result

function Ready({
  answers,
  saved,
  onChange,
  onStartOver,
  view,
  onView,
  historyCount,
}: {
  answers: Answers;
  saved: boolean;
  onChange: (q: QuestionId) => void;
  onStartOver: () => void;
  view: ResultView;
  onView: (view: ResultView) => void;
  historyCount: number;
}) {
  const r = useMemo(() => recommend(answers), [answers]);
  const ruleDesign = useMemo(() => buildBlueprint(r, answers), [r, answers]);

  // With AI on, the architecture is drafted for this task by the local AI
  // server and checked against the rules; the rules' design shows until then,
  // and stays if the AI's draft can't pass the checks.
  const [design, setDesign] = useState<DesignState>({ status: "off" });
  const [showRules, setShowRules] = useState(false);
  useEffect(() => {
    setShowRules(false);
    if (!AI_ENABLED || !isComplete(answers)) return setDesign({ status: "off" });
    const known = rememberedDesign(answers);
    if (known) return setDesign({ status: "ready", ...known });
    const ctl = new AbortController();
    setDesign({ status: "loading" });
    fetchDesign(answers, ctl.signal)
      .then((d) => setDesign({ status: "ready", ...d }))
      .catch((e: Error) => !ctl.signal.aborted && setDesign({ status: "failed", note: e.message }));
    return () => ctl.abort();
  }, [answers]);
  const full = design.status === "ready" && !showRules ? design.blueprint : ruleDesign;

  // Once the design has settled, the kit's task-specific text is written for it.
  const [kitText, setKitText] = useState<KitTextState>({ status: "off" });
  useEffect(() => {
    if (!AI_ENABLED || design.status === "off" || design.status === "loading") return setKitText({ status: "off" });
    const ctl = new AbortController();
    setKitText({ status: "loading" });
    fetchKitText(answers, ctl.signal)
      .then((response) => setKitText({ status: "ready", response }))
      .catch((e: Error) => !ctl.signal.aborted && setKitText({ status: "failed", note: e.message }));
    return () => ctl.abort();
  }, [design.status, answers]); // eslint-disable-line react-hooks/exhaustive-deps -- answers change only with the design
  // The text belongs to the design it was written for; the other design keeps the template kit.
  const shownDesign = full === ruleDesign ? "rules" : "ai";
  const text = kitText.status === "ready" && kitText.response.design === shownDesign ? kitText.response.text : undefined;
  const simple = useMemo(() => buildSimplerBlueprint(r, answers), [r, answers]);
  const kit = useMemo(() => buildStarterKit(r, full, answers, text), [r, full, answers, text]);

  // The tools are built in the background as soon as the result opens: the AI
  // design, the kit's text and, when there's an n8n workflow, its tailoring.
  // Until all of them have settled the Build view stays shut; once it opens,
  // it stays open for these answers.
  const [tailorState, setTailorState] = useState<TailoringState>("idle");
  const [built, setBuilt] = useState(!AI_ENABLED);
  useEffect(() => setBuilt(!AI_ENABLED), [answers]);
  const settling = (x: { status: string }) => x.status === "off" || x.status === "loading";
  const building = AI_ENABLED && !built && (settling(design) || settling(kitText) || tailorState === "idle" || tailorState === "working");
  const buildStage = settling(design) ? "Drafting your design" : settling(kitText) ? "Writing your kit" : "Tailoring your n8n workflow";
  // A short note when the tools finish while someone is reading elsewhere.
  const sawBuilding = useRef(false);
  const [readyNote, setReadyNote] = useState(false);
  useEffect(() => {
    if (building) {
      sawBuilding.current = true;
      return;
    }
    if (built) return;
    setBuilt(true);
    if (sawBuilding.current) setReadyNote(true);
  }, [building, built]);
  useEffect(() => {
    if (!readyNote) return;
    const t = window.setTimeout(() => setReadyNote(false), 12000);
    return () => window.clearTimeout(t);
  }, [readyNote]);
  const go = (v: ResultView) => {
    if (v === "build" && building) return;
    if (v === "build") setReadyNote(false);
    onView(v);
  };
  const reduce = useReducedMotion();
  const panelId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  const [variant, setVariant] = useState<"recommended" | "simpler">("recommended");
  // The Workflow view lists the steps; the full diagram is one switch away.
  const [display, setDisplay] = useState<"list" | "diagram">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const bp = variant === "recommended" ? full : simple;
  const core = r.tools.find((t) => t.core)!;

  useEffect(() => setSelected(null), [variant, answers]);
  useEffect(() => setVariant("recommended"), [answers]);

  // Keep the chosen step in view, especially on phones where details rise as a sheet.
  useEffect(() => {
    if (!selected) return;
    const el = cardRef.current?.querySelector<HTMLElement>(`[data-node="${selected}"]`);
    if (!el) return;
    const behavior = reduce ? "auto" : "smooth";
    const box = el.getBoundingClientRect();
    if (window.innerWidth < 1024) {
      // Details rise as a sheet over the lower part of the screen.
      if (box.top < 72 || box.bottom > window.innerHeight * 0.36) el.scrollIntoView({ block: "start", behavior });
      return;
    }
    const panel = document.getElementById(panelId);
    const pb = panel?.getBoundingClientRect();
    if (pb && pb.top > window.innerHeight - 160) {
      // Bring the details into view without pushing the chosen step off the top.
      const shift = Math.min(pb.top - (window.innerHeight - 300), box.top - 80);
      if (shift > 0) window.scrollBy({ top: shift, behavior });
    } else if (box.top < 72 || box.bottom > window.innerHeight) {
      el.scrollIntoView({ block: "center", behavior });
    }
  }, [selected, reduce, panelId]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Printing opens every collapsed section, then restores them.
  useEffect(() => {
    let closed: HTMLDetailsElement[] = [];
    const before = () => {
      closed = [...document.querySelectorAll<HTMLDetailsElement>("main details:not([open])")];
      closed.forEach((d) => (d.open = true));
    };
    const after = () => closed.forEach((d) => (d.open = false));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const openAnswers = () => {
    if (view !== "solution") onView("solution");
    const d = document.getElementById("answers") as HTMLDetailsElement | null;
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    d.querySelector("summary")?.focus({ preventScroll: true });
  };

  const [walking, setWalking] = useState(false);
  const walk = () => {
    setSelected(null);
    setWalking(true);
  };
  const walkButton = useRef<HTMLButtonElement>(null);
  const endWalk = useCallback(() => {
    setWalking(false);
    requestAnimationFrame(() => walkButton.current?.focus());
  }, []);

  const cited = [
    ...new Set(
      RULES.filter((x) => r.fired.includes(x.id) && x.basis.kind === "source").flatMap((x) => (x.basis.kind === "source" ? x.basis.sources : [])),
    ),
  ] as SourceId[];
  const designCount = RULES.filter((x) => r.fired.includes(x.id) && x.basis.kind === "design").length;

  const plan = modelPlan(full);
  const SHORT_TITLE = { automation: "Plain automation, no AI", workflow: "A workflow with AI steps", agent: "One AI agent", multi: "A coordinator with specialist agents" };
  const facts: { label: string; value: string; icon: ReactNode }[] = [
    { label: "Agents", value: r.approach.agents, icon: <Robot size={15} aria-hidden /> },
    {
      label: plan.models.length > 1 ? "Models" : plan.models.length ? "Model" : "Method",
      value: plan.models.length
        ? plan.models.map((g) => g.engine.short).join(" + ")
        : `No AI: ${(plan.methods.find((g) => g.engine.short !== "Scripted action") ?? plan.methods[0])?.engine.short ?? "fixed rules"}`,
      icon: <Cpu size={15} aria-hidden />,
    },
    { label: "Main tool", value: TOOLS[core.tool].name, icon: <Toolbox size={15} aria-hidden /> },
    { label: "Autonomy", value: `Level ${r.autonomy.level}: ${AUTONOMY[r.autonomy.level].name}`, icon: <UserCheck size={15} aria-hidden /> },
    { label: "Runs on", value: r.hosting.title, icon: <Cloud size={15} aria-hidden /> },
  ];

  // ---------------------------------------------------------------- shared pieces of the three views
  const pad = (n: number) => String(n).padStart(2, "0");
  const kindOf = (n: BNode, b: Blueprint) => {
    const parallel = Object.entries(b.captions).some(([st, t]) => Number(st) === n.stage && /same time/i.test(t));
    const base =
      n.kind === "start" ? "Trigger" : n.kind === "human" ? "Person" : n.kind === "end" ? "Finish" : n.kind === "tool" ? "Your tools" : n.engine?.kind === "model" ? "AI model" : n.engine?.short ?? KIND_LABEL[n.kind];
    return parallel ? `${base} · Parallel` : base;
  };
  const first = full.nodes[0];
  const last = full.nodes[full.nodes.length - 1];
  const lead = leadStep(full);
  const aiSteps = full.nodes.filter((n) => n !== lead && n.engine?.kind === "model");
  const priorities = (aiSteps.length >= 2 ? aiSteps : keySteps(full, lead)).slice(0, 3).map((n) => n.name);
  const level = r.autonomy.level;
  const control = level === 1 ? "You do the work." : level === 2 ? "You're in control." : level === 3 ? "You handle the risky ones." : "It runs within guardrails.";

  // The work in three phases: getting ready, the AI (or rule) work, and checking and handing over.
  const phases = (() => {
    const isWork = (n: BNode) => n.engine?.kind === "model" || n.kind === "decision";
    const a = full.nodes.findIndex(isWork);
    const b = full.nodes.length - 1 - [...full.nodes].reverse().findIndex(isWork);
    const groups =
      a === -1
        ? [full.nodes.slice(0, 1), full.nodes.slice(1, -1), full.nodes.slice(-1)]
        : [full.nodes.slice(0, a), full.nodes.slice(a, b + 1), full.nodes.slice(b + 1)];
    const titles = ["Getting ready", a === -1 ? "The rules at work" : "Doing the work", "Checking and handing over"];
    const sentence = (ns: BNode[]) => ns.map((n, i) => (i === 0 ? n.name : n.name.charAt(0).toLowerCase() + n.name.slice(1))).join(", ") + ".";
    return groups.map((ns, i) => ({ title: titles[i], text: ns.length ? sentence(ns) : "" })).filter((x) => x.text);
  })();

  const steps = (ns: number[]) => {
    // "steps 4–8", "step 2", "steps 2, 5"
    const runs: string[] = [];
    for (let i = 0; i < ns.length; i++) {
      let j = i;
      while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
      runs.push(j > i + 1 ? `${ns[i]}–${ns[j]}` : j === i + 1 ? `${ns[i]}, ${ns[j]}` : `${ns[i]}`);
      i = j;
    }
    return `${ns.length > 1 ? "steps" : "step"} ${runs.join(", ")}`;
  };
  const bpPlan = modelPlan(bp);
  const selNode = selected ? bp.nodes.find((n) => n.id === selected) : undefined;
  const selIndex = selNode ? bp.nodes.indexOf(selNode) : -1;

  // ---------------------------------------------------------------- Solution
  const solutionView = (
    <>
      <section aria-labelledby="solution-title">
        <div className="section-kicker studio-caption">
          <span className="status-dot" aria-hidden />
          Your recommended solution
          <span className="kicker-line" aria-hidden />
        </div>
        <h1 id="solution-title">
          {SHORT_TITLE[r.approach.id]}
          <span className="title-period">.</span>
        </h1>
        {/* The key facts, as a byline under the title: each named on hover and for screen readers. */}
        <div className="studio-byline">
          <dl aria-label="Key facts">
            {facts.map((f) => (
              <div key={f.label} title={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  {f.icon}
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="studio-intro">{full.summary || r.approach.summary}</p>
        {AI_ENABLED && (
          <div className="-mt-4 mb-8 max-w-[70ch]">
            <DesignNote design={design} showRules={showRules} onShowRules={setShowRules} bare />
          </div>
        )}
        <div className="architecture-grid">
          <figure>
            <BuildInvite kit={kit} href={href({ name: "result", code: resultCode(answers), view: "build" })} onOpen={() => go("build")} building={building} />
            <figcaption>
              <span>01 — BUILD IT</span>
              <span>Your starter kit, ready to hand over.</span>
            </figcaption>
          </figure>
          <div className="priorities">
            <h3>Core priorities</h3>
            <ul>
              {priorities.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="approval-note">
              <Check size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
              <p>
                {control}
                <span>{AUTONOMY[level].plain}</span>
              </p>
            </div>
            <button type="button" className="studio-quiet no-print" onClick={() => onView("workflow")}>
              Explore the workflow
              <ArrowUpRight size={16} aria-hidden />
            </button>
          </div>
        </div>
        <div className="studio-actions no-print">
          <Actions r={r} bp={full} answers={answers} onEdit={openAnswers} />
          {saved && (
            <a href={href({ name: "history" })} className="inline-flex items-center gap-1 self-center text-[13.5px] text-accent underline-offset-4 hover:underline">
              <Check size={14} weight="bold" aria-hidden />
              Saved to history
            </a>
          )}
        </div>
      </section>

      <section className="studio-section" aria-labelledby="operates-title">
        <div className="section-kicker studio-caption">02 — Behind the solution</div>
        <div className="section-heading">
          <div className="min-w-0">
            <h2 id="operates-title">How the system operates</h2>
            <p>
              A closer look at the path from {first.name.charAt(0).toLowerCase() + first.name.slice(1)} to {last.name.charAt(0).toLowerCase() + last.name.slice(1)}.
            </p>
          </div>
          <button type="button" className="studio-quiet no-print" onClick={() => onView("workflow")}>
            View workflow
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
        <ol className="summary-timeline">
          {phases.map((ph) => (
            <li key={ph.title}>
              <span className="timeline-marker" aria-hidden />
              <h3>{ph.title}</h3>
              <p>{ph.text}</p>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="studio-quiet no-print mt-2"
          onClick={() => {
            setVariant("simpler");
            onView("workflow");
          }}
        >
          <GitBranch size={16} aria-hidden />
          Compare with a simpler start
          <ArrowRight size={16} aria-hidden />
        </button>
      </section>

      {/* -------------------------------------------------- the detail, on demand */}
      <section aria-labelledby="detail" className="studio-section">
        <div className="section-kicker studio-caption">03 — Everything behind it</div>
        <h2 id="detail">The details</h2>
        <div className="mt-4 grid gap-3">
          <Disclosure id="first-steps" title="Your first steps" meta="Three things to do this week.">
            <ol className="grid gap-4 md:grid-cols-3">
              {r.firstSteps.map((s, i) => (
                <li key={s} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-accent-ink">
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-ink">{s}</p>
                </li>
              ))}
            </ol>
          </Disclosure>
          <Disclosure id="why" title="Why this design" meta={`${r.approach.agents}. ${TOPOLOGIES[r.topology.primary].name}.`}>
            <h3 className="text-[15px] font-semibold text-ink">
              Do you need an <Term id="agent">agent</Term>?
            </h3>
            <div className="mt-4">
              <Ladder current={r.approach.id} compact />
            </div>
            <WhyList items={r.approach.why} className="mt-6" />
            <h3 className="mt-8 text-[15px] font-semibold text-ink">The shape: {TOPOLOGIES[r.topology.primary].name}</h3>
            <p className="mt-1.5 max-w-[65ch] text-[14.5px] leading-relaxed text-muted">{TOPOLOGIES[r.topology.primary].plain}</p>
            {r.topology.addOns.length > 0 && (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {r.topology.addOns.map((t) => (
                  <li key={t} className="rounded-2xl bg-surface-2 p-4">
                    <p className="text-[14.5px] font-semibold text-ink">Add when testing shows it helps: {TOPOLOGIES[t].name}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">{TOPOLOGIES[t].plain}</p>
                  </li>
                ))}
              </ul>
            )}
            <WhyList items={r.topology.why} className="mt-5" />
          </Disclosure>

          <Disclosure id="tools" title="Tools and where it runs" meta={`${TOOLS[core.tool].name} plus ${r.tools.length - 1} supporting pieces. ${r.hosting.title}.`}>
            <p className="max-w-[65ch] text-[14px] text-muted">Product names are examples, current as of {LAST_REVIEWED}.</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {r.tools.map((t) => (
                <li key={t.tool} className={`rounded-2xl border p-5 ${t.core ? "border-accent" : "border-line"}`}>
                  <p className="text-[12.5px] font-medium text-muted">{t.core ? "Main tool" : "Supporting piece"}</p>
                  <h3 className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[16px] font-semibold text-ink">
                    {TOOLS[t.tool].name}
                    {TOOLS[t.tool].link && t.core && (
                      <a href={TOOLS[t.tool].link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-normal text-muted hover:text-ink">
                        Website <ArrowSquareOut size={12} aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{TOOLS[t.tool].plain}</p>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink">
                    <span className="font-semibold">In your setup: </span>
                    {t.role}
                  </p>
                  <WhyList items={t.why} className="mt-3" />
                </li>
              ))}
            </ul>
            {r.hybrid.length > 0 && (
              <div className="mt-4 rounded-2xl bg-surface-2 p-5">
                <h3 className="text-[15px] font-semibold text-ink">Why this counts as a hybrid</h3>
                <ul className="mt-2 space-y-2">
                  {r.hybrid.map((h) => (
                    <li key={h.why.ruleId} className="text-[14.5px] leading-relaxed text-ink">
                      {h.text} <span className="text-muted">{h.why.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-[15px] font-semibold text-ink">Where it runs: {r.hosting.title}</h3>
              <p className="mt-1.5 max-w-[65ch] text-[14.5px] leading-relaxed text-muted">{r.hosting.body}</p>
              <WhyList items={[r.hosting.why]} className="mt-4" />
            </div>
          </Disclosure>

          <Disclosure id="autonomy" title="Autonomy and safeguards" meta={`Level ${r.autonomy.level} of 4: ${AUTONOMY[r.autonomy.level].name}.`}>
            <AutonomyScale level={r.autonomy.level} />
            <WhyList items={r.autonomy.why} className="mt-6" />
            <div className="mt-7 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">When a person steps in</h3>
                <div className="mt-3">
                  <CheckList items={r.autonomy.checkpoints} />
                </div>
              </div>
              {r.autonomy.guardrails.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">
                    <Term id="guardrail">Guardrails</Term> to layer in
                  </h3>
                  <div className="mt-3">
                    <CheckList items={r.autonomy.guardrails} />
                  </div>
                  <p className="mt-3 text-[13px]">
                    <BasisLabel basis={{ kind: "source", sources: ["openai"] }} />
                  </p>
                </div>
              )}
            </div>
          </Disclosure>

          <Disclosure
            id="models"
            title="Model guidance"
            meta={r.models.needed ? "The pick for each step, what to look for, and how to test before committing." : "No AI model needed. The methods each step uses."}
          >
            <h3 className="text-[15px] font-semibold text-ink">{r.models.needed ? "The pick for each step" : "The method for each step"}</h3>
            <ul className="mt-3 mb-7 divide-y divide-line border-y border-line">
              {full.nodes
                .filter((n) => n.engine && n.kind !== "start")
                .map((n) => (
                  <li key={n.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,12rem)_1fr] sm:gap-5">
                    <span className="text-[14.5px] text-ink">
                      <span className="font-mono text-[12.5px] text-muted">{n.step}</span> {n.name}
                    </span>
                    <span className="text-[14.5px] font-semibold text-ink">
                      {n.engine!.kind === "model" ? n.engine!.name.split(",")[0] : n.engine!.name}
                    </span>
                    <span className="text-[14px] leading-relaxed text-muted">{n.engine!.kind === "model" ? n.engine!.why : n.engine!.how}</span>
                  </li>
                ))}
            </ul>
            {!r.models.needed ? (
              <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink">
                Your task follows fixed rules, so every step can be written as if-this-then-that. That keeps it cheaper, faster and fully
                predictable. <span className="font-mono text-[12px] text-muted">Rule M1</span>
              </p>
            ) : (
              <>
                <ul className="grid gap-3 md:grid-cols-2">
                  {r.models.capabilities.map((c) => (
                    <li key={c.title} className="rounded-2xl border border-line p-4">
                      <h3 className="text-[15px] font-semibold text-ink">{c.title}</h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-muted">{c.body}</p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{c.why.text}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">How to choose: test, then step down</h3>
                    <ol className="mt-3 space-y-2.5">
                      {r.models.process.map((p, i) => (
                        <li key={p} className="grid grid-cols-[1.5rem_1fr] gap-2 text-[14.5px] leading-relaxed text-ink">
                          <span className="font-mono text-[13px] leading-[1.6rem] text-accent">{i + 1}</span>
                          {p}
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 text-[13px]">
                      <span className="font-mono text-[12px] text-muted">Rule M10</span>
                      <span className="text-muted"> / </span>
                      <BasisLabel basis={{ kind: "source", sources: ["openai", "notes"] }} />
                    </p>
                  </div>
                  <aside className="h-fit rounded-2xl bg-surface-2 p-5">
                    <h3 className="text-[13.5px] font-semibold text-ink">Examples that may change</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{r.models.examples}</p>
                  </aside>
                </div>
              </>
            )}
          </Disclosure>

          <Disclosure id="gotchas" title="Gotchas" meta={`${r.gotchas.length} traps most likely to catch this setup, most important first.`}>
            <ul className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {r.gotchas.map((g) => (
                <li key={g.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <Warning size={19} className="mt-0.5 text-ink" aria-hidden />
                  <div>
                    <h3 className="text-[15.5px] font-semibold leading-snug text-ink">{g.title}</h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{g.body}</p>
                    <p className="mt-1.5 text-[12.5px]">
                      <span className="font-mono text-muted">Rule {g.id}</span>
                      <span className="text-muted"> / </span>
                      <BasisLabel basis={g.basis} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Disclosure>

          <Disclosure
            id="sources"
            title="Sources and rules behind this result"
            meta={`${r.fired.length} of ${RULES.length} rules applied. ${cited.length} sources cited.`}
          >
            <p className="max-w-[65ch] text-[14.5px] leading-relaxed text-ink">
              {full === ruleDesign
                ? "No AI wrote this design. Your answers were checked against every published rule; the same answers always give the same design."
                : "This design was drafted by AI for your task and then checked against every published rule below; anything that broke a rule was sent back or replaced by the rules' design."} {designCount} of the rules applied are design choices made for this guide rather than findings from a source.
            </p>
            <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-ink">{r.fired.join(", ")}</p>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {cited.map((id) => (
                <li key={id} className="py-3 text-[14px] leading-relaxed">
                  {SOURCES[id].url ? (
                    <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-4 hover:underline">
                      {SOURCES[id].citation}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="font-medium text-ink">{SOURCES[id].citation}</span>
                  )}
                  <span className="block text-muted">{SOURCES[id].usedFor}</span>
                </li>
              ))}
            </ul>
            <a href={href({ name: "how" })} className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-accent underline-offset-4 hover:underline">
              Read every rule and its source
              <ArrowRight size={15} weight="bold" aria-hidden />
            </a>
          </Disclosure>

          <Disclosure id="answers" title="Your answers" meta={`${activeQuestions(answers).length + (answers.details?.length ?? 0)} answers. Change any of them and the design updates.`}>
            <AnswerList answers={answers} onChange={onChange} />
            <div className="no-print mt-6 flex flex-wrap items-center gap-2">
              {confirming ? (
                <>
                  <button type="button" className={btn.danger} onClick={onStartOver}>
                    Clear my answers
                  </button>
                  <button type="button" className={btn.quiet} onClick={() => setConfirming(false)}>
                    Keep them
                  </button>
                </>
              ) : (
                <button type="button" className={btn.small} onClick={() => setConfirming(true)}>
                  <ArrowCounterClockwise size={16} aria-hidden />
                  Start over with a new task
                </button>
              )}
              <p className="w-full text-[13px] text-muted">A shared link holds your answers, including your task description.</p>
            </div>
          </Disclosure>
        </div>
      </section>
    </>
  );

  // ---------------------------------------------------------------- Workflow
  const glance = (
    <>
      <span className="section-kicker studio-caption">The design at a glance</span>
      <h2>{r.approach.title}</h2>
      <p>{r.approach.summary}</p>
      <div className="workflow-model-note">
        <h3>{bpPlan.models.length ? "Model allocation" : "Methods"}</h3>
        <p>
          {[...bpPlan.models, ...bpPlan.methods].map((g) => (
            <span key={g.engine.short} className="block">
              {g.engine.kind === "model" ? g.engine.name.split(",")[0] : g.engine.name}: {steps(g.steps)}.
            </span>
          ))}
        </p>
        {bpPlan.models.length > 0 && <p>Prototype on the most capable model, then step each part down once it matches on your test examples. Names as of {LAST_REVIEWED}.</p>}
      </div>
    </>
  );

  const stepDetail = selNode && (
    <>
      <span className="section-kicker studio-caption">
        Step {selNode.step} of {bp.nodes.length}
      </span>
      <h2>{selNode.name}</h2>
      <span className="step-type">{kindOf(selNode, bp)}</span>
      {selNode.engine?.kind === "model" && (
        <div className="text-[14.5px] leading-relaxed">
          <p className="font-medium text-ink">{selNode.engine.name.split(",")[0]}</p>
          <p className="mt-1 text-muted">{selNode.engine.why}</p>
          <ModelGuidance engine={selNode.engine} className="mt-2 text-[14px]" />
        </div>
      )}
      {selNode.engine?.kind === "algorithm" && selNode.kind !== "start" && <p className="text-[15px] leading-relaxed text-muted">{selNode.engine.how}</p>}
      <dl className="step-detail">
        <dt>What happens</dt>
        <dd>{selNode.what}</dd>
        <dt>Why it's here</dt>
        <dd>{selNode.why}</dd>
        <dt>What it passes on</dt>
        <dd>{selNode.passes}</dd>
      </dl>
      {selNode.gates.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {selNode.gates.map((g) => (
            <GateBadge key={g.text} kind={g.kind} text={g.text} />
          ))}
        </div>
      )}
      {AI_ENABLED && selNode.kb && selNode.kb.length > 0 && (
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          From the knowledge base: {selNode.kb.map((c) => `${c.id} ${c.title}`).join("; ")}
        </p>
      )}
      <div className="walkthrough-controls no-print">
        <button type="button" className="studio-outline" aria-label="Previous step" disabled={selIndex <= 0} onClick={() => setSelected(bp.nodes[Math.max(0, selIndex - 1)].id)}>
          <ArrowLeft size={18} aria-hidden />
        </button>
        <button type="button" className="studio-btn" onClick={() => setSelected(selIndex < bp.nodes.length - 1 ? bp.nodes[selIndex + 1].id : null)}>
          {selIndex === bp.nodes.length - 1 ? "Finish" : "Next step"}
          {selIndex === bp.nodes.length - 1 ? <Check size={17} weight="bold" aria-hidden /> : <ArrowRight size={17} aria-hidden />}
        </button>
      </div>
    </>
  );

  const workflowView = (
    <section aria-labelledby="workflow-title">
      <div className="section-kicker studio-caption">Behind the solution</div>
      <div className="section-heading">
        <div className="min-w-0">
          <h1 id="workflow-title">
            How it works<span className="title-period">.</span>
          </h1>
          <p>
            The workflow, from {bp.nodes[0].name.charAt(0).toLowerCase() + bp.nodes[0].name.slice(1)} to{" "}
            {bp.nodes[bp.nodes.length - 1].name.charAt(0).toLowerCase() + bp.nodes[bp.nodes.length - 1].name.slice(1)}.
          </p>
        </div>
        <button ref={walkButton} type="button" className="studio-btn no-print" onClick={walk}>
          <Play size={17} weight="fill" aria-hidden />
          Walk me through it
        </button>
      </div>
      <div className="workflow-tools no-print">
        <div role="group" aria-label="Which design to show" className="view-switch">
          {(["recommended", "simpler"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={variant === v} onClick={() => setVariant(v)}>
              {v === "recommended" ? "Recommended" : "Simpler start"}
            </button>
          ))}
        </div>
        <div role="group" aria-label="How to show it" className="view-switch">
          {(["list", "diagram"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={display === v} onClick={() => setDisplay(v)}>
              {v === "list" ? "List" : "Diagram"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="studio-quiet workflow-export"
          title="A draw.io file (XML): both designs as editable diagrams, each step carrying its full details"
          onClick={() => {
            const xml = drawioXml({ task: r.task, design: full, source: full === ruleDesign ? "rules" : "ai", simpler: simple });
            const url = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${slugify(r.task) || "blueprint"}.drawio`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <FileCode size={16} aria-hidden />
          Export to draw.io
        </button>
      </div>
      {AI_ENABLED && variant === "recommended" && (
        <div className="mb-6 max-w-[70ch]">
          <DesignNote design={design} showRules={showRules} onShowRules={setShowRules} bare />
        </div>
      )}
      {variant === "simpler" && <p className="mb-5 text-[15.5px] font-medium text-ink">{simple.title}</p>}
      {display === "list" ? (
        <div className="workflow-layout">
          <ol className="full-timeline" aria-label="Steps">
            {bp.nodes.map((n) => (
              <li key={n.id}>
                <button type="button" className="workflow-step" aria-pressed={selected === n.id} onClick={() => setSelected(selected === n.id ? null : n.id)}>
                  <span className="step-number">{pad(n.step)}</span>
                  <span className="min-w-0">
                    <strong>{n.name}</strong>
                    <small>{kindOf(n, bp)}</small>
                  </span>
                  <ArrowRight size={18} aria-hidden className="step-arrow" />
                </button>
              </li>
            ))}
          </ol>
          <aside className="workflow-explanation" aria-live="polite">
            {stepDetail || (variant === "simpler" ? <Compare r={r} full={full} simple={simple} /> : glance)}
          </aside>
        </div>
      ) : (
        <div ref={cardRef} className="workflow-canvas">
          <div className="px-3 sm:px-6">
            <DiagramBoundary
              resetKey={`${bp.variant}-${bp.nodes.map((n) => n.id).join()}`}
              fallback={<StepList bp={bp} selected={selected} onSelect={setSelected} panelId={panelId} />}
            >
              <ArchitectureMap bp={bp} selected={selected} onSelect={setSelected} panelId={panelId} />
            </DiagramBoundary>
          </div>
          <Legend bp={bp} />
          <StepPanel
            bp={bp}
            selected={selected}
            onSelect={setSelected}
            panelId={panelId}
            idle={variant === "simpler" ? <Compare r={r} full={full} simple={simple} /> : <p className="text-[14px] text-muted">Select a step for details.</p>}
          />
        </div>
      )}
    </section>
  );

  return (
    <StudioShell view={view} onView={go} historyCount={historyCount} building={building}>
      {walking && <Walkthrough bp={bp} onClose={endWalk} />}
      <main id="main" className={`studio-page${view === "workflow" ? " is-wide" : ""}`}>
        {/* A new view swaps in at once and fades up; it never waits on the old one to leave. */}
        <m.div key={view} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {view === "solution" && solutionView}
          {view === "workflow" && workflowView}
        </m.div>
        {view === "build" && building && (
          <section className="build-pending" role="status" aria-live="polite">
            <div className="section-kicker studio-caption">Your build brief</div>
            <h1>
              Building your tools<span className="title-period">.</span>
            </h1>
            <p className="studio-intro">
              The design, your starter kit and each tool are being made for your task. It takes a few minutes, and this page opens the moment they're ready.
            </p>
            <p className="flex items-center gap-2 text-[14.5px] font-medium text-accent">
              <CircleNotch size={17} aria-hidden className={reduce ? "" : "animate-spin"} />
              {buildStage}
            </p>
            <button type="button" className="studio-quiet mt-8" onClick={() => go("solution")}>
              Explore your solution meanwhile
              <ArrowRight size={16} aria-hidden />
            </button>
          </section>
        )}
        {/* The kit stays mounted on every view, so a tailoring request or open guide survives switching views. */}
        <div hidden={view !== "build" || building}>
          <StarterKit
            kit={kit}
            slug={slugify(r.task)}
            answers={answers}
            studio
            writing={!AI_ENABLED ? undefined : design.status === "loading" || kitText.status === "loading" ? "loading" : text ? "ready" : "template"}
            autoTailor={building}
            onTailoring={setTailorState}
          />
        </div>
        {readyNote && view !== "build" && (
          <div className="build-ready-toast no-print" role="status">
            <Check size={16} weight="bold" aria-hidden className="text-accent" />
            Your tools are ready.
            <button type="button" className="studio-btn" onClick={() => go("build")}>
              Open Build
              <ArrowRight size={15} aria-hidden />
            </button>
            <button type="button" className="studio-quiet" aria-label="Dismiss" onClick={() => setReadyNote(false)}>
              <X size={15} aria-hidden />
            </button>
          </div>
        )}
        <footer className="studio-footer no-print">
          <span>BLUEPRINT STUDIO</span>
          <span>A solution shaped around your request.</span>
        </footer>
      </main>
    </StudioShell>
  );
}
