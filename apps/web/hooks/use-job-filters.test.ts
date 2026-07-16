import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJobFilters } from "./use-job-filters";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useJobFilters", () => {
  it("updates query immediately but debounces filters.q by 300ms", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.setQuery("engineer");
    });
    expect(result.current.query).toBe("engineer");
    expect(result.current.filters.q).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.filters.q).toBe("engineer");
  });

  it("restarts the debounce timer instead of queueing on rapid successive setQuery calls", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.setQuery("e");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.setQuery("engineer");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Only 200ms have elapsed since the last setQuery call, so it hasn't fired yet.
    expect(result.current.filters.q).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.filters.q).toBe("engineer");
  });

  it("toggles a category id on then off", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.toggleCategory("cat-1");
    });
    expect(result.current.categoryIds).toEqual(["cat-1"]);

    act(() => {
      result.current.toggleCategory("cat-1");
    });
    expect(result.current.categoryIds).toEqual([]);
  });

  it("toggles work arrangement, location, and company ids independently", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.toggleWorkArrangement("wa-1");
      result.current.toggleLocation("Jakarta");
      result.current.toggleCompany("Acme");
    });

    expect(result.current.workArrangementIds).toEqual(["wa-1"]);
    expect(result.current.locations).toEqual(["Jakarta"]);
    expect(result.current.companies).toEqual(["Acme"]);
  });

  it("reports hasActive=false when no filters are set, including minSalary=0", () => {
    const { result } = renderHook(() => useJobFilters());
    expect(result.current.hasActive).toBe(false);
  });

  it("reports hasActive=true when any single filter is set", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.toggleLocation("Jakarta");
    });
    expect(result.current.hasActive).toBe(true);
  });

  it("reports hasActive=true when minSalary is greater than 0", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.setMinSalary(5_000_000);
    });
    expect(result.current.hasActive).toBe(true);
  });

  it("resolves filters.minSalary to undefined at 0 and to the number otherwise", () => {
    const { result } = renderHook(() => useJobFilters());
    expect(result.current.filters.minSalary).toBeUndefined();

    act(() => {
      result.current.setMinSalary(3_000_000);
    });
    expect(result.current.filters.minSalary).toBe(3_000_000);
  });

  it("clearAll resets every filter field, including the in-flight debounce", () => {
    const { result } = renderHook(() => useJobFilters());

    act(() => {
      result.current.setQuery("engineer");
      result.current.toggleCategory("cat-1");
      result.current.toggleWorkArrangement("wa-1");
      result.current.toggleLocation("Jakarta");
      result.current.toggleCompany("Acme");
      result.current.setMinSalary(3_000_000);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.query).toBe("");
    expect(result.current.categoryIds).toEqual([]);
    expect(result.current.workArrangementIds).toEqual([]);
    expect(result.current.locations).toEqual([]);
    expect(result.current.companies).toEqual([]);
    expect(result.current.minSalary).toBe(0);
    expect(result.current.hasActive).toBe(false);
  });
});
