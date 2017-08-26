'use strict';
const { app } = require('electron');

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
				mainWindow.webContentssend('render-taskbar-icon', messageCount);
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
}

module.exports = new BadgeSettings();
