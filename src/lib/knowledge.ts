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
export const KB_ISSUES: Record<string, KbIssue> = {};
