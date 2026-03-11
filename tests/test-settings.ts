import {
  type ElectronApplication,
  type Page,
  expect,
  test,
} from "@playwright/test";

import * as setup from "./setup.ts";

test.describe("Core Behavior: App Settings", () => {
  let app: ElectronApplication;
  let mainWindow: Page;

  test.beforeEach(async () => {
    setup.resetTestDataDirectory();
    app = await setup.createApp();
    mainWindow = await app.firstWindow();
  });

  test.afterEach(async () => {
    await setup.endTest(app);
  });

  test("should open settings modal when gear icon is clicked", async () => {
    await mainWindow.waitForSelector("#settings-action");
    await mainWindow.click("#settings-action");

    const settingsButton = mainWindow.locator("#settings-action");
    await expect(settingsButton).toHaveClass(/active/);

    const functionalView = mainWindow.locator(".functional-view");
    await expect(functionalView).toBeVisible();

    await expect(mainWindow.locator("#main-container")).toContainText(
      "Settings",
    );
  });
});
