import { beforeEach, describe, expect, it } from "vitest";
import { type CallRecord, type RequestRecord, callCost, classify, clearTelemetry, noteProblems, recordCall, records, summarize, track } from "../server/telemetry";

const call = (over: Partial<CallRecord> = {}): CallRecord => ({ model: "claude-haiku-5-5", attempt: "first", ms: 1000, input: 1000, output: 200, cacheRead: 0, cacheWrite: 0, stop: "end_turn", ...over });

beforeEach(() => clearTelemetry());

describe("how a request ended", () => {
  it("tells a first-try pass from a pass on the retry", () => {
    expect(classify(200, { source: "ai" }, [call()], [])).toBe("first-try");
    expect(classify(200, { source: "ai" }, [call(), call({ attempt: "retry", model: "claude-sonnet-5-5" })], ["missing a safeguard"])).toBe("retry");
  });
  it("counts an answer with no model call as cached, and a near-duplicate task as reused", () => {
    expect(classify(200, { source: "cache" }, [], [])).toBe("cache");
    expect(classify(200, { cached: true }, [], [])).toBe("cache");
    expect(classify(200, { source: "similar" }, [], [])).toBe("reused");
  });
  it("tells failed checks (the rules' version is shown) from an API failure", () => {
    expect(classify(502, { error: "x" }, [call(), call({ attempt: "retry" })], ["a check failed"])).toBe("fallback");
    expect(classify(502, { error: "x", problems: ["a check failed"] }, [call()], [])).toBe("fallback");
    expect(classify(502, { error: "Anthropic rejected the API key." }, [call({ stop: "error", input: 0, output: 0 })], [])).toBe("error");
    expect(classify(504, { error: "timeout" }, [], [])).toBe("error");
  });
  it("keeps bad requests and a missing key out of the quality numbers", () => {
    expect(classify(400, {}, [], [])).toBe("rejected");
    expect(classify(422, {}, [], [])).toBe("rejected");
    expect(classify(503, {}, [], [])).toBe("no-key");
  });
});

describe("what a call cost", () => {
  it("prices tokens at the guide's table, with prompt-cache reads and writes as Anthropic bills them", () => {
    expect(callCost(call({ input: 1_000_000, output: 0 }))).toBeCloseTo(0.1);
    expect(callCost(call({ model: "claude-sonnet-5-5", input: 0, output: 1_000_000 }))).toBeCloseTo(10);
    expect(callCost(call({ input: 0, output: 0, cacheRead: 1_000_000 }))).toBeCloseTo(0.01);
    expect(callCost(call({ input: 0, output: 0, cacheWrite: 1_000_000 }))).toBeCloseTo(0.125);
  });
  it("prices a dated model id like its family, and an unknown model at nothing", () => {
    expect(callCost(call({ model: "claude-haiku-5-5-20260901", input: 1_000_000, output: 0 }))).toBeCloseTo(0.1);
    expect(callCost(call({ model: "some-other-model" }))).toBe(0);
  });
});

