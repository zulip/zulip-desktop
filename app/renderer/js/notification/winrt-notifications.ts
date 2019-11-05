'use strict';
// import { ipcRenderer } from 'electron';
// import { appId } from './helpers';
import { remote } from 'electron';
import {
	appId, customReply, focusCurrentServer, parseReply, setupReply
} from './helpers';

declare const window: ZulipWebWindow;

// import url = require('url');
import WinRTNotifier = require('electron-windows-notifications');
import DefaultNotification = require('./default-notification');
import ConfigUtil = require('../utils/config-util');

export function notificationHandler(response: string, tag: string): void {
	response = parseReply(response);
	focusCurrentServer();
	if (window.electron_bridge.send_notification_reply_message_supported) {
		window.electron_bridge.send_event('send_notification_reply_message', tag, response);
		return;
	}
	setupReply(tag);
	customReply(response);
}

function showNotif(title: string, opts: NotificationOptions): void {
	const profilePic = "F:\\GitHub\\zulip-desktop\\app\\renderer\\img\\icon.png";
	const url = remote.getCurrentWebContents().getURL();
	// console.log(`"NotifSend&url='${url}'&tag='${opts.tag}'"`);
	const notification2 = new WinRTNotifier.ToastNotification({
		appId,
		template: `<toast launch="NotifLaunch">
				<visual>
				<binding template="ToastGeneric">
					   <text hint-maxLines="1">%s</text>
					   <image placement="appLogoOverride" hint-crop="circle" src="%s"/>
				<text>%s</text>
			</binding>
			</visual>
			<actions>
				<input id="reply" type="text" placeHolderContent="Type a reply"/>	
				<action hint-inputId="" activationType="background" content="Reply" arguments="NotifSend&amp;url=${url}&amp;tag=${opts.tag}" />
				<action activationType="background" content="Dismiss" arguments="NotifDismiss" />
			</actions>			
			</toast>`,
		strings: [title, profilePic, opts.body]
		// tag: opts.tag
	});
	notification2.show();
}

class WinRTNotification extends DefaultNotification {
	// tag: string;
	constructor(title: string, opts: NotificationOptions) {
		opts.silent = true;
		super(title, opts);
		// this.tag = opts.tag;
		opts.silent = false;
		console.log(title);
		console.log(opts);
		showNotif(title, opts);
		console.log("Created notification");
	}

	static requestPermission(): void {
		return; // eslint-disable-line no-useless-return
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}

	close(): void {
		return; // eslint-disable-line no-useless-return
	}

	// show(): void{
	// 	this.notification2.show();
	// 	return;
	// }
}

module.exports = WinRTNotification;
