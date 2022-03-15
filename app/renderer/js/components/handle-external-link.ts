import type {HandlerDetails} from "electron/renderer";

import {app, shell} from "@electron/remote";

import * as ConfigUtil from "../../../common/config-util";
import {ipcRenderer} from "../typed-ipc-renderer";
import * as LinkUtil from "../utils/link-util";

import type WebView from "./webview";

const dingSound = new Audio("../resources/sounds/ding.ogg");

export default function handleExternalLink(
  this: WebView,
  details: HandlerDetails,
): void {
  const url = new URL(details.url);
  const downloadPath = ConfigUtil.getConfigItem(
    "downloadsPath",
    `${app.getPath("downloads")}`,
  );

  if (LinkUtil.isUploadsUrl(this.props.url, url)) {
    ipcRenderer.send("downloadFile", url.href, downloadPath);
    ipcRenderer.once(
      "downloadFileCompleted",
      async (_event: Event, filePath: string, fileName: string) => {
        const downloadNotification = new Notification("Download Complete", {
          body: `Click to show ${fileName} in folder`,
          silent: true, // We'll play our own sound - ding.ogg
        });

        downloadNotification.addEventListener("click", () => {
          // Reveal file in download folder
          shell.showItemInFolder(filePath);
        });
        ipcRenderer.removeAllListeners("downloadFileFailed");

        // Play sound to indicate download complete
        if (!ConfigUtil.getConfigItem("silent", false)) {
          await dingSound.play();
        }
      },
    );

    ipcRenderer.once("downloadFileFailed", (_event: Event, state: string) => {
      // Automatic download failed, so show save dialog prompt and download
      // through webview
      // Only do this if it is the automatic download, otherwise show an error (so we aren't showing two save
      // prompts right after each other)
      // Check that the download is not cancelled by user
      if (state !== "cancelled") {
        if (ConfigUtil.getConfigItem("promptDownload", false)) {
          // We need to create a "new Notification" to display it, but just `Notification(...)` on its own
          // doesn't work
          // eslint-disable-next-line no-new
          new Notification("Download Complete", {
            body: "Download failed",
          });
        } else {
          this.getWebContents().downloadURL(url.href);
        }
      }

      ipcRenderer.removeAllListeners("downloadFileCompleted");
    });
  } else {
    (async () => LinkUtil.openBrowser(url))();
  }
}
