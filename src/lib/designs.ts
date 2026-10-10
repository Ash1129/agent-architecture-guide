// AI designs in the browser. The local AI server keeps the shared cache and
// re-checks every cached design, so the browser only remembers designs for
// this visit and always asks the server otherwise (a cached design comes back
// in milliseconds).

import type { Blueprint } from "./blueprint";
import type { DesignResponse } from "./design";
import type { KitResponse } from "./kittext";
import type { Answers } from "./questions";
import { resultCode } from "./share";

const seen = new Map<string, DesignResponse>();

export function rememberedDesign(a: Answers): DesignResponse | undefined {
  return seen.get(resultCode(a));
}

/** Asks the local AI server for a design. Throws with a readable message on failure. */
export async function fetchDesign(a: Answers, signal?: AbortSignal): Promise<DesignResponse> {
  const res = await fetch("./api/design", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: a }),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<DesignResponse> & { error?: string };
  if (!res.ok || !data.blueprint) throw new Error(res.status === 404 ? "AI design isn't available on this copy of the site." : data.error ?? "The design couldn't be drafted.");
  seen.set(resultCode(a), data as DesignResponse);
  return data as DesignResponse;
}

export type DesignState =
  | { status: "off" }
  | { status: "loading" }
  | { status: "ready"; blueprint: Blueprint; source: DesignResponse["source"]; model?: string }
  | { status: "failed"; note: string };

const kits = new Map<string, KitResponse>();

/** Asks the local AI server for the kit text, written for the design it holds for these answers. */
export async function fetchKitText(a: Answers, signal?: AbortSignal): Promise<KitResponse> {
  const key = resultCode(a);
  const known = kits.get(key);
  if (known) return known;
  const res = await fetch("./api/kit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: a }),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<KitResponse> & { error?: string };
  if (!res.ok || !data.text) throw new Error(data.error ?? "The kit text couldn't be written.");
  kits.set(key, data as KitResponse);
  return data as KitResponse;
}

export type KitTextState = { status: "off" } | { status: "loading" } | { status: "ready"; response: KitResponse } | { status: "failed"; note: string };
