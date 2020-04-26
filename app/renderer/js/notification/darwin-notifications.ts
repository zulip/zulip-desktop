import { ipcRenderer } from 'electron';
import {
	appId, customReply, focusCurrentServer, parseReply
} from './helpers';

import MacNotifier from 'node-mac-notifier';
import * as ConfigUtil from '../utils/config-util';
import electron_bridge from '../electron-bridge';

type ReplyHandler = (response: string) => void;
type ClickHandler = () => void;
let replyHandler: ReplyHandler;
let clickHandler: ClickHandler;

interface NotificationHandlerArgs {
	response: string;
}

class DarwinNotification {
	tag: string;

	constructor(title: string, options: NotificationOptions) {
		const silent: boolean = ConfigUtil.getConfigItem('silent') || false;
		const { icon } = options;
		const profilePic = new URL(icon, location.href).href;

		this.tag = options.tag;
		const notification = new MacNotifier(title, Object.assign(options, {
			bundleId: appId,
			canReply: true,
			silent,
			icon: profilePic
		}));

		notification.addEventListener('click', () => {
			// Focus to the server who sent the
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

	async notificationHandler({ response }: NotificationHandlerArgs): Promise<void> {
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
		return; // eslint-disable-line no-useless-return
	}
}

module.exports = DarwinNotification;
