import { describe, expect, it } from "vitest";
import { buildBlueprint } from "../src/lib/blueprint";
import { DECISION_METHODS, FIXED_METHODS } from "../src/lib/design";
import { ALGORITHMS } from "../src/lib/models";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { QUALITY_METHODS, selectChunks, statisticalTask, taskText } from "../server/knowledge";

// Answers for a task with no AI (fixed rules), and for one with AI steps.
const rulesTask: Answers = { task: "Monitor transformer loads against their ratings", shape: "rules", systems: "read", trigger: "schedule", volume: "occasional", risks: ["irreversible"], location: "residency", team: "large" };
const aiEmails: Answers = { task: "Answer routine customer emails", shape: "judgement", kinds: "no", split: "sequential", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" };
const aiFaults: Answers = { ...aiEmails, task: "Read engineers' fault reports and flag equipment likely to fail" };

const ids = (a: Answers) => {
  const r = recommend(a);
  return selectChunks(r, buildBlueprint(r, a), undefined, undefined, undefined, taskText(a)).map((c) => c.id);
};

describe("statistical methods", () => {
  it("are in the no-AI method catalog and allowed on fixed and decision steps", () => {
    for (const id of ["spc", "capability", "reliability", "rpn"] as const) {
      expect(ALGORITHMS[id].name).toBeTruthy();
      expect(FIXED_METHODS).toContain(id);
    }
    expect(DECISION_METHODS).toContain("spc");
    expect(DECISION_METHODS).toContain("capability");
  });

  it("recognise a task about measurements, defects or failures from its words", () => {
    expect(statisticalTask("Monitor transformer loads")).toBe(true);
    expect(statisticalTask("Track defect counts per batch")).toBe(true);
    expect(statisticalTask("Predict when pumps will fail")).toBe(true);
    expect(statisticalTask("Answer routine customer emails")).toBe(false);
    expect(statisticalTask("Schedule interviews with candidates")).toBe(false);
  });

  it("reach every design without AI", () => {
    const got = ids(rulesTask);
    for (const id of QUALITY_METHODS) expect(got, id).toContain(id);
  });

  it("reach an AI design only when the task is about measurements or failures", () => {
    const faults = ids(aiFaults);
    for (const id of QUALITY_METHODS) expect(faults, id).toContain(id);
    const emails = ids(aiEmails);
    for (const id of QUALITY_METHODS) expect(emails, id).not.toContain(id);
  });

  it("includes the task-specific details in the retrieval text", () => {
    const a: Answers = { ...aiEmails, details: [{ q: "What is measured?", a: "Defect counts per shift" }] };
    expect(statisticalTask(taskText(a))).toBe(true);
  });
});
