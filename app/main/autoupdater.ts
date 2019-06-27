'use strict';
import { app, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { linuxUpdateNotification } from './linuxupdater';	// Required only in case of linux

import log = require('electron-log');
import isDev = require('electron-is-dev');
import ConfigUtil = require('../renderer/js/utils/config-util');

export function appUpdater(updateFromMenu = false): void {
	// Don't initiate auto-updates in development
	if (isDev) {
		return;
	}

	if (process.platform === 'linux' && !process.env.APPIMAGE) {
		linuxUpdateNotification();
		return;
	}

	let updateAvailable = false;

	// Create Logs directory
	const LogsDir = `${app.getPath('userData')}/Logs`;

	// Log whats happening
	log.transports.file.file = `${LogsDir}/updates.log`;
	log.transports.file.level = 'info';
	autoUpdater.logger = log;

	// Handle auto updates for beta/pre releases
	const isBetaUpdate = ConfigUtil.getConfigItem('betaUpdate');

	autoUpdater.allowPrerelease = isBetaUpdate || false;

	const eventsListenerRemove = ['update-available', 'update-not-available'];
	autoUpdater.on('update-available', info => {
		if (updateFromMenu) {
			dialog.showMessageBox({
				message: `A new version ${info.version}, of Zulip Desktop is available`,
				detail: 'The update will be downloaded in the background. You will be notified when it is ready to be installed.'
			});

			updateAvailable = true;

			// This is to prevent removal of 'update-downloaded' and 'error' event listener.
			eventsListenerRemove.forEach(event => {
				autoUpdater.removeAllListeners(event);
			});
		}
	});

	autoUpdater.on('update-not-available', () => {
		if (updateFromMenu) {
			dialog.showMessageBox({
				message: 'No updates available',
				detail: `You are running the latest version of Zulip Desktop.\nVersion: ${app.getVersion()}`
			});
			// Remove all autoUpdator listeners so that next time autoUpdator is manually called these
			// listeners don't trigger multiple times.
			autoUpdater.removeAllListeners();
		}
	});

	autoUpdater.on('error', error => {
		if (updateFromMenu) {
			const messageText = (updateAvailable) ? ('Unable to download the updates') : ('Unable to check for updates');
			dialog.showMessageBox({
				type: 'error',
				buttons: ['Manual Download', 'Cancel'],
				message: messageText,
				detail: (error).toString() + `\n\nThe latest version of Zulip Desktop is available at -\nhttps://zulipchat.com/apps/.\n
Current Version: ${app.getVersion()}`
			}, response => {
				if (response === 0) {
					shell.openExternal('https://zulipchat.com/apps/');
				}
			});
			// Remove all autoUpdator listeners so that next time autoUpdator is manually called these
			// listeners don't trigger multiple times.
			autoUpdater.removeAllListeners();
		}
	});

	// Ask the user if update is available
	autoUpdater.on('update-downloaded', event => {
		// Ask user to update the app
		dialog.showMessageBox({
			type: 'question',
			buttons: ['Install and Relaunch', 'Install Later'],
			defaultId: 0,
			message: `A new update ${event.version} has been downloaded`,
			detail: 'It will be installed the next time you restart the application'
		}, response => {
			if (response === 0) {
				setTimeout(() => {
					autoUpdater.quitAndInstall();
					// force app to quit. This is just a workaround, ideally autoUpdater.quitAndInstall() should relaunch the app.
					app.quit();
				}, 1000);
			}
		});
	});
	// Init for updates
	autoUpdater.checkForUpdates();
}
