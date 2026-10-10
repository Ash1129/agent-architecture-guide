import { describe, expect, it } from "vitest";
import type { Answers } from "../src/lib/questions";
import { recommend, type Recommendation } from "../src/lib/rules";
import { type Blueprint, buildBlueprint, buildSimplerBlueprint, flowAsText, outgoing } from "../src/lib/blueprint";
import { allPaths, sampledPaths } from "./paths";

const base = {
  task: "A task",
  location: "open",
  team: "mid",
  volume: "daily",
  trigger: "event",
} as const;

const cases: Record<string, Answers> = {
  pipeline: { ...base, shape: "rules", systems: "act", risks: ["none"] },
  dag: { ...base, shape: "rules", systems: "none", trigger: "data", team: "large", risks: ["none"] },
  chain: { ...base, shape: "judgement", kinds: "no", split: "sequential", quality: "partly", knowledge: ["none"], systems: "none", risks: ["none"] },
  routing: { ...base, shape: "judgement", kinds: "yes", split: "sections", quality: "clear", knowledge: ["playbook"], systems: "read", risks: ["visible"] },
  sections: { ...base, shape: "judgement", kinds: "no", split: "sections", quality: "clear", knowledge: ["reference"], systems: "none", trigger: "manual", risks: ["none"] },
  voting: { ...base, shape: "judgement", kinds: "no", split: "voting", quality: "partly", knowledge: ["none"], systems: "none", risks: ["irreversible"] },
  agent: { ...base, shape: "varies", kinds: "no", roles: "one", quality: "clear", knowledge: ["none"], systems: "act", trigger: "schedule", risks: ["none"] },
  routedAgent: { ...base, shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook", "reference"], systems: "act", risks: ["visible", "personal"] },
  multi: { ...base, shape: "varies", kinds: "no", roles: "both", quality: "clear", knowledge: ["memory"], systems: "read", trigger: "schedule", risks: ["none"], location: "restricted", team: "large" },
  routedMulti: { ...base, shape: "varies", kinds: "yes", roles: "specialists", quality: "clear", knowledge: ["none"], systems: "none", risks: ["none"] },
};

const bp = (a: Answers) => buildBlueprint(recommend(a), a);

/** Every structural property a drawable, honest diagram must have. */
function problems(b: Blueprint, r: Recommendation | null): string[] {
  const p: string[] = [];
  const byId = new Map(b.nodes.map((n) => [n.id, n]));
  if (byId.size !== b.nodes.length) p.push("duplicate node ids");
  b.nodes.forEach((n, i) => n.step !== i + 1 && p.push(`step order broken at ${n.id}`));
  if (b.stages > 7) p.push(`too many stages: ${b.stages}`);
  if (b.tracks > 3) p.push(`too many tracks: ${b.tracks}`);
  if (b.nodes.filter((n) => n.kind === "end").length !== 1) p.push("not exactly one finish");
  if (!b.nodes.some((n) => n.kind === "start")) p.push("no start");

  for (const n of b.nodes) {
    if (n.tracks[0] < 0 || n.tracks[1] >= b.tracks || n.tracks[0] > n.tracks[1]) p.push(`bad tracks on ${n.id}`);
    if (!n.what || !n.why || !n.passes) p.push(`missing explanation on ${n.id}`);
    if (n.name.length > 32) p.push(`name too long on ${n.id}`);
    for (const g of n.gates) if (g.text.length > 27) p.push(`badge too long on ${n.id}: ${g.text}`);
    if (n.label.length > 30) p.push(`label too long on ${n.id}: ${n.label}`);
    for (const e of b.edges) if (e.from === n.id && e.label && e.style !== "loop" && e.label.length > 10) p.push(`edge label too wide: ${e.label}`);
    if (r) for (const id of n.rules) if (!r.fired.includes(id)) p.push(`${n.id} cites rule ${id} that didn't fire`);
    for (const m of b.nodes) {
      if (m !== n && m.stage === n.stage && m.tracks[0] <= n.tracks[1] && n.tracks[0] <= m.tracks[1]) p.push(`overlap ${n.id}/${m.id}`);
    }
  }

  for (const e of b.edges) {
    const f = byId.get(e.from);
    const t = byId.get(e.to);
    if (!f || !t) {
      p.push(`dangling edge ${e.from}->${e.to}`);
      continue;
    }
    if (f === t) p.push("self edge");
    if (e.style === "loop" ? t.stage > f.stage : t.stage <= f.stage && !(t.kind === "tool" && t.stage === f.stage)) {
      p.push(`edge direction ${e.from}->${e.to}`);
    }
    // A connection that skips stages travels along its source's track. Nothing
    // in between may sit on that line.
    if (e.style !== "loop" && t.stage - f.stage > 1) {
      const line = (f.tracks[0] + f.tracks[1]) / 2;
      for (const m of b.nodes) {
        if (m.stage > f.stage && m.stage < t.stage && m.tracks[0] <= line && line <= m.tracks[1]) {
          p.push(`edge ${e.from}->${e.to} passes through ${m.id}`);
        }
      }
    }
  }

  // Every step is reachable from a start and leads to the finish.
  const reach = (from: string[], dir: "out" | "in") => {
    const seen = new Set(from);
    const queue = [...from];
    while (queue.length) {
      const id = queue.shift()!;
      for (const e of b.edges) {
        const nextId = dir === "out" ? (e.from === id ? e.to : null) : e.to === id ? e.from : null;
        if (nextId && !seen.has(nextId)) seen.add(nextId), queue.push(nextId);
      }
    }
    return seen;
  };
  const fromStart = reach(b.nodes.filter((n) => n.kind === "start").map((n) => n.id), "out");
  const toEnd = reach(["end"], "in");
  for (const n of b.nodes) {
    if (!fromStart.has(n.id)) p.push(`${n.id} unreachable`);
    if (!toEnd.has(n.id)) p.push(`${n.id} never finishes`);
  }

  const text = JSON.stringify(b);
  if (/[–—]/.test(text)) p.push("em or en dash");
  return p;
}

function shapeProblems(b: Blueprint, r: Recommendation): string[] {
  const p: string[] = [];
  const loops = b.edges.filter((e) => e.style === "loop");
  const maxLanes = Math.max(...Array.from({ length: b.stages }, (_, s) => b.nodes.filter((n) => n.stage === s).length));
  const branches = b.nodes.some((n) => n.kind === "decision" && new Set(outgoing(b, n.id).map((o) => o.node.id)).size >= 2);
  const { primary, addOns } = r.topology;

  if (primary === "routing" || addOns.includes("routing")) if (!branches) p.push("routing without a branching decision");
  if (primary === "parallel-sections" || primary === "parallel-voting") {
    if (b.nodes.filter((n) => n.kind === "ai" && b.nodes.filter((m) => m.stage === n.stage && m.kind === "ai").length === 3).length !== 3) {
      p.push("parallel without three lanes");
    }
  }
  if (primary === "orchestrator" && b.edges.filter((e) => e.style === "assign").length < 2) p.push("orchestrator without workers");
  if ((primary === "agent-loop" || primary === "orchestrator") && loops.length === 0) p.push("agent without a loop");
  if (primary === "pipeline" && !branches) p.push("pipeline without its rule branch");
  if (primary === "dag" && b.nodes.filter((n) => n.kind === "start").length < 2) p.push("dependency graph with one input");
  if (addOns.includes("evaluator")) {
    const asStep = loops.some((e) => e.label === "fix");
    const asGate = b.nodes.some((n) => n.gates.some((g) => /checklist/.test(g.text)));
    if (!asStep && !asGate) p.push("evaluator missing");
  }
  // Only a plain sequence of fixed or AI steps may be drawn as a straight line.
  if (primary !== "chain" && primary !== "pipeline" && maxLanes < 2 && loops.length === 0) p.push("non-linear design drawn as a line");

  // Human oversight matches the autonomy level.
  const level = r.autonomy.level;
  const end = b.nodes.find((n) => n.kind === "end")!;
  const humanNodes = b.nodes.filter((n) => n.kind === "human");
  const humanGates = b.nodes.flatMap((n) => n.gates).filter((g) => g.kind === "human");
  if (level <= 2) {
    const approve = b.nodes.find((n) => n.id === "approve");
    if (!approve) p.push("approve-every-output without an approval step");
    const intoEnd = b.edges.filter((e) => e.to === "end").map((e) => b.nodes.find((n) => n.id === e.from)!);
    if (intoEnd.some((n) => n.kind !== "human")) p.push("output reaches the finish without a person");
  }
  if (level === 3 && humanNodes.length === 0 && humanGates.length === 0 && r.models.needed) p.push("level 3 without any human checkpoint");
  if (level === 3 && !r.models.needed && humanNodes.length + humanGates.length === 0) p.push("level 3 automation without sign-off");
  if (level === 4 && r.models.needed && !end.gates.some((g) => g.kind === "human")) p.push("level 4 without spot checks");
  // Stop conditions are always visible where AI is involved.
  if (r.models.needed && !b.nodes.some((n) => n.gates.some((g) => g.kind === "stop"))) p.push("no stop condition");
  return p;
}

describe("named decision paths", () => {
  it("draws a rules pipeline with a branch and no AI", () => {
    const b = bp(cases.pipeline);
    expect(b.nodes.some((n) => n.kind === "ai")).toBe(false);
    expect(outgoing(b, "rules").map((o) => o.edge.label)).toEqual(["match", "no match"]);
  });

  it("draws a dependency graph with two inputs that both feed the task", () => {
    const b = bp(cases.dag);
    expect(b.nodes.filter((n) => n.kind === "start")).toHaveLength(2);
    expect(b.edges.filter((e) => e.to === "run")).toHaveLength(2);
  });

  it("draws a prompt chain with a gate that can send work back", () => {
    const b = bp(cases.chain);
    expect(b.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(["step1", "gate", "step2"]));
    expect(b.edges).toContainEqual({ from: "gate", to: "step1", label: "retry", style: "loop" });
  });

  it("draws routing as branches, with unclear items going to a person", () => {
    const b = bp(cases.routing);
    expect(outgoing(b, "router").map((o) => o.node.id)).toEqual(["typeA", "typeB", "unclear"]);
    expect(b.nodes.find((n) => n.id === "unclear")!.kind).toBe("human");
    expect(b.nodes.find((n) => n.id === "typeA")!.gates.some((g) => /checklist/.test(g.text))).toBe(true);
  });

  it("draws parallel sections side by side, then combined and checked", () => {
    const b = bp(cases.sections);
    const lanes = b.nodes.filter((n) => n.id.startsWith("part"));
    expect(new Set(lanes.map((n) => n.stage)).size).toBe(1);
    expect(lanes.map((n) => n.tracks[0])).toEqual([0, 1, 2]);
    expect(b.edges).toContainEqual({ from: "check", to: "merge", label: "fix", style: "loop" });
  });

  it("draws an agent loop with its tools, a stop rule and a checker", () => {
    const b = bp(cases.agent);
    expect(b.edges).toContainEqual({ from: "tools", to: "agent", label: "result", style: "loop" });
    expect(b.nodes.find((n) => n.id === "agent")!.gates.some((g) => g.kind === "stop")).toBe(true);
    expect(b.nodes.find((n) => n.id === "tools")!.gates.some((g) => g.kind === "human")).toBe(true);
  });

  it("routes routine work around the agent but still through approval", () => {
    const b = bp(cases.routedAgent);
    expect(recommend(cases.routedAgent).autonomy.level).toBe(2);
    expect(outgoing(b, "router").map((o) => o.node.id)).toEqual(["routine", "agent"]);
    expect(outgoing(b, "routine").map((o) => o.node.id)).toEqual(["approve"]);
  });

  it("draws a coordinator handing work to three specialists, with a loop back", () => {
    const b = bp(cases.multi);
    expect(b.edges.filter((e) => e.from === "coord" && e.style === "assign")).toHaveLength(3);
    expect(b.edges).toContainEqual({ from: "combine", to: "coord", label: "gaps found", style: "loop" });
  });

  it("keeps routed multi-agent designs within three tracks", () => {
    const b = bp(cases.routedMulti);
    expect(b.tracks).toBe(3);
    expect(b.edges.filter((e) => e.style === "assign")).toHaveLength(2);
  });

  it("describes the flow in words for copying and screen readers", () => {
    const lines = flowAsText(bp(cases.routing));
    expect(lines[0]).toMatch(/^1\. /);
    expect(lines.join("\n")).toMatch(/Then: step \d/);
  });
});

describe("simpler starting options", () => {
  it.each(Object.entries(cases))("%s has a smaller simpler option", (_name, a) => {
    const r = recommend(a);
    const full = buildBlueprint(r, a);
    const simple = buildSimplerBlueprint(r, a);
    expect(simple.variant).toBe("simpler");
    expect(simple.title).toBe(r.simpler.title);
    expect(simple.nodes.length).toBeLessThanOrEqual(full.nodes.length);
    expect(problems(simple, null)).toEqual([]);
  });
});

describe("every answer path", () => {
  const paths = [...allPaths(), ...sampledPaths(3000)];

  it("produces a well-formed, honest diagram for both options", () => {
    const failures: string[] = [];
    const shapes = new Set<string>();
    for (const a of paths) {
      const r = recommend(a);
      const full = buildBlueprint(r, a);
      const simple = buildSimplerBlueprint(r, a);
      shapes.add(`${r.topology.primary}|${r.autonomy.level}|${full.tracks}`);
      const p = [...problems(full, r), ...shapeProblems(full, r), ...problems(simple, null).map((x) => `simpler: ${x}`)];
      if (p.length && failures.length < 6) failures.push(`${p.join("; ")} <= ${JSON.stringify(a)}`);
    }
    expect(failures).toEqual([]);
    expect(shapes.size).toBeGreaterThan(20);
  }, 120_000);
});

describe("models and methods on every step", () => {
  const paths = [...allPaths(), ...sampledPaths(2000)];

  it("names a model for every AI step and a method for every non-AI working step", () => {
    const failures: string[] = [];
    for (const a of paths) {
      const r = recommend(a);
      for (const b of [buildBlueprint(r, a), buildSimplerBlueprint(r, a)]) {
        for (const n of b.nodes) {
          const bad =
            (n.kind === "ai" && n.engine?.kind !== "model") ||
            ((n.kind === "fixed" || n.kind === "decision") && !n.engine) ||
            (n.engine?.kind === "model" && !/Opus 5\.5|open-weight/.test(n.engine.prototype));
          if (bad && failures.length < 5) failures.push(`${b.variant}/${n.id} <= ${JSON.stringify(a)}`);
        }
        const models = b.nodes.filter((n) => n.engine?.kind === "model");
        if (r.approach.id === "automation" && b.variant === "recommended" && models.length && failures.length < 5) failures.push(`automation uses a model <= ${JSON.stringify(a)}`);
        const open = a.location === "restricted" || a.location === "independence" || (a.location === "residency" && a.team === "large");
        if (open && models.some((n) => /Claude/.test(n.engine!.name)) && failures.length < 5) failures.push(`Claude recommended where it can't be used <= ${JSON.stringify(a)}`);
      }
    }
    expect(failures).toEqual([]);
  }, 120_000);

  it("uses Sonnet to sort, the most capable to coordinate, and never defaults to Haiku 4.5", () => {
    const routed = bp(cases.routing);
    expect(routed.nodes.find((n) => n.id === "router")!.engine!.short).toBe("Sonnet 5.5");
    expect(bp(cases.routedMulti).nodes.find((n) => n.id === "coord")!.engine!.short).toBe("Opus 5.5");
    const busy = bp({ ...cases.chain, volume: "high" });
    expect(busy.nodes.find((n) => n.id === "step1")!.engine!.short).toBe("Sonnet 5.5");
    const step1 = busy.nodes.find((n) => n.id === "step1")!.engine!;
    expect(step1.kind === "model" && step1.why).toMatch(/Haiku 4\.5 is cheaper/);
    expect(bp(cases.chain).nodes.find((n) => n.id === "step1")!.engine!.short).toBe("Sonnet 5.5");
    expect(bp(cases.multi).nodes.find((n) => n.id === "coord")!.engine!.short).toBe("Open-weight, large");
  });

  it("names the algorithm for rule-based steps", () => {
    const pipe = bp(cases.pipeline);
    expect(pipe.nodes.find((n) => n.id === "rules")!.engine!.name).toBe("Decision table");
    expect(bp(cases.dag).nodes.find((n) => n.id === "run")!.engine!.name).toBe("Dependency scheduler (DAG)");
    expect(bp(cases.voting).nodes.find((n) => n.id === "merge")!.engine!.name).toBe("Majority vote");
  });
});
