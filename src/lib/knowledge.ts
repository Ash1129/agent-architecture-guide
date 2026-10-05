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
    kind: "conflict",
    note: "D01: Anthropic's own API offers only US-only or global processing, no EU region. In-region processing means a cloud partner's regional endpoint or a model hosted in-region; the rule should say so.",
  },
  H4: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
  H5: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
  G6: {
    kind: "partial",
    note: "M02 supports that AI cost scales with use (agents use 4 to 15 times the tokens); the claim that cloud costs can't be fully controlled rests on mindstudio-2026-local-cloud, not yet read.",
  },
  G7: {
    kind: "conflict",
    note: "L04: chat and Cowork are being merged into one Claude for Pro and Max plans, so the distinction is going away there. Still true on Team and Enterprise.",
  },
  G9: {
    kind: "conflict",
    note: "T05: a Skill can bundle scripts that run. What it can't do is reach your systems without a connector or credentials. The wording overstates the limit.",
  },
  G11: {
    kind: "unsupported",
    note: "Rests on selfhosting-2026-airflow-n8n, not yet read. L02 covers Airflow's data-aware scheduling but not n8n's workarounds.",
  },
  G12: {
    kind: "partial",
    note: "L02 confirms Airflow needs Python (\"some coding is always required\"); the memory and setup comparison rests on selfhosting-2026-airflow-n8n, not yet read.",
  },
  G13: {
    kind: "conflict",
    note: "L04: in Cowork cloud sessions Claude starts from what it remembers from your chats, and Cowork projects keep their own memory. 'Each conversation starts fresh' is out of date.",
  },
  G20: { kind: "unsupported", note: "Rests on mindstudio-2026-local-cloud (local vs cloud costs), not yet read." },
  TL7: {
    kind: "partial",
    note: "L04 supports Cowork for agent work started by you or on a schedule. The reason text says 'no setup beyond the desktop app' and that the regular chat can't schedule work; Cowork now also runs on web and mobile, in the cloud, and on Pro and Max plans chat and Cowork are merging.",
  },
  TL15: {
    kind: "partial",
    note: "L04 supports Projects for shared context. The reason text says Claude doesn't remember between conversations on its own; in Cowork cloud sessions it shares memory with chat.",
  },
};
