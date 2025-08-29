import fs from "node:fs";
import path from "node:path";

import * as Sentry from "@sentry/core";
import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors.js";
import type {z} from "zod";
import {app, dialog} from "zulip:remote";

import {type ConfigSchemata, configSchemata} from "./config-schemata.ts";
import * as EnterpriseUtil from "./enterprise-util.ts";
import Logger from "./logger-util.ts";

export type Config = {
  [Key in keyof ConfigSchemata]: z.output<ConfigSchemata[Key]>;
};

const logger = new Logger({
  file: "config-util.log",
});

let database: JsonDB;

reloadDatabase();

export function getConfigItem<Key extends keyof Config>(
  key: Key,
  defaultValue: Config[Key],
): z.output<ConfigSchemata[Key]> {
  try {
    database.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  try {
    const typedSchemata: {
      [Key in keyof Config]: z.ZodType<
        z.output<ConfigSchemata[Key]>,
        z.input<ConfigSchemata[Key]>
      >;
    } = configSchemata; // https://github.com/colinhacks/zod/issues/5154
    return typedSchemata[key].parse(database.getObject<unknown>(`/${key}`));
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
    setConfigItem(key, defaultValue);
    return defaultValue;
  }
}

// This function returns whether a key exists in the configuration file (settings.json)
export function isConfigItemExists(key: string): boolean {
  try {
    database.reload();
  } catch (error: unknown) {
    logger.error("Error while reloading settings.json: ");
    logger.error(error);
  }

  return database.exists(`/${key}`);
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
  database.push(`/${key}`, value, true);
  database.save();
}

export function removeConfigItem(key: string): void {
  database.delete(`/${key}`);
  database.save();
}

function reloadDatabase(): void {
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

  database = new JsonDB(settingsJsonPath, true, true);
}
