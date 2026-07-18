import { expect, test } from "@playwright/test";

// Drives the real /jobs board (SSR first page → client proxy → API → Postgres)
// against the deterministic jobs seeded in global-setup.

test.describe("jobs board", () => {
  test("renders the SSR job list", async ({ page }) => {
    await page.goto("/jobs");

    await expect(page.getByText("E2E Senior Backend Engineer")).toBeVisible();
    await expect(page.getByText("E2E Frontend Developer")).toBeVisible();
  });

  test("filters results as the search box narrows the query", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText("E2E Frontend Developer")).toBeVisible();

    await page.getByPlaceholder("Search role, company, or keyword").fill("Backend");

    // Debounced refetch (300ms) then Postgres-side filtering: the backend role
    // stays, the frontend role drops out.
    await expect(page.getByText("E2E Senior Backend Engineer")).toBeVisible();
    await expect(page.getByText("E2E Frontend Developer")).toHaveCount(0);
  });
});
