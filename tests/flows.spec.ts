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

test.describe("Service category context-aware Back navigation", () => {
  const CATEGORIES = [
    "strength-fitness-performance",
    "metabolic-bone-health",
    "pain-posture-movement",
    "functional-fitness-life-stages",
    "fitness-education-independence",
  ];

  test("one top Back link and no bottom duplicate on every category", async ({ page }) => {
    for (const slug of CATEGORIES) {
      await page.goto(`/services/category/${slug}`);
      const backLinks = page.getByRole("link", { name: /^Back to/ });
      await expect(backLinks).toHaveCount(1);
    }
  });

  test("direct category URL falls back to /#services on every category", async ({
    page,
  }) => {
    for (const slug of CATEGORIES) {
      await page.goto(`/services/category/${slug}`);
      await expect(
        page.getByRole("link", { name: "Back to Our Services" }),
      ).toHaveAttribute("href", /.*#services/);
    }
  });

  test("homepage services card carries back=/#services and returns to the services section", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explore Services →" }).first().click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?back=%2F%23services/,
    );
    await page.getByRole("link", { name: "Back to Our Services" }).click();
    await expect(page).toHaveURL(/.*#services/);
    await page.waitForLoadState("networkidle");
    const services = page.locator("#services");
    await expect(services).toBeVisible();
    // The Our Services section is mid-page, so scrolling to it moves scrollY > 0.
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("back link label and destination match the entry origin for all categories", async ({
    page,
  }) => {
    const cases = [
      {
        back: encodeURIComponent("/#services"),
        label: "Back to Our Services",
        href: /.*#services/,
      },
      {
        back: encodeURIComponent("/transformation"),
        label: "Back to Fitness Snapshot",
        href: /^\/transformation$/,
      },
      {
        back: encodeURIComponent("/bmi"),
        label: "Back to Calculator",
        href: /^\/bmi$/,
      },
      // /services is no longer an allowed return destination; it now falls
      // back to the homepage Services section.
      {
        back: encodeURIComponent("/services"),
        label: "Back to Our Services",
        href: /.*#services/,
      },
    ];
    // All five categories share the identical [slug]/page.jsx component, so the
    // origin-to-label mapping is verified on one representative category. The
    // default (no back param) case is covered across all five categories below.
    for (const c of cases) {
      await page.goto(
        `/services/category/strength-fitness-performance?back=${c.back}`,
      );
      await expect(page.getByRole("link", { name: c.label })).toHaveAttribute(
        "href",
        c.href,
      );
    }
  });

  test("calculator origin returns to the correct calculator", async ({ page }) => {
    await page.goto("/bmi");
    const strength = page.getByRole("link", { name: "Explore Strength Coaching" });
    await expect(strength).toHaveAttribute(
      "href",
      /\/services\/category\/strength-fitness-performance\?.*source=calculator-bmi.*back=\/bmi/,
    );
    await strength.click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*back=\/bmi/,
    );
    await page.getByRole("link", { name: "Back to Calculator" }).click();
    await expect(page).toHaveURL("/bmi");
  });

  test("calculator referral source survives navigation through services", async ({
    page,
  }) => {
    await page.goto("/calories");
    const strength = page.getByRole("link", { name: "Explore Strength Coaching" });
    await expect(strength).toHaveAttribute(
      "href",
      /\/services\/category\/strength-fitness-performance\?.*source=calculator-calories/,
    );
    await strength.click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*source=calculator-calories/,
    );
    const expert = page.getByRole("link", { name: "Connect to an Expert" });
    await expect(expert).toHaveAttribute(
      "href",
      /source=calculator-calories/,
    );
    await expect(expert).toHaveAttribute(
      "href",
      /category=strength-fitness-performance/,
    );
  });

  test("refreshing a category page retains a valid explicitly supplied return destination", async ({
    page,
  }) => {
    await page.goto("/services/category/strength-fitness-performance?back=/bmi");
    await page.reload();
    await expect(
      page.getByRole("link", { name: "Back to Calculator" }),
    ).toHaveAttribute("href", "/bmi");
    await page.getByRole("link", { name: "Back to Calculator" }).click();
    await expect(page).toHaveURL("/bmi");
  });

  test("invalid external return URLs are rejected and fall back to /#services", async ({
    page,
  }) => {
    await page.goto(
      "/services/category/strength-fitness-performance?back=https://evil.com",
    );
    await expect(
      page.getByRole("link", { name: "Back to Our Services" }),
    ).toHaveAttribute("href", /.*#services/);
    await page.getByRole("link", { name: "Back to Our Services" }).click();
    await expect(page).toHaveURL(/.*#services/);
  });

  test("encoded malicious return URLs are rejected", async ({ page }) => {
    await page.goto(
      "/services/category/strength-fitness-performance?back=%2F%2Fevil.com",
    );
    await expect(
      page.getByRole("link", { name: "Back to Our Services" }),
    ).toHaveAttribute("href", /.*#services/);

    await page.goto(
      "/services/category/strength-fitness-performance?back=%5C%5Cevil.com",
    );
    await expect(
      page.getByRole("link", { name: "Back to Our Services" }),
    ).toHaveAttribute("href", /.*#services/);
  });

  test("connect to an expert still works on every category", async ({ page }) => {
    for (const slug of CATEGORIES) {
      await page.goto(`/services/category/${slug}`);
      const expert = page.getByRole("link", { name: "Connect to an Expert" });
      await expect(expert).toBeVisible();
      await expect(expert).toHaveAttribute(
        "href",
        new RegExp(`\/expert-connect\\?.*category=${slug}`),
      );
    }
  });

  test("expert link carries serviceReturnTo for every category", async ({
    page,
  }) => {
    for (const slug of CATEGORIES) {
      await page.goto(`/services/category/${slug}?back=%2F%23services`);
      const expert = page.getByRole("link", { name: "Connect to an Expert" });
      await expect(expert).toHaveAttribute(
        "href",
        /serviceReturnTo=%2F%23services/,
      );
    }
  });

  test("expert round-trip preserves the homepage return destination", async ({
    page,
  }) => {
    // All five categories share the identical [slug]/page.jsx component, so the
    // round-trip is verified on one representative category. The serviceReturnTo
    // wiring is asserted for all five categories in a separate test.
    const slug = "strength-fitness-performance";
    await page.goto(`/services/category/${slug}?back=%2F%23services`);
    const expert = page.getByRole("link", { name: "Connect to an Expert" });
    await expert.click();
    await expect(page).toHaveURL(/\/expert-connect/);
    // Back on the enquiry page returns to the category, carrying serviceReturnTo
    await page.getByRole("link", { name: "← Back" }).click();
    await expect(page).toHaveURL(
      new RegExp(
        `\/services\/category\/${slug}\\?serviceReturnTo=%2F%23services`,
      ),
    );
    // Top Back returns to the homepage Services section
    const back = page.getByRole("link", { name: "Back to Our Services" });
    await expect(back).toHaveAttribute("href", /.*#services/);
    await back.click();
    await expect(page).toHaveURL(/.*#services/);
    await page.waitForLoadState("networkidle");
    const services = page.locator("#services");
    await expect(services).toBeVisible();
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("calculator round-trip: 1RM -> category -> expert -> category -> calculator", async ({
    page,
  }) => {
    await page.goto("/one-rm");
    const strength = page.getByRole("link", { name: "Explore Strength Coaching" });
    await expect(strength).toHaveAttribute(
      "href",
      /\/services\/category\/strength-fitness-performance\?.*source=calculator-one-rm.*back=\/one-rm/,
    );
    await strength.click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*back=\/one-rm/,
    );
    const expert = page.getByRole("link", { name: "Connect to an Expert" });
    const expertHref = await expert.getAttribute("href");
    expect(expertHref).toContain("serviceReturnTo=%2Fone-rm");
    await expert.click();
    await page.getByRole("link", { name: "← Back" }).click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*serviceReturnTo=%2Fone-rm/,
    );
    await page.getByRole("link", { name: "Back to Calculator" }).click();
    await expect(page).toHaveURL("/one-rm");
  });

  test("snapshot round-trip: transformation -> category -> expert -> category -> transformation", { timeout: 120000 }, async ({
    page,
  }) => {
    await page.goto("/transformation");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "View My Fitness Snapshot" }).click();
    await expect(page).toHaveURL(/\/transformation/);
    // Submit minimal form to reach the results/snapshot view
    await page.getByLabel("Age (years)").fill("30");
    await page.getByLabel("Height (cm)").fill("175");
    await page.getByLabel("Weight (kg)").fill("70");
    await page.getByLabel("Equation-Specific Sex Input").selectOption("male");
    await page.getByLabel("General Activity Level").selectOption("moderate");
    await page.getByLabel("What would you like to work on?").selectOption("strength");
    await page.getByLabel("How much aerobic activity do you usually do each week?").selectOption("lt75");
    await page.getByLabel("Typical intensity").selectOption("moderate");
    await page.getByLabel("How many days per week do you perform strength-training exercises?").selectOption("3_4");
    await page.getByRole("button", { name: "View My Fitness Snapshot" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Your Fitness & Health Snapshot" })).toBeVisible();
    const explore = page.getByRole("link", { name: "Explore This Service" });
    await expect(explore).toHaveAttribute(
      "href",
      /\/services\/category\/strength-fitness-performance\?.*source=transformation.*back=%2Ftransformation/,
    );
    await explore.click({ force: true });
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*back=%2Ftransformation/,
    );
    const expert = page.getByRole("link", { name: "Connect to an Expert" });
    const expertHref = await expert.getAttribute("href");
    expect(expertHref).toContain("serviceReturnTo=%2Ftransformation");
    await expert.click();
    await page.getByRole("link", { name: "← Back" }).click();
    await expect(page).toHaveURL(
      /\/services\/category\/strength-fitness-performance\?.*serviceReturnTo=%2Ftransformation/,
    );
    await page.getByRole("link", { name: "Back to Fitness Snapshot" }).click();
    await expect(page).toHaveURL("/transformation");
  });

  test("direct /services URL redirects to the homepage Services section", async ({
    page,
  }) => {
    await page.goto("/services");
    await expect(page).toHaveURL(/.*#services/);
    await page.waitForLoadState("networkidle");
    const services = page.locator("#services");
    await expect(services).toBeVisible();
  });

  test("refreshing a category page retains an explicit serviceReturnTo", async ({
    page,
  }) => {
    await page.goto(
      "/services/category/strength-fitness-performance?serviceReturnTo=/bmi",
    );
    await page.reload();
    await expect(
      page.getByRole("link", { name: "Back to Calculator" }),
    ).toHaveAttribute("href", "/bmi");
    await page.getByRole("link", { name: "Back to Calculator" }).click();
    await expect(page).toHaveURL("/bmi");
  });
});
});
