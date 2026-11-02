import { describe, expect, it } from "vitest";
import { rateLimiter } from "../server/vercel";

describe("the online AI endpoints' rate limiter", () => {
  it("allows the limit within the window, then says how many minutes to wait", () => {
    const limit = rateLimiter(3, 60 * 60_000);
    const t0 = 1_000_000;
    expect([limit("a", t0), limit("a", t0 + 1), limit("a", t0 + 2)]).toEqual([0, 0, 0]);
    expect(limit("a", t0 + 3)).toBe(60);
    expect(limit("b", t0 + 3)).toBe(0); // another address has its own count
  });

  it("lets requests through again as old ones leave the window", () => {
    const limit = rateLimiter(2, 10 * 60_000);
    limit("a", 0);
    limit("a", 60_000);
    expect(limit("a", 120_000)).toBe(8);
    expect(limit("a", 10 * 60_000 + 1)).toBe(0);
  });
});
