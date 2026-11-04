import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {test as base} from "@playwright/test";
import {type ElectronApplication, type Page, _electron} from "playwright-core";

type TestFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
};

export const test = base.extend<TestFixtures>({
  async electronApp({browserName}, use, testInfo) {
    const userDataPath = await fs.promises.mkdtemp(
      path.join(
        os.tmpdir(),
        `zulip-test-${browserName}-${testInfo.workerIndex}-`,
      ),
    );
    try {
      const electronApp = await _electron.launch({
        args: [
          `--user-data-dir=${userDataPath}`,
          path.join(import.meta.dirname, ".."),
        ],
      });

      try {
        await use(electronApp);
      } finally {
        await electronApp.close();
      }
    } finally {
      await fs.promises.rm(userDataPath, {recursive: true, force: true});
    }
  },
  async mainWindow({electronApp}, use) {
    await use(await electronApp.firstWindow());
  },
});

export {expect} from "@playwright/test";
