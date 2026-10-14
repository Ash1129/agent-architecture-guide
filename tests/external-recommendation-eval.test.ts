import { describe, expect, it } from 'vitest';
import dataset from '../evals/recommendations/external-cases.json';
import audit from '../evals/recommendations/assumption-evidence.json';
import baseline from '../outputs/guide-eval/external/baseline-v1/cases.json';
import { evaluateExternal, gradeExternal, validateExternal, type ExternalCase } from '../evals/recommendations/external';
import { recommend } from '../src/lib/rules';
import { buildBlueprint } from '../src/lib/blueprint';
const cases = dataset.cases as unknown as ExternalCase[];

describe('external case evaluation', () => {
  it('accounts for every original assumption with resolvable evidence and preserves unknowns', () => {
    const original = baseline.cases.flatMap(c => Object.entries(c.answerProvenance)
      .filter(([, p]) => p?.kind === 'assumption').map(([field]) => `${c.id}.${field}`));
    const recorded = audit.assumptions.map(a => `${a.caseId}.${a.field}`);
    expect(new Set(recorded).size).toBe(recorded.length);
    expect(recorded.sort()).toEqual(original.sort());
    for (const a of audit.assumptions) {
      const c = cases.find(c => c.id === a.caseId)!;
      expect(c.answers[a.field as keyof typeof c.answers]).toEqual(a.currentValue);
      expect(c.answerProvenance[a.field].kind).toBe(['supported', 'corrected'].includes(a.status) ? 'source-interpretation' : 'assumption');
      expect(a.sourceIds.length).toBeGreaterThan(0);
      for (const id of [...a.sourceIds, ...a.analogousSourceIds]) {
        const source = audit.sources[id as keyof typeof audit.sources];
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.section.length).toBeGreaterThan(0);
      }
    }
  });
  it('evaluates hypothetical variants without mutating cases or counting them as customer evidence', () => {
    const before = JSON.stringify(cases);
    const results = evaluateExternal(cases);
    expect(JSON.stringify(cases)).toBe(before);
    expect(results).toHaveLength(7);
    expect(results.flatMap(r => r.sensitivity).length).toBe(44);
    const remote = results.find(r => r.id === 'remote')!;
    expect(remote.sensitivity.find(v => v.field === 'trigger' && v.value === 'event')?.changed).toBe(false);
    expect(results.every(r => r.overallStatus === 'REVIEW_REQUIRED')).toBe(true);
  });
  it('requires source and per-answer provenance', () => {
    expect(() => validateExternal(cases)).not.toThrow();
    const altered = structuredClone(cases);
    delete altered[0].answerProvenance.location;
    expect(() => validateExternal(altered)).toThrow(/provenance/);
    altered[0] = structuredClone(cases[0]);
    altered[0].source.url = '';
    expect(() => validateExternal(altered)).toThrow(/source provenance/);
    expect(() => validateExternal([])).toThrow(/Empty/);
    expect(() => validateExternal([cases[0], cases[0]])).toThrow(/duplicate/);
  });
  it('never turns structural success into a fully validated case', () => {
    const results = evaluateExternal(cases);
    expect(results).toHaveLength(7);
    expect(results.every(r => r.overallStatus === 'REVIEW_REQUIRED')).toBe(true);
    expect(results.find(r => r.id === 'discord')?.outsideCatalog).toEqual(expect.arrayContaining(['dagster', 'dbt']));
  });
  it('does not grade the vendor chosen in a published story as ground truth', () => {
    const c = cases.find(c => c.id === 'remote')!;
    const r = recommend(c.answers), bp = buildBlueprint(r, c.answers);
    const original = gradeExternal(c, r, bp);
    expect(gradeExternal({ ...c, observedStack: ['some-other-platform'] }, r, bp)).toEqual(original);
    r.tools = r.tools.map(t => ({ ...t, tool: 'airflow' }));
    expect(gradeExternal(c, r, bp)).toEqual(original);
  });
  it('detects an automatic completion bypass despite a visible human node', () => {
    const c = cases.find(c => c.id === 'oversee')!;
    const r = recommend(c.answers), bp = buildBlueprint(r, c.answers);
    r.autonomy.level = 2;
    bp.edges = [{ from: 'start', to: 'approve' }, { from: 'approve', to: 'end' }] as typeof bp.edges;
    expect(gradeExternal(c, r, bp).find(x => x.name === 'Human decision before completion')?.pass).toBe(true);
    bp.edges.push({ from: 'start', to: 'end' } as typeof bp.edges[number]);
    expect(gradeExternal(c, r, bp).find(x => x.name === 'Human decision before completion')?.pass).toBe(false);
  });
  it('detects unnecessary model use in deterministic case adaptations', () => {
    const c = cases[0], r = recommend(c.answers), bp = buildBlueprint(r, c.answers);
    r.models.needed = true;
    expect(gradeExternal(c, r, bp).find(x => x.name === 'No unnecessary AI')?.pass).toBe(false);
  });
});
