import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildBlueprint } from "../src/lib/blueprint";
import { recommend } from "../src/lib/rules";
import type { Answers } from "../src/lib/questions";
import { buildStarterKit } from "../src/lib/starter";
import { kitProblems } from "../src/lib/kitcheck";
import { estimateCost } from "../src/lib/cost";
import { KIT_CHUNKS } from "../server/kit";
import { AI_QUALITY, LANGGRAPH_ENGINEERING, MAX_CHUNKS, knowledgeFingerprint, loadChunks, selectChunks } from "../server/knowledge";
import { sampledPaths } from "./paths";

const custom: Answers = { task: "Investigate support escalations", shape: "varies", kinds: "no", roles: "specialists", quality: "partly", knowledge: ["reference"], systems: "act", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "large" };

describe("LangGraph recommendations and shared AI engineering", () => {
  it("selects custom graphs only for developer teams with multiple roles and no personal-memory requirement", () => {
    for (const location of ["open", "restricted", "independence", "residency"] as const) {
      const r = recommend({ ...custom, location });
      expect(r.tools.filter((t) => t.core).map((t) => t.tool)).toEqual(["langgraph"]);
      expect(r.tools.map((t) => t.tool)).toEqual(expect.arrayContaining(["langfuse", "promptfoo"]));
    }
    for (const a of [{ ...custom, team: "mid" as const }, { ...custom, roles: "one" as const }, { ...custom, knowledge: ["memory"] as Answers["knowledge"] }]) {
      expect(recommend(a).tools.some((t) => t.tool === "langgraph")).toBe(false);
    }
    expect(recommend({ ...custom, knowledge: ["memory"] }).tools.find((t) => t.core)?.tool).toBe("hermes");
  });

  it("exports the full design and fixture with an accurate platform cost label", () => {
    const r = recommend(custom), bp = buildBlueprint(r, custom), kit = buildStarterKit(r, bp, custom);
    expect(kitProblems(r, bp, custom, kit)).toEqual([]);
    const get = (path: string) => kit.files.find((f) => f.path === path)!.content;
    expect(JSON.parse(get("langgraph/design.json")).blueprint).toEqual(bp);
    expect(get("langgraph/graph.py")).toBe(readFileSync(new URL("../src/lib/templates/langgraph-demo.py", import.meta.url), "utf8"));
    expect(get("langgraph/README.md")).toContain("not an implemented business agent");
    expect(kit.tools.find((t) => t.id === "langgraph")?.action).toMatchObject({ kind: "zip", prefix: "langgraph/" });
    expect(estimateCost(r, bp, custom).platform.label).toBe("LangGraph service");
    expect(bp.nodes.some((n) => n.label.includes("undefined"))).toBe(false);
  });

  it("retrieves and exports relevant chapters without giving no-AI designs AI instrumentation", () => {
    for (const a of [custom, { ...custom, trigger: "data" as const }, ...sampledPaths(300)]) {
      const r = recommend(a), bp = buildBlueprint(r, a), kit = buildStarterKit(r, bp, a);
      const langgraph = r.tools.some((t) => t.tool === "langgraph");
      const ids = selectChunks(r, bp, undefined, MAX_CHUNKS, KIT_CHUNKS).map((c) => c.id);
      expect(new Set(ids.slice(0, KIT_CHUNKS.length))).toEqual(new Set(KIT_CHUNKS));
      for (const id of LANGGRAPH_ENGINEERING) expect(ids.includes(id)).toBe(langgraph);
      for (const id of AI_QUALITY) expect(ids.includes(id)).toBe(r.models.needed);
      for (const path of ["evals/ENGINEERING.md", "observability/ENGINEERING.md"]) {
        const file = kit.files.find((f) => f.path === path);
        expect(Boolean(file)).toBe(r.models.needed);
        if (file) expect(kit.files[0].content).toContain(file.content.trimEnd());
      }
      expect(kit.files.some((f) => f.path === "langgraph/ENGINEERING.md")).toBe(langgraph);
      expect(kitProblems(r, bp, a, kit)).toEqual([]);
    }
  });

  it("invalidates cached output when shared evaluation guidance changes", () => {
    const original = loadChunks(), revised = new Map(original);
    const chunk = revised.get("O01")!;
    revised.set("O01", { ...chunk, text: chunk.text + "\nUpdated evaluation criteria." });
    expect(knowledgeFingerprint(revised)).not.toBe(knowledgeFingerprint(original));
  });
});
