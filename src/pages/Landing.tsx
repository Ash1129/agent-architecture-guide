import {
  ArrowRight,
  Compass,
  Cpu,
  FlowArrow,
  Footprints,
  Gauge,
  Signpost,
  Toolbox,
  Warning,
} from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Ladder } from "../components/Scales";
import { TaskInput } from "../components/TaskInput";
import { BasisLabel, btn } from "../components/ui";
import { href, type Route } from "../lib/router";
import { RULES } from "../lib/rules";

const OUTPUTS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <Signpost size={22} />, title: "Agent or not", body: "Whether you need one agent, several, or none at all." },
  { icon: <FlowArrow size={22} />, title: "The shape of the system", body: "How the work flows, drawn as a simple diagram." },
  { icon: <Toolbox size={22} />, title: "Tools", body: "Which tools to use, such as n8n, Skills, MCP or Claude Cowork, and how they fit." },
  { icon: <Cpu size={22} />, title: "Which model", body: "A named model for each AI step, or the algorithm when no AI is needed." },
  { icon: <Gauge size={22} />, title: "Autonomy", body: "How much it should do alone, and when a person steps in." },
  { icon: <Compass size={22} />, title: "A simpler start", body: "A lighter option to try before building the full design." },
  { icon: <Warning size={22} />, title: "Gotchas", body: "The traps most likely to catch your particular setup." },
  { icon: <Footprints size={22} />, title: "First steps", body: "Three practical things to do this week." },
];

const SAMPLE_RULES = ["A1", "AU6", "G3"].map((id) => RULES.find((r) => r.id === id)!);

export function Landing({ cta, onTask }: { cta: { label: string; to: Route }; onTask: (task: string) => void }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <main id="main">
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-16 lg:pt-10">
        <div>
          <m.h1
            {...rise(0)}
            className="max-w-[16ch] text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-ink sm:text-[3.25rem] lg:text-[3.75rem]"
          >
            Start with the business problem, not the technology.
          </m.h1>
          <m.p {...rise(0.08)} className="mt-6 max-w-[44ch] text-[18px] leading-relaxed text-muted sm:text-[19px]">
            Answer a dozen plain questions about one task. Leave with a starting architecture, the reasoning, and the traps to
            avoid.
          </m.p>
          <m.div {...rise(0.16)} className="mt-9 flex flex-wrap gap-3">
            <a href={href(cta.to)} className={btn.primary}>
              {cta.label}
              <ArrowRight size={17} weight="bold" aria-hidden />
            </a>
            <a href={href({ name: "how" })} className={btn.secondary}>
              How it decides
            </a>
          </m.div>
        </div>

        <m.div
          {...(reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] } })}
          className="shadow-soft rounded-2xl border border-line bg-surface p-6 sm:p-8"
        >
          <p className="text-[13px] font-medium text-muted">Question 1, about 3 minutes in total</p>
          <h2 id="hero-question" className="mt-2 text-[1.5rem] font-semibold leading-tight tracking-tight text-ink sm:text-[1.75rem]">
            What business task do you want to improve?
          </h2>
          <div className="mt-6">
            <TaskInput onSubmit={onTask} />
          </div>

        </m.div>
      </section>

      {/* ------------------------------------------------------------ ladder */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="max-w-[22ch] text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">
            Most business problems don't need an AI agent.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            Every step up this ladder costs more to build, run and supervise. The guide recommends the lowest rung that does the
            job, and tells you why.
          </p>
          <div className="mt-12">
            <Ladder />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ outputs */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">What you leave with</h2>
            <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-muted">
              A one-page starting architecture you can share with your team or a vendor. Every recommendation is explained using
              your own answers.
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {OUTPUTS.map((o, i) => (
              <m.li
                key={o.title}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[auto_1fr] gap-4"
              >
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                  {o.icon}
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-ink">{o.title}</h3>
                  <p className="mt-1 text-[15.5px] leading-relaxed text-muted">{o.body}</p>
                </div>
              </m.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ rules */}
      <section className="border-t border-line bg-surface-2/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="max-w-[24ch] text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">
            Written rules you can check, not an AI's guess.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-muted">
            The guide runs your answers through {RULES.length} published rules drawn from the course research. Each one says
            where it came from. Here are three of them.
          </p>
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            {SAMPLE_RULES.map((r) => (
              <li key={r.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                <span className="font-mono text-[12.5px] text-muted">Rule {r.id}</span>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink">
                  <span className="font-semibold">If </span>
                  {r.if.charAt(0).toLowerCase() + r.if.slice(1)}
                </p>
                <p className="mt-2 text-[15.5px] leading-relaxed text-ink">
                  <span className="font-semibold">Then </span>
                  {r.then.charAt(0).toLowerCase() + r.then.slice(1)}
                </p>
                <p className="mt-auto pt-5 text-[13px]">
                  <BasisLabel basis={r.basis} />
                </p>
              </li>
            ))}
          </ul>
          <a
            href={href({ name: "how" })}
            className="mt-8 inline-flex items-center gap-1.5 text-[15.5px] font-medium text-accent underline-offset-4 hover:underline"
          >
            See every rule and source
            <ArrowRight size={16} weight="bold" aria-hidden />
          </a>
        </div>
      </section>
    </main>
  );
}
