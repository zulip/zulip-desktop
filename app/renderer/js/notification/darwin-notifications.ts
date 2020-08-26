import {ipcRenderer} from 'electron';

import electron_bridge from '../electron-bridge';
import * as ConfigUtil from '../utils/config-util';

import {
	customReply, focusCurrentServer, parseReply
} from './helpers';

type ReplyHandler = (response: string) => void;
type ClickHandler = () => void;
let replyHandler: ReplyHandler;
let clickHandler: ClickHandler;

interface NotificationHandlerArgs {
	response: string;
}

class DarwinNotification {
	tag: number;

	constructor(title: string, options: NotificationOptions) {
		const profilePicURL = new URL(options.icon, location.href).href;
		this.tag = Number.parseInt(options.tag, 10);
		const notificationOptions: Electron.NotificationConstructorOptions = {
			title,
			body: options.body,
			silent: ConfigUtil.getConfigItem('silent') || false,
			hasReply: true,
			timeoutType: 'default'
		};

		ipcRenderer.send('create-notification', notificationOptions, profilePicURL);
		ipcRenderer.on('replied', async (_event: Electron.IpcRendererEvent, response: string) => {
			await this.notificationHandler({response});
			ipcRenderer.removeAllListeners('replied');
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

	async notificationHandler({response}: NotificationHandlerArgs): Promise<void> {
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

	// Method specific to Zulip's notification module, not the package used to create the same.
	// If at all the need arises to migrate to another API (or npm package), DO NOT REMOVE THIS.
	close(): void {
		// Do nothing
	}
}

module.exports = DarwinNotification;
