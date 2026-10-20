import { describe, expect, it } from "vitest";
import { type Attempt, clientOptions, withEscalation } from "../server/ai";
import { ALLOWED_MODELS, ESCALATION_MODEL, FAST_MODEL, modelFor, resolveModels, startingModels } from "../server/models";
import { handleSplit } from "../server/split";

describe("model settings", () => {
  it("defaults to Haiku first and Sonnet for the retry", () => {
    expect(resolveModels({})).toEqual({ model: "claude-haiku-5-5", escalationModel: "claude-sonnet-5-5" });
    expect(resolveModels({ model: " ", escalationModel: "" })).toEqual({ model: FAST_MODEL, escalationModel: ESCALATION_MODEL });
  });

  it("allows only Haiku and Sonnet, in either role", () => {
    expect(ALLOWED_MODELS).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5"]);
    expect(resolveModels({ model: "claude-sonnet-5-5", escalationModel: "claude-sonnet-5-5" }).model).toBe("claude-sonnet-5-5");
    expect(() => resolveModels({ model: "claude-opus-5-5" })).toThrow(/ANTHROPIC_MODEL in \.env is "claude-opus-5-5"\. Blueprint runs only claude-haiku-5-5 or claude-sonnet-5-5/);
    expect(() => resolveModels({ escalationModel: "gpt-6-luna" })).toThrow(/ANTHROPIC_ESCALATION_MODEL/);
  });

  it("runs the retry on the escalation model, or on the first model when there is none", () => {
    const env = { model: FAST_MODEL, escalationModel: ESCALATION_MODEL };
    expect(modelFor(env)).toBe(FAST_MODEL);
    expect(modelFor(env, "retry")).toBe(ESCALATION_MODEL);
    expect(modelFor({ model: FAST_MODEL }, "retry")).toBe(FAST_MODEL);
  });
});

describe("starting model per step", () => {
  const env = { model: FAST_MODEL, escalationModel: ESCALATION_MODEL };

  it("starts tailoring on Sonnet and every other step on Haiku", () => {
    expect(startingModels("tailor", env)).toEqual({ model: ESCALATION_MODEL, escalationModel: ESCALATION_MODEL });
    for (const step of ["split", "interview", "decide", "design", "kit"]) expect(startingModels(step, env)).toEqual(env);
  });

  it("leaves tailoring on the first model when no escalation model is set", () => {
    expect(startingModels("tailor", { model: FAST_MODEL })).toEqual({ model: FAST_MODEL });
  });
});

describe("Claude client settings", () => {
  it("sends the workspace ID as a header only when one is set", () => {
    expect(clientOptions({ apiKey: "test-key", workspaceId: " wrkspc_test " })).toMatchObject({ defaultHeaders: { "anthropic-workspace-id": "wrkspc_test" } });
    expect(clientOptions({ apiKey: "test-key" })).not.toHaveProperty("defaultHeaders");
    expect(clientOptions({ apiKey: "test-key", workspaceId: "" })).not.toHaveProperty("defaultHeaders");
  });

  it("keeps one long timeout and no SDK retries", () => {
    expect(clientOptions({ apiKey: "test-key" })).toMatchObject({ timeout: 360_000, maxRetries: 0 });
  });
});

describe("escalation for single-call steps", () => {
  it("retries an unusable answer once on the escalation model", async () => {
    const tries: Attempt[] = [];
    const out = await withEscalation("test", async (attempt) => {
      tries.push(attempt);
      if (attempt === "first") throw new Error("The reply did not contain a JSON object.");
      return "fixed";
    });
    expect(out).toEqual({ value: "fixed", attempt: "retry" });
    expect(tries).toEqual(["first", "retry"]);
  });

  it("doesn't retry an API error, which another model won't fix", async () => {
    const tries: Attempt[] = [];
    const rejected = Object.assign(new Error("invalid x-api-key"), { status: 401 });
    await expect(
      withEscalation("test", async (attempt) => {
        tries.push(attempt);
        throw rejected;
      }),
    ).rejects.toBe(rejected);
    expect(tries).toEqual(["first"]);
  });

  it("splits a description on Sonnet when Haiku's reply can't be read, and says which model answered", async () => {
    const tries: (Attempt | undefined)[] = [];
    const reply = JSON.stringify({ title: "Answer patient emails", jobs: [{ title: "Answer appointment emails", description: "Reply to patients about appointment times." }], handoffs: [] });
    const complete = async (_i: string, _input: string, attempt?: Attempt) => (tries.push(attempt), attempt === "retry" ? reply : "Sorry, I can't format that.");
    const env = { apiKey: "test-key", model: FAST_MODEL, escalationModel: ESCALATION_MODEL };

    const out = await handleSplit({ description: "Our front desk answers patient emails about appointments all day." }, env, { complete });
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ source: "ai", model: ESCALATION_MODEL });
    expect(tries).toEqual(["first", "retry"]);

    const first: (Attempt | undefined)[] = [];
    const direct = await handleSplit({ description: "A bakery retypes phone orders into a spreadsheet." }, env, { complete: async (_i, _input, attempt) => (first.push(attempt), reply) });
    expect(direct.body).toMatchObject({ source: "ai", model: FAST_MODEL });
    expect(first).toEqual(["first"]);
  });
});
