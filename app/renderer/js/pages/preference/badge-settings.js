'use strict';
const electron = require('electron');
const { app } = require('electron');

const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class BadgeSettings {
	constructor(messageCount, mainWindow) {
		this.messageCount = messageCount;
		this.mainWindow = mainWindow;
	}

	showBadgeCount(messageCount, mainWindow) {
		if (process.platform === 'darwin') {
			app.setBadgeCount(messageCount);
		}
		if (process.platform === 'win32') {
			if (!mainWindow.isFocused()) {
				mainWindow.flashFrame(true);
			}
			if (messageCount === 0) {
				mainWindow.setOverlayIcon(null, '');
			} else {
				mainWindow.webContents.send('render-taskbar-icon', messageCount);
			}
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
		if (ConfigUtil.getConfigItem('dockOption')) {
			this.showBadgeCount(badgeCount, mainWindow);
		} else {
			this.hideBadgeCount(mainWindow);
		}
	}

	updateTaskbarIcon(data, text, mainWindow) {
		const img = electron.nativeImage.createFromDataURL(data);
		mainWindow.setOverlayIcon(img, text);
	}
}

module.exports = new BadgeSettings();
