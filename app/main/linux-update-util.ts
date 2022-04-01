import {app, dialog} from "electron/main";
import fs from "node:fs";
import path from "node:path";

import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors";

import Logger from "../common/logger-util";

const logger = new Logger({
  file: "linux-update-util.log",
});

let db: JsonDB;

reloadDb();

export function getUpdateItem(
  key: string,
  defaultValue: true | null = null,
): true | null {
  reloadDb();
  let value: unknown;
  try {
    value = db.getObject<unknown>(`/${key}`);
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
  }

  if (value !== true && value !== null) {
    setUpdateItem(key, defaultValue);
    return defaultValue;
  }

  return value;
}

export function setUpdateItem(key: string, value: true | null): void {
  db.push(`/${key}`, value, true);
  reloadDb();
}

export function removeUpdateItem(key: string): void {
  db.delete(`/${key}`);
  reloadDb();
}

function reloadDb(): void {
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
        "Error saving update notifications.",
        "We encountered an error while saving the update notifications.",
      );
      logger.error("Error while JSON parsing updates.json: ");
      logger.error(error);
    }
  }

  db = new JsonDB(linuxUpdateJsonPath, true, true);
}
