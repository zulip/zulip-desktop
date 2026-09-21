import * as z from "zod";

import {
  type ClipboardDecrypter,
  ClipboardDecrypterImplementation,
} from "./clipboard-decrypter.ts";
import {type NotificationData, newNotification} from "./notification/index.ts";
import {ipcRenderer} from "./typed-ipc-renderer.ts";

type ListenerType = (...arguments_: unknown[]) => void;

/* eslint-disable @typescript-eslint/naming-convention -- public API */
export type ElectronBridge = {
  send_event: (eventName: string, ...arguments_: unknown[]) => boolean;
  on_event: (eventName: string, listener: ListenerType) => void;
  new_notification: (
    title: string,
    options: NotificationOptions,
    dispatch: (type: string, eventInit: EventInit) => boolean,
  ) => NotificationData;
  play_notification_sound: (sound_path: string) => void;
  set_play_notification_sound_supported: (supported: boolean) => void;
  get_idle_on_system: () => boolean;
  get_last_active_on_system: () => number;
  get_send_notification_reply_message_supported: () => boolean;
  set_send_notification_reply_message_supported: (value: boolean) => void;
  decrypt_clipboard: (version: number) => ClipboardDecrypter;
};
/* eslint-enable @typescript-eslint/naming-convention */

let notificationReplySupported = false;
// Indicates if the user is idle or not
let idle = false;
// Indicates the time at which user was last active
let lastActive = Date.now();

export const bridgeEvents = new EventTarget();

export class BridgeEvent extends Event {
  constructor(
    type: string,
    public readonly arguments_: unknown[] = [],
  ) {
    super(type);
  }
}

// Tells the main-world gate to stop muting in-page notification sounds
// once the web app plays them through the bridge instead.
export const disableNotificationSoundGateEvent =
  "zulip-desktop-disable-notification-sound-gate";

/* eslint-disable @typescript-eslint/naming-convention -- public API */
const electron_bridge: ElectronBridge = {
  send_event: (eventName: string, ...arguments_: unknown[]): boolean =>
    bridgeEvents.dispatchEvent(new BridgeEvent(eventName, arguments_)),

  on_event(eventName: string, listener: ListenerType): void {
    bridgeEvents.addEventListener(eventName, (event) => {
      listener(...z.instanceof(BridgeEvent).parse(event).arguments_);
    });
  },

  new_notification: (
    title: string,
    options: NotificationOptions,
    dispatch: (type: string, eventInit: EventInit) => boolean,
  ): NotificationData => newNotification(title, options, dispatch),

  play_notification_sound(sound_path: string): void {
    // Only accept the page's own notification-sound files, so a
    // compromised page can't make us play arbitrary audio. The main
    // process gates on silent mode and plays it outside the webview.
    let resolved: URL;
    try {
      resolved = new URL(sound_path, globalThis.location.origin);
    } catch {
      return;
    }

    if (
      resolved.origin !== globalThis.location.origin ||
      !resolved.pathname.startsWith("/static/audio/notification_sounds/")
    ) {
      return;
    }

    ipcRenderer.send("play-notification-sound", resolved.href);
  },

  set_play_notification_sound_supported(supported: boolean): void {
    if (supported) {
      // The web app owns sound playback now; disarm the in-page mute.
      globalThis.dispatchEvent(new Event(disableNotificationSoundGateEvent));
    }
  },

  get_idle_on_system: (): boolean => idle,

  get_last_active_on_system: (): number => lastActive,

  get_send_notification_reply_message_supported: (): boolean =>
    notificationReplySupported,

  set_send_notification_reply_message_supported(value: boolean): void {
    notificationReplySupported = value;
  },

  decrypt_clipboard: (version: number): ClipboardDecrypter =>
    new ClipboardDecrypterImplementation(version),
};
/* eslint-enable @typescript-eslint/naming-convention */

bridgeEvents.addEventListener("total_unread_count", (event) => {
  const [unreadCount] = z
    .tuple([z.number()])
    .parse(z.instanceof(BridgeEvent).parse(event).arguments_);
  ipcRenderer.send("unread-count", unreadCount);
});

bridgeEvents.addEventListener("realm_name", (event) => {
  const [realmName] = z
    .tuple([z.string()])
    .parse(z.instanceof(BridgeEvent).parse(event).arguments_);
  const serverUrl = location.origin;
  ipcRenderer.send("realm-name-changed", serverUrl, realmName);
});

bridgeEvents.addEventListener("realm_icon_url", (event) => {
  const [iconUrl] = z
    .tuple([z.string()])
    .parse(z.instanceof(BridgeEvent).parse(event).arguments_);
  const serverUrl = location.origin;
  ipcRenderer.send(
    "realm-icon-changed",
    serverUrl,
    iconUrl.includes("http") ? iconUrl : `${serverUrl}${iconUrl}`,
  );
});

// Set user as active and update the time of last activity
ipcRenderer.on("set-active", () => {
  idle = false;
  lastActive = Date.now();
});

// Set user as idle and time of last activity is left unchanged
ipcRenderer.on("set-idle", () => {
  idle = true;
});

// This follows node's idiomatic implementation of event
// emitters to make event handling more simpler instead of using
// functions zulip side will emit event using ElectronBridge.send_event
// which is alias of .emit and on this side we can handle the data by adding
// a listener for the event.
export default electron_bridge;
