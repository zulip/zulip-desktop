import {ipcRenderer} from "../typed-ipc-renderer.js";

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
): NotificationData {
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
