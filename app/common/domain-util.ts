import fs from "node:fs";
import path from "node:path";

import * as Sentry from "@sentry/electron";
import {JsonDB} from "node-json-db";
import {app, dialog} from "zulip:remote";

import Logger from "./logger-util.js";

const logger = new Logger({
  file: "common-domain-util.log",
});

export function getDomainDb(): JsonDB {
  const domainJsonPath = path.join(
    app.getPath("userData"),
    "config/domain.json",
  );
  try {
    const file = fs.readFileSync(domainJsonPath, "utf8");
    JSON.parse(file);
  } catch (error: unknown) {
    if (fs.existsSync(domainJsonPath)) {
      fs.unlinkSync(domainJsonPath);
      dialog.showErrorBox(
        "Error saving new organization",
        "There seems to be error while saving new organization, " +
          "you may have to re-add your previous organizations back.",
      );
      logger.error("Error while JSON parsing domain.json: ");
      logger.error(error);
      Sentry.captureException(error);
    }
  }

  return new JsonDB(domainJsonPath, true, true);
}
