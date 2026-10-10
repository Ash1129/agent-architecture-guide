import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('../', import.meta.url));
const datasetText = readFileSync(resolve(root, 'evals/recommendations/external-cases.json'), 'utf8');
const dataset = JSON.parse(datasetText);
const auditText = readFileSync(resolve(root, 'evals/recommendations/assumption-evidence.json'), 'utf8');
const audit = JSON.parse(auditText);
const sha = text => createHash('sha256').update(text).digest('hex');
const sourceFiles = ['src/lib/rules.ts', 'src/lib/blueprint.ts', 'src/lib/models.ts', 'src/lib/questions.ts', 'src/lib/catalog.ts', 'evals/recommendations/external.ts', 'scripts/evaluate-external-guide.mjs'];
const server = await createServer({ root, configFile: false, envFile: false, appType: 'custom', server: { middlewareMode: true, watch: null, hmr: false, ws: false }, logLevel: 'error' });
try {
  const { evaluateExternal } = await server.ssrLoadModule('/evals/recommendations/external.ts');
  const results = evaluateExternal(dataset.cases);
  const checks = results.flatMap(r => r.checks);
  const report = {
    generatedAt: new Date().toISOString(), gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    datasetVersion: dataset.version, datasetHash: sha(datasetText), sourceFiles,
    implementationHash: sha(sourceFiles.map(p => p + '\n' + readFileSync(resolve(root, p), 'utf8')).join('\n')),
    assumptionAuditHash: sha(auditText), assumptionAuditSummary: audit.summary,
    authorship: dataset.authorship, overallStatus: 'REVIEW_REQUIRED',
    scope: 'Scoped adaptations of published cases. Broad structural checks only; manual criteria remain unresolved. No live execution, independent review, or optimal-tool benchmark. Links were opened during research; this command does not recheck them.',
    summary: { cases: results.length, checksPassed: checks.filter(c => c.pass).length, checksTotal: checks.length, sensitivityVariants: results.reduce((n, r) => n + r.sensitivity.length, 0), changedVariants: results.reduce((n, r) => n + r.sensitivity.filter(v => v.changed).length, 0), manualCriteriaPending: results.reduce((n, r) => n + r.manualCriteria.length, 0) }, results,
  };
  const lines = ['# External case evaluation', '', report.scope, '', report.authorship, '',
    `Overall status: **${report.overallStatus}**`, `Automated checks: ${report.summary.checksPassed}/${report.summary.checksTotal}. Manual criteria pending: ${report.summary.manualCriteriaPending}.`, '',
    `- Assumption evidence: [all 37 entries](../../../evals/recommendations/assumption-evidence.md)`,
    `- Evidence results: ${JSON.stringify(audit.summary)}`,
    `- One-field uncertainty variants: ${report.summary.sensitivityVariants}; changed decisions: ${report.summary.changedVariants}. These are hypothetical probes, not additional customer cases.`,
    `- Commit: ${report.gitCommit}`, `- Dataset SHA-256: ${report.datasetHash}`, `- Implementation SHA-256: ${report.implementationHash}`, '',
    '| Case | Guide approach | Guide main platform | Structural checks | Overall |', '| --- | --- | --- | --- | --- |',
    ...results.map(r => `| ${r.company} | ${r.recommendation.approach.id} | ${r.recommendation.tools.filter(t => t.core).map(t => t.tool).join(', ')} | ${r.checks.filter(c => c.pass).length}/${r.checks.length} | Review required |`), '',
    'A platform mismatch is a review prompt, not an automatic failure. The observed stack is excluded from grading. Source selection and encodings were not blinded; unknown inputs can change the recommendation.', ''];
  for (const r of results) {
    lines.push(`## ${r.company}`, '', `[Source: ${r.source.publisher}](${r.source.url}) — section: ${r.source.section}. Opened ${r.source.checkedOn}.`, '',
      ...r.source.facts.map(f => `- Reported fact: ${f}`), '', `Scoped task: ${r.brief}`, '', `Observed stack (context only): ${r.observedStack.join(', ')}.`,
      ...(r.outsideCatalog.length ? [`Catalog coverage to review: ${r.outsideCatalog.join(', ')}. This may include supporting libraries rather than missing core platforms.`] : []), '',
      '### Encoded answers and provenance', '', ...Object.entries(r.answers).map(([key, value]) => `- **${key} = ${JSON.stringify(value)}** (${r.answerProvenance[key].kind}): ${r.answerProvenance[key].note}${(r.answerProvenance[key].evidenceIds ?? []).map(id => ` [${audit.sources[id].title}](${audit.sources[id].url})`).join('')}`), '',
      '### Structural checks', '', ...r.checks.map(c => `- ${c.pass ? 'PASS' : 'FAIL'}: ${c.name}. Expected ${JSON.stringify(c.expected)}; observed ${JSON.stringify(c.actual)}.`), '',
      '### Manual review still required', '', ...r.manualCriteria.map(c => `- [ ] ${c}`), '',
      '### One-field sensitivity probes', '', ...r.sensitivity.map(v => `- ${v.field}: ${JSON.stringify(v.baselineValue)} → ${JSON.stringify(v.value)}. ${v.changed ? 'CHANGED' : 'Same decision summary'}: ${JSON.stringify(v.decision)}. ${v.reason}`), '',
      '### Guide output for review', '', `Approach: ${r.recommendation.approach.title}.`, `Tools: ${r.recommendation.tools.map(t => `${t.tool}: ${t.role}`).join('; ')}.`,
      `Autonomy: ${r.recommendation.autonomy.level}.`, ...r.recommendation.gotchas.map(g => `- ${g.title}: ${g.body}`), '');
  }
  const out = resolve(root, 'outputs/guide-eval/external'); mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(resolve(out, 'latest.md'), lines.join('\n'));
  console.log(`${report.summary.checksPassed}/${report.summary.checksTotal} structural checks; ${report.summary.manualCriteriaPending} manual criteria pending. Overall REVIEW_REQUIRED.`);
  console.log(resolve(out, 'latest.md'));
  if (checks.some(c => !c.pass)) process.exitCode = 1;
} finally { await server.close(); }
