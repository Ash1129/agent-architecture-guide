import { describe, it, expect } from 'vitest';
import { shortlist } from '../src/lib/shortlist';
import { recommend } from '../src/lib/rules';
import type { Answers } from '../src/lib/questions';
import synthetic from '../evals/recommendations/cases.json';
import external from '../evals/recommendations/external-cases.json';
const base: Answers = { task: 'Process the scheduled batch', shape: 'rules', systems: 'act', trigger: 'schedule', volume: 'daily', risks: ['none'], location: 'open', team: 'large' };
describe('implementation shortlist', () => {
  it('compares scheduled developer workflows without adding AI', () => {
    const s = shortlist(base);
    expect(s.candidates.map(c => c.tool)).toEqual(['n8n', 'airflow']);
    expect(s.approach).toBe('automation');
  });
  it('does not manufacture an alternative without developer ownership', () => {
    expect(shortlist({ ...base, team: 'small' }).candidates.map(c => c.tool)).toEqual(['n8n']);
  });
  it('preserves all approval and hosting obligations in both options', () => {
    const a: Answers = { ...base, requirements: ['approval'], location: 'residency', risks: ['irreversible'] };
    const r = recommend(a), s = shortlist(a);
    expect(s.autonomy).toEqual(r.autonomy);
    for (const c of s.candidates) {
      expect(c.obligations).toEqual(expect.arrayContaining([...r.autonomy.checkpoints, ...r.autonomy.guardrails]));
      expect(c.obligations.join(' ')).toContain(r.hosting.body);
    }
  });
  it('compares agent implementations without adding specialists or changing input', () => {
    const a: Answers = { ...base, shape: 'varies', roles: 'one', quality: 'clear', knowledge: ['none'], trigger: 'event', kinds: 'no' };
    const before = JSON.stringify(a), s = shortlist(a);
    expect(s.candidates.map(c => c.tool)).toEqual(['n8n-agent', 'langgraph']);
    expect(s.approach).toBe('agent');
    expect(JSON.stringify(a)).toBe(before);
    expect(shortlist({ ...a, requirements: ['sandbox'] }).candidates.map(c => c.tool)).toEqual(['langgraph']);
    expect(shortlist({ ...a, requirements: ['sandbox'], team: 'small' }).candidates).toHaveLength(0);
  });
  it('includes n8n for manual and scheduled Claude agents while retaining requirements', () => {
    for (const trigger of ['manual', 'schedule'] as const) {
      for (const team of ['small', 'mid', 'large'] as const) {
        const a: Answers = { ...base, shape: 'varies', roles: 'one', quality: 'clear', knowledge: ['none'], kinds: 'no', trigger, team, requirements: ['approval'] };
        const s = shortlist(a);
        expect(s.candidates.map(c => c.tool)).toEqual(['cowork', 'n8n-agent']);
        expect(s.autonomy.level).toBeLessThanOrEqual(2);
        expect(s.candidates[1].obligations).toEqual(expect.arrayContaining(recommend(a).autonomy.checkpoints));
        expect(shortlist({ ...a, requirements: ['sandbox'] }).candidates.map(c => c.tool)).not.toContain('n8n-agent');
        expect(shortlist({ ...a, knowledge: ['memory'] }).candidates.map(c => c.tool)).not.toContain('n8n-agent');
      }
    }
  });
  it('blocks unsupported asset requirements and incomplete inputs', () => {
    expect(shortlist({ ...base, requirements: ['assets'] }).candidates).toHaveLength(0);
    expect(() => shortlist({})).toThrow();
  });
  it('audits every platform and never labels a design benchmarked across the evaluation corpus', () => {
    for (const c of [...synthetic.cases, ...external.cases]) {
      const a = c.answers as Answers, s = shortlist(a);
      expect(s.candidates.length).toBeLessThanOrEqual(2);
      expect(new Set([...s.candidates, ...s.excluded].map(x => x.tool)).size).toBe(7);
      for (const candidate of s.candidates) {
        expect(candidate.evidence).toBe('recommended by rules');
        if (a.location === 'restricted' || a.location === 'independence') expect(['claude', 'cowork']).not.toContain(candidate.tool);
      }
    }
  });
});
