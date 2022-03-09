import fs from "fs";
import path from "path";

import * as Sentry from "@sentry/electron";
import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors";
import type * as z from "zod";

import {configSchemata} from "./config-schemata";
import * as EnterpriseUtil from "./enterprise-util";
import Logger from "./logger-util";
import {app, dialog} from "./remote";

export type Config = {
  [Key in keyof typeof configSchemata]: z.output<typeof configSchemata[Key]>;
};

const logger = new Logger({
  file: "config-util.log",
});

let db: JsonDB;

reloadDb();

export function getConfigItem<Key extends keyof Config>(
  key: Key,
  defaultValue: Config[Key],
): z.output<typeof configSchemata[Key]> {
  try {
    db.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  try {
    return configSchemata[key].parse(db.getObject<unknown>(`/${key}`));
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
    setConfigItem(key, defaultValue);
    return defaultValue;
  }
}

// This function returns whether a key exists in the configuration file (settings.json)
export function isConfigItemExists(key: string): boolean {
  try {
    db.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  return db.exists(`/${key}`);
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

  configSchemata[key].parse(value);
  db.push(`/${key}`, value, true);
  db.save();
}

export function removeConfigItem(key: string): void {
  db.delete(`/${key}`);
  db.save();
}

function reloadDb(): void {
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
      Sentry.captureException(error);
    }
  }

  db = new JsonDB(settingsJsonPath, true, true);
}
