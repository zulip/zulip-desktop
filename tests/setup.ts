import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {type ElectronApplication, _electron} from "playwright-core";

let userDataPath: string | undefined;

// Runs Zulip Desktop.
// Returns a promise that resolves to an Electron Application once the app has loaded.
export async function createApp(): Promise<ElectronApplication> {
  if (userDataPath !== undefined) {
    throw new Error("App was already created");
  }

  userDataPath = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "zulip-test-"),
  );
  return _electron.launch({
    args: [
      `--user-data-dir=${userDataPath}`,
      path.join(import.meta.dirname, ".."),
    ],
  });
}

// Quit the app, end the test
export async function endTest(app: ElectronApplication): Promise<void> {
  await app.close();
  if (userDataPath !== undefined) {
    await fs.promises.rm(userDataPath, {recursive: true});
    userDataPath = undefined;
  }
}
