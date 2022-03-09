import {Notification, app, net} from "electron";

import getStream from "get-stream";
import * as semver from "semver";
import * as z from "zod";

import * as ConfigUtil from "../common/config-util.js";
import Logger from "../common/logger-util.js";

import * as LinuxUpdateUtil from "./linux-update-util.js";
import {fetchResponse} from "./request.js";

const logger = new Logger({
  file: "linux-update-util.log",
});

export async function linuxUpdateNotification(
  session: Electron.Session,
): Promise<void> {
  let url = "https://api.github.com/repos/zulip/zulip-desktop/releases";
  url = ConfigUtil.getConfigItem("betaUpdate", false) ? url : url + "/latest";

  try {
    const response = await fetchResponse(net.request({url, session}));
    if (response.statusCode !== 200) {
      logger.log("Linux update response status: ", response.statusCode);
      return;
    }

    const data: unknown = JSON.parse(await getStream(response));
    const latestVersion = ConfigUtil.getConfigItem("betaUpdate", false)
      ? z.array(z.object({tag_name: z.string()})).parse(data)[0].tag_name
      : z.object({tag_name: z.string()}).parse(data).tag_name;

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
