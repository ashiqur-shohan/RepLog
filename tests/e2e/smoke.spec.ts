import { test, expect } from "@playwright/test";

test.describe("smoke: public pages render without auth", () => {
  test("landing page — title and hero heading", async ({ page }) => {
    await page.goto("/");

    // Page title from root layout metadata
    await expect(page).toHaveTitle(/replog/i);

    // Hero h1 on the landing page
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    // The landing copy spans three lines but the element text contains all of them
    await expect(heading).toContainText("Log it.");
  });

  test("landing page — CTA links are present", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /start free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /see pricing/i })).toBeVisible();
  });

  test("pricing page — title and plan headings", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page).toHaveTitle(/replog/i);

    // Key heading on pricing page
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Free for life");
  });

  test("pricing page — Free and Pro plan cards are visible", async ({ page }) => {
    await page.goto("/pricing");

    // Both pricing tiers should be rendered on screen
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText(/\$5/)).toBeVisible();

    // Sign-up CTA links
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start with pro/i })).toBeVisible();
  });
});
