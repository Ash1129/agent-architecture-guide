import { recommend, type Approach, type Recommendation } from '../../src/lib/rules';
import { buildBlueprint, type Blueprint } from '../../src/lib/blueprint';
import { isComplete, type Answers } from '../../src/lib/questions';
import { TOOLS } from '../../src/lib/catalog';

export type ExternalCase = {
  id: string; company: string; brief: string;
  source: { url: string; publisher: string; section: string; checkedOn: string; facts: string[] };
  answers: Answers;
  answerProvenance: Record<string, { kind: 'source-interpretation' | 'assumption'; note: string; evidenceIds?: string[]; researchStatus?: 'supported' | 'corrected' | 'partial' | 'unresolved' }>;
  uncertaintyVariants?: { field: keyof Answers; value: unknown; reason: string }[];
  observedStack: string[];
  checks: ({ kind: 'approach'; allowed: Approach[] } | { kind: 'noAI' } | { kind: 'review'; maxAutonomy: number })[];
  manualCriteria: string[];
  reviewStatus: 'provisional'; reviewer: null;
};

export function validateExternal(cases: ExternalCase[]) {
  if (!Array.isArray(cases) || !cases.length) throw new Error('Empty external dataset');
  const ids = new Set<string>();
  for (const c of cases) {
    if (!c.id || ids.has(c.id)) throw new Error('Missing or duplicate external case ID');
    ids.add(c.id);
    if (!isComplete(c.answers)) throw new Error(`${c.id}: incomplete answers`);
    if (!c.source?.url?.startsWith('https://') || !c.source.section || !c.source.publisher || !c.source.checkedOn || !c.source.facts.length) throw new Error(`${c.id}: missing source provenance`);
    for (const key of Object.keys(c.answers)) {
      const p = c.answerProvenance[key];
      if (!p?.note || !['source-interpretation', 'assumption'].includes(p.kind)) throw new Error(`${c.id}: missing answer provenance for ${key}`);
    }
    for (const variant of c.uncertaintyVariants ?? []) {
      if (!(variant.field in c.answers) || !variant.reason || !isComplete({ ...c.answers, [variant.field]: variant.value })) throw new Error(`${c.id}: invalid uncertainty variant`);
    }
    if (c.reviewStatus !== 'provisional' || c.reviewer !== null) throw new Error(`${c.id}: independent review has not been implemented`);
    if (!c.checks.length || !c.manualCriteria.length) throw new Error(`${c.id}: missing rubric`);
    for (const check of c.checks) {
      if (!['approach', 'noAI', 'review'].includes(check.kind)) throw new Error(`${c.id}: unknown check`);
      if (check.kind === 'approach' && (!check.allowed.length || check.allowed.some(x => !['automation', 'workflow', 'agent', 'multi'].includes(x)))) throw new Error(`${c.id}: invalid approaches`);
      if (check.kind === 'review' && ![1, 2, 3, 4].includes(check.maxAutonomy)) throw new Error(`${c.id}: invalid autonomy ceiling`);
    }
  }
}

// A publication's chosen brand is deliberately absent from these checks.
export function gradeExternal(c: ExternalCase, r: Recommendation, bp: Blueprint) {
  return c.checks.map(check => {
    if (check.kind === 'approach') return { name: 'Broad approach', pass: check.allowed.includes(r.approach.id), expected: check.allowed, actual: r.approach.id };
    if (check.kind === 'noAI') {
      const count = bp.nodes.filter(n => n.engine?.kind === 'model').length;
      return { name: 'No unnecessary AI', pass: !r.models.needed && count === 0, expected: 'No model calls', actual: { needed: r.models.needed, modelNodes: count } };
    }
    const pending = bp.nodes.filter(n => n.kind === 'start').map(n => n.id), seen = new Set<string>();
    let bypass = false;
    while (pending.length) {
      const id = pending.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const node = bp.nodes.find(n => n.id === id);
      if (!node || node.kind === 'human') continue;
      if (node.kind === 'end') bypass = true;
      pending.push(...bp.edges.filter(e => e.from === id).map(e => e.to));
    }
    const visible = bp.nodes.some(n => n.kind === 'human');
    return { name: 'Human decision before completion', pass: visible && !bypass && r.autonomy.level <= check.maxAutonomy, expected: { maxAutonomy: check.maxAutonomy, bypass: false }, actual: { autonomy: r.autonomy.level, visible, bypass } };
  });
}

function decision(r: Recommendation) {
  return { approach: r.approach.id, core: r.tools.filter(t => t.core).map(t => t.tool), autonomy: r.autonomy.level, hosting: r.hosting.title, tools: r.tools.map(t => t.tool) };
}

export function evaluateExternal(cases: ExternalCase[]) {
  validateExternal(cases);
  return cases.map(c => {
    const recommendation = recommend(c.answers), blueprint = buildBlueprint(recommendation, c.answers);
    const checks = gradeExternal(c, recommendation, blueprint);
    const baseline = decision(recommendation);
    const sensitivity = (c.uncertaintyVariants ?? []).map(v => {
      const answers = { ...c.answers, [v.field]: v.value };
      const alternative = decision(recommend(answers));
      return { ...v, baselineValue: c.answers[v.field], decision: alternative, changed: JSON.stringify(alternative) !== JSON.stringify(baseline) };
    });
    return { ...c, checks, recommendation, blueprint, sensitivity,
      // This is descriptive catalog coverage, never a platform correctness score.
      outsideCatalog: c.observedStack.filter(t => !(t in TOOLS)),
      automatedChecksPassed: checks.every(x => x.pass),
      overallStatus: 'REVIEW_REQUIRED' as const };
  });
}
