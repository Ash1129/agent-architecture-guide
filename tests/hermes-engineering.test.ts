import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { recommend } from "../src/lib/rules";
import type { Answers } from "../src/lib/questions";
import { buildStarterKit } from "../src/lib/starter";
import { KIT_CHUNKS } from "../server/kit";
import { HERMES_ENGINEERING, AIRFLOW_ENGINEERING, N8N_ENGINEERING, MAX_CHUNKS, knowledgeFingerprint, loadChunks, selectChunks } from "../server/knowledge";
import { sampledPaths } from "./paths";

const data: Answers = { task: "Build a daily margin report", shape: "rules", systems: "read", trigger: "data", volume: "daily", risks: ["none"], location: "open", team: "large" };

describe("Hermes engineering knowledge reaches the builder", () => {
  it("includes Hermes chapters in retrieval and exports while preserving companion guidance", () => {
    const seen = new Set<string>();
    for (const a of [data, ...sampledPaths(500)]) {
      const r = recommend(a);
      const bp = buildBlueprint(r, a);
      const hermes = r.tools.some(({ tool }) => tool === "hermes");
      const airflow = r.tools.find(({ tool }) => tool === "airflow");
      const n8n = r.tools.some(({ tool }) => tool === "n8n" || tool === "n8n-agent");
      if (hermes) seen.add("hermes");
      if (hermes && n8n) seen.add("n8n");
      if (hermes && airflow) seen.add("airflow");
      if (!hermes) seen.add("other");
      for (const mandatory of [["P01"], KIT_CHUNKS]) {
        const ids = selectChunks(r, bp, undefined, MAX_CHUNKS, mandatory).map(({ id }) => id);
        expect(ids.length).toBeLessThanOrEqual(MAX_CHUNKS);
        expect(new Set(ids.slice(0, mandatory.length))).toEqual(new Set(mandatory));
        for (const id of HERMES_ENGINEERING) expect(ids.includes(id)).toBe(hermes);
        for (const id of AIRFLOW_ENGINEERING) expect(ids.includes(id)).toBe(Boolean(airflow));
        for (const id of N8N_ENGINEERING) expect(ids.includes(id)).toBe(n8n);
      }
      const { files } = buildStarterKit(r, bp, a);
      const guide = files.find(({ path }) => path === "hermes/ENGINEERING.md");
      expect(Boolean(guide)).toBe(hermes);
      if (guide) {
        expect(files.find(({ path }) => path === "BUILD.md")!.content).toContain(guide.content.trimEnd());
        for (const filename of ["H01-tool-boundaries-and-actions", "H02-memory-and-skill-review", "H03-unattended-operation-and-recovery"]) {
          const raw = readFileSync(new URL(`../knowledge/chunks/11-hermes-engineering/${filename}.md`, import.meta.url), "utf8");
          expect(guide.content).toContain(raw.replace(/^---[\s\S]*?---\s*/, "").replace(/^## /gm, "### "));
        }
      }
    }
    expect(seen).toEqual(new Set(["hermes", "n8n", "airflow", "other"]));
  });

  it("reserves all platform chapters alongside mandatory kit context", () => {
    const r = recommend(data);
    for (const tool of ["hermes", "n8n", "airflow"] as const) {
      if (!r.tools.some((t) => t.tool === tool)) r.tools.push({ ...r.tools[0], tool, core: false });
    }
    const ids = selectChunks(r, buildBlueprint(r, data), undefined, MAX_CHUNKS, KIT_CHUNKS).map((c) => c.id);
    for (const id of [...KIT_CHUNKS, ...HERMES_ENGINEERING, ...N8N_ENGINEERING, ...AIRFLOW_ENGINEERING]) expect(ids).toContain(id);
  });

  it("invalidates the knowledge fingerprint after a Hermes evidence change", () => {
    const original = loadChunks();
    const revised = new Map(original);
    const chunk = revised.get("H02")!;
    revised.set("H02", { ...chunk, text: chunk.text + "\nRevised recovery guidance." });
    expect(knowledgeFingerprint(revised)).not.toBe(knowledgeFingerprint(original));
  });
});
