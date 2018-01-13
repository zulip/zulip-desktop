'use strict';

const { ipcRenderer } = require('electron');
const url = require('url');
const MacNotifier = require('node-mac-notifier');
const ConfigUtil = require('../utils/config-util');
const {
	appId, customReply, focusCurrentServer, parseReply, setupReply
} = require('./helpers');

let replyHandler;
let clickHandler;
class DarwinNotification {
	constructor(title, opts) {
		const silent = ConfigUtil.getConfigItem('silent') || false;
		const { host, protocol } = location;
		const { icon } = opts;
		const profilePic = url.resolve(`${protocol}//${host}`, icon);

		this.tag = opts.tag;
		const notification = new MacNotifier(title, Object.assign(opts, {
			bundleId: appId,
			canReply: true,
			silent,
			icon: profilePic
		}));

		notification.addEventListener('click', () => {
			// focus to the server who sent the
			// notification if not focused already
			if (clickHandler) {
				clickHandler();
			}

			focusCurrentServer();
			ipcRenderer.send('focus-app');
		});

		notification.addEventListener('reply', this.notificationHandler);
	}

	static requestPermission() {
		return; // eslint-disable-line no-useless-return
	}

	// Override default Notification permission
	static get permission() {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}

	set onreply(handler) {
		replyHandler = handler;
	}

	get onreply() {
		return replyHandler;
	}

	set onclick(handler) {
		clickHandler = handler;
	}

	get onclick() {
		return clickHandler;
	}

	// not something that is common or
	// used by zulip server but added to be
	// future proff.
	addEventListener(event, handler) {
		if (event === 'click') {
			clickHandler = handler;
		}

		if (event === 'reply') {
			replyHandler = handler;
		}
	}

	notificationHandler({ response }) {
		response = parseReply(response);
		focusCurrentServer();
		setupReply(this.tag);

		if (replyHandler) {
			replyHandler(response);
			return;
		}

		customReply(response);
	}

	// method specific to notification api
	// used by zulip
	close() {
		return; // eslint-disable-line no-useless-return
	}
}

module.exports = DarwinNotification;
