import {type Event, shell} from "electron/common";
import {
  type HandlerDetails,
  Notification,
  type SaveDialogOptions,
  type WebContents,
  app,
} from "electron/main";
import fs from "node:fs";
import path from "node:path";

import * as ConfigUtil from "../common/config-util.js";
import * as LinkUtil from "../common/link-util.js";

import {send} from "./typed-ipc-main.js";

function isUploadsUrl(server: string, url: URL): boolean {
  return url.origin === server && url.pathname.startsWith("/user_uploads/");
}

function downloadFile({
  contents,
  url,
  downloadPath,
  completed,
  failed,
}: {
  contents: WebContents;
  url: string;
  downloadPath: string;
  completed(filePath: string, fileName: string): Promise<void>;
  failed(state: string): void;
}) {
  contents.downloadURL(url);
  contents.session.once("will-download", async (_event, item) => {
    if (ConfigUtil.getConfigItem("promptDownload", false)) {
      const showDialogOptions: SaveDialogOptions = {
        defaultPath: path.join(downloadPath, item.getFilename()),
      };
      item.setSaveDialogOptions(showDialogOptions);
    } else {
      const getTimeStamp = (): number => {
        const date = new Date();
        return date.getTime();
      };

      const formatFile = (filePath: string): string => {
        const fileExtension = path.extname(filePath);
        const baseName = path.basename(filePath, fileExtension);
        return `${baseName}-${getTimeStamp()}${fileExtension}`;
      };

      const filePath = path.join(downloadPath, item.getFilename());

      // Update the name and path of the file if it already exists
      const updatedFilePath = path.join(downloadPath, formatFile(filePath));
      const setFilePath: string = fs.existsSync(filePath)
        ? updatedFilePath
        : filePath;
      item.setSavePath(setFilePath);
    }

    const updatedListener = (_event: Event, state: string): void => {
      switch (state) {
        case "interrupted": {
          // Can interrupted to due to network error, cancel download then
          console.log(
            "Download interrupted, cancelling and fallback to dialog download.",
          );
          item.cancel();
          break;
        }

        case "progressing": {
          if (item.isPaused()) {
            item.cancel();
          }

          // This event can also be used to show progress in percentage in future.
          break;
        }

        default: {
          console.info("Unknown updated state of download item");
        }
      }
    };

    item.on("updated", updatedListener);
    item.once("done", async (_event, state) => {
      if (state === "completed") {
        await completed(item.getSavePath(), path.basename(item.getSavePath()));
      } else {
        console.log("Download failed state:", state);
        failed(state);
      }

      // To stop item for listening to updated events of this file
      item.removeListener("updated", updatedListener);
    });
  });
}

export default function handleExternalLink(
  contents: WebContents,
  details: HandlerDetails,
  mainContents: WebContents,
): void {
  let url: URL;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }

  const downloadPath = ConfigUtil.getConfigItem(
    "downloadsPath",
    `${app.getPath("downloads")}`,
  );

  if (isUploadsUrl(new URL(contents.getURL()).origin, url)) {
    downloadFile({
      contents,
      url: url.href,
      downloadPath,
      async completed(filePath: string, fileName: string) {
        const downloadNotification = new Notification({
          title: "Download Complete",
          body: `Click to show ${fileName} in folder`,
          silent: true, // We'll play our own sound - ding.ogg
        });
        downloadNotification.on("click", () => {
          // Reveal file in download folder
          shell.showItemInFolder(filePath);
        });
        downloadNotification.show();

        // Play sound to indicate download complete
        if (!ConfigUtil.getConfigItem("silent", false)) {
          send(mainContents, "play-ding-sound");
        }
      },
      failed(state: string) {
        // Automatic download failed, so show save dialog prompt and download
        // through webview
        // Only do this if it is the automatic download, otherwise show an error (so we aren't showing two save
        // prompts right after each other)
        // Check that the download is not cancelled by user
        if (state !== "cancelled") {
          if (ConfigUtil.getConfigItem("promptDownload", false)) {
            new Notification({
              title: "Download Complete",
              body: "Download failed",
            }).show();
          } else {
            contents.downloadURL(url.href);
          }
        }
      },
    });
  } else {
    (async () => LinkUtil.openBrowser(url))();
  }
}
