import { type Answers, activeQuestions } from "../src/lib/questions";

// Every reachable path through the single-choice questions, with each
// multi-select at its two extremes, plus a seeded sample of mixed
// multi-select combinations. No path may produce a malformed result.
function multiChoices(values: string[], exclusive: string | undefined, exhaustive: boolean): string[][] {
  const rest = values.filter((v) => v !== exclusive);
  const out: string[][] = exclusive ? [[exclusive]] : [];
  if (!exhaustive) return [...out, rest];
  for (let mask = 1; mask < 1 << rest.length; mask++) out.push(rest.filter((_, i) => mask & (1 << i)));
  return out;
}

export function allPaths(): Answers[] {
  const results: Answers[] = [];
  const walk = (a: Answers) => {
    const next = activeQuestions(a).find((q) => q.kind !== "text" && a[q.id] === undefined);
    if (!next) return void results.push(a);
    const choices =
      next.kind === "multi"
        ? multiChoices(next.options!.map((o) => o.value), next.exclusive, false)
        : next.options!.map((o) => o.value);
    for (const c of choices) walk({ ...a, [next.id]: c });
  };
  walk({ task: "A task" });
  return results;
}

export function sampledPaths(n: number): Answers[] {
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const out: Answers[] = [];
  for (let i = 0; i < n; i++) {
    const a: Answers = { task: "A task" };
    for (let q = activeQuestions(a).find((x) => x.kind !== "text" && a[x.id] === undefined); q; q = activeQuestions(a).find((x) => x.kind !== "text" && a[x.id] === undefined)) {
      const choices = q.kind === "multi" ? multiChoices(q.options!.map((o) => o.value), q.exclusive, true) : q.options!.map((o) => o.value);
      (a as Record<string, unknown>)[q.id] = choices[Math.floor(rand() * choices.length)];
    }
    out.push(a);
  }
  return out;
}

