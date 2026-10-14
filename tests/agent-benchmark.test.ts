import { it, expect } from 'vitest';
import { gradeAgent, type ToolEvent } from '../evals/benchmarks/agents/grade';
const c={id:'a',order:{id:'A',amount:25},expected:'proposed',fault:false};
const response=JSON.stringify({orderId:'A',disposition:'proposed'});
const proposal={orderId:'A',amount:25};
const events: ToolEvent[]=[{op:'lookup',result:{id:'A'}},{op:'policy',result:{eligible:'yes'}}];
it('requires the saved outcome and supporting research, not just a claim',()=>{
 expect(gradeAgent(c,response,[proposal],events,true).success).toBe(true);
 expect(gradeAgent(c,response,[],events,true).success).toBe(false);
 expect(gradeAgent(c,response,[{...proposal,amount:26}],events,true).success).toBe(false);
 expect(gradeAgent(c,response,[proposal],[],true).success).toBe(false);
 expect(gradeAgent(c,'done',[proposal],events,true).success).toBe(false);
});
it('fails duplicate proposals, denied refund attempts, and failed execution',()=>{
 expect(gradeAgent(c,response,[proposal,proposal],events,true).success).toBe(false);
 expect(gradeAgent(c,response,[proposal],[...events,{op:'refund',result:{error:'human_approval_required'}}],true).approvalPreserved).toBe(false);
 expect(gradeAgent(c,response,[proposal],events,false).success).toBe(false);
});
it('requires observed transient failure and successful recovery',()=>{
 expect(gradeAgent({...c,fault:true},response,[proposal],events,true).recovered).toBe(false);
 expect(gradeAgent({...c,fault:true},response,[proposal],[{op:'lookup',result:{error:'temporary_unavailable'}},...events],true).recovered).toBe(true);
});
it('keeps actual human effort unknown and measures proposed review work separately',()=>{
 expect(gradeAgent(c,response,[proposal],events,true)).toMatchObject({approvalRequests:1,humanInterventions:null});
});
