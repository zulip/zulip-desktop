'use strict';
// import { ipcRenderer } from 'electron';
// import { appId } from './helpers';
import {
	appId, customReply, focusCurrentServer, parseReply, setupReply
} from './helpers';

// import url = require('url');
import WinRTNotifier = require('electron-windows-notifications');

import ConfigUtil = require('../utils/config-util');

type ReplyHandler = (response: string) => void;
type ClickHandler = () => void;
let replyHandler: ReplyHandler;
let clickHandler: ClickHandler;
console.log('ABC');
declare const window: ZulipWebWindow;
interface NotificationHandlerArgs {
	response: string;
}

const profilePic2 = "F:\\GitHub\\zulip-desktop\\app\\renderer\\img\\icon.png";
// this.tag = opts.tag;
const notification2 = new WinRTNotifier.ToastNotification({
	appId,
	template: `<toast launch="message">
			<visual>
			<binding template="ToastGeneric">
				   <text hint-maxLines="1">%s</text>
				   <image placement="appLogoOverride" hint-crop="circle" src="%s"/>
			<text>%s</text>
		</binding>
		</visual>
		<actions>
			<input id="reply" type="text" placeHolderContent="Type a reply"/>	
			<action hint-inputId="" activationType="background" content="Reply" arguments="send" />
			<action activationType="background" content="Dismiss" arguments="" />
		</actions>			
		</toast>`,
	strings: ['Sender', profilePic2, 'Message']
});
notification2.show();

class WinRTNotification {
	tag: string;

	constructor(title: string, opts: NotificationOptions) {
		// const silent: boolean = ConfigUtil.getConfigItem('silent') || false;
		// const { host, protocol } = location;
		// const { icon } = opts;
		// const profilePic = url.resolve(`${protocol}//${host}`, icon);
		const profilePic = "F:\\GitHub\\zulip-desktop\\app\\renderer\\img\\icon.png";
		this.tag = opts.tag;
		opts.silent = false;
		console.log('Executed');
		const notification = new WinRTNotifier.ToastNotification({
			appId,
			template: `<toast launch="message">
					<visual>
					<binding template="ToastGeneric">
						   <text hint-maxLines="1">%s</text>
						   <image placement="appLogoOverride" hint-crop="circle" src="%s"/>
					<text>%s</text>
				</binding>
				</visual>
				<actions>
					<input id="reply" type="text" placeHolderContent="Type a reply"/>	
					<action hint-inputId="" activationType="background" content="Reply" arguments="send" />
					<action activationType="background" content="Dismiss" arguments="" />
				</actions>			
				</toast>`,
			strings: [title, profilePic, 'Message']
		});
		notification.show();
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
		if (window.electron_bridge.send_notification_reply_message_supported) {
			window.electron_bridge.send_event('send_notification_reply_message', this.tag, response);
			return;
		}

		setupReply(this.tag);
		if (replyHandler) {
			replyHandler(response);
			return;
		}

		customReply(response);
	}
}

module.exports = WinRTNotification;
