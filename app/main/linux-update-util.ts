import {app, dialog} from "electron/main";
import fs from "node:fs";
import path from "node:path";

import {Config, JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors.js";

import Logger from "../common/logger-util.ts";
import * as t from "../common/translation-util.ts";

const logger = new Logger({
  file: "linux-update-util.log",
});

let database: JsonDB;

reloadDatabase();

export async function getUpdateItem(
  key: string,
  defaultValue: true | null = null,
): Promise<true | null> {
  reloadDatabase();
  let value: unknown;
  try {
    value = await database.getObject<unknown>(`/${key}`);
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
  }

  if (value !== true && value !== null) {
    await setUpdateItem(key, defaultValue);
    return defaultValue;
  }

  return value;
}

export async function setUpdateItem(
  key: string,
  value: true | null,
): Promise<void> {
  await database.push(`/${key}`, value, true);
  reloadDatabase();
}

export async function removeUpdateItem(key: string): Promise<void> {
  await database.delete(`/${key}`);
  reloadDatabase();
}

function reloadDatabase(): void {
  const linuxUpdateJsonPath = path.join(
    app.getPath("userData"),
    "/config/updates.json",
  );
  try {
    const file = fs.readFileSync(linuxUpdateJsonPath, "utf8");
    JSON.parse(file);
  } catch (error: unknown) {
    if (fs.existsSync(linuxUpdateJsonPath)) {
      fs.unlinkSync(linuxUpdateJsonPath);
      dialog.showErrorBox(
        t.__("Error saving update notifications"),
        t.__("We encountered an error while saving the update notifications."),
      );
      logger.error("Error while JSON parsing updates.json: ");
      logger.error(error);
    }
  }

  database = new JsonDB(new Config(linuxUpdateJsonPath, true, true));
}
