import electron from "electron";
import fs from "fs";
import path from "path";

import {JsonDB} from "node-json-db";

import type {DNDSettings} from "./dnd-util";
import * as EnterpriseUtil from "./enterprise-util";
import Logger from "./logger-util";

export interface Config extends DNDSettings {
  appLanguage: string | null;
  autoHideMenubar: boolean;
  autoUpdate: boolean;
  badgeOption: boolean;
  betaUpdate: boolean;
  customCSS: string | false | null;
  dnd: boolean;
  dndPreviousSettings: Partial<DNDSettings>;
  dockBouncing: boolean;
  downloadsPath: string;
  enableSpellchecker: boolean;
  errorReporting: boolean;
  lastActiveTab: number;
  promptDownload: boolean;
  proxyBypass: string;
  proxyPAC: string;
  proxyRules: string;
  quitOnClose: boolean;
  showSidebar: boolean;
  spellcheckerLanguages: string[] | null;
  startAtLogin: boolean;
  startMinimized: boolean;
  systemProxyRules: string;
  trayIcon: boolean;
  useManualProxy: boolean;
  useProxy: boolean;
  useSystemProxy: boolean;
}

/* To make the util runnable in both main and renderer process */
const {app, dialog} = process.type === "renderer" ? electron.remote : electron;

const logger = new Logger({
  file: "config-util.log",
});

let db: JsonDB;

reloadDB();

export function getConfigItem<Key extends keyof Config>(
  key: Key,
  defaultValue: Config[Key],
): Config[Key] {
  try {
    db.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  const value = db.getData("/")[key];
  if (value === undefined) {
    setConfigItem(key, defaultValue);
    return defaultValue;
  }

  return value;
}

// This function returns whether a key exists in the configuration file (settings.json)
export function isConfigItemExists(key: string): boolean {
  try {
    db.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  const value = db.getData("/")[key];
  return value !== undefined;
}

export function setConfigItem<Key extends keyof Config>(
  key: Key,
  value: Config[Key],
  override?: boolean,
): void {
  if (EnterpriseUtil.configItemExists(key) && !override) {
    // If item is in global config and we're not trying to override
    return;
  }

  db.push(`/${key}`, value, true);
  db.save();
}

export function removeConfigItem(key: string): void {
  db.delete(`/${key}`);
  db.save();
}

function reloadDB(): void {
  const settingsJsonPath = path.join(
    app.getPath("userData"),
    "/config/settings.json",
  );
  try {
    const file = fs.readFileSync(settingsJsonPath, "utf8");
    JSON.parse(file);
  } catch (error: unknown) {
    if (fs.existsSync(settingsJsonPath)) {
      fs.unlinkSync(settingsJsonPath);
      dialog.showErrorBox(
        "Error saving settings",
        "We encountered an error while saving the settings.",
      );
      logger.error("Error while JSON parsing settings.json: ");
      logger.error(error);
      logger.reportSentry(error);
    }
  }

  db = new JsonDB(settingsJsonPath, true, true);
}
