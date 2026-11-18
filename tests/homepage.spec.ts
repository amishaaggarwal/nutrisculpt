import { test, expect } from "@playwright/test";

test.describe("NutriSculpt homepage", () => {
  test("loads and shows brand identity", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/NutriSculpt/);
    await expect(
      page.getByRole("heading", {
        name: "Nourishing Bodies & Sculpting Greatness",
      }),
    ).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Start Your Transformation/ }),
    ).toBeVisible();
  });

  test("navigates to transformation page", async ({ page }) => {
    await page.goto("/transformation");
    await expect(page).toHaveURL("/transformation");
    await expect(
      page.getByRole("heading", { name: "Start Your Transformation" }),
    ).toBeVisible();
  });
});
