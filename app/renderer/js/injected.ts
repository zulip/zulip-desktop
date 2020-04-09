'use strict';

interface CompatElectronBridge extends ElectronBridge {
	readonly idle_on_system: boolean;
	readonly last_active_on_system: number;
	send_notification_reply_message_supported: boolean;
}

(() => {
	const zulipWindow = window as typeof window & {
		electron_bridge: CompatElectronBridge;
		narrow: {
			by_subject?: (target_id: number, opts: {trigger?: string}) => void;
			by_topic?: (target_id: number, opts: {trigger?: string}) => void;
		};
		page_params?: {
			default_language?: string;
		};
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
		}
	};

	zulipWindow.electron_bridge = electron_bridge;

	(async () => {
		if (document.readyState === 'loading') {
			await new Promise(resolve => {
				document.addEventListener('DOMContentLoaded', () => {
					resolve();
				});
			});
		}

		const {page_params} = zulipWindow;
		if (page_params) {
			electron_bridge.send_event('zulip-loaded');
		}
	})();

	electron_bridge.on_event('narrow-by-topic', (id: number) => {
		const {narrow} = zulipWindow;
		const narrowByTopic = narrow.by_topic || narrow.by_subject;
		narrowByTopic(id, {trigger: 'notification'});
	});

	function attributeListener<T extends EventTarget>(type: string): PropertyDescriptor {
		const symbol = Symbol('on' + type);

		function listener(this: T, ev: Event): void {
			if ((this as any)[symbol].call(this, ev) === false) {
				ev.preventDefault();
			}
		}

		return {
			configurable: true,
			enumerable: true,
			get(this: T) {
				return (this as any)[symbol];
			},
			set(this: T, value: unknown) {
				if (typeof value === 'function') {
					if (!(symbol in this)) {
						this.addEventListener(type, listener);
					}

					(this as any)[symbol] = value;
				} else if (symbol in this) {
					this.removeEventListener(type, listener);
					delete (this as any)[symbol];
				}
			}
		};
	}

	const NativeNotification = Notification;

	class InjectedNotification extends EventTarget {
		constructor(title: string, options?: NotificationOptions) {
			super();
			Object.assign(
				this,
				electron_bridge.new_notification(title, options, (type: string, eventInit: EventInit) =>
					this.dispatchEvent(new Event(type, eventInit))
				)
			);
		}

		static get maxActions(): number {
			return NativeNotification.maxActions;
		}

		static get permission(): NotificationPermission {
			return NativeNotification.permission;
		}

		static async requestPermission(callback?: NotificationPermissionCallback): Promise<NotificationPermission> {
			if (callback) {
				callback(await Promise.resolve(NativeNotification.permission));
			}

			return NativeNotification.permission;
		}
	}

	Object.defineProperties(InjectedNotification.prototype, {
		onclick: attributeListener('click'),
		onclose: attributeListener('close'),
		onerror: attributeListener('error'),
		onshow: attributeListener('show')
	});

	window.Notification = InjectedNotification as any;
})();
