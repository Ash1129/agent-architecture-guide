// Live local smoke test. Uses an isolated n8n user folder and synthetic localhost endpoints.
// Run: node scripts/smoke/n8n.mjs [--allow-routing-failure]
import { createServer as viteServer } from 'vite';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = resolve('outputs/n8n-smoke');
mkdirSync(output, { recursive: true });
const isolated = mkdtempSync(join(tmpdir(), 'aag-n8n-smoke-'));
const env = {
  PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR || tmpdir(),
  N8N_USER_FOLDER: isolated, DB_TYPE: 'sqlite',
  N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false',
  N8N_TEMPLATES_ENABLED: 'false', N8N_PERSONALIZATION_ENABLED: 'false',
  N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'true', N8N_RUNNERS_ENABLED: 'false',
  N8N_COMMUNITY_PACKAGES_ENABLED: 'false', N8N_SECURE_COOKIE: 'false',
  N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_HOST: '127.0.0.1', N8N_PROTOCOL: 'http',
  GENERIC_TIMEZONE: 'America/New_York', TZ: 'America/New_York',
};
const report = { checks: [], limitations: ['Tests installed n8n only; no AI model, MCP, approval or real app credentials are exercised.', 'Duplicate prevention is implemented by the mock destination, not automatically by n8n.'] };
let serverProcess;
let serverLog = '';
const records = new Map(); const attempts = []; const alerts = [];
const mock = createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  let payload; try { payload = JSON.parse(body || '{}'); } catch { res.writeHead(400).end(); return; }
  attempts.push({ path: req.url, payload });
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/write') {
    const duplicate = records.has(payload.id);
    if (!duplicate) records.set(payload.id, payload);
    // First request commits but reports failure, requiring a replay-safe retry.
    res.writeHead(duplicate ? 200 : 503).end(JSON.stringify({ id: payload.id, duplicate }));
  } else if (req.url === '/fail') res.writeHead(503).end(JSON.stringify({ error: 'synthetic outage' }));
  else if (req.url === '/alert') { alerts.push(payload); res.end(JSON.stringify({ received: true })); }
  else res.writeHead(404).end('{}');
});
const listen = (server) => new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', () => yes(server.address().port)); });
const pause = ms => new Promise(r => setTimeout(r, ms));
async function cli(label, args) {
  const child = spawn('n8n', args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', b => log += b); child.stderr.on('data', b => log += b);
  const timer = setTimeout(() => child.kill('SIGTERM'), 60000);
  const code = await new Promise((yes, no) => { child.on('error', no); child.on('close', yes); });
  clearTimeout(timer); writeFileSync(join(output, `${label}.log`), log);
  assert.equal(code, 0, `${label} failed; inspect ${label}.log`);
  return log;
}
function node(name, type, parameters, extra = {}) { return { name, id: name.replace(/\W/g, ''), type: `n8n-nodes-base.${type}`, typeVersion: 1, parameters, position: [0, 0], ...extra }; }
function chain(id, nodes, settings = {}) {
  return { id, name: id, active: false, nodes, settings: { executionOrder: 'v1', ...settings }, connections: Object.fromEntries(nodes.slice(0, -1).map((n, i) => [n.name, { main: [[{ node: nodes[i + 1].name, type: 'main', index: 0 }]] }])) };
}
async function importWorkflow(w) {
  const path = join(output, `${w.id}.json`); writeFileSync(path, JSON.stringify(w, null, 2));
  await cli(`import-${w.id}`, ['import:workflow', `--input=${path}`]);
}
async function execute(id, label = id) {
  const log = await cli(`execute-${label}`, ['execute', `--id=${id}`, '--rawOutput']);
  const start = log.indexOf('{\n  "');
  assert.ok(start >= 0, 'Execution JSON missing');
  const data = JSON.parse(log.slice(start));
  assert.ok(!data.data.resultData.error, JSON.stringify(data.data.resultData.error));
  return data.data.resultData.runData;
}
function passed(name, evidence) { report.checks.push({ name, status: 'passed', evidence }); console.log(`PASS ${name}`); }
try {
  report.version = (await cli('version', ['--version'])).trim();
  const port = await listen(mock); const url = `http://127.0.0.1:${port}`;
  const vite = await viteServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  let generated;
  try {
    const { recommend } = await vite.ssrLoadModule('/src/lib/rules.ts');
    const { buildBlueprint } = await vite.ssrLoadModule('/src/lib/blueprint.ts');
    const { buildStarterKit } = await vite.ssrLoadModule('/src/lib/starter.ts');
    const a = { task: 'Route synthetic invoice reminders', shape: 'rules', systems: 'act', trigger: 'manual', volume: 'daily', risks: ['none'], location: 'open', team: 'small' };
    const r = recommend(a); const kit = buildStarterKit(r, buildBlueprint(r, a), a);
    generated = JSON.parse(kit.files.find(f => f.path === 'n8n/workflow.json').content);
  } finally { await vite.close(); }
  generated.id = 'SmokeGenerated'; await importWorkflow(generated);
  await execute(generated.id); passed('Unmodified generated scaffold imports and executes', 'Manual-trigger, rules-only export; placeholders are not business logic.');
  const routed = structuredClone(generated); routed.id = 'SmokeRouting';
  const rules = routed.nodes.find(n => n.type === 'n8n-nodes-base.code' && n.parameters.jsCode.includes('Decision table'));
  rules.parameters.jsCode = `return [{json:{id:'A',route:'match'}},{json:{id:'B',route:'no match'}}];`;
  await importWorkflow(routed); const run = await execute(routed.id);
  const idsAt = name => (run[name] || []).flatMap(x => (x.data.main || []).flat().filter(Boolean).map(i => i.json.id));
  const matched = idsAt('3. Matching action'); const unmatched = idsAt('4. Default action');
  try { assert.deepEqual(matched, ['A']); assert.deepEqual(unmatched, ['B']); passed('Generated IF routes match and no match separately', { matched, unmatched }); }
  catch (e) { report.checks.push({ name: 'Generated IF routing', status: 'failed', evidence: { matched, unmatched } }); if (!process.argv.includes('--allow-routing-failure')) throw e; }
  const http = (name, endpoint, body) => node(name, 'httpRequest', { method: 'POST', url: url + endpoint, sendBody: true, specifyBody: 'json', jsonBody: body, options: { timeout: 3000 } }, { typeVersion: 4.2, retryOnFail: true, maxTries: 3, waitBetweenTries: 100 });
  await importWorkflow(chain('SmokeRetry', [node('Start', 'manualTrigger', {}), http('Write safely', '/write', JSON.stringify({ id: 'synthetic-invoice-A', amount: 25 }))]));
  await execute('SmokeRetry', 'retry-first'); await execute('SmokeRetry', 'retry-replay');
  assert.equal(attempts.filter(a => a.path === '/write').length, 3); assert.equal(records.size, 1);
  passed('Retry and replay avoid duplicate effects at an idempotent destination', { attempts: 3, records: 1 });
  await importWorkflow(chain('SmokeErrors', [node('Error event', 'errorTrigger', {}), http('Record alert', '/alert', '={{ JSON.stringify($json) }}')]));
  const failing = chain('SmokeFailure', [node('Incoming event', 'webhook', { httpMethod: 'POST', path: 'smoke-failure', responseMode: 'onReceived', options: {} }, { typeVersion: 2, webhookId: 'smoke-failure' }), http('Fail after retries', '/fail', '{}')], { errorWorkflow: 'SmokeErrors' });
  await importWorkflow(failing); await cli('activate', ['update:workflow', '--id=SmokeFailure', '--active=true']);
  const probe = createServer(); env.N8N_PORT = String(await listen(probe)); await new Promise(r => probe.close(r));
  serverProcess = spawn('n8n', ['start'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProcess.stdout.on('data', b => serverLog += b); serverProcess.stderr.on('data', b => serverLog += b);
  const base = `http://127.0.0.1:${env.N8N_PORT}`;
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/healthz/readiness')).ok) { ready = true; break; } } catch {} await pause(300); }
  assert.ok(ready, `n8n server did not become ready: ${serverLog.slice(-1200)}`);
  let response;
  for (let i = 0; i < 100; i++) {
    response = await fetch(base + '/webhook/smoke-failure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (response.status !== 404) break;
    await pause(200);
  }
  assert.ok(response.ok, `Webhook returned ${response.status}`);
  for (let i = 0; i < 100 && !alerts.length; i++) await pause(200);
  assert.equal(attempts.filter(a => a.path === '/fail').length, 3);
  assert.equal(alerts.length, 1); assert.equal(alerts[0].workflow.id, 'SmokeFailure');
  passed('Real webhook failure exhausts retries and runs Error Trigger', { attempts: 3, alerts: 1, workflowId: alerts[0].workflow.id });
  writeFileSync(join(output, 'server.log'), serverLog);
} catch (e) { report.error = e.message; process.exitCode = 1; console.error(e.message); }
finally {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
    await Promise.race([new Promise(r => serverProcess.once('close', r)), pause(5000)]);
    if (serverProcess.exitCode === null) { serverProcess.kill('SIGKILL'); await new Promise(r => serverProcess.once('close', r)); }
  }
  if (mock.listening) await new Promise(r => mock.close(r));
  writeFileSync(join(output, 'server.log'), serverLog);
  report.mock = { attempts, records: [...records.values()], alerts };
  report.isolatedDatabaseRemoved = true;
  rmSync(isolated, { recursive: true, force: true });
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Report: ${join(output, 'report.json')}`);
}
