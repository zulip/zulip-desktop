import { ipcRenderer } from 'electron';

import events = require('events');

type ListenerType = ((...args: any[]) => void);

// we have and will have some non camelcase stuff
// while working with zulip so just turning the rule off
// for the whole file.
/* eslint-disable @typescript-eslint/camelcase */
class ElectronBridge extends events {
	send_event(eventName: string | symbol, ...args: any[]): void {
		this.emit(eventName, ...args);
	}

	on_event(eventName: string, listener: ListenerType): void {
		this.on(eventName, listener);
	}
}

const electron_bridge = new ElectronBridge();

electron_bridge.on('total_unread_count', (...args) => {
	ipcRenderer.send('unread-count', ...args);
});

electron_bridge.on('realm_name', realmName => {
	const serverURL = location.origin;
	ipcRenderer.send('realm-name-changed', serverURL, realmName);
});

electron_bridge.on('realm_icon_url', iconURL => {
	const serverURL = location.origin;
	iconURL = iconURL.includes('http') ? iconURL : `${serverURL}${iconURL}`;
	ipcRenderer.send('realm-icon-changed', serverURL, iconURL);
});

// this follows node's idiomatic implementation of event
// emitters to make event handling more simpler instead of using
// functions zulip side will emit event using ElectronBrigde.send_event
// which is alias of .emit and on this side we can handle the data by adding
// a listener for the event.
export = electron_bridge;

/* eslint-enable @typescript-eslint/camelcase */
