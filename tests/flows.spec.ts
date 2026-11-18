import { test, expect } from "@playwright/test";

test.describe("NutriSculpt navigation flows & source attribution", () => {
  test("Flow A: BMI -> transformation carries calculator source", async ({ page }) => {
    await page.goto("/bmi");
    const primary = page.getByRole("link", {
      name: "Explore Your Fitness & Health Snapshot",
    });
    await expect(primary).toHaveAttribute("href", /\/transformation\?source=calculator-bmi/);
    await primary.click();
    await expect(page).toHaveURL(/\/transformation\?.*source=calculator-bmi/);
  });

  test("Flow E: BMI -> service category -> expert preserves calculator source", async ({
    page,
  }) => {
    await page.goto("/bmi");
    const strength = page.getByRole("link", { name: "Explore Strength Coaching" });
    await expect(strength).toHaveAttribute(
      "href",
      /\/services\/category\/strength-fitness-performance\?source=calculator-bmi/,
    );
    await strength.click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*source=calculator-bmi/,
    );
    const expert = page.getByRole("link", { name: "Connect to an Expert" });
    await expect(expert).toHaveAttribute(
      "href",
      /\/expert-connect\?.*source=calculator-bmi/,
    );
    await expect(expert).toHaveAttribute(
      "href",
      /category=strength-fitness-performance/,
    );
  });

  test("expert-connect preselects category and goal from query params without submitting", async ({
    page,
  }) => {
    await page.goto(
      "/expert-connect?category=strength-fitness-performance&goal=strength&source=calculator-bmi",
    );
    await expect(page.locator("#selectedServiceCategory")).toHaveValue(
      "strength-fitness-performance",
    );
    await expect(
      page.getByText("Your selected goal:", { exact: true }),
    ).toBeVisible();
  });

  test("calculator source is invalid for non-calculator values", async ({ page }) => {
    await page.goto("/transformation?source=not-a-calculator");
    // resolvedSource should fall back to "transformation" - no crash
    await expect(page.getByRole("heading", { name: "Start Your Transformation" })).toBeVisible();
  });
});
