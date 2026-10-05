import { ArrowRight, ArrowSquareOut, CaretDown } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Diagram } from "../components/Diagram";
import { AutonomyScale } from "../components/Scales";
import { BasisLabel, btn } from "../components/ui";
import { LAST_REVIEWED, TOPOLOGIES, type TopologyId } from "../lib/catalog";
import { QUESTIONS, type QuestionId } from "../lib/questions";
import { href, type Route } from "../lib/router";
import { RULES, RULE_GROUPS } from "../lib/rules";
import { ALSO_CREDITED, SOURCES } from "../lib/sources";

const SOURCE_GROUPS = [
  { origin: "assignment", title: "From AI Assignment 4" },
  { origin: "added", title: "Added for this guide" },
] as const;
import { AI_TAILORING } from "../lib/features";
import { ALGORITHMS, MODELS, MODEL_RULES } from "../lib/models";

const ASKED_WHEN: Partial<Record<QuestionId, string>> = {
  kinds: "Only when AI is involved",
  split: "Only when the steps are fixed but need judgement",
  roles: "Only when each case is different",
  quality: "Only when AI is involved",
  knowledge: "Only when AI is involved",
};

const DESIGN_CHOICES: { title: string; body: string }[] = [
  {
    title: "Plain automation is a full answer, not a consolation prize",
    body: "The first question decides whether AI is needed at all. If the work follows fixed rules, the guide skips every question about AI behaviour and recommends no model.",
  },
  {
    title: "Some questions are combined to keep the guide short",
    body: "The assignment asks about company size, budget and location separately from tools. Here, size, budget and in-house skills share one question, and location covers provider availability, data residency and vendor independence together.",
  },
  {
    title: "Your task description labels the result but never changes it",
    body: "Free text is hard to interpret reliably without AI. Only the multiple-choice answers feed the rules, so results stay predictable and explainable.",
  },
  {
    title: "Autonomy starts low and is earned",
    body: "The starting levels (automation 4, AI workflow 3, agents 2) and the suggested thresholds, such as three failed attempts or four weeks without a serious error, are this guide's defaults. The research supports human oversight for failures and high-risk actions; the specific numbers are judgement calls you should adjust.",
  },
  {
    title: "A coordinator by default when several agents are needed",
    body: "The research describes several multi-agent arrangements. The guide recommends a coordinator with specialists because one clear line of responsibility is easier for a newcomer to supervise and debug than agents handing work to each other.",
  },
  {
    title: "Routing in front of agents",
    body: "When work arrives in distinct types, the guide suggests sending predictable types down fixed paths so only genuinely open-ended cases reach the agent.",
  },
  {
    title: "MCP only when the AI chooses its tools",
    body: "When a workflow's steps are fixed, the guide recommends the workflow tool's built-in app connections rather than MCP, which exists so an AI can discover and use tools itself.",
  },
  {
    title: "A named model for every step, as a starting point",
    body: `Each AI step names a specific model so you have something concrete to build with, and each non-AI step names its method. The picks follow the research's approach (start on the most capable model, then step down), but the step-to-model table is this guide's suggestion. Names were last reviewed in ${LAST_REVIEWED} and will need updating.`,
  },
];

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-[1.625rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2rem]">
      {children}
    </h2>
  );
}

