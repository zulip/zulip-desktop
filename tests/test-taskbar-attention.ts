import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import test from "tape";

import * as setup from "./setup.ts";

test("taskbar attention", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDirectory();
  const desktop = await setup.createApp();
  try {
    const page = await desktop.firstWindow();
    await page.waitForSelector("#settings-action");
    const configPath = path.join(
      await desktop.evaluate(({app}) => app.getPath("userData")),
      "config/settings.json",
    );
    const settings: unknown = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (typeof settings !== "object" || settings === null) {
      throw new Error("Expected settings to be an object");
    }

    const cases = [
      {count: 1, focused: false, flash: true, badge: true, expected: [true]},
      {count: 0, focused: false, flash: true, badge: true, expected: [true]},
      {count: 1, focused: true, flash: true, badge: true, expected: []},
      {count: 1, focused: false, flash: false, badge: true, expected: [false]},
      {count: 1, focused: false, flash: true, badge: false, expected: []},
    ];
    const results: boolean[][] = [];
    for (const item of cases) {
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          ...settings,
          flashTaskbarOnMessage: item.flash,
          badgeOption: item.badge,
        }),
      );
      results.push(
        // eslint-disable-next-line no-await-in-loop -- Exercise consecutive updates in one application.
        await desktop.evaluate(({BrowserWindow, ipcMain}, scenario) => {
          const mainWindow = BrowserWindow.getAllWindows()[0]!;
          const calls: boolean[] = [];
          mainWindow.isFocused = () => scenario.focused;
          mainWindow.flashFrame = (flag) => {
            calls.push(flag);
          };

          ipcMain.emit(
            "update-badge",
            {sender: mainWindow.webContents},
            scenario.count,
          );
          return calls;
        }, item),
      );
    }

    const expected = cases.map((item) =>
      process.platform === "linux" || process.platform === "win32"
        ? item.expected
        : [],
    );
    t.deepEqual(results, expected);
  } finally {
    await setup.endTest(desktop);
  }
});
