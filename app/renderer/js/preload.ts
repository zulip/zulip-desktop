import {contextBridge} from "electron/renderer";

import electron_bridge, {BridgeEvent, bridgeEvents} from "./electron-bridge.ts";
import * as NetworkError from "./pages/network.ts";
import {ipcRenderer} from "./typed-ipc-renderer.ts";

contextBridge.exposeInMainWorld("electron_bridge", electron_bridge);

ipcRenderer.on("logout", () => {
  bridgeEvents.dispatchEvent(new BridgeEvent("logout"));
});

ipcRenderer.on("show-keyboard-shortcuts", () => {
  bridgeEvents.dispatchEvent(new BridgeEvent("show-keyboard-shortcuts"));
});

ipcRenderer.on("show-notification-settings", () => {
  bridgeEvents.dispatchEvent(new BridgeEvent("show-notification-settings"));
});

window.addEventListener("load", () => {
  if (!location.href.includes("app/renderer/network.html")) {
    return;
  }

  const $reconnectButton = document.querySelector("#reconnect")!;
  const $settingsButton = document.querySelector("#settings")!;
  NetworkError.init($reconnectButton, $settingsButton);
});