export function HowItWorks({ cta }: { cta: { label: string; to: Route } }) {
  const designCount = RULES.filter((r) => r.basis.kind === "design").length;
  const citeCount = (id: string) => RULES.filter((r) => r.basis.kind === "source" && r.basis.sources.includes(id as never)).length;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <header className="max-w-3xl">
        <h1 className="text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[3rem]">How the guide decides</h1>
        <p className="mt-5 max-w-[60ch] text-[18px] leading-relaxed text-muted">
          Every recommendation comes from {RULES.length} fixed rules written from the AI Assignment 4 research. No AI model
          writes your result, so the same answers always produce the same result, and you can check every step below.
        </p>
      </header>

      <div className="mt-12 grid gap-x-10 gap-y-8 border-t border-line pt-10 md:grid-cols-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Rules, not a black box</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Each rule reads as "if this, then that". Your result lists the rules it used, and each reason links back here.
          </p>
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Research and judgement, labelled</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {RULES.length - designCount} rules cite a source from the assignment. {designCount} are design choices made for this
            guide, and are marked as such.
          </p>
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-ink">{AI_TAILORING ? "What leaves your browser" : "Your answers stay with you"}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {AI_TAILORING
              ? "Everything runs in your browser and there's no account. The one exception is Tailor with AI: if you choose it, your task and answers go to OpenAI through this site's server to tailor the n8n workflow. A shared link carries the answers inside the link itself."
              : "Everything runs in your browser. There's no account and nothing is sent anywhere. A shared link carries the answers inside the link itself."}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ questions */}
      <section className="mt-20" aria-labelledby="questions">
        <H2 id="questions">The questions</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          The guide asks between 8 and 12 of these, one at a time, depending on your earlier answers.
        </p>
        <ol className="mt-8 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {QUESTIONS.map((q, i) => (
            <li key={q.id} className="grid grid-cols-[2rem_1fr] gap-2">
              <span className="font-mono text-[13px] leading-6 text-muted">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-medium leading-snug text-ink">{q.title}</p>
                <p className="mt-1 text-[14px] text-muted">{ASKED_WHEN[q.id] ?? "Always asked"}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ rules */}
      <section className="mt-20" aria-labelledby="rules">
        <H2 id="rules">Every rule</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Rules run from top to bottom. Later rules can refine earlier ones; for example, autonomy starts at a default level and
          each risk you report can lower it.
        </p>
        <div className="mt-8 space-y-3">
          {RULE_GROUPS.map((group, gi) => {
            const rules = RULES.filter((r) => r.group === group);
            return (
              <details key={group} open={gi === 0} className="group rounded-2xl border border-line bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="text-[17px] font-semibold text-ink">
                    {group} <span className="ml-1 text-[14px] font-normal text-muted">{rules.length} rules</span>
                  </span>
                  <CaretDown size={18} aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-line px-5">
                  <div className="hidden grid-cols-[3.5rem_1fr_1.15fr_13rem] gap-5 py-3 text-[12.5px] font-medium text-muted lg:grid">
                    <span>Rule</span>
                    <span>If</span>
                    <span>Then</span>
                    <span>Basis</span>
                  </div>
                  <ul className="divide-y divide-line lg:border-t lg:border-line">
                    {rules.map((r) => (
                      <li key={r.id} id={`rule-${r.id}`} className="grid gap-1.5 py-4 lg:grid-cols-[3.5rem_1fr_1.15fr_13rem] lg:gap-5">
                        <span className="font-mono text-[13px] text-muted">{r.id}</span>
                        <p className="text-[14.5px] leading-relaxed text-ink">
                          <span className="font-semibold lg:hidden">If </span>
                          {r.if}
                        </p>
                        <p className="text-[14.5px] leading-relaxed text-ink">
                          <span className="font-semibold lg:hidden">Then </span>
                          {r.then}
                        </p>
                        <p className="text-[13px] leading-relaxed">
                          <BasisLabel basis={r.basis} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ patterns */}
      <section className="mt-20" aria-labelledby="patterns">
        <H2 id="patterns">The patterns, in plain terms</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Ways of arranging the work, from simplest to most flexible. Several examples apply the patterns to a resume optimizer,
          the running example in Assignment 4. Diagrams are redrawn for this guide.
        </p>
        <ul className="mt-10 grid gap-x-10 gap-y-14 lg:grid-cols-2">
          {(Object.keys(TOPOLOGIES) as TopologyId[]).map((id) => {
            const t = TOPOLOGIES[id];
            return (
              <li key={id} className="min-w-0">
                <Diagram id={id} title={t.name} compact />
                <h3 className="mt-5 text-[18px] font-semibold text-ink">{t.name}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t.plain}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink">
                  <span className="font-semibold">Good for: </span>
                  {t.goodFor}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">
                  <span className="font-semibold">Example: </span>
                  {t.example}
                </p>
                <p className="mt-2 text-[13px]">
                  <BasisLabel basis={{ kind: "source", sources: t.sources }} />
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ models */}
      <section className="mt-20" aria-labelledby="models">
        <H2 id="models">Which model runs each step</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Every AI step names a model; every other step names its method. Build the first version on the most capable model, then
          step each part down while it still matches your test results. Names as of {LAST_REVIEWED}.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-line text-[12.5px] text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Kind of step</th>
                <th scope="col" className="px-5 py-3 font-medium">Starting pick</th>
                <th scope="col" className="px-5 py-3 font-medium">If Claude can't be used</th>
                <th scope="col" className="px-5 py-3 font-medium">Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MODEL_RULES.map((m) => (
                <tr key={m.role} className="align-top">
                  <th scope="row" className="px-5 py-3.5 font-medium text-ink">{m.step}</th>
                  <td className="px-5 py-3.5 text-ink">
                    <span className="font-semibold">{MODELS[m.pick].name}</span>
                    {m.adjust && <span className="mt-0.5 block text-[13px] text-muted">Or {m.adjust}.</span>}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{MODELS[m.open].name}</td>
                  <td className="px-5 py-3.5 text-[13px]">
                    <BasisLabel basis={m.basis} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-10 text-[17px] font-semibold text-ink">Steps that need no AI</h3>
        <ul className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {Object.values(ALGORITHMS).map((x) => (
            <li key={x.name} className="border-t border-line pt-3">
              <p className="text-[15px] font-semibold text-ink">{x.name}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{x.how}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-muted">
          Open-weight models apply when major providers aren't available where you operate, you want to avoid one AI company, or data
          must stay on your own servers. Open-weight examples: {MODELS.openLarge.examples}; {MODELS.openSmall.examples}.
        </p>
      </section>

      {/* ------------------------------------------------------------ autonomy */}
      <section className="mt-20" aria-labelledby="autonomy">
        <H2 id="autonomy">The four autonomy levels</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          The research frames autonomy as something guardrails make possible: the better the automatic checks, the more a system
          can safely do alone. People step in after repeated failures and before high-risk actions.
        </p>
        <div className="mt-8">
          <AutonomyScale />
        </div>
        <p className="mt-3 text-[13px]">
          <BasisLabel basis={{ kind: "source", sources: ["openai", "notes"] }} />
        </p>
      </section>

      {/* ------------------------------------------------------------ design choices */}
      <section className="mt-20" aria-labelledby="design-choices">
        <H2 id="design-choices">Design choices made for this guide</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Where the research leaves a decision open, the guide makes a reasonable default and says so. These are the main ones.
        </p>
        <ol className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {DESIGN_CHOICES.map((d) => (
            <li key={d.title} className="border-t border-line pt-5">
              <h3 className="text-[16px] font-semibold leading-snug text-ink">{d.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{d.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ sources */}
      <section className="mt-20" aria-labelledby="sources">
        <H2 id="sources">Sources</H2>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Most sources come from AI Assignment 4. The rest were added while building the guide, mainly official documentation
          for the tools it recommends. Counts show how many rules rely on each.
        </p>
        {SOURCE_GROUPS.map((g) => (
          <div key={g.origin} className="mt-8">
            <h3 className="text-[15px] font-semibold text-ink">{g.title}</h3>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {Object.values(SOURCES)
                .filter((s) => s.origin === g.origin)
                .map((s) => (
                <li key={s.id} className="grid gap-2 py-5 md:grid-cols-[1fr_1fr_6rem] md:gap-8">
                  <div>
                    <p className="text-[15px] font-medium leading-snug text-ink">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                          {s.citation}
                          <ArrowSquareOut size={13} aria-hidden className="ml-1 inline align-baseline text-muted" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ) : (
                        s.citation
                      )}
                    </p>
                  </div>
                  <p className="text-[14.5px] leading-relaxed text-muted">{s.usedFor}</p>
                  <p className="text-[14px] text-muted md:text-right">{citeCount(s.id)} rules</p>
                </li>
                ))}
            </ul>
          </div>
        ))}
        <p className="mt-4 max-w-[70ch] text-[13.5px] leading-relaxed text-muted">Also credited in the assignment: {ALSO_CREDITED}</p>
      </section>

      <section className="mt-20 grid gap-6 rounded-2xl bg-surface-2 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-[1.375rem] font-semibold tracking-tight text-ink">Keeping it current</h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">
            AI products change quickly. Product and model names were last reviewed in {LAST_REVIEWED}. The rules are written
            around capabilities, so updating an example rarely changes the logic.
          </p>
        </div>
        <a href={href(cta.to)} className={btn.primary}>
          {cta.label}
          <ArrowRight size={17} weight="bold" aria-hidden />
        </a>
      </section>
    </main>
  );
}
