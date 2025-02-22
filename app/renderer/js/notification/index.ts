import {powerMonitor} from "electron/main";

import {ipcRenderer} from "../typed-ipc-renderer.js";

let isLocked = false;

powerMonitor.on("lock-screen", () => {
  isLocked = true;
});
powerMonitor.on("unlock-screen", () => {
  isLocked = false;
});

export type NotificationData = {
  close: () => void;
  title: string;
  dir: NotificationDirection;
  lang: string;
  body: string;
  tag: string;
  icon: string;
  data: unknown;
};

export function newNotification(
  title: string,
  options: NotificationOptions,
  dispatch: (type: string, eventInit: EventInit) => boolean,
): NotificationData | null {
  if (isLocked) {
    console.log("Notification blocked: Screen is locked.");
    return null; // Prevent showing notification when the screen is locked
  }

  const notification = new Notification(title, {...options, silent: true});
  for (const type of ["click", "close", "error", "show"]) {
    notification.addEventListener(type, (event) => {
      if (type === "click") ipcRenderer.send("focus-this-webview");
      if (!dispatch(type, event)) {
        event.preventDefault();
      }
    });
  }

  return {
    close() {
      notification.close();
    },
    title: notification.title,
    dir: notification.dir,
    lang: notification.lang,
    body: notification.body,
    tag: notification.tag,
    icon: notification.icon,
    data: notification.data,
  };
}
