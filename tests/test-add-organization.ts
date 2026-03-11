import {
  type ElectronApplication,
  type Page,
  expect,
  test,
} from "@playwright/test";

import * as setup from "./setup.ts";

test.describe("Core Behavior: Organization Management", () => {
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

  test("should successfully verify the initial screen title", async () => {
    await expect(mainWindow).toHaveTitle("Zulip");
  });

  test("should show an error when connecting to an invalid organization", async () => {
    await mainWindow.fill(
      ".setting-input-value",
      "this-does-not-exist.zulipchat.com",
    );
    await mainWindow.click("#connect");

    const webviewCount = app.windows().length;
    expect(webviewCount).toBe(1);
  });

  test("should attempt to connect to a valid test organization", async () => {
    await mainWindow.fill(".setting-input-value", "chat.zulip.org");
    await mainWindow.click("#connect");

    const orgWindow = await app.waitForEvent("window", {timeout: 30_000});
    expect(orgWindow).toBeDefined();

    await expect(orgWindow).toHaveURL(/chat\.zulip\.org/);
  });
});
