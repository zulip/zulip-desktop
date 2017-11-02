'use strict';
const electron = require('electron');
const { app } = require('electron');

const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

let instance = null;

class BadgeSettings {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		return instance;
	}

	showBadgeCount(messageCount, mainWindow) {
		if (process.platform === 'darwin') {
			app.setBadgeCount(messageCount);
		}
		if (process.platform === 'win32') {
			this.updateOverlayIcon(messageCount, mainWindow);
		}
	}

	hideBadgeCount(mainWindow) {
		if (process.platform === 'darwin') {
			app.setBadgeCount(0);
		}
		if (process.platform === 'win32') {
			mainWindow.setOverlayIcon(null, '');
		}
	}

	updateBadge(badgeCount, mainWindow) {
		if (ConfigUtil.getConfigItem('badgeOption', true)) {
			this.showBadgeCount(badgeCount, mainWindow);
		} else {
			this.hideBadgeCount(mainWindow);
		}
	}

	updateOverlayIcon(messageCount, mainWindow) {
		if (!mainWindow.isFocused()) {
			mainWindow.flashFrame(ConfigUtil.getConfigItem('flashTaskbarOnMessage'));
		}
		if (messageCount === 0) {
			mainWindow.setOverlayIcon(null, '');
		} else {
			mainWindow.webContents.send('render-taskbar-icon', messageCount);
		}
	}

	updateTaskbarIcon(data, text, mainWindow) {
		const img = electron.nativeImage.createFromDataURL(data);
		mainWindow.setOverlayIcon(img, text);
	}
}

module.exports = new BadgeSettings();
