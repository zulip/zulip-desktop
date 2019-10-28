'use strict';
// import { ipcRenderer } from 'electron';
import { appId } from './helpers';
// import {
// 	appId, customReply, focusCurrentServer, parseReply, setupReply
// } from './helpers';

// import url = require('url');
import WinRTNotifier = require('electron-windows-notifications');

import ConfigUtil = require('../utils/config-util');


class WinRTNotification {
	tag: string;

	constructor(title: string, opts: NotificationOptions) {
		// const silent: boolean = ConfigUtil.getConfigItem('silent') || false;
		// const { host, protocol } = location;
		// const { icon } = opts;
		// const profilePic = url.resolve(`${protocol}//${host}`, icon);
		const profilePic = "F:\\GitHub\\zulip-desktop\\app\\renderer\\img\\icon.png";
		// const notifTitle = title;
		this.tag = opts.tag;
		opts.silent = false;
		console.log('Executed');
		console.log(title);
		console.log(opts);
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
			strings: ['Sender', profilePic, 'Message']
		});
		console.log("X123");
		notification2.show();
		console.log("Created notification");
		// notification.show();
	}

	static requestPermission(): void {
		return; // eslint-disable-line no-useless-return
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}
}

module.exports = WinRTNotification;
