import electron from "electron";
import fs from "fs";
import path from "path";

const {app} = process.type === "renderer" ? electron.remote : electron;

let setupCompleted = false;

const zulipDir = app.getPath("userData");
const configDir = path.join(zulipDir, "config");
export const initSetUp = (): void => {
  // If it is the first time the app is running
  // create zulip dir in userData folder to
  // avoid errors
  if (!setupCompleted) {
    if (!fs.existsSync(zulipDir)) {
      fs.mkdirSync(zulipDir);
    }

    // Migrate config files from app data folder to config folder inside app
    // data folder. This will be done once when a user updates to the new version.
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
      const domainJson = path.join(zulipDir, "domain.json");
      const settingsJson = path.join(zulipDir, "settings.json");
      const updatesJson = path.join(zulipDir, "updates.json");
      const windowStateJson = path.join(zulipDir, "window-state.json");
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
          fs.copyFileSync(data.path, configDir + data.fileName);
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
