import { expect, test } from "@playwright/test";

// Clicking a job card opens the detail modal (a custom fixed overlay — not a
// semantic dialog) showing the role's full description.

test("opens the job detail modal when a card is clicked", async ({ page }) => {
  await page.goto("/jobs");

  const card = page.getByText("E2E Senior Backend Engineer");
  await expect(card).toBeVisible();
  await card.click();

  // The modal renders the description and a Close control — neither is present
  // on the board card, so their visibility confirms the modal opened.
  await expect(page.getByText(/Build and scale backend services/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" }).first()).toBeVisible();
});
