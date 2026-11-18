import { test, expect } from "@playwright/test";
import * as fs from "fs";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const fillByLabel = (page, label, value) =>
  page.locator(`label:has-text('${label}') + input`).fill(value);

const selectByLabel = (page, label, value) =>
  page.locator(`label:has-text('${label}') + select`).selectOption(value);

const verifyPngExport = async ({ page, calculator, inputs }) => {
  await page.goto(`/${calculator}`);

  // Fill synthetic inputs
  for (const [label, value] of Object.entries(inputs)) {
    await fillByLabel(page, label, value);
  }

  // Shareable preview renders
  await expect(
    page.getByRole("heading", { name: "Your Shareable Result" }),
  ).toBeVisible({ timeout: 10000 });

  // Open share menu
  const shareBtn = page.getByRole("button", { name: /Share Result/i });
  await shareBtn.click();
  await expect(
    page.getByRole("heading", { name: "Share Your Result" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Download Image/i })).toBeVisible();

  // Download PNG
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download Image/i }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();

  // Validate PNG
  const buffer = fs.readFileSync(path!);
  expect(buffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  expect(buffer.length).toBeGreaterThan(500);

  // Sensible filename
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  // Brand text present in preview card
  await expect(
    page.locator('[data-shareable-card]').getByText(/NutriSculpt/i).first(),
  ).toBeVisible();

  // eslint-disable-next-line no-console
  console.log(
    `PNG OK: ${calculator} -> ${download.suggestedFilename()} (${buffer.length} bytes)`,
  );
};

test.describe("Shareable PNG export — all seven calculators", () => {
  test("BMI", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "bmi",
      inputs: { "Weight (kg)": "80", "Height (cm)": "175" },
    });
  });

  test("Calories", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "calories",
      inputs: { Age: "25", "Weight (kg)": "70", "Height(cm)": "170" },
    });
  });

  test("Macros", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "macros",
      // Defaults (age 25, weight 70kg, height 170cm, calories 2000) already
      // produce a result; the Daily Calorie Target input is hidden once
      // calculated, so we rely on the defaults here.
      inputs: {},
    });
  });

  test("1RM", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "one-rm",
      inputs: { "Weight (kg)": "80", "Reps Performed": "5" },
    });
  });

  test("Weight-for-Height (Ideal Weight)", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "ideal-weight",
      inputs: { "Height (cm)": "170" },
    });
  });

  test("Water Intake", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "water-intake",
      inputs: { Age: "25", "Weight (kg)": "70" },
    });
  });

  test("Heart Rate Zones", async ({ page }) => {
    await verifyPngExport({
      page,
      calculator: "heart-rate",
      inputs: { Age: "30", "Resting Heart Rate (bpm)": "60" },
    });
  });
});
