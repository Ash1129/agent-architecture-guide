import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT, clearHistory, findByCode, loadHistory, removeHistory, restoreHistory, upsertHistory } from "../src/lib/history";
import type { Answers } from "../src/lib/questions";
import { resultCode } from "../src/lib/share";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}

const emails: Answers = { task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible"], location: "open", team: "mid" };
const reminders: Answers = { task: "Send overdue invoice reminders", shape: "rules", systems: "act", trigger: "schedule", volume: "daily", risks: ["none"], location: "open", team: "small" };

describe("saved history", () => {
  it("saves a finished result with its key facts", () => {
    const s = memory();
    const [e] = upsertHistory("a", emails, s, 1000);
    expect(e).toMatchObject({ id: "a", task: "Answer routine customer emails", approach: "agent", models: "Sonnet 5.5", tool: "n8n with an AI agent step", autonomy: 2, steps: 7, createdAt: 1000 });
    expect(e.code).toBe(resultCode(emails));
  });

  it("names the method when no AI is used", () => {
    expect(upsertHistory("r", reminders, memory())[0].models).toBe("No AI: Decision table");
  });

  it("ignores unfinished answers", () => {
    const s = memory();
    expect(upsertHistory("a", { task: "Half done", shape: "rules" }, s)).toEqual([]);
  });

  it("updates the same entry when answers change, keeping when it was first saved", () => {
    const s = memory();
    upsertHistory("a", emails, s, 1000);
    upsertHistory("b", reminders, s, 2000);
    const list = upsertHistory("a", { ...emails, shape: "judgement", split: "sequential" }, s, 3000);
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
    expect(list[0]).toMatchObject({ approach: "workflow", createdAt: 1000, updatedAt: 3000 });
  });

  it("does not reorder or re-save when the same result is simply viewed again", () => {
    const s = memory();
    upsertHistory("a", emails, s, 1000);
    upsertHistory("b", reminders, s, 2000);
    const list = upsertHistory("a", emails, s, 9000);
    expect(list.map((e) => e.id)).toEqual(["b", "a"]);
    expect(list[1].updatedAt).toBe(1000);
  });

  it("finds an entry by its answers, for links opened again", () => {
    const s = memory();
    upsertHistory("a", emails, s);
    expect(findByCode(resultCode(emails), s)?.id).toBe("a");
    expect(findByCode(resultCode(reminders), s)).toBeUndefined();
  });

  it("deletes, undoes in place, and clears", () => {
    const s = memory();
    upsertHistory("a", emails, s, 1);
    upsertHistory("b", reminders, s, 2);
    const before = loadHistory(s);
    const gone = before[1];
    expect(removeHistory(gone.id, s).map((e) => e.id)).toEqual(["b"]);
    expect(restoreHistory(gone, 1, s).map((e) => e.id)).toEqual(["b", "a"]);
    clearHistory(s);
    expect(loadHistory(s)).toEqual([]);
  });

  it(`keeps at most ${HISTORY_LIMIT} entries, newest first`, () => {
    const s = memory();
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) upsertHistory(`id${i}`, { ...emails, task: `Task ${i}` }, s, i);
    const list = loadHistory(s);
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0].task).toBe(`Task ${HISTORY_LIMIT + 4}`);
  });

  it("survives corrupt or unavailable storage", () => {
    const s = memory();
    s.setItem("aag:history", "{not json");
    expect(loadHistory(s)).toEqual([]);
    s.setItem("aag:history", JSON.stringify([{ id: "x", code: "garbage" }, 7, null]));
    expect(loadHistory(s)).toEqual([]);
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => {} };
    expect(loadHistory(broken)).toEqual([]);
    expect(() => upsertHistory("a", emails, broken)).not.toThrow();
    expect(loadHistory(null)).toEqual([]);
  });
});
