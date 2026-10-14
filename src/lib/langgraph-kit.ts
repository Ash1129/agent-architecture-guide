import type { Blueprint } from "./blueprint";
import type { KitFile } from "./starter";
import graph from "./templates/langgraph-demo.py?raw";

/** A safe mechanics fixture plus the complete design the developer must implement. */
export function langgraphKit(bp: Blueprint, task: string, prompt: string): KitFile[] {
  const specialists = bp.nodes.filter((n) => n.engine?.kind === "model" && n.engine.role === "specialist").map((n) => n.name);
  return [
    { path: "langgraph/graph.py", lang: "python", purpose: "Local fixture demonstrating parallel specialists, aggregation and review. No real actions.", content: graph },
    { path: "langgraph/design.json", lang: "json", purpose: "Full recommended design and specialist roles to implement.", content: JSON.stringify({ task, specialists: specialists.length ? specialists : ["Research", "Check"], blueprint: bp }, null, 2) },
    { path: "langgraph/system-prompt.md", lang: "markdown", purpose: "The task brief to use when implementing model adapters.", content: prompt },
    { path: "langgraph/requirements.txt", lang: "shell", purpose: "Install into a dedicated Python environment; lock resolved versions after validation.", content: "langgraph==1.2.14\n" },
    { path: "langgraph/README.md", lang: "markdown", purpose: "Run the fixture, then implement and validate the real design.", content: `# LangGraph starter

This is a credential-free mechanics fixture, not an implemented business agent.
It runs parallel fixture specialists, combines their results and pauses for review.
Both approval and rejection finish without a model call or external action.
The complete recommended architecture is in design.json; routing, model calls,
retrieval, tool adapters and production triggers still need implementation.

## Local run

From this folder, with Python 3.11 or later:

\`\`\`sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python graph.py
\`\`\`

Review the displayed proposal. Type yes to approve the simulation or anything
else to reject it. The output always reports zero external actions.

## Before connecting real services

- Use design.json and system-prompt.md to implement each planned role and step.
- Replace fixture findings with validated read-only adapters first.
- InMemorySaver loses all state when the process exits. Select a persistent
  checkpointer and verify restart recovery before deploying.
- Authenticate review requests and enforce thread ownership, expiry and proposal
  binding at the service boundary. A digest alone is not authorization.
- Implement any write adapter separately after review, with destination-side
  deduplication and reconciliation of ambiguous outcomes.
- Configure the scheduler or authenticated event endpoint separately. If Airflow
  supplies upstream work, hand off a stable operation ID and input reference.
- Pin and lock tested dependency versions. Test the full design, not only this
  fixture. Apply ENGINEERING.md and the shared evaluation and tracing guides
  embedded in the full BUILD.md export.
` },
  ];
}
