'use strict';

const {
  remote: { app }
} = require('electron');

const params = require('../utils/params-util.js');
const DefaultNotification = require('./default-notification');
const { appId, loadBots } = require('./helpers');

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId(appId);

window.Notification = DefaultNotification;

if (process.platform === 'darwin') {
	const DarwinNotification = require('./darwin-notifications');
	window.Notification = DarwinNotification;
}

window.addEventListener('load', () => {
	// eslint-disable-next-line no-undef, camelcase
	if (params.isPageParams() && page_params.realm_uri) {
		loadBots();
	}
});
