import { ArrowLeft, ArrowRight, Cpu, Function as FunctionIcon, X } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { AI_ENABLED } from "../lib/features";
import { type Blueprint, KIND_LABEL, outgoing } from "../lib/blueprint";
import { LAST_REVIEWED } from "../lib/catalog";
import { type Engine, MODELS, OPEN_LARGE_PICKS } from "../lib/models";
import { href } from "../lib/router";
import { GateBadge, KIND_ICON, stepTone } from "./ArchitectureMap";

/** Details for the selected step. On small screens it rises as a sheet over the diagram. */
export function StepPanel({
  bp,
  selected,
  onSelect,
  panelId,
  idle,
}: {
  bp: Blueprint;
  selected: string | null;
  onSelect: (id: string | null) => void;
  panelId: string;
  idle: ReactNode;
}) {
  const reduce = useReducedMotion();
  const node = selected ? bp.nodes.find((n) => n.id === selected) : undefined;
  const total = bp.nodes.length;
  const go = (step: number) => onSelect(bp.nodes.find((n) => n.step === step)?.id ?? null);

  return (
    <div
      id={panelId}
      className={
        node
          ? "flow-panel is-open max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[64dvh] max-lg:overflow-y-auto max-lg:rounded-t-2xl max-lg:border max-lg:shadow-[0_-12px_40px_-12px_hsl(var(--shadow)/0.35)]"
          : "flow-panel"
      }
    >
      <p className="sr-only" aria-live="polite">
        {node ? `Showing step ${node.step} of ${total}: ${node.name}.` : ""}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {!node ? (
          <m.div
            key="idle"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="p-5 sm:p-6"
          >
            {idle}
          </m.div>
        ) : (
          <m.div
            key={node.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="studio-caption flex flex-wrap items-center gap-2" style={{ ["--tone" as string]: stepTone(node.step, total) }}>
                  <span aria-hidden className="flow-dot" />
                  Step {node.step} of {total}
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    {(() => {
                      const Icon = KIND_ICON[node.kind];
                      return <Icon size={12} aria-hidden />;
                    })()}
                    {KIND_LABEL[node.kind]}
                  </span>
                </p>
                <h3 className="flow-panel-title">{node.name}</h3>
                <p className="mt-1 text-[14px] text-muted">{node.label}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" className="studio-outline is-small" onClick={() => go(node.step - 1)} disabled={node.step === 1} aria-label="Previous step">
                  <ArrowLeft size={15} aria-hidden />
                  <span className="max-sm:sr-only">Previous</span>
                </button>
                <button
                  type="button"
                  className="studio-outline is-small"
                  onClick={() => (node.step === total ? onSelect(null) : go(node.step + 1))}
                  aria-label={node.step === total ? "Finish the walkthrough" : "Next step"}
                >
                  <span className="max-sm:sr-only">{node.step === total ? "Done" : "Next"}</span>
                  <ArrowRight size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label="Close step details"
                >
                  <X size={17} aria-hidden />
                </button>
              </div>
            </div>

            {node.engine && (
              <div className="flow-panel-engine mt-5 grid gap-x-6 gap-y-2 p-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:p-5">
                <div>
                  <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                    {node.engine.kind === "model" ? <Cpu size={14} aria-hidden /> : <FunctionIcon size={14} aria-hidden />}
                    {node.kind === "start" ? "How it starts" : node.engine.kind === "model" ? "Model" : "Method, no AI"}
                  </p>
                  <p className="mt-1 text-[1.05rem] font-semibold leading-snug text-ink">
                    {node.engine.kind === "model" ? node.engine.name.split(",")[0] : node.engine.name}
                  </p>
                </div>
                <div className="text-[14px] leading-relaxed">
                  {node.engine.kind === "model" ? (
                    <>
                      <p className="text-ink">{node.engine.why}</p>
                      <ModelGuidance engine={node.engine} className="mt-1" />
                      {node.engine.alternative && <p className="mt-1 text-muted">{node.engine.alternative}</p>}
                    </>
                  ) : (
                    <p className="text-ink">{node.engine.how}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-3 md:gap-8">
              <section>
                <h4 className="studio-caption">What happens</h4>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">{node.what}</p>
              </section>
              <section>
                <h4 className="studio-caption">Why it's here</h4>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">{node.why}</p>
              </section>
              <section>
                <h4 className="studio-caption">What it passes on</h4>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink">{node.passes}</p>
                {outgoing(bp, node.id).length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {outgoing(bp, node.id).map(({ edge, node: next }) => (
                      <li key={`${edge.to}-${edge.label}`}>
                        <button
                          type="button"
                          onClick={() => onSelect(next.id)}
                          className="survey-chip !gap-1.5 !px-3 !py-1 !text-[12.5px]"
                        >
                          <ArrowRight size={12} aria-hidden className="text-muted" />
                          {edge.label && <span className="text-muted">{edge.label}:</span>}
                          Step {next.step}, {next.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {(node.gates.length > 0 || node.rules.length > 0) && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--studio-hairline)] pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {node.gates.map((g) => (
                    <GateBadge key={g.text} kind={g.kind} text={g.text} />
                  ))}
                </div>
                {node.rules.length > 0 && (
                  <a href={href({ name: "how", section: "rules" })} className="text-[12.5px] text-muted underline-offset-4 hover:text-ink hover:underline">
                    Based on rule{node.rules.length > 1 ? "s" : ""} <span className="font-mono">{[...new Set(node.rules)].join(", ")}</span>
                  </a>
                )}
              </div>
            )}
            {AI_ENABLED && node.kb && node.kb.length > 0 && (
              <div className="mt-4 border-t border-[var(--studio-hairline)] pt-3">
                <h4 className="text-[12.5px] font-semibold text-ink">From the knowledge base</h4>
                <ul className="mt-1.5 grid gap-1">
                  {node.kb.map((c) => (
                    <li key={c.id} className="text-[12.5px] leading-snug text-muted">
                      <span className="font-mono text-ink">{c.id}</span> {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * How to start on a step's model. Open-weight steps list the leading models as
 * boxes instead of a sentence; Claude steps keep the build-then-step-down advice.
 */
export function ModelGuidance({ engine, className = "" }: { engine: Extract<Engine, { kind: "model" }>; className?: string }) {
  if (!engine.model.startsWith("open")) return <p className={`text-muted ${className}`}>{engine.prototype}</p>;
  // The knowledge base (M03) names only the leading, large open-weight models,
  // so a small step shows them as the place to start, not as small examples.
  return (
    <div className={className}>
      <p className="text-[13px] text-muted">{engine.model === "openSmall" ? "Start on a large open-weight model, like:" : `${MODELS.openLarge.name} like:`}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`Examples, as of ${LAST_REVIEWED}`}>
        {OPEN_LARGE_PICKS.map((m) => (
          <li key={m} className="rounded-md border border-line-strong/70 bg-surface px-2 py-0.5 text-[12.5px] font-medium text-ink">
            {m}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[12px] text-muted">
        {engine.model === "openSmall"
          ? `Then try smaller open-weight models and keep the smallest one that still matches those results on your test examples. Leading models as of ${LAST_REVIEWED}.`
          : `Leading open-weight models as of ${LAST_REVIEWED}.`}
      </p>
    </div>
  );
}
