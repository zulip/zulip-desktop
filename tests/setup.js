"use strict";
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");

const {_electron} = require("playwright-core");

const testsPkg = require("./package.json");

module.exports = {
  createApp,
  endTest,
  resetTestDataDir: resetTestDataDirectory,
};

// Runs Zulip Desktop.
// Returns a promise that resolves to an Electron Application once the app has loaded.
function createApp() {
  return _electron.launch({
    args: [path.join(__dirname)], // Ensure this dir has a package.json file with a 'main' entry point
  });
}

// Quit the app, end the test
async function endTest(app) {
  await app.close();
}

function getAppDataDirectory() {
  let base;

  switch (process.platform) {
    case "darwin": {
      base = path.join(process.env.HOME, "Library", "Application Support");
      break;
    }

    case "linux": {
      base =
        process.env.XDG_CONFIG_HOME ?? path.join(process.env.HOME, ".config");
      break;
    }

    case "win32": {
      base = process.env.APPDATA;
      break;
    }

    default: {
      throw new Error("Could not detect app data dir base.");
    }
  }

  console.log("Detected App Data Dir base:", base);
  return path.join(base, testsPkg.productName);
}

// Resets the test directory, containing domain.json, window-state.json, etc
function resetTestDataDirectory() {
  const appDataDirectory = getAppDataDirectory();
  fs.rmSync(appDataDirectory, {force: true, recursive: true});
}
