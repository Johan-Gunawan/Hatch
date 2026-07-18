import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MatchResults } from "./match-results";
import type { MatchResponse } from "./resume-match-data";

// MatchResults' only side-effecting collaborator (explainMatch) fires on a
// button click these tests never trigger, so no network/module mocking is
// needed — this is a pure render test of the empty-state fix.

afterEach(cleanup);

function makeResult(overrides: Partial<MatchResponse> = {}): MatchResponse {
  return {
    resumeId: "resume-1",
    profile: { skills: [], jobTitles: [], seniority: null },
    items: [],
    weakMatch: false,
    fallbackUsed: "none",
    ...overrides,
  };
}

function makeJob(id: string) {
  return {
    id,
    title: `Job ${id}`,
    companyName: "Acme",
    locationRaw: "Jakarta",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    sourceUrl: `https://acme.com/jobs/${id}`,
    score: 0.5,
  };
}

describe("MatchResults", () => {
  it("shows the 'No matches found' empty state when there are no items", () => {
    render(<MatchResults result={makeResult({ items: [], weakMatch: true })} />);

    expect(screen.getByText("No matches found")).toBeTruthy();
    expect(screen.queryByText(/Job /)).toBeNull();
  });

  it("does not render the old 'closest roles' banner even when weakMatch is true", () => {
    render(<MatchResults result={makeResult({ items: [makeJob("a")], weakMatch: true })} />);

    expect(screen.queryByText(/No strong matches yet/i)).toBeNull();
    expect(screen.getByText("Job a")).toBeTruthy();
  });

  it("renders job cards normally for a real (non-weak) match", () => {
    render(
      <MatchResults
        result={makeResult({ items: [makeJob("a"), makeJob("b")], weakMatch: false })}
      />
    );

    expect(screen.getByText("Job a")).toBeTruthy();
    expect(screen.getByText("Job b")).toBeTruthy();
    expect(screen.queryByText("No matches found")).toBeNull();
  });
});
