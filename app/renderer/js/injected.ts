"use strict";

type ElectronBridge = import("./electron-bridge").ElectronBridge;

interface CompatElectronBridge extends ElectronBridge {
  readonly idle_on_system: boolean;
  readonly last_active_on_system: number;
  send_notification_reply_message_supported: boolean;
}

(() => {
  const zulipWindow = window as typeof window & {
    electron_bridge: CompatElectronBridge;
    raw_electron_bridge: ElectronBridge;
  };

  const electron_bridge: CompatElectronBridge = {
    ...zulipWindow.raw_electron_bridge,

    get idle_on_system(): boolean {
      return this.get_idle_on_system();
    },

    get last_active_on_system(): number {
      return this.get_last_active_on_system();
    },

    get send_notification_reply_message_supported(): boolean {
      return this.get_send_notification_reply_message_supported();
    },

    set send_notification_reply_message_supported(value: boolean) {
      this.set_send_notification_reply_message_supported(value);
    },
  };

  zulipWindow.electron_bridge = electron_bridge;

  function attributeListener<T extends EventTarget>(
    type: string,
  ): PropertyDescriptor {
    const handlers = new WeakMap<T, (event: Event) => unknown>();

    function listener(this: T, event: Event): void {
      if (handlers.get(this)!.call(this, event) === false) {
        event.preventDefault();
      }
    }

    return {
      configurable: true,
      enumerable: true,
      get(this: T) {
        return handlers.get(this);
      },
      set(this: T, value: unknown) {
        if (typeof value === "function") {
          if (!handlers.has(this)) {
            this.addEventListener(type, listener);
          }

          handlers.set(this, value as (event: Event) => unknown);
        } else if (handlers.has(this)) {
          this.removeEventListener(type, listener);
          handlers.delete(this);
        }
      },
    };
  }

  const NativeNotification = Notification;

  class InjectedNotification extends EventTarget {
    constructor(title: string, options: NotificationOptions = {}) {
      super();
      Object.assign(
        this,
        electron_bridge.new_notification(
          title,
          options,
          (type: string, eventInit: EventInit) =>
            this.dispatchEvent(new Event(type, eventInit)),
        ),
      );
    }

    static get maxActions(): number {
      return NativeNotification.maxActions;
    }

    static get permission(): NotificationPermission {
      return NativeNotification.permission;
    }

    static async requestPermission(
      callback?: NotificationPermissionCallback,
    ): Promise<NotificationPermission> {
      if (callback) {
        callback(await Promise.resolve(NativeNotification.permission));
      }

      return NativeNotification.permission;
    }
  }

  Object.defineProperties(InjectedNotification.prototype, {
    onclick: attributeListener("click"),
    onclose: attributeListener("close"),
    onerror: attributeListener("error"),
    onshow: attributeListener("show"),
  });

  window.Notification = InjectedNotification as unknown as typeof Notification;
})();
