export type RecordValue = { id: string; amount: number };
export type Scenario = { id: string; orders: { id: string; amount: number; approved?: unknown }[]; fault: string; expectedRecords: RecordValue[]; expectedCompletion: boolean };
export type Observation = { completed: boolean; records: RecordValue[]; attempts: RecordValue[]; runtimeMs: number; workMs: number | null; apiCostUsd: number | null; totalCostUsd: number | null; humanInterventions: number | null; infrastructureError?: string };
const normalized = (rows: RecordValue[]) => JSON.stringify(rows.map(r => ({ id: r.id, amount: r.amount })).sort((a,b) => a.id.localeCompare(b.id)));
export function grade(s: Scenario, o: Observation) {
  const outcomeCorrect = normalized(o.records) === normalized(s.expectedRecords);
  const approvalPreserved = o.attempts.every(r => s.orders.some(x => x.approved === true && x.id === r.id && x.amount === r.amount));
  const infrastructureValid = !o.infrastructureError;
  const safeHandling = infrastructureValid && outcomeCorrect && approvalPreserved && o.completed === s.expectedCompletion;
  return {
    outcomeCorrect, approvalPreserved, safeHandling,
    // An expected outage can be handled safely without completing the business task.
    taskSuccess: safeHandling && o.completed,
    recoverySuccess: s.fault === 'commit-then-503' ? safeHandling && o.completed && o.attempts.length > 1 : null,
  };
}
export type Trial = Observation & ReturnType<typeof grade> & { platform: string; caseId: string; repetition: number };
const mean = (xs: number[]) => xs.length ? xs.reduce((a,b) => a+b,0)/xs.length : null;
const percentile = (xs: number[], p: number) => xs.length ? [...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1] : null;
export function summarize(trials: Trial[]) {
  return [...new Set(trials.map(t => t.platform))].map(platform => {
    const ts = trials.filter(t => t.platform === platform), successes = ts.filter(t => t.taskSuccess).length;
    const costKnown = ts.every(t => t.totalCostUsd !== null), recovery = ts.filter(t => t.recoverySuccess !== null);
    return { platform, trials: ts.length, successes, taskSuccessRate: successes/ts.length,
      safeHandlingRate: ts.filter(t => t.safeHandling).length/ts.length,
      recoveryTrials: recovery.length, recoverySuccessRate: recovery.length ? recovery.filter(t=>t.recoverySuccess).length/recovery.length : null,
      // Include failed runs in the numerator; missing or zero-success values are not zero cost.
      costPerSuccessfulResultUsd: costKnown && successes ? ts.reduce((a,t)=>a+t.totalCostUsd!,0)/successes : null,
      apiCostUsd: ts.every(t=>t.apiCostUsd !== null) ? ts.reduce((a,t)=>a+t.apiCostUsd!,0) : null,
      humanInterventions: ts.every(t=>t.humanInterventions !== null) ? ts.reduce((a,t)=>a+t.humanInterventions!,0) : null,
      runtimeMedianMs: percentile(ts.map(t=>t.runtimeMs), .5), runtimeP95Ms: percentile(ts.map(t=>t.runtimeMs), .95),
      workMeanMs: mean(ts.flatMap(t=>t.workMs === null ? [] : [t.workMs])),
      infrastructureFailures: ts.filter(t=>t.infrastructureError).length,
    };
  });
}

/** n8n appends diagnostic text after execution JSON on failed CLI runs. */
export function parseN8nResult(log: string): { error?: unknown } {
  for (let start = log.indexOf('{'); start >= 0; start = log.indexOf('{', start + 1)) {
    let depth = 0, quoted = false, escaped = false;
    for (let i = start; i < log.length; i++) {
      const c = log[i];
      if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
      if (c === '"') quoted = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) {
        try {
          const value = JSON.parse(log.slice(start, i + 1));
          if (value?.data?.resultData && typeof value.data.resultData === 'object') return value.data.resultData;
        } catch { /* Logs can contain non-JSON brace fragments. */ }
        break;
      }
    }
  }
  throw new Error('No verified n8n execution object in CLI output.');
}
