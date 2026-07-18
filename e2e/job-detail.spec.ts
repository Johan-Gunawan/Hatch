import { expect, test } from "@playwright/test";

// Clicking a job card opens the detail modal, which fetches the full job from
// GET /api/jobs/{id} through the same-origin proxy.

test("opens the job detail modal when a card is clicked", async ({ page }) => {
  await page.goto("/jobs");

  const card = page.getByText("E2E Senior Backend Engineer");
  await expect(card).toBeVisible();
  await card.click();

  // The modal shows the role's detail content pulled from the API.
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText(/Build and scale backend services/i)
  ).toBeVisible();
});
