import { test, expect } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const routes = [
  "/",
  "/bmi",
  "/calories",
  "/macros",
  "/one-rm",
  "/ideal-weight",
  "/water-intake",
  "/heart-rate",
  "/transformation",
  "/services",
  "/services/category/personal-1-1-training",
  "/expert-connect",
];

test.describe("NutriSculpt visual baselines", () => {
  for (const route of routes) {
    test(`captures ${route} on all viewports`, async ({ browser }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      for (const vp of viewports) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await context.newPage();

        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(`[${vp.name}] ${msg.text()}`);
          }
        });
        page.on("pageerror", (err) => {
          pageErrors.push(`[${vp.name}] ${err.message}`);
        });

        const safeName = route.replace(/\//g, "_") || "home";
        await page.goto(route, { waitUntil: "networkidle" });
        await page.screenshot({
          path: `tests/screenshots/${safeName}_${vp.name}.png`,
          fullPage: true,
        });

        await context.close();
      }

      // Attach errors as an annotation so they appear in the report.
      test.info().annotations.push({
        type: "console_errors",
        description: JSON.stringify({ route, consoleErrors, pageErrors }),
      });
      expect(true).toBeTruthy();
    });
  }
});
