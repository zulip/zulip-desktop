'use strict';
import { app } from 'electron';

import electron = require('electron');
import ConfigUtil = require('../../utils/config-util');

let instance: BadgeSettings | any = null;

class BadgeSettings {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		return instance;
	}

	showBadgeCount(messageCount: number, mainWindow: electron.BrowserWindow): void {
		if (process.platform === 'darwin') {
			app.setBadgeCount(messageCount);
		}
		if (process.platform === 'win32') {
			this.updateOverlayIcon(messageCount, mainWindow);
		}
	}

	hideBadgeCount(mainWindow: electron.BrowserWindow): void {
		if (process.platform === 'darwin') {
			app.setBadgeCount(0);
		}
		if (process.platform === 'win32') {
			mainWindow.setOverlayIcon(null, '');
		}
	}

	updateBadge(badgeCount: number, mainWindow: electron.BrowserWindow): void {
		if (ConfigUtil.getConfigItem('badgeOption', true)) {
			this.showBadgeCount(badgeCount, mainWindow);
		} else {
			this.hideBadgeCount(mainWindow);
		}
	}

	updateOverlayIcon(messageCount: number, mainWindow: electron.BrowserWindow): void {
		if (!mainWindow.isFocused()) {
			mainWindow.flashFrame(ConfigUtil.getConfigItem('flashTaskbarOnMessage'));
		}
		if (messageCount === 0) {
			mainWindow.setOverlayIcon(null, '');
		} else {
			mainWindow.webContents.send('render-taskbar-icon', messageCount);
		}
	}

	updateTaskbarIcon(data: string, text: string, mainWindow: electron.BrowserWindow): void {
		const img = electron.nativeImage.createFromDataURL(data);
		mainWindow.setOverlayIcon(img, text);
	}
}

export = new BadgeSettings();
