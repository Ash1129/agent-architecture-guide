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

/** Every platform the shortlist considers, in the order it is audited. */
const PLATFORMS: ToolId[] = ['n8n', 'airflow', 'claude', 'cowork', 'hermes', 'n8n-agent', 'langgraph'];

/** What the checks below need to know about the answers and the rules' choice. */
type Ctx = { a: Answers; primary: ToolId; agent: boolean; restricted: boolean; advanced: boolean; custom: boolean };

/**
 * The assessed comparisons: an alternative worth weighing against the rules'
 * main tool, and when. Adding a comparison means adding a row here.
 */
const COMPARISONS: { primary: ToolId; alternative: ToolId; when: (c: Ctx) => boolean; reason: (a: Answers) => string }[] = [
  {
    primary: 'n8n', alternative: 'airflow',
    when: (c) => c.a.team === 'large' && c.a.trigger === 'schedule',
    reason: () => 'A developer-owned scheduled batch workflow can also be implemented as a Python DAG.',
  },
  {
    primary: 'n8n-agent', alternative: 'langgraph',
    when: (c) => c.a.team === 'large',
    reason: () => 'The same agent can be implemented in code with explicit state and recovery boundaries.',
  },
  {
    primary: 'cowork', alternative: 'n8n-agent',
    when: (c) => c.a.trigger === 'manual' || c.a.trigger === 'schedule',
    reason: (a) => a.trigger === 'schedule' ? 'Run the agent design inside an n8n workflow started by a schedule trigger.' : 'Run the agent design inside an n8n workflow that you start manually.',
  },
  {
    primary: 'langgraph', alternative: 'n8n-agent',
    when: (c) => !c.custom && c.a.roles === 'one' && (c.a.trigger === 'event' || c.a.trigger === 'data'),
    reason: () => 'Run the agent design inside a visual trigger-driven workflow.',
  },
];

/**
 * Why a platform is left out, checked in order; the first that applies is
 * the reason shown. A platform none of them excludes is a candidate.
 */
const EXCLUSIONS: { when: (tool: ToolId, c: Ctx) => boolean; reason: string }[] = [
  { when: (_t, c) => c.advanced, reason: 'Advanced data-asset requirements need a comparison beyond this catalog; no implementation is cleared yet.' },
  { when: (t, c) => c.custom && (c.a.team !== 'large' || t !== 'langgraph' || !c.agent), reason: 'This catalog has no assessed implementation of the requested service or sandbox boundary for this option and team.' },
  { when: (t, c) => c.restricted && (t === 'claude' || t === 'cowork'), reason: 'The provider restriction rules exclude this app.' },
  { when: (t, c) => (t === 'airflow' || t === 'langgraph') && c.a.team !== 'large', reason: 'Requires developer ownership that was not selected.' },
  { when: (t, c) => t === 'airflow' && (c.agent || !(c.a.trigger === 'schedule' || c.a.trigger === 'data')), reason: 'This comparison covers scheduled or dependency-driven fixed batch workflows only.' },
  { when: (t, c) => t === 'n8n' && c.agent, reason: 'A fixed workflow alone does not implement the required agent loop.' },
  { when: (t, c) => ['cowork', 'hermes', 'n8n-agent', 'langgraph'].includes(t) && !c.agent && t !== c.primary, reason: 'Would introduce an agent implementation where the rules do not require one.' },
  { when: (t, c) => t === 'claude' && (c.agent || c.a.shape === 'rules' || c.a.trigger !== 'manual'), reason: 'The manual AI playbook does not match this execution pattern.' },
  { when: (t, c) => t !== c.primary && !!c.a.knowledge?.includes('memory'), reason: 'Cross-run memory equivalence has not been assessed for this alternative.' },
  {
    when: (t, c) => t !== c.primary && !COMPARISONS.some((x) => x.primary === c.primary && x.alternative === t && x.when(c)),
    reason: 'No meaningful, assessed comparison is defined for these answers; this is not a claim that the platform is incapable.',
  },
];

