import {remote} from "electron";
import {EventEmitter} from "events";

import type {ClipboardDecrypter} from "./clipboard-decrypter";
import {ClipboardDecrypterImpl} from "./clipboard-decrypter";
import type {NotificationData} from "./notification";
import {newNotification} from "./notification";
import {ipcRenderer} from "./typed-ipc-renderer";

type ListenerType = (...args: any[]) => void;

export interface ElectronBridge {
  send_event: (eventName: string | symbol, ...args: unknown[]) => boolean;
  on_event: (eventName: string, listener: ListenerType) => void;
  new_notification: (
    title: string,
    options: NotificationOptions,
    dispatch: (type: string, eventInit: EventInit) => boolean,
  ) => NotificationData;
  get_idle_on_system: () => boolean;
  get_last_active_on_system: () => number;
  get_send_notification_reply_message_supported: () => boolean;
  set_send_notification_reply_message_supported: (value: boolean) => void;
  decrypt_clipboard: (version: number) => ClipboardDecrypter;
}

let notificationReplySupported = false;
// Indicates if the user is idle or not
let idle = false;
// Indicates the time at which user was last active
let lastActive = Date.now();

export const bridgeEvents = new EventEmitter();

const electron_bridge: ElectronBridge = {
  send_event: (eventName: string | symbol, ...args: unknown[]): boolean =>
    bridgeEvents.emit(eventName, ...args),

  on_event: (eventName: string, listener: ListenerType): void => {
    bridgeEvents.on(eventName, listener);
  },

  new_notification: (
    title: string,
    options: NotificationOptions,
    dispatch: (type: string, eventInit: EventInit) => boolean,
  ): NotificationData => newNotification(title, options, dispatch),

  get_idle_on_system: (): boolean => idle,

  get_last_active_on_system: (): number => lastActive,

  get_send_notification_reply_message_supported: (): boolean =>
    notificationReplySupported,

  set_send_notification_reply_message_supported: (value: boolean): void => {
    notificationReplySupported = value;
  },

  decrypt_clipboard: (version: number): ClipboardDecrypter =>
    new ClipboardDecrypterImpl(version),
};

bridgeEvents.on("total_unread_count", (unreadCount: unknown) => {
  if (typeof unreadCount !== "number") {
    throw new TypeError("Expected string for unreadCount");
  }

  ipcRenderer.send("unread-count", unreadCount);
});

bridgeEvents.on("realm_name", (realmName: unknown) => {
  if (typeof realmName !== "string") {
    throw new TypeError("Expected string for realmName");
  }

  const serverURL = location.origin;
  ipcRenderer.send("realm-name-changed", serverURL, realmName);
});

bridgeEvents.on("realm_icon_url", (iconURL: unknown) => {
  if (typeof iconURL !== "string") {
    throw new TypeError("Expected string for iconURL");
  }

  const serverURL = location.origin;
  ipcRenderer.send(
    "realm-icon-changed",
    serverURL,
    iconURL.includes("http") ? iconURL : `${serverURL}${iconURL}`,
  );
});

// Set user as active and update the time of last activity
ipcRenderer.on("set-active", () => {
  if (!remote.app.isPackaged) {
    console.log("active");
  }

  idle = false;
  lastActive = Date.now();
});

// Set user as idle and time of last activity is left unchanged
ipcRenderer.on("set-idle", () => {
  if (!remote.app.isPackaged) {
    console.log("idle");
  }

  idle = true;
});

// This follows node's idiomatic implementation of event
// emitters to make event handling more simpler instead of using
// functions zulip side will emit event using ElectronBrigde.send_event
// which is alias of .emit and on this side we can handle the data by adding
// a listener for the event.
export default electron_bridge;
