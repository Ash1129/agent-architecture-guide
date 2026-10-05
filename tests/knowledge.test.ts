import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The knowledge base is the guide's source of truth. These checks keep it
// consistent as it grows: every chunk is indexed, every citation points to a
// source that was actually read, and IDs are unique.

const ROOT = join(__dirname, "..", "knowledge");

type Chunk = { file: string; id: string; sources: string[]; body: string };

function chunks(): Chunk[] {
  const dir = join(ROOT, "chunks");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(dir, d.name))
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
          const text = readFileSync(join(dir, d.name, f), "utf8");
          const front = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
          return {
            file: `${d.name}/${f}`,
            id: /^id:\s*(\S+)/m.exec(front)?.[1] ?? "",
            sources: (/^sources:\s*\[(.*)\]/m.exec(front)?.[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            body: text.slice(front.length),
          };
        }),
    );
}

/** Source IDs with a read date in sources.md. */
function readSources(): Map<string, boolean> {
  const rows = readFileSync(join(ROOT, "sources.md"), "utf8")
    .split("\n")
    .filter((l) => /^\| [a-z0-9-]+ \|/.test(l));
  return new Map(rows.map((l) => [l.split("|")[1].trim(), /\d{4}-\d{2}-\d{2}/.test(l.split("|").at(-2) ?? "")]));
}

describe("knowledge base", () => {
  const all = chunks();
  const sources = readSources();
  const index = readFileSync(join(ROOT, "INDEX.md"), "utf8");

  it("has chunks with unique IDs", () => {
    expect(all.length).toBeGreaterThan(0);
    for (const c of all) expect(c.id, c.file).toMatch(/^[A-Z]\d{2}$/);
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
  });

  it("lists every chunk in the index, and nothing that doesn't exist", () => {
    for (const c of all) expect(index, `${c.id} missing from INDEX.md`).toContain(`chunks/${c.file}`);
    const linked = [...index.matchAll(/\(chunks\/([^)]+)\)/g)].map((m) => m[1]);
    for (const l of linked) expect(all.map((c) => c.file), `INDEX.md links to missing ${l}`).toContain(l);
  });

  it("only cites sources that are registered and were read", () => {
    for (const c of all) {
      const cited = new Set([...c.sources, ...[...c.body.matchAll(/\[([a-z0-9-]+)[ \]]/g)].map((m) => m[1])].filter((s) => /\d{4}|site|kb|slides/.test(s)));
      for (const s of cited) {
        expect(sources.has(s), `${c.id} cites unknown source ${s}`).toBe(true);
        expect(sources.get(s), `${c.id} cites ${s}, which has no read date`).toBe(true);
      }
    }
  });

  it("declares in the header every source the body cites", () => {
    for (const c of all) {
      const inBody = [...c.body.matchAll(/\[([a-z0-9-]+-\d{4}[a-z0-9-]*|[a-z0-9-]+-(?:site|kb))[ \]]/g)].map((m) => m[1]);
      for (const s of inBody) expect(c.sources, `${c.id} cites ${s} without listing it in sources:`).toContain(s);
    }
  });
});
