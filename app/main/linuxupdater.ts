import {Notification, type Session, app} from "electron/main";

import * as semver from "semver";
import {z} from "zod";

import * as ConfigUtil from "../common/config-util.js";
import Logger from "../common/logger-util.js";

import * as LinuxUpdateUtil from "./linux-update-util.js";

const logger = new Logger({
  file: "linux-update-util.log",
});

export async function linuxUpdateNotification(session: Session): Promise<void> {
  let url = "https://api.github.com/repos/zulip/zulip-desktop/releases";
  url = ConfigUtil.getConfigItem("betaUpdate", false) ? url : url + "/latest";

  try {
    const response = await session.fetch(url);
    if (!response.ok) {
      logger.log("Linux update response status: ", response.status);
      return;
    }

    const data: unknown = await response.json();
    /* eslint-disable @typescript-eslint/naming-convention */
    const latestVersion = ConfigUtil.getConfigItem("betaUpdate", false)
      ? z.array(z.object({tag_name: z.string()})).parse(data)[0].tag_name
      : z.object({tag_name: z.string()}).parse(data).tag_name;
    /* eslint-enable @typescript-eslint/naming-convention */

    if (semver.gt(latestVersion, app.getVersion())) {
      const notified = LinuxUpdateUtil.getUpdateItem(latestVersion);
      if (notified === null) {
        new Notification({
          title: "Zulip Update",
          body: `A new version ${latestVersion} is available. Please update using your package manager.`,
        }).show();
        LinuxUpdateUtil.setUpdateItem(latestVersion, true);
      }
    }
  } catch (error: unknown) {
    logger.error("Linux update error.");
    logger.error(error);
  }
}
