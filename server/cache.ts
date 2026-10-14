// A shared cache of AI results, so a task someone has already worked through
// doesn't pay for the same model call again. Entries are kept per namespace
// ("interview", "tailor"), looked up exactly by key, or by meaning through an
// embedding of the task.
//
// Locally it's one JSON file in ai-cache.nosync/ (".nosync" keeps it out of
// iCloud; the folder is git-ignored and ignored by Vite's file watcher).

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type CacheEntry<T = unknown> = { key: string; value: T; label?: string; embedding?: number[]; savedAt: number };

export interface Cache {
  get<T>(ns: string, key: string): CacheEntry<T> | undefined;
  put<T>(ns: string, entry: Omit<CacheEntry<T>, "savedAt">): void;
  /** The entry whose embedding is closest to this one, with its cosine similarity. */
  nearest<T>(ns: string, embedding: number[]): { entry: CacheEntry<T>; score: number } | undefined;
}

/** Most entries kept per namespace; the oldest go first. */
export const CACHE_LIMIT = 500;

type Store = Record<string, Record<string, CacheEntry>>;

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** A cache held in memory, optionally saved after every write. */
export function memoryCache(initial: Store = {}, save?: (s: Store) => void, now = () => Date.now()): Cache {
  const store = initial;
  return {
    get: <T>(ns: string, key: string) => store[ns]?.[key] as CacheEntry<T> | undefined,
    put: (ns, entry) => {
      const space = (store[ns] ??= {});
      space[entry.key] = { ...entry, savedAt: now() };
      const keys = Object.keys(space);
      if (keys.length > CACHE_LIMIT) {
        keys.sort((x, y) => space[x].savedAt - space[y].savedAt);
        for (const k of keys.slice(0, keys.length - CACHE_LIMIT)) delete space[k];
      }
      save?.(store);
    },
    nearest: <T>(ns: string, embedding: number[]) => {
      let best: { entry: CacheEntry<T>; score: number } | undefined;
      for (const entry of Object.values(store[ns] ?? {})) {
        if (!entry.embedding || entry.embedding.length !== embedding.length) continue;
        const score = cosine(entry.embedding, embedding);
        if (!best || score > best.score) best = { entry: entry as CacheEntry<T>, score };
      }
      return best;
    },
  };
}

/** The cache backed by a JSON file. A missing or damaged file starts empty. */
export function fileCache(path: string): Cache {
  let initial: Store = {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (parsed && typeof parsed === "object") initial = parsed;
  } catch {
    /* no cache yet */
  }
  return memoryCache(initial, (store) => {
    try {
      mkdirSync(dirname(path), { recursive: true });
      // Write then rename, so a crash mid-write never leaves half a file.
      writeFileSync(`${path}.tmp`, JSON.stringify(store));
      renameSync(`${path}.tmp`, path);
    } catch {
      /* a cache that can't be saved only costs a repeat call later */
    }
  });
}

const shared = new Map<string, Cache>();

/** One cache per file for the life of the server, so every request sees the same entries. */
export function sharedCache(path: string): Cache {
  let c = shared.get(path);
  if (!c) shared.set(path, (c = fileCache(path)));
  return c;
}

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Runs `run` once per key at a time: a request that arrives while the same
 * work is already under way waits for that result instead of paying for a
 * second model call (a browser that retries, a second tab, or React running
 * an effect twice in development).
 */
export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const p = run().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}
