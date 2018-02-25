const events = require('events');
const { ipcRenderer } = require('electron');

// we have and will have some non camelcase stuff
// while working with zulip so just turning the rule off
// for the wole file.
/* eslint-disable camelcase */
class ElectronBridge extends events {
	// eslint-disable-next-line no-useless-constructor
	constructor() {
		super();
	}

	send_event(...args) {
		this.emit(...args);
	}

	on_event(...args) {
		this.on(...args);
	}
}

const electron_bridge = new ElectronBridge();

electron_bridge.on('total_unread_count', (...args) => {
	console.log(args);
	ipcRenderer.send('unread-count', ...args);
});

// this follows node's idiomatic implementation of event
// emitters to make event handling more simpler instead of using
// functions zulip side will emit event using ElectronBrigde.send_event
// which is alias of .emit and on this side we can handle the data by adding
// a listener for the event.
module.exports = electron_bridge;
