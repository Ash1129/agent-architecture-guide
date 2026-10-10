import { describe, expect, it } from "vitest";
import { memoryCache } from "../server/cache";
import { INSTRUCTIONS, SPLIT_VERSION, handleSplit } from "../server/split";
import { buildBlueprint } from "../src/lib/blueprint";
import { drawioSystemXml } from "../src/lib/exportxml";
import { normaliseTask } from "../src/lib/interview";
import { MAX_JOBS, MAX_JOB_DESCRIPTION, decodeProcess, isSplit, partOf, processCode, removeJob, validateSplit } from "../src/lib/process";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { resultCode } from "../src/lib/share";
import { sampledPaths } from "./paths";

const screening: Answers = {
  task: "Screen job applications against each role's requirements",
  shape: "judgement", kinds: "yes", split: "sequential", quality: "partly", knowledge: ["playbook", "reference"],
  systems: "act", trigger: "event", volume: "high", risks: ["visible", "personal", "irreversible"], location: "restricted", team: "large",
};
const scheduling: Answers = {
  task: "Schedule phone screens and onsite interviews",
  shape: "varies", kinds: "yes", roles: "one", quality: "clear", knowledge: ["playbook"],
  systems: "act", trigger: "event", volume: "daily", risks: ["visible", "personal"], location: "restricted", team: "large",
};

/** A split the model might return: jobs numbered from 1. */
const hiring = {
  title: "Kushim hiring pipeline",
  jobs: [
    { title: "Screen job applications against each role's requirements", description: "About 38,000 applications a year arrive in Greenhouse. A recruiter confirms every rejection." },
    { title: "Schedule phone screens and onsite interviews", description: "Coordinators book interviews by email and calendar links; 22% of onsite candidates withdraw." },
  ],
  handoffs: [{ from: 1, to: 2, via: "Greenhouse", when: "A recruiter approves a phone screen" }],
};

const fakeModel = (reply: string) => {
  const calls: { instructions: string; input: string }[] = [];
  return { calls, complete: async (instructions: string, input: string) => (calls.push({ instructions, input }), reply) };
};
const env = { apiKey: "test-key", model: "gpt-6-luna" };

describe("splitting a described problem into jobs", () => {
  it("keeps well-formed jobs and turns the model's job numbers into indexes", () => {
    const s = validateSplit(hiring, "…");
    expect(isSplit(s)).toBe(true);
    expect(s.title).toBe("Kushim hiring pipeline");
    expect(s.jobs.map((j) => j.title)).toEqual(hiring.jobs.map((j) => j.title));
    expect(s.handoffs).toEqual([{ from: 0, to: 1, via: "Greenhouse", when: "A recruiter approves a phone screen" }]);
  });

  it("drops handoffs that don't join two different, existing jobs, and repeats of a pair", () => {
    const s = validateSplit(
      {
        ...hiring,
        handoffs: [
          { from: 1, to: 2, via: "Greenhouse", when: "Approved" },
          { from: 1, to: 2, via: "Email", when: "Again" },
          { from: 2, to: 2, via: "Greenhouse", when: "Itself" },
          { from: 1, to: 5, via: "Greenhouse", when: "Nowhere" },
          { from: 1, to: 2.5, via: "Greenhouse", when: "Half" },
          { from: 2, to: 1, via: "", when: "No system" },
        ],
      },
      "…",
    );
    expect(s.handoffs).toHaveLength(1);
    expect(s.handoffs[0].via).toBe("Greenhouse");
  });

  it("keeps at most four jobs, each description short enough to be read as one task", () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ title: `Job number ${i + 1}`, description: "x".repeat(2000) }));
    const s = validateSplit({ title: "Many", jobs: many, handoffs: [] }, "…");
    expect(s.jobs).toHaveLength(MAX_JOBS);
    for (const j of s.jobs) expect(j.description.length).toBeLessThanOrEqual(MAX_JOB_DESCRIPTION);
  });

  it("turns anything unusable into one job, the description itself, without throwing", () => {
    for (const raw of [null, "no", {}, { jobs: "x" }, { jobs: [{ title: "" }] }]) {
      const s = validateSplit(raw, "Answer routine customer emails");
      expect(isSplit(s)).toBe(false);
      expect(s.jobs[0]).toEqual({ title: "Answer routine customer emails", description: "Answer routine customer emails" });
      expect(s.handoffs).toEqual([]);
    }
  });

  it("renumbers the handoffs around a removed job", () => {
    const three = validateSplit(
      {
        title: "Three",
        jobs: [...hiring.jobs, { title: "Send offers to chosen candidates", description: "Offers are drafted in Workday and approved by the hiring manager." }],
        handoffs: [
          { from: 1, to: 2, via: "Greenhouse", when: "Approved for a phone screen" },
          { from: 2, to: 3, via: "Workday", when: "The panel recommends hiring" },
        ],
      },
      "…",
    );
    const s = removeJob(three, 0);
    expect(s.jobs.map((j) => j.title)).toEqual(["Schedule phone screens and onsite interviews", "Send offers to chosen candidates"]);
    expect(s.handoffs).toEqual([{ from: 0, to: 1, via: "Workday", when: "The panel recommends hiring" }]);
  });
});

