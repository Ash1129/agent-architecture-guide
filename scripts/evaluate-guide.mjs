import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const datasetPath = resolve(root, 'evals/recommendations/cases.json');
const datasetText = readFileSync(datasetPath, 'utf8');
const dataset = JSON.parse(datasetText);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const sourceFiles = ['src/lib/rules.ts', 'src/lib/blueprint.ts', 'src/lib/models.ts', 'src/lib/questions.ts', 'src/lib/catalog.ts', 'evals/recommendations/evaluate.ts'];
const gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
// No listener, no project Vite plugins, no environment-file loading, no model calls.
const server = await createServer({ root, configFile: false, envFile: false, appType: 'custom', server: { middlewareMode: true, watch: null, hmr: false, ws: false }, logLevel: 'error' });
try {
  const { evaluate, summarize } = await server.ssrLoadModule('/evals/recommendations/evaluate.ts');
  const results = evaluate(dataset.cases);
  const summary = summarize(results);
  const report = {
    generatedAt: new Date().toISOString(), gitCommit,
    datasetVersion: dataset.version, datasetHash: sha(datasetText),
    implementationHash: sha(sourceFiles.map((p) => p + '\n' + readFileSync(resolve(root, p), 'utf8')).join('\n')),
    sourceFiles, reviewStatus: 'Provisional synthetic cases; independent human review pending',
    scope: 'Deterministic recommendations and blueprint safeguards only. No AI interview, AI-generated design, live tools or model quality measured.',
    thresholds: { casePassRate: 0.9, eachDimensionPassRate: 0.9, criticalFailures: 0 },
    summary, results,
  };
  const clean = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const lines = ['# Recommendation-quality evaluation', '', report.reviewStatus, '', report.scope, '',
    `- Commit: ${gitCommit}`, `- Dataset SHA-256: ${report.datasetHash}`, `- Implementation SHA-256: ${report.implementationHash}`,
    `- Cases passed: ${summary.passed}/${summary.total}`, `- Critical failures: ${summary.criticalFailures}`,
    `- Independently reviewed cases: ${summary.reviewed}/${summary.total}`, `- Provisional regression gate: ${summary.gatePassed ? 'PASS' : 'FAIL'}`,
    '', 'Gate: at least 90% of cases and checks in each dimension, with zero critical failures.', '',
    '| Dimension | Checks passed |', '| --- | --- |', ...Object.entries(summary.dimensions).map(([d, v]) => `| ${d} | ${v.passed}/${v.total} |`), '',
    '| Case | Category | Result |', '| --- | --- | --- |', ...results.map((r) => `| ${r.id} | ${r.category} | ${r.pass ? 'PASS' : 'FAIL'} |`), '', '## Findings', ''];
  for (const r of results.filter((r) => !r.pass)) {
    lines.push(`### ${r.id}`, '', r.rationale, '');
    for (const c of r.checks.filter((c) => !c.pass)) lines.push(`- ${c.critical ? 'CRITICAL: ' : ''}${c.name}. Expected: ${clean(JSON.stringify(c.expected))}. Observed: ${clean(JSON.stringify(c.actual))}.`);
    lines.push('');
  }
  if (results.every((r) => r.pass)) lines.push('No violations of the authored expectations were found. This is not evidence of optimal tool selection or production readiness.', '');
  lines.push('## Review required', '', 'Approve or revise the scenario expectations with a domain reviewer before treating this dataset as an independent quality benchmark. Thresholds are initial project policy, not a statistical guarantee.', '');
  const out = resolve(root, 'outputs/guide-eval');
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(resolve(out, 'latest.md'), lines.join('\n'));
  console.log(`${summary.passed}/${summary.total} cases passed; ${summary.criticalFailures} critical failures; provisional gate ${summary.gatePassed ? 'PASS' : 'FAIL'}.`);
  console.log(`Report: ${resolve(out, 'latest.md')}`);
  if (!summary.gatePassed) process.exitCode = 1;
} finally {
  await server.close();
}
