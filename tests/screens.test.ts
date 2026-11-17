import { describe, expect, it } from "vitest";
import { type Answers, effectiveAnswers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { buildBlueprint } from "../src/lib/blueprint";
import { checkKitText } from "../src/lib/kittext";
import { PROMPT_LIMIT, buildScreens, claudeDesignPrompt, lovableFollowUps, lovablePrompt, screensMarkdown } from "../src/lib/screens";
import { buildStarterKit } from "../src/lib/starter";
import { allPaths, sampledPaths } from "./paths";

const base = { location: "open", team: "mid", volume: "daily" } as const;
const support: Answers = { ...base, task: "Answer routine customer emails", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook", "reference"], systems: "act", trigger: "event", risks: ["visible", "personal"] };
const reminders: Answers = { ...base, task: "Send overdue invoice reminders", shape: "rules", systems: "act", trigger: "schedule", risks: ["none"], team: "small" };
const resume: Answers = { ...base, task: "Tailor resumes to job descriptions", shape: "judgement", kinds: "no", split: "sections", quality: "clear", knowledge: ["playbook"], systems: "none", trigger: "manual", volume: "occasional", risks: ["none"] };

const ids = (a: Answers) => buildScreens(recommend(a), effectiveAnswers(a)).screens.map((s) => s.id);

describe("the screens people use", () => {
  it("unattended work a person reviews gets a queue, the item, what needs attention, how it runs and a record", () => {
    const r = recommend(support);
    expect(r.autonomy.level).toBeLessThanOrEqual(3);
    expect(ids(support)).toEqual(["queue", "item", "attention", "status", "record"]);
    const item = buildScreens(r, support).screens.find((s) => s.id === "item")!;
    // Customers see the output, and it acts in other systems: both show on the decision screen.
    expect(item.actions.join(" ")).toMatch(/Preview it as the customer will see it/);
    expect(item.shows.join(" ")).toMatch(/What will happen in your other systems/);
  });

  it("automation that runs on its own has nothing to approve: attention and status only", () => {
    expect(recommend(reminders).autonomy.level).toBe(4);
    expect(ids(reminders)).toEqual(["attention", "status"]);
    expect(buildScreens(recommend(reminders), reminders).leaveOut.join(" ")).toMatch(/nothing here waits for a person/);
  });

  it("work a person starts gets a start screen and a result screen", () => {
    expect(ids(resume).slice(0, 2)).toEqual(["start", "result"]);
    expect(ids(resume)).not.toContain("queue");
  });

  it("an approval of every result never offers approve-all", () => {
    const approved: Answers = { ...support, requirements: ["approval"] };
    expect(recommend(approved).autonomy.level).toBe(2);
    expect(buildScreens(recommend(approved), approved).rules.join(" ")).toMatch(/No approve-all button/);
    expect(buildScreens(recommend(reminders), reminders).rules.join(" ")).not.toMatch(/approve-all/);
  });

  it("uses the task's own words when it has them, and plain ones when it doesn't", () => {
    const r = recommend(support);
    const named = buildScreens(r, support, { item: "email", items: "emails", reviewer: "support agent", owner: "support lead" });
    expect(named.screens[0].name).toBe("Emails to approve"); // every result is approved here (level 2)
    expect(lovablePrompt(named, r)).toMatch(/Build one screen first: "One email"\. A support agent uses it\./);
    expect(lovableFollowUps(named, r, support)).toMatch(/Users: a support agent and a support lead\./);
    expect(buildScreens(r, support, { item: "", reviewer: undefined }).words).toEqual({ item: "item", items: "items", reviewer: "reviewer", owner: "owner" });
    expect(claudeDesignPrompt(buildScreens(r, support), r)).toMatch(/used all day by a reviewer and an owner/);
  });

  it("the two prompts differ where the tools differ", () => {
    const r = recommend(support);
    const b = buildScreens(r, support);
    const lovable = lovablePrompt(b, r);
    const design = claudeDesignPrompt(b, r);
    // Lovable: one screen, sample data, no login yet, and it is asked to ask (U05).
    expect(lovable).toMatch(/Build one screen first: "One item"/);
    expect(lovable).toMatch(/No login and no database yet/);
    expect(lovable).toMatch(/ask me anything you need to know/);
    expect(lovable).not.toMatch(/Needs attention|How it is running/);
    // Claude Design: the whole flow, clickable, one artboard a screen, look from the design system (U06).
    expect(design).toMatch(/clickable prototype/);
    expect(design).toMatch(/One artboard for each screen/);
    expect(design).toMatch(/Needs attention/);
    expect(design).toMatch(/Use the attached design system/);
    expect(design).not.toMatch(/login|database|sign-in/);
  });

  it("the Lovable follow-ups add one thing at a time and keep personal data out", () => {
    const r = recommend(support);
    const follow = lovableFollowUps(buildScreens(r, support), r, support);
    expect(follow).toMatch(/## Paste once into the project's instructions/);
    expect(follow).toMatch(/1\. Add a screen, "Items to approve"/);
    expect(follow).toMatch(/enforce it on the data, not only in the interface/);
    expect(follow).toMatch(/standard terms exclude health, payment-card and identity data/); // the task handles personal data
    const plain = recommend(reminders);
    expect(lovableFollowUps(buildScreens(plain, reminders), plain, reminders)).not.toMatch(/standard terms exclude/);
  });

  it("stays short and free of long dashes on every path", () => {
    const paths = [...allPaths().filter((_, i) => i % 9 === 0), ...sampledPaths(600)].map((a) => ({ ...a, task: "Answer routine customer emails from the shared inbox" }));
    const long: string[] = [];
    for (const a of paths) {
      const r = recommend(a);
      const b = buildScreens(r, effectiveAnswers(a), { item: "customer email", items: "customer emails", reviewer: "support agent", owner: "support team lead" });
      const texts = { lovable: lovablePrompt(b, r), design: claudeDesignPrompt(b, r), brief: screensMarkdown(b, r.task), follow: lovableFollowUps(b, r, effectiveAnswers(a)) };
      for (const [name, t] of Object.entries(texts)) {
        if (/[–—]/.test(t)) long.push(`${name} has a long dash`);
        if ((name === "lovable" || name === "design") && t.length > PROMPT_LIMIT && long.length < 5) long.push(`${name} is ${t.length} characters <= ${JSON.stringify(a)}`);
      }
      expect(b.screens.length).toBeGreaterThan(0);
    }
    expect(long).toEqual([]);
  }, 180_000);

  it("ships in the starter kit with a copy button for each tool", () => {
    const r = recommend(support);
    const kit = buildStarterKit(r, buildBlueprint(r, support), support, { screens: { item: "email", items: "emails" } });
    const file = (p: string) => kit.files.find((f) => f.path === p)!.content;
    expect(file("ui/SCREENS.md")).toMatch(/^# Screens/);
    expect(file("ui/lovable-prompt.md")).toMatch(/10 realistic sample emails/);
    expect(file("ui/lovable-follow-ups.md")).toMatch(/one at a time/);
    expect(kit.tools.filter((t) => t.id === "lovable" || t.id === "claude-design").map((t) => t.action)).toEqual([
      { kind: "copy", label: "Copy for Lovable", path: "ui/lovable-prompt.md" },
      { kind: "copy", label: "Copy for Claude Design", path: "ui/claude-design-prompt.md" },
    ]);
    // BUILD.md carries every file, so whoever builds it gets the brief without a second download.
    expect(file("BUILD.md")).toContain("ui/SCREENS.md");
  });
});

describe("the task's own words from the AI kit step", () => {
  const r = recommend(support);
  const ctx = { r, bp: buildBlueprint(r, support), chunks: [], briefIds: [] };

  it("keeps one to three plain words per slot", () => {
    const { text, dropped } = checkKitText({ screens: { item: "Claim", items: "claims", reviewer: "claims handler", owner: "head of claims" } }, ctx);
    expect(text.screens).toEqual({ item: "claim", items: "claims", reviewer: "claims handler", owner: "head of claims" });
    expect(dropped).toEqual([]);
  });

  it("drops a field name, a sentence or a model name, and keeps the rest", () => {
    const { text, dropped } = checkKitText({ screens: { item: "lead_id", items: "leads", reviewer: "the person who reviews every single lead", owner: "claude" } }, ctx);
    expect(text.screens).toEqual({ items: "leads" });
    expect(dropped).toHaveLength(3);
  });
});
