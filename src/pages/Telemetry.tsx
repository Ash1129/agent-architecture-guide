import { ArrowClockwise, ArrowsClockwise, CheckCircle, Database, Prohibit, Trash, Warning, XCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Outcome, TelemetrySummary } from "../../server/telemetry";
import { btn } from "../components/ui";
import { AI_ENABLED } from "../lib/features";

// The local telemetry page: how every AI request on this dev server ended, what
// it cost and which checks failed (server/telemetry.ts records them). It exists
// only where the AI runs; the published site has no AI and so nothing to show.

const STEP_NAMES: Record<string, string> = {
  split: "Reading the description",
  interview: "Adapting the questions",
  decide: "Deciding how to build",
  design: "Drafting the design",
  kit: "Writing the starter kit",
  tailor: "Tailoring the n8n workflow",
};

const OUTCOME: Record<Outcome, { label: string; icon: ReactNode }> = {
  "first-try": { label: "Passed first try", icon: <CheckCircle size={15} weight="fill" className="text-accent" aria-hidden /> },
  retry: { label: "Passed on Sonnet retry", icon: <ArrowsClockwise size={15} aria-hidden /> },
  fallback: { label: "Failed checks, rules shown", icon: <Warning size={15} weight="fill" aria-hidden /> },
  error: { label: "API error", icon: <XCircle size={15} weight="fill" aria-hidden /> },
  cache: { label: "From cache", icon: <Database size={15} aria-hidden /> },
  reused: { label: "Reused earlier questions", icon: <Database size={15} aria-hidden /> },
  rejected: { label: "Bad request", icon: <Prohibit size={15} aria-hidden /> },
  "no-key": { label: "No API key", icon: <Prohibit size={15} aria-hidden /> },
};

const stepName = (s: string) => STEP_NAMES[s] ?? s;
const n = (x: number) => x.toLocaleString("en-US");
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");
const usd = (x: number) => (x === 0 ? "$0" : x < 0.01 ? "<$0.01" : `$${x.toFixed(2)}`);
const secs = (ms: number | null) => (ms === null ? "–" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);
const when = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const shortModel = (m: string) => m.replace(/^claude-/, "").replace(/-(\d+)-(\d+)$/, " $1.$2");

type Load = { status: "loading" } | { status: "off"; note: string } | { status: "ready"; data: TelemetrySummary };

export function Telemetry() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("./api/telemetry", { cache: "no-store" });
      if (!res.ok) return setLoad({ status: "off", note: "Telemetry isn't available on this copy of the site. It runs on the local dev server, where the AI does." });
      setLoad({ status: "ready", data: (await res.json()) as TelemetrySummary });
    } catch {
      setLoad({ status: "off", note: "Couldn't reach the dev server's telemetry." });
    }
  }, []);
  useEffect(() => {
    if (!AI_ENABLED) return setLoad({ status: "off", note: "This copy of the site has no AI, so there's nothing to record. Telemetry runs on the local dev server, where the AI does." });
    void refresh();
    // New requests show up on their own while the page is open.
    const t = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 10_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const clear = async () => {
    if (!window.confirm("Forget every telemetry record on this machine?")) return;
    await fetch("./api/telemetry", { method: "DELETE" }).catch(() => undefined);
    void refresh();
  };

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.875rem] font-semibold tracking-tight text-ink sm:text-[2.25rem]">AI telemetry</h1>
          <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">
            How every AI request on this dev server ended, what it cost and which of the guide's checks it failed. Records stay on this
            machine, in <code className="font-mono text-[13.5px]">ai-cache.nosync/telemetry.jsonl</code>. No descriptions, answers, prompts or
            replies are kept.
          </p>
        </div>
        {load.status === "ready" && (
          <div className="flex gap-2">
            <button type="button" className={btn.small} onClick={() => void refresh()}>
              <ArrowClockwise size={15} aria-hidden />
              Refresh
            </button>
            <button type="button" className={btn.small} onClick={() => void clear()} disabled={!load.data.requests}>
              <Trash size={15} aria-hidden />
              Clear
            </button>
          </div>
        )}
      </header>

      {load.status === "loading" && <p className="mt-10 text-[15px] text-muted">Loading…</p>}
      {load.status === "off" && <p className="mt-10 max-w-[60ch] text-[15px] leading-relaxed text-muted">{load.note}</p>}
      {load.status === "ready" && (load.data.requests ? <Report data={load.data} /> : <Empty />)}
    </main>
  );
}

function Empty() {
  return (
    <p className="mt-10 max-w-[60ch] text-[15px] leading-relaxed text-muted">
      No AI requests recorded yet. Describe a problem on the start page and each step's requests appear here as they finish.
    </p>
  );
}

