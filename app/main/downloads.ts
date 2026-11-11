import {shell} from "electron/common";
import {
  BrowserWindow,
  type Session,
  type WebContents,
  dialog,
} from "electron/main";
import fs from "node:fs/promises";
import path from "node:path";

import * as ConfigUtil from "../common/config-util.ts";
import Logger from "../common/logger-util.ts";
import {t} from "../common/translation-util.ts";
import type {DownloadEntry} from "../common/typed-ipc.ts";

import {ipcMain, send} from "./typed-ipc-main.ts";

const logger = new Logger({file: "downloads.log"});
const RECENT_DOWNLOADS_LIMIT = 100;

export function initializeDownloads(
  session: Session,
  mainContents: WebContents,
): void {
  const recentDownloads = ConfigUtil.getConfigItem("recentDownloads", []);
  if (recentDownloads.length > RECENT_DOWNLOADS_LIMIT) {
    ConfigUtil.setConfigItem(
      "recentDownloads",
      recentDownloads.slice(0, RECENT_DOWNLOADS_LIMIT),
    );
  }

  const activeDownloads = new Map<
    Electron.DownloadItem,
    DownloadEntry | undefined
  >();
  let highlightedDownload: string | undefined;
  const getDownloads = (): DownloadEntry[] => {
    const active = activeDownloads
      .values()
      .filter((download) => download !== undefined)
      .toArray()
      .toReversed();
    return [
      ...active.map((download, index) => ({
        ...download,
        highlighted: index === 0,
      })),
      ...ConfigUtil.getConfigItem("recentDownloads", [])
        .filter((download) =>
          active.every((item) => item.filePath !== download.filePath),
        )
        .map((download) => ({
          ...download,
          highlighted:
            active.length === 0 && download.filePath === highlightedDownload,
        })),
    ].slice(0, RECENT_DOWNLOADS_LIMIT);
  };

  const notifyDownloads = (show: boolean): void => {
    if (!mainContents.isDestroyed()) {
      send(mainContents, "downloads-updated", getDownloads(), show);
    }
  };

  function validateDownload(
    senderFrame: Electron.WebFrameMain | null,
    filePath: string,
  ): void {
    if (
      typeof filePath !== "string" ||
      senderFrame !== mainContents.mainFrame ||
      ConfigUtil.getConfigItem("recentDownloads", []).every(
        (download) => download.filePath !== filePath,
      ) ||
      activeDownloads
        .values()
        .some((download) => download?.filePath === filePath)
    ) {
      throw new Error("Cannot access a file outside the download history");
    }
  }

  ipcMain.handle("get-recent-downloads", (event) => {
    if (event.senderFrame !== mainContents.mainFrame) {
      throw new Error("Download history is only available to the app window");
    }

    return getDownloads();
  });

  ipcMain.handle("clear-recent-downloads", (event) => {
    if (event.senderFrame !== mainContents.mainFrame) {
      throw new Error("Download history is only available to the app window");
    }

    try {
      ConfigUtil.setConfigItem("recentDownloads", []);
      highlightedDownload = undefined;
      notifyDownloads(false);
    } catch (error: unknown) {
      logger.error("Unable to clear download history", error);
      throw error;
    }
  });

  ipcMain.handle("open-download", async (event, filePath) => {
    validateDownload(event.senderFrame, filePath);

    const error = await shell.openPath(filePath);
    if (error !== "") {
      logger.error("Unable to open downloaded file", filePath, error);
    }

    return error;
  });

  ipcMain.handle("delete-download", async (event, filePath) => {
    validateDownload(event.senderFrame, filePath);
    const window = BrowserWindow.fromWebContents(mainContents);
    if (!window) {
      throw new Error("Cannot confirm file deletion without the app window");
    }

    const {response} = await dialog.showMessageBox(window, {
      type: "warning",
      buttons: [t.__("Delete"), t.__("Cancel")],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      message: t.__("Are you sure you want to delete {{{fileName}}}?", {
        fileName: path.basename(filePath),
      }),
      detail: t.__("The file will be moved to the trash.") + "\n" + filePath,
    });
    if (response !== 0) {
      return;
    }

    validateDownload(event.senderFrame, filePath);
    try {
      await shell.trashItem(filePath);
      ConfigUtil.setConfigItem(
        "recentDownloads",
        ConfigUtil.getConfigItem("recentDownloads", []).filter(
          (download) => download.filePath !== filePath,
        ),
      );
      if (highlightedDownload === filePath) {
        highlightedDownload = undefined;
      }

      notifyDownloads(false);
    } catch (error: unknown) {
      logger.error("Unable to delete downloaded file", filePath, error);
      throw error;
    }
  });

  ipcMain.handle("reveal-download", async (event, filePath) => {
    validateDownload(event.senderFrame, filePath);
    try {
      await fs.access(filePath);
      shell.showItemInFolder(filePath);
    } catch (error: unknown) {
      logger.error("Unable to reveal downloaded file", filePath, error);
      throw error;
    }
  });

  session.on("will-download", (_event, item) => {
    activeDownloads.set(item, undefined);
    const updateDownload = (): void => {
      if (!activeDownloads.has(item)) {
        return;
      }

      const filePath = item.getSavePath();
      if (filePath === "") {
        return;
      }

      const total = item.getTotalBytes();
      const progress =
        total > 0
          ? Math.min(100, Math.floor((item.getReceivedBytes() / total) * 100))
          : null;
      const previous = activeDownloads.get(item);
      if (previous?.filePath === filePath && previous.progress === progress) {
        return;
      }

      activeDownloads.set(item, {
        filePath,
        fileName: path.basename(filePath),
        progress,
      });
      notifyDownloads(previous === undefined);
    };

    item.on("updated", updateDownload);
    // Other will-download listeners may still need to choose the save path.
    queueMicrotask(updateDownload);
    item.once("done", (_doneEvent, state) => {
      activeDownloads.delete(item);
      item.removeListener("updated", updateDownload);
      if (state === "completed") {
        const filePath = item.getSavePath();
        const downloads = [
          {filePath, fileName: path.basename(filePath)},
          ...ConfigUtil.getConfigItem("recentDownloads", []).filter(
            (download) => download.filePath !== filePath,
          ),
        ].slice(0, RECENT_DOWNLOADS_LIMIT);
        ConfigUtil.setConfigItem("recentDownloads", downloads);
        highlightedDownload = filePath;
      }

      notifyDownloads(state === "completed");
    });
  });
}
