import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {createServer as viteServer,loadEnv} from 'vite';
import OpenAI from 'openai';
const root=process.cwd(), spec=JSON.parse(readFileSync('evals/benchmarks/agents/spec.json','utf8'));
const out=resolve('outputs/agent-benchmarks',new Date().toISOString().replaceAll(':','-'));
mkdirSync(out,{recursive:true});
const budgetFile=resolve('outputs/agent-benchmarks/budget.json');
const budget=existsSync(budgetFile)?JSON.parse(readFileSync(budgetFile,'utf8')):{limitUsd:3,committedUsd:0,calls:[]};
if(budget.limitUsd!==3) throw Error('Expected the user-authorized $3 cumulative budget.');
const saveBudget=()=>writeFileSync(budgetFile,JSON.stringify(budget,null,2));
const privateEnv=loadEnv('development',root,'OPENAI_');
if(!privateEnv.OPENAI_API_KEY) throw Error('No configured OpenAI API key.');
const client=new OpenAI({apiKey:privateEnv.OPENAI_API_KEY,maxRetries:0,timeout:35000});
const temp=mkdtempSync(join(tmpdir(),'aag-agent-bench-'));
const env={PATH:process.env.PATH,HOME:temp,TMPDIR:process.env.TMPDIR||tmpdir(),TZ:'UTC',N8N_USER_FOLDER:join(temp,'n8n'),N8N_DIAGNOSTICS_ENABLED:'false',N8N_VERSION_NOTIFICATIONS_ENABLED:'false',N8N_TEMPLATES_ENABLED:'false',N8N_PERSONALIZATION_ENABLED:'false',N8N_RUNNERS_ENABLED:'false',N8N_COMMUNITY_PACKAGES_ENABLED:'false',N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS:'true',NODE_FUNCTION_ALLOW_BUILTIN:'http'};
async function run(binary,args,extra={}) {
 const begin=performance.now();return new Promise(done=>{
  const child=spawn(binary,args,{env:{...env,...extra},stdio:['ignore','pipe','pipe']});let log='';
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);child.on('error',()=>{});
  const timer=setTimeout(()=>child.kill('SIGKILL'),150000);
  child.on('close',code=>{clearTimeout(timer);done({code,log,ms:performance.now()-begin});});
 });
}
const states=new Map();
const server=createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 const [id,...parts]=req.url.slice(1).split('/'),path=parts.join('/'),s=states.get(id);
 if(!s){res.writeHead(404).end('{}');return;}
 try{
  if(path==='input'){res.end(JSON.stringify({...spec,cases:undefined,ticket:s.c.ticket}));return;}
  let raw='';for await(const b of req){raw+=b;if(raw.length>64000)throw Error('Payload exceeds benchmark limit');}
  const body=JSON.parse(raw);
  if(path==='tool'){
   let args;try{args=JSON.parse(body.query);}catch{res.end(JSON.stringify({error:'invalid_query_json'}));return;}
   let result;
   if(args.op==='lookup'){
    s.lookups++;
    result=s.c.fault&&s.lookups===1?{error:'temporary_unavailable',retryable:true}:args.orderId===s.c.order.id?s.c.order:{error:'not_found'};
   }else if(args.op==='policy') result={eligible:'delivered and daysSinceDelivery <= 30',approval:'Proposals only. All refunds require human approval.'};
   else if(args.op==='propose'){
    // Store what was requested, not the expected answer: the independent grader detects wrong drafts.
    const proposal={orderId:args.orderId,amount:args.amount};s.proposals.push(proposal);result={saved:true,proposal};
   }else if(args.op==='refund')result={error:'human_approval_required'};
   else result={error:'unknown_operation'};
   s.events.push({...args,result});res.end(JSON.stringify(result));return;
  }
  if(path==='v1/chat/completions'){
   if(s.calls.length>=spec.maxCalls)throw Error('Per-trial model-call limit reached');
   if(body.stream)throw Error('Streaming must be disabled for comparable trials');
   // Reserve more than the maximum price of the model's entire context plus 512 output tokens.
   // Failed/uncertain requests retain the reservation. Successful usage refunds only the unused portion.
   const reserve=.45;
   if(budget.committedUsd+reserve>budget.limitUsd)throw Error('Cumulative $3 budget cap reached');
   const ledger={trial:out+'/'+s.name,model:spec.model,reservedUsd:reserve,settledUsd:null,status:'reserved'};
   budget.committedUsd+=reserve;budget.calls.push(ledger);saveBudget();
   const request={model:spec.model,messages:body.messages,tools:body.tools,temperature:spec.temperature,reasoning_effort:spec.reasoningEffort,max_completion_tokens:spec.maxTokens,parallel_tool_calls:false,stream:false,service_tier:'default'};
   const call={request,status:'pending'};s.calls.push(call);
   try{
    const response=await client.chat.completions.create(request);
    const u=response.usage;
    if(u){const multiplier=u.prompt_tokens>272000?2:1;const outputMultiplier=u.prompt_tokens>272000?1.5:1;const cost=(u.prompt_tokens*.125*multiplier+u.completion_tokens*.5*outputMultiplier)/1e6;ledger.settledUsd=cost;budget.committedUsd+=cost-reserve;ledger.status='settled';}
    else ledger.status='usage_missing';
    saveBudget();call.response=response;call.status='completed';res.end(JSON.stringify(response));
   }catch(e){ledger.status='uncertain';saveBudget();call.status='failed';call.httpStatus=e.status||null;res.writeHead(502).end(JSON.stringify({error:{message:'Provider call failed; budget reservation retained.'}}));}
   return;
  }
  res.writeHead(404).end('{}');
 }catch(e){res.writeHead(400).end(JSON.stringify({error:{message:e.message}}));}
});
function workflow(endpoint,c){
 const node=(name,type,parameters,typeVersion=1)=>({id:name,name,type,typeVersion,position:[0,0],parameters});
 const start=node('Start','n8n-nodes-base.manualTrigger',{});
 const agent=node('Agent','@n8n/n8n-nodes-langchain.agent',{promptType:'define',text:c.ticket,options:{systemMessage:spec.system,maxIterations:spec.maxCalls,returnIntermediateSteps:true,enableStreaming:false}},2.2);
 const model=node('Model','@n8n/n8n-nodes-langchain.lmChatOpenAi',{model:spec.model,options:{baseURL:endpoint+'/v1',temperature:0,maxTokens:512,maxRetries:0,timeout:45000}},1);
 model.credentials={openAiApi:{id:'BenchmarkProxy',name:'Benchmark proxy dummy credential'}};
 const code=`const http = require('http'); return await new Promise((resolve,reject)=>{const body=JSON.stringify(query); const req=http.request(${JSON.stringify(endpoint+'/tool')},{method:'POST',headers:{'Content-Type':'application/json'}},res=>{let value='';res.on('data',b=>value+=b);res.on('end',()=>resolve(value));});req.on('error',reject);req.end(body);});`;
 const tool=node('support','@n8n/n8n-nodes-langchain.toolCode',{name:'support',description:spec.toolDescription,jsCode:code,specifyInputSchema:true,schemaType:'manual',inputSchema:JSON.stringify(spec.toolSchema)},1.3);
 return{id:'BenchmarkAgent',name:'Synthetic support agent benchmark',active:false,nodes:[start,agent,model,tool],connections:{Start:{main:[[{node:'Agent',type:'main',index:0}]]},Model:{ai_languageModel:[[{node:'Agent',type:'ai_languageModel',index:0}]]},support:{ai_tool:[[{node:'Agent',type:'ai_tool',index:0}]]}},settings:{executionOrder:'v1'}};
}
let vite;const trials=[];let runError;
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const cred=join(temp,'dummy-credential.json');writeFileSync(cred,JSON.stringify([{id:'BenchmarkProxy',name:'Benchmark proxy dummy credential',type:'openAiApi',data:{apiKey:'benchmark-local-proxy-only'}}]));
 const imported=await run('n8n',['import:credentials',`--input=${cred}`]);if(imported.code)throw Error('Could not import dummy n8n proxy credential');
 vite=await viteServer({root,configFile:false,envFile:false,appType:'custom',server:{middlewareMode:true,watch:null,hmr:false,ws:false},logLevel:'error'});
 const {parseN8nResult}=await vite.ssrLoadModule('/evals/benchmarks/metrics.ts');
 const {gradeAgent}=await vite.ssrLoadModule('/evals/benchmarks/agents/grade.ts');
 for(let repetition=1;repetition<=spec.repetitions;repetition++)for(const c of spec.cases)for(const platform of repetition%2?['n8n','langgraph']:['langgraph','n8n']){
  const id=randomUUID(),name=`${repetition}-${c.id}-${platform}`,endpoint=origin+'/'+id;
  const state={name,c,events:[],proposals:[],calls:[],lookups:0};states.set(id,state);
  if(platform==='n8n'){
   const file=join(temp,'workflow.json');writeFileSync(file,JSON.stringify(workflow(endpoint,c)));
   const imp=await run('n8n',['import:workflow',`--input=${file}`]);if(imp.code)throw Error('n8n workflow import failed');
  }
  const result=platform==='n8n'?await run('n8n',['execute','--id=BenchmarkAgent','--rawOutput']):await run('/private/tmp/aag-agent-benchmark/bin/python',['scripts/benchmarks/langgraph-agent.py'],{BENCHMARK_ENDPOINT:endpoint});
  writeFileSync(join(temp,name+'.log'),result.log);
  let response='',completed=false;
  if(platform==='n8n'){
   try{const parsed=parseN8nResult(result.log);response=parsed.runData?.Agent?.at(-1)?.data?.main?.[0]?.[0]?.json?.output||'';completed=result.code===0&&!parsed.error;}catch{}
  }else{
   const match=result.log.match(/BENCHMARK_RESPONSE=(.*)/);if(match)response=JSON.parse(match[1]);completed=result.code===0&&!!match;
  }
  const ledger=budget.calls.filter(x=>x.trial===out+'/'+name && !x.counted);ledger.forEach(x=>x.counted=true);
  const measured=ledger.every(x=>x.settledUsd!==null);
  const trial={name,platform,caseId:c.id,repetition,runtimeMs:result.ms,response,completed,events:state.events,proposals:state.proposals,modelCalls:state.calls,apiCostUsd:measured?ledger.reduce((s,x)=>s+x.settledUsd,0):null,budgetChargedUpperUsd:ledger.reduce((s,x)=>s+(x.settledUsd??x.reservedUsd),0),...gradeAgent(c,response,state.proposals,state.events,completed),logPath:join(temp,name+'.log')};
  trials.push(trial);states.delete(id);writeFileSync(join(out,'trials.json'),JSON.stringify(trials,null,2));saveBudget();
  console.log(`${name}: ${trial.success?'PASS':'FAIL'}; ${state.calls.length} model calls; API cost ${trial.apiCostUsd===null?'unknown':trial.apiCostUsd.toFixed(5)}`);
  if(!completed)throw Error(`Runtime failed; inspect ${temp}/${name}.log. Partial results retained.`);
 }
}catch(e){runError=e.message;console.error(runError);process.exitCode=1;}
finally{
 if(vite)await vite.close();await new Promise(done=>server.close(done));
 const summaries=['n8n','langgraph'].map(platform=>{const ts=trials.filter(x=>x.platform===platform),successes=ts.filter(x=>x.success).length,costKnown=ts.every(x=>x.apiCostUsd!==null),cost=costKnown?ts.reduce((s,x)=>s+x.apiCostUsd,0):null,times=ts.map(x=>x.runtimeMs).sort((a,b)=>a-b);return {platform,trials:ts.length,successes,apiCostUsd:cost,apiCostPerSuccessUsd:cost!==null&&successes?cost/successes:null,medianRuntimeMs:times.length?(times[Math.floor((times.length-1)/2)]+times[Math.floor(times.length/2)])/2:null,recovery:ts.filter(x=>x.recovered!==null).map(x=>x.recovered),approvalViolations:ts.filter(x=>!x.approvalPreserved).length,proposalReviewRequests:ts.reduce((s,x)=>s+x.approvalRequests,0),actualHumanInterventions:null,totalCostPerSuccessUsd:null};});
 const report={evidence:'tested on synthetic sample cases',runError:runError||null,model:spec.model,temperature:0,reasoningEffort:spec.reasoningEffort,maxOutputTokens:512,maxModelCallsPerTrial:8,repetitions:3,sourceHash:createHash('sha256').update(['scripts/benchmarks/agents.mjs','scripts/benchmarks/langgraph-agent.py','evals/benchmarks/agents/spec.json','evals/benchmarks/agents/grade.ts'].map(p=>readFileSync(p,'utf8')).join('\n')).digest('hex'),cumulativeBudgetCommittedUpperUsd:budget.committedUsd,summaries,limitations:['Synthetic cases, no user data or independent grading review.','Actual agent loops, shared model proxy and mock support tools; no real refunds.','Same system prompt and tool contract; framework message packaging may differ. Requests are retained for audit.','Approval enforcement resides in the mock tool; attempted bypasses fail grading.','API cost is a conservative upper estimate: all input tokens priced at the cache-write rate, without cache-read discounts. Not invoice reconciliation. Unknown usage retains a conservative reservation.','Total cost and real human effort are unmeasured; proposal review requests are not completed human interventions.','Cold runtime includes process startup. Three repetitions do not establish a general winner.','Only transient tool failure tested, not process-crash recovery.']};
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
 writeFileSync(join(out,'report.md'),['# AI-agent benchmark pilot','',`Status: ${runError?'INCOMPLETE: '+runError:'completed'}`,'',`Model: ${spec.model}. Reasoning effort none (Chat Completions tool compatibility); temperature 0; maximum 512 output tokens/call, 8 model calls/trial.`, '', '| Platform | Success | API cost upper estimate | API upper estimate / success | Median cold runtime | Approval violations | Review requests |','| --- | --- | --- | --- | --- | --- | --- |',...summaries.map(s=>`| ${s.platform} | ${s.successes}/${s.trials} | ${s.apiCostUsd===null?'unknown':'$'+s.apiCostUsd.toFixed(5)} | ${s.apiCostPerSuccessUsd===null?'unknown':'$'+s.apiCostPerSuccessUsd.toFixed(5)} | ${s.medianRuntimeMs===null?'unknown':(s.medianRuntimeMs/1000).toFixed(2)+'s'} | ${s.approvalViolations} | ${s.proposalReviewRequests} |`),'',`Cumulative benchmark budget charged/reserved: $${budget.committedUsd.toFixed(5)} of $3.`, '', ...report.limitations.map(x=>'- '+x),''].join('\n'));
 console.log(`Report: ${out}/report.md`);
}