/** What choosing each platform trades away. */
const TRADEOFF: Partial<Record<ToolId, string>> = {
  airflow: 'Python workflow definitions and batch operations, with additional orchestration setup and ownership.',
  langgraph: 'Explicit control of agent state and transitions, with custom service and integration code to maintain.',
  n8n: 'Visual workflow editing and connectors, with platform-specific execution and recovery behavior to verify.',
  'n8n-agent': 'Visual workflow editing and connectors, with platform-specific execution and recovery behavior to verify.',
};
const DEFAULT_TRADEOFF = 'Start with the existing app or agent environment; confirm its integration and deployment limits.';

/** Implementation work a platform adds on top of the design's own obligations. */
const EXTRA_OBLIGATIONS: Partial<Record<ToolId, (a: Answers) => string[]>> = {
  'n8n-agent': (a) => [
    a.trigger === 'schedule' ? 'Publish the scheduled workflow, set its timezone and verify that the hosting environment stays available.' : 'Configure and verify the workflow trigger before use.',
    'Configure model credentials and tool connections; implement the same agent roles and approval boundaries as the primary design.',
  ],
};

/** Bounded design comparisons, not runtime benchmarks or generated starter kits.
 * Never change answers to manufacture a competing recommendation.
 */
export function shortlist(input: Answers): Shortlist {
  if (!isComplete(input)) throw new Error('Complete the guide before comparing implementations.');
  const a = effectiveAnswers(input), r = recommend(a);
  const primary = r.tools.find(t => t.core)!;
  const c: Ctx = {
    a,
    primary: primary.tool,
    agent: a.shape === 'varies',
    restricted: a.location === 'restricted' || a.location === 'independence',
    advanced: !!a.requirements?.includes('assets'),
    custom: !!a.requirements?.some(x => x === 'embedded' || x === 'sandbox'),
  };
  const excluded: Shortlist['excluded'] = [];
  const eligible: ToolId[] = [];
  for (const tool of PLATFORMS) {
    const reason = EXCLUSIONS.find((x) => x.when(tool, c))?.reason;
    if (reason) excluded.push({ tool, reason }); else eligible.push(tool);
  }
  const obligations = [...r.autonomy.checkpoints, ...r.autonomy.guardrails,
    `Retain the hosting requirement: ${r.hosting.title}. ${r.hosting.body}`,
    'Verify connector permissions, retry safety and recovery before deployment.',
    ...(c.restricted ? ['Use only approved model providers; check every model call and integration.'] : []),
    ...(c.custom ? ['Implement and verify the service boundary and an external restricted sandbox where requested. The framework does not provide a secure sandbox.'] : []),
  ];
  const candidates = eligible.sort((x, y) => Number(y === primary.tool) - Number(x === primary.tool)).slice(0, 2).map(tool => ({
    tool,
    reason: tool === primary.tool
      ? primary.why.map(w => w.text).join(' ')
      : (COMPARISONS.find((x) => x.primary === primary.tool && x.alternative === tool)?.reason(a) ?? DEFAULT_TRADEOFF),
    tradeoff: TRADEOFF[tool] ?? DEFAULT_TRADEOFF,
    obligations: [...obligations, ...(EXTRA_OBLIGATIONS[tool]?.(a) ?? [])],
    evidence: 'recommended by rules' as const,
  }));
  return { candidates, excluded, approach: r.approach.id, autonomy: structuredClone(r.autonomy),
    explanation: candidates.length === 2 ? 'Two implementation designs are worth comparing. Neither has been benchmarked on your examples.' :
      candidates.length === 1 ? `Only ${TOOLS[candidates[0].tool].name} is shortlisted. No second assessed option offers a meaningful tradeoff for these answers.` :
      'No implementation is cleared by this shortlist. Resolve the requirement gaps below before selecting a platform.' };
}

/**
 * Whether the shortlist has anything to add to the result: a real comparison,
 * a requirement that rules out the main tool, or a gap to resolve. A single
 * candidate that is the main tool only repeats the recommendation.
 */
export function shortlistAddsSomething(s: Shortlist, answers: Answers): boolean {
  if (s.candidates.length !== 1) return true;
  const primary = recommend(effectiveAnswers(answers)).tools.find(t => t.core)!.tool;
  return s.candidates[0].tool !== primary;
}
