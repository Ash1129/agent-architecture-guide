import { m, useReducedMotion } from "motion/react";
import { AUTONOMY, type AutonomyLevel } from "../lib/catalog";
import type { Approach } from "../lib/rules";

export const RUNGS: { id: Approach; name: string; cost: string; when: string; example: string }[] = [
  {
    id: "automation",
    cost: "Least effort and risk",
    name: "Plain automation",
    when: "Same steps, same rules, every time.",
    example: "Send a reminder when an invoice is 14 days overdue.",
  },
  {
    id: "workflow",
    cost: "Some testing needed",
    name: "Workflow with AI steps",
    when: "Fixed steps, some needing reading or judgement.",
    example: "Summarise each new contract and flag unusual clauses.",
  },
  {
    id: "agent",
    cost: "Close supervision at first",
    name: "One agent",
    when: "The next step has to be worked out each time.",
    example: "Resolve a customer issue using account records.",
  },
  {
    id: "multi",
    cost: "Most to build and run",
    name: "Several agents",
    when: "Distinct specialists, or too much for one to track.",
    example: "Research, draft and fact-check a market report.",
  },
];

/** Complexity as a staircase: each rung costs more to build, run and supervise. */
export function Ladder({ current, compact = false }: { current?: Approach; compact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <ol className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-4 md:items-end"}`}>
      {RUNGS.map((r, i) => {
        const active = current === r.id;
        return (
          <m.li
            key={r.id}
            initial={!compact && !reduce ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            aria-current={active ? "step" : undefined}
            className={`relative flex flex-col rounded-2xl border p-5 transition-colors ${
              active ? "border-accent bg-accent-soft" : current ? "border-line bg-transparent" : "border-line bg-surface"
            }`}
          >
            {/* Taller rungs on desktop make the rising cost visible at a glance. */}
            {!compact && <span aria-hidden className="hidden md:block" style={{ height: `${i * 2.25}rem` }} />}
            <span className={`text-[12.5px] font-medium ${active ? "text-accent" : "text-muted"}`}>{r.cost}</span>
            <span className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight text-ink">{r.name}</span>
            <span className="mt-2 text-[14.5px] leading-relaxed text-ink">{r.when}</span>
            <span className="mt-3 text-[14px] leading-relaxed text-muted">{r.example}</span>
            {active && (
              <span className="mt-4 inline-flex w-fit rounded-full bg-accent px-2.5 py-1 text-[12.5px] font-medium text-accent-ink">
                Your starting point
              </span>
            )}
          </m.li>
        );
      })}
    </ol>
  );
}

export function AutonomyScale({ level }: { level?: AutonomyLevel }) {
  const levels = [1, 2, 3, 4] as AutonomyLevel[];
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {levels.map((l) => {
        const active = l === level;
        return (
          <li
            key={l}
            aria-current={active ? "step" : undefined}
            className={`rounded-2xl border p-4 ${
              active ? "border-accent bg-accent-soft" : level ? "border-line bg-transparent" : "border-line bg-surface"
            }`}
          >
            <span className={`font-mono text-[12px] ${active ? "text-accent" : "text-muted"}`}>Level {l}</span>
            <span className="mt-1 block text-[15px] font-semibold leading-snug text-ink">{AUTONOMY[l].name}</span>
            <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">{AUTONOMY[l].plain}</span>
          </li>
        );
      })}
    </ol>
  );
}
