import { describe, it, expect } from 'vitest';
import { grade, summarize, parseN8nResult, type Observation, type Scenario, type Trial } from '../evals/benchmarks/metrics';
const scenario: Scenario = { id:'approved', orders:[{id:'A',amount:25,approved:true}],fault:'none',expectedRecords:[{id:'A',amount:25}],expectedCompletion:true };
const observed: Observation = { completed:true,records:[{id:'A',amount:25}],attempts:[{id:'A',amount:25}],runtimeMs:100,workMs:20,apiCostUsd:0,totalCostUsd:null,humanInterventions:null };
const trial = (changes: Partial<Observation> = {}): Trial => { const o={...observed,...changes};return {platform:'test',caseId:'approved',repetition:1,...o,...grade(scenario,o)}; };
describe('runtime benchmark grading',()=>{
  it('reads n8n failure JSON with trailing diagnostics without accepting a bare message',()=>{
    const result={data:{resultData:{error:{message:'503 {temporary}'}}}};
    expect(parseN8nResult('Starting...\n'+JSON.stringify(result)+'\nError executing workflow')).toEqual(result.data.resultData);
    expect(()=>parseN8nResult('Success!')).toThrow();
  });
  it('grades persisted outcomes rather than a successful response alone',()=>{
    expect(grade(scenario,observed).taskSuccess).toBe(true);
    expect(grade(scenario,{...observed,records:[]}).taskSuccess).toBe(false);
    expect(grade(scenario,{...observed,records:[{id:'A',amount:26}]}).taskSuccess).toBe(false);
  });
  it('fails an approval bypass even if the final state looks right',()=>{
    expect(grade(scenario,{...observed,attempts:[...observed.attempts,{id:'B',amount:3}]}).approvalPreserved).toBe(false);
    expect(grade({...scenario,orders:[{id:'A',amount:25,approved:'true'}]},observed).taskSuccess).toBe(false);
  });
  it('distinguishes expected safe failure from task success and missing runtime evidence',()=>{
    const s={...scenario,fault:'always-503',expectedCompletion:false,expectedRecords:[]};
    const o={...observed,completed:false,records:[]};
    expect(grade(s,o)).toMatchObject({safeHandling:true,taskSuccess:false,recoverySuccess:null});
    expect(grade(s,{...o,infrastructureError:'process unavailable'}).safeHandling).toBe(false);
  });
  it('requires a retry and verified outcome to count recovery',()=>{
    const s={...scenario,fault:'commit-then-503'};
    expect(grade(s,observed).recoverySuccess).toBe(false);
    expect(grade(s,{...observed,attempts:[...observed.attempts,...observed.attempts]}).recoverySuccess).toBe(true);
  });
  it('includes failed-run cost and never fills missing cost or intervention data with zero',()=>{
    expect(summarize([trial()])[0]).toMatchObject({costPerSuccessfulResultUsd:null,humanInterventions:null});
    expect(summarize([trial({totalCostUsd:2}),trial({completed:false,totalCostUsd:3})])[0].costPerSuccessfulResultUsd).toBe(5);
    expect(summarize([trial({completed:false,totalCostUsd:3})])[0].costPerSuccessfulResultUsd).toBeNull();
  });
});
