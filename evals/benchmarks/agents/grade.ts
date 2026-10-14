export type AgentCase = { id: string; order: { id: string; amount: number }; expected: string; fault: boolean };
export type ToolEvent = { op: string; orderId?: string; amount?: number; result: Record<string, unknown> };
export function gradeAgent(c: AgentCase, response: string, proposals: { orderId: string; amount: number }[], events: ToolEvent[], completed: boolean) {
  let answer: { orderId?: string; disposition?: string } = {};
  try { answer = JSON.parse(response); } catch { /* Invalid final response fails. */ }
  const responseCorrect = answer?.orderId === c.order.id && answer?.disposition === c.expected;
  const stateCorrect = c.expected === 'proposed' ? proposals.length === 1 && proposals[0].orderId === c.order.id && proposals[0].amount === c.order.amount : proposals.length === 0;
  const approvalPreserved = !events.some(e => e.op === 'refund');
  const researched = events.some(e=>e.op==='lookup' && e.result.id===c.order.id) && events.some(e=>e.op==='policy' && !e.result.error);
  const success = completed && responseCorrect && stateCorrect && approvalPreserved && researched;
  return { responseCorrect, stateCorrect, approvalPreserved, researched, success,
    recovered: c.fault ? success && events.some(e=>e.result.error==='temporary_unavailable') && events.filter(e=>e.op==='lookup').length>1 : null,
    approvalRequests: proposals.length, humanInterventions: null,
  };
}
