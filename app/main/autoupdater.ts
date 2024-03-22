import {shell} from "electron/common";
import {app, dialog, session} from "electron/main";
import process from "node:process";

import log from "electron-log/main";
import {
  type UpdateDownloadedEvent,
  type UpdateInfo,
  autoUpdater,
} from "electron-updater";

import * as ConfigUtil from "../common/config-util.js";

import {linuxUpdateNotification} from "./linuxupdater.js"; // Required only in case of linux

let quitting = false;

export function shouldQuitForUpdate(): boolean {
  return quitting;
}

export async function appUpdater(updateFromMenu = false): Promise<void> {
  // Don't initiate auto-updates in development
  if (!app.isPackaged) {
    return;
  }

  if (process.platform === "linux" && !process.env.APPIMAGE) {
    const ses = session.fromPartition("persist:webviewsession");
    await linuxUpdateNotification(ses);
    return;
  }

  let updateAvailable = false;

  // Log what's happening
  const updateLogger = log.create({logId: "updates"});
  updateLogger.transports.file.fileName = "updates.log";
  updateLogger.transports.file.level = "info";
  autoUpdater.logger = updateLogger;

  // Handle auto updates for beta/pre releases
  const isBetaUpdate = ConfigUtil.getConfigItem("betaUpdate", false);

  autoUpdater.allowPrerelease = isBetaUpdate;

  const eventsListenerRemove = [
    "update-available",
    "update-not-available",
  ] as const;
  autoUpdater.on("update-available", async (info: UpdateInfo) => {
    if (updateFromMenu) {
      updateAvailable = true;

      // This is to prevent removal of 'update-downloaded' and 'error' event listener.
      for (const event of eventsListenerRemove) {
        autoUpdater.removeAllListeners(event);
      }

      await dialog.showMessageBox({
        message: `A new version ${info.version}, of Zulip Desktop is available`,
        detail:
          "The update will be downloaded in the background. You will be notified when it is ready to be installed.",
      });
    }
  });

  autoUpdater.on("update-not-available", async () => {
    if (updateFromMenu) {
      // Remove all autoUpdator listeners so that next time autoUpdator is manually called these
      // listeners don't trigger multiple times.
      autoUpdater.removeAllListeners();

      await dialog.showMessageBox({
        message: "No updates available",
        detail: `You are running the latest version of Zulip Desktop.\nVersion: ${app.getVersion()}`,
      });
    }
  });

  autoUpdater.on("error", async (error: Error) => {
    if (updateFromMenu) {
      // Remove all autoUpdator listeners so that next time autoUpdator is manually called these
      // listeners don't trigger multiple times.
      autoUpdater.removeAllListeners();

      const messageText = updateAvailable
        ? "Unable to download the updates"
        : "Unable to check for updates";
      const {response} = await dialog.showMessageBox({
        type: "error",
        buttons: ["Manual Download", "Cancel"],
        message: messageText,
        detail: `Error: ${error.message}

The latest version of Zulip Desktop is available at -
https://zulip.com/apps/.
Current Version: ${app.getVersion()}`,
      });
      if (response === 0) {
        await shell.openExternal("https://zulip.com/apps/");
      }
    }
  });

  // Ask the user if update is available
  autoUpdater.on("update-downloaded", async (event: UpdateDownloadedEvent) => {
    // Ask user to update the app
    const {response} = await dialog.showMessageBox({
      type: "question",
      buttons: ["Install and Relaunch", "Install Later"],
      defaultId: 0,
      message: `A new update ${event.version} has been downloaded`,
      detail: "It will be installed the next time you restart the application",
    });
    if (response === 0) {
      quitting = true;
      autoUpdater.quitAndInstall();
    }
  });
  // Init for updates
  await autoUpdater.checkForUpdates();
}
