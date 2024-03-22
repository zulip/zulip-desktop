import fs from "node:fs";

import {app} from "zulip:remote";

let setupCompleted = false;

const zulipDirectory = app.getPath("userData");
const logDirectory = `${zulipDirectory}/Logs/`;
const configDirectory = `${zulipDirectory}/config/`;
export const initSetUp = (): void => {
  // If it is the first time the app is running
  // create zulip dir in userData folder to
  // avoid errors
  if (!setupCompleted) {
    if (!fs.existsSync(zulipDirectory)) {
      fs.mkdirSync(zulipDirectory);
    }

    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }

    // Migrate config files from app data folder to config folder inside app
    // data folder. This will be done once when a user updates to the new version.
    if (!fs.existsSync(configDirectory)) {
      fs.mkdirSync(configDirectory);
      const domainJson = `${zulipDirectory}/domain.json`;
      const settingsJson = `${zulipDirectory}/settings.json`;
      const updatesJson = `${zulipDirectory}/updates.json`;
      const windowStateJson = `${zulipDirectory}/window-state.json`;
      const configData = [
        {
          path: domainJson,
          fileName: "domain.json",
        },
        {
          path: settingsJson,
          fileName: "settings.json",
        },
        {
          path: updatesJson,
          fileName: "updates.json",
        },
      ];
      for (const data of configData) {
        if (fs.existsSync(data.path)) {
          fs.copyFileSync(data.path, configDirectory + data.fileName);
          fs.unlinkSync(data.path);
        }
      }

      // `window-state.json` is only deleted not moved, as the electron-window-state
      // package will recreate the file in the config folder.
      if (fs.existsSync(windowStateJson)) {
        fs.unlinkSync(windowStateJson);
      }
    }

    setupCompleted = true;
  }
};
