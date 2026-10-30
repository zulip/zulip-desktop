import type {ServerManagerView} from "./main.ts";
import {ipcRenderer} from "./typed-ipc-renderer.ts";

//  Default config for Icon we might make it OS specific if needed like the size
const config = {
  unreadCount: 0,
  showUnreadCount: true,
  unreadColor: "#000000",
  readColor: "#000000",
  unreadBackgroundColor: "#B9FEEA",
  readBackgroundColor: "#B9FEEA",
  size: 100,
};

const renderCanvas = function (unreadCount: number): HTMLCanvasElement {
  config.unreadCount = unreadCount;

  const {size} = config;
  const padding = size * 0.05;
  const center = size / 2;
  const hasCount = config.showUnreadCount && config.unreadCount > 0;
  const color = config.unreadCount > 0 ? config.unreadColor : config.readColor;
  const backgroundColor =
    config.unreadCount > 0
      ? config.unreadBackgroundColor
      : config.readBackgroundColor;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;

  // Circle
  context.beginPath();
  context.arc(center, center, size / 2 - padding, 0, 2 * Math.PI, false);
  context.fillStyle = backgroundColor;
  context.fill();
  context.lineWidth = size / 20;
  context.strokeStyle = backgroundColor;
  context.stroke();
  // Count or Icon
  if (hasCount) {
    context.fillStyle = color;
    context.textAlign = "center";
    if (config.unreadCount > 99) {
      context.font = `${size * 0.4}px Helvetica`;
      context.fillText("99+", center, center + size * 0.15);
    } else if (config.unreadCount < 10) {
      context.font = `${size * 0.5}px Helvetica`;
      context.fillText(String(config.unreadCount), center, center + size * 0.2);
    } else {
      context.font = `${size * 0.5}px Helvetica`;
      context.fillText(
        String(config.unreadCount),
        center,
        center + size * 0.15,
      );
    }
  }

  return canvas;
};

export function initializeTray(serverManagerView: ServerManagerView) {
  ipcRenderer.on("render-tray-icon", (_event, unreadCount: number) => {
    ipcRenderer.send(
      "update-tray-icon",
      unreadCount,
      renderCanvas(unreadCount).toDataURL(),
    );
  });

  ipcRenderer.on("toggle-tray", (_event, state: boolean) => {
    serverManagerView.preferenceView?.handleToggleTray(state);
  });
}
