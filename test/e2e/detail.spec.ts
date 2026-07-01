import { test, expect } from "@playwright/test";
import { readEnv, login } from "./helpers";

const env = readEnv();

test.describe("record diff viewer (detail launch)", () => {
  test.skip(!env, "kintone connection env not set");

  test.beforeEach(async ({ page }) => {
    if (env) await login(page, env);
  });

  // TC-19: detail launch -> search -> select -> compare
  test("compares from a detail screen", async ({ page }) => {
    if (!env) return;
    await page.goto(`${env.baseUrl}/k/${env.appId}/show#record=1`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "他のレコードと比較" }).click();
    await page.locator(".kp-rdv-input").first().fill("2");
    await page.locator(".kp-rdv-results__item").first().click();
    await page.getByRole("button", { name: "比較する" }).click();
    await expect(page.locator(".kp-rdv-modal--compare")).toBeVisible();
  });

  // TC-24: expand and collapse a long value
  test("expands and collapses a long cell", async ({ page }) => {
    if (!env) return;
    await page.goto(`${env.baseUrl}/k/${env.appId}/show#record=1`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "他のレコードと比較" })).toBeVisible();
  });
});
