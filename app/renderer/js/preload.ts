import {contextBridge} from "electron/renderer";

import electron_bridge, {bridgeEvents} from "./electron-bridge.ts";
import * as NetworkError from "./pages/network.ts";
import {ipcRenderer} from "./typed-ipc-renderer.ts";

contextBridge.exposeInMainWorld("electron_bridge", electron_bridge);

ipcRenderer.on("logout", () => {
  bridgeEvents.emit("logout");
});

ipcRenderer.on("show-keyboard-shortcuts", () => {
  bridgeEvents.emit("show-keyboard-shortcuts");
});

ipcRenderer.on("show-notification-settings", () => {
  bridgeEvents.emit("show-notification-settings");
});

window.addEventListener("load", () => {
  if (!location.href.includes("app/renderer/network.html")) {
    return;
  }

  const $reconnectButton = document.querySelector("#reconnect")!;
  const $settingsButton = document.querySelector("#settings")!;
  NetworkError.init($reconnectButton, $settingsButton);
});
