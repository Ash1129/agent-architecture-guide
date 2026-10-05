// Links between the guide's rules and the research knowledge base in
// knowledge/. Each rule lists the chunks (by ID, such as "F03") whose claims
// support it; tests/knowledge-links.test.ts checks that every cited chunk
// exists. Where the knowledge base doesn't support a rule, or contradicts it,
// the rule is listed below so the gap stays visible until it is resolved.

/** A knowledge-base chunk ID: a topic letter and two digits, such as "F03". */
export type ChunkId = string;

/** Model names and examples in MODELS (src/lib/models.ts) are checked against these chunks. */
export const MODELS_KB: ChunkId[] = ["M01", "M03"];

export type KbIssue = { kind: "unsupported" | "partial" | "conflict"; note: string };

/**
 * Rules the knowledge base doesn't fully back. "unsupported": no chunk supports
 * it yet. "partial": a chunk supports part of it. "conflict": a chunk says the
 * rule is out of date or overstated. A rule with no linked chunks must be here.
 */
export const KB_ISSUES: Record<string, KbIssue> = {
  H2: {
    kind: "partial",
    note: "Open-weight hosting is covered (M03); the claim that self-hosting is more secure and cheaper per task rests on mindstudio-2026-local-cloud, not yet read.",
  },
  H3: {
    kind: "partial",
    note: "D01 supports in-region processing through a cloud provider's regional service (Anthropic's own API is US or worldwide only); the claim that own hardware rarely pays off at small size rests on mindstudio-2026-local-cloud, not yet read.",
  },
  H4: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
  H5: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
  G6: {
    kind: "partial",
    note: "M02 supports that AI cost scales with use (agents use 4 to 15 times the tokens); the claim that cloud costs can't be fully controlled rests on mindstudio-2026-local-cloud, not yet read.",
  },
  G11: {
    kind: "unsupported",
    note: "Rests on selfhosting-2026-airflow-n8n, not yet read. L02 covers Airflow's data-aware scheduling but not n8n's workarounds.",
  },
  G12: {
    kind: "partial",
    note: "L02 confirms Airflow needs Python (\"some coding is always required\"); the memory and setup comparison rests on selfhosting-2026-airflow-n8n, not yet read.",
  },
  G20: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
};
