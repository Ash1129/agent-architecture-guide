import type { Answers } from '../lib/questions';
import { shortlist, shortlistAddsSomething } from '../lib/shortlist';
import { TOOLS } from '../lib/catalog';

export function ImplementationShortlist({ answers }: { answers: Answers }) {
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
