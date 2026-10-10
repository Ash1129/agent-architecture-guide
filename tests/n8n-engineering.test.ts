import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildBlueprint } from "../src/lib/blueprint";
import { recommend } from "../src/lib/rules";
import { buildStarterKit } from "../src/lib/starter";
import { KIT_CHUNKS } from "../server/kit";
import { knowledgeFingerprint, loadChunks, MAX_CHUNKS, N8N_ENGINEERING, selectChunks } from "../server/knowledge";
import { sampledPaths } from "./paths";

describe("n8n engineering knowledge reaches the builder", () => {
  it("includes engineering in n8n designs and kits, without displacing mandatory context or affecting other platforms", () => {
    const seen = new Set<string>();
    for (const a of sampledPaths(300)) {
      const r = recommend(a);
      const bp = buildBlueprint(r, a);
      const usesN8n = r.tools.some(({ tool }) => tool === "n8n" || tool === "n8n-agent");
      if (usesN8n) r.tools.forEach(({ tool }) => seen.add(tool));
      for (const mandatory of [["P01"], KIT_CHUNKS]) {
        const ids = selectChunks(r, bp, undefined, MAX_CHUNKS, mandatory).map((c) => c.id);
        expect(ids.length).toBeLessThanOrEqual(MAX_CHUNKS);
        expect(new Set(ids.slice(0, mandatory.length))).toEqual(new Set(mandatory));
        for (const id of N8N_ENGINEERING) expect(ids.includes(id)).toBe(usesN8n);
      }
      const kit = buildStarterKit(r, bp, a);
      const guide = kit.files.find((f) => f.path === "n8n/ENGINEERING.md");
      expect(Boolean(guide)).toBe(usesN8n);
      if (guide) {
        const build = kit.files.find((f) => f.path === "BUILD.md")!.content;
        expect(build).toContain(guide.content.trimEnd());
        for (const filename of ["N01-data-contracts-and-item-linking", "N02-failure-recovery-and-testing", "N03-safe-external-actions"]) {
          const raw = readFileSync(new URL(`../knowledge/chunks/09-n8n-engineering/${filename}.md`, import.meta.url), "utf8");
          expect(guide.content).toContain(raw.replace(/^---[\s\S]*?---\s*/, "").replace(/^## /gm, "### "));
        }
      }
    }
    expect(seen.has("n8n")).toBe(true);
    expect(seen.has("n8n-agent")).toBe(true);
    expect(seen.has("hermes")).toBe(true);
  });

  it("changes the cache fingerprint when knowledge changes, independent of file order", () => {
    const original = loadChunks();
    const reordered = new Map([...original].reverse());
    expect(knowledgeFingerprint(reordered)).toBe(knowledgeFingerprint(original));
    const revised = new Map(original);
    const chunk = revised.get("N03")!;
    revised.set("N03", { ...chunk, text: chunk.text + "\nUpdated evidence." });
    expect(knowledgeFingerprint(revised)).not.toBe(knowledgeFingerprint(original));
  });
});
