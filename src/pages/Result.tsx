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
  ListNumbers,
  PencilSimple,
  Robot,
  Toolbox,
  UserCheck,
  PlayCircle,
  Printer,
  ShareNetwork,
  TreeStructure,
  Warning,
} from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArchitectureMap, GateBadge, KIND_ICON } from "../components/ArchitectureMap";
import { DiagramBoundary } from "../components/DiagramBoundary";
import { Walkthrough } from "../components/Walkthrough";
import { StarterKit } from "../components/StarterKit";
import { buildStarterKit, slugify } from "../lib/starter";
import { AutonomyScale, Ladder } from "../components/Scales";
import { StepPanel } from "../components/StepPanel";
import { BasisLabel, Term, WhyList, btn } from "../components/ui";
import {
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
import { href } from "../lib/router";
import { RULES, recommend, type Recommendation } from "../lib/rules";
import { resultAsText, resultUrl } from "../lib/share";
import { SOURCES, type SourceId } from "../lib/sources";

type Props = {
  answers: Answers;
  /** Whether this result is in the browser's saved history. */
  saved?: boolean;
  onChange: (q: QuestionId) => void;
  onStartOver: () => void;
  invalidLink: boolean;
};

export function Result({ answers, saved = false, onChange, onStartOver, invalidLink }: Props) {
  if (!isComplete(answers)) return <NotReady answers={answers} invalidLink={invalidLink} onStartOver={onStartOver} />;
  return <Ready answers={answers} saved={saved} onChange={onChange} onStartOver={onStartOver} />;
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
    </dl>
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
  const swatch: Record<NodeKind, string> = {
    ai: "bg-accent-soft border border-accent/55",
    fixed: "bg-surface border border-line-strong/70",
    decision: "bg-surface border border-line-strong",
    human: "bg-surface border-[1.5px] border-dashed border-ink/60",
    tool: "bg-surface-2 border border-line-strong/70",
    start: "bg-surface-2 border border-line-strong/50",
    end: "bg-surface-2 border border-line-strong/50",
  };
  return (
    <ul aria-label="Key" className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-4 text-[12.5px] text-muted sm:px-6">
      {order
        .filter((k) => kinds.includes(k) && k !== "end")
        .map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={`inline-flex h-4 w-6 items-center justify-center rounded-[5px] ${swatch[k]}`}>
                <Icon size={10} />
              </span>
              {k === "start" ? "Start or finish" : KIND_LABEL[k]}
            </li>
          );
        })}
      {gates.has("human") && (
        <li className="inline-flex items-center gap-1.5">
          <GateBadge kind="human" text="A person steps in" compact /> A person steps in
        </li>
      )}
      {gates.has("stop") && (
        <li className="inline-flex items-center gap-1.5">
          <GateBadge kind="stop" text="Stop rule" compact /> Stop rule
        </li>
      )}
      {loops && (
        <li className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="22" height="6">
            <line x1="1" y1="3" x2="21" y2="3" className="stroke-line-strong" strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round" />
          </svg>
          Loops back
        </li>
      )}
      {assigns && (
        <li className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="22" height="6">
            <line x1="1" y1="3" x2="21" y2="3" className="stroke-line-strong" strokeWidth="1.5" strokeDasharray="5 4" />
          </svg>
          Hands out work
        </li>
      )}
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
function ModelPlan({ bp, onSelect }: { bp: Blueprint; onSelect: (id: string) => void }) {
  const { models, methods } = modelPlan(bp);
  const open = models.some((g) => g.engine.kind === "model" && g.engine.model.startsWith("open"));
  const steps = (n: number[]) => `${n.length > 1 ? "Steps" : "Step"} ${n.join(", ")}`;
  return (
    <div className="mx-3 mb-4 grid gap-x-5 gap-y-2.5 rounded-2xl bg-surface-2 px-4 py-3.5 sm:mx-5 md:grid-cols-[auto_1fr]">
      <p className="flex items-center gap-1.5 pt-1 text-[13px] font-semibold text-ink">
        <Cpu size={15} aria-hidden className="text-accent" />
        {models.length ? "Models" : "No AI model"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {models.map((g) => (
          <button
            key={g.engine.short}
            type="button"
            onClick={() => onSelect(g.first)}
            className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13.5px] ring-1 ring-accent/50 transition-colors hover:bg-accent-soft"
          >
            <span className="font-semibold text-ink">{g.engine.kind === "model" ? g.engine.name.split(",")[0] : g.engine.name}</span>
            <span className="text-muted">{steps(g.steps)}</span>
          </button>
        ))}
        {methods.map((g) => (
          <button
            key={g.engine.short}
            type="button"
            onClick={() => onSelect(g.first)}
            className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13.5px] ring-1 ring-line-strong/50 transition-colors hover:bg-surface-2"
          >
            <FunctionIcon size={13} aria-hidden className="text-muted" />
            <span className="font-medium text-ink">{g.engine.name}</span>
            <span className="text-muted">{steps(g.steps)}</span>
          </button>
        ))}
        {models.length > 0 && (
          <span className="text-[12.5px] text-muted">
            Prototype on {open ? "the largest open-weight model" : "Claude Opus 5.5"}, then step down. Names as of {LAST_REVIEWED}.
          </span>
        )}
      </div>
    </div>
  );
}

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
}: {
  answers: Answers;
  saved: boolean;
  onChange: (q: QuestionId) => void;
  onStartOver: () => void;
}) {
  const r = useMemo(() => recommend(answers), [answers]);
  const full = useMemo(() => buildBlueprint(r, answers), [r, answers]);
  const simple = useMemo(() => buildSimplerBlueprint(r, answers), [r, answers]);
  const kit = useMemo(() => buildStarterKit(r, full, answers), [r, full, answers]);
  const reduce = useReducedMotion();
  const panelId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const [variant, setVariant] = useState<"recommended" | "simpler">("recommended");
  const [view, setView] = useState<"diagram" | "list">("diagram");
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
  const facts: { label: string; value: string; icon: ReactNode; strong?: boolean }[] = [
    { label: "Agents", value: r.approach.agents, icon: <Robot size={15} aria-hidden /> },
    {
      label: plan.models.length > 1 ? "Models" : plan.models.length ? "Model" : "Method",
      value: plan.models.length
        ? plan.models.map((g) => g.engine.short).join(" + ")
        : `No AI: ${(plan.methods.find((g) => g.engine.short !== "Scripted action") ?? plan.methods[0])?.engine.short ?? "fixed rules"}`,
      icon: <Cpu size={15} aria-hidden />,
      strong: true,
    },
    { label: "Main tool", value: TOOLS[core.tool].name, icon: <Toolbox size={15} aria-hidden /> },
    { label: "Autonomy", value: `Level ${r.autonomy.level}: ${AUTONOMY[r.autonomy.level].name}`, icon: <UserCheck size={15} aria-hidden /> },
    { label: "Runs on", value: r.hosting.title, icon: <Cloud size={15} aria-hidden /> },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-7 sm:px-6 sm:pt-10">
      {walking && <Walkthrough bp={bp} onClose={endWalk} />}
      {/* -------------------------------------------------- header: only what's needed */}
      <m.header
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
              {r.task && (
                <span>
                  Recommended setup for <span className="text-ink">{r.task}</span>
                </span>
              )}
              {saved && (
                <a href={href({ name: "history" })} className="no-print inline-flex items-center gap-1 text-[13px] text-accent underline-offset-4 hover:underline">
                  <Check size={13} weight="bold" aria-hidden />
                  Saved to history
                </a>
              )}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.125rem]">
              {SHORT_TITLE[r.approach.id]}
            </h1>
          </div>
          <Actions r={r} bp={full} answers={answers} onEdit={openAnswers} />
        </div>
        <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-3 lg:grid-cols-5">
          {facts.map((f) => (
            <div key={f.label} className="-ml-px -mt-px border-l border-t border-line px-4 py-3">
              <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
                {f.icon}
                {f.label}
              </dt>
              <dd className={`mt-0.5 text-[14.5px] font-semibold leading-snug ${f.strong ? "text-accent" : "text-ink"}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </m.header>

      {/* -------------------------------------------------- the architecture */}
      <m.section
        ref={cardRef}
        aria-labelledby="architecture-title"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="shadow-soft mt-7 rounded-2xl border border-line bg-surface"
      >
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div role="group" aria-label="Which design to show" className="inline-flex rounded-full bg-surface-2 p-1">
            {(["recommended", "simpler"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={variant === v}
                onClick={() => setVariant(v)}
                className={`rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                  variant === v ? "bg-surface text-ink shadow-[0_1px_2px_hsl(var(--shadow)/0.12)] ring-1 ring-line" : "text-muted hover:text-ink"
                }`}
              >
                {v === "recommended" ? "Recommended" : "Simpler start"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button ref={walkButton} type="button" onClick={walk} className={btn.primarySmall}>
              <PlayCircle size={17} aria-hidden />
              Walk me through it
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView(view === "list" ? "diagram" : "list")}
              className={btn.quiet}
            >
              {view === "list" ? <TreeStructure size={16} aria-hidden /> : <ListNumbers size={16} aria-hidden />}
              {view === "list" ? "Show diagram" : "Show as list"}
            </button>
          </div>
        </div>

        <h2 id="architecture-title" className={variant === "simpler" ? "px-4 pt-4 text-[14.5px] font-semibold text-ink sm:px-6" : "sr-only"}>
          {variant === "recommended" ? "How it works" : `Simpler start: ${simple.title}`}
        </h2>

        <div className="px-3 sm:px-5">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={`${variant}-${view}`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {view === "diagram" ? (
                <DiagramBoundary
                  resetKey={`${bp.variant}-${bp.nodes.map((n) => n.id).join()}`}
                  fallback={<StepList bp={bp} selected={selected} onSelect={setSelected} panelId={panelId} />}
                >
                  <ArchitectureMap bp={bp} selected={selected} onSelect={setSelected} panelId={panelId} />
                </DiagramBoundary>
              ) : (
                <StepList bp={bp} selected={selected} onSelect={setSelected} panelId={panelId} />
              )}
            </m.div>
          </AnimatePresence>
        </div>
        <ModelPlan bp={bp} onSelect={setSelected} />
        {view === "diagram" && <Legend bp={bp} />}

        <StepPanel
          bp={bp}
          selected={selected}
          onSelect={setSelected}
          panelId={panelId}
          idle={
            variant === "simpler" ? (
              <Compare r={r} full={full} simple={simple} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[14px] text-muted">Select a step for details.</p>
                <button type="button" onClick={() => setVariant("simpler")} className={`${btn.small} no-print`}>
                  Compare with a simpler start
                  <ArrowRight size={15} weight="bold" aria-hidden />
                </button>
              </div>
            )
          }
        />
      </m.section>

      {/* -------------------------------------------------- starter kit for an AI coding assistant */}
      <StarterKit kit={kit} slug={slugify(r.task)} answers={answers} />

      {/* -------------------------------------------------- the detail, on demand */}
      <section aria-labelledby="detail" className="mt-12">
        <h2 id="detail" className="text-[1.25rem] font-semibold tracking-tight text-ink">
          Details
        </h2>
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
              No AI wrote this result. Your answers were checked against every published rule; the same answers always give the same
              design. {designCount} of the rules applied are design choices made for this guide rather than findings from a source.
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

          <Disclosure id="answers" title="Your answers" meta={`${activeQuestions(answers).length} answers. Change any of them and the design updates.`}>
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
    </main>
  );
}
