import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KB_ISSUES, MODELS_KB } from "../src/lib/knowledge";
import { MODEL_RULES } from "../src/lib/models";
import { RULES } from "../src/lib/rules";

// The guide's rules cite knowledge-base chunks by ID. These checks keep the
// links honest: every cited chunk exists, every rule either cites a chunk or
// is listed as a known gap, and the gap list doesn't go stale.

const CHUNKS = join(__dirname, "..", "knowledge", "chunks");

/** Chunk IDs from the front matter of every chunk file. */
function chunkIds(): Set<string> {
  return new Set(
    readdirSync(CHUNKS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) =>
        readdirSync(join(CHUNKS, d.name))
          .filter((f) => f.endsWith(".md"))
          .map((f) => /^id:\s*(\S+)/m.exec(readFileSync(join(CHUNKS, d.name, f), "utf8"))?.[1] ?? ""),
      ),
  );
}

describe("rule links to the knowledge base", () => {
  const ids = chunkIds();

  it("cite only chunks that exist, without repeats", () => {
    const cited = [
      ...RULES.map((r) => ({ who: r.id, kb: r.kb })),
      ...MODEL_RULES.map((m) => ({ who: `model:${m.role}`, kb: m.kb })),
      { who: "MODELS", kb: MODELS_KB },
    ];
    for (const { who, kb } of cited) {
      expect(new Set(kb).size, `${who} repeats a chunk`).toBe(kb.length);
      for (const id of kb) expect(ids.has(id), `${who} cites missing chunk ${id}`).toBe(true);
    }
  });

  it("link every rule to a chunk, or list it as a known gap", () => {
    for (const r of RULES) {
      if (r.kb.length === 0) expect(KB_ISSUES[r.id], `${r.id} has no chunks and no KB_ISSUES entry`).toBeDefined();
    }
    for (const m of MODEL_RULES) expect(m.kb.length, `model:${m.role} has no chunks`).toBeGreaterThan(0);
  });

  it("keep the gap list current", () => {
    const ruleIds = new Set(RULES.map((r) => r.id));
    for (const [id, issue] of Object.entries(KB_ISSUES)) {
      expect(ruleIds.has(id), `KB_ISSUES lists unknown rule ${id}`).toBe(true);
      const rule = RULES.find((r) => r.id === id)!;
      // An "unsupported" rule that has since gained chunks should be reclassified.
      if (issue.kind === "unsupported") expect(rule.kb, `${id} is marked unsupported but cites chunks`).toEqual([]);
      else expect(rule.kb.length + (issue.kind === "conflict" ? 1 : 0), `${id} is marked partial but cites no chunks`).toBeGreaterThan(0);
      for (const ref of issue.note.match(/\b[A-Z]\d{2}\b/g) ?? []) expect(ids.has(ref), `KB_ISSUES.${id} mentions missing chunk ${ref}`).toBe(true);
    }
  });
});
