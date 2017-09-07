'use strict';

const { remote } = require('electron');

const ConfigUtil = require(__dirname + '/utils/config-util.js');

const app = remote.app;

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId('org.zulip.zulip-electron');

const NativeNotification = window.Notification;

class baseNotification extends NativeNotification {
	constructor(title, opts) {
		opts.silent = ConfigUtil.getConfigItem('silent') || false;
		// calling super without passing arguments will fail to constuct Notification
		// and will result in no notification. It's a hack (not an ideal way) for deleting the window notification
		ConfigUtil.getConfigItem('showNotification') ? super(title, opts) : super(); // eslint-disable-line no-unused-expressions
	}
}

window.Notification = baseNotification;
