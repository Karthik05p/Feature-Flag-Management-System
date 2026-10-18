import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth.js";

test("rejects invalid login credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("invalid-e2e-user");
  await page.getByLabel("Password").fill("invalid-e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toContainText(/invalid|incorrect|authentication/i);
  await expect(page).toHaveURL(/\/login$/);
});

test("redirects unauthenticated users from protected routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("logs in and navigates through dashboard pages", async ({ page }) => {
  await login(page);

  const navigation = [
    ["Feature Flags", "/features"],
    ["Environments", "/environments"],
    ["Targeting Rules", "/rollouts"],
    ["Analytics", "/analytics"],
    ["Audit Logs", "/audit-logs"],
    ["Settings", "/settings"],
  ];

  for (const [label, path] of navigation) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
  }
});

test("manages a feature flag and targeting rule", async ({ page }) => {
  test.setTimeout(60000);
  const suffix = `${Date.now()}`;
  const flagName = `E2E Flag ${suffix}`;
  const flagKey = `e2e_flag_${suffix}`;
  const userId = `e2e-user-${suffix}`;

  await login(page);
  await page.goto("/features");
  await expect(page.getByRole("heading", { name: "Feature Flags", level: 2 })).toBeVisible();

  await page.getByRole("button", { name: /Create Flag/ }).click();
  const createDialog = page.getByRole("dialog", { name: "Create Flag" });
  await createDialog.getByLabel("Environment").selectOption({ index: 1 });
  await createDialog.getByLabel("Key").fill(flagKey);
  await createDialog.getByLabel("Name").fill(flagName);
  await createDialog.getByLabel("Default Value").fill("false");
  await createDialog.getByLabel("Owner Team").fill("e2e");
  await createDialog.getByLabel("Description").fill("Playwright feature flag");
  await createDialog.getByRole("button", { name: "Create Flag", exact: true }).click();

  await page.getByLabel("Search flags").fill(flagKey);
  const flagRow = page.getByRole("row", { name: new RegExp(`${flagName}.*${flagKey}`) });
  await expect(flagRow).toBeVisible();

  try {
    await flagRow.getByRole("button", { name: `View details for ${flagName}` }).click();
    const detailsDialog = page.getByRole("dialog", { name: "Flag details" });
    await expect(detailsDialog).toContainText(flagName);
    await detailsDialog.getByRole("button", { name: "Edit Flag" }).click();

    const editDialog = page.getByRole("dialog", { name: "Edit Flag" });
    await editDialog.getByLabel("Description").fill("Updated by Playwright");
    await editDialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByRole("status")).toContainText("Flag changes saved");

    await page.goto("/rollouts");
    await expect(page.getByRole("heading", { name: "Targeting Rules", level: 2 })).toBeVisible();
    await page.getByRole("button", { name: /Add Targeting Rule/ }).click();
    const selectDialog = page.getByRole("dialog", { name: "Add Targeting Rule" });
    const flagSelect = selectDialog.getByLabel("Feature Flag");
    const flagOption = flagSelect.locator("option").filter({ hasText: flagName });
    await flagSelect.selectOption(await flagOption.getAttribute("value"));

    const ruleDialog = page.getByRole("dialog", { name: "Add Targeting Rule" });
    await ruleDialog.getByLabel("User ID").fill(userId);
    await ruleDialog.getByLabel("Priority").fill("1");
    await ruleDialog.getByRole("button", { name: "Add Rule" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Targeting rule created successfully." })).toBeVisible();

    const ruleRow = page.getByRole("row", { name: new RegExp(`${flagName}.*${userId}`) });
    await expect(ruleRow).toBeVisible();
    await ruleRow.getByRole("button", { name: "Manage" }).click();

    const editRuleDialog = page.getByRole("dialog", { name: "Edit Targeting Rule" });
    await editRuleDialog.getByLabel("Priority").fill("2");
    await editRuleDialog.getByRole("button", { name: "Save Rule" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Targeting rule updated successfully." })).toBeVisible();
    await ruleRow.getByRole("button", { name: "Manage" }).click();
    const updatedRuleDialog = page.getByRole("dialog", { name: "Edit Targeting Rule" });
    await updatedRuleDialog.getByRole("button", { name: "Delete Rule" }).click();
    const deleteRuleDialog = page.getByRole("alertdialog", { name: "Delete targeting rule?" });
    await deleteRuleDialog.getByRole("button", { name: "Delete Rule" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Targeting rule deleted successfully." })).toBeVisible();
    await page.goto("/features");
    await expect(page.getByRole("heading", { name: "Feature Flags", level: 2 })).toBeVisible();
    await page.getByLabel("Search flags").fill(flagKey);
    await expect(page.getByRole("row", { name: new RegExp(`${flagName}.*${userId}`) })).toHaveCount(0);

    const updatedFlagRow = page.getByRole("row", { name: new RegExp(`${flagName}.*${flagKey}`) });
    await updatedFlagRow.getByRole("button", { name: `View details for ${flagName}` }).click();
    await page.getByRole("dialog", { name: "Flag details" }).getByRole("button", { name: "Delete Flag" }).click();
    const deleteFlagDialog = page.getByRole("alertdialog", { name: "Delete flag?" });
    await deleteFlagDialog.getByRole("button", { name: "Delete Flag" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`${flagName}.*${flagKey}`) })).toHaveCount(0);
    await page.goto("/audit-logs");
    await expect(page.getByRole("heading", { name: "Audit Logs", level: 2 })).toBeVisible();
    await expect(page.getByRole("cell", { name: `${flagName} (${flagKey})`, exact: true })).toHaveCount(3);
  } catch (error) {
    if (page.isClosed()) {
      throw error;
    }
    await page.goto("/features");
    const cleanupRow = page.getByRole("row", { name: new RegExp(`${flagName}.*${flagKey}`) });
    if (await cleanupRow.count()) {
      await cleanupRow.getByRole("button", { name: `View details for ${flagName}` }).click();
      await page.getByRole("dialog", { name: "Flag details" }).getByRole("button", { name: "Delete Flag" }).click();
      await page.getByRole("alertdialog", { name: "Delete flag?" }).getByRole("button", { name: "Delete Flag" }).click();
    }
    throw error;
  }
});

test("filters environments and loads analytics and audit logs", async ({ page }) => {
  await login(page);

  await page.goto("/environments");
  await expect(page.getByRole("heading", { name: "Environments", exact: true, level: 2 })).toBeVisible();
  await page.getByLabel("Search environments").fill("development");
  const developmentRow = page.getByRole("row").filter({ has: page.getByText("development", { exact: true }) });
  await expect(developmentRow).toBeVisible();
  await developmentRow.getByRole("button", { name: "Delete" }).click();
  const deleteEnvironmentDialog = page.getByRole("alertdialog", { name: "Delete environment?" });
  await expect(deleteEnvironmentDialog).toContainText("Only empty environments can be permanently deleted.");
  await expect(deleteEnvironmentDialog).toContainText("Environments with flags or audit history cannot be deleted.");
  await deleteEnvironmentDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(deleteEnvironmentDialog).toHaveCount(0);

  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Analytics", level: 2 })).toBeVisible();
  await expect(page.getByText(/Evaluation|Analytics/i).first()).toBeVisible();

  await page.goto("/audit-logs");
  await expect(page.getByRole("heading", { name: "Audit Logs", level: 2 })).toBeVisible();
});

test("supports mobile navigation at a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const closeButton = page.getByRole("button", { name: "Close navigation menu" });
  await expect(closeButton).toBeVisible();
  await closeButton.click();
  await menuButton.click();
  await page.getByRole("link", { name: "Environments", exact: true }).click();

  await expect(page).toHaveURL(/\/environments$/);
  await expect(page.getByRole("heading", { name: "Environments", exact: true, level: 2 })).toBeVisible();
});

test("switches and persists the workspace theme", async ({ page }) => {
  await login(page);
  await page.goto("/settings");

  const appearance = page.getByRole("group", { name: "Appearance theme" });
  const themeStatus = page.getByText(/Currently using .* mode\./);
  await appearance.getByRole("button", { name: "Light" }).click();
  await expect(themeStatus).toHaveText("Currently using Light mode.");
  await appearance.getByRole("button", { name: "Dark" }).click();
  await expect(themeStatus).toHaveText("Currently using Dark mode.");

  await appearance.getByRole("button", { name: "Light" }).click();
  await expect(themeStatus).toHaveText("Currently using Light mode.");
  await page.reload();
  await expect(page.getByText("Currently using Light mode.")).toBeVisible();
});

test("shows feature-flag validation before submitting", async ({ page }) => {
  await login(page);
  await page.goto("/features");
  await page.getByRole("heading", { name: "Feature Flags", level: 2 }).waitFor();
  await page.getByRole("button", { name: /Create Flag/ }).click();

  const dialog = page.getByRole("dialog", { name: "Create Flag" });
  await dialog.getByRole("button", { name: "Create Flag", exact: true }).click();

  await expect(dialog.getByText("Enter a flag key.")).toBeVisible();
  await expect(dialog.getByLabel("Key")).toHaveAttribute("aria-invalid", "true");
  await expect(dialog).toBeVisible();
});

test("can cancel a destructive flag confirmation", async ({ page }) => {
  test.setTimeout(60000);
  const suffix = `${Date.now()}`;
  const flagName = `E2E Cancel Flag ${suffix}`;
  const flagKey = `e2e_cancel_flag_${suffix}`;

  await login(page);
  await page.goto("/features");
  await page.getByRole("button", { name: /Create Flag/ }).click();
  const createDialog = page.getByRole("dialog", { name: "Create Flag" });
  await createDialog.getByLabel("Environment").selectOption({ index: 1 });
  await createDialog.getByLabel("Key").fill(flagKey);
  await createDialog.getByLabel("Name").fill(flagName);
  await createDialog.getByLabel("Default Value").fill("false");
  await createDialog.getByLabel("Owner Team").fill("e2e");
  await createDialog.getByLabel("Description").fill("Playwright cancellation test");
  await createDialog.getByRole("button", { name: "Create Flag", exact: true }).click();

  await page.getByLabel("Search flags").fill(flagKey);
  const flagRow = page.getByRole("row", { name: new RegExp(`${flagName}.*${flagKey}`) });
  await expect(flagRow).toBeVisible();

  try {
    await flagRow.getByRole("button", { name: `View details for ${flagName}` }).click();
    await page.getByRole("dialog", { name: "Flag details" }).getByRole("button", { name: "Delete Flag" }).click();
    const confirmation = page.getByRole("alertdialog", { name: "Delete flag?" });
    await confirmation.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmation).toBeHidden();
    await expect(flagRow).toBeVisible();
  } finally {
    if (!page.isClosed()) {
      const details = page.getByRole("dialog", { name: "Flag details" });
      if (await details.count()) {
        await details.getByRole("button", { name: "Delete Flag" }).click();
      }
      const deleteDialog = page.getByRole("alertdialog", { name: "Delete flag?" });
      if (await deleteDialog.count()) {
        await deleteDialog.getByRole("button", { name: "Delete Flag" }).click();
      }
    }
  }
});

test("shows a filtered-empty feature-flag state", async ({ page }) => {
  await login(page);
  await page.goto("/features");
  await page.getByRole("heading", { name: "Feature Flags", level: 2 }).waitFor();
  await page.getByLabel("Search flags").fill(`no-match-${Date.now()}`);

  await expect(page.getByRole("heading", { name: "No matching flags", level: 3 })).toBeVisible();
  await expect(page.getByText("Try a different search term or status filter.")).toBeVisible();
});