function Report({ data }: { data: TelemetrySummary }) {
  const o = data.outcomes;
  const served = data.requests - o.rejected - o["no-key"];
  return (
    <>
      <p className="mt-3 text-[14px] text-muted">
        {n(data.requests)} request{data.requests === 1 ? "" : "s"} since {when(data.since!)}. The first three rates are of the {n(data.answered)}{" "}
        request{data.answered === 1 ? "" : "s"} a model answered. Cached results, bad requests and missing keys are counted apart.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-5">
        <Tile label="Passed first try" value={pct(o["first-try"], data.answered)} note={`${n(o["first-try"])} on the first model`} />
        <Tile label="Needed the Sonnet retry" value={pct(o.retry, data.answered)} note={`${n(o.retry)} passed after a failed check`} />
        <Tile label="Failed every check" value={pct(o.fallback, data.answered)} note={`${n(o.fallback)} showed the rules' version`} />
        <Tile label="Served without a call" value={pct(o.cache + o.reused, served)} note={`${n(o.cache + o.reused)} from the cache`} />
        <Tile label="Estimated spend" value={usd(data.cost)} note={`${n(o.error)} API error${o.error === 1 ? "" : "s"}`} className="col-span-2 md:col-span-1" />
      </dl>

      <Section title="By step" note="Time is for requests that called a model. Cost uses the guide's price table, with prompt-cache reads and writes priced as Anthropic bills them.">
        <Table
          head={["Step", "Requests", "First try", "Retry", "Rules shown", "API errors", "Cached", "Median time", "Slowest 5%", "Tokens in / out", "Est. cost"]}
          rows={data.steps.map((s) => {
            const answered = s.outcomes["first-try"] + s.outcomes.retry + s.outcomes.fallback;
            return [
              stepName(s.step),
              n(s.requests),
              cell(s.outcomes["first-try"], answered),
              cell(s.outcomes.retry, answered),
              cell(s.outcomes.fallback, answered),
              n(s.outcomes.error),
              n(s.outcomes.cache + s.outcomes.reused),
              secs(s.medianMs),
              secs(s.p95Ms),
              `${n(s.input)} / ${n(s.output)}`,
              usd(s.cost),
            ];
          })}
        />
      </Section>

      <Section title="By model">
        <Table
          head={["Model", "Calls", "Tokens in", "Tokens out", "Est. cost"]}
          rows={data.models.map((m) => [shortModel(m.model), n(m.calls), n(m.input), n(m.output), usd(m.cost)])}
        />
      </Section>

      <Section title="Checks that failed most" note="Every check an AI answer failed: first answers that then passed on the retry, answers that never passed, and saved answers re-checked when read from the cache. A kit section that fails is dropped and keeps its template text.">
        {data.problems.length ? (
          <ol className="grid gap-2">
            {data.problems.map((p) => (
              <li key={`${p.step}:${p.problem}`} className="grid grid-cols-[3rem_1fr] gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[14px]">
                <span className="font-mono text-ink">{n(p.count)}×</span>
                <span>
                  <span className="text-muted">{stepName(p.step)}: </span>
                  <span className="text-ink">{p.problem}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[14px] text-muted">No answer has failed a check yet.</p>
        )}
      </Section>

      <Section title="Latest requests">
        <Table
          head={["When", "Step", "Outcome", "Models", "Tokens in / out", "Est. cost", "Time", "Failed checks"]}
          rows={data.recent.map((r) => [
            when(r.at),
            stepName(r.step),
            <span key="o" className="inline-flex items-center gap-1.5 whitespace-nowrap">
              {OUTCOME[r.outcome].icon}
              {OUTCOME[r.outcome].label}
            </span>,
            r.models.map(shortModel).join(", ") || "–",
            r.input || r.output ? `${n(r.input)} / ${n(r.output)}` : "–",
            r.models.length ? usd(r.cost) : "–",
            secs(r.ms),
            r.problems.length ? <span key="p" title={r.problems.join("\n")}>{r.problems[0]}{r.problems.length > 1 ? ` (+${r.problems.length - 1} more)` : ""}</span> : r.error ?? "–",
          ])}
        />
      </Section>
    </>
  );
}

const cell = (part: number, whole: number) => (whole ? `${n(part)} (${pct(part, whole)})` : n(part));

function Tile({ label, value, note, className = "" }: { label: string; value: string; note: string; className?: string }) {
  return (
    <div className={`bg-surface px-5 py-4 ${className}`}>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-[1.75rem] font-semibold tabular-nums leading-tight tracking-tight text-ink">{value}</dd>
      <dd className="mt-1 text-[12.5px] text-muted">{note}</dd>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[18px] font-semibold tracking-tight text-ink">{title}</h2>
      {note && <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead className="bg-surface-2 text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${i ? "" : "sticky left-0 bg-surface-2"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 align-top tabular-nums text-ink ${j ? "" : "sticky left-0 whitespace-nowrap bg-surface"} ${j === r.length - 1 ? "min-w-[16rem]" : "whitespace-nowrap"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
