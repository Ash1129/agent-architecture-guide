import { describe, expect, it } from "vitest";
import { buildBlueprint, buildSimplerBlueprint } from "../src/lib/blueprint";
import { drawioXml } from "../src/lib/exportxml";
import type { Answers } from "../src/lib/questions";
import { recommend } from "../src/lib/rules";
import { sampledPaths } from "./paths";

const emails: Answers = { task: "Answer routine customer emails & refunds <fast>", shape: "varies", kinds: "yes", roles: "one", quality: "partly", knowledge: ["playbook"], systems: "act", trigger: "event", volume: "daily", risks: ["visible", "personal"], location: "open", team: "mid" };

function fileFor(a: Answers) {
  const r = recommend(a);
  const design = buildBlueprint(r, a);
  const simpler = buildSimplerBlueprint(r, a);
  return { design, simpler, xml: drawioXml({ task: r.task, design, source: "rules", simpler }) };
}

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

const unescape = (s: string) => s.replace(/&#10;/g, "\n").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attr = (tag: string, name: string) => unescape(tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1] ?? "");

describe("draw.io export", () => {
  it("is a well-formed draw.io file with both designs as pages, for every kind of design", () => {
    for (const a of [emails, ...sampledPaths(80)]) {
      const { xml } = fileFor(a);
      expect(wellFormed(xml)).toBe(true);
      expect(xml).toMatch(/^<\?xml[^>]*>\n<mxfile /);
      expect(xml.match(/<diagram /g)).toHaveLength(2);
      expect(xml).toContain('name="Recommended design"');
      expect(xml).toContain('name="Simpler start"');
    }
  });

  it("makes every step a shape carrying what the walkthrough's flipped card shows", () => {
    const { xml, design } = fileFor(emails);
    for (const n of design.nodes) {
      const tag = xml.match(new RegExp(`<UserObject id="recommended-${n.id}"[^>]*>`))?.[0];
      expect(tag).toBeDefined();
      expect(attr(tag!, "what-happens")).toBe(n.what);
      expect(attr(tag!, "why-its-here")).toBe(n.why);
      expect(attr(tag!, "what-it-passes-on")).toBe(n.passes);
      expect(attr(tag!, "label")).toContain(`<b>${n.step}. `);
      if (n.engine) expect(attr(tag!, "model-or-method")).toBe(n.engine.name);
    }
  });

  it("connects only shapes that exist, and dashes the loops", () => {
    const { xml, design } = fileFor(emails);
    const ids = new Set([...xml.matchAll(/<UserObject id="([^"]+)"/g)].map((m) => m[1]));
    const edges = [...xml.matchAll(/<mxCell [^>]*edge="1"[^>]*>/g)].map((m) => m[0]);
    expect(edges.filter((e) => e.includes('source="recommended-'))).toHaveLength(design.edges.length);
    for (const e of edges) {
      expect(ids.has(attr(e, "source"))).toBe(true);
      expect(ids.has(attr(e, "target"))).toBe(true);
    }
    const loops = design.edges.filter((e) => e.style !== "flow").length;
    expect(edges.filter((e) => e.includes('source="recommended-') && e.includes("dashed=1")).length).toBe(loops);
  });

  it("escapes the task safely", () => {
    expect(fileFor(emails).xml).toContain("Answer routine customer emails &amp;amp; refunds &amp;lt;fast&amp;gt;");
  });
});
