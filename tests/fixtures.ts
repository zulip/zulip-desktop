import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  type ElectronApplication,
  type Page,
  test as base,
} from "@playwright/test";

type TestFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
};

export const test = base.extend<TestFixtures>({
  async electronApp({playwright}, use, testInfo) {
    const userDataPath = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "zulip-test-"),
    );
    try {
      const electronApp = await playwright._electron.launch({
        args: [
          `--user-data-dir=${userDataPath}`,
          path.join(import.meta.dirname, ".."),
        ],
      });

      try {
        const {tracing} = electronApp.context();
        await tracing.start({screenshots: true, snapshots: true});
        await use(electronApp);
      } finally {
        try {
          const {tracing} = electronApp.context();
          if (testInfo.status === testInfo.expectedStatus) {
            await tracing.stop();
          } else {
            await tracing.stop({path: testInfo.outputPath("trace.zip")});
          }
        } finally {
          await electronApp.close();
        }
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
