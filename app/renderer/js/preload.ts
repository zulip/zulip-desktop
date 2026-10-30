import {contextBridge} from "electron/renderer";

import electron_bridge, {
  BridgeEvent,
  bridgeEvents,
  disableNotificationSoundGateEvent,
} from "./electron-bridge.ts";
import * as NetworkError from "./pages/network.ts";
import {ipcRenderer} from "./typed-ipc-renderer.ts";

contextBridge.exposeInMainWorld("electron_bridge", electron_bridge);

// In silent mode, skip the web app's notification sounds (matched by
// their /static/audio/notification_sounds/ URL) while leaving other
// media audible. Runs in the main world; state arrives via DOM events
// since executeInMainWorld can't close over module scope.
const muteEventName = "zulip-desktop-mute-notification-sounds";
const unmuteEventName = "zulip-desktop-unmute-notification-sounds";

function installNotificationSoundGate(
  initiallySilent: boolean,
  muteEvent: string,
  unmuteEvent: string,
  disableGate: string,
): void {
  let silent = initiallySilent;
  // Disarmed once the web app declares it plays sounds via the bridge.
  let armed = true;
  globalThis.addEventListener(muteEvent, () => {
    silent = true;
  });
  globalThis.addEventListener(unmuteEvent, () => {
    silent = false;
  });
  globalThis.addEventListener(disableGate, () => {
    armed = false;
  });

  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = async function (this: HTMLMediaElement) {
    if (
      armed &&
      silent &&
      (this.currentSrc.includes("/static/audio/notification_sounds/") ||
        this.querySelector(
          'source[src*="/static/audio/notification_sounds/"]',
        ) !== null)
    ) {
      return;
    }

    await nativePlay.apply(this);
  };
}

contextBridge.executeInMainWorld({
  func: installNotificationSoundGate,
  args: [
    ipcRenderer.sendSync("get-silent-setting"),
    muteEventName,
    unmuteEventName,
    disableNotificationSoundGateEvent,
  ],
});

ipcRenderer.on("toggle-silent", (_event, state) => {
  globalThis.dispatchEvent(new Event(state ? muteEventName : unmuteEventName));
});

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
