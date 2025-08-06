import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {type ElectronApplication, _electron} from "playwright-core";
import z from "zod";

const testsPackage = z
  .object({productName: z.string()})
  .parse(
    JSON.parse(
      fs.readFileSync(new URL("package.json", import.meta.url), "utf8"),
    ),
  );

// Runs Zulip Desktop.
// Returns a promise that resolves to an Electron Application once the app has loaded.
export async function createApp(): Promise<ElectronApplication> {
  return _electron.launch({
    args: [import.meta.dirname], // Ensure this dir has a package.json file with a 'main' entry point
  });
}

// Quit the app, end the test
export async function endTest(app: ElectronApplication): Promise<void> {
  await app.close();
}

function getAppDataDirectory(): string {
  let base;

  switch (process.platform) {
    case "darwin": {
      base = path.join(os.homedir(), "Library", "Application Support");
      break;
    }

    case "linux": {
      base = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
      break;
    }

    case "win32": {
      base = process.env.APPDATA;
      if (base === undefined)
        throw new Error("Missing APPDATA environment variable.");
      break;
    }

    default: {
      throw new Error("Could not detect app data dir base.");
    }
  }

  console.log("Detected App Data Dir base:", base);
  return path.join(base, testsPackage.productName);
}

// Resets the test directory, containing domain.json, window-state.json, etc
export function resetTestDataDirectory(): void {
  const appDataDirectory = getAppDataDirectory();
  fs.rmSync(appDataDirectory, {force: true, recursive: true});
}
