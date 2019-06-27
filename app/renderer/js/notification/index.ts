'use strict';

import { remote } from 'electron';
import * as params from '../utils/params-util';
import { appId, loadBots } from './helpers';

import DefaultNotification = require('./default-notification');
const { app } = remote;

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId(appId);

window.Notification = DefaultNotification;

if (process.platform === 'darwin') {
	window.Notification = require('./darwin-notifications');
}

window.addEventListener('load', () => {
	// eslint-disable-next-line no-undef, @typescript-eslint/camelcase
	if (params.isPageParams() && page_params.realm_uri) {
		loadBots();
	}
});
