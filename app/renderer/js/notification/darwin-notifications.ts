'use strict';
import { ipcRenderer } from 'electron';
import {
	appId, customReply, focusCurrentServer, parseReply, setupReply
} from './helpers';

import url = require('url');
import MacNotifier = require('node-mac-notifier');
import ConfigUtil = require('../utils/config-util');

type ReplyHandler = (response: string) => void;
type ClickHandler = () => void;
let replyHandler: ReplyHandler;
let clickHandler: ClickHandler;

interface NotificationHandlerArgs {
	response: string;
}

class DarwinNotification {
	tag: string;

	constructor(title: string, opts: NotificationOptions) {
		const silent: boolean = ConfigUtil.getConfigItem('silent') || false;
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

	static requestPermission(): void {
		return; // eslint-disable-line no-useless-return
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}

	set onreply(handler: ReplyHandler) {
		replyHandler = handler;
	}

	get onreply(): ReplyHandler {
		return replyHandler;
	}

	set onclick(handler: ClickHandler) {
		clickHandler = handler;
	}

	get onclick(): ClickHandler {
		return clickHandler;
	}

	// not something that is common or
	// used by zulip server but added to be
	// future proff.
	addEventListener(event: string, handler: ClickHandler | ReplyHandler): void {
		if (event === 'click') {
			clickHandler = handler as ClickHandler;
		}

		if (event === 'reply') {
			replyHandler = handler as ReplyHandler;
		}
	}

	notificationHandler({ response }: NotificationHandlerArgs): void {
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
	close(): void {
		return; // eslint-disable-line no-useless-return
	}
}

module.exports = DarwinNotification;
