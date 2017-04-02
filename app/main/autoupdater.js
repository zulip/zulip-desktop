'use strict';
const {app, dialog} = require('electron');
const {autoUpdater} = require('electron-updater');

function appUpdater() {
	// Log whats happening
	const log = require('electron-log');
	log.transports.file.level = 'info';
	autoUpdater.logger = log;
	/*
	AutoUpdater.on('error', err => log.info(err));
	autoUpdater.on('checking-for-update', () => log.info('checking-for-update'));
	autoUpdater.on('update-available', () => log.info('update-available'));
	autoUpdater.on('update-not-available', () => log.info('update-not-available'));
	*/

	// Ask the user if update is available
	// eslint-disable-next-line no-unused-vars
	autoUpdater.on('update-downloaded', (event, info) => {
		// Let message = app.getName() + ' ' + info.releaseName + ' is now available. It will be installed the next time you restart the application.';
		// if (info.releaseNotes) {
			// const splitNotes = info.releaseNotes.split(/[^\r]\n/);
			// message += '\n\nRelease notes:\n';
			// splitNotes.forEach(notes => {
				// message += notes + '\n\n';
			// });
		// }
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
