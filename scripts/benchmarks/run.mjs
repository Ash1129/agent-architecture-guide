import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as viteServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repetitions = Number(process.env.BENCHMARK_TRIALS || 3);
if (!Number.isInteger(repetitions) || repetitions < 2 || repetitions > 20) throw Error('Use 2–20 repeated trials.');
const python = process.env.BENCHMARK_AIRFLOW_PYTHON || '/private/tmp/aag-airflow-benchmark/bin/python';
const out = resolve(root, 'outputs/benchmarks', new Date().toISOString().replaceAll(':','-'));
mkdirSync(out, { recursive:true });
const isolated = mkdtempSync(join(tmpdir(), 'aag-benchmark-'));
const datasetText = readFileSync(join(root, 'evals/benchmarks/order-processing.json'), 'utf8');
const dataset = JSON.parse(datasetText);
const common = { PATH:process.env.PATH, HOME:isolated, TMPDIR:process.env.TMPDIR || tmpdir(), TZ:'UTC', NO_COLOR:'1' };
const nenv = { ...common, N8N_USER_FOLDER:join(isolated,'n8n'), DB_TYPE:'sqlite', N8N_DIAGNOSTICS_ENABLED:'false', N8N_VERSION_NOTIFICATIONS_ENABLED:'false', N8N_TEMPLATES_ENABLED:'false', N8N_PERSONALIZATION_ENABLED:'false', N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS:'true', N8N_RUNNERS_ENABLED:'false', N8N_COMMUNITY_PACKAGES_ENABLED:'false', GENERIC_TIMEZONE:'UTC' };
const aenv = { ...common, AIRFLOW_HOME:join(isolated,'airflow'), AIRFLOW__CORE__LOAD_EXAMPLES:'false', AIRFLOW__CORE__EXECUTOR:'LocalExecutor', AIRFLOW__CORE__DAGS_FOLDER:join(root,'scripts/benchmarks'), AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION:'false', AIRFLOW__CORE__UNIT_TEST_MODE:'true' };
async function command(binary, args, env, timeoutMs=60000) {
  const start = performance.now();
  return await new Promise(resolveResult => {
    const child = spawn(binary,args,{cwd:root,env,stdio:['ignore','pipe','pipe']});
    let log='', timedOut=false, spawnError;
    child.stdout.on('data', b=>log+=b); child.stderr.on('data',b=>log+=b);
    child.on('error',e=>{spawnError=e.message;});
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},timeoutMs);
    child.on('close',code=>{clearTimeout(timer);resolveResult({code, log, timedOut, spawnError, runtimeMs:performance.now()-start});});
  });
}
const states = new Map();
const fixture = createServer(async(req,res)=>{
  const [key,action] = req.url.slice(1).split('/'); const state=states.get(key);
  res.setHeader('Content-Type','application/json');
  if (!state) { res.writeHead(404).end('{}'); return; }
  if (action==='input' && req.method==='GET') {
    state.started ??= performance.now();
    res.end(JSON.stringify({orders:state.scenario.orders,settings:dataset.settings})); return;
  }
  if (action==='write' && req.method==='POST') {
    let body=''; for await(const b of req) body+=b;
    let record;try {record=JSON.parse(body);}catch {res.writeHead(400).end('{}');return;}
    state.attempts.push(record);
    const duplicate=state.records.has(record.id);
    const fault=state.scenario.fault;
    const status=fault==='always-503'||(fault==='commit-then-503'&&!duplicate)?503:200;
    if(fault!=='always-503'&&!duplicate) state.records.set(record.id,record);
    state.events.push({record,status,committed:fault!=='always-503'&&!duplicate,duplicate});
    res.writeHead(status).end(JSON.stringify({id:record.id,duplicate}));return;
  }
  res.writeHead(404).end('{}');
});
const node=(name,type,parameters,extra={})=>({id:name,name,type:`n8n-nodes-base.${type}`,typeVersion:1,parameters,position:[0,0],...extra});
function workflow(endpoint) {
  const nodes=[node('Start','manualTrigger',{}),node('Input','httpRequest',{url:endpoint+'/input',options:{timeout:3000}},{typeVersion:4.2}),
    node('Approve','code',{jsCode:'return $input.first().json.orders.filter(o => o.approved === true).map(o => ({json:{id:o.id,amount:o.amount}}));'},{typeVersion:2}),
    node('Write','httpRequest',{method:'POST',url:endpoint+'/write',sendBody:true,specifyBody:'json',jsonBody:'={{ JSON.stringify($json) }}',options:{timeout:dataset.settings.requestTimeoutMs}}, {typeVersion:4.2,retryOnFail:true,maxTries:dataset.settings.maxAttempts,waitBetweenTries:dataset.settings.retryDelayMs})];
  return {id:'BenchmarkOrders',name:'Synthetic benchmark orders',active:false,nodes,settings:{executionOrder:'v1'},connections:Object.fromEntries(nodes.slice(0,-1).map((n,i)=>[n.name,{main:[[{node:nodes[i+1].name,type:'main',index:0}]]}]))};
}
let vite;
const trials=[];
try {
  const versions={};
  for(const [platform,binary,args,env] of [['n8n','n8n',['--version'],nenv],['airflow',python,['-c','import airflow; print(airflow.__version__)'],aenv]]) {
    const v=await command(binary,args,env);
    if(v.code!==0) throw Error(`${platform} is unavailable: ${v.spawnError || v.log.slice(-1000)}`);
    versions[platform]=v.log.trim();
  }
  const setup=await command(python,['-m','airflow','db','migrate'],aenv,120000);
  writeFileSync(join(isolated,'airflow-setup.log'),setup.log);
  if(setup.code!==0) throw Error(`Airflow setup failed. See ${isolated}/airflow-setup.log`);
  const serialized=await command(python,['-m','airflow','dags','reserialize'],aenv,60000);
  writeFileSync(join(isolated,'airflow-serialize.log'),serialized.log);
  if(serialized.code!==0) throw Error(`Airflow serialization failed. See ${isolated}/airflow-serialize.log`);
  await new Promise((yes,no)=>{fixture.once('error',no);fixture.listen(0,'127.0.0.1',yes);});
  const origin=`http://127.0.0.1:${fixture.address().port}`;
  vite=await viteServer({root,configFile:false,envFile:false,appType:'custom',server:{middlewareMode:true,watch:null,hmr:false,ws:false},logLevel:'error'});
  const {grade,summarize,parseN8nResult}=await vite.ssrLoadModule('/evals/benchmarks/metrics.ts');
  const {shortlist}=await vite.ssrLoadModule('/src/lib/shortlist.ts');
  const candidates=shortlist(dataset.answers).candidates.map(c=>c.tool);
  if(JSON.stringify(candidates)!==JSON.stringify(['n8n','airflow'])) throw Error('Fixture no longer produces the intended shortlist.');
  for(let repetition=1;repetition<=repetitions;repetition++) {
    for(const scenario of dataset.cases) {
      const order=repetition%2?['n8n','airflow']:['airflow','n8n'];
      for(const platform of order) {
        const key=randomUUID(), endpoint=origin+'/'+key;
        const state={scenario,records:new Map(),attempts:[],events:[],started:null};states.set(key,state);
        if(platform==='n8n') {
          const path=join(isolated,'workflow.json');writeFileSync(path,JSON.stringify(workflow(endpoint)));
          const imported=await command('n8n',['import:workflow',`--input=${path}`],nenv);
          if(imported.code!==0) {writeFileSync(join(isolated,'n8n-import.log'),imported.log);throw Error(`n8n import failed: ${isolated}/n8n-import.log`);}
        }
        const run=platform==='n8n'?await command('n8n',['execute','--id=BenchmarkOrders','--rawOutput'],nenv):await command(python,['scripts/benchmarks/airflow-orders.py'],{...aenv,BENCHMARK_ENDPOINT:endpoint});
        const workMs=state.started===null?null:performance.now()-state.started;
        const stem=`${repetition}-${scenario.id}-${platform}`;
        writeFileSync(join(isolated,stem+'.log'),run.log);
        let completed=false, infrastructureError;
        if(run.timedOut||run.spawnError||state.started===null) infrastructureError=run.spawnError||'Timed out or did not reach the fixture input.';
        if(platform==='n8n') {
          try {const parsed=parseN8nResult(run.log); completed=run.code===0&&!parsed.error;}
          catch { infrastructureError='Could not verify n8n execution result.'; }
        } else {
          const marker=run.log.match(/BENCHMARK_COMPLETED=(true|false)/);
          if(!marker) infrastructureError='Could not verify Airflow DAG completion.';
          completed=run.code===0&&marker?.[1]==='true';
        }
        const observation={completed,records:[...state.records.values()],attempts:state.attempts,runtimeMs:run.runtimeMs,workMs,apiCostUsd:0,totalCostUsd:null,humanInterventions:null,...(infrastructureError?{infrastructureError}:{})};
        const trial={platform,caseId:scenario.id,repetition,...observation,...grade(scenario,observation),events:state.events,logPath:join(isolated,stem+'.log')};
        trials.push(trial); states.delete(key);
        writeFileSync(join(out,'trials.json'),JSON.stringify(trials,null,2));
        console.log(`${repetition}/${repetitions} ${platform} ${scenario.id}: ${trial.safeHandling?'safe handling PASS':'FAIL'}; task ${trial.taskSuccess?'complete':'not complete'}`);
        if(infrastructureError) throw Error(`${infrastructureError} Inspect ${trial.logPath}`);
      }
    }
  }
  const sourceFiles=['scripts/benchmarks/run.mjs','scripts/benchmarks/airflow-orders.py','evals/benchmarks/metrics.ts','src/lib/shortlist.ts'];
  const sha=x=>createHash('sha256').update(x).digest('hex');
  const report={generatedAt:new Date().toISOString(),evidence:'tested on synthetic sample cases',versions,repetitions,provenance:dataset.provenance,settings:dataset.settings,datasetHash:sha(datasetText),implementationHash:sha(sourceFiles.map(f=>f+'\n'+readFileSync(join(root,f),'utf8')).join('\n')),sourceFiles,
    limitations:['Not user examples; not a company system reproduction.','No AI model, response-quality grading or agent reasoning measured.','Local CLI / dag.test execution; schedulers, distributed workers and production throughput not tested.','Latency includes process startup; imports and initial database setup excluded. Work timing runs from input read to process exit.','Idempotency is supplied by the mock destination; this is not an automatic platform guarantee.','Approvals are scripted fixture values, not live human decisions; human intervention and total cost are unmeasured.','HTTP retry behavior only; no process-crash recovery tested.','Three repetitions by default are a smoke benchmark, not statistical proof of superiority.'],summary:summarize(trials),trials};
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
  const fmt=v=>v===null?'Not measured':typeof v==='number'?v.toFixed(2):v;
  writeFileSync(join(out,'report.md'),['# Local workflow benchmark','',report.evidence,'',report.provenance,'',`Versions: n8n ${versions.n8n}; Airflow ${versions.airflow}`,'','| Platform | Task success | Safe handling | Transient recovery | Median cold runtime (ms) | p95 cold runtime (ms) | Total cost / success | Human interventions |','| --- | --- | --- | --- | --- | --- | --- | --- |',...report.summary.map(s=>`| ${s.platform} | ${s.successes}/${s.trials} | ${fmt(s.safeHandlingRate*100)}% | ${fmt(s.recoverySuccessRate===null?null:s.recoverySuccessRate*100)}% | ${fmt(s.runtimeMedianMs)} | ${fmt(s.runtimeP95Ms)} | ${fmt(s.costPerSuccessfulResultUsd)} | ${fmt(s.humanInterventions)} |`),'','The persistent-outage case counts as an incomplete business task even when handled safely. API spend is $0 because no model or paid service is called. Total cost is unknown.','',...report.limitations.map(s=>'- '+s),'','No platform winner is inferred from this run. See report.json and trials.json for per-trial state, write attempts and fault evidence.',''].join('\n'));
  console.log(`Report: ${out}/report.md`);
  if(trials.some(t=>!t.safeHandling)) process.exitCode=1;
} catch(error) {
  writeFileSync(join(out,'blocked.json'),JSON.stringify({error:String(error),completedTrials:trials.length,isolated},null,2));
  console.error(String(error));process.exitCode=1;
} finally {
  if(vite) await vite.close();
  await new Promise(resolveClose=>fixture.close(resolveClose));
}
