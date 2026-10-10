import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleNotch, Cpu, CurrencyDollar, FileCode, LinkSimple, Plus, Toolbox, UserCheck, UsersThree } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { type SystemNav, StudioShell } from "../components/StudioShell";
import { btn } from "../components/ui";
import { type Blueprint, buildBlueprint, modelPlan } from "../lib/blueprint";
import { AUTONOMY, TOOLS } from "../lib/catalog";
import { type DesignState, fetchDesign, rememberedDesign } from "../lib/designs";
import { drawioSystemXml } from "../lib/exportxml";
import { type Range, estimateCost, moneyRange, weeksRange } from "../lib/cost";
import { AI_ENABLED } from "../lib/features";
import { type Process as ProcessT } from "../lib/process";
import { href } from "../lib/router";
import { recommend } from "../lib/rules";
import { resultCode } from "../lib/share";
import { slugify } from "../lib/starter";
import { SHORT_TITLE } from "./History";

// A process's map: every job, each designed on its own for how it works, in
// the order work flows through them, joined by the handoffs between them.
// Each job opens its own full result. Styles live in src/studio.css under .process-.

const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Each job's design: the AI's when it has one (as its own result shows), the rules' until then. */
function useDesigns(p: ProcessT): DesignState[] {
  const key = p.parts.map(resultCode).join("|");
  const [states, setStates] = useState<DesignState[]>(() => p.parts.map(() => ({ status: "off" })));
  useEffect(() => {
    if (!AI_ENABLED) return setStates(p.parts.map(() => ({ status: "off" })));
    const ctl = new AbortController();
    setStates(p.parts.map((a) => {
      const known = rememberedDesign(a);
      return known ? { status: "ready", ...known } : { status: "loading" };
    }));
    p.parts.forEach((a, i) => {
      if (rememberedDesign(a)) return;
      const set = (s: DesignState) => setStates((all) => all.map((x, k) => (k === i ? s : x)));
      fetchDesign(a, ctl.signal)
        .then((d) => set({ status: "ready", ...d }))
        .catch((e: Error) => !ctl.signal.aborted && set({ status: "failed", note: e.message }));
    });
    return () => ctl.abort();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- the key stands for the parts
  return states;
}

export function ProcessMap({ process: p, code, historyCount, onNew }: { process: ProcessT; code: string; historyCount: number; onNew: () => void }) {
  const reduce = useReducedMotion();
  const designs = useDesigns(p);
  const jobs = useMemo(
    () =>
      p.parts.map((a, i) => {
        const r = recommend(a);
        const d = designs[i];
        const design: Blueprint = d?.status === "ready" ? d.blueprint : buildBlueprint(r, a);
        const plan = modelPlan(design);
        return {
          answers: a,
          task: a.task ?? `Job ${i + 1}`,
          r,
          design,
          source: (d?.status === "ready" ? "ai" : "rules") as "ai" | "rules",
          drafting: d?.status === "loading",
          href: href({ name: "result", code: resultCode(a) }),
          models: plan.models.length ? plan.models.map((g) => g.engine.short).join(" + ") : "No AI model",
          tool: TOOLS[r.tools.find((t) => t.core)!.tool].name,
          people: design.nodes.filter((n) => n.kind === "human"),
          cost: estimateCost(r, design, a),
        };
      }),
    [p, designs],
  );
  const drafting = jobs.some((j) => j.drafting);
  const people = jobs.reduce((n, j) => n + j.people.length, 0);
  const vias = [...new Set(p.handoffs.map((h) => h.via))];
  // Jobs share nothing in this estimate, so their costs add up; a shared plan would make it less.
  const monthly = jobs.reduce<Range>((t, j) => [t[0] + j.cost.monthly[0], t[1] + j.cost.monthly[1]], [0, 0]);
  const next = (i: number) => p.handoffs.filter((h) => h.from === i && h.to === i + 1);
  const others = p.handoffs.filter((h) => h.to !== h.from + 1);

  const nav: SystemNav = { title: p.title, mapHref: href({ name: "process", code }), onMap: true, jobs: jobs.map((j) => ({ label: j.task, href: j.href, current: false })) };

  const [copied, setCopied] = useState(false);
  const link = (() => {
    const url = new URL(window.location.href);
    url.hash = href({ name: "process", code });
    return url.toString();
  })();
  const exportDrawio = () => {
    const xml = drawioSystemXml({ title: p.title, jobs: jobs.map((j) => ({ task: j.task, design: j.design, source: j.source })), handoffs: p.handoffs });
    const url = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(p.title) || "system"}.drawio`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StudioShell historyCount={historyCount} system={nav}>
      <main id="main" className="studio-page process-page">
        <m.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <section aria-labelledby="process-title">
            <div className="section-kicker studio-caption">
              <span className="status-dot" aria-hidden />
              Your system
              <span className="kicker-line" aria-hidden />
            </div>
            <h1 id="process-title">
              {p.title}
              <span className="title-period">.</span>
            </h1>
            <div className="studio-byline">
              <dl aria-label="Key facts">
                <div>
                  <dt className="sr-only">Jobs</dt>
                  <dd>
                    <Toolbox size={15} aria-hidden />
                    {jobs.length} jobs
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Handoffs</dt>
                  <dd>
                    <ArrowRight size={15} aria-hidden />
                    {p.handoffs.length} handoff{p.handoffs.length === 1 ? "" : "s"}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">People</dt>
                  <dd>
                    <UsersThree size={15} aria-hidden />
                    People step in at {people} point{people === 1 ? "" : "s"}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Running cost (estimate)</dt>
                  <dd title="Running cost, all jobs (estimate)">
                    <CurrencyDollar size={15} aria-hidden />
                    About {moneyRange(monthly)} a month
                  </dd>
                </div>
                {drafting && (
                  <div>
                    <dt className="sr-only">Status</dt>
                    <dd role="status">
                      <CircleNotch size={15} aria-hidden className={reduce ? "" : "animate-spin"} />
                      Drafting the designs
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <p className="studio-intro">
              Each job gets a system built for how that job works
              {vias.length ? (
                <>
                  , and they pass work to each other through {vias.join(" and ")}. To the people using it, it runs as one process.
                </>
              ) : (
                "."
              )}
            </p>

            <ol className="process-map" aria-label="The jobs, in the order work flows">
              {jobs.map((j, i) => (
                <li key={i}>
                  <article className="process-job" aria-labelledby={`job-${i}-title`}>
                    <header>
                      <span className="studio-caption">Job {String(i + 1).padStart(2, "0")}</span>
                      {j.drafting && (
                        <span className="process-drafting">
                          <CircleNotch size={13} aria-hidden className={reduce ? "" : "animate-spin"} />
                          Drafting
                        </span>
                      )}
                    </header>
                    <h2 id={`job-${i}-title`}>{j.task}</h2>
                    <p className="process-approach">
                      {SHORT_TITLE[j.r.approach.id]}, {j.design.nodes.length} steps
                    </p>
                    <ul className="process-facts" aria-label="Key facts">
                      <li title="Main tool">
                        <Toolbox size={14} aria-hidden />
                        {j.tool}
                      </li>
                      <li title="Models">
                        <Cpu size={14} aria-hidden />
                        {j.models}
                      </li>
                      <li title="Autonomy">
                        <UserCheck size={14} aria-hidden />
                        Level {j.r.autonomy.level}: {AUTONOMY[j.r.autonomy.level].name}
                      </li>
                      <li title="Running cost and build time (estimate)">
                        <CurrencyDollar size={14} aria-hidden />
                        {moneyRange(j.cost.monthly)} a month · {weeksRange(j.cost.build.weeks)} to build
                      </li>
                    </ul>
                    <p className="process-path">
                      From {lower(j.design.nodes[0].name)} to {lower(j.design.nodes[j.design.nodes.length - 1].name)}.
                    </p>
                    <a href={j.href} className="studio-quiet process-open">
                      Open this job's design
                      <ArrowUpRight size={16} aria-hidden />
                    </a>
                  </article>
                  {next(i).map((h) => (
                    <div key={`${h.from}-${h.to}`} className="process-handoff">
                      <span className="process-handoff-line" aria-hidden>
                        <ArrowDown size={16} />
                      </span>
                      <p>
                        <strong>{h.via}</strong>
                        <span>
                          Hands over when {lower(h.when).replace(/\.$/, "")}, which starts job {h.to + 1}.
                        </span>
                      </p>
                    </div>
                  ))}
                </li>
              ))}
            </ol>
            {others.length > 0 && (
              <ul className="process-others" aria-label="Other handoffs">
                {others.map((h) => (
                  <li key={`${h.from}-${h.to}`}>
                    Job {h.from + 1} hands over to job {h.to + 1} through <strong>{h.via}</strong> when {lower(h.when).replace(/\.$/, "")}.
                  </li>
                ))}
              </ul>
            )}

            <div className="studio-actions no-print">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn.small} onClick={exportDrawio} title="A draw.io file: the whole system on one page, then each job's design">
                  <FileCode size={16} aria-hidden />
                  Export to draw.io
                </button>
                <button
                  type="button"
                  className={btn.small}
                  onClick={() => {
                    navigator.clipboard?.writeText(link).catch(() => {});
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2200);
                  }}
                >
                  {copied ? <Check size={16} weight="bold" aria-hidden /> : <LinkSimple size={16} aria-hidden />}
                  {copied ? "Link copied" : "Copy link"}
                </button>
                <button type="button" className={btn.small} onClick={onNew}>
                  <Plus size={16} aria-hidden />
                  A new problem
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {copied ? "Link copied to clipboard" : ""}
              </p>
            </div>
          </section>

          <section className="studio-section" aria-labelledby="people-title">
            <div className="section-kicker studio-caption">02 — Where people step in</div>
            <div className="section-heading">
              <div className="min-w-0">
                <h2 id="people-title">The people in the loop</h2>
                <p>Every point across the system where a person reviews, decides or takes over, job by job.</p>
              </div>
            </div>
            <ol className="process-people">
              {jobs.flatMap((j, i) =>
                j.people.map((n) => (
                  <li key={`${i}-${n.id}`}>
                    <span className="studio-caption">Job {i + 1}</span>
                    <div>
                      <p className="process-person">{n.name}</p>
                      <p>{n.what}</p>
                    </div>
                  </li>
                )),
              )}
              {people === 0 && <li>No step hands over to a person. Each job's own safeguards are in its design.</li>}
            </ol>
          </section>
        </m.div>
      </main>
    </StudioShell>
  );
}
