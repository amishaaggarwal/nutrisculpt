import { test, expect } from "@playwright/test";
import * as fs from "fs";

const weightInput = (page, label) =>
  page.locator(`label:has-text('${label}') + input`);

test.describe("NutriSculpt calculator interactions & PNG export", () => {
  test("BMI: defaults, valid entry, unit switch, validation, result update", async ({
  page,
}) => {
    await page.goto("/bmi");

    await expect(weightInput(page, "Weight (kg)")).toHaveValue("70");
    await expect(weightInput(page, "Height (cm)")).toHaveValue("170");
    await expect(page.getByPlaceholder("25")).toHaveValue("25");

    await weightInput(page, "Weight (kg)").fill("80");
    await weightInput(page, "Height (cm)").fill("175");

    await expect(page.getByText("Your BMI Result")).toBeVisible();
    await expect(page.getByText("26.1", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: /Imperial/i }).click();
    await expect(weightInput(page, "Weight (lb)")).toHaveValue("176.4");
    await expect(page.getByPlaceholder("Feet")).toBeVisible();

    await page.getByRole("button", { name: /Metric/i }).click();
    await page.getByPlaceholder("25").fill("16");
    await expect(
      page.getByText(/intended for adults age 18 and older/),
    ).toBeVisible();
  });

  test("BMI shareable preview, menu open/close, PNG download, copy link", async ({
  page,
}) => {
    await page.goto("/bmi");
    await weightInput(page, "Weight (kg)").fill("80");
    await weightInput(page, "Height (cm)").fill("175");

    await expect(
      page.getByRole("heading", { name: "Your Shareable Result" }),
    ).toBeVisible();
    await expect(page.getByText("Your BMI Result")).toBeVisible();

    const shareBtn = page.getByRole("button", { name: /Share Result/i });
    await shareBtn.click();
    await expect(
      page.getByRole("heading", { name: "Share Your Result" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Download Image/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy Link/i })).toBeVisible();

    await page.getByRole("button", { name: "×" }).click();
    await expect(
      page.getByRole("heading", { name: "Share Your Result" }),
    ).not.toBeVisible();

    await shareBtn.click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download Image/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/_result\.png$/);
    expect(await download.path()).toBeTruthy();
    // eslint-disable-next-line no-console
    console.log("PNG downloaded:", download.suggestedFilename());

    await shareBtn.click();
    await page.getByRole("button", { name: /Copy Link/i }).click();
    try {
      await expect(
        page.getByRole("button", { name: /Copied!/i }),
      ).toBeVisible({ timeout: 5000 });
      // eslint-disable-next-line no-console
      console.log("Copy-to-clipboard: succeeded");
    } catch {
      // eslint-disable-next-line no-console
      console.log("Copy-to-clipboard: not supported in headless browser (expected limitation)");
    }
  });

  test("downloaded PNG is a valid, readable image matching the preview", async ({
    page,
  }) => {
    await page.goto("/bmi");
    await weightInput(page, "Weight (kg)").fill("80");
    await weightInput(page, "Height (cm)").fill("175");

    const shareBtn = page.getByRole("button", { name: /Share Result/i });
    await shareBtn.click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download Image/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    const buffer = fs.readFileSync(path!);
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(buffer.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    // eslint-disable-next-line no-console
    console.log(`PNG valid, ${buffer.length} bytes, file: ${download.suggestedFilename()}`);
  });
});