describe("a process link", () => {
  const process = { title: "Kushim hiring pipeline", parts: [screening, scheduling], handoffs: [{ from: 0, to: 1, via: "Greenhouse", when: "A recruiter approves a phone screen" }] };

  it("carries every job's answers and the handoffs", () => {
    const back = decodeProcess(processCode(process))!;
    expect(back.title).toBe(process.title);
    expect(back.parts.map(resultCode)).toEqual(process.parts.map(resultCode));
    expect(back.handoffs).toEqual(process.handoffs);
  });

  it("knows which job a result is", () => {
    expect(partOf(process, resultCode(scheduling))).toBe(1);
    expect(partOf(process, resultCode({ ...scheduling, volume: "occasional" }))).toBe(-1);
    expect(partOf(null, resultCode(scheduling))).toBe(-1);
  });

  it("refuses a damaged link, an unfinished job, or a single job", () => {
    expect(decodeProcess("not-a-code")).toBeNull();
    expect(decodeProcess(processCode({ ...process, parts: [screening, { task: "Half done", shape: "varies" }] }))).toBeNull();
    expect(decodeProcess(processCode({ ...process, parts: [screening] }))).toBeNull();
  });
});

describe("split endpoint", () => {
  it("refuses without a key or a description, without calling anything", async () => {
    const f = fakeModel("{}");
    expect((await handleSplit({ description: "Hiring" }, {}, { complete: f.complete })).status).toBe(503);
    expect((await handleSplit({ description: " " }, env, { complete: f.complete })).status).toBe(400);
    expect((await handleSplit({ nope: 1 }, env, { complete: f.complete })).status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it("asks the model, validates the split and serves a repeat from the cache", async () => {
    const cache = memoryCache();
    const f = fakeModel("Here:\n```json\n" + JSON.stringify(hiring) + "\n```");
    const description = "Our recruiters screen 38,000 applications a year and then schedule interviews by hand.";
    const out = await handleSplit({ description }, { ...env, cache }, { complete: f.complete });
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ source: "ai", model: "gpt-6-luna" });
    expect(f.calls[0].instructions).toBe(INSTRUCTIONS);
    expect(f.calls[0].input).toContain(description);
    expect(cache.get("split", `${SPLIT_VERSION}:${normaliseTask(description)}`)).toBeDefined();

    const again = await handleSplit({ description: description.toUpperCase() }, { ...env, cache }, { complete: f.complete });
    expect(again.body.source).toBe("cache");
    expect(f.calls).toHaveLength(1);
  });

  it("reads a whole case study, not just its first few hundred characters", async () => {
    const f = fakeModel(JSON.stringify(hiring));
    const description = `${"Background. ".repeat(300)}The last line matters.`;
    await handleSplit({ description }, env, { complete: f.complete });
    expect(f.calls[0].input).toContain("The last line matters.");
  });

  it("answers with an error, not a crash, when the reply isn't JSON", async () => {
    const out = await handleSplit({ description: "Hiring at Kushim" }, env, { complete: fakeModel("Sorry, I can't.").complete });
    expect(out.status).toBe(502);
  });
});

describe("draw.io export of a whole system", () => {
  /** Tags open and close in order, and no raw < or > is left in text. */
  function wellFormed(xml: string) {
    const body = xml.replace(/<\?xml[^>]*\?>/, "");
    const stack: string[] = [];
    for (const m of body.matchAll(/<(\/?)([A-Za-z][\w-]*)([^>]*?)(\/?)>/g)) {
      const [, close, name, , self] = m;
      if (self) continue;
      if (close) {
        if (stack.pop() !== name) return false;
      } else stack.push(name);
    }
    return stack.length === 0 && !/[<>]/.test(body.replace(/<[^>]*>/g, ""));
  }
  const job = (a: Answers) => ({ task: a.task!, design: buildBlueprint(recommend(a), a), source: "rules" as const });

  it("puts every job on one page, joined through the system that carries each handoff, then a page per job", () => {
    const jobs = [job(screening), job(scheduling)];
    const xml = drawioSystemXml({ title: "Kushim hiring pipeline", jobs, handoffs: [{ from: 0, to: 1, via: "Greenhouse", when: "A recruiter approves a phone screen" }] });
    expect(wellFormed(xml)).toBe(true);
    expect(xml.match(/<diagram /g)).toHaveLength(3);
    expect(xml).toContain('name="Whole system"');
    // Every connection on the whole-system page joins two shapes that exist on it.
    const page = xml.slice(xml.indexOf('name="Whole system"'), xml.indexOf("</diagram>"));
    const ids = new Set([...page.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    for (const m of page.matchAll(/ source="([^"]+)" target="([^"]+)"/g)) {
      expect(ids.has(m[1])).toBe(true);
      expect(ids.has(m[2])).toBe(true);
    }
    // The handoff leaves job 1's last finish and starts job 2's first step.
    const end = [...jobs[0].design.nodes].reverse().find((n) => n.kind === "end")!;
    expect(page).toContain(`source="system-j1-${end.id}" target="system-h1"`);
    expect(page).toContain(`source="system-h1" target="system-j2-${jobs[1].design.nodes[0].id}"`);
    expect(page).toContain("&lt;b&gt;Greenhouse&lt;/b&gt;");
  });

  it("stays well-formed for any mix of designs", () => {
    const paths = sampledPaths(24);
    for (let i = 0; i + 2 < paths.length; i += 3) {
      const xml = drawioSystemXml({
        title: "A <process> & more",
        jobs: paths.slice(i, i + 3).map(job),
        handoffs: [
          { from: 0, to: 1, via: "Inbox", when: "a \"reply\" is ready" },
          { from: 0, to: 2, via: "CRM", when: "the deal closes" },
        ],
      });
      expect(wellFormed(xml)).toBe(true);
    }
  });
});
