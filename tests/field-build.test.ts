// What a system built from one of the guide's kits showed (knowledge base Q05),
// turned into general checks: four more build practices (hand-worked answers
// for calculations, one settings file and a case per outcome, a queue a person
// can work through, figures labeled by where they come from), an Airflow
// scaffold that follows the stated frequency and names the steps a person
// does, and a review estimate that says what it counts.
import { describe, expect, it } from "vitest";
import { type Blueprint, buildBlueprint } from "../src/lib/blueprint";
import { estimateCost } from "../src/lib/cost";
import { ALGORITHMS, algorithm } from "../src/lib/models";
import { practicesFor } from "../src/lib/practices";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { airflowSchedule, buildStarterKit } from "../src/lib/starter";
import { QUALITY_METHODS, loadChunks } from "../server/knowledge";

const scheduled: Answers = { task: "Check each store's stock against its limits", shape: "rules", systems: "read", trigger: "schedule", volume: "occasional", risks: ["irreversible"], location: "open", team: "large" };
const onEvent: Answers = { ...scheduled, trigger: "event" };
const dataJobs: Answers = { task: "Load the feeds and check limits", shape: "rules", systems: "read", trigger: "data", volume: "occasional", risks: ["irreversible"], location: "open", team: "large" };

const design = (a: Answers) => {
  const r = recommend(a);
  return { r, bp: buildBlueprint(r, a) };
};
const brief = (a: Answers, change?: (bp: Blueprint) => Blueprint) => {
  const { r, bp } = design(a);
  return buildStarterKit(r, change ? change(bp) : bp, a).files.find((f) => f.path === "BUILD.md")!.content;
};
/** The same design with its first fixed step turned into a control chart. */
const withChart = (bp: Blueprint): Blueprint => {
  const i = bp.nodes.findIndex((n) => n.kind === "fixed");
  return { ...bp, nodes: bp.nodes.map((n, j) => (j === i ? { ...n, engine: algorithm("spc") } : n)) };
};

describe("build practices from a scheduled monitor", () => {
  const ids = (a: Answers, change?: (bp: Blueprint) => Blueprint) => {
    const { r, bp } = design(a);
    return practicesFor(r, change ? change(bp) : bp, a).map((p) => p.id);
  };

  it("asks for hand-worked answers and a methods review only when a step computes a statistic", () => {
    expect(ids(scheduled)).not.toContain("P13");
    expect(ids(scheduled, withChart)).toContain("P13");
    const text = brief(scheduled, withChart);
    expect(text).toMatch(/worked by hand with the number it must give/);
    expect(text).toMatch(/constant values, a single point and missing or non-numeric values/);
    expect(text).toMatch(/someone other than the builder review the methods/);
  });

  it("asks for one settings file and a case per outcome wherever the design decides", () => {
    const { bp } = design(scheduled);
    expect(bp.nodes.some((n) => n.kind === "decision")).toBe(true);
    expect(ids(scheduled)).toContain("P14");
    expect(brief(scheduled)).toMatch(/keep that direct comparison as the first rule/);
    // A design with no decision has nothing to put in a table.
    const none = { ...bp, nodes: bp.nodes.filter((n) => n.kind !== "decision") };
    expect(practicesFor(design(scheduled).r, none, scheduled).map((p) => p.id)).not.toContain("P14");
  });

  it("asks for a graded queue and follow-up wherever a person steps in", () => {
    const { r, bp } = design(dataJobs);
    expect(bp.nodes.some((n) => n.kind === "human")).toBe(true);
    expect(practicesFor(r, bp, dataJobs).map((p) => p.id)).toContain("P15");
    const text = brief(dataJobs);
    expect(text).toMatch(/show the worst first, each case with its evidence and the rule or reason/);
    expect(text).toMatch(/on a map when the items have locations/);
    expect(text).toMatch(/record the next action, its owner and a due date/);
  });

  it("always asks for figures to be labeled measured, modelled or sample", () => {
    for (const a of [scheduled, onEvent, dataJobs]) expect(ids(a)).toContain("P16");
    expect(brief(scheduled)).toMatch(/A modelled or sample figure never feeds a decision/);
  });

  it("says in the catalog what each statistical method needs before its number is used", () => {
    expect(ALGORITHMS.spc.how).toMatch(/fixed baseline before the period being judged/);
    expect(ALGORITHMS.capability.how).toMatch(/at or over the limit is flagged on its own/);
    expect(ALGORITHMS.reliability.how).toMatch(/needs those records/);
  });
});

describe("the Airflow scaffold", () => {
  const dag = (a: Answers) => {
    const { r, bp } = design(a);
    return buildStarterKit(r, bp, a).files.find((f) => /^airflow\/dags\//.test(f.path))!.content;
  };

  it("starts from a timetable that matches how often the owner said it runs", () => {
    expect(airflowSchedule({ ...scheduled, volume: "occasional" }).cron).toBe("0 6 * * 1,3,5");
    expect(airflowSchedule({ ...scheduled, volume: "daily" }).cron).toBe("*/30 * * * *");
    expect(airflowSchedule({ ...scheduled, volume: "high" }).cron).toBe("*/5 * * * *");
    // Work that starts when data lands keeps a daily run behind its sensors.
    expect(airflowSchedule(dataJobs).cron).toBe("@daily");
  });

  it("says what to do when the upstream data is not an Airflow job, and names the steps a person does", () => {
    const text = dag(dataJobs);
    expect(text).toMatch(/replace these two with a sensor that checks/);
    const { bp } = design(dataJobs);
    const person = bp.nodes.find((n) => n.kind === "human")!;
    expect(text).toContain(`# Step ${person.step} (${person.name}) is a person's step.`);
    expect(text).toMatch(/the chain above does not wait/);
  });
});

describe("the review estimate", () => {
  it("says the review estimate counts one result a run when runs are batches", () => {
    const { r, bp } = design(scheduled);
    expect(estimateCost(r, bp, scheduled).review!.note).toMatch(/one result a run/);
    const e = design(onEvent);
    expect(estimateCost(e.r, e.bp, onEvent).review?.note ?? "").not.toMatch(/one result a run/);
  });
});

describe("the knowledge behind them", () => {
  it("has the assumptions chunk and the field-build chunk, each with read sources", () => {
    const all = loadChunks();
    expect(QUALITY_METHODS).toEqual(["Q01", "Q02", "Q03", "Q04", "Q05"]);
    expect(all.get("Q04")!.text).toMatch(/nist-2012-ehandbook-pmc/);
    expect(all.get("Q05")!.text).toMatch(/splitsync-2026-capacity-monitor/);
  });
});
