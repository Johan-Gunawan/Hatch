import { expect, test } from "@playwright/test";

// Drives the real /match upload UI, but intercepts the browser's call to the
// match endpoint and returns a canned response. This keeps the test deterministic
// and free of the real DeepSeek/OpenAI calls (which the service unit tests cover),
// while still exercising the file-upload → results-render path end to end.

const MATCH_RESPONSE = {
  resumeId: "11111111-1111-4111-8111-111111111111",
  profile: {
    skills: ["React", "TypeScript"],
    jobTitles: ["Frontend Engineer"],
    seniority: "mid",
    yearsExperience: 3,
    locationPref: null,
    summary: "Solid frontend developer",
  },
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "E2E Match Frontend Engineer",
      companyName: "Acme",
      locationRaw: "Jakarta",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "IDR",
      salaryPeriod: null,
      sourceUrl: "https://acme.com/jobs/1",
      score: 0.92,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      title: "E2E Match Backend Engineer",
      companyName: "Globex",
      locationRaw: "Remote",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "IDR",
      salaryPeriod: null,
      sourceUrl: "https://globex.com/jobs/2",
      score: 0.81,
    },
  ],
  weakMatch: false,
  fallbackUsed: "none",
};

test("uploading a résumé renders the ranked matches", async ({ page }) => {
  await page.route("**/api/resumes/match", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MATCH_RESPONSE),
    })
  );

  await page.goto("/match");

  // Setting the file programmatically triggers the upload; the request is
  // intercepted above, so the file's contents are irrelevant.
  await page.setInputFiles('input[type="file"]', {
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("dummy resume bytes"),
  });

  await expect(page.getByRole("heading", { name: /Your matches/i })).toBeVisible();
  await expect(page.getByText("E2E Match Frontend Engineer")).toBeVisible();
  await expect(page.getByText("E2E Match Backend Engineer")).toBeVisible();
});

test("uploading an unrelated résumé shows no matches instead of forced suggestions", async ({
  page,
}) => {
  await page.route("**/api/resumes/match", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...MATCH_RESPONSE, items: [], weakMatch: true }),
    })
  );

  await page.goto("/match");

  await page.setInputFiles('input[type="file"]', {
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("dummy resume bytes"),
  });

  await expect(page.getByText("No matches found")).toBeVisible();
  await expect(page.getByText("E2E Match Frontend Engineer")).toHaveCount(0);
  await expect(page.getByText("E2E Match Backend Engineer")).toHaveCount(0);
});
