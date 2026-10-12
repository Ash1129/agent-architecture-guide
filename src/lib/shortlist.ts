import { TOOLS, type ToolId } from './catalog';
import { effectiveAnswers, isComplete, type Answers } from './questions';
import { recommend, type Recommendation } from './rules';

export type Implementation = {
  tool: ToolId;
  reason: string;
  tradeoff: string;
  obligations: string[];
  evidence: 'recommended by rules';
};
export type Shortlist = {
  candidates: Implementation[];
  excluded: { tool: ToolId; reason: string }[];
  explanation: string;
  approach: Recommendation['approach']['id'];
  autonomy: Recommendation['autonomy'];
};
const platforms: ToolId[] = ['n8n', 'airflow', 'claude', 'cowork', 'hermes', 'n8n-agent', 'langgraph'];

/** Bounded design comparisons, not runtime benchmarks or generated starter kits.
 * Never change answers to manufacture a competing recommendation.
 */
export function shortlist(input: Answers): Shortlist {
  if (!isComplete(input)) throw new Error('Complete the guide before comparing implementations.');
  const a = effectiveAnswers(input), r = recommend(a);
  const primary = r.tools.find(t => t.core)!;
  const advanced = a.requirements?.includes('assets');
  const custom = a.requirements?.some(x => x === 'embedded' || x === 'sandbox');
  const agent = a.shape === 'varies';
  const restricted = a.location === 'restricted' || a.location === 'independence';
  const excluded: Shortlist['excluded'] = [];
  const eligible: ToolId[] = [];
  for (const tool of platforms) {
    let reason: string | undefined;
    if (advanced) reason = 'Advanced data-asset requirements need a comparison beyond this catalog; no implementation is cleared yet.';
    else if (custom && (a.team !== 'large' || tool !== 'langgraph' || !agent)) reason = 'This catalog has no assessed implementation of the requested service or sandbox boundary for this option and team.';
    else if (restricted && (tool === 'claude' || tool === 'cowork')) reason = 'The provider restriction rules exclude this app.';
    else if ((tool === 'airflow' || tool === 'langgraph') && a.team !== 'large') reason = 'Requires developer ownership that was not selected.';
    else if (tool === 'airflow' && (agent || !['schedule', 'data'].includes(a.trigger!))) reason = 'This comparison covers scheduled or dependency-driven fixed batch workflows only.';
    else if (tool === 'n8n' && agent) reason = 'A fixed workflow alone does not implement the required agent loop.';
    else if (['cowork', 'hermes', 'n8n-agent', 'langgraph'].includes(tool) && !agent && tool !== primary.tool) reason = 'Would introduce an agent implementation where the rules do not require one.';
    else if (tool === 'claude' && (agent || a.shape === 'rules' || a.trigger !== 'manual')) reason = 'The manual AI playbook does not match this execution pattern.';
    else if (tool !== primary.tool && a.knowledge?.includes('memory')) reason = 'Cross-run memory equivalence has not been assessed for this alternative.';
    else if (tool !== primary.tool && !(
      (primary.tool === 'cowork' && tool === 'n8n-agent' && ['manual', 'schedule'].includes(a.trigger!)) ||
      (primary.tool === 'n8n' && tool === 'airflow' && a.team === 'large' && a.trigger === 'schedule') ||
      (primary.tool === 'n8n-agent' && tool === 'langgraph' && a.team === 'large') ||
      (primary.tool === 'langgraph' && tool === 'n8n-agent' && !custom && a.roles === 'one' && ['event', 'data'].includes(a.trigger!))
    )) reason = 'No meaningful, assessed comparison is defined for these answers; this is not a claim that the platform is incapable.';
    if (reason) excluded.push({ tool, reason }); else eligible.push(tool);
  }
  const obligations = [...r.autonomy.checkpoints, ...r.autonomy.guardrails,
    `Retain the hosting requirement: ${r.hosting.title}. ${r.hosting.body}`,
    'Verify connector permissions, retry safety and recovery before deployment.',
    ...(restricted ? ['Use only approved model providers; check every model call and integration.'] : []),
    ...(custom ? ['Implement and verify the service boundary and an external restricted sandbox where requested. The framework does not provide a secure sandbox.'] : []),
  ];
  const candidates = eligible.sort((x, y) => Number(y === primary.tool) - Number(x === primary.tool)).slice(0, 2).map(tool => ({
    tool,
    reason: tool === primary.tool ? primary.why.map(w => w.text).join(' ') :
      tool === 'airflow' ? 'A developer-owned scheduled batch workflow can also be implemented as a Python DAG.' :
      tool === 'langgraph' ? 'The same agent can be implemented in code with explicit state and recovery boundaries.' :
      a.trigger === 'schedule' ? 'Run the agent design inside an n8n workflow started by a schedule trigger.' :
      a.trigger === 'manual' ? 'Run the agent design inside an n8n workflow that you start manually.' :
      'Run the agent design inside a visual trigger-driven workflow.',
    tradeoff: tool === 'airflow' ? 'Python workflow definitions and batch operations, with additional orchestration setup and ownership.' :
      tool === 'langgraph' ? 'Explicit control of agent state and transitions, with custom service and integration code to maintain.' :
      tool === 'n8n' || tool === 'n8n-agent' ? 'Visual workflow editing and connectors, with platform-specific execution and recovery behavior to verify.' :
      'Start with the existing app or agent environment; confirm its integration and deployment limits.',
    obligations: [...obligations, ...(tool === 'n8n-agent' ? [
      a.trigger === 'schedule' ? 'Publish the scheduled workflow, set its timezone and verify that the hosting environment stays available.' : 'Configure and verify the workflow trigger before use.',
      'Configure model credentials and tool connections; implement the same agent roles and approval boundaries as the primary design.',
    ] : [])], evidence: 'recommended by rules' as const,
  }));
  return { candidates, excluded, approach: r.approach.id, autonomy: structuredClone(r.autonomy),
    explanation: candidates.length === 2 ? 'Two implementation designs are worth comparing. Neither has been benchmarked on your examples.' :
      candidates.length === 1 ? `Only ${TOOLS[candidates[0].tool].name} is shortlisted. No second assessed option offers a meaningful tradeoff for these answers.` :
      'No implementation is cleared by this shortlist. Resolve the requirement gaps below before selecting a platform.' };
}
