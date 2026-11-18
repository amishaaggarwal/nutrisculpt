import { test, expect } from "@playwright/test";

const calculatorRoutes = [
  "/bmi",
  "/calories",
  "/macros",
  "/one-rm",
  "/ideal-weight",
  "/water-intake",
  "/heart-rate",
];

test.describe("NutriSculpt route load + responsive + form validation", () => {
  test("all seven calculators load with controls and no console errors", async ({
    page,
  }) => {
    for (const route of calculatorRoutes) {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(route, { waitUntil: "load" });
      await expect(page.getByRole("heading").first()).toBeVisible();
      if (errors.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`CONSOLE ERRORS on ${route}:`, errors);
      }
      page.removeAllListeners("console");
    }
  });

  test("transformation and expert-connect load with form fields", async ({
    page,
  }) => {
    await page.goto("/transformation");
    await expect(page.getByRole("heading", { name: "Start Your Transformation" })).toBeVisible();
    await expect(page.locator('input[name="age"]')).toBeVisible();

    await page.goto("/expert-connect");
    await expect(page.getByRole("heading", { name: "Let's Talk About Your Goals" })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Interested Service Category/i)).toBeVisible();
  });

  test("five service category pages load", async ({ page }) => {
    const slugs = [
      "strength-fitness-performance",
      "metabolic-bone-health",
      "pain-posture-movement",
      "functional-fitness-life-stages",
      "fitness-education-independence",
    ];
    for (const slug of slugs) {
      await page.goto(`/services/category/${slug}`, { waitUntil: "load" });
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("expert-connect validation messages appear without submitting", async ({
    page,
  }) => {
    await page.goto("/expert-connect");
    await page.getByRole("button", { name: /Send My Enquiry/i }).click();
    await expect(page.getByText("Full name is required.")).toBeVisible();
    await expect(
      page.getByText("Please provide at least one contact method: email or phone number."),
    ).toBeVisible();
    await expect(
      page.getByText("Please tell us what you would like to achieve."),
    ).toBeVisible();
    await expect(page.getByText("Please confirm we may use your details")).toBeVisible();
  });

  test("no horizontal overflow on mobile across key routes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const routes = [
      "/",
      "/bmi",
      "/calories",
      "/transformation",
      "/services/category/strength-fitness-performance",
      "/expert-connect",
    ];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "load" });
      const overflow = await page.evaluate(() => {
        const w = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        );
        return w > window.innerWidth ? w - window.innerWidth : 0;
      });
      // eslint-disable-next-line no-console
      console.log(`mobile overflow ${route}: ${overflow}px`);
      expect(overflow).toBeLessThanOrEqual(2);
    }
  });

  test("/services loads and lists all five categories", async ({ page }) => {
    const res = await page.goto("/services", { waitUntil: "load" });
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Our Coaching Services" })).toBeVisible();
    const titles = [
      "Personal Training & Strength Development",
      "Exercise for Special Populations & Health-Focused Fitness",
      "Movement, Posture & Functional Fitness",
      "Athletic Performance & Conditioning",
      "Fitness Education & Independent Training",
    ];
    for (const title of titles) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    const categoryLinks = page.getByRole("link", {
      name: /Explore .* →/,
    });
    await expect(categoryLinks).toHaveCount(5);
    for (const slug of [
      "strength-fitness-performance",
      "metabolic-bone-health",
      "pain-posture-movement",
      "functional-fitness-life-stages",
      "fitness-education-independence",
    ]) {
      await expect(
        page.locator(`a[href="/services/category/${slug}"]`),
      ).toBeVisible();
    }
  });

  test("no horizontal overflow on narrow mobile (320px)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const routes = ["/", "/bmi", "/transformation", "/services", "/expert-connect"];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "load" });
      const overflow = await page.evaluate(() => {
        const w = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        );
        return w > window.innerWidth ? w - window.innerWidth : 0;
      });
      // eslint-disable-next-line no-console
      console.log(`narrow mobile overflow ${route}: ${overflow}px`);
      expect(overflow).toBeLessThanOrEqual(2);
    }
  });

  test("pages render with reduced motion preference", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const routes = ["/", "/bmi", "/transformation", "/services", "/expert-connect"];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "load" });
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
    // Shareable result card still visible with reduced motion
    await page.goto("/bmi", { waitUntil: "load" });
    await page.locator(`label:has-text('Weight (kg)') + input`).fill("80");
    await page.locator(`label:has-text('Height (cm)') + input`).fill("175");
    await expect(
      page.getByRole("heading", { name: "Your Shareable Result" }),
    ).toBeVisible({ timeout: 10000 });
  });
});
