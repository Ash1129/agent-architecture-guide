// Retrieval from the knowledge base (knowledge/) for the AI design step.
// The rules already say which chunks back them (each rule's `kb` list), so
// relevance comes from the rules that shaped this design: chunks behind the
// rules on its steps count double, chunks behind any other rule that fired
// count once. P01, the catalogue of workflow patterns, is always included
// because every design is built from those patterns.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Blueprint } from "../src/lib/blueprint";
import type { KbChunk } from "../src/lib/design";
import { MODEL_RULES } from "../src/lib/models";
import { RULES, type Recommendation } from "../src/lib/rules";

export type Chunk = KbChunk & { text: string };

const ALWAYS = ["P01"];
export const MAX_CHUNKS = 8;

let cache: Map<string, Chunk> | undefined;

/** Every chunk in the knowledge base, read once per server. */
export function loadChunks(root = join(process.cwd(), "knowledge", "chunks")): Map<string, Chunk> {
  if (cache) return cache;
  const out = new Map<string, Chunk>();
  for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const f of readdirSync(join(root, dir.name)).filter((x) => x.endsWith(".md"))) {
      const raw = readFileSync(join(root, dir.name, f), "utf8");
      const id = /^id:\s*(\S+)/m.exec(raw)?.[1];
      const title = /^title:\s*(.+)$/m.exec(raw)?.[1]?.trim();
      if (id && title) out.set(id, { id, title, text: raw.replace(/^---[\s\S]*?---\s*/, "").trim() });
    }
  }
  return (cache = out);
}

/** The chunks most relevant to this design, most relevant first. */
export function selectChunks(r: Recommendation, baseline: Blueprint, all = loadChunks(), max = MAX_CHUNKS, always = ALWAYS): Chunk[] {
  const score = new Map<string, number>();
  const add = (ids: string[], w: number) => ids.forEach((id) => score.set(id, (score.get(id) ?? 0) + w));
  const ruleKb = (id: string) => RULES.find((x) => x.id === id)?.kb ?? [];
  for (const id of r.fired) add(ruleKb(id), 1);
  for (const n of baseline.nodes) {
    for (const id of n.rules) add(ruleKb(id), 2);
    if (n.engine?.kind === "model") add(MODEL_RULES.find((m) => m.role === (n.engine as { role: string }).role)?.kb ?? [], 1);
  }
  always.forEach((id, i) => add([id], 1000 - i));
  return [...score]
    .filter(([id]) => all.has(id))
    .sort(([x, a], [y, b]) => b - a || x.localeCompare(y))
    .slice(0, max)
    .map(([id]) => all.get(id)!);
}
