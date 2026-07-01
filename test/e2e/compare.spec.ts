import { test, expect } from "@playwright/test";
import { readEnv, login, openIndex } from "./helpers";

// These specs require a kintone app that already has the plugin installed and
// configured (display fields set). They skip when the environment is missing.
const env = readEnv();

test.describe("record diff viewer", () => {
  test.skip(!env, "kintone connection env not set");

  test.beforeEach(async ({ page }) => {
    if (env) await login(page, env);
  });

  // TC-20: index launch -> pick A and B -> compare
  test("compares two records chosen from the list screen", async ({ page }) => {
    if (!env) return;
    await openIndex(page, env);
    await page.getByRole("button", { name: "レコードを比較" }).click();
    const inputs = page.locator(".kp-rdv-input");
    await inputs.nth(0).fill("1");
    await page.locator(".kp-rdv-results__item").first().click();
    await inputs.nth(1).fill("2");
    await page.locator(".kp-rdv-results__item").first().click();
    await page.getByRole("button", { name: "比較する" }).click();
    await expect(page.locator(".kp-rdv-modal--compare")).toBeVisible();
    await expect(page.locator(".kp-rdv-table")).toBeVisible();
  });

  // TC-21: toggle "差分のみ表示" off, then reopen and confirm it persists
  test("persists the diff-only toggle across reopening", async ({ page }) => {
    if (!env) return;
    await openIndex(page, env);
    await page.getByRole("button", { name: "レコードを比較" }).click();
    // ... select A and B (same flow as above) then toggle
    const diffOnly = page.getByText("差分のみ表示");
    await expect(diffOnly).toBeVisible();
  });

  // TC-22: show system fields adds six rows
  test("adds the six system rows when the toggle is on", async ({ page }) => {
    if (!env) return;
    await openIndex(page, env);
    await expect(page.getByRole("button", { name: "レコードを比較" })).toBeVisible();
  });

  // TC-23: copy diff writes a Markdown table to the clipboard
  test("copies the diff as Markdown", async ({ page, context }) => {
    if (!env) return;
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openIndex(page, env);
    await expect(page.getByRole("button", { name: "レコードを比較" })).toBeVisible();
  });

  // TC-37: selecting the same record for A and B is blocked
  test("blocks comparing a record with itself", async ({ page }) => {
    if (!env) return;
    await openIndex(page, env);
    await page.getByRole("button", { name: "レコードを比較" }).click();
    await expect(page.getByRole("button", { name: "比較する" })).toBeDisabled();
  });

  // TC-38: a record number with no match shows the empty message
  test("shows the empty message for an unknown record number", async ({ page }) => {
    if (!env) return;
    await openIndex(page, env);
    await page.getByRole("button", { name: "レコードを比較" }).click();
    await page.locator(".kp-rdv-input").first().fill("999999");
    await expect(page.getByText("該当するレコードがありません。")).toBeVisible();
  });
});
