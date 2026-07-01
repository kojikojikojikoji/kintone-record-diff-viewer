import type { Page } from "@playwright/test";

export interface KintoneEnv {
  baseUrl: string;
  username: string;
  password: string;
  appId: string;
}

// Reads the connection details from the environment. Specs skip themselves when
// these are absent so the suite is safe to collect without a live kintone.
export function readEnv(): KintoneEnv | null {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const username = process.env.KINTONE_USERNAME;
  const password = process.env.KINTONE_PASSWORD;
  const appId = process.env.KINTONE_APP_ID;
  if (!baseUrl || !username || !password || !appId) return null;
  return { baseUrl, username, password, appId };
}

export async function login(page: Page, env: KintoneEnv): Promise<void> {
  await page.goto(`${env.baseUrl}/login`);
  await page.fill('input[name="username"]', env.username);
  await page.fill('input[name="password"]', env.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

export async function openIndex(page: Page, env: KintoneEnv): Promise<void> {
  await page.goto(`${env.baseUrl}/k/${env.appId}/`);
  await page.waitForLoadState("networkidle");
}
