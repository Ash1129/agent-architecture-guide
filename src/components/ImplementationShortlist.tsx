import type { Answers } from '../lib/questions';
import type { Recommendation } from '../lib/rules';
import { shortlist, shortlistAddsSomething } from '../lib/shortlist';
import { TOOLS } from '../lib/catalog';
import { BasisLabel } from './ui';

/**
 * Implementation options. With an AI decision, the AI's shortlist (the main
 * tool plus at most one alternative it judged worth weighing); otherwise the
 * rules' bounded comparisons. Either way, shown only when there's a real choice.
 */
export function ImplementationShortlist({ answers, r, rules }: { answers: Answers; r?: Recommendation; rules?: Recommendation }) {
  if (r?.decided) return <DecidedShortlist r={r} rules={rules} />;
  const result = shortlist(answers);
  // One candidate that is the main tool only repeats the recommendation above, so the section stays out of the way.
  if (!shortlistAddsSomething(result, answers)) return null;
  return <section className="studio-section" aria-labelledby="shortlist-title">
    <h2 id="shortlist-title" className="text-xl font-semibold">Implementation shortlist</h2>
    <p className="mt-3 text-muted">{result.explanation}</p>
    <p className="mt-2 text-sm text-muted">Recommended by rules · Implementation designs, not tested deployments. The architecture above and its starter kit remain the primary design.</p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {result.candidates.map((c, i) => <article key={c.tool} className="rounded-xl border border-line p-5">
        <h3 className="font-semibold">{i === 0 ? 'Starting option' : 'Alternative'}: {TOOLS[c.tool].name}</h3>
        <p className="mt-3">{c.reason}</p>
        <p className="mt-3 text-muted">{c.tradeoff}</p>
        <details className="mt-4"><summary className="cursor-pointer">Required safeguards and implementation work</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">{c.obligations.map((s, n) => <li key={n}>{s}</li>)}</ul>
        </details>
      </article>)}
    </div>
    <details className="mt-5"><summary className="cursor-pointer">Why other options were not shortlisted</summary>
      <ul className="mt-3 space-y-3">{result.excluded.map(e => <li key={e.tool}><strong>{TOOLS[e.tool].name}:</strong> {e.reason}</li>)}</ul>
    </details>
  </section>;
}

function DecidedShortlist({ r, rules }: { r: Recommendation; rules?: Recommendation }) {
  const d = r.decided!;
  const core = (x: Recommendation) => x.tools.find((t) => t.core)!;
  // When the AI chose a different main tool from the rules and named no alternative, the rules' tool is the alternative worth seeing.
  const rulesTool = rules && core(rules).tool !== core(r).tool && !d.shortlist.some((c) => c.tool === core(rules).tool) ? core(rules) : undefined;
  const shortlist = rulesTool
    ? [...d.shortlist.slice(0, 1), { tool: rulesTool.tool, reason: `The guide's rules' choice: ${rulesTool.why.map((w) => w.text).join(" ")}`, tradeoff: "Switch to the rules' version (the link under the title) to see its design and build its kit." }]
    : d.shortlist;
  if (shortlist.length < 2) return null;
  // Whichever option is built, the design's safeguards and hosting come with it.
  const obligations = [...r.autonomy.checkpoints, ...r.autonomy.guardrails, `Keep where it runs: ${r.hosting.title}. ${r.hosting.body}`];
  return <section className="studio-section" aria-labelledby="shortlist-title">
    <h2 id="shortlist-title" className="text-xl font-semibold">Implementation shortlist</h2>
    {d.reasons.shortlist.text && <p className="mt-3 text-muted">{d.reasons.shortlist.text}</p>}
    <p className="mt-2 text-sm text-muted">
      Chosen by AI, checked against the guide's limits · Neither option has been benchmarked on your examples. The architecture above and its starter kit are built for the first option.
      {d.reasons.shortlist.kb.length > 0 && <> <BasisLabel basis={{ kind: 'ai', chunks: d.reasons.shortlist.kb }} /></>}
    </p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {shortlist.map((c, i) => <article key={c.tool} className="rounded-xl border border-line p-5">
        <h3 className="font-semibold">{i === 0 ? 'Recommended' : 'Alternative'}: {TOOLS[c.tool].name}</h3>
        {c.reason && <p className="mt-3">{c.reason}</p>}
        {c.tradeoff && <p className="mt-3 text-muted">{c.tradeoff}</p>}
        <details className="mt-4"><summary className="cursor-pointer">Safeguards either option must keep</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">{obligations.map((s, n) => <li key={n}>{s}</li>)}</ul>
        </details>
      </article>)}
    </div>
  </section>;
}
