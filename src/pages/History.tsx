import { ArrowRight, ClockCounterClockwise, Cpu, MagnifyingGlass, Trash, TreeStructure, UserCheck, Wrench } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { btn } from "../components/ui";
import { AI_ENABLED } from "../lib/features";
import { AUTONOMY, type AutonomyLevel } from "../lib/catalog";
import { type HistoryEntry, clearHistory, removeHistory, restoreHistory } from "../lib/history";
import { type SavedTailoring, clearTailored, putTailored, takeTailored } from "../lib/tailored";
import { type SavedProcess } from "../lib/process";
import { href } from "../lib/router";

export const SHORT_TITLE: Record<HistoryEntry["approach"], string> = {
  automation: "Plain automation, no AI",
  workflow: "A workflow with AI steps",
  agent: "One AI agent",
  multi: "A coordinator with specialist agents",
};

function when(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" })}, ${time}`;
}

export function History({
  entries,
  currentId,
  onChange,
  onOpen,
  onStart,
  systems = [],
  onRemoveSystem,
  onClearSystems,
}: {
  entries: HistoryEntry[];
  /** Saved processes: several jobs designed together. */
  systems?: SavedProcess[];
  onRemoveSystem?: (id: string) => void;
  onClearSystems?: () => void;
  currentId: string;
  onChange: (next: HistoryEntry[]) => void;
  onOpen: (entry: HistoryEntry) => void;
  onStart: () => void;
}) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState<{ entry: HistoryEntry; index: number; tailored?: SavedTailoring } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => `${e.task} ${SHORT_TITLE[e.approach]} ${e.models} ${e.tool}`.toLowerCase().includes(q));
  }, [entries, query]);

  const remove = (e: HistoryEntry) => {
    const next = removeHistory(e.id);
    // Its AI-tailored workflow goes too, unless another saved result shares the same answers.
    const tailored = next.some((x) => x.code === e.code) ? undefined : takeTailored(e.code);
    setUndo({ entry: e, index: entries.findIndex((x) => x.id === e.id), tailored });
    onChange(next);
  };

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.875rem] font-semibold tracking-tight text-ink sm:text-[2.25rem]">History</h1>
          <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-muted">
            Every result you reach is saved here automatically, in this browser only.{AI_ENABLED ? "" : " Nothing is sent anywhere."}
          </p>
        </div>
        {entries.length + systems.length > 0 &&
          (confirmClear ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className={btn.danger}
                onClick={() => {
                  clearHistory();
                  onClearSystems?.();
                  clearTailored();
                  onChange([]);
                  setConfirmClear(false);
                  setUndo(null);
                }}
              >
                Delete all {entries.length + systems.length}
              </button>
              <button type="button" className={btn.quiet} onClick={() => setConfirmClear(false)}>
                Keep them
              </button>
            </div>
          ) : (
            <button type="button" className={btn.quiet} onClick={() => setConfirmClear(true)}>
              <Trash size={15} aria-hidden />
              Clear history
            </button>
          ))}
      </header>

      {systems.length > 0 && (
        <section className="mt-10" aria-labelledby="systems-title">
          <h2 id="systems-title" className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
            Your systems
          </h2>
          <ul className="mt-3 grid gap-3">
            {systems.map((p) => (
              <li key={p.id} className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-[16.5px] font-semibold leading-snug text-ink">
                    <TreeStructure size={18} aria-hidden className="shrink-0 text-accent" />
                    {p.title}
                  </h3>
                  <ol className="mt-2 grid gap-1 text-[14px] text-muted">
                    {p.jobs.map((j, i) => (
                      <li key={i}>
                        {i + 1}. {j}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-[12.5px] text-muted">
                    Saved {when(p.createdAt)}
                    {p.updatedAt - p.createdAt > 60_000 && <>. Updated {when(p.updatedAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={href({ name: "process", code: p.code })} className={btn.primarySmall} aria-label={`Open the system ${p.title}`}>
                    Open
                    <ArrowRight size={15} weight="bold" aria-hidden />
                  </a>
                  {onRemoveSystem && (
                    <button
                      type="button"
                      onClick={() => onRemoveSystem(p.id)}
                      aria-label={`Delete the saved system ${p.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      <Trash size={17} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {entries.length > 0 && (
            <h2 className="mt-10 text-[13px] font-medium uppercase tracking-[0.08em] text-muted">Your results</h2>
          )}
        </section>
      )}

      {entries.length > 5 && (
        <div className="mt-8">
          <label htmlFor="history-search" className="text-[13.5px] font-medium text-ink">
            Search your saved results
          </label>
          <div className="relative mt-2">
            <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="history-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Task, model or tool"
              className="block w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-10 pr-3 text-[15px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {undo ? `Deleted ${undo.entry.task}.` : ""}
      </p>
      <AnimatePresence>
        {undo && (
          <m.div
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3 text-[14px]"
          >
            <span className="text-ink">
              Deleted <span className="font-medium">{undo.entry.task}</span>.
            </span>
            <button
              type="button"
              className="font-medium text-accent underline-offset-4 hover:underline"
              onClick={() => {
                if (undo.tailored) putTailored(undo.entry.code, undo.tailored);
                onChange(restoreHistory(undo.entry, undo.index));
                setUndo(null);
              }}
            >
              Undo
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line-strong/60 px-6 py-14 text-center">
          <ClockCounterClockwise size={30} aria-hidden className="mx-auto text-muted" />
          <h2 className="mt-4 text-[1.125rem] font-semibold text-ink">No saved results yet</h2>
          <p className="mx-auto mt-2 max-w-[42ch] text-[15px] leading-relaxed text-muted">
            When you finish the guide, your result is saved here so you can come back to it or compare it with others.
          </p>
          <button type="button" onClick={onStart} className={`${btn.primary} mt-6`}>
            Start the guide
            <ArrowRight size={17} weight="bold" aria-hidden />
          </button>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-[15px] text-muted">No saved results match "{query}".</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          <AnimatePresence initial={false}>
            {shown.map((e) => (
              <m.li
                key={e.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -12, transition: { duration: 0.18 } }}
                className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16.5px] font-semibold leading-snug text-ink">{e.task}</h2>
                    {e.id === currentId && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">Current</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[14px] text-muted">
                    {SHORT_TITLE[e.approach]}, {e.steps} steps
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-[12.5px]">
                    <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-medium text-ink">
                      <Cpu size={13} aria-hidden className="text-accent" />
                      {e.models}
                    </li>
                    <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-ink">
                      <Wrench size={13} aria-hidden className="text-muted" />
                      {e.tool}
                    </li>
                    <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-ink">
                      <UserCheck size={13} aria-hidden className="text-muted" />
                      Level {e.autonomy}: {AUTONOMY[e.autonomy as AutonomyLevel].name}
                    </li>
                  </ul>
                  <p className="mt-3 text-[12.5px] text-muted">
                    Saved {when(e.createdAt)}
                    {e.updatedAt - e.createdAt > 60_000 && <>. Updated {when(e.updatedAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" className={btn.primarySmall} onClick={() => onOpen(e)} aria-label={`Open the result for ${e.task}`}>
                    Open
                    <ArrowRight size={15} weight="bold" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(e)}
                    aria-label={`Delete the saved result for ${e.task}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Trash size={17} aria-hidden />
                  </button>
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </main>
  );
}
