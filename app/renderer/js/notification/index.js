'use strict';

const {
  remote: { app }
} = require('electron');

const DefaultNotification = require('./default-notification');
const { appId } = require('./helpers');

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId(appId);

window.Notification = DefaultNotification;
if (process.platform === 'darwin') {
	const DarwinNotification = require('./darwin-notifications');
	window.Notification = DarwinNotification;
}
