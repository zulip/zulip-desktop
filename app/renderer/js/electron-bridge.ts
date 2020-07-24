import {ipcRenderer} from 'electron';
import {EventEmitter} from 'events';

import {ClipboardDecrypterImpl} from './clipboard-decrypter';
import {NotificationData, newNotification} from './notification';

type ListenerType = ((...args: any[]) => void);

class ElectronBridgeImpl extends EventEmitter implements ElectronBridge {
	send_notification_reply_message_supported: boolean;
	idle_on_system: boolean;
	last_active_on_system: number;

	constructor() {
		super();
		this.send_notification_reply_message_supported = false;
		// Indicates if the user is idle or not
		this.idle_on_system = false;

		// Indicates the time at which user was last active
		this.last_active_on_system = Date.now();
	}

	send_event = (eventName: string | symbol, ...args: unknown[]): void => {
		this.emit(eventName, ...args);
	};

	on_event = (eventName: string, listener: ListenerType): void => {
		this.on(eventName, listener);
	};

	new_notification = (
		title: string,
		options: NotificationOptions | undefined,
		dispatch: (type: string, eventInit: EventInit) => boolean
	): NotificationData =>
		newNotification(title, options, dispatch);

	get_idle_on_system = (): boolean => this.idle_on_system;

	get_last_active_on_system = (): number => this.last_active_on_system;

	get_send_notification_reply_message_supported = (): boolean =>
		this.send_notification_reply_message_supported;

	set_send_notification_reply_message_supported = (value: boolean): void => {
		this.send_notification_reply_message_supported = value;
	};

	decrypt_clipboard = (version: number): ClipboardDecrypterImpl =>
		new ClipboardDecrypterImpl(version);
}

const electron_bridge = new ElectronBridgeImpl();

electron_bridge.on('total_unread_count', (...args) => {
	ipcRenderer.send('unread-count', ...args);
});

electron_bridge.on('realm_name', realmName => {
	const serverURL = location.origin;
	ipcRenderer.send('realm-name-changed', serverURL, realmName);
});

electron_bridge.on('realm_icon_url', (iconURL: unknown) => {
	if (typeof iconURL !== 'string') {
		throw new TypeError('Expected string for iconURL');
	}

	const serverURL = location.origin;
	iconURL = iconURL.includes('http') ? iconURL : `${serverURL}${iconURL}`;
	ipcRenderer.send('realm-icon-changed', serverURL, iconURL);
});

// This follows node's idiomatic implementation of event
// emitters to make event handling more simpler instead of using
// functions zulip side will emit event using ElectronBrigde.send_event
// which is alias of .emit and on this side we can handle the data by adding
// a listener for the event.
export default electron_bridge;