describe("tracking a request", () => {
  it("ties the calls and failed checks made during a request to that request, and only that one", async () => {
    recordCall(call()); // outside any request: ignored
    const out = await track("design", async () => {
      recordCall(call());
      noteProblems(["safeguard  missing:\n  a person approves"]);
      recordCall(call({ attempt: "retry", model: "claude-sonnet-5-5" }));
      return { status: 200, body: { source: "ai" } };
    });
    expect(out.status).toBe(200);
    const [r] = records();
    expect(records()).toHaveLength(1);
    expect(r.step).toBe("design");
    expect(r.outcome).toBe("retry");
    expect(r.calls).toHaveLength(2);
    expect(r.problems).toEqual(["safeguard missing: a person approves"]);
  });
  it("keeps two requests running at once apart", async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
    await Promise.all([
      track("decide", async () => {
        recordCall(call());
        await tick();
        recordCall(call({ attempt: "retry" }));
        return { status: 200, body: {} };
      }),
      track("kit", async () => {
        await tick();
        recordCall(call());
        return { status: 200, body: {} };
      }),
    ]);
    const byStep = Object.fromEntries(records().map((r) => [r.step, r]));
    expect(byStep.decide.calls).toHaveLength(2);
    expect(byStep.kit.calls).toHaveLength(1);
    expect(byStep.kit.outcome).toBe("first-try");
  });
  it("records a handler that throws as an error and passes the error on", async () => {
    await expect(track("split", async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(records()[0]).toMatchObject({ step: "split", outcome: "error", status: 500, error: "boom" });
  });
  it("keeps the error message the step returned, never the request", async () => {
    await track("tailor", async () => ({ status: 502, body: { error: "The AI's workflow didn't pass the checks. Try again.", problems: ["x"] } }));
    expect(records()[0]).toMatchObject({ outcome: "fallback", error: "The AI's workflow didn't pass the checks. Try again." });
    expect(Object.keys(records()[0]).sort()).toEqual(["at", "calls", "error", "ms", "outcome", "problems", "status", "step"]);
  });
});

describe("the summary", () => {
  const rec = (step: string, outcome: RequestRecord["outcome"], calls: CallRecord[] = [], problems: string[] = [], ms = 1000, at = 1): RequestRecord => ({ at, step, outcome, status: 200, ms, calls, problems });

  it("counts outcomes per step and overall, with rates over the requests a model answered", () => {
    const s = summarize([
      rec("design", "first-try", [call()]),
      rec("design", "retry", [call(), call({ attempt: "retry", model: "claude-sonnet-5-5" })], ["missing safeguard"]),
      rec("design", "fallback", [call(), call({ attempt: "retry" })], ["missing safeguard", "bad graph"]),
      rec("design", "cache"),
      rec("split", "first-try", [call()]),
      rec("kit", "no-key"),
    ]);
    expect(s.requests).toBe(6);
    expect(s.answered).toBe(4);
    expect(s.outcomes).toMatchObject({ "first-try": 2, retry: 1, fallback: 1, cache: 1, "no-key": 1 });
    expect(s.steps.map((x) => x.step)).toEqual(["split", "design", "kit"]);
    const design = s.steps.find((x) => x.step === "design")!;
    expect(design).toMatchObject({ requests: 4, calls: 5 });
    expect(design.outcomes).toMatchObject({ "first-try": 1, retry: 1, fallback: 1, cache: 1 });
    expect(s.problems[0]).toEqual({ step: "design", problem: "missing safeguard", count: 2 });
  });
  it("adds up tokens and cost by step and by model, counting prompt-cache tokens as input", () => {
    const s = summarize([rec("decide", "retry", [call({ input: 100, cacheRead: 900, output: 50 }), call({ attempt: "retry", model: "claude-sonnet-5-5", input: 1000, output: 100 })])]);
    expect(s.steps[0]).toMatchObject({ input: 2000, output: 150 });
    expect(s.models.map((m) => m.model)).toEqual(["claude-sonnet-5-5", "claude-haiku-5-5"]);
    expect(s.cost).toBeCloseTo(s.models.reduce((x, m) => x + m.cost, 0));
  });
  it("times only requests that called a model, and lists the newest requests first", () => {
    const s = summarize([rec("design", "first-try", [call()], [], 4000, 1), rec("design", "cache", [], [], 3, 2), rec("design", "first-try", [call()], [], 2000, 3)]);
    expect(s.steps[0].medianMs).toBe(4000);
    expect(s.steps[0].p95Ms).toBe(4000);
    expect(s.recent.map((r) => r.at)).toEqual([3, 2, 1]);
    expect(s.recent[1]).toMatchObject({ models: [], input: 0, cost: 0 });
    expect(s.since).toBe(1);
  });
  it("is empty without records", () => {
    expect(summarize([])).toMatchObject({ requests: 0, since: null, answered: 0, steps: [], problems: [], recent: [] });
  });
});
