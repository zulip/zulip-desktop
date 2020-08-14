import {ipcRenderer} from 'electron';

import notifier from 'node-notifier';
import NotificationCenter from 'node-notifier/notifiers/notificationcenter';

import electron_bridge from '../electron-bridge';
import * as ConfigUtil from '../utils/config-util';

import {customReply, focusCurrentServer, parseReply} from './helpers';

type ReplyHandler = (response: string) => void;
type ClickHandler = () => void;
let replyHandler: ReplyHandler;
let clickHandler: ClickHandler;

class DarwinNotification {
	tag: number;

	constructor(title: string, options: NotificationOptions) {
		// Const silent: boolean = ConfigUtil.getConfigItem('silent') || false;
		const profilePic = new URL(options.icon, location.href).href;
		this.tag = Number.parseInt(options.tag, 10);

		const notification: NotificationCenter.Notification = {
			title,
			message: options.body,
			icon: '../../../resources/Icon.icns',
			contentImage: profilePic,
			wait: true,
			timeout: 1000, // If not large, response is timed out and reply is not sent
			closeLabel: 'Close',
			dropdownLabel: undefined,
			reply: true
		};

		notifier.notify(notification, async (_error, _response, metadata) => {
			console.log(_response);
			console.log(metadata);
			if (metadata.activationType === 'replied') {
				await this.notificationHandler(metadata.activationValue);
			}
		});

		notifier.on('click', () => {
			// Focus to the server who sent the
			// notification if not focused already
			if (clickHandler) {
				clickHandler();
			}

			focusCurrentServer();
			ipcRenderer.send('focus-app');
		});
	}

	static requestPermission(): void {
		// Do nothing
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}

	get onreply(): ReplyHandler {
		return replyHandler;
	}

	set onreply(handler: ReplyHandler) {
		replyHandler = handler;
	}

	get onclick(): ClickHandler {
		return clickHandler;
	}

	set onclick(handler: ClickHandler) {
		clickHandler = handler;
	}

	// Not something that is common or
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

	async notificationHandler(response: string): Promise<void> {
		response = await parseReply(response);
		focusCurrentServer();
		if (electron_bridge.send_notification_reply_message_supported) {
			electron_bridge.send_event('send_notification_reply_message', this.tag, response);
			return;
		}

		electron_bridge.emit('narrow-by-topic', this.tag);
		if (replyHandler) {
			replyHandler(response);
			return;
		}

		customReply(response);
	}

	// Method specific to notification api
	// used by zulip
	close(): void {
		// Do nothing
	}
}

module.exports = DarwinNotification;
