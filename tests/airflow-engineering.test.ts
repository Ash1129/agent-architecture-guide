import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { recommend } from "../src/lib/rules";
import type { Answers } from "../src/lib/questions";
import { buildStarterKit } from "../src/lib/starter";
import { KIT_CHUNKS } from "../server/kit";
import { AIRFLOW_ENGINEERING, N8N_ENGINEERING, MAX_CHUNKS, knowledgeFingerprint, loadChunks, selectChunks } from "../server/knowledge";
import { sampledPaths } from "./paths";

const data: Answers = { task: "Build a daily margin report", shape: "rules", systems: "read", trigger: "data", volume: "daily", risks: ["none"], location: "open", team: "large" };

describe("Airflow engineering knowledge reaches the builder", () => {
  it("covers core and supporting Airflow, preserves n8n guidance in combined designs, and leaves other kits alone", () => {
    const seen = new Set<string>();
    for (const a of [data, ...sampledPaths(500)]) {
      const r = recommend(a);
      const bp = buildBlueprint(r, a);
      const airflow = r.tools.find(({ tool }) => tool === "airflow");
      const n8n = r.tools.some(({ tool }) => tool === "n8n" || tool === "n8n-agent");
      if (airflow) seen.add(airflow.core ? "core" : "supporting");
      if (airflow && n8n) seen.add("combined");
      if (!airflow) seen.add("other");
      for (const mandatory of [["P01"], KIT_CHUNKS]) {
        const ids = selectChunks(r, bp, undefined, MAX_CHUNKS, mandatory).map(({ id }) => id);
        expect(ids.length).toBeLessThanOrEqual(MAX_CHUNKS);
        expect(new Set(ids.slice(0, mandatory.length))).toEqual(new Set(mandatory));
        for (const id of AIRFLOW_ENGINEERING) expect(ids.includes(id)).toBe(Boolean(airflow));
        for (const id of N8N_ENGINEERING) expect(ids.includes(id)).toBe(n8n);
      }
      const { files } = buildStarterKit(r, bp, a);
      const guide = files.find(({ path }) => path === "airflow/ENGINEERING.md");
      expect(Boolean(guide)).toBe(Boolean(airflow));
      if (guide) {
        expect(files.some(({ path }) => /^airflow\/dags\/.+\.py$/.test(path))).toBe(true);
        expect(files.find(({ path }) => path === "BUILD.md")!.content).toContain(guide.content.trimEnd());
        for (const filename of ["R01-data-intervals-and-dependencies", "R02-retries-backfills-and-failure-signals", "R03-testing-security-and-operation"]) {
          const raw = readFileSync(new URL(`../knowledge/chunks/10-airflow-engineering/${filename}.md`, import.meta.url), "utf8");
          expect(guide.content).toContain(raw.replace(/^---[\s\S]*?---\s*/, "").replace(/^## /gm, "### "));
        }
      }
    }
    expect(seen).toEqual(new Set(["core", "supporting", "combined", "other"]));
  });

  it("invalidates the knowledge fingerprint after an Airflow evidence change", () => {
    const original = loadChunks();
    const revised = new Map(original);
    const chunk = revised.get("R02")!;
    revised.set("R02", { ...chunk, text: chunk.text + "\nRevised recovery guidance." });
    expect(knowledgeFingerprint(revised)).not.toBe(knowledgeFingerprint(original));
  });
});
