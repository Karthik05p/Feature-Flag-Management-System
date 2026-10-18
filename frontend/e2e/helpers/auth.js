import { expect } from "@playwright/test";

export async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(globalThis.process?.env?.E2E_USERNAME || "admin");
  await page.getByLabel("Password").fill(globalThis.process?.env?.E2E_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
