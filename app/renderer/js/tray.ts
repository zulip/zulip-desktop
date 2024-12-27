import type {NativeImage} from "electron/common";
import {nativeImage} from "electron/common";
import type {Tray as ElectronTray} from "electron/main";
import path from "node:path";
import process from "node:process";

import {BrowserWindow, Menu, Tray} from "@electron/remote";

import * as ConfigUtil from "../../common/config-util.js";
import {publicPath} from "../../common/paths.js";
import type {RendererMessage} from "../../common/typed-ipc.js";

import type {ServerManagerView} from "./main.js";
import {ipcRenderer} from "./typed-ipc-renderer.js";

let tray: ElectronTray | null = null;

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

let unread = 0;

const trayIconSize = (): number => {
  switch (process.platform) {
    case "darwin": {
      return 20;
    }

    case "win32": {
      return 100;
    }

    case "linux": {
      return 100;
    }

    default: {
      return 80;
    }
  }
};

//  Default config for Icon we might make it OS specific if needed like the size
const config = {
  pixelRatio: window.devicePixelRatio,
  unreadCount: 0,
  showUnreadCount: true,
  unreadColor: "#000000",
  readColor: "#000000",
  unreadBackgroundColor: "#B9FEEA",
  readBackgroundColor: "#B9FEEA",
  size: trayIconSize(),
  thick: process.platform === "win32",
};

const renderCanvas = function (arg: number): HTMLCanvasElement {
  config.unreadCount = arg;

  const size = config.size * config.pixelRatio;
  const padding = size * 0.05;
  const center = size / 2;
  const hasCount = config.showUnreadCount && config.unreadCount;
  const color = config.unreadCount ? config.unreadColor : config.readColor;
  const backgroundColor = config.unreadCount
    ? config.unreadBackgroundColor
    : config.readBackgroundColor;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Circle
  // If (!config.thick || config.thick && hasCount) {
  ctx.beginPath();
  ctx.arc(center, center, size / 2 - padding, 0, 2 * Math.PI, false);
  ctx.fillStyle = backgroundColor;
  ctx.fill();
  ctx.lineWidth = size / (config.thick ? 10 : 20);
  ctx.strokeStyle = backgroundColor;
  ctx.stroke();
  // Count or Icon
  if (hasCount) {
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    if (config.unreadCount > 99) {
      ctx.font = `${config.thick ? "bold " : ""}${size * 0.4}px Helvetica`;
      ctx.fillText("99+", center, center + size * 0.15);
    } else if (config.unreadCount < 10) {
      ctx.font = `${config.thick ? "bold " : ""}${size * 0.5}px Helvetica`;
      ctx.fillText(String(config.unreadCount), center, center + size * 0.2);
    } else {
      ctx.font = `${config.thick ? "bold " : ""}${size * 0.5}px Helvetica`;
      ctx.fillText(String(config.unreadCount), center, center + size * 0.15);
    }
  }

  return canvas;
};

/**
 * Renders the tray icon as a native image
 * @param arg: Unread count
 * @return the native image
 */
const renderNativeImage = function (arg: number): NativeImage {
  if (process.platform === "win32") {
    return nativeImage.createFromPath(winUnreadTrayIconPath());
  }

  const canvas = renderCanvas(arg);
  const pngData = nativeImage
    .createFromDataURL(canvas.toDataURL("image/png"))
    .toPNG();
  return nativeImage.createFromBuffer(pngData, {
    scaleFactor: config.pixelRatio,
  });
};

function sendAction<Channel extends keyof RendererMessage>(
  channel: Channel,
  ...args: Parameters<RendererMessage[Channel]>
): void {
  const win = BrowserWindow.getAllWindows()[0];

  if (process.platform === "darwin") {
    win.restore();
  }

  ipcRenderer.send("forward-to", win.webContents.id, channel, ...args);
}

const createTray = function (): void {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Zulip",
      click() {
        ipcRenderer.send("focus-app");
      },
    },
    {
      label: "Settings",
      click() {
        ipcRenderer.send("focus-app");
        sendAction("open-settings");
      },
    },
    {
      type: "separator",
    },
    {
      label: "Quit",
      click() {
        ipcRenderer.send("quit-app");
      },
    },
  ]);
  tray = new Tray(iconPath());
  tray.setContextMenu(contextMenu);
  if (process.platform === "linux" || process.platform === "win32") {
    tray.on("click", () => {
      ipcRenderer.send("toggle-app");
    });
  }
};

export function initializeTray(serverManagerView: ServerManagerView) {
  ipcRenderer.on("destroytray", () => {
    if (!tray) {
      return;
    }

    tray.destroy();
    if (tray.isDestroyed()) {
      tray = null;
    } else {
      throw new Error("Tray icon not properly destroyed.");
    }
  });

  ipcRenderer.on("tray", (_event, arg: number): void => {
    if (!tray) {
      return;
    }

    // We don't want to create tray from unread messages on macOS since it already has dock badges.
    if (process.platform === "linux" || process.platform === "win32") {
      if (arg === 0) {
        unread = arg;
        tray.setImage(iconPath());
        tray.setToolTip("No unread messages");
      } else {
        unread = arg;
        const image = renderNativeImage(arg);
        tray.setImage(image);
        tray.setToolTip(`${arg} unread messages`);
      }
    }
  });

  function toggleTray(): void {
    let state;
    if (tray) {
      state = false;
      tray.destroy();
      if (tray.isDestroyed()) {
        tray = null;
      }

      ConfigUtil.setConfigItem("trayIcon", false);
    } else {
      state = true;
      createTray();
      if (process.platform === "linux" || process.platform === "win32") {
        const image = renderNativeImage(unread);
        tray!.setImage(image);
        tray!.setToolTip(`${unread} unread messages`);
      }

      ConfigUtil.setConfigItem("trayIcon", true);
    }

    serverManagerView.preferenceView?.handleToggleTray(state);
  }

  ipcRenderer.on("toggletray", toggleTray);

  if (ConfigUtil.getConfigItem("trayIcon", true)) {
    createTray();
  }
}
