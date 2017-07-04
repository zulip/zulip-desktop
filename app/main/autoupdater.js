'use strict';
const {app, dialog} = require('electron');
const {autoUpdater} = require('electron-updater');

const ConfigUtil = require('./../renderer/js/utils/config-util.js');

function appUpdater() {
	// Log whats happening
	const log = require('electron-log');
	log.transports.file.level = 'info';
	autoUpdater.logger = log;
	autoUpdater.allowPrerelease = ConfigUtil.getConfigItem('BetaUpdate');

	// Ask the user if update is available
	// eslint-disable-next-line no-unused-vars
	autoUpdater.on('update-downloaded', (event, info) => {
		// Ask user to update the app
		dialog.showMessageBox({
			type: 'question',
			buttons: ['Install and Relaunch', 'Later'],
			defaultId: 0,
			message: 'A new version of ' + app.getName() + ' has been downloaded',
			detail: 'It will be installed the next time you restart the application'
		}, response => {
			if (response === 0) {
				setTimeout(() => autoUpdater.quitAndInstall(), 1);
			}
		});
	});
	// Init for updates
	autoUpdater.checkForUpdates();
}

module.exports = {
	appUpdater
};
