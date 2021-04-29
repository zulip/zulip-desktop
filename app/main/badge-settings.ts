import electron, {app} from "electron";

import * as ConfigUtil from "../common/config-util";

import {send} from "./typed-ipc-main";

function showBadgeCount(
  messageCount: number,
  mainWindow: electron.BrowserWindow,
): void {
  if (process.platform === "win32") {
    updateOverlayIcon(messageCount, mainWindow);
  } else {
    app.badgeCount = messageCount;
  }
}

function hideBadgeCount(mainWindow: electron.BrowserWindow): void {
  if (process.platform === "win32") {
    mainWindow.setOverlayIcon(null, "");
  } else {
    app.badgeCount = 0;
  }
}

export function updateBadge(
  badgeCount: number,
  mainWindow: electron.BrowserWindow,
): void {
  if (ConfigUtil.getConfigItem("badgeOption", true)) {
    showBadgeCount(badgeCount, mainWindow);
  } else {
    hideBadgeCount(mainWindow);
  }
}

function updateOverlayIcon(
  messageCount: number,
  mainWindow: electron.BrowserWindow,
): void {
  if (!mainWindow.isFocused()) {
    mainWindow.flashFrame(
      ConfigUtil.getConfigItem("flashTaskbarOnMessage", true),
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
  mainWindow: electron.BrowserWindow,
): void {
  const img = electron.nativeImage.createFromDataURL(data);
  mainWindow.setOverlayIcon(img, text);
}
