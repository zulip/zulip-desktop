import {nativeImage} from "electron/common";
import {type BrowserWindow, app} from "electron/main";
import process from "node:process";

import * as ConfigUtil from "../common/config-util.ts";

import {send} from "./typed-ipc-main.ts";

async function showBadgeCount(
  messageCount: number,
  mainWindow: BrowserWindow,
): Promise<void> {
  if (process.platform === "win32") {
    await updateOverlayIcon(messageCount, mainWindow);
  } else {
    app.badgeCount = messageCount;
  }
}

function hideBadgeCount(mainWindow: BrowserWindow): void {
  if (process.platform === "win32") {
    mainWindow.setOverlayIcon(null, "");
  } else {
    app.badgeCount = 0;
  }
}

export async function updateBadge(
  badgeCount: number,
  mainWindow: BrowserWindow,
): Promise<void> {
  if (await ConfigUtil.getConfigItem("badgeOption", true)) {
    await showBadgeCount(badgeCount, mainWindow);
  } else {
    hideBadgeCount(mainWindow);
  }
}

async function updateOverlayIcon(
  messageCount: number,
  mainWindow: BrowserWindow,
): Promise<void> {
  if (!mainWindow.isFocused()) {
    mainWindow.flashFrame(
      await ConfigUtil.getConfigItem("flashTaskbarOnMessage", true),
    );
  }

  if (messageCount === 0) {
    mainWindow.setOverlayIcon(null, "");
  } else {
    send(mainWindow.webContents, "render-taskbar-icon", messageCount);
  }
}

export function updateTaskbarIcon(
  data: string,
  text: string,
  mainWindow: BrowserWindow,
): void {
  const img = nativeImage.createFromDataURL(data);
  mainWindow.setOverlayIcon(img, text);
}
