import { defineConfig } from "@playwright/test";

// The connection target and credentials come from the environment so nothing
// installation-specific is committed (common build rules).
// Required: KINTONE_BASE_URL, KINTONE_USERNAME, KINTONE_PASSWORD, KINTONE_APP_ID.
export default defineConfig({
  testDir: "./test/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.KINTONE_BASE_URL ?? "https://example.cybozu.com",
    headless: true,
  },
});
