import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startOfTodayJakarta, startOfTodayJakartaLiteral } from "./scrape-day-boundary.js";

// Jakarta is UTC+7, so Jakarta midnight is 17:00 UTC the previous day.

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startOfTodayJakarta", () => {
  it("returns 17:00 UTC the previous day when it's morning in Jakarta", () => {
    // 2026-07-19 02:00 UTC = 2026-07-19 09:00 Jakarta
    vi.setSystemTime(new Date("2026-07-19T02:00:00.000Z"));

    expect(startOfTodayJakarta().toISOString()).toBe("2026-07-18T17:00:00.000Z");
  });

  it("stays on the previous Jakarta day right before the boundary rolls over", () => {
    // 2026-07-18 16:59:59.999 UTC = 2026-07-18 23:59:59.999 Jakarta
    vi.setSystemTime(new Date("2026-07-18T16:59:59.999Z"));

    expect(startOfTodayJakarta().toISOString()).toBe("2026-07-17T17:00:00.000Z");
  });

  it("rolls over to the new Jakarta day exactly at the boundary", () => {
    // 2026-07-18 17:00:00.000 UTC = 2026-07-19 00:00:00.000 Jakarta
    vi.setSystemTime(new Date("2026-07-18T17:00:00.000Z"));

    expect(startOfTodayJakarta().toISOString()).toBe("2026-07-18T17:00:00.000Z");
  });
});

describe("startOfTodayJakartaLiteral", () => {
  it("formats the boundary as naive digits with no timezone marker", () => {
    vi.setSystemTime(new Date("2026-07-19T02:00:00.000Z"));

    expect(startOfTodayJakartaLiteral()).toBe("2026-07-18 17:00:00.000");
  });
});
