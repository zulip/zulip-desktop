import {nativeImage} from "electron/common";
import {type BrowserWindow, Menu, Tray, app} from "electron/main";
import path from "node:path";
import process from "node:process";

import {publicPath} from "../common/paths.ts";
import {t} from "../common/translation-util.ts";

import {send} from "./typed-ipc-main.ts";

let tray: Tray | null = null;

let unread = 0;

const appIcon = path.join(publicPath, "resources/tray/tray");

const iconPath = (): string => {
  if (process.platform === "linux") {
    return appIcon + "linux.png";
  }

  return (
    appIcon + (process.platform === "win32" ? "win.ico" : "macOSTemplate.png")
  );
};

const winUnreadTrayIconPath = (): string => appIcon + "unread.ico";

function updateTrayIcon(mainWindow: BrowserWindow): void {
  // We don't want to create tray from unread messages on macOS since it already has dock badges.
  if (
    tray === null ||
    (process.platform !== "linux" && process.platform !== "win32")
  ) {
    return;
  }

  if (unread === 0) {
    tray.setImage(iconPath());
    tray.setToolTip(t.__("No unread messages"));
  } else {
    if (process.platform === "win32") {
      tray.setImage(winUnreadTrayIconPath());
    } else {
      send(mainWindow.webContents, "render-tray-icon", unread);
    }

    tray.setToolTip(
      t.__mf(
        "{number, plural, one {# unread message} other {# unread messages}}",
        {number: `${unread}`},
      ),
    );
  }
}

function createTray(mainWindow: BrowserWindow): void {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t.__("Zulip"),
      click() {
        mainWindow.show();
      },
    },
    {
      label: t.__("Settings"),
      click() {
        mainWindow.show();
        if (process.platform === "darwin") {
          mainWindow.restore();
        }

        send(mainWindow.webContents, "open-settings");
      },
    },
    {
      type: "separator",
    },
    {
      label: t.__("Quit"),
      click() {
        app.quit();
      },
    },
  ]);
  tray = new Tray(iconPath());
  tray.setContextMenu(contextMenu);
  if (process.platform === "linux" || process.platform === "win32") {
    tray.on("click", () => {
      if (!mainWindow.isVisible() || mainWindow.isMinimized()) {
        mainWindow.show();
      } else {
        mainWindow.hide();
      }
    });
  }

  updateTrayIcon(mainWindow);
}

export function setTrayEnabled(
  enabled: boolean,
  mainWindow: BrowserWindow,
): void {
  if (enabled && tray === null) {
    createTray(mainWindow);
  } else if (!enabled && tray !== null) {
    tray.destroy();
    tray = null;
  }
}

export function updateTrayUnreadCount(
  unreadCount: number,
  mainWindow: BrowserWindow,
): void {
  unread = unreadCount;
  updateTrayIcon(mainWindow);
}

export function setTrayUnreadIcon(unreadCount: number, data: string): void {
  // Ignore an icon rendered for a count that has since changed.
  if (tray !== null && unreadCount === unread) {
    tray.setImage(nativeImage.createFromDataURL(data));
  }
}
