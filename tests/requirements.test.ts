import { describe, it, expect } from 'vitest';
import data from '../evals/recommendations/external-cases.json';
import { type Answers, effectiveAnswers, isComplete } from '../src/lib/questions';
import { recommend } from '../src/lib/rules';
import { buildBlueprint } from '../src/lib/blueprint';
import { decodeAnswers, resultCode } from '../src/lib/share';
import { gradeExternal, type ExternalCase } from '../evals/recommendations/external';
const cases = data.cases as unknown as ExternalCase[];
const answer = (id: string): Answers => structuredClone(cases.find(c => c.id === id)!.answers);
describe('explicit engineering requirements', () => {
  it('retains requirements through shared links and rejects invalid values', () => {
    const a = answer('remote');
    expect(decodeAnswers(resultCode(a))?.requirements).toEqual(['embedded', 'sandbox']);
    expect(effectiveAnswers(a).requirements).toEqual(a.requirements);
    expect(decodeAnswers(resultCode({ ...a, requirements: ['bogus'] as never }))?.requirements).toBeUndefined();
    delete a.requirements;
    expect(isComplete(a)).toBe(true);
  });
  it('requires human approval on every Oversee completion, including at high volume', () => {
    const c = cases.find(c => c.id === 'oversee')!;
    for (const volume of ['daily', 'high'] as const) {
      const a = { ...c.answers, volume }, r = recommend(a), bp = buildBlueprint(r, a);
      expect(r.autonomy.level).toBeLessThanOrEqual(2);
      expect(gradeExternal(c, r, bp).every(check => check.pass)).toBe(true);
    }
  });
  it('does not execute fixed writes before explicit approval', () => {
    const a: Answers = { ...answer('bordr'), requirements: ['approval'] };
    const r = recommend(a), bp = buildBlueprint(r, a);
    expect(r.autonomy.level).toBe(2);
    for (const node of bp.nodes.filter(n => n.kind === 'fixed')) {
      expect(node.what).toContain('Do not write');
      expect(node.gates.some(g => g.kind === 'human')).toBe(true);
    }
  });
  it('supports one embedded agent regardless of manual/event trigger without requiring specialists', () => {
    for (const trigger of ['manual', 'event'] as const) {
      const a = { ...answer('remote'), trigger }, r = recommend(a);
      expect(r.tools.filter(t => t.core).map(t => t.tool)).toEqual(['langgraph']);
      expect(buildBlueprint(r, a).nodes.filter(n => n.engine?.kind === 'model' && n.engine.role === 'specialist')).toHaveLength(0);
      expect(r.gotchas.some(g => g.body.includes('does not provide a secure sandbox'))).toBe(true);
    }
  });
  it('discloses missing developer ownership and data-platform comparison limits', () => {
    const r = recommend({ ...answer('remote'), team: 'small' });
    expect(r.gotchas.some(g => g.body.includes('Arrange developer ownership'))).toBe(true);
    const d = recommend(answer('discord'));
    expect(d.gotchas.some(g => g.body.includes('does not evaluate Dagster or dbt'))).toBe(true);
  });
});
