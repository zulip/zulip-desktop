declare namespace Electron {
  // https://github.com/electron/typescript-definitions/issues/170
  interface IncomingMessage extends NodeJS.ReadableStream {}
}

interface ClipboardDecrypter {
  version: number;
  key: Uint8Array;
  pasted: Promise<string>;
}

interface ElectronBridge {
  send_event: (eventName: string | symbol, ...args: unknown[]) => boolean;
  on_event: (eventName: string, listener: (...args: any[]) => void) => void;
  new_notification: (
    title: string,
    options: NotificationOptions,
    dispatch: (type: string, eventInit: EventInit) => boolean,
  ) => import("./app/renderer/js/notification").NotificationData;
  get_idle_on_system: () => boolean;
  get_last_active_on_system: () => number;
  get_send_notification_reply_message_supported: () => boolean;
  set_send_notification_reply_message_supported: (value: boolean) => void;
  decrypt_clipboard: (version: number) => ClipboardDecrypter;
}
