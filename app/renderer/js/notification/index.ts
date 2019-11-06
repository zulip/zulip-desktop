'use strict';

import { remote } from 'electron';
import * as params from '../utils/params-util';
import { appId, loadBots } from './helpers';

import DefaultNotification = require('./default-notification');
import InteractiveNotif = require('electron-windows-interactive-notifications');
const { app } = remote;

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId(appId);

window.Notification = DefaultNotification;

if (process.platform === 'win32') {
	const version = require('os').release().split('.');
	// Windows 10 and above only.
	if (version[0] >= 10) {
		const shortcutPath = 'Microsoft\\Windows\\Start Menu\\Programs\\Zulip Electron.lnk';
		InteractiveNotif.registerAppForNotificationSupport(shortcutPath, appId);
		InteractiveNotif.registerActivator();
		window.Notification = require('./winrt-notifications');
	}
}

if (process.platform === 'darwin') {
	window.Notification = require('./darwin-notifications');
}

window.addEventListener('load', () => {
	// eslint-disable-next-line no-undef, @typescript-eslint/camelcase
	if (params.isPageParams() && page_params.realm_uri) {
		loadBots();
	}
});
